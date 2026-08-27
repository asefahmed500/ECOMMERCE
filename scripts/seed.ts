/**
 * Seed the ecomi database with demo data.
 * Run: npx tsx --env-file=.env scripts/seed.ts
 */
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db"
import {
  Product,
  User,
  Order,
  Coupon,
  Counter,
  Notification,
  Wishlist,
  Setting,
} from "@/lib/models"

const PRODUCTS = [
  { id: 1, name: "Air Max 270 React Dynamic", sub: "Women's Performance Footwear", category: "Fashion", sku: "SKU-NK-10234", price: 129.99, oldPrice: 169.99, sale: "-25%", stock: 84, rating: 4.8, reviewsCount: 142, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", swatches: ["#FF6B2C", "#18181B", "#FFFFFF"], description: "Nike Air Max 270 React combines Nike's biggest heel Air unit with soft, springy Nike React foam for non-stop cushioning.", isFeatured: true },
  { id: 2, name: "Apple Watch Series 9 GPS", sub: "41mm Midnight Aluminum Case", category: "Wearables", sku: "SKU-AP-99201", price: 359.0, oldPrice: 449.0, sale: "-20%", stock: 24, rating: 4.9, reviewsCount: 98, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", swatches: ["#18181B", "#E4E4EA", "#F59E0B"], description: "Powerful sensors for health and fitness, brighter display, and magic double tap gestures.", isFeatured: true },
  { id: 3, name: "Chanel Chance Eau Tendre EDP", sub: "Floral Eau de Parfum 100ml", category: "Beauty", sku: "SKU-CH-88213", price: 89.99, oldPrice: 129.99, sale: "-30%", stock: 12, rating: 4.7, reviewsCount: 86, image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80", swatches: ["#FED7AA", "#F472B6"], description: "An enhanced floral-fruity fragrance with radiant, tender heart notes of Jasmine Absolute and Rose Essence.", isFeatured: true },
  { id: 4, name: "Sony WH-1000XM5 Wireless", sub: "Premium ANC Headset - Silver", category: "Electronics", sku: "SKU-SN-77301", price: 299.0, oldPrice: null, sale: null, stock: 56, rating: 4.9, reviewsCount: 176, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", swatches: ["#18181B", "#D1D5DB"], description: "Industry-leading noise cancellation optimized automatically based on wearing conditions.", isFeatured: true },
  { id: 5, name: "Oversized Merino Wool Knit", sub: "Beige Ribbed Relaxed Fit", category: "Fashion", sku: "SKU-AP-33201", price: 34.99, oldPrice: 45.0, sale: "-22%", stock: 92, rating: 4.8, reviewsCount: 65, image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80", swatches: ["#EDE3D8", "#18181B", "#B45309"], description: "Crafted with 100% natural ultra-soft Australian Merino wool for thermal regulation and all-day comfort.", isFeatured: false },
  { id: 6, name: "Minimalist Italian Leather Bag", sub: "Olive Green Shoulder Saddle", category: "Bags", sku: "SKU-BG-44192", price: 39.99, oldPrice: 49.99, sale: "-20%", stock: 8, rating: 4.9, reviewsCount: 42, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80", swatches: ["#5E6B4A", "#18181B", "#78350F"], description: "Handcrafted full-grain calfskin leather featuring custom brushed brass hardware.", isFeatured: true },
  { id: 7, name: "The Ordinary Niacinamide Serum", sub: "10% + Zinc 1%, 30ml Bottle", category: "Beauty", sku: "SKU-TO-88509", price: 6.75, oldPrice: 9.0, sale: "-25%", stock: 45, rating: 4.7, reviewsCount: 210, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80", swatches: ["#FFFFFF", "#F3F4F6"], description: "High-strength vitamin and mineral blemish formula that reduces skin blemishes and congestion.", isFeatured: false },
  { id: 8, name: "Fossil Gen 6 Hybrid Smartwatch", sub: "Black Silicone Strap & AMOLED", category: "Wearables", sku: "SKU-FS-90218", price: 215.1, oldPrice: 239.0, sale: "-10%", stock: 19, rating: 4.6, reviewsCount: 78, image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80", swatches: ["#18181B", "#4B5563"], description: "Combines the classic look of an analog watch with modern smartwatch notifications and heart-rate tracking.", isFeatured: false },
  { id: 9, name: "Ray-Ban Classic Polarized", sub: "Original Wayfarer Sunglasses", category: "Fashion", sku: "SKU-RB-11492", price: 155.0, oldPrice: 185.0, sale: "-16%", stock: 35, rating: 4.9, reviewsCount: 118, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80", swatches: ["#18181B", "#78350F"], description: "Timeless style that has made a statement across generations with UV400 polarized crystal lenses.", isFeatured: false },
  { id: 10, name: "Nike Air Force 1 '07", sub: "Triple White Classic Leather", category: "Fashion", sku: "SKU-NK-99411", price: 109.99, oldPrice: null, sale: null, stock: 62, rating: 4.9, reviewsCount: 380, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80", swatches: ["#FFFFFF", "#18181B"], description: "The radiance lives on in the Nike Air Force 1 '07, the b-ball icon that puts a fresh spin on crisp leather.", isFeatured: false },
  { id: 11, name: "Bose SoundLink Flex Bluetooth", sub: "IP67 Waterproof Outdoor Speaker", category: "Electronics", sku: "SKU-BS-55209", price: 149.0, oldPrice: 179.0, sale: "-17%", stock: 40, rating: 4.8, reviewsCount: 94, image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80", swatches: ["#18181B", "#3B82F6", "#FF6B2C"], description: "State-of-the-art PositionIQ technology automatically detects the speaker's orientation for optimal sound.", isFeatured: false },
  { id: 12, name: "Le Labo Santal 33 Fragrance", sub: "Signature Eau de Parfum 50ml", category: "Beauty", sku: "SKU-LL-33010", price: 195.0, oldPrice: null, sale: null, stock: 15, rating: 5.0, reviewsCount: 165, image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80", swatches: ["#FED7AA"], description: "An intoxicating aroma touching the sensual universality of this icon with cardamom, iris, and cedarwood.", isFeatured: false },
]

function daysAgo(n: number, hour = 10) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 24, 0, 0)
  return d
}

async function main() {
  console.log("Connecting to MongoDB...")
  await dbConnect()

  console.log("Clearing existing collections...")
  await Promise.all([
    Product.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({}),
    Coupon.deleteMany({}),
    Counter.deleteMany({}),
    Notification.deleteMany({}),
    Wishlist.deleteMany({}),
    Setting.deleteMany({}),
  ])

  console.log("Inserting products...")
  const products = await Product.insertMany(PRODUCTS.map(({ id: _id, ...p }) => p)) // eslint-disable-line @typescript-eslint/no-unused-vars
  const P = (i: number) => products[i]

  console.log("Inserting users...")
  const adminHash = await bcrypt.hash("admin123", 12)
  const customerHash = await bcrypt.hash("customer123", 12)

  const [, alina, dewi, rangga, siti] = await User.insertMany([
    {
      name: "Admin Manager",
      email: "admin@ecomi.com",
      passwordHash: adminHash,
      role: "admin",
    },
    {
      name: "Alina Putri",
      email: "alina.putri@ecomi.com",
      passwordHash: customerHash,
      role: "customer",
      tier: "VIP Gold",
      cashback: 142.5,
      address: { line1: "Sudirman Tower B #14-02", city: "Jakarta", country: "Indonesia", zip: "12190" },
      paymentMethod: "Visa ending in 4920",
    },
    {
      name: "Dewi Putri",
      email: "dewi.p@gmail.com",
      passwordHash: customerHash,
      role: "customer",
      tier: "VIP Gold",
      cashback: 38.2,
      address: { line1: "Kemang Raya 12", city: "Jakarta", country: "Indonesia", zip: "12730" },
    },
    {
      name: "Rangga Hidayat",
      email: "rangga.h@outlook.com",
      passwordHash: customerHash,
      role: "customer",
      tier: "VIP Silver",
      cashback: 12.9,
      address: { line1: "Dago Asri 88", city: "Bandung", country: "Indonesia", zip: "40135" },
    },
    {
      name: "Siti Nurhaliza",
      email: "siti.nur@yahoo.com",
      passwordHash: customerHash,
      role: "customer",
      tier: "VIP Gold",
      cashback: 210.4,
      address: { line1: "KLCC Avenue 3", city: "Kuala Lumpur", country: "Malaysia", zip: "50088" },
    },
  ])

  console.log("Inserting coupons...")
  await Coupon.insertMany([
    { code: "SAVE10", percent: 10, description: "10% OFF entire cart — storewide on orders over $40.", minOrder: 40, uses: 342, maxUses: 500, usedBy: [], expiry: daysAgo(-31), active: true },
    { code: "ECOMI20", percent: 20, description: "20% flash sale — special discount for VIP Club members. One use per customer.", minOrder: 60, uses: 189, maxUses: null, usedBy: [], expiry: daysAgo(-46), active: true },
  ])

  console.log("Inserting wishlist...")
  await Wishlist.insertMany([
    { user: alina._id, product: P(1)._id },
    { user: alina._id, product: P(3)._id },
    { user: alina._id, product: P(5)._id },
  ])

  console.log("Inserting orders...")
  const mkItem = (i: number, qty: number) => ({
    product: P(i)._id,
    name: P(i).name,
    image: P(i).image,
    price: P(i).price,
    qty,
  })

  const orderDefs: Array<{
    user: typeof alina | null
    guest?: { name: string; email: string }
    items: ReturnType<typeof mkItem>[]
    status: "Processing" | "Shipped" | "Delivered" | "Cancelled"
    placedAt: Date
    couponCode?: string
    discount?: number
  }> = [
    { user: alina, items: [mkItem(0, 2)], status: "Shipped", placedAt: daysAgo(2) },
    { user: alina, items: [mkItem(3, 1)], status: "Delivered", placedAt: daysAgo(3) },
    { user: dewi, items: [mkItem(0, 1), mkItem(6, 1)], status: "Delivered", placedAt: daysAgo(5), couponCode: "SAVE10", discount: 13.67 },
    { user: rangga, items: [mkItem(8, 1)], status: "Delivered", placedAt: daysAgo(7) },
    { user: siti, items: [mkItem(1, 1), mkItem(11, 1)], status: "Delivered", placedAt: daysAgo(9), couponCode: "ECOMI20", discount: 110.8 },
    { user: dewi, items: [mkItem(10, 1)], status: "Cancelled", placedAt: daysAgo(12) },
    { user: siti, items: [mkItem(2, 1)], status: "Delivered", placedAt: daysAgo(15) },
    { user: rangga, items: [mkItem(4, 2)], status: "Delivered", placedAt: daysAgo(18) },
    { user: dewi, items: [mkItem(7, 1)], status: "Delivered", placedAt: daysAgo(21) },
    { user: siti, items: [mkItem(9, 1)], status: "Delivered", placedAt: daysAgo(24) },
    { user: rangga, items: [mkItem(3, 1)], status: "Delivered", placedAt: daysAgo(27) },
    { user: dewi, items: [mkItem(11, 1)], status: "Delivered", placedAt: daysAgo(29) },
    { user: siti, items: [mkItem(5, 1)], status: "Shipped", placedAt: daysAgo(1) },
    { user: dewi, items: [mkItem(2, 2)], status: "Processing", placedAt: daysAgo(0, 9) },
    {
      user: null,
      guest: { name: "Marcus Chen", email: "marcus.chen@example.com" },
      items: [mkItem(3, 1)],
      status: "Processing",
      placedAt: daysAgo(0, 8),
    },
    {
      user: null,
      guest: { name: "Lena Wijaya", email: "lena.wijaya@example.com" },
      items: [mkItem(6, 2), mkItem(7, 1)],
      status: "Delivered",
      placedAt: daysAgo(6),
    },
  ]

  let seq = 9421
  for (const def of orderDefs) {
    const subtotal = def.items.reduce((s, it) => s + it.price * it.qty, 0)
    const discount = def.discount ?? 0
    const after = subtotal - discount
    const shipping = after > 50 ? 0 : 4.99
    const total = after + shipping
    const cancelled = def.status === "Cancelled"
    const history: Array<{ status: string; at: Date }> = [
      { status: "Ordered", at: def.placedAt },
      { status: "Processing", at: new Date(def.placedAt.getTime() + 1000 * 60 * 60 * 4) },
      {
        status: def.status,
        at: new Date(def.placedAt.getTime() + 1000 * 60 * 60 * 20),
      },
    ]
    await Order.create({
      orderNo: `ORD-${seq}`,
      user: def.user?._id ?? null,
      customerName: def.user?.name ?? def.guest!.name,
      guestEmail: def.user ? null : def.guest!.email,
      items: def.items,
      subtotal,
      discount,
      couponCode: def.couponCode ?? null,
      shipping,
      total,
      payment: cancelled ? "Refunded" : "Paid",
      status: def.status,
      trackingNo: `TRK-${88290000 + seq}`,
      courier: "DHL Express",
      shippingAddress: def.user?.address ?? { line1: "Sentral Mall 5", city: "Jakarta", country: "Indonesia", zip: "10350" },
      history,
      createdAt: def.placedAt,
      updatedAt: def.placedAt,
    })
    seq++
  }

  await Counter.findOneAndUpdate(
    { _id: "order" },
    { $setOnInsert: { _id: "order", seq: seq - 1 } },
    { upsert: true }
  )

  console.log("Inserting notifications...")
  await Notification.insertMany([
    {
      user: alina._id,
      type: "order-status",
      title: "Order #ORD-9421 is Shipped",
      message: "Your Air Max 270 React Dynamic is on its way via DHL Express. Tracking: TRK-8829421.",
      orderId: "ORD-9421",
      read: false,
    },
    {
      user: alina._id,
      type: "promo",
      title: "Summer Drop is live",
      message: "Up to 30% off selected SKUs — flash sale ends soon.",
      read: false,
    },
    {
      user: alina._id,
      type: "order",
      title: "Order #ORD-9422 Delivered",
      message: "Your Sony WH-1000XM5 Wireless was delivered. Enjoy!",
      orderId: "ORD-9422",
      read: true,
    },
    {
      forAdmin: true,
      type: "order",
      title: "New order #ORD-9434",
      message: "Dewi Putri placed an order of $185.73.",
      orderId: "ORD-9434",
      read: false,
    },
  ])

  await Setting.create({ key: "store" })

  console.log("Seed complete!")
  console.log("  Admin:    admin@ecomi.com / admin123")
  console.log("  Customer: alina.putri@ecomi.com / customer123")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
