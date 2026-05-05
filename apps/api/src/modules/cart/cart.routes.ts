import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as cartService from './cart.service'

const addItemSchema = z.object({
  variant_id: z.string().uuid('Invalid variant'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

const updateItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export async function cartRoutes(app: FastifyInstance) {
  // ── GET /cart ─────────────────────────────────────────────────────────────────
  app.get('/', {
    schema: {
      summary: 'Get current user cart (creates if not exists)',
      tags: ['Cart'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const cart = await cartService.getOrCreateCart(app, request.user.sub)
      return reply.send({ cart })
    },
  })

  // ── POST /cart/items ──────────────────────────────────────────────────────────
  app.post('/items', {
    schema: {
      summary: 'Add an item to cart (increments qty if already present)',
      tags: ['Cart'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const body = addItemSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const item = await cartService.addCartItem(app, request.user.sub, body.data.variant_id, body.data.quantity)
        return reply.status(201).send({ item })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── PATCH /cart/items/:id ─────────────────────────────────────────────────────
  app.patch('/items/:id', {
    schema: {
      summary: 'Update cart item quantity',
      tags: ['Cart'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateItemSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const item = await cartService.updateCartItem(app, request.user.sub, id, body.data.quantity)
        return reply.send({ item })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── DELETE /cart/items/:id ────────────────────────────────────────────────────
  app.delete('/items/:id', {
    schema: {
      summary: 'Remove a single item from cart',
      tags: ['Cart'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await cartService.removeCartItem(app, request.user.sub, id)
        return reply.status(204).send()
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── DELETE /cart ──────────────────────────────────────────────────────────────
  app.delete('/', {
    schema: {
      summary: 'Clear all items from cart',
      tags: ['Cart'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      await cartService.clearCart(app, request.user.sub)
      return reply.status(204).send()
    },
  })
}
