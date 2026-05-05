import { z } from 'zod'

export const productVariantSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  weight_gram: z.number().int().min(1),
})

export const createProductSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter').max(255),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  category_id: z.string().uuid(),
  condition: z.enum(['new', 'used']),
  weight_gram: z.number().int().min(1, 'Berat wajib diisi'),
  min_order: z.number().int().min(1).default(1),
  variants: z.array(productVariantSchema).min(1, 'Minimal 1 varian'),
  image_ids: z.array(z.string().uuid()).min(1, 'Minimal 1 foto produk').max(5),
})

export const updateProductSchema = createProductSchema.partial()

export const productFilterSchema = z.object({
  q: z.string().optional(),
  category_id: z.string().uuid().optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  condition: z.enum(['new', 'used']).optional(),
  sort: z.enum(['relevance', 'newest', 'price_asc', 'price_desc', 'sold']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
