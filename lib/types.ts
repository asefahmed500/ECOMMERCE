export interface SessionUser {
  id: string
  name: string
  email: string
  role: "customer" | "admin"
  tier: string
  cashback: number
  address: { line1: string; city: string; country: string; zip: string }
  paymentMethod: string
}

export interface ProductDTO {
  id: string
  name: string
  sub: string
  category: string
  sku: string
  price: number
  oldPrice: number | null
  sale: string | null
  stock: number
  rating: number
  reviewsCount: number
  image: string
  swatches: string[]
  description: string
  isFeatured: boolean
}

export interface OrderItemDTO {
  productId: string
  name: string
  image: string
  price: number
  qty: number
}

export interface OrderDTO {
  id: string
  orderNo: string
  userId: string | null
  customerName: string
  guestEmail: string | null
  items: OrderItemDTO[]
  subtotal: number
  discount: number
  couponCode: string | null
  cashbackApplied: number
  cashbackEarned: number
  shipping: number
  total: number
  payment: string
  status: string
  trackingNo: string
  courier: string
  shippingAddress: { line1: string; city: string; country: string; zip: string }
  history: { status: string; at: string }[]
  createdAt: string
}

export interface CouponDTO {
  id: string
  code: string
  percent: number
  description: string
  minOrder: number
  uses: number
  maxUses: number | null
  expiry: string
  active: boolean
}

export interface NotificationDTO {
  id: string
  type: string
  title: string
  message: string
  orderId: string | null
  read: boolean
  createdAt: string
}

export interface CustomerStatDTO {
  id: string
  name: string
  email: string
  location: string
  orders: number
  spent: number
  avgOrderValue: number
  lastOrderAt: string | null
  customerSince: string
  tier: string
}

export interface StoreSettingsDTO {
  brandName: string
  supportEmail: string
  freeShippingThreshold: number
  shippingFee: number
}
