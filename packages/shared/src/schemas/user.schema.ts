import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Invalid phone number format')
    .optional(),
  birth_date: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

export const createAddressSchema = z.object({
  label: z.string().min(1).max(50),
  recipient_name: z.string().min(2).max(100),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/),
  province: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  postal_code: z.string().regex(/^\d{5}$/),
  address_detail: z.string().min(5).max(255),
  komerce_city_id: z.string().min(1),
  is_primary: z.boolean().default(false),
})

export const updateAddressSchema = createAddressSchema.partial()

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateAddressInput = z.infer<typeof createAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
