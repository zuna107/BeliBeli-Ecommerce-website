import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  // ─── Swagger (development only) ───────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: { title: 'BeliBeli API', version: '0.1.0', description: 'BeliBeli E-commerce API' },
        servers: [{ url: `http://localhost:${process.env.PORT ?? 3000}` }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    })
    await app.register(swaggerUi, { routePrefix: '/docs' })
  }

  // ─── CORS ─────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  // ─── Rate Limiting ────────────────────────────────────────────────
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // ─── Cookie ───────────────────────────────────────────────────────
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? 'change-this-in-production',
  })

  // ─── JWT ──────────────────────────────────────────────────────────
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'change-this-jwt-secret',
  })

  // ─── Multipart (file upload) ──────────────────────────────────────
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 5,
    },
  })

  // ─── Static Files (local uploads) ────────────────────────────────
  const uploadsDir = path.resolve(__dirname, '../../uploads')
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  })

  // ─── Auth Middleware (JWT guard) ──────────────────────────────────
  app.addHook('onRequest', async (request, reply) => {
    // Skip auth untuk route yang ditandai skipAuth
    if ((request.routeOptions?.config as Record<string, unknown>)?.skipAuth) return

    // Skip untuk method OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') return

    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Token tidak valid atau kedaluwarsa', code: 'UNAUTHORIZED' })
    }
  })

  // ─── Register Routes ─────────────────────────────────────────────
  // Routes akan di-register per module
  // Contoh: app.register(import('./modules/auth/auth.routes'), { prefix: '/auth' })

  return app
}
