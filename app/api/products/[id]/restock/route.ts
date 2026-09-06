import { NextRequest, NextResponse } from "next/server"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Product, isValidObjectId } from "@/lib/models"

export async function POST(request: NextRequest, ctx: RouteContext<"/api/products/[id]/restock">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  let amount = 50
  try {
    const body = await request.json()
    if (body?.amount) amount = Number(body.amount)
  } catch {
    // default +50
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
    return NextResponse.json({ error: "Invalid restock amount" }, { status: 400 })
  }

  await dbConnect()
  const product = await Product.findByIdAndUpdate(id, { $inc: { stock: amount } }, { new: true }).lean()
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ stock: product.stock })
}
