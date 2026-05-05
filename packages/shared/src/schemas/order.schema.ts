import { z } from 'zod'

export const checkoutItemSchema = z.object({
  cart_item_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  quantity: z.number().int().min(1),
})

export const createOrderSchema = z.object({
  address_id: z.string().uuid('Shipping address is required'),
  items: z.array(checkoutItemSchema).min(1),
  // Per toko: kurir yang dipilih
  shipping: z.array(
    z.object({
      shop_id: z.string().uuid(),
      courier: z.string().min(1),
      service: z.string().min(1),
      cost: z.number().int().min(0),
      etd: z.string(),
    })
  ),
  voucher_code: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
  tracking_number: z.string().optional(),
  courier_name: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
