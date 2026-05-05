import { FastifyInstance } from 'fastify'
import type { CreateOrderInput } from './order.types'

function serviceError(statusCode: number, message: string, code: string) {
  return { statusCode, message, code }
}

function generateOrderNumber(): string {
  const now = new Date()
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
  return `BB-${ymd}-${rand}`
}

// ─── Create order (multi-shop checkout) ──────────────────────────────────────

export async function createOrder(app: FastifyInstance, userId: string, input: CreateOrderInput) {
  // Verify address belongs to user
  const address = await app.prisma.address.findUnique({ where: { id: input.address_id } })
  if (!address || address.user_id !== userId) throw serviceError(422, 'Shipping address not found', 'ADDRESS_NOT_FOUND')

  // Load all cart items requested
  const cartItemIds = input.items.map((i) => i.cart_item_id)
  const cartItems = await app.prisma.cartItem.findMany({
    where: { id: { in: cartItemIds } },
    include: {
      cart: true,
      variant: {
        include: {
          product: { include: { shop: true } },
        },
      },
    },
  })

  if (cartItems.length !== cartItemIds.length) throw serviceError(422, 'Some cart items were not found', 'CART_ITEMS_NOT_FOUND')

  // Verify all cart items belong to this user
  for (const item of cartItems) {
    if (item.cart.user_id !== userId) throw serviceError(403, 'Forbidden', 'FORBIDDEN')
    if (item.variant.stock < item.quantity) {
      throw serviceError(422, `Insufficient stock for "${item.variant.product.name}"`, 'INSUFFICIENT_STOCK')
    }
    if (item.variant.product.status !== 'active') {
      throw serviceError(422, `Product "${item.variant.product.name}" is no longer available`, 'PRODUCT_INACTIVE')
    }
  }

  // Group items by shop
  const shopMap = new Map<string, typeof cartItems>()
  for (const item of cartItems) {
    const shopId = item.variant.product.shop_id
    if (!shopMap.has(shopId)) shopMap.set(shopId, [])
    shopMap.get(shopId)!.push(item)
  }

  // Validate that every shop in the order has shipping info provided
  for (const shopId of shopMap.keys()) {
    if (!input.shipping.find((s) => s.shop_id === shopId)) {
      throw serviceError(422, `Missing shipping selection for shop ${shopId}`, 'MISSING_SHIPPING')
    }
  }

  // Calculate totals
  let totalProductPrice = 0
  let totalShippingCost = 0
  for (const item of cartItems) {
    totalProductPrice += Number(item.variant.price) * item.quantity
  }
  for (const s of input.shipping) {
    totalShippingCost += s.cost
  }

  // Handle voucher
  let voucherDiscount = 0
  let voucherId: string | null = null
  if (input.voucher_code) {
    const voucher = await app.prisma.voucher.findUnique({
      where: { code: input.voucher_code },
    })
    const now = new Date()
    if (
      voucher &&
      voucher.is_active &&
      voucher.valid_from <= now &&
      voucher.valid_until >= now &&
      voucher.used_count < voucher.usage_limit &&
      totalProductPrice >= Number(voucher.min_purchase)
    ) {
      if (voucher.type === 'fixed') {
        voucherDiscount = Math.min(Number(voucher.value), totalProductPrice)
      } else {
        const computed = (totalProductPrice * Number(voucher.value)) / 100
        voucherDiscount = voucher.max_discount
          ? Math.min(computed, Number(voucher.max_discount))
          : computed
      }
      voucherId = voucher.id
    }
  }

  const grandTotal = totalProductPrice + totalShippingCost - voucherDiscount
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h payment window

  // Create everything in a single transaction
  const order = await app.prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        order_number: generateOrderNumber(),
        buyer_id: userId,
        shipping_address_id: input.address_id,
        total_product_price: totalProductPrice,
        total_shipping_cost: totalShippingCost,
        total_voucher_discount: voucherDiscount,
        grand_total: grandTotal,
        notes: input.notes ?? null,
        expires_at: expiresAt,
      },
    })

    // Create order_shop + order_items per shop
    for (const [shopId, items] of shopMap.entries()) {
      const shippingInfo = input.shipping.find((s) => s.shop_id === shopId)!

      const orderShop = await tx.orderShop.create({
        data: {
          order_id: newOrder.id,
          shop_id: shopId,
          courier_name: shippingInfo.courier,
          courier_service: shippingInfo.service,
          shipping_cost: shippingInfo.cost,
        },
      })

      for (const item of items) {
        const product = item.variant.product
        await tx.orderItem.create({
          data: {
            order_shop_id: orderShop.id,
            product_variant_id: item.variant.id,
            product_snapshot: {
              name: product.name,
              image_url: null, // populated by product images separately if needed
              variant_name: item.variant.variant_name,
              shop_name: product.shop.name,
              sku: item.variant.sku,
            },
            quantity: item.quantity,
            unit_price: item.variant.price,
            subtotal: Number(item.variant.price) * item.quantity,
          },
        })

        // Decrement stock
        await tx.productVariant.update({
          where: { id: item.variant.id },
          data: { stock: { decrement: item.quantity } },
        })
      }
    }

    // Apply voucher increment
    if (voucherId) {
      await tx.voucher.update({ where: { id: voucherId }, data: { used_count: { increment: 1 } } })
      await tx.orderVoucher.create({
        data: { order_id: newOrder.id, voucher_id: voucherId, discount_amount: voucherDiscount },
      })
    }

    // Clear purchased cart items
    await tx.cartItem.deleteMany({ where: { id: { in: cartItemIds } } })

    return newOrder
  })

  return app.prisma.order.findUnique({
    where: { id: order.id },
    include: { order_shops: { include: { items: true } } },
  })
}

