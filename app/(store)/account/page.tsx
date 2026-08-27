import Link from "next/link"
import { Award, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/page-header"
import { getCustomerSession } from "@/lib/auth"
import { getUserOrders } from "@/lib/queries"
import { formatCurrency, formatDate } from "@/lib/format"

export const metadata = { title: "My Account · ecomi" }

export default async function AccountPage() {
  const user = await getCustomerSession()

  const orders = await getUserOrders(user.id)
  const recent = orders.slice(0, 3)

  return (
    <div>
      <PageHeader title="Customer Profile & VIP Membership" />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personal details — mirrors reference account card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3.5">
              <Avatar className="size-12">
                <AvatarFallback className="bg-brand-gradient text-base font-semibold text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[15px] font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <p>
                <span className="font-semibold">Default Address:</span>{" "}
                {user.address.line1
                  ? `${user.address.line1}, ${user.address.city}, ${user.address.country}`
                  : "No address saved yet — add one at checkout."}
              </p>
              <p>
                <span className="font-semibold">Payment Linked:</span>{" "}
                {user.paymentMethod || "None (add at checkout)"}
              </p>
              <p>
                <span className="font-semibold">Total Orders:</span> {orders.length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VIP member card — mirrors .member-card */}
        <div className="relative overflow-hidden rounded-xl bg-[#18181B] p-5 text-white">
          <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-[radial-gradient(circle,rgba(255,107,44,0.4),transparent_70%)]" />
          <StatusBadge tone="info" className="mb-2 bg-white/20 text-white">
            {user.tier} Member
          </StatusBadge>
          <h3 className="relative mb-1 text-base font-semibold text-white">
            ${user.cashback.toFixed(2)} Cashback Balance
          </h3>
          <p className="relative mb-3 text-[11.5px] leading-relaxed text-white/75">
            You earn cashback on all orders and get free worldwide air delivery on orders over $50.
          </p>
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-foreground">
            <Award className="size-3.5 text-brand" />
            Auto-applied at checkout
          </span>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Recent Orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-deep hover:text-brand">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <p className="text-sm font-medium">No orders yet</p>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">Your first order is one click away.</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-2 text-xs font-semibold text-white shadow-brand"
            >
              Start Shopping <ArrowRight className="size-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 transition hover:border-brand/40 hover:shadow-card-hover"
              >
                <div>
                  <p className="text-[13px] font-semibold">Order {order.orderNo}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {formatDate(order.createdAt)} · {formatCurrency(order.total)} · {order.items.length} item
                    {order.items.length > 1 ? "s" : ""}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    order.status === "Delivered" ? "success" : order.status === "Shipped" ? "warning" : "info"
                  }
                >
                  {order.status === "Shipped" ? "In Transit" : order.status}
                </StatusBadge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
