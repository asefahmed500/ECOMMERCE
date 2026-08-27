import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { z } from "zod"
import { getSession, guardResponse, requireApiUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Coupon, Counter, Notification, Order, Product, User } from "@/lib/models"
import { getStoreSettings } from "@/lib/queries"
import { toOrderDTO } from "@/lib/serialize"

const CASHBACK_RATES: Record<string, number> = {
  "VIP Gold": 0.05,
  "VIP Silver": 0.02,
  Regular: 0,
}

const ORDER_COUNTER_ID = "order"
const FIRST_ORDER_NO = 9421

const addressSchema = z.object({
  line1: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  zip: z.string().trim().max(20).optional().default(""),
})

const placeOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1) }))
    .min(1)
    .max(50),
  address: addressSchema,
  couponCode: z.string().trim().max(40).nullable().optional(),
  useCashback: z.boolean().optional().default(false),
  guestName: z.string().trim().max(80).optional(),
  guestEmail: z.string().trim().toLowerCase().email().optional(),
})

export async function GET() {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  await dbConnect()
  const cond = guard.role === "admin" ? {} : { user: guard.id }
  const orders = await Order.find(cond).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({ orders: orders.map((o) => toOrderDTO(o as never)) })
}

// Atomic sequential reservation: a shared counter row guarantees unique ORD-n
// values even under concurrent checkouts (unique index as backstop).
async function reserveOrderNo() {
  let counter = await Counter.findByIdAndUpdate(ORDER_COUNTER_ID, { $inc: { seq: 1 } }, { new: true })
  if (counter) return `ORD-${counter.seq}`
  try {
    await Counter.create({ _id: ORDER_COUNTER_ID, seq: FIRST_ORDER_NO - 1 })
  } catch (err) {
    if (!(err instanceof Error && err.message.includes("E11000"))) throw err
  }
  counter = await Counter.findByIdAndUpdate(ORDER_COUNTER_ID, { $inc: { seq: 1 } }, { new: true })
  return `ORD-${counter?.seq ?? FIRST_ORDER_NO}`
}

function discountValue(subtotal: number, percent: number) {
  return Math.round(subtotal * (percent / 100) * 100) / 100
}

async function decrementStock(items: Array<{ product: mongoose.Types.ObjectId; name: string; qty: number }>) {
  const succeeded: Array<{ id: mongoose.Types.ObjectId; qty: number }> = []
  for (const it of items) {
    const res = await Product.updateOne(
      { _id: it.product, stock: { $gte: it.qty } },
      { $inc: { stock: -it.qty } }
    )
    if (res.modifiedCount === 0) {
      for (const done of succeeded) {
        await Product.updateOne({ _id: done.id }, { $inc: { stock: done.qty } })
      }
      return { ok: false as const, failedItem: it.name }
    }
    succeeded.push({ id: it.product, qty: it.qty })
  }
  return { ok: true as const }
}

