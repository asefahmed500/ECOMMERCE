"use client"

import * as React from "react"
import Image from "next/image"
import { PackageSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge, PaymentBadge } from "@/components/status-badge"
import { OrderTimeline } from "@/components/order-timeline"
import { formatCurrency, formatDateTime } from "@/lib/format"
import type { OrderDTO } from "@/lib/types"

export function TrackOrderForm({ initialOrderNo }: { initialOrderNo?: string }) {
  const [orderNo, setOrderNo] = React.useState(initialOrderNo)
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [order, setOrder] = React.useState<OrderDTO | null>(null)

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setOrder(null)
        setError(data.error ?? "Could not look up the order")
        return
      }
      setOrder(data.order)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  if (order) {
    return (
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

          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex items-center gap-3">
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? <Image src={item.image} alt="" fill sizes="40px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {item.name} ×{item.qty}
                </span>
                <span className="text-xs font-semibold">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1 text-xs">
              <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Ship To</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.line1 || "—"}</p>
              <p className="text-muted-foreground">
                {[order.shippingAddress.city, order.shippingAddress.country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div className="space-y-1 text-xs">
              <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Summary</p>
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
              {order.trackingNo ? (
                <p className="pt-1.5 text-muted-foreground">
                  Tracking: <span className="font-mono text-[11px] text-foreground">{order.trackingNo}</span> ·{" "}
                  {order.courier}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setOrder(null)
                setError(null)
              }}
            >
              Track another order
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      {order === null && !error ? (
        <div className="mb-5 flex items-center gap-3 rounded-lg bg-muted/60 px-3.5 py-2.5">
          <PackageSearch className="size-4 shrink-0 text-brand-deep" />
          <p className="text-[11.5px] text-muted-foreground">
            Works for guest checkouts and member orders alike — use the order number from your confirmation email.
          </p>
        </div>
      ) : null}

      <form onSubmit={lookup} className="space-y-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-order" className="text-xs">Order Number</Label>
            <Input
              id="t-order"
              required
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="ORD-9421"
              className="h-9 font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-email" className="text-xs">Email Used at Checkout</Label>
            <Input
              id="t-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="h-9"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand-gradient py-2.5 text-[13px] font-semibold text-white shadow-brand"
        >
          {pending ? "Searching…" : "Track Order"}
        </Button>
      </form>
    </div>
  )
}
