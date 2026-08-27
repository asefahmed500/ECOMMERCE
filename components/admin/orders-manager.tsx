"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Truck, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderStatusBadge, PaymentBadge } from "@/components/status-badge"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import type { OrderDTO } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format"

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
  buildHref,
}: {
  initial: OrdersManagerData
  buildHref: (next: { status?: string }) => string
}) {
  const router = useRouter()
  const [data, setData] = React.useState(initial)
  const [prevInitial, setPrevInitial] = React.useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setData(initial)
  }
  const [query, setQuery] = React.useState("")
  const [updating, setUpdating] = React.useState<string | null>(null)

  const filtered = data.orders.filter((o) =>
    [o.orderNo, o.customerName].some((f) => f.toLowerCase().includes(query.toLowerCase()))
  )

  async function updateStatus(id: string, status: string) {
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

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b p-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {PIPELINES.map((p) => (
            <Link
              key={p.key}
              href={buildHref({ status: p.key })}
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
                  <Link href={`/account/orders/${o.id}`} className="text-xs font-semibold hover:text-brand-deep">
                    {o.orderNo}
                  </Link>
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
                    <Select
                      value={o.status}
                      onValueChange={(v) => {
                        if (v && v !== o.status) updateStatus(o.id, v)
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
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      aria-label="Print"
                      onClick={() => window.print()}
                    >
                      <Package className="size-3" />
                    </Button>
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
    </div>
  )
}