// ─── List buyer orders ────────────────────────────────────────────────────────

export async function listMyOrders(
  app: FastifyInstance,
  userId: string,
  page: number,
  limit: number,
  status?: string,
) {
  const skip = (page - 1) * limit
  const where = {
    buyer_id: userId,
    ...(status ? { order_shops: { some: { status: status as never } } } : {}),
  }

  const [orders, total] = await app.prisma.$transaction([
    app.prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        order_shops: {
          include: {
            shop: { select: { id: true, name: true, slug: true, logo_url: true } },
            items: { take: 1, include: { variant: { include: { product: { select: { name: true } } } } } },
          },
        },
      },
    }),
    app.prisma.order.count({ where }),
  ])

  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

// ─── Get order detail ─────────────────────────────────────────────────────────

export async function getOrderDetail(app: FastifyInstance, userId: string, orderId: string) {
  const order = await app.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shipping_address: true,
      order_shops: {
        include: {
          shop: { select: { id: true, name: true, slug: true, logo_url: true } },
          items: true,
          status_logs: { orderBy: { created_at: 'asc' } },
        },
      },
      payment: true,
    },
  })
  if (!order) throw serviceError(404, 'Order not found', 'ORDER_NOT_FOUND')
  if (order.buyer_id !== userId) throw serviceError(403, 'Forbidden', 'FORBIDDEN')
  return order
}

// ─── Cancel order (buyer, only if all sub-orders are still pending) ───────────

export async function cancelOrder(app: FastifyInstance, userId: string, orderId: string) {
  const order = await app.prisma.order.findUnique({
    where: { id: orderId },
    include: { order_shops: true },
  })
  if (!order) throw serviceError(404, 'Order not found', 'ORDER_NOT_FOUND')
  if (order.buyer_id !== userId) throw serviceError(403, 'Forbidden', 'FORBIDDEN')

  const allPending = order.order_shops.every((os) => os.status === 'pending')
  if (!allPending) throw serviceError(409, 'Order cannot be cancelled once it is being processed', 'CANCEL_NOT_ALLOWED')

  await app.prisma.$transaction(async (tx) => {
    // Restore stock
    const items = await tx.orderItem.findMany({
      where: { order_shop: { order_id: orderId } },
    })
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.product_variant_id },
        data: { stock: { increment: item.quantity } },
      })
    }

    // Update all sub-order statuses
    await tx.orderShop.updateMany({
      where: { order_id: orderId },
      data: { status: 'cancelled' },
    })
  })
}

// ─── Confirm received (buyer confirms delivery) ───────────────────────────────

export async function confirmReceived(app: FastifyInstance, userId: string, orderId: string) {
  const order = await app.prisma.order.findUnique({
    where: { id: orderId },
    include: { order_shops: true },
  })
  if (!order) throw serviceError(404, 'Order not found', 'ORDER_NOT_FOUND')
  if (order.buyer_id !== userId) throw serviceError(403, 'Forbidden', 'FORBIDDEN')

  const allDelivered = order.order_shops.every((os) => os.status === 'delivered')
  if (!allDelivered) throw serviceError(409, 'All items must be delivered before confirming receipt', 'NOT_ALL_DELIVERED')

  await app.prisma.orderShop.updateMany({
    where: { order_id: orderId },
    data: { status: 'completed' },
  })
}
