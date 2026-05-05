import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { updateProfileSchema, createAddressSchema, updateAddressSchema } from '@beibeli/shared'
import {
  getUserProfile,
  updateProfile,
  updateBio,
  uploadAvatar,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
} from './user.service'

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(422).send({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const e = error as { statusCode: number; message: string; code: string }
    return reply.status(e.statusCode).send({ error: e.message, code: e.code })
  }
  request.log.error(error)
  return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function userRoutes(app: FastifyInstance) {
  // GET /profile
  app.get(
    '/profile',
    { schema: { tags: ['Users'], summary: 'Get current user profile', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      try {
        return reply.send(await getUserProfile(app, request.user.sub))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // PATCH /profile
  app.patch(
    '/profile',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            birth_date: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = updateProfileSchema.parse(request.body)
        return reply.send(await updateProfile(app, request.user.sub, input))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // PATCH /bio
  app.patch(
    '/bio',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update user bio',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['bio'],
          properties: { bio: { type: 'string', maxLength: 500 } },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as { bio: string }
        return reply.send(await updateBio(app, request.user.sub, body.bio ?? ''))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /avatar
  app.post(
    '/avatar',
    {
      schema: {
        tags: ['Users'],
        summary: 'Upload user avatar image',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
      },
    },
    async (request, reply) => {
      try {
        const file = await request.file()
        if (!file) {
          return reply.status(400).send({ error: 'No file uploaded', code: 'NO_FILE' })
        }
        const result = await uploadAvatar(
          app,
          request.user.sub,
          file.file,
          file.mimetype,
          file.filename,
        )
        return reply.send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // ─── Addresses ─────────────────────────────────────────────────────────────

  // GET /addresses
  app.get(
    '/addresses',
    { schema: { tags: ['Users'], summary: 'List user addresses', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      try {
        return reply.send(await listAddresses(app, request.user.sub))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /addresses
  app.post(
    '/addresses',
    {
      schema: {
        tags: ['Users'],
        summary: 'Create a new address',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['label', 'recipient_name', 'phone', 'province', 'city', 'district', 'postal_code', 'detail', 'komerce_city_id'],
          properties: {
            label: { type: 'string' },
            recipient_name: { type: 'string' },
            phone: { type: 'string' },
            province: { type: 'string' },
            city: { type: 'string' },
            district: { type: 'string' },
            postal_code: { type: 'string' },
            detail: { type: 'string' },
            komerce_city_id: { type: 'string' },
            is_default: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = createAddressSchema.parse(request.body)
        const result = await createAddress(app, request.user.sub, input)
        return reply.status(201).send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // PATCH /addresses/:id
  app.patch(
    '/addresses/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update an address',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const input = updateAddressSchema.parse(request.body)
        return reply.send(await updateAddress(app, request.user.sub, id, input))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // DELETE /addresses/:id
  app.delete(
    '/addresses/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Delete an address',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        return reply.send(await deleteAddress(app, request.user.sub, id))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // PUT /addresses/:id/primary
  app.put(
    '/addresses/:id/primary',
    {
      schema: {
        tags: ['Users'],
        summary: 'Set an address as primary',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        return reply.send(await setPrimaryAddress(app, request.user.sub, id))
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )
}
