import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressTrack, ProgressIndicator, ProgressLabel } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { getAdminStats, getCategoryPerformance, getDailyRevenue, getProducts } from "@/lib/queries"
import { formatCurrency, formatDate } from "@/lib/format"

export const metadata = { title: "Analytics · ecomi Admin" }

export default async function AdminAnalyticsPage() {
  const [stats, products, categorySales, daily] = await Promise.all([
    getAdminStats(),
    getProducts(),
    getCategoryPerformance(),
    getDailyRevenue(14),
  ])

  const categories = [...new Set(products.map((p) => p.category))]
  const byCategory = categories.map((cat) => {
    const items = products.filter((p) => p.category === cat)
    const value = items.reduce((s, p) => s + p.price * p.stock, 0)
    return { cat, count: items.length, value }
  })
  const maxCatValue = Math.max(...byCategory.map((c) => c.value), 1)
  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const maxCategorySales = Math.max(...categorySales.map((c) => c.revenue), 1)

  return (
    <div>
      <PageHeader title="Store Analytics & Revenue Dynamics" description="Net revenue, category sales, and inventory value by segment." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Net Revenue (excl. cancelled)", value: formatCurrency(stats.revenue) },
          { label: "Average Order Value", value: formatCurrency(stats.avgOrder) },
          { label: "Inventory Value", value: formatCurrency(inventoryValue), tone: "text-brand-deep" },
          { label: "Orders per Customer", value: stats.customerCount ? `${(stats.totalOrders / stats.customerCount).toFixed(2)}x` : "—", tone: "text-success" },
        ].map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="px-5">
              <p className="text-[11.5px] text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-xl font-semibold ${s.tone ?? ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Net Revenue · Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-1.5">
              {daily.series.map((d) => (
                <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                  <span
                    className="rounded-t bg-brand-gradient transition group-hover:opacity-80"
                    style={{ height: `${Math.max(2, (d.revenue / daily.max) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-card px-2 py-1 text-[10px] shadow-md group-hover:block">
                    {formatDate(d.date)} · {formatCurrency(d.revenue)} ({d.orders})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Product Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySales.map((c) => (
              <Progress key={c.category} value={Math.round((c.revenue / maxCategorySales) * 100)}>
                <div className="flex w-full items-center justify-between gap-3">
                  <ProgressLabel className="text-xs">
                    {c.category} <span className="text-muted-foreground">· {c.units} units sold</span>
                  </ProgressLabel>
                  <span className="ml-auto text-xs font-semibold tabular-nums">{formatCurrency(c.revenue)}</span>
                </div>
                <ProgressTrack className="mt-1 h-2">
                  <ProgressIndicator className="bg-brand-gradient" />
                </ProgressTrack>
              </Progress>
            ))}
            {categorySales.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No sales recorded yet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inventory Value by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {byCategory.map((c) => (
              <Progress key={c.cat} value={Math.round((c.value / maxCatValue) * 100)}>
                <div className="flex w-full items-center justify-between gap-3">
                  <ProgressLabel className="text-xs">
                    {c.cat} <span className="text-muted-foreground">· {c.count} SKUs</span>
                  </ProgressLabel>
                  <span className="ml-auto text-xs font-semibold tabular-nums">{formatCurrency(c.value)}</span>
                </div>
                <ProgressTrack className="mt-1 h-2">
                  <ProgressIndicator className="bg-brand-gradient" />
                </ProgressTrack>
              </Progress>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
