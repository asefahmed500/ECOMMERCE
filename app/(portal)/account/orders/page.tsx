import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { OrderStatusBadge } from "@/components/status-badge"
import { OrderTimeline } from "@/components/order-timeline"
import { PageHeader } from "@/components/page-header"
import { getCustomerSession } from "@/lib/auth"
import { getUserOrders } from "@/lib/queries"
import { formatCurrency, formatDate } from "@/lib/format"

export const metadata = { title: "My Orders · ecomi" }

export default async function OrdersPage() {
  const user = await getCustomerSession()

  const orders = await getUserOrders(user.id)

  return (
    <div>
      <PageHeader
        title="My Order History & Live Delivery Status"
        description="Track past purchases, live transit timeline, and invoices."
      />

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <p className="text-sm font-medium">No orders yet</p>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">Your purchases will appear here.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-2 text-xs font-semibold text-white shadow-brand"
          >
            Browse Catalog <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border bg-card p-4.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <Link href={`/account/orders/${order.id}`} className="text-[13px] font-semibold hover:text-brand-deep">
                    Order {order.orderNo}
                  </Link>
                  <span className="ml-2 text-[11.5px] text-muted-foreground">
                    Placed on {formatDate(order.createdAt)} · {formatCurrency(order.total)}
                  </span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex flex-wrap gap-3 py-3">
                {order.items.map((item, idx) => (
                  <Link
                    key={`${order.id}-${item.productId}-${idx}`}
                    href={`/product/${item.productId}`}
                    className="flex items-center gap-3"
                  >
                    <span className="relative size-12 overflow-hidden rounded-lg bg-muted">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold">
                        {item.name} (Qty: {item.qty})
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {order.status === "Shipped"
                          ? `Tracking #${order.trackingNo} · ${order.courier}`
                          : order.status === "Delivered"
                            ? `Delivered to ${order.shippingAddress.city || "your address"}`
                            : "Preparing for dispatch"}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              <OrderTimeline status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
