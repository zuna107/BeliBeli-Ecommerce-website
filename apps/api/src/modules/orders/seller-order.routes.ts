import { FastifyInstance } from 'fastify'
import { updateOrderStatusSchema } from '@beibeli/shared'

export async function sellerOrderRoutes(app: FastifyInstance) {
  // ── GET /seller/orders — list incoming orders for seller's shop ───────────────
  app.get('/', {
    schema: {
      summary: 'List incoming orders for seller shop',
      tags: ['Seller — Orders'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
          },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub
      const { page = 1, limit = 10, status } = request.query as { page?: number; limit?: number; status?: string }

      const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
      if (!shop) return reply.status(403).send({ error: 'You do not have a shop', code: 'SHOP_REQUIRED' })

      const skip = (page - 1) * limit
      const where = {
        shop_id: shop.id,
        ...(status ? { status: status as never } : {}),
      }

      const [orderShops, total] = await app.prisma.$transaction([
        app.prisma.orderShop.findMany({
          where,
          skip,
          take: limit,
          orderBy: { order: { created_at: 'desc' } },
          include: {
            order: {
              include: {
                buyer: { select: { id: true, name: true, avatar_url: true } },
                shipping_address: true,
              },
            },
            items: true,
          },
        }),
        app.prisma.orderShop.count({ where }),
      ])

      return reply.send({
        orders: orderShops,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    },
  })

  // ── GET /seller/orders/:id — detail of a single sub-order ────────────────────
  app.get('/:id', {
    schema: {
      summary: 'Get detail of a single sub-order (seller view)',
      tags: ['Seller — Orders'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = request.user.sub

      const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
      if (!shop) return reply.status(403).send({ error: 'You do not have a shop', code: 'SHOP_REQUIRED' })

      const orderShop = await app.prisma.orderShop.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              buyer: { select: { id: true, name: true, avatar_url: true, phone: true } },
              shipping_address: true,
            },
          },
          items: true,
          status_logs: { orderBy: { created_at: 'asc' } },
        },
      })

      if (!orderShop) return reply.status(404).send({ error: 'Order not found', code: 'ORDER_NOT_FOUND' })
      if (orderShop.shop_id !== shop.id) return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' })

      return reply.send({ order: orderShop })
    },
  })

  // ── PATCH /seller/orders/:id/status — update sub-order status + tracking ──────
  app.patch('/:id/status', {
    schema: {
      summary: 'Update sub-order status (seller)',
      tags: ['Seller — Orders'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const userId = request.user.sub

      const body = updateOrderStatusSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }

      const shop = await app.prisma.shop.findUnique({ where: { owner_id: userId } })
      if (!shop) return reply.status(403).send({ error: 'You do not have a shop', code: 'SHOP_REQUIRED' })

      const orderShop = await app.prisma.orderShop.findUnique({ where: { id } })
      if (!orderShop) return reply.status(404).send({ error: 'Order not found', code: 'ORDER_NOT_FOUND' })
      if (orderShop.shop_id !== shop.id) return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' })

      // Validate allowed transitions
      const allowed: Record<string, string[]> = {
        pending: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        completed: [],
        cancelled: [],
      }
      if (!allowed[orderShop.status]?.includes(body.data.status)) {
        return reply.status(409).send({
          error: `Cannot transition from "${orderShop.status}" to "${body.data.status}"`,
          code: 'INVALID_STATUS_TRANSITION',
        })
      }

      const data: Record<string, unknown> = { status: body.data.status }
      if (body.data.tracking_number) data['tracking_number'] = body.data.tracking_number
      if (body.data.courier_name) data['courier_name'] = body.data.courier_name

      const updated = await app.prisma.$transaction(async (tx) => {
        const os = await tx.orderShop.update({
          where: { id },
          data: data as Parameters<typeof tx.orderShop.update>[0]['data'],
        })
        await tx.orderStatusLog.create({
          data: {
            order_shop_id: id,
            status: body.data.status as never,
            note: body.data.tracking_number ? `Tracking: ${body.data.tracking_number}` : null,
          },
        })
        return os
      })

      return reply.send({ order: updated })
    },
  })
}
