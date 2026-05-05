import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@beibeli/shared'
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
} from './auth.service'
import { REFRESH_TOKEN_EXPIRY_MS } from '@beibeli/shared'

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(422).send({
      error: 'Validasi gagal',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  ) {
    const e = error as { statusCode: number; message: string; code: string }
    return reply.status(e.statusCode).send({ error: e.message, code: e.code })
  }
  request.log.error(error)
  return reply.status(500).send({ error: 'Terjadi kesalahan server', code: 'INTERNAL_ERROR' })
}

// ─── Cookie helper ────────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'refresh_token'
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000),
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance) {
  // POST /register
  app.post(
    '/register',
    {
      config: { skipAuth: true },
      schema: {
        tags: ['Auth'],
        summary: 'Daftar akun baru',
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        response: { 201: { type: 'object', properties: { message: { type: 'string' } } } },
      },
    },
    async (request, reply) => {
      try {
        const input = registerSchema.parse(request.body)
        const result = await registerUser(app, input)
        return reply.status(201).send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /login
  app.post(
    '/login',
    {
      config: { skipAuth: true },
      schema: {
        tags: ['Auth'],
        summary: 'Login',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = loginSchema.parse(request.body)
        const result = await loginUser(app, input)

        reply.setCookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS)

        return reply.send({
          accessToken: result.accessToken,
          user: result.user,
        })
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /logout
  app.post(
    '/logout',
    {
      config: { skipAuth: true },
      schema: { tags: ['Auth'], summary: 'Logout' },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[REFRESH_COOKIE]
      await logoutUser(app, refreshToken)
      reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_OPTIONS.path })
      return reply.send({ message: 'Logout berhasil' })
    },
  )

  // POST /refresh
  app.post(
    '/refresh',
    {
      config: { skipAuth: true },
      schema: { tags: ['Auth'], summary: 'Refresh access token' },
    },
    async (request, reply) => {
      try {
        const token = request.cookies[REFRESH_COOKIE]
        if (!token) {
          return reply.status(401).send({ error: 'Refresh token tidak ada', code: 'NO_REFRESH_TOKEN' })
        }
        const result = await refreshAccessToken(app, token)

        reply.setCookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS)

        return reply.send({ accessToken: result.accessToken })
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /verify-email
  app.post(
    '/verify-email',
    {
      config: { skipAuth: true },
      schema: {
        tags: ['Auth'],
        summary: 'Verifikasi email dengan kode OTP',
        body: {
          type: 'object',
          required: ['email', 'token'],
          properties: {
            email: { type: 'string', format: 'email' },
            token: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = verifyEmailSchema.parse(request.body)
        const result = await verifyEmail(app, input)
        return reply.send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /resend-verification
  app.post(
    '/resend-verification',
    {
      config: { skipAuth: true },
      schema: {
        tags: ['Auth'],
        summary: 'Kirim ulang kode OTP verifikasi email',
        body: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = resendVerificationSchema.parse(request.body)
        const result = await resendVerification(app, input.email)
        return reply.send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /forgot-password
  app.post(
    '/forgot-password',
    {
      config: { skipAuth: true },
      schema: {
        tags: ['Auth'],
        summary: 'Request reset password',
        body: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = forgotPasswordSchema.parse(request.body)
        const result = await forgotPassword(app, input)
        return reply.send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // POST /reset-password
  app.post(
    '/reset-password',
    {
      config: { skipAuth: true },
      schema: {
        tags: ['Auth'],
        summary: 'Reset password dengan token',
        body: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = resetPasswordSchema.parse(request.body)
        const result = await resetPassword(app, input)
        return reply.send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )

  // GET /me  (protected — requires JWT)
  app.get(
    '/me',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Data user yang sedang login',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const result = await getMe(app, request.user.sub)
        return reply.send(result)
      } catch (error) {
        return handleError(error, request, reply)
      }
    },
  )
}