async function releaseCoupon(code: string, identity: string) {
  await Coupon.updateOne({ code }, { $inc: { uses: -1 }, $pull: { usedBy: identity } })
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  try {
    const parsed = placeOrderSchema.safeParse(await request.json())
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const field = issue?.path?.[0]
      const message =
        field === "guestEmail" || issue?.message === "Invalid email"
          ? "Enter a valid contact email"
          : "Your order details are incomplete or invalid"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const body = parsed.data
    const rawItems = body.items
    const address = body.address

    await dbConnect()
    const settings = await getStoreSettings()
    const freeThreshold = settings.freeShippingThreshold
    const shippingFee = settings.shippingFee

    // Re-price every line from the database — client prices are never trusted.
    const ids = [...new Set(rawItems.map((i) => i.productId))]
    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
      return NextResponse.json({ error: "A product in your cart is invalid" }, { status: 400 })
    }
    const products = await Product.find({ _id: { $in: ids } }).lean()
    const items: Array<{
      product: mongoose.Types.ObjectId
      name: string
      image: string
      price: number
      qty: number
    }> = []
    for (const raw of rawItems) {
      const product = products.find((p) => String(p._id) === raw.productId)
      if (!product) {
        return NextResponse.json({ error: "A product in your cart no longer exists" }, { status: 400 })
      }
      if ((product.stock ?? 0) < raw.qty) {
        return NextResponse.json(
          { error: `Only ${product.stock} left in stock for ${product.name}` },
          { status: 400 }
        )
      }
      items.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        qty: raw.qty,
      })
    }

    const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.qty, 0) * 100) / 100

    // Coupon entitlement
    let discount = 0
    let appliedCoupon: string | null = null
    const sessionUser = session ? await User.findById(session.id).lean() : null
    const couponIdentity =
      sessionUser?.email ?? (body.guestEmail ? `email:${body.guestEmail}` : null)

    if (body.couponCode) {
      const code = body.couponCode.toUpperCase()
      const coupon = await Coupon.findOne({ code }).lean()
      if (!coupon || !coupon.active || coupon.expiry < new Date()) {
        return NextResponse.json({ error: "The promo code is no longer valid" }, { status: 400 })
      }
      if (subtotal < (coupon.minOrder ?? 0)) {
        return NextResponse.json(
          { error: `Promo ${coupon.code} requires a minimum order of $${(coupon.minOrder ?? 0).toFixed(2)}` },
          { status: 400 }
        )
      }
      if (coupon.maxUses != null && coupon.maxUses > 0 && (coupon.uses ?? 0) >= coupon.maxUses) {
        return NextResponse.json({ error: `Promo ${coupon.code} has reached its usage limit` }, { status: 409 })
      }
      if (couponIdentity && (coupon.usedBy ?? []).includes(couponIdentity)) {
        return NextResponse.json(
          { error: `You have already redeemed promo ${coupon.code}. One use per customer.` },
          { status: 409 }
        )
      }
      discount = discountValue(subtotal, coupon.percent)
      appliedCoupon = coupon.code
    }

    const afterDiscount = subtotal - discount
    const shipping = afterDiscount > freeThreshold || afterDiscount === 0 ? 0 : shippingFee

    // Guest checkout never creates user accounts — the order carries the contact details.
    const isGuest = !sessionUser
    if (isGuest && (!body.guestName || !body.guestEmail)) {
      return NextResponse.json({ error: "Name and email are required for guest checkout" }, { status: 400 })
    }
    if (!isGuest && !sessionUser) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const cashbackAvailable = sessionUser?.cashback ?? 0
    const cashbackApplied = !isGuest && body.useCashback ? Math.min(cashbackAvailable, afterDiscount + shipping) : 0
    const total = Math.max(0, afterDiscount + shipping - cashbackApplied)
    if (total <= 0 && cashbackApplied === 0) {
      return NextResponse.json({ error: "Invalid order total" }, { status: 400 })
    }

    const orderNo = await reserveOrderNo()
    const trackingNo = `TRK-${Math.floor(80000000 + Math.random() * 19999999)}`
    const earnRate = sessionUser ? (CASHBACK_RATES[sessionUser.tier] ?? 0) : 0
    const cashbackEarned = Math.round(total * earnRate * 100) / 100
    const customerName = sessionUser?.name ?? body.guestName!

    const stockResult = await decrementStock(items)
    if (!stockResult.ok) {
      return NextResponse.json(
        { error: `Stock changed for ${stockResult.failedItem}. Please review your cart.` },
        { status: 409 }
      )
    }

    if (appliedCoupon) {
      const claim = await Coupon.updateOne(
        {
          code: appliedCoupon,
          $expr: {
            $not: [{ $and: [{ $gt: ["$maxUses", 0] }, { $gte: ["$uses", "$maxUses"] }] }],
          },
          ...(couponIdentity ? { usedBy: { $ne: couponIdentity } } : {}),
        },
        { $inc: { uses: 1 }, ...(couponIdentity ? { $addToSet: { usedBy: couponIdentity } } : {}) }
      )
      if (claim.modifiedCount === 0) {
        for (const it of items) {
          await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } })
        }
        const reason = await Coupon.findOne({ code: appliedCoupon }).lean()
        const message =
          reason && reason.maxUses != null && reason.maxUses > 0 && (reason.uses ?? 0) >= reason.maxUses
            ? `Promo ${appliedCoupon} has reached its usage limit`
            : `You have already redeemed promo ${appliedCoupon}. One use per customer.`
        return NextResponse.json({ error: message }, { status: 409 })
      }
    }

    let order
    try {
      order = await Order.create({
        orderNo,
        user: sessionUser?._id ?? null,
        customerName,
        guestEmail: isGuest ? body.guestEmail : null,
        items,
        subtotal,
        discount,
        couponCode: appliedCoupon,
        cashbackApplied,
        shipping,
        total,
        status: "Processing",
        trackingNo,
        courier: "DHL Express",
        shippingAddress: address,
        history: [
          { status: "Ordered", at: new Date() },
          { status: "Processing", at: new Date() },
        ],
      })
    } catch (err) {
      console.error("Order creation failed:", err)
      for (const it of items) {
        await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } })
      }
      if (appliedCoupon && couponIdentity) await releaseCoupon(appliedCoupon, couponIdentity)
      return NextResponse.json({ error: "Could not place order" }, { status: 500 })
    }

    if (!isGuest && sessionUser && (cashbackEarned !== 0 || cashbackApplied !== 0)) {
      await User.updateOne(
        { _id: sessionUser._id },
        { $inc: { cashback: cashbackEarned - cashbackApplied } }
      )
    }

    await Notification.create([
      {
        user: sessionUser?._id ?? null,
        type: "order",
        title: `Order ${orderNo} confirmed`,
        message: `Thank you ${customerName}! Your order of $${total.toFixed(2)} is confirmed and being prepared. Tracking: ${trackingNo}.`,
        orderId: orderNo,
      },
      {
        forAdmin: true,
        type: "order",
        title: `New order ${orderNo}`,
        message: `${customerName}${isGuest ? " (guest)" : ""} placed an order of $${total.toFixed(2)} (${items.reduce((s, i) => s + i.qty, 0)} items).`,
        orderId: orderNo,
      },
    ])

    return NextResponse.json(
      {
        ok: true,
        orderId: String(order._id),
        orderNo,
        orderStatus: "Processing",
        trackingNo,
        total,
        subtotal,
        discount,
        shipping,
        cashbackEarned,
        items,
        isGuest,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("Order placement error:", err)
    return NextResponse.json({ error: "Could not place order" }, { status: 500 })
  }
}
