import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'

/**
 * Fastify plugin — registers an `onRequest` hook on the enclosing scope
 * that rejects non-admin callers with 403 Forbidden.
 *
 * Usage: `await app.register(requireAdmin)` inside any sub-router.
 */
export const requireAdmin = fp(async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    if (!request.user || request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Admin access required', code: 'FORBIDDEN' })
    }
  })
})
