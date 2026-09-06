"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Search, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentBadge } from "@/components/status-badge"
import { OrderTimeline } from "@/components/order-timeline"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import type { OrderDTO } from "@/lib/types"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"

const PIPELINES = [
  { key: "all", label: "All Orders" },
  { key: "Processing", label: "Processing" },
  { key: "Shipped", label: "Shipped" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
]

const NEXT_STATUSES: Record<string, string[]> = {
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
}

export interface OrdersManagerData {
  orders: OrderDTO[]
  counts: Record<string, number>
  activeStatus: string
}

export function OrdersManager({
  initial,
  customerId,
  page,
  initialQuery = "",
}: {
  initial: OrdersManagerData
  customerId?: string
  page: number
  initialQuery?: string
}) {
  const router = useRouter()
  const [data, setData] = React.useState(initial)
  const [prevInitial, setPrevInitial] = React.useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setData(initial)
  }
  const [query, setQuery] = React.useState(initialQuery)
  const [updating, setUpdating] = React.useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = React.useState<OrderDTO | null>(null)
  const [detailOrder, setDetailOrder] = React.useState<OrderDTO | null>(null)

  function statusHref(status: string) {
    const params = new URLSearchParams()
    if (status !== "all") params.set("status", status)
    if (customerId) params.set("customer", customerId)
    if (page > 1) params.set("page", String(page))
    return `/admin/orders${params.size ? `?${params.toString()}` : ""}`
  }

  const q = query.trim().toLowerCase()
  const filtered = data.orders.filter((o) =>
    !q || [o.orderNo ?? "", o.customerName ?? ""].some((f) => f.toLowerCase().includes(q))
  )

  async function performStatusUpdate(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const resData = await res.json()
      if (!res.ok) {
        toast.add({ title: resData.error ?? "Update failed", type: "error" })
        return
      }
      toast.add({
        title:
          status === "Cancelled"
            ? `Order cancelled — stock restored${resData.payment === "Refunded" ? ", payment refunded" : ""}`
            : `Order marked ${status} — customer notified`,
        type: "success",
      })
      router.refresh()
    } catch {
      toast.add({ title: "Network error", type: "error" })
    } finally {
      setUpdating(null)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || updating) return
    const target = cancelTarget
    setCancelTarget(null)
    await performStatusUpdate(target.id, "Cancelled")
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b p-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {PIPELINES.map((p) => (
            <Link
              key={p.key}
              href={statusHref(p.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition",
                data.activeStatus === p.key
                  ? "bg-brand-light font-semibold text-brand-deep"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {p.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10.5px]",
                  data.activeStatus === p.key ? "bg-brand text-white" : "bg-muted-foreground/15"
                )}
              >
                {data.counts[p.key] ?? 0}
              </span>
            </Link>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter this page by order ID or customer..."
            className="h-9 pl-9"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items Ordered</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead className="text-right">Update Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((o) => {
            const options = NEXT_STATUSES[o.status] ?? []
            return (
              <TableRow key={o.id}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setDetailOrder(o)}
                    className="text-xs font-semibold hover:text-brand-deep hover:underline"
                  >
                    {o.orderNo}
                  </button>
                </TableCell>
                <TableCell className="text-xs">
                  {o.customerName}
                  {!o.userId && o.guestEmail ? (
                    <span className="block text-[10px] text-muted-foreground">Guest · {o.guestEmail}</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                <TableCell className="max-w-52 truncate text-xs text-muted-foreground">
                  {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                </TableCell>
                <TableCell className={cn("text-xs font-semibold", o.status === "Cancelled" && "text-muted-foreground line-through")}>
                  {formatCurrency(o.total)}
                </TableCell>
                <TableCell>
                  <PaymentBadge payment={o.payment} />
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      aria-label={`View details for ${o.orderNo}`}
                      onClick={() => setDetailOrder(o)}
                    >
                      <Eye className="size-3" />
                    </Button>
                    <Select
                      value={o.status}
                      onValueChange={(v) => {
                        if (v && v !== o.status) {
                          if (v === "Cancelled") setCancelTarget(o)
                          else performStatusUpdate(o.id, v)
                        }
                      }}
                      disabled={updating === o.id || options.length === 0}
                    >
                      <SelectTrigger size="sm" className="h-7 w-32 text-xs">
                        <Truck className="size-3" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.length === 0 ? (
                          <SelectItem value={o.status} disabled>
                            No transitions
                          </SelectItem>
                        ) : (
                          options.map((s) => (
                            <SelectItem key={s} value={s}>
                              Mark {s}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                No orders match this pipeline{query ? ` or "${query}"` : ""}.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      {/* Cancel confirmation — destructive, financial action gets an explicit dialog */}
      <AlertDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(v) => {
          if (!v) setCancelTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Cancel order {cancelTarget?.orderNo}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will cancel {cancelTarget?.customerName ? `"${cancelTarget.customerName}"'s` : "this"} order of{" "}
              <strong>{formatCurrency(cancelTarget?.total ?? 0)}</strong>. The purchased items will be returned to
              stock, the customer&apos;s coupon will be released for reuse
              {cancelTarget?.payment === "Paid" ? ", and the payment will be marked as refunded" : ""}. The customer
              is notified automatically. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={Boolean(updating)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {updating ? "Cancelling…" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order details */}
      <Dialog open={Boolean(detailOrder)} onOpenChange={(v) => !v && setDetailOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Order {detailOrder?.orderNo}</DialogTitle>
            <DialogDescription className="text-[11px]">
              Placed {detailOrder ? formatDateTime(detailOrder.createdAt) : ""} ·{" "}
              {detailOrder?.userId ? "Registered customer" : "Guest order"}
            </DialogDescription>
          </DialogHeader>
          {detailOrder ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={detailOrder.status} />
                <PaymentBadge payment={detailOrder.payment} />
              </div>

              <OrderTimeline status={detailOrder.status} />

              {detailOrder.status !== "Cancelled" ? null : (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[11px] font-medium text-destructive">
                  This order was cancelled — stock was restored and financial totals exclude it.
                </p>
              )}

              <div className="space-y-2">
                {detailOrder.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 flex-1 truncate">{item.name} ×{item.qty}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatCurrency(detailOrder.subtotal)}</span>
                </div>
                {detailOrder.discount > 0 ? (
                  <div className="flex justify-between text-success">
                    <span>Promo {detailOrder.couponCode}</span>
                    <span>-{formatCurrency(detailOrder.discount)}</span>
                  </div>
                ) : null}
                {detailOrder.cashbackApplied > 0 ? (
                  <div className="flex justify-between text-success">
                    <span>Cashback redeemed</span>
                    <span>-{formatCurrency(detailOrder.cashbackApplied)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-foreground">
                    {detailOrder.shipping === 0 ? "Free" : formatCurrency(detailOrder.shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(detailOrder.total)}</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Ship To
                  </p>
                  <p className="font-medium">{detailOrder.customerName}</p>
                  <p className="text-muted-foreground">{detailOrder.shippingAddress.line1 || "—"}</p>
                  <p className="text-muted-foreground">
                    {[detailOrder.shippingAddress.city, detailOrder.shippingAddress.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  {detailOrder.guestEmail ? (
                    <p className="mt-1 text-muted-foreground">{detailOrder.guestEmail}</p>
                  ) : null}
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Delivery
                  </p>
                  <p className="text-muted-foreground">{detailOrder.courier}</p>
                  {detailOrder.trackingNo ? (
                    <p className="font-mono text-[11px]">{detailOrder.trackingNo}</p>
                  ) : (
                    <p className="text-muted-foreground">No tracking number yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
