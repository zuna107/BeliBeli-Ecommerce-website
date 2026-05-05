import { z } from 'zod'

export const createShopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters').max(100),
  description: z.string().max(1000).optional(),
  city: z.string().min(1, 'City is required').max(100),
  komerce_city_id: z.string().min(1, 'Komerce city ID is required'),
})

export const updateShopSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  city: z.string().min(1).max(100).optional(),
  komerce_city_id: z.string().min(1).optional(),
})

export type CreateShopInput = z.infer<typeof createShopSchema>
export type UpdateShopInput = z.infer<typeof updateShopSchema>
