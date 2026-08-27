import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose"

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sub: { type: String, default: "", trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Fashion", "Beauty", "Electronics", "Wearables", "Bags"],
    },
    sku: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: null },
    sale: { type: String, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    image: { type: String, required: true },
    swatches: { type: [String], default: [] },
    description: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
)

productSchema.index({ category: 1 })

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    tier: { type: String, enum: ["Regular", "VIP Silver", "VIP Gold"], default: "Regular" },
    cashback: { type: Number, default: 0 },
    address: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "" },
      zip: { type: String, default: "" },
    },
    paymentMethod: { type: String, default: "" },
  },
  { timestamps: true }
)

userSchema.index({ role: 1 })

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

export const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: false, versionKey: false }
)

const orderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },
    customerName: { type: String, required: true },
    guestEmail: { type: String, default: null, lowercase: true, trim: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    cashbackApplied: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payment: { type: String, enum: ["Paid", "Refunded"], default: "Paid" },
    status: { type: String, enum: ORDER_STATUSES, default: "Processing" },
    trackingNo: { type: String, default: "" },
    courier: { type: String, default: "DHL Express" },
    shippingAddress: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "" },
      zip: { type: String, default: "" },
    },
    history: [
      {
        status: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percent: { type: Number, required: true, min: 1, max: 100 },
    description: { type: String, default: "" },
    minOrder: { type: Number, default: 0 },
    uses: { type: Number, default: 0 },
    maxUses: { type: Number, default: null, min: 0 },
    usedBy: { type: [String], default: [] },
    expiry: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    forAdmin: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["order", "order-status", "system", "promo"],
      default: "order",
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    orderId: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ forAdmin: 1, createdAt: -1 })

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
)

wishlistSchema.index({ user: 1, product: 1 }, { unique: true })

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    brandName: { type: String, default: "ecomi Official Flagship" },
    supportEmail: { type: String, default: "support@ecomi.store" },
    freeShippingThreshold: { type: Number, default: 50 },
    shippingFee: { type: Number, default: 4.99 },
  },
  { timestamps: true }
)

export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: mongoose.Types.ObjectId }
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId }
export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: mongoose.Types.ObjectId }
export type CouponDoc = InferSchemaType<typeof couponSchema> & { _id: mongoose.Types.ObjectId }
export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: mongoose.Types.ObjectId }
export type WishlistDoc = InferSchemaType<typeof wishlistSchema> & { _id: mongoose.Types.ObjectId }
export type SettingDoc = InferSchemaType<typeof settingSchema> & { _id: mongoose.Types.ObjectId }
export type CounterDoc = InferSchemaType<typeof counterSchema> & { _id: string }

function model<T>(name: string, schema: Schema<T>): Model<T> {
  const registry = mongoose.models as Record<string, Model<unknown> | undefined>
  const existing = registry[name]

  if (process.env.NODE_ENV === "production") {
    return (existing as unknown as Model<T>) ?? mongoose.model<T>(name, schema)
  }

  if (existing) {
    // In dev, drop previously registered models so hot-reloaded schema edits
    // take effect even though the cached DB connection outlives recompiles.
    try {
      ;(existing as unknown as { deleteModel?: () => void }).deleteModel?.()
    } catch {
      // ignore stale entries from a duplicated module instance
    }
    try {
      delete registry[name]
      delete (mongoose.connection.models as Record<string, unknown>)[name]
    } catch {
      // ignore
    }
  }
  return mongoose.model<T>(name, schema)
}

export const Product = model<ProductDoc>("Product", productSchema as Schema<ProductDoc>)
export const User = model<UserDoc>("User", userSchema as Schema<UserDoc>)
export const Order = model<OrderDoc>("Order", orderSchema as Schema<OrderDoc>)
export const Coupon = model<CouponDoc>("Coupon", couponSchema as Schema<CouponDoc>)
export const Notification = model<NotificationDoc>("Notification", notificationSchema as Schema<NotificationDoc>)
export const Wishlist = model<WishlistDoc>("Wishlist", wishlistSchema as Schema<WishlistDoc>)
export const Setting = model<SettingDoc>("Setting", settingSchema as Schema<SettingDoc>)
export const Counter = model<CounterDoc>("Counter", counterSchema as unknown as Schema<CounterDoc>)
