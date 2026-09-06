import "server-only"
import dbConnect from "@/lib/db"
import { Coupon, Notification, Order, Product, Setting, User, Wishlist } from "@/lib/models"
import { toCouponDTO, toOrderDTO, toProductDTO } from "@/lib/serialize"
import type { CouponDTO, CustomerStatDTO, OrderDTO, ProductDTO, StoreSettingsDTO } from "@/lib/types"
import type { PipelineStage } from "mongoose"
import mongoose from "mongoose"

export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export const DEFAULT_SETTINGS: StoreSettingsDTO = {
  brandName: "ecomi Official Flagship",
  supportEmail: "support@ecomi.store",
  freeShippingThreshold: 50,
  shippingFee: 4.99,
}

interface UserWithStats {
  _id: unknown
  name: string
  email: string
  tier: string
  createdAt: Date
  address?: { city?: string; country?: string }
  orderCount?: number
  totalSpent?: number
  avgOrderValue?: number
  lastOrderAt?: Date | null
}

export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  await dbConnect()
  const settings = await Setting.findOne({ key: "store" }).lean()
  if (!settings) return DEFAULT_SETTINGS
  return {
    brandName: settings.brandName ?? DEFAULT_SETTINGS.brandName,
    supportEmail: settings.supportEmail ?? DEFAULT_SETTINGS.supportEmail,
    freeShippingThreshold: settings.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold,
    shippingFee: settings.shippingFee ?? DEFAULT_SETTINGS.shippingFee,
  }
}

function statsPipelineStages() {
  return [
    {
      $lookup: {
        from: "orders",
        let: { uid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$user", "$$uid"] }, { $ne: ["$status", "Cancelled"] }],
              },
            },
          },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpent: { $sum: "$total" },
              avgOrderValue: { $avg: "$total" },
              lastOrderAt: { $max: "$createdAt" },
            },
          },
        ],
        as: "stats",
      },
    },
    { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        orderCount: { $ifNull: ["$stats.orderCount", 0] },
        totalSpent: { $ifNull: ["$stats.totalSpent", 0] },
        avgOrderValue: { $ifNull: ["$stats.avgOrderValue", 0] },
        lastOrderAt: { $ifNull: ["$stats.lastOrderAt", null] },
      },
    },
  ]
}

function toCustomerStat(u: UserWithStats): CustomerStatDTO {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    location: [u.address?.city, u.address?.country].filter(Boolean).join(", ") || "—",
    orders: u.orderCount ?? 0,
    spent: Math.round((u.totalSpent ?? 0) * 100) / 100,
    avgOrderValue: Math.round((u.avgOrderValue ?? 0) * 100) / 100,
    lastOrderAt: u.lastOrderAt ? new Date(u.lastOrderAt).toISOString() : null,
    customerSince: new Date(u.createdAt).toISOString(),
    tier: u.tier,
  }
}

const CUSTOMER_SORTS = {
  name: "name",
  orders: "orderCount",
  spent: "totalSpent",
  avgOrder: "avgOrderValue",
  recent: "lastOrderAt",
} as const

export type CustomerSortKey = keyof typeof CUSTOMER_SORTS

export async function getCustomerStats(options: { q?: string; sort?: string; page?: number; pageSize?: number } = {}) {
  await dbConnect()
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(50, Math.max(5, Number(options.pageSize) || 10))
  const sortKey = (options.sort && options.sort[0] === "-"
    ? (options.sort.slice(1) as CustomerSortKey)
    : (options.sort as CustomerSortKey)) || "spent"
  const desc = !options.sort || !options.sort.startsWith("-")
  const sortField = CUSTOMER_SORTS[sortKey] ?? "totalSpent"

  const qCond = options.q
    ? {
        $or: [
          { name: { $regex: escapeRegex(options.q), $options: "i" } },
          { email: { $regex: escapeRegex(options.q), $options: "i" } },
        ],
      }
    : null

  const qMatchStage: PipelineStage.Match[] = qCond ? [{ $match: qCond }] : []

  const [result] = await User.aggregate<Record<string, unknown>>([
    { $match: { role: "customer" } },
    ...statsPipelineStages(),
    {
      $facet: {
        rows: [
          ...qMatchStage,
          { $sort: { [sortField]: desc ? -1 : 1 } },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              name: 1,
              email: 1,
              tier: 1,
              createdAt: 1,
              address: 1,
              orderCount: 1,
              totalSpent: 1,
              avgOrderValue: 1,
              lastOrderAt: 1,
            },
          },
        ],
        total: [...qMatchStage, { $count: "count" }],
        summary: [
          {
            $group: {
              _id: null,
              customers: { $sum: 1 },
              vipGold: { $sum: { $cond: [{ $eq: ["$tier", "VIP Gold"] }, 1, 0] } },
              ltvSum: { $sum: "$totalSpent" },
              repeat: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } },
            },
          },
        ] as PipelineStage.FacetPipelineStage[],
      },
    },
  ])

  const rows = (result?.rows ?? []) as UserWithStats[]
  const total = ((result?.total ?? []) as Array<{ count: number }>)[0]?.count ?? 0
  const summary = ((result?.summary ?? []) as Array<{ customers: number; vipGold: number; ltvSum: number; repeat: number }>)[0]

  return {
    customers: rows.map(toCustomerStat),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    summary: {
      customers: summary?.customers ?? 0,
      vipGold: summary?.vipGold ?? 0,
      avgLtv: summary?.customers ? Math.round((summary.ltvSum / summary.customers) * 100) / 100 : 0,
      retention: summary?.customers ? Math.round((summary.repeat / summary.customers) * 100) : 0,
    },
  }
}

