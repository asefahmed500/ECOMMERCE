import Link from "next/link"
import { Bell, Package, Tag, Truck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { getCustomerSession } from "@/lib/auth"
import { getNotifications } from "@/lib/queries"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata = { title: "Notifications · ecomi" }

const TYPE_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  order: { icon: Package, tone: "bg-brand-light text-brand-deep" },
  "order-status": { icon: Truck, tone: "bg-amber-50 text-amber-600" },
  promo: { icon: Tag, tone: "bg-[#FAF5FF] text-[#7E22CE]" },
  system: { icon: Bell, tone: "bg-muted text-muted-foreground" },
}

export default async function NotificationsPage() {
  const user = await getCustomerSession()

  const items = await getNotifications(user.id)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" description="Order updates, promos, and store announcements." />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Bell className="size-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-muted-foreground">New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const meta = TYPE_ICONS[n.type] ?? TYPE_ICONS.system
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3.5 rounded-xl border bg-card p-4",
                  !n.read && "border-brand/30 bg-brand-light/40"
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    {!n.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" /> : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.message}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10.5px] text-muted-foreground/70">{formatDateTime(n.createdAt)}</span>
                    {n.orderId ? (
                      <Link href={`/account/orders/${encodeURIComponent(n.orderId)}`} className="text-[11px] font-semibold text-brand-deep hover:underline">
                        Track order →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
