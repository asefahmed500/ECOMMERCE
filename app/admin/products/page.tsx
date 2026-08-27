import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { ProductsManager } from "@/components/admin/products-manager"
import { AdminPagination } from "@/components/admin/pagination"
import { getProductsPage } from "@/lib/queries"
import { CATEGORIES } from "@/lib/format"

export const metadata = { title: "Products · ecomi Admin" }

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const isNew = sp.new === "1"
  const q = typeof sp.q === "string" ? sp.q.trim() : ""
  const category = typeof sp.category === "string" ? sp.category : "All"
  const page = Number(typeof sp.page === "string" ? sp.page : "") || 1

  const data = await getProductsPage({ q: q || undefined, category, page, pageSize: 10 })

  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (category && category !== "All") params.set("category", category)
    if (p > 1) params.set("page", String(p))
    return `/admin/products${params.size ? `?${params.toString()}` : ""}`
  }

  return (
    <div>
      <PageHeader
        title="Product Inventory Management"
        description="Full catalog CRUD, SKU stock levels, and live storefront sync."
        actions={
          <Button render={<Link href="/admin/products?new=1" />} nativeButton={false} className="bg-brand-gradient text-white shadow-brand">
            <Plus className="size-3.5" />
            Add New Product
          </Button>
        }
      />

      <div className="rounded-xl border bg-card">
        <form action="/admin/products" method="get" className="flex flex-wrap items-center gap-2 border-b p-4">
          {isNew ? <input type="hidden" name="new" value="1" /> : null}
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search product name..." className="h-9 pl-9" />
          </div>
          <select
            name="category"
            defaultValue={category || "All"}
            className="h-9 rounded-lg border bg-transparent px-3 text-xs"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Apply Filters
          </Button>
          {(q || (category && category !== "All")) ? (
            <Link href={isNew ? "/admin/products?new=1" : "/admin/products"} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Reset
            </Link>
          ) : null}
        </form>

        <ProductsManager initial={data.products} openNew={isNew} />

        <AdminPagination page={data.page} pages={data.pages} total={data.total} buildHref={buildHref} />
      </div>
    </div>
  )
}
