import { FastifyInstance } from 'fastify'

export async function categoryRoutes(app: FastifyInstance) {
  // ── GET /categories — list all categories (tree) ─────────────────────────────
  app.get('/', {
    config: { skipAuth: true },
    schema: {
      summary: 'List all categories with children',
      tags: ['Categories'],
      querystring: {
        type: 'object',
        properties: {
          flat: { type: 'boolean', description: 'Return flat list instead of tree' },
        },
      },
    },
    handler: async (request, reply) => {
      const { flat } = request.query as { flat?: boolean }

      if (flat) {
        const categories = await app.prisma.category.findMany({
          orderBy: { name: 'asc' },
        })
        return reply.send({ categories })
      }

      // Return root categories with children nested
      const categories = await app.prisma.category.findMany({
        where: { parent_id: null },
        orderBy: { name: 'asc' },
        include: {
          children: {
            orderBy: { name: 'asc' },
            include: {
              children: { orderBy: { name: 'asc' } },
            },
          },
        },
      })
      return reply.send({ categories })
    },
  })

  // ── GET /categories/:slug — single category + direct children ────────────────
  app.get('/:slug', {
    config: { skipAuth: true },
    schema: {
      summary: 'Get a single category by slug',
      tags: ['Categories'],
    },
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const category = await app.prisma.category.findUnique({
        where: { slug },
        include: {
          parent: true,
          children: { orderBy: { name: 'asc' } },
        },
      })
      if (!category) return reply.status(404).send({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' })
      return reply.send({ category })
    },
  })
}
