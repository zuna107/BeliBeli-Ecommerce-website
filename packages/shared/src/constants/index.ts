// ─── Order status labels (Bahasa Indonesia) ──────────────────────
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Menunggu Pembayaran',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Diterima',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  refunded: 'Dikembalikan',
}

// ─── Payment expiry ───────────────────────────────────────────────
export const PAYMENT_EXPIRY_HOURS = 24

// ─── Upload constraints ───────────────────────────────────────────
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_PRODUCT_IMAGES = 5

// ─── Pagination defaults ─────────────────────────────────────────
export const DEFAULT_PAGE_LIMIT = 20
export const MAX_PAGE_LIMIT = 60

// ─── OTP ──────────────────────────────────────────────────────────
export const OTP_EXPIRY_MINUTES = 10
export const OTP_RESEND_COOLDOWN_SECONDS = 60

// ─── JWT ──────────────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = '15m'
export const REFRESH_TOKEN_EXPIRY = '7d'
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
