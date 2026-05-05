export { PrismaClient } from './generated/prisma'
export type { Prisma } from './generated/prisma'

// Re-export all generated types
export type {
  User,
  Shop,
  Address,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  Cart,
  CartItem,
  Order,
  OrderShop,
  OrderItem,
  OrderStatusLog,
  Payment,
  Review,
  ReviewImage,
  Wishlist,
  ShopFollower,
  Voucher,
  OrderVoucher,
  Notification,
} from './generated/prisma'

export {
  UserRole,
  Gender,
  ShopStatus,
  ProductStatus,
  ProductCondition,
  OrderShopStatus,
  PaymentStatus,
  VoucherType,
} from './generated/prisma'
