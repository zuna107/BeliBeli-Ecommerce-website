// ─── Order Status ────────────────────────────────────────────────
export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'refunded'

export type PaymentMethod = 'bank_transfer' | 'ewallet' | 'qris' | 'credit_card' | 'cod'

// ─── Product ──────────────────────────────────────────────────────
export type ProductCondition = 'new' | 'used'

export type ProductStatus = 'active' | 'inactive' | 'deleted'

// ─── User ─────────────────────────────────────────────────────────
export type UserRole = 'buyer' | 'seller' | 'admin'

export type Gender = 'male' | 'female' | 'other'

// ─── Upload ───────────────────────────────────────────────────────
export type UploadType = 'products' | 'avatars' | 'shops' | 'reviews'

// ─── API Response ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code?: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}
