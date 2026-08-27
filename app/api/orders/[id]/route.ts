import { NextRequest, NextResponse } from "next/server"
import { guardResponse, requireApiUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Order } from "@/lib/models"
import { toOrderDTO } from "@/lib/serialize"

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  await dbConnect()
  const order = await Order.findById(id).lean()
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const isOwner = order.user != null && String(order.user) === guard.id
  if (!isOwner && guard.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ order: toOrderDTO(order as never) })
}
