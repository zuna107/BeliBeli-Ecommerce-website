import { FastifyInstance } from 'fastify'
import { createOrderSchema } from '@beibeli/shared'
import * as orderService from './order.service'

export async function orderRoutes(app: FastifyInstance) {
  // ── POST /orders — create order (checkout) ────────────────────────────────────
  app.post('/', {
    schema: {
      summary: 'Create an order (checkout from cart)',
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const body = createOrderSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const order = await orderService.createOrder(app, request.user.sub, body.data)
        return reply.status(201).send({ order })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── GET /orders — list my orders ──────────────────────────────────────────────
  app.get('/', {
    schema: {
      summary: 'List current user orders',
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'] },
        },
      },
    },
    handler: async (request, reply) => {
      const { page = 1, limit = 10, status } = request.query as { page?: number; limit?: number; status?: string }
      const result = await orderService.listMyOrders(app, request.user.sub, page, limit, status)
      return reply.send(result)
    },
  })

  // ── GET /orders/:id — order detail ────────────────────────────────────────────
  app.get('/:id', {
    schema: {
      summary: 'Get order detail',
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        const order = await orderService.getOrderDetail(app, request.user.sub, id)
        return reply.send({ order })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── POST /orders/:id/cancel — buyer cancels order ─────────────────────────────
  app.post('/:id/cancel', {
    schema: {
      summary: 'Cancel an order (buyer, only while still pending)',
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await orderService.cancelOrder(app, request.user.sub, id)
        return reply.send({ message: 'Order cancelled successfully' })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── POST /orders/:id/confirm-received — buyer confirms delivery ───────────────
  app.post('/:id/confirm-received', {
    schema: {
      summary: 'Confirm all items received (buyer)',
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await orderService.confirmReceived(app, request.user.sub, id)
        return reply.send({ message: 'Order marked as completed' })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })
}
