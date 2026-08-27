import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Wishlist } from "@/lib/models"

export async function GET() {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  await dbConnect()
  const items = await Wishlist.find({ user: guard.id }).populate("product").lean()
  return NextResponse.json({
    productIds: items.map((i) => String((i.product as { _id: unknown })._id)),
  })
}

const toggleSchema = z.object({ productId: z.string().min(1).max(64) })

export async function POST(request: NextRequest) {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  try {
    const parsed = toggleSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "productId required" }, { status: 400 })

    await dbConnect()
    const existing = await Wishlist.findOne({ user: guard.id, product: parsed.data.productId })
    if (existing) {
      await existing.deleteOne()
      return NextResponse.json({ wishlisted: false })
    }
    await Wishlist.create({ user: guard.id, product: parsed.data.productId })
    return NextResponse.json({ wishlisted: true })
  } catch {
    return NextResponse.json({ error: "Could not update wishlist" }, { status: 500 })
  }
}
