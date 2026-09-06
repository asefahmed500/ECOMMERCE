import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Product } from "@/lib/models"
import { getProductsPage } from "@/lib/queries"
import { toProductDTO } from "@/lib/serialize"

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sub: z.string().trim().max(160).optional(),
  category: z.enum(["Fashion", "Beauty", "Electronics", "Wearables", "Bags"]),
  sku: z.string().trim().min(2).max(40),
  price: z.number().min(0).max(1_000_000),
  oldPrice: z.number().min(0).nullable().optional(),
  sale: z.string().trim().max(20).nullable().optional(),
  stock: z.number().int().min(0).max(100_000),
  image: z.union([z.literal(""), z.string().trim().url()]).optional().transform((v) => v || undefined),
  swatches: z.array(z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/)).max(6).optional(),
  description: z.string().trim().max(2000).optional(),
  isFeatured: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  const category = searchParams.get("category")?.trim()

  const result = await getProductsPage({ q, category })
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  try {
    const parsed = productSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const field = issue?.path?.[0]
      return NextResponse.json(
        { error: field ? `Invalid value for "${String(field)}"` : "Invalid product data" },
        { status: 400 }
      )
    }
    const body = parsed.data

    await dbConnect()
    const product = await Product.create({
      name: body.name,
      sub: body.sub || body.category,
      category: body.category,
      sku: body.sku,
      price: body.price,
      oldPrice: body.oldPrice ?? null,
      sale: body.sale ?? null,
      stock: body.stock,
      image: body.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      swatches: body.swatches?.length ? body.swatches : ["#FF6B2C"],
      description: body.description ?? "",
      isFeatured: body.isFeatured ?? false,
      rating: 5,
      reviewsCount: 0,
    })

    return NextResponse.json({ product: toProductDTO(product) }, { status: 201 })
  } catch (err) {
    const duplicate = err instanceof Error && err.message.includes("E11000")
    return NextResponse.json(
      { error: duplicate ? "A product with this SKU already exists" : "Could not create product" },
      { status: duplicate ? 409 : 500 }
    )
  }
}
