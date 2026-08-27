import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Coupon } from "@/lib/models"
import { getCoupons } from "@/lib/queries"
import { toCouponDTO } from "@/lib/serialize"

const couponSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9]{3,20}$/, "Code must be 3-20 letters/numbers"),
  percent: z.number().int().min(1).max(100),
  description: z.string().trim().max(200).optional(),
  minOrder: z.number().min(0).max(1_000_000).optional(),
  maxUses: z.number().int().min(0).max(1_000_000).nullable().optional(),
  expiry: z.coerce.date(),
})

export async function GET() {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard
  const coupons = await getCoupons()
  return NextResponse.json({ coupons })
}

export async function POST(request: NextRequest) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  try {
    const parsed = couponSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid coupon data" },
        { status: 400 }
      )
    }
    const body = parsed.data

    await dbConnect()
    const coupon = await Coupon.create({
      code: body.code.toUpperCase(),
      percent: body.percent,
      description: body.description || `${body.percent}% OFF storewide.`,
      minOrder: body.minOrder ?? 0,
      maxUses: body.maxUses == null ? null : body.maxUses === 0 ? null : body.maxUses,
      expiry: body.expiry,
      active: true,
    })
    return NextResponse.json({ coupon: toCouponDTO(coupon) }, { status: 201 })
  } catch (err) {
    const duplicate = err instanceof Error && err.message.includes("E11000")
    return NextResponse.json(
      { error: duplicate ? "A coupon with this code already exists" : "Could not create coupon" },
      { status: duplicate ? 409 : 500 }
    )
  }
}
