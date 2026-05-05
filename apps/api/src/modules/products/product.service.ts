import { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import type { CreateProductInput, UpdateProductInput, ProductFilterInput } from '@beibeli/shared'

function serviceError(statusCode: number, message: string, code: string) {
  return { statusCode, message, code }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Create product ───────────────────────────────────────────────────────────

export async function createProduct(app: FastifyInstance, userId: string, input: CreateProductInput) {
  const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
  if (!shop) throw serviceError(403, 'You must have a shop to add products', 'SHOP_REQUIRED')
  if (shop.status !== 'active') throw serviceError(403, 'Your shop is not active', 'SHOP_INACTIVE')

  const category = await app.prisma.category.findUnique({ where: { id: input.category_id } })
  if (!category) throw serviceError(422, 'Category not found', 'CATEGORY_NOT_FOUND')

  const baseSlug = slugify(input.name)
  const slug = `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`

  // Derive base_price from lowest variant price
  const basePrice = Math.min(...input.variants.map((v) => v.price))

  const product = await app.prisma.product.create({
    data: {
      shop_id: shop.id,
      category_id: input.category_id,
      name: input.name,
      slug,
      description: input.description,
      base_price: basePrice,
      weight_gram: input.weight_gram,
      condition: input.condition,
      min_order: input.min_order,
      images: {
        create: input.image_urls.map((url, i) => ({
          url,
          is_primary: i === 0,
          order: i,
        })),
      },
      variants: {
        create: input.variants.map((v) => ({
          variant_name: v.name,
          price: v.price,
          stock: v.stock,
          sku: v.sku ?? null,
          image_url: null,
        })),
      },
    },
    include: { images: true, variants: true, category: true },
  })

  return product
}

// ─── List products (search + filter + pagination) ─────────────────────────────

export async function listProducts(app: FastifyInstance, filter: ProductFilterInput) {
  const { q, category_id, min_price, max_price, condition, sort, page, limit } = filter
  const skip = (page - 1) * limit

  type PrismaWhere = NonNullable<Parameters<typeof app.prisma.product.findMany>[0]>['where'] & {}
  const where: PrismaWhere = { status: 'active' }

  if (category_id) where.category_id = category_id
  if (condition) where.condition = condition
  if (min_price !== undefined || max_price !== undefined) {
    const priceFilter: { gte?: number; lte?: number } = {}
    if (min_price !== undefined) priceFilter.gte = min_price
    if (max_price !== undefined) priceFilter.lte = max_price
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(where as any).base_price = priceFilter
  }
  if (q?.trim()) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  const orderBy = buildOrderBy(sort)

  const [items, total] = await app.prisma.$transaction([
    app.prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        images: { where: { is_primary: true }, take: 1 },
        shop: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { variants: true } },
      },
    }),
    app.prisma.product.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

function buildOrderBy(sort: ProductFilterInput['sort']) {
  switch (sort) {
    case 'newest':
      return { created_at: 'desc' as const }
    case 'price_asc':
      return { base_price: 'asc' as const }
    case 'price_desc':
      return { base_price: 'desc' as const }
    case 'sold':
      return { total_sold: 'desc' as const }
    default:
      return { created_at: 'desc' as const }
  }
}

// ─── Get product by slug (public) ─────────────────────────────────────────────

export async function getProductBySlug(app: FastifyInstance, slug: string) {
  const product = await app.prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: 'asc' } },
      variants: { where: { is_active: true }, orderBy: { price: 'asc' } },
      shop: { select: { id: true, name: true, slug: true, city: true, logo_url: true } },
      category: true,
    },
  })
  if (!product) throw serviceError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  if (product.status === 'deleted') throw serviceError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  return product
}

// ─── Update product ───────────────────────────────────────────────────────────

export async function updateProduct(app: FastifyInstance, userId: string, productId: string, input: UpdateProductInput) {
  const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
  if (!shop) throw serviceError(403, 'Shop not found', 'SHOP_REQUIRED')

  const product = await app.prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw serviceError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  if (product.shop_id !== shop.id) throw serviceError(403, 'You do not own this product', 'FORBIDDEN')

  const scalarData: Record<string, unknown> = {}
  if (input.name !== undefined) {
    scalarData['name'] = input.name
    scalarData['slug'] = `${slugify(input.name)}-${crypto.randomBytes(4).toString('hex')}`
  }
  if (input.description !== undefined) scalarData['description'] = input.description
  if (input.category_id !== undefined) {
    const cat = await app.prisma.category.findUnique({ where: { id: input.category_id } })
    if (!cat) throw serviceError(422, 'Category not found', 'CATEGORY_NOT_FOUND')
    scalarData['category_id'] = input.category_id
  }
  if (input.condition !== undefined) scalarData['condition'] = input.condition
  if (input.weight_gram !== undefined) scalarData['weight_gram'] = input.weight_gram
  if (input.min_order !== undefined) scalarData['min_order'] = input.min_order

  if (input.variants !== undefined) {
    const basePrice = Math.min(...input.variants.map((v) => v.price))
    scalarData['base_price'] = basePrice
  }

  // Run all writes in a transaction
  const [updated] = await app.prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id: productId },
      data: scalarData as Parameters<typeof tx.product.update>[0]['data'],
    })

    if (input.variants !== undefined) {
      await tx.productVariant.deleteMany({ where: { product_id: productId } })
      await tx.productVariant.createMany({
        data: input.variants.map((v) => ({
          product_id: productId,
          variant_name: v.name,
          price: v.price,
          stock: v.stock,
          sku: v.sku ?? null,
        })),
      })
    }

    if (input.image_urls !== undefined) {
      await tx.productImage.deleteMany({ where: { product_id: productId } })
      await tx.productImage.createMany({
        data: input.image_urls.map((url, i) => ({
          product_id: productId,
          url,
          is_primary: i === 0,
          order: i,
        })),
      })
    }

    return [p]
  })

  return app.prisma.product.findUnique({
    where: { id: productId },
    include: { images: true, variants: true },
  })
}

// ─── Soft delete product ──────────────────────────────────────────────────────

export async function deleteProduct(app: FastifyInstance, userId: string, productId: string) {
  const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
  if (!shop) throw serviceError(403, 'Shop not found', 'SHOP_REQUIRED')

  const product = await app.prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw serviceError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  if (product.shop_id !== shop.id) throw serviceError(403, 'You do not own this product', 'FORBIDDEN')
  if (product.status === 'deleted') throw serviceError(404, 'Product not found', 'PRODUCT_NOT_FOUND')

  await app.prisma.product.update({ where: { id: productId }, data: { status: 'deleted' } })
}

// ─── List shop products (public) ──────────────────────────────────────────────

export async function listShopProducts(
  app: FastifyInstance,
  shopSlug: string,
  page: number,
  limit: number,
) {
  const shop = await app.prisma.shop.findUnique({ where: { slug: shopSlug } })
  if (!shop) throw serviceError(404, 'Shop not found', 'SHOP_NOT_FOUND')
  if (shop.status !== 'active') throw serviceError(404, 'Shop not found', 'SHOP_NOT_FOUND')

  const skip = (page - 1) * limit
  const [items, total] = await app.prisma.$transaction([
    app.prisma.product.findMany({
      where: { shop_id: shop.id, status: 'active' },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { images: { where: { is_primary: true }, take: 1 } },
    }),
    app.prisma.product.count({ where: { shop_id: shop.id, status: 'active' } }),
  ])

  return { shop, items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
