import { ArrowDown, ArrowUp, Award, Search, Send } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { AdminPagination } from "@/components/admin/pagination"
import { getCustomerStats } from "@/lib/queries"
import { formatCurrency, formatDate } from "@/lib/format"

export const metadata = { title: "Customers · ecomi Admin" }

const SORTS = [
  { key: "spent", label: "Lifetime Spend" },
  { key: "orders", label: "Total Orders" },
  { key: "avgOrder", label: "Avg Order Value" },
  { key: "recent", label: "Last Order" },
  { key: "name", label: "Name" },
]

function sortHref(q: string | undefined, page: number, key: string, currentSort: string | undefined) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  const baseKey = (currentSort ?? "").replace("-", "") || "spent"
  const next = baseKey === key && !(currentSort ?? "").startsWith("-") ? `-${key}` : key
  params.set("sort", next)
  if (page > 1) params.set("page", String(page))
  return `/admin/customers?${params.toString()}`
}

function sortIndicator(key: string, currentSort: string | undefined) {
  const active = (currentSort ?? "").replace("-", "") === key
  if (!active) return null
  return (currentSort ?? "").startsWith("-")
    ? <ArrowDown className="inline size-3 text-brand-deep" />
    : <ArrowUp className="inline size-3 text-brand-deep" />
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q.trim() : ""
  const sort = typeof sp.sort === "string" ? sp.sort : "spent"
  const page = Number(typeof sp.page === "string" ? sp.page : "") || 1

  const data = await getCustomerStats({ q: q || undefined, sort, page, pageSize: 10 })

  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (sort !== "spent") params.set("sort", sort)
    if (p > 1) params.set("page", String(p))
    return `/admin/customers${params.size ? `?${params.toString()}` : ""}`
  }

  return (
    <div>
      <PageHeader
        title="Customer CRM & VIP Retention"
        actions={
          <Button className="bg-brand-gradient text-white shadow-brand" type="button">
            <Send className="size-3.5" />
            Dispatch VIP Offers
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active Customers", value: String(data.summary.customers) },
          { label: "VIP Gold Tier", value: String(data.summary.vipGold), tone: "text-brand-deep" },
          { label: "Avg Lifetime Value", value: formatCurrency(data.summary.avgLtv) },
          { label: "Retention Rate", value: `${data.summary.retention}%`, tone: "text-success" },
        ].map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="px-5">
              <p className="text-[11.5px] text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-xl font-semibold ${s.tone ?? ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <form action="/admin/customers" method="get" className="flex items-center gap-2 border-b p-4">
          {sort !== "spent" ? <input type="hidden" name="sort" value={sort} /> : null}
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search customer name or email..."
              className="h-9 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={sortHref(q || undefined, 1, s.key, sort)}
                className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition ${
                  (sort.replace("-", "") || "spent") === s.key
                    ? "bg-brand-light font-semibold text-brand-deep"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.label}
                {sortIndicator(s.key, sort)}
              </Link>
            ))}
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Profile</TableHead>
              <TableHead>Email Contact</TableHead>
              <TableHead>Shipping Destination</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Lifetime Spend</TableHead>
              <TableHead>Avg Order</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Customer Since</TableHead>
              <TableHead>Loyalty Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7.5">
                      <AvatarFallback className="bg-brand-gradient text-[10px] font-semibold text-white">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.location}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders?customer=${c.id}`}
                    className="text-xs font-medium hover:text-brand-deep hover:underline"
                  >
                    {c.orders} orders
                  </Link>
                </TableCell>
                <TableCell className="text-xs font-semibold text-brand-deep">{formatCurrency(c.spent)}</TableCell>
                <TableCell className="text-xs tabular-nums">{formatCurrency(c.avgOrderValue)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.lastOrderAt ? formatDate(c.lastOrderAt) : "No orders yet"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(c.customerSince)}</TableCell>
                <TableCell>
                  <StatusBadge tone={c.tier === "VIP Gold" ? "info" : "neutral"}>
                    <Award className="size-3" />
                    {c.tier}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
            {data.customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-xs text-muted-foreground">
                  No customers match &ldquo;{q}&rdquo;.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <AdminPagination page={data.page} pages={data.pages} total={data.total} buildHref={buildHref} />
      </div>
    </div>
  )
}
