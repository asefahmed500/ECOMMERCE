import Link from "next/link"
import { X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { OrdersManager, type OrdersManagerData } from "@/components/admin/orders-manager"
import { AdminPagination } from "@/components/admin/pagination"
import { getOrdersPage } from "@/lib/queries"
import { User, isValidObjectId } from "@/lib/models"
import dbConnect from "@/lib/db"

export const metadata = { title: "Fulfillment · ecomi Admin" }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const status = typeof sp.status === "string" ? sp.status : "all"
  const q = typeof sp.q === "string" ? sp.q : ""
  // Validate before it reaches Mongo — an arbitrary ?customer= string would
  // otherwise CastError inside the query and 500 the whole page.
  const customerId = typeof sp.customer === "string" && isValidObjectId(sp.customer) ? sp.customer : undefined
  const page = Number(typeof sp.page === "string" ? sp.page : "") || 1

  const [data] = await Promise.all([
    getOrdersPage({ status, customerId, page, pageSize: 12 }),
    dbConnect(),
  ])
  let customerLabel: string | null = null
  if (customerId) {
    const customer = await User.findById(customerId).select("name email").lean()
    customerLabel = customer ? `${customer.name} (${customer.email})` : null
  }

  function buildHref(next: { status?: string; customer?: string | undefined; page?: number }) {
    const params = new URLSearchParams()
    const s = next.status ?? status
    if (s && s !== "all") params.set("status", s)
    if (q) params.set("q", q)
    const c = next.customer !== undefined ? next.customer : customerId
    if (c) params.set("customer", c)
    const p = next.page ?? page
    if (p > 1) params.set("page", String(p))
    return `/admin/orders${params.size ? `?${params.toString()}` : ""}`
  }

  const managerData: OrdersManagerData = {
    orders: data.orders,
    counts: data.statusCounts,
    activeStatus: status,
  }

  return (
    <div>
      <PageHeader
        title="Orders & Fulfillment Pipelines"
        description="Status updates instantly notify the customer and advance their tracking timeline."
      />
      {customerId ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-light bg-brand-light/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Filtered by customer:</span>
          <span className="font-semibold text-brand-deep">{customerLabel ?? customerId}</span>
          <Link
            href={buildHref({ customer: "" })}
            className="ml-auto inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            Clear
          </Link>
        </div>
      ) : null}
      <div className="rounded-xl border bg-card">
        <OrdersManager initial={managerData} customerId={customerId} page={page} initialQuery={q} />
        <AdminPagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          buildHref={(p) => buildHref({ page: p })}
        />
      </div>
    </div>
  )
}
