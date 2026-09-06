import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Product, Wishlist, isValidObjectId } from "@/lib/models"
import { toProductDTO } from "@/lib/serialize"

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sub: z.string().trim().max(160),
    category: z.enum(["Fashion", "Beauty", "Electronics", "Wearables", "Bags"]),
    sku: z.string().trim().min(2).max(40),
    price: z.number().min(0).max(1_000_000),
    oldPrice: z.number().min(0).nullable(),
    sale: z.string().trim().max(20).nullable(),
    stock: z.number().int().min(0).max(100_000),
    image: z.union([z.literal(""), z.string().trim().url()]).optional(),
    swatches: z.array(z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/)).max(6),
    description: z.string().trim().max(2000),
    isFeatured: z.boolean(),
  })
  .partial()

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { id } = await ctx.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  await dbConnect()
  const product = await Product.findById(id).lean()
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  return NextResponse.json({ product: toProductDTO(product as never) })
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  try {
    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updates = { ...parsed.data }
    if (updates.image === "") delete updates.image

    await dbConnect()
    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean()
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    return NextResponse.json({ product: toProductDTO(product as never) })
  } catch (err) {
    const duplicate = err instanceof Error && err.message.includes("E11000")
    return NextResponse.json(
      { error: duplicate ? "A product with this SKU already exists" : "Could not update product" },
      { status: duplicate ? 409 : 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  await dbConnect()
  const deleted = await Product.findByIdAndDelete(id).lean()
  if (!deleted) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  // Orders denormalize product data, but wishlist rows reference the live id —
  // purge them so users never keep dangling saved items.
  await Wishlist.deleteMany({ product: id })
  return NextResponse.json({ ok: true })
}
