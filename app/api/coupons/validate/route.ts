import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Coupon } from "@/lib/models"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const validateSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().min(0).max(1_000_000),
})

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "coupon-validate"), 20, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { valid: false, message: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  try {
    const parsed = validateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ valid: false, message: "Enter a promo code" }, { status: 400 })
    }
    const code = parsed.data.code.toUpperCase()
    const subtotal = parsed.data.subtotal

    await dbConnect()
    const coupon = await Coupon.findOne({ code }).lean()

    // Never reveal whether a code exists — one generic rejection for all failures.
    if (!coupon || !coupon.active || coupon.expiry < new Date()) {
      return NextResponse.json({ valid: false, message: "This promo code is not valid" })
    }
    if (subtotal < (coupon.minOrder ?? 0)) {
      return NextResponse.json({
        valid: false,
        message: `Requires a minimum order of $${(coupon.minOrder ?? 0).toFixed(2)}`,
      })
    }
    if (coupon.maxUses != null && coupon.maxUses > 0 && (coupon.uses ?? 0) >= coupon.maxUses) {
      return NextResponse.json({ valid: false, message: "This promo code is no longer available" })
    }

    // Per-customer single redemption for logged-in shoppers.
    const session = await getSession()
    if (session && (coupon.usedBy ?? []).includes(session.email)) {
      return NextResponse.json({
        valid: false,
        message: "You have already redeemed this promo code",
      })
    }

    return NextResponse.json({ valid: true, percent: coupon.percent, code: coupon.code, minOrder: coupon.minOrder ?? 0 })
  } catch {
    return NextResponse.json({ valid: false, message: "Could not validate code" }, { status: 500 })
  }
}
