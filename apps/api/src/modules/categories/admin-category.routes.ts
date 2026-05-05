import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '../../plugins/require-admin'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  parent_id: z.string().uuid().nullable().optional(),
  icon_url: z.string().url().nullable().optional(),
  level: z.number().int().min(0).optional(),
})

const updateCategorySchema = createCategorySchema.partial()

export async function adminCategoryRoutes(app: FastifyInstance) {
  // Apply admin guard to all routes in this sub-router
  await app.register(requireAdmin)

  // ── POST /admin/categories ────────────────────────────────────────────────────
  app.post('/', {
    schema: {
      summary: 'Create a category (admin only)',
      tags: ['Admin — Categories'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const body = createCategorySchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }
      const { name, slug, parent_id, icon_url, level } = body.data

      // Check slug uniqueness
      const conflict = await app.prisma.category.findUnique({ where: { slug } })
      if (conflict) return reply.status(409).send({ error: 'Slug already in use', code: 'SLUG_TAKEN' })

      // Derive level from parent if not provided
      let resolvedLevel = level ?? 0
      if (parent_id) {
        const parent = await app.prisma.category.findUnique({ where: { id: parent_id } })
        if (!parent) return reply.status(422).send({ error: 'Parent category not found', code: 'PARENT_NOT_FOUND' })
        resolvedLevel = parent.level + 1
      }

      const category = await app.prisma.category.create({
        data: {
          name,
          slug,
          parent_id: parent_id ?? null,
          icon_url: icon_url ?? null,
          level: resolvedLevel,
        },
      })
      return reply.status(201).send({ category })
    },
  })

  // ── PATCH /admin/categories/:id ───────────────────────────────────────────────
  app.patch('/:id', {
    schema: {
      summary: 'Update a category (admin only)',
      tags: ['Admin — Categories'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateCategorySchema.safeParse(request.body)
      if (!body.success) {
        return reply.status(422).send({ error: 'Validation error', issues: body.error.flatten() })
      }

      const existing = await app.prisma.category.findUnique({ where: { id } })
      if (!existing) return reply.status(404).send({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' })

      const data: Record<string, unknown> = {}
      if (body.data.name !== undefined) data['name'] = body.data.name
      if (body.data.slug !== undefined) {
        const conflict = await app.prisma.category.findFirst({ where: { slug: body.data.slug, NOT: { id } } })
        if (conflict) return reply.status(409).send({ error: 'Slug already in use', code: 'SLUG_TAKEN' })
        data['slug'] = body.data.slug
      }
      if (body.data.icon_url !== undefined) data['icon_url'] = body.data.icon_url ?? null
      if (body.data.parent_id !== undefined) {
        if (body.data.parent_id !== null) {
          const parent = await app.prisma.category.findUnique({ where: { id: body.data.parent_id } })
          if (!parent) return reply.status(422).send({ error: 'Parent category not found', code: 'PARENT_NOT_FOUND' })
          // Prevent circular reference
          if (body.data.parent_id === id) return reply.status(422).send({ error: 'Category cannot be its own parent', code: 'CIRCULAR_PARENT' })
          data['parent_id'] = body.data.parent_id
          data['level'] = parent.level + 1
        } else {
          data['parent_id'] = null
          data['level'] = 0
        }
      }
      if (body.data.level !== undefined && body.data.parent_id === undefined) data['level'] = body.data.level

      const category = await app.prisma.category.update({ where: { id }, data })
      return reply.send({ category })
    },
  })

  // ── DELETE /admin/categories/:id ──────────────────────────────────────────────
  app.delete('/:id', {
    schema: {
      summary: 'Delete a category (admin only) — only if no products or children',
      tags: ['Admin — Categories'],
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string }

      const existing = await app.prisma.category.findUnique({
        where: { id },
        include: {
          _count: { select: { children: true, products: true } },
        },
      })
      if (!existing) return reply.status(404).send({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' })
      if (existing._count.children > 0) {
        return reply.status(409).send({ error: 'Cannot delete a category that has sub-categories', code: 'HAS_CHILDREN' })
      }
      if (existing._count.products > 0) {
        return reply.status(409).send({ error: 'Cannot delete a category that has products assigned to it', code: 'HAS_PRODUCTS' })
      }

      await app.prisma.category.delete({ where: { id } })
      return reply.status(204).send()
    },
  })
}
