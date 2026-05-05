import { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@beibeli/shared'

// Allowed upload types and their upload sub-directories
const ALLOWED_TYPES = ['product', 'shop'] as const
type UploadType = (typeof ALLOWED_TYPES)[number]

export async function uploadRoutes(app: FastifyInstance) {
  // ── POST /upload/image — upload a single image ───────────────────────────────
  app.post('/image', {
    schema: {
      summary: 'Upload a single image, returns a URL for use in subsequent requests',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      querystring: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ALLOWED_TYPES,
            description: 'The resource type the image belongs to',
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { type } = request.query as { type: UploadType }

      if (!ALLOWED_TYPES.includes(type)) {
        return reply.status(422).send({
          error: `Invalid upload type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
          code: 'INVALID_UPLOAD_TYPE',
        })
      }

      const file = await request.file()
      if (!file) return reply.status(400).send({ error: 'No file provided', code: 'NO_FILE' })

      if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
        return reply.status(422).send({
          error: `Unsupported file type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
        })
      }

      const ext = path.extname(file.filename) || '.jpg'
      const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`
      const subdir = type === 'product' ? 'products' : 'shops'
      const uploadDir = path.resolve(process.cwd(), 'uploads', subdir)
      await fs.mkdir(uploadDir, { recursive: true })
      const filePath = path.join(uploadDir, filename)

      let totalSize = 0
      const chunks: Buffer[] = []
      for await (const chunk of file.file as AsyncIterable<Buffer>) {
        totalSize += chunk.length
        if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
          return reply.status(413).send({
            error: `File exceeds the ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB limit`,
            code: 'FILE_TOO_LARGE',
          })
        }
        chunks.push(chunk)
      }
      await fs.writeFile(filePath, Buffer.concat(chunks))

      const url = `/uploads/${subdir}/${filename}`
      return reply.status(201).send({ url })
    },
  })
}
