import Link from "next/link"
import { Heart } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ProductCard } from "@/components/product-card"
import { getCustomerSession } from "@/lib/auth"
import { getWishlistProducts } from "@/lib/queries"

export const metadata = { title: "My Wishlist · ecomi" }

export default async function WishlistPage() {
  const user = await getCustomerSession()

  const products = await getWishlistProducts(user.id)

  return (
    <div>
      <PageHeader
        title="My Saved Wishlist"
        description="Items you've bookmarked for later purchase."
      />

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Heart className="size-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">Your wishlist is empty</p>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
            Tap the heart on any product to save it for later.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-2 text-xs font-semibold text-white shadow-brand"
          >
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} wishlisted authed />
          ))}
        </div>
      )}
    </div>
  )
}
