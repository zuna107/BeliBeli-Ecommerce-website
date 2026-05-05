import { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import type { CreateShopInput, UpdateShopInput } from '@beibeli/shared'
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@beibeli/shared'

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

// ─── Create shop ─────────────────────────────────────────────────────────────

export async function createShop(app: FastifyInstance, userId: string, input: CreateShopInput) {
  const existing = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
  if (existing) throw serviceError(409, 'You already have a shop', 'SHOP_ALREADY_EXISTS')

  // Update user role to seller
  await app.prisma.user.update({ where: { id: userId }, data: { role: 'seller' } })

  const slug = slugify(input.name)

  // Ensure slug uniqueness
  const slugConflict = await app.prisma.shop.findUnique({ where: { slug } })
  const finalSlug = slugConflict ? `${slug}-${crypto.randomBytes(3).toString('hex')}` : slug

  return app.prisma.shop.create({
    data: {
      owner_id: userId,
      slug: finalSlug,
      name: input.name,
      city: input.city,
      komerce_city_id: input.komerce_city_id,
      description: input.description ?? null,
    },
  })
}

// ─── Get own shop ─────────────────────────────────────────────────────────────

export async function getMyShop(app: FastifyInstance, userId: string) {
  const shop = await app.prisma.shop.findUnique({
    where: { owner_id: userId },
    include: { _count: { select: { products: true, followers: true } } },
  })
  if (!shop) throw serviceError(404, 'You do not have a shop yet', 'SHOP_NOT_FOUND')
  return shop
}

// ─── Get shop by slug (public) ───────────────────────────────────────────────

export async function getShopBySlug(app: FastifyInstance, slug: string) {
  const shop = await app.prisma.shop.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, avatar_url: true } },
      _count: { select: { products: true, followers: true } },
    },
  })
  if (!shop) throw serviceError(404, 'Shop not found', 'SHOP_NOT_FOUND')
  if (shop.status !== 'active') throw serviceError(404, 'Shop not found', 'SHOP_NOT_FOUND')
  return shop
}

// ─── Update shop ─────────────────────────────────────────────────────────────

export async function updateShop(app: FastifyInstance, userId: string, input: UpdateShopInput) {
  const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
  if (!shop) throw serviceError(404, 'Shop not found', 'SHOP_NOT_FOUND')

  const data: Record<string, unknown> = {}
  if (input.name !== undefined) {
    // Check name uniqueness if changing
    if (input.name !== shop.name) {
      const conflict = await app.prisma.shop.findUnique({ where: { name: input.name } })
      if (conflict) throw serviceError(409, 'Shop name already taken', 'SHOP_NAME_TAKEN')
    }
    data['name'] = input.name
  }
  if (input.description !== undefined) data['description'] = input.description
  if (input.city !== undefined) data['city'] = input.city
  if (input.komerce_city_id !== undefined) data['komerce_city_id'] = input.komerce_city_id

  return app.prisma.shop.update({ where: { owner_id: userId }, data })
}

// ─── Upload shop logo / banner ───────────────────────────────────────────────

async function uploadShopImage(
  app: FastifyInstance,
  userId: string,
  field: 'logo_url' | 'banner_url',
  subdir: string,
  fileStream: NodeJS.ReadableStream,
  mimetype: string,
  filename: string,
) {
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimetype)) {
    throw serviceError(422, `Unsupported file type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`, 'INVALID_FILE_TYPE')
  }

  const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
  if (!shop) throw serviceError(404, 'Shop not found', 'SHOP_NOT_FOUND')

  const ext = path.extname(filename) || '.jpg'
  const newFilename = `${subdir}-${shop.id}-${crypto.randomBytes(8).toString('hex')}${ext}`
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'shops')
  await fs.mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, newFilename)

  let totalSize = 0
  const chunks: Buffer[] = []
  for await (const chunk of fileStream as AsyncIterable<Buffer>) {
    totalSize += chunk.length
    if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
      throw serviceError(413, `File exceeds the ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB limit`, 'FILE_TOO_LARGE')
    }
    chunks.push(chunk)
  }
  await fs.writeFile(filePath, Buffer.concat(chunks))

  const url = `/uploads/shops/${newFilename}`

  // Delete old file if local
  const oldUrl = shop[field]
  if (oldUrl?.startsWith('/uploads/')) {
    await fs.unlink(path.resolve(process.cwd(), oldUrl.slice(1))).catch(() => null)
  }

  return app.prisma.shop.update({ where: { owner_id: userId }, data: { [field]: url } })
}

export function uploadLogo(
  app: FastifyInstance,
  userId: string,
  fileStream: NodeJS.ReadableStream,
  mimetype: string,
  filename: string,
) {
  return uploadShopImage(app, userId, 'logo_url', 'logo', fileStream, mimetype, filename)
}

export function uploadBanner(
  app: FastifyInstance,
  userId: string,
  fileStream: NodeJS.ReadableStream,
  mimetype: string,
  filename: string,
) {
  return uploadShopImage(app, userId, 'banner_url', 'banner', fileStream, mimetype, filename)
}
