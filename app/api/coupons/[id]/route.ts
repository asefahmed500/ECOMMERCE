import { NextRequest, NextResponse } from "next/server"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Coupon } from "@/lib/models"

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/coupons/[id]">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  try {
    const body = await request.json()
    await dbConnect()
    const coupon = await Coupon.findByIdAndUpdate(id, { active: Boolean(body.active) }, { new: true }).lean()
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    return NextResponse.json({ ok: true, active: coupon.active })
  } catch {
    return NextResponse.json({ error: "Could not update coupon" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/coupons/[id]">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  await dbConnect()
  const deleted = await Coupon.findByIdAndDelete(id).lean()
  if (!deleted) return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
