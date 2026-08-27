import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { PageHeader } from "@/components/page-header"
import { getSession } from "@/lib/auth"
import { getProductsPage, getWishlistIds } from "@/lib/queries"
import { CATEGORIES } from "@/lib/format"
import { cn } from "@/lib/utils"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = sp.q
  const active = sp.category ?? "All"
  const page = Number(sp.page ?? "") || 1
  const user = await getSession()

  const [result, wishlist] = await Promise.all([
    getProductsPage({ q, category: active, page, pageSize: 12 }),
    user ? getWishlistIds(user.id) : Promise.resolve([]),
  ])

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (active !== "All") params.set("category", active)
    if (p > 1) params.set("page", String(p))
    return `/catalog${params.size ? `?${params.toString()}` : ""}`
  }

  return (
    <div>
      <PageHeader
        title="Explore Store Catalog"
        description="Filter by category and search the full collection."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...CATEGORIES].map((cat) => (
          <Link
            key={cat}
            href={`/catalog${cat === "All" ? (q ? `?q=${encodeURIComponent(q)}` : "") : `?category=${encodeURIComponent(cat)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              active === cat
                ? "border-brand bg-brand-light font-semibold text-brand-deep"
                : "bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground"
            )}
          >
            {cat === "All" ? "All Items" : cat}
          </Link>
        ))}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Showing {result.products.length} of {result.total} products
      </p>

      {result.products.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <p className="text-sm font-medium">No products found{q ? ` for "${q}"` : ""}</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search or category.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.products.map((p) => (
              <ProductCard key={p.id} product={p} wishlisted={wishlist.includes(p.id)} authed={Boolean(user)} />
            ))}
          </div>

          {result.pages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Catalog pages">
              <Link
                aria-label="Previous page"
                href={pageHref(Math.max(1, result.page - 1))}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border transition",
                  result.page <= 1
                    ? "pointer-events-none opacity-40"
                    : "bg-card hover:border-brand/40 hover:text-brand-deep"
                )}
              >
                <ChevronLeft className="size-4" />
              </Link>
              {Array.from({ length: Math.min(result.pages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(result.page - 3, result.pages - 6))
                const p = start + i
                if (p > result.pages) return null
                return (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border text-xs font-semibold transition",
                      p === result.page
                        ? "border-transparent bg-brand-gradient text-white shadow-brand"
                        : "bg-card text-muted-foreground hover:border-brand/40 hover:text-brand-deep"
                    )}
                  >
                    {p}
                  </Link>
                )
              })}
              <Link
                aria-label="Next page"
                href={pageHref(Math.min(result.pages, result.page + 1))}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border transition",
                  result.page >= result.pages
                    ? "pointer-events-none opacity-40"
                    : "bg-card hover:border-brand/40 hover:text-brand-deep"
                )}
              >
                <ChevronRight className="size-4" />
              </Link>
            </nav>
          ) : null}
        </>
      )}
    </div>
  )
}
