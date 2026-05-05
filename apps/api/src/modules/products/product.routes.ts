import { FastifyInstance } from 'fastify'
import { createProductSchema, updateProductSchema, productFilterSchema } from '@beibeli/shared'
import * as productService from './product.service'

export async function productRoutes(app: FastifyInstance) {
  // ── POST /products — create product ─────────────────────────────────────────
  app.post('/', {
    schema: {
      summary: 'Create a new product (seller only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const body = createProductSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const product = await productService.createProduct(app, request.user.sub, body.data)
        return reply.status(201).send({ product })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── GET /products — list products with search + filter ───────────────────────
  app.get('/', {
    config: { skipAuth: true },
    schema: {
      summary: 'List products with search, filter, sort and pagination',
      tags: ['Products'],
    },
    handler: async (request, reply) => {
      const parsed = productFilterSchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(422).send({ error: 'Invalid query params', issues: parsed.error.flatten() })
      }
      const result = await productService.listProducts(app, parsed.data)
      return reply.send(result)
    },
  })

  // ── GET /products/:slug — product detail ─────────────────────────────────────
  app.get('/:slug', {
    config: { skipAuth: true },
    schema: {
      summary: 'Get product detail by slug',
      tags: ['Products'],
    },
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string }
      try {
        const product = await productService.getProductBySlug(app, slug)
        return reply.send({ product })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── PATCH /products/:id — update product ─────────────────────────────────────
  app.patch('/:id', {
    schema: {
      summary: 'Update a product (seller only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateProductSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const product = await productService.updateProduct(app, request.user.sub, id, body.data)
        return reply.send({ product })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── DELETE /products/:id — soft delete product ───────────────────────────────
  app.delete('/:id', {
    schema: {
      summary: 'Soft delete a product (seller only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await productService.deleteProduct(app, request.user.sub, id)
        return reply.status(204).send()
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── GET /products/shop/:shopSlug — list products of a shop (public) ──────────
  app.get('/shop/:shopSlug', {
    config: { skipAuth: true },
    schema: {
      summary: 'List active products of a specific shop',
      tags: ['Products'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 60, default: 20 },
        },
      },
    },
    handler: async (request, reply) => {
      const { shopSlug } = request.params as { shopSlug: string }
      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number }
      try {
        const result = await productService.listShopProducts(app, shopSlug, page, limit)
        return reply.send(result)
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })
}
