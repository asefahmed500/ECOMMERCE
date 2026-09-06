import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import { Order, User } from "@/lib/models"
import { toOrderDTO } from "@/lib/serialize"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const trackSchema = z.object({
  orderNo: z.string().trim().min(3).max(30),
  email: z.string().trim().toLowerCase().email().max(200),
})

// Guest order tracking: requires BOTH the order number and the contact email
// used on the order, so knowing an order number alone reveals nothing.
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "track"), 12, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  try {
    const parsed = trackSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter your order number and email" }, { status: 400 })
    }
    const orderNo = parsed.data.orderNo.toUpperCase()
    const email = parsed.data.email

    await dbConnect()
    const order = await Order.findOne({ orderNo }).lean()
    if (!order) {
      return NextResponse.json({ error: "No order found for those details" }, { status: 404 })
    }

    // The requester must match the order's contact: the guest email, or the
    // email of the registered customer who placed it.
    let authorized = (order.guestEmail ?? "").toLowerCase() === email
    if (!authorized && order.user) {
      const owner = await User.findById(order.user).select("email").lean()
      authorized = owner?.email === email
    }
    if (!authorized) {
      return NextResponse.json({ error: "No order found for those details" }, { status: 404 })
    }

    return NextResponse.json({ order: toOrderDTO(order as never) })
  } catch {
    return NextResponse.json({ error: "Could not look up the order" }, { status: 500 })
  }
}
