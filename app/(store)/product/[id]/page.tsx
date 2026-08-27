import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Package, ShieldCheck, Star, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductPurchase } from "@/components/product-purchase"
import { WishlistButton } from "@/components/wishlist-button"
import { getSession } from "@/lib/auth"
import { getProduct, getProducts, getWishlistIds } from "@/lib/queries"
import { formatCurrency } from "@/lib/format"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const user = await getSession()
  const [wishlist, all] = await Promise.all([
    user ? getWishlistIds(user.id) : Promise.resolve([]),
    getProducts({ category: product.category }),
  ])
  const related = all.filter((p) => p.id !== product.id).slice(0, 4)

  return (
    <div>
      <Link href="/catalog" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand-deep">
        <ArrowLeft className="size-3.5" />
        Back to Catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* MEDIA — mirrors .inspector-media */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-muted/50 p-8">
          {product.sale ? (
            <span className="absolute top-4 left-4 rounded-full bg-[#FF4D1C] px-2.5 py-1 text-[11px] font-semibold text-white">
              {product.sale}
            </span>
          ) : null}
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt={product.name} className="size-full object-cover" />
          </div>
        </div>

        {/* INFO — mirrors .inspector-info */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <Badge className="mb-2 rounded-full bg-brand-light text-[10.5px] font-semibold text-brand-deep">
                {product.category}
              </Badge>
              <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <WishlistButton productId={product.id} initial={wishlist.includes(product.id)} authed={Boolean(user)} className="size-9" />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl font-semibold text-brand-deep">{formatCurrency(product.price)}</span>
            {product.oldPrice ? (
              <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.oldPrice)}</span>
            ) : null}
            {product.sale ? (
              <span className="rounded-full bg-[#FF4D1C] px-2 py-0.5 text-[11px] font-semibold text-white">
                {product.sale}
              </span>
            ) : null}
          </div>

          <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
            {product.description || "High-performance crafted item designed for style, durability, and daily comfort."}
          </p>

          <div className="mb-5 space-y-2 rounded-xl bg-muted/60 p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stock Availability</span>
              <span className="font-semibold">{product.stock > 0 ? `${product.stock} units in hub` : "Out of stock"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Rating</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                <Star className="size-3 fill-current" />
                {product.rating} ({product.reviewsCount} verified reviews)
              </span>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Colors:</span>
            {product.swatches.map((s) => (
              <span key={s} className="size-4 rounded-full border-2 border-white ring-1 ring-border" style={{ backgroundColor: s }} />
            ))}
          </div>

          <ProductPurchase product={product} />

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-3 text-center text-[10.5px] text-muted-foreground">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="size-4 text-brand" />
              Free shipping over $50
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand" />
              100% authentic
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Package className="size-4 text-brand" />
              30-day returns
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-4 text-base font-semibold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group flex flex-col gap-2 rounded-xl border bg-card p-3 transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-106"
                  />
                </div>
                <p className="line-clamp-1 text-xs font-medium">{p.name}</p>
                <p className="text-[13px] font-semibold text-brand-deep">{formatCurrency(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
