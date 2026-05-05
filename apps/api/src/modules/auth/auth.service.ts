import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_MS,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@beibeli/shared'
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@beibeli/shared'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

interface ServiceError {
  statusCode: number
  message: string
  code: string
}

function serviceError(statusCode: number, message: string, code: string): ServiceError {
  return { statusCode, message, code }
}

// ─── Auth Operations ──────────────────────────────────────────────────────────

export async function registerUser(app: FastifyInstance, input: RegisterInput) {
  const { name, email, password, phone } = input

  const existing = await app.prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw serviceError(409, 'Email is already registered', 'EMAIL_TAKEN')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await app.prisma.user.create({
    data: { name, email, password_hash: passwordHash, phone: phone ?? null, role: 'buyer' },
  })

  const otp = generateOtp()
  await app.redis.setex(`email_verify:${user.id}`, OTP_EXPIRY_MINUTES * 60, otp)

  await sendVerificationEmail(app, user.email, user.name, user.id, otp)

  return { message: 'Registration successful. Please check your email for the verification code.' }
}

export async function loginUser(app: FastifyInstance, input: LoginInput) {
  const { email, password } = input

  const user = await app.prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw serviceError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash)
  if (!passwordValid) {
    throw serviceError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
  }

  if (!user.email_verified) {
    throw serviceError(403, 'Email is not verified. Please check your inbox for the OTP code.', 'EMAIL_NOT_VERIFIED')
  }

  const accessToken = app.jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  )

  const refreshToken = generateToken()
  await app.redis.setex(
    `refresh:${refreshToken}`,
    Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000),
    JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
  )

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    },
  }
}

export async function refreshAccessToken(app: FastifyInstance, refreshToken: string) {
  if (!refreshToken) {
    throw serviceError(401, 'Refresh token is missing', 'NO_REFRESH_TOKEN')
  }

  const stored = await app.redis.get(`refresh:${refreshToken}`)
  if (!stored) {
    throw serviceError(401, 'Refresh token is invalid or expired', 'INVALID_REFRESH_TOKEN')
  }

  const payload = JSON.parse(stored) as { userId: string; email: string; role: string }

  // Rotate refresh token
  await app.redis.del(`refresh:${refreshToken}`)
  const newRefreshToken = generateToken()
  await app.redis.setex(
    `refresh:${newRefreshToken}`,
    Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000),
    JSON.stringify(payload),
  )

  const accessToken = app.jwt.sign(
    { sub: payload.userId, email: payload.email, role: payload.role as 'buyer' | 'seller' | 'admin' },
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  )

  return { accessToken, refreshToken: newRefreshToken }
}

export async function logoutUser(app: FastifyInstance, refreshToken: string | undefined) {
  if (refreshToken) {
    await app.redis.del(`refresh:${refreshToken}`)
  }
}

export async function verifyEmail(app: FastifyInstance, input: VerifyEmailInput) {
  const { email, token } = input

  const user = await app.prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw serviceError(400, 'Invalid OTP code', 'INVALID_OTP')
  }

  if (user.email_verified) {
    throw serviceError(400, 'Email is already verified', 'ALREADY_VERIFIED')
  }

  const stored = await app.redis.get(`email_verify:${user.id}`)
  if (!stored || stored !== token) {
    throw serviceError(400, 'OTP code is invalid or expired', 'INVALID_OTP')
  }

  await app.prisma.user.update({
    where: { id: user.id },
    data: { email_verified: true },
  })

  await app.redis.del(`email_verify:${user.id}`)

  return { message: 'Email verified successfully. You can now log in.' }
}

export async function resendVerification(app: FastifyInstance, email: string) {
  const user = await app.prisma.user.findUnique({ where: { email } })

  // Don't reveal if email exists
  if (!user || user.email_verified) {
    if (user?.email_verified) {
      throw serviceError(400, 'Email is already verified', 'ALREADY_VERIFIED')
    }
    return { message: 'If the email is registered, a verification code will be sent' }
  }

  // Check cooldown: OTP exists and TTL is still > (OTP_EXPIRY - COOLDOWN)
  const ttl = await app.redis.ttl(`email_verify:${user.id}`)
  const minTtlToResend = OTP_EXPIRY_MINUTES * 60 - OTP_RESEND_COOLDOWN_SECONDS
  if (ttl > minTtlToResend) {
    throw serviceError(429, `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code`, 'RESEND_COOLDOWN')
  }

  const otp = generateOtp()
  await app.redis.setex(`email_verify:${user.id}`, OTP_EXPIRY_MINUTES * 60, otp)
  await sendVerificationEmail(app, user.email, user.name, user.id, otp)

  return { message: 'If the email is registered, a verification code will be sent' }
}

export async function forgotPassword(app: FastifyInstance, input: ForgotPasswordInput) {
  const user = await app.prisma.user.findUnique({ where: { email: input.email } })

  // Don't reveal if email exists
  if (!user || !user.email_verified) {
    return { message: 'If the email is registered, a password reset link will be sent' }
  }

  const token = generateToken()
  await app.redis.setex(`pwd_reset:${token}`, OTP_EXPIRY_MINUTES * 60, user.id)

  await sendPasswordResetEmail(app, user.email, user.name, token)

  return { message: 'If the email is registered, a password reset link will be sent' }
}

export async function resetPassword(app: FastifyInstance, input: ResetPasswordInput) {
  const { token, password } = input

  const userId = await app.redis.get(`pwd_reset:${token}`)
  if (!userId) {
    throw serviceError(400, 'Token is invalid or expired', 'INVALID_TOKEN')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await app.prisma.user.update({
    where: { id: userId },
    data: { password_hash: passwordHash },
  })

  await app.redis.del(`pwd_reset:${token}`)

  return { message: 'Password updated successfully. You can now log in with your new password.' }
}

export async function getMe(app: FastifyInstance, userId: string) {
  const user = await app.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar_url: true,
      bio: true,
      role: true,
      email_verified: true,
      birth_date: true,
      gender: true,
      created_at: true,
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo_url: true,
          status: true,
        },
      },
    },
  })

  if (!user) {
    throw serviceError(404, 'User not found', 'USER_NOT_FOUND')
  }

  return user
}

// ─── Email Templates ──────────────────────────────────────────────────────────

async function sendVerificationEmail(
  app: FastifyInstance,
  email: string,
  name: string,
  _userId: string,
  otp: string,
) {
  await app.mailer.sendMail({
    from: '"BeliBeli" <noreply@beibeli.com>',
    to: email,
    subject: 'Verify your BeliBeli email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0095DA;">Hi, ${name}!</h2>
        <p>Use the OTP code below to verify your email address:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #0095DA; padding: 16px 0;">${otp}</div>
        <p style="color: #666;">This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you did not register at BeliBeli, you can safely ignore this email.</p>
      </div>
    `,
  })
}

async function sendPasswordResetEmail(
  app: FastifyInstance,
  email: string,
  name: string,
  token: string,
) {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`

  await app.mailer.sendMail({
    from: '"BeliBeli" <noreply@beibeli.com>',
    to: email,
    subject: 'Reset your BeliBeli password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0095DA;">Hi, ${name}!</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block; background:#0095DA; color:#fff; padding:12px 28px; border-radius:4px; text-decoration:none; font-weight:bold;">Reset Password</a>
        <p style="color: #666; margin-top: 16px;">This link expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  })
}
