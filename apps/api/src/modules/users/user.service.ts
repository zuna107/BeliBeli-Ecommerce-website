import { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import type { UpdateProfileInput, CreateAddressInput, UpdateAddressInput } from '@beibeli/shared'
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@beibeli/shared'

// ─── Service error helper ─────────────────────────────────────────────────────

interface ServiceError {
  statusCode: number
  message: string
  code: string
}

function serviceError(statusCode: number, message: string, code: string): ServiceError {
  return { statusCode, message, code }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getUserProfile(app: FastifyInstance, userId: string) {
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
        select: { id: true, name: true, slug: true, logo_url: true, status: true },
      },
    },
  })

  if (!user) throw serviceError(404, 'User not found', 'USER_NOT_FOUND')

  return user
}

export async function updateProfile(
  app: FastifyInstance,
  userId: string,
  input: UpdateProfileInput,
) {
  const data: Record<string, unknown> = {}

  if (input.name !== undefined) data['name'] = input.name
  if (input.phone !== undefined) data['phone'] = input.phone ?? null
  if (input.birth_date !== undefined) data['birth_date'] = input.birth_date ? new Date(input.birth_date) : null
  if (input.gender !== undefined) data['gender'] = input.gender ?? null

  const user = await app.prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar_url: true,
      bio: true,
      role: true,
      birth_date: true,
      gender: true,
    },
  })

  return user
}

export async function updateBio(app: FastifyInstance, userId: string, bio: string) {
  const user = await app.prisma.user.update({
    where: { id: userId },
    data: { bio: bio.trim() || null },
    select: { id: true, bio: true },
  })
  return user
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────

export async function uploadAvatar(app: FastifyInstance, userId: string, fileStream: NodeJS.ReadableStream, mimetype: string, filename: string) {
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimetype)) {
    throw serviceError(422, `Unsupported file type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`, 'INVALID_FILE_TYPE')
  }

  const ext = path.extname(filename) || '.jpg'
  const newFilename = `avatar-${userId}-${crypto.randomBytes(8).toString('hex')}${ext}`
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'avatars')
  const filePath = path.join(uploadDir, newFilename)

  await fs.mkdir(uploadDir, { recursive: true })

  // Stream to disk with size check
  let totalSize = 0
  const chunks: Buffer[] = []
  for await (const chunk of fileStream as AsyncIterable<Buffer>) {
    totalSize += chunk.length
    if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
      throw serviceError(413, `File size exceeds the ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB limit`, 'FILE_TOO_LARGE')
    }
    chunks.push(chunk)
  }
  await fs.writeFile(filePath, Buffer.concat(chunks))

  const avatarUrl = `/uploads/avatars/${newFilename}`

  // Delete previous avatar file if it was a local upload
  const existing = await app.prisma.user.findUnique({ where: { id: userId }, select: { avatar_url: true } })
  if (existing?.avatar_url?.startsWith('/uploads/')) {
    const oldPath = path.resolve(process.cwd(), existing.avatar_url.slice(1))
    await fs.unlink(oldPath).catch(() => null) // ignore if already gone
  }

  const user = await app.prisma.user.update({
    where: { id: userId },
    data: { avatar_url: avatarUrl },
    select: { id: true, avatar_url: true },
  })

  return user
}

// ─── Addresses ───────────────────────────────────────────────────────────────

export async function listAddresses(app: FastifyInstance, userId: string) {
  return app.prisma.address.findMany({
    where: { user_id: userId },
    orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
  })
}

export async function createAddress(
  app: FastifyInstance,
  userId: string,
  input: CreateAddressInput,
) {
  // If new address is default, demote existing default
  if (input.is_default) {
    await app.prisma.address.updateMany({
      where: { user_id: userId, is_default: true },
      data: { is_default: false },
    })
  }

  // If this is the first address, make it default automatically
  const count = await app.prisma.address.count({ where: { user_id: userId } })
  const isDefault = input.is_default || count === 0

  return app.prisma.address.create({
    data: { ...input, user_id: userId, is_default: isDefault },
  })
}

export async function updateAddress(
  app: FastifyInstance,
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  const address = await app.prisma.address.findFirst({
    where: { id: addressId, user_id: userId },
  })
  if (!address) throw serviceError(404, 'Address not found', 'ADDRESS_NOT_FOUND')

  if (input.is_default) {
    await app.prisma.address.updateMany({
      where: { user_id: userId, is_default: true },
      data: { is_default: false },
    })
  }

  // Build update data explicitly (exactOptionalPropertyTypes safety)
  const data: Record<string, unknown> = {}
  if (input.label !== undefined) data['label'] = input.label
  if (input.recipient_name !== undefined) data['recipient_name'] = input.recipient_name
  if (input.phone !== undefined) data['phone'] = input.phone
  if (input.province !== undefined) data['province'] = input.province
  if (input.city !== undefined) data['city'] = input.city
  if (input.district !== undefined) data['district'] = input.district
  if (input.postal_code !== undefined) data['postal_code'] = input.postal_code
  if (input.detail !== undefined) data['detail'] = input.detail
  if (input.komerce_city_id !== undefined) data['komerce_city_id'] = input.komerce_city_id
  if (input.is_default !== undefined) data['is_default'] = input.is_default

  return app.prisma.address.update({
    where: { id: addressId },
    data,
  })
}

export async function deleteAddress(
  app: FastifyInstance,
  userId: string,
  addressId: string,
) {
  const address = await app.prisma.address.findFirst({
    where: { id: addressId, user_id: userId },
  })
  if (!address) throw serviceError(404, 'Address not found', 'ADDRESS_NOT_FOUND')

  if (address.is_default) {
    throw serviceError(400, 'Cannot delete the default address. Set another address as default first.', 'CANNOT_DELETE_DEFAULT')
  }

  await app.prisma.address.delete({ where: { id: addressId } })
  return { message: 'Address deleted' }
}

export async function setPrimaryAddress(
  app: FastifyInstance,
  userId: string,
  addressId: string,
) {
  const address = await app.prisma.address.findFirst({
    where: { id: addressId, user_id: userId },
  })
  if (!address) throw serviceError(404, 'Address not found', 'ADDRESS_NOT_FOUND')

  await app.prisma.address.updateMany({
    where: { user_id: userId, is_default: true },
    data: { is_default: false },
  })

  const updated = await app.prisma.address.update({
    where: { id: addressId },
    data: { is_default: true },
  })

  return updated
}
