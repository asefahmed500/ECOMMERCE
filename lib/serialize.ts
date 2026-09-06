import type { CouponDoc, NotificationDoc, OrderDoc, ProductDoc, UserDoc } from "@/lib/models"
import type {
  CouponDTO,
  NotificationDTO,
  OrderDTO,
  ProductDTO,
} from "@/lib/types"

export function toProductDTO(p: ProductDoc): ProductDTO {
  return {
    id: String(p._id),
    name: p.name,
    sub: p.sub ?? "",
    category: p.category,
    sku: p.sku,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    sale: p.sale ?? null,
    stock: p.stock,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    image: p.image,
    swatches: p.swatches ?? [],
    description: p.description ?? "",
    isFeatured: p.isFeatured ?? false,
  }
}

export function toOrderDTO(o: OrderDoc): OrderDTO {
  return {
    id: String(o._id),
    orderNo: o.orderNo,
    userId: o.user ? String(o.user) : null,
    customerName: o.customerName,
    guestEmail: o.guestEmail ?? null,
    items: (o.items ?? []).map((it) => ({
      productId: String(it.product),
      name: it.name,
      image: it.image ?? "",
      price: it.price,
      qty: it.qty,
    })),
    subtotal: o.subtotal,
    discount: o.discount ?? 0,
    couponCode: o.couponCode ?? null,
    cashbackApplied: (o as OrderDoc & { cashbackApplied?: number }).cashbackApplied ?? 0,
    cashbackEarned: (o as OrderDoc & { cashbackEarned?: number }).cashbackEarned ?? 0,
    shipping: o.shipping ?? 0,
    total: o.total,
    payment: o.payment,
    status: o.status,
    trackingNo: o.trackingNo ?? "",
    courier: o.courier ?? "DHL Express",
    shippingAddress: o.shippingAddress ?? { line1: "", city: "", country: "", zip: "" },
    history: (o.history ?? []).map((h) => ({
      status: h.status,
      at: h.at.toISOString(),
    })),
    createdAt: o.createdAt.toISOString(),
  }
}

export function toCouponDTO(c: CouponDoc): CouponDTO {
  return {
    id: String(c._id),
    code: c.code,
    percent: c.percent,
    description: c.description ?? "",
    minOrder: c.minOrder ?? 0,
    uses: c.uses ?? 0,
    maxUses: c.maxUses ?? null,
    expiry: c.expiry.toISOString(),
    active: c.active ?? false,
  }
}

export function toNotificationDTO(n: NotificationDoc): NotificationDTO {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message ?? "",
    orderId: n.orderId ?? null,
    read: n.read ?? false,
    createdAt: n.createdAt.toISOString(),
  }
}

export function initials(name?: string | null) {
  if (!name || typeof name !== "string") return "U"
  const letters = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
  return (letters.slice(0, 2).join("") || "U").toUpperCase()
}

export type { UserDoc }
