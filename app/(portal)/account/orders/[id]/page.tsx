import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { CheckCircle2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge, PaymentBadge } from "@/components/status-badge"
import { OrderTimeline } from "@/components/order-timeline"
import { PrintButton } from "@/components/print-button"
import { CancelOrderButton } from "@/components/cancel-order-button"
import { getCustomerSession } from "@/lib/auth"
import { getOrder } from "@/lib/queries"
import { formatCurrency, formatDateTime } from "@/lib/format"

export const metadata = { title: "Order Details · ecomi" }

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ placed?: string }>
}) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams])
  const user = await getCustomerSession()

  const order = await getOrder(id)
  if (!order) notFound()
  if (order.userId !== user.id && user.role !== "admin") notFound()

  return (
    <div className="mx-auto max-w-3xl">
      {placed === "1" ? (
        <div className="mb-6 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
            <CheckCircle2 className="size-6 text-success" />
          </span>
          <h1 className="text-lg font-semibold text-[#065F46]">Order confirmed — thank you!</h1>
          <p className="mt-1 text-xs leading-relaxed text-[#047857]">
            Order <strong>{order.orderNo}</strong> of <strong>{formatCurrency(order.total)}</strong> was placed
            successfully. A confirmation notification was sent to your bell, and you can track it live below.
            {order.trackingNo ? ` Tracking #: ${order.trackingNo} · ${order.courier}.` : ""}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Order {order.orderNo}</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Placed {formatDateTime(order.createdAt)} · {order.items.length} item
              {order.items.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge payment={order.payment} />
          </div>
        </div>

        <div className="p-5">
          <OrderTimeline status={order.status} />

          <Separator className="my-5" />

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <Link
                key={`${item.productId}-${idx}`}
                href={`/product/${item.productId}`}
                className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-muted/60"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{item.name}</span>
                  <span className="block text-[11px] text-muted-foreground">Qty {item.qty}</span>
                </span>
                <span className="text-xs font-semibold">{formatCurrency(item.price * item.qty)}</span>
              </Link>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1 text-xs">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Shipping Address
              </p>
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.line1}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}
                {order.shippingAddress.zip ? `, ${order.shippingAddress.zip}` : ""} · {order.shippingAddress.country}
              </p>
              {order.trackingNo ? (
                <p className="pt-1.5 text-muted-foreground">
                  Tracking: <span className="font-mono text-[11px] text-foreground">{order.trackingNo}</span> ·{" "}
                  {order.courier}
                </p>
              ) : null}
            </div>

            <div className="space-y-1 text-xs">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Payment Summary
              </p>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Promo {order.couponCode}</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              {order.cashbackApplied > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Cashback redeemed</span>
                  <span>-{formatCurrency(order.cashbackApplied)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-foreground">
                  {order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-sm font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            <Button render={<Link href="/account/orders" />} nativeButton={false} variant="secondary" size="sm">
              <Package className="size-3.5" />
              All Orders
            </Button>
            <PrintButton />
            {order.status === "Processing" ? (
              <CancelOrderButton orderId={order.id} orderNo={order.orderNo} total={order.total} />
            ) : null}
            <Button
              render={<Link href="/catalog" />}
              nativeButton={false}
              size="sm"
              className="bg-brand-gradient text-white shadow-brand"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
