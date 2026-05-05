import { z } from 'zod'

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().int().min(0, 'Price must be 0 or greater'),
  stock: z.number().int().min(0, 'Stock must be 0 or greater'),
  sku: z.string().optional(),
  weight_gram: z.number().int().min(1, 'Weight must be at least 1 gram'),
})

export const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().uuid('Invalid category'),
  condition: z.enum(['new', 'used']),
  weight_gram: z.number().int().min(1, 'Weight is required'),
  min_order: z.number().int().min(1).default(1),
  variants: z.array(productVariantSchema).min(1, 'At least one variant is required'),
  image_urls: z.array(z.string().url()).min(1, 'At least one product image is required').max(5),
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
