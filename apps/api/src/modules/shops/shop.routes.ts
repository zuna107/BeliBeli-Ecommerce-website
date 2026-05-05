import { FastifyInstance } from 'fastify'
import { createShopSchema, updateShopSchema } from '@beibeli/shared'
import * as shopService from './shop.service'

export async function shopRoutes(app: FastifyInstance) {
  // ── POST /shops — create a shop ─────────────────────────────────────────────
  app.post('/', {
    schema: {
      summary: 'Create a shop (current user becomes seller)',
      tags: ['Shops'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const user = request.user
      const body = createShopSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const shop = await shopService.createShop(app, user.sub, body.data)
        return reply.status(201).send({ shop })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── GET /shops/me — own shop info ───────────────────────────────────────────
  app.get('/me', {
    schema: {
      summary: 'Get own shop',
      tags: ['Shops'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const shop = await shopService.getMyShop(app, request.user.sub)
        return reply.send({ shop })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── PATCH /shops/me — update own shop ────────────────────────────────────────
  app.patch('/me', {
    schema: {
      summary: 'Update own shop info',
      tags: ['Shops'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const body = updateShopSchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      try {
        const shop = await shopService.updateShop(app, request.user.sub, body.data)
        return reply.send({ shop })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── POST /shops/me/logo — upload shop logo ───────────────────────────────────
  app.post('/me/logo', {
    schema: {
      summary: 'Upload shop logo',
      tags: ['Shops'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
    handler: async (request, reply) => {
      const file = await request.file()
      if (!file) return reply.status(400).send({ error: 'No file provided', code: 'NO_FILE' })
      try {
        const shop = await shopService.uploadLogo(app, request.user.sub, file.file, file.mimetype, file.filename)
        return reply.send({ shop })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── POST /shops/me/banner — upload shop banner ───────────────────────────────
  app.post('/me/banner', {
    schema: {
      summary: 'Upload shop banner',
      tags: ['Shops'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
    handler: async (request, reply) => {
      const file = await request.file()
      if (!file) return reply.status(400).send({ error: 'No file provided', code: 'NO_FILE' })
      try {
        const shop = await shopService.uploadBanner(app, request.user.sub, file.file, file.mimetype, file.filename)
        return reply.send({ shop })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })

  // ── GET /shops/:slug — public shop profile ────────────────────────────────────
  app.get('/:slug', {
    config: { skipAuth: true },
    schema: {
      summary: 'Get shop public profile by slug',
      tags: ['Shops'],
    },
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string }
      try {
        const shop = await shopService.getShopBySlug(app, slug)
        return reply.send({ shop })
      } catch (err: any) {
        if (err?.code) return reply.status(err.statusCode).send({ error: err.message, code: err.code })
        throw err
      }
    },
  })
}
