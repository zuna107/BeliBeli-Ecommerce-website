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
import prismaPlugin from './plugins/prisma'
import redisPlugin from './plugins/redis'
import mailerPlugin from './plugins/mailer'
import authRoutes from './modules/auth/auth.routes'

export async function buildApp() {
  const loggerConfig =
    process.env.NODE_ENV !== 'production'
      ? { level: 'info' as const, transport: { target: 'pino-pretty', options: { colorize: true } } }
      : { level: 'warn' as const }

  const app = Fastify({ logger: loggerConfig })

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
  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  })

  // ─── Auth Middleware (JWT guard) ──────────────────────────────────
  app.addHook('onRequest', async (request, reply) => {
    // Skip auth for routes marked skipAuth
    if ((request.routeOptions?.config as unknown as Record<string, unknown>)?.skipAuth) return

    // Skip OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') return

    // Skip Swagger UI in development
    if (process.env.NODE_ENV !== 'production' && request.url.startsWith('/docs')) return

    // Skip static uploads (public files)
    if (request.url.startsWith('/uploads/')) return

    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Token is invalid or expired', code: 'UNAUTHORIZED' })
    }
  })

  // ─── Infrastructure Plugins ───────────────────────────────────────
  await app.register(prismaPlugin)
  await app.register(redisPlugin)
  await app.register(mailerPlugin)

  // ─── Routes ───────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/api/v1/auth' })

  return app
}
