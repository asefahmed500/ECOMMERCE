import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { getAdminStats, getRecentOrders } from "@/lib/queries"
import { formatCurrency, formatDate } from "@/lib/format"

export const metadata = { title: "Overview · ecomi Admin" }

export default async function AdminOverviewPage() {
  const [stats, recent] = await Promise.all([getAdminStats(), getRecentOrders(5)])

  return (
    <div>
      <PageHeader
        title="Store Analytics Overview"
        description="Real-time business health, margins, and fulfillment pipelines."
        actions={
          <Button render={<Link href="/admin/products?new=1" />} nativeButton={false} className="bg-brand-gradient text-white shadow-brand">
            <Plus className="size-3.5" />
            Add New Product
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Net Revenue (excl. cancelled)", value: formatCurrency(stats.revenue), tone: "" },
          { label: "Paid Orders", value: String(stats.totalOrders), tone: "text-brand-deep" },
          { label: "Orders Today", value: String(stats.ordersToday), tone: "text-success" },
          { label: "Registered Customers", value: String(stats.customerCount), tone: "" },
        ].map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="px-5">
              <p className="text-[11.5px] text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-xl font-semibold ${s.tone}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Avg Order Value", count: stats.avgOrder, currency: true },
          { label: "Processing", count: stats.processing },
          { label: "Shipped", count: stats.shipped },
          { label: "Delivered", count: stats.delivered },
          { label: "Cancelled", count: stats.cancelled },
        ].map((p) => (
          <Card key={p.label} className="py-4">
            <CardContent className="px-5">
              <p className="text-[11.5px] text-muted-foreground">{p.currency ? p.label : `${p.label} Pipeline`}</p>
              <p className={`mt-1 text-xl font-semibold ${p.label === "Cancelled" ? "text-destructive" : ""}`}>
                {p.currency ? formatCurrency(p.count) : p.count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Recent Store Orders</CardTitle>
            <CardDescription className="text-[11px]">Latest customer activity</CardDescription>
          </div>
          <Button render={<Link href="/admin/orders" />} nativeButton={false} variant="secondary" size="sm">
            View All
          </Button>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-semibold">{o.orderNo}</TableCell>
                <TableCell>{o.customerName}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {o.items.reduce((s, i) => s + i.qty, 0)} units
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(o.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
