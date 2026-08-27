import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "danger" | "info" | "neutral"

const tones: Record<Tone, string> = {
  success: "bg-success-light text-success",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-brand-light text-brand-deep",
  neutral: "bg-muted text-muted-foreground",
}

export function StatusBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border-transparent px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}
    >
      {children}
    </Badge>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  if (status === "Delivered") return <StatusBadge tone="success">Delivered</StatusBadge>
  if (status === "Cancelled") return <StatusBadge tone="danger">Cancelled</StatusBadge>
  if (status === "Shipped") return <StatusBadge tone="warning">In Transit</StatusBadge>
  return <StatusBadge tone="info">Processing</StatusBadge>
}

export function PaymentBadge({ payment }: { payment: string }) {
  return <StatusBadge tone={payment === "Paid" ? "success" : "danger"}>{payment}</StatusBadge>
}

export function StockStatusBadge({ stock }: { stock: number }) {
  if (stock > 15) return <StatusBadge tone="success">In Stock</StatusBadge>
  if (stock > 0) return <StatusBadge tone="warning">Low Stock</StatusBadge>
  return <StatusBadge tone="danger">Out of Stock</StatusBadge>
}