export async function getAdminStats() {
  await dbConnect()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [net, byStatus, ordersToday, productCount, customerCount] = await Promise.all([
    Order.aggregate<{ revenue: number; avgOrder: number; count: number }>([
      { $match: { status: { $ne: "Cancelled" }, payment: { $ne: "Refunded" } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, avgOrder: { $avg: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Product.countDocuments(),
    User.countDocuments({ role: "customer" }),
  ])

  const netRow = net[0]
  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.n])) as Record<string, number>

  return {
    revenue: Math.round((netRow?.revenue ?? 0) * 100) / 100,
    totalOrders: netRow?.count ?? 0,
    ordersToday,
    productCount,
    customerCount,
    avgOrder: Math.round((netRow?.avgOrder ?? 0) * 100) / 100,
    processing: statusMap["Processing"] ?? 0,
    shipped: statusMap["Shipped"] ?? 0,
    delivered: statusMap["Delivered"] ?? 0,
    cancelled: statusMap["Cancelled"] ?? 0,
  }
}

export async function getDailyRevenue(days = 14) {
  await dbConnect()
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const rows = await Order.aggregate<{ _id: string; revenue: number; orders: number }>([
    { $match: { status: { $ne: "Cancelled" }, payment: { $ne: "Refunded" }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const map = new Map(rows.map((r) => [r._id, r]))
  const series: { date: string; revenue: number; orders: number }[] = []
  for (let i = days; i >= 1; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = map.get(key)
    series.push({
      date: key,
      revenue: row ? Math.round(row.revenue * 100) / 100 : 0,
      orders: row?.orders ?? 0,
    })
  }
  const max = Math.max(...series.map((s) => s.revenue), 1)
  return { series, max }
}

export async function getCategoryPerformance() {
  await dbConnect()
  const rows = await Order.aggregate<{ _id: string | null; revenue: number; units: number }>([
    { $match: { status: { $ne: "Cancelled" }, payment: { $ne: "Refunded" } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $addFields: { category: { $first: "$productInfo.category" } } },
    {
      $group: {
        _id: "$category",
        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        units: { $sum: "$items.qty" },
      },
    },
    { $sort: { revenue: -1 } },
  ])
  return rows.map((r) => ({ category: r._id ?? "Uncategorized", revenue: Math.round(r.revenue * 100) / 100, units: r.units }))
}

function orderQuery(options: { q?: string; status?: string; customerId?: string }) {
  const cond: Record<string, unknown> = {}
  if (options.status && options.status !== "all") cond.status = options.status
  if (options.customerId) cond.user = options.customerId
  if (options.q) {
    const esc = escapeRegex(options.q)
    cond.$or = [{ orderNo: { $regex: esc, $options: "i" } }, { customerName: { $regex: esc, $options: "i" } }]
  }
  return cond
}

export async function getOrdersPage(
  options: { q?: string; status?: string; customerId?: string; page?: number; pageSize?: number } = {}
) {
  await dbConnect()
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(50, Math.max(5, Number(options.pageSize) || 12))
  const cond = orderQuery(options)

  const [orders, total, statusRows] = await Promise.all([
    Order.find(cond).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Order.countDocuments(cond),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ])

  const statusMap = Object.fromEntries(statusRows.map((s) => [s._id, s.n])) as Record<string, number>
  return {
    orders: orders.map((o) => toOrderDTO(o as never)),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    statusCounts: {
      all: statusRows.reduce((s, r) => s + r.n, 0),
      Processing: statusMap["Processing"] ?? 0,
      Shipped: statusMap["Shipped"] ?? 0,
      Delivered: statusMap["Delivered"] ?? 0,
      Cancelled: statusMap["Cancelled"] ?? 0,
    },
  }
}

export async function getRecentOrders(limit = 5): Promise<OrderDTO[]> {
  await dbConnect()
  const orders = await Order.find().sort({ createdAt: -1 }).limit(limit).lean()
  return orders.map((o) => toOrderDTO(o as never))
}

// Robust search: every whitespace-separated keyword must match at least one
// indexed text field (name, subtitle, description, SKU, or category). This way
// generic words like "watch", "leather bag", or "wireless headphones" surface
// products even when the phrase lives outside the title.
// Common shopper words that live on products under different spellings.
const SEARCH_SYNONYMS: Record<string, string[]> = {
  perfume: ["parfum", "fragrance", "scent"],
  parfum: ["perfume", "fragrance"],
  fragrance: ["perfume", "parfum"],
  scent: ["perfume", "parfum"],
  serum: ["skincare", "treatment"],
  sneaker: ["shoes", "shoe", "footwear"],
  sneakers: ["shoes", "shoe", "footwear"],
  shoes: ["sneaker", "footwear"],
  shoe: ["sneaker", "footwear"],
  headphones: ["headset", "earbuds", "audio"],
  headset: ["headphones", "earbuds"],
  smartwatch: ["watch", "wearable"],
  watch: ["smartwatch", "wearable"],
  eyewear: ["sunglasses", "glasses"],
  glasses: ["sunglasses", "eyewear"],
  sunglasses: ["glasses", "eyewear"],
  speaker: ["bluetooth", "audio"],
  bag: ["handbag", "leather"],
  handbag: ["bag"],
}

export function buildProductSearchCond(rawQuery: string): Record<string, unknown> | null {
  const tokens = rawQuery.trim().split(/\s+/).filter(Boolean).slice(0, 6)
  if (tokens.length === 0) return null

  const fields = ["name", "sub", "description", "sku", "category"] as const
  const tokenClauses = tokens
    .map((rawToken) => {
      const token = rawToken.toLowerCase().replace(/[^a-z0-9-]/g, "")
      const variants = [token, ...(SEARCH_SYNONYMS[token] ?? [])].filter(Boolean)
      if (variants.length === 0) {
        const rawEscaped = escapeRegex(rawToken.slice(0, 30))
        return rawEscaped
          ? {
              $or: fields.map((field) => ({
                [field]: { $regex: rawEscaped, $options: "i" },
              })),
            }
          : null
      }
      return {
        $or: fields.map((field) => ({
          [field]: { $regex: variants.map(escapeRegex).join("|"), $options: "i" },
        })),
      }
    })
    .filter(Boolean)

  if (tokenClauses.length === 0) return null
  return { $and: tokenClauses }
}

export async function getProductsPage(
  options: { q?: string; category?: string; page?: number; pageSize?: number } = {}
) {
  await dbConnect()
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(60, Math.max(4, Number(options.pageSize) || 10))
  const cond = buildProductSearchCond(options.q ?? "") ?? {}
  if (options.category && options.category !== "All") cond.category = options.category

  const [products, total] = await Promise.all([
    Product.find(cond).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Product.countDocuments(cond),
  ])

  return {
    products: products.map((p) => toProductDTO(p as never)),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getProducts(filter: { q?: string; category?: string } = {}): Promise<ProductDTO[]> {
  await dbConnect()
  const cond = buildProductSearchCond(filter.q ?? "") ?? {}
  if (filter.category && filter.category !== "All") cond.category = filter.category

  const products = await Product.find(cond).sort({ createdAt: -1 }).lean()
  return products.map((p) => toProductDTO(p as never))
}

export async function getProduct(id: string): Promise<ProductDTO | null> {
  if (!id || typeof id !== "string" || !mongoose.isValidObjectId(id)) return null
  await dbConnect()
  const product = await Product.findById(id).lean()
  return product ? toProductDTO(product as never) : null
}

export async function getWishlistIds(userId: string): Promise<string[]> {
  await dbConnect()
  const items = await Wishlist.find({ user: userId }).select("product").lean()
  return items.map((i) => String(i.product))
}

export async function getWishlistProducts(userId: string): Promise<ProductDTO[]> {
  await dbConnect()
  const items = await Wishlist.find({ user: userId }).populate("product").lean()
  return items
    .filter((i) => i.product)
    .map((i) => toProductDTO(i.product as never))
}

export async function getUserOrders(userId: string): Promise<OrderDTO[]> {
  await dbConnect()
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean()
  return orders.map((o) => toOrderDTO(o as never))
}

export async function getOrder(id: string): Promise<OrderDTO | null> {
  if (!id || typeof id !== "string") return null
  await dbConnect()
  const order = mongoose.isValidObjectId(id)
    ? await Order.findById(id).lean()
    : await Order.findOne({ orderNo: id }).lean()
  return order ? toOrderDTO(order as never) : null
}

export async function getCoupons(): Promise<CouponDTO[]> {
  await dbConnect()
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()
  return coupons.map((c) => toCouponDTO(c as never))
}

export async function getNotifications(userId: string) {
  await dbConnect()
  const items = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean()
  return items.map((n) => ({
    id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message ?? "",
    orderId: n.orderId ?? null,
    read: n.read ?? false,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function getAdminNotifications() {
  await dbConnect()
  const items = await Notification.find({ forAdmin: true }).sort({ createdAt: -1 }).limit(50).lean()
  return items.map((n) => ({
    id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message ?? "",
    orderId: n.orderId ?? null,
    read: n.read ?? false,
    createdAt: n.createdAt.toISOString(),
  }))
}
