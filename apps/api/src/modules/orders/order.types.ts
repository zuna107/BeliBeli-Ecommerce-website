import type { z } from 'zod'
import type { createOrderSchema, updateOrderStatusSchema } from '@beibeli/shared'

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
