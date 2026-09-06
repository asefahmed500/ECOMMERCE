"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import type { NotificationDTO } from "@/lib/types"
import { formatDateTime } from "@/lib/format"

export function NotificationsBell({ authed, isAdmin }: { authed: boolean; isAdmin?: boolean }) {
  const [items, setItems] = React.useState<NotificationDTO[]>([])
  const [unread, setUnread] = React.useState(0)
  const prevUnread = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!authed) return

    let active = true

    async function poll() {
      try {
        const res = await fetch("/api/notifications")
        if (!res.ok || !active) return
        const data = await res.json()
        setItems(data.items ?? [])
        setUnread(data.unread ?? 0)

        if (prevUnread.current !== null && data.unread > prevUnread.current && data.items?.[0]) {
          const latest = data.items[0] as NotificationDTO
          toast.add({ title: latest.title, description: latest.message, type: "info" })
        }
        prevUnread.current = data.unread ?? 0
      } catch {
        // offline — retry next cycle
      }
    }

    poll()
    const timer = setInterval(poll, 15000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [authed])

  async function markAllRead() {
    const prevItems = items
    const prevUnreadCount = unread
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      if (!res.ok) throw new Error()
    } catch {
      // Roll back the optimistic update so the badge stays truthful.
      setItems(prevItems)
      setUnread(prevUnreadCount)
      toast.add({ title: "Could not mark notifications as read", type: "error" })
    }
  }

  function openNotification(n: NotificationDTO) {
    if (!n.read) {
      // Fire-and-forget; the optimistic UI already highlights it as read.
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((u) => Math.max(0, u - 1))
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {})
    }
  }

  if (!authed) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          />
        }
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex min-w-4 size-4 items-center justify-center rounded-full bg-[#FF4D1C] text-[9px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 ? (
            <Button variant="ghost" size="xs" onClick={markAllRead}>
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            items.slice(0, 8).map((n) => (
              <Link
                key={n.id}
                href={
                  n.orderId
                    ? isAdmin
                      ? `/admin/orders?q=${encodeURIComponent(n.orderId)}`
                      : `/account/orders/${encodeURIComponent(n.orderId)}`
                    : isAdmin
                      ? "/admin/orders"
                      : "/notifications"
                }
                onClick={() => openNotification(n)}
                className={cn(
                  "block border-b px-3 py-2.5 transition last:border-b-0 hover:bg-muted/60",
                  !n.read && "bg-brand-light/60"
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.read ? "bg-border" : "bg-brand"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{n.title}</p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <Link
          href={isAdmin ? "/admin/orders" : "/notifications"}
          className="block px-3 py-2 text-center text-xs font-medium text-brand-deep hover:underline"
        >
          {isAdmin ? "View all orders" : "View all notifications"}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
