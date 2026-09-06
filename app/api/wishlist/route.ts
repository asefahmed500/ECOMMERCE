import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Product, Wishlist, isValidObjectId } from "@/lib/models"

export async function GET() {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  await dbConnect()
  const items = await Wishlist.find({ user: guard.id }).populate("product").lean()
  const productIds = items
    .filter((i) => Boolean(i.product))
    .map((i) => String((i.product as { _id: unknown })._id))

  return NextResponse.json({ productIds })
}

const toggleSchema = z.object({ productId: z.string().min(1).max(64) })

export async function POST(request: NextRequest) {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  try {
    const parsed = toggleSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: "productId required" }, { status: 400 })
    const { productId } = parsed.data

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    await dbConnect()
    const productExists = await Product.exists({ _id: productId })
    if (!productExists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const existing = await Wishlist.findOne({ user: guard.id, product: productId })
    if (existing) {
      await existing.deleteOne()
      return NextResponse.json({ wishlisted: false })
    }

    try {
      await Wishlist.create({ user: guard.id, product: productId })
      return NextResponse.json({ wishlisted: true })
    } catch (err) {
      if (err instanceof Error && err.message.includes("E11000")) {
        return NextResponse.json({ wishlisted: true })
      }
      throw err
    }
  } catch {
    return NextResponse.json({ error: "Could not update wishlist" }, { status: 500 })
  }
}
