import { FastifyInstance } from 'fastify'

// ─── Get or create cart (always returns cart with items) ──────────────────────

export async function getOrCreateCart(app: FastifyInstance, userId: string) {
  let cart = await app.prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { where: { is_primary: true }, take: 1 },
                  shop: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
        orderBy: { added_at: 'asc' },
      },
    },
  })
  if (!cart) {
    cart = await app.prisma.cart.create({
      data: { user_id: userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { is_primary: true }, take: 1 },
                    shop: { select: { id: true, name: true, slug: true } },
                  },
                },
              },
            },
          },
          orderBy: { added_at: 'asc' },
        },
      },
    })
  }
  return cart
}

// ─── Add item to cart (or increment qty if already present) ──────────────────

export async function addCartItem(
  app: FastifyInstance,
  userId: string,
  variantId: string,
  quantity: number,
) {
  const variant = await app.prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { status: true, shop: { select: { status: true } } } } },
  })
  if (!variant) throw { statusCode: 404, message: 'Product variant not found', code: 'VARIANT_NOT_FOUND' }
  if (!variant.is_active) throw { statusCode: 422, message: 'This variant is no longer available', code: 'VARIANT_INACTIVE' }
  if (variant.product.status !== 'active') throw { statusCode: 422, message: 'This product is no longer available', code: 'PRODUCT_INACTIVE' }
  if (variant.product.shop.status !== 'active') throw { statusCode: 422, message: 'This shop is no longer active', code: 'SHOP_INACTIVE' }
  if (variant.stock < quantity) throw { statusCode: 422, message: `Only ${variant.stock} units available`, code: 'INSUFFICIENT_STOCK' }

  const cart = await app.prisma.cart.upsert({
    where: { user_id: userId },
    create: { user_id: userId },
    update: {},
  })

  // Upsert the cart item
  const existing = await app.prisma.cartItem.findUnique({
    where: { cart_id_product_variant_id: { cart_id: cart.id, product_variant_id: variantId } },
  })

  if (existing) {
    const newQty = existing.quantity + quantity
    if (variant.stock < newQty) throw { statusCode: 422, message: `Only ${variant.stock} units available`, code: 'INSUFFICIENT_STOCK' }
    return app.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    })
  }

  return app.prisma.cartItem.create({
    data: { cart_id: cart.id, product_variant_id: variantId, quantity },
  })
}

// ─── Update cart item quantity ────────────────────────────────────────────────

export async function updateCartItem(
  app: FastifyInstance,
  userId: string,
  itemId: string,
  quantity: number,
) {
  const item = await app.prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  })
  if (!item) throw { statusCode: 404, message: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' }
  if (item.cart.user_id !== userId) throw { statusCode: 403, message: 'Forbidden', code: 'FORBIDDEN' }
  if (item.variant.stock < quantity) throw { statusCode: 422, message: `Only ${item.variant.stock} units available`, code: 'INSUFFICIENT_STOCK' }

  return app.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
}

// ─── Remove item from cart ────────────────────────────────────────────────────

export async function removeCartItem(app: FastifyInstance, userId: string, itemId: string) {
  const item = await app.prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })
  if (!item) throw { statusCode: 404, message: 'Cart item not found', code: 'CART_ITEM_NOT_FOUND' }
  if (item.cart.user_id !== userId) throw { statusCode: 403, message: 'Forbidden', code: 'FORBIDDEN' }

  await app.prisma.cartItem.delete({ where: { id: itemId } })
}

// ─── Clear entire cart ────────────────────────────────────────────────────────

export async function clearCart(app: FastifyInstance, userId: string) {
  const cart = await app.prisma.cart.findUnique({ where: { user_id: userId } })
  if (cart) {
    await app.prisma.cartItem.deleteMany({ where: { cart_id: cart.id } })
  }
}
