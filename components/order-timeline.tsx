import { Ban, Check, Truck, PackageCheck, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { key: "Ordered", label: "Ordered", icon: Check },
  { key: "Processing", label: "Processing", icon: Package },
  { key: "Shipped", label: "In Transit", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: PackageCheck },
]

export function OrderTimeline({ status }: { status: string }) {
  if (status === "Cancelled") {
    return (
      <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-destructive/10 px-3.5 py-2.5">
        <Ban className="size-4 shrink-0 text-destructive" />
        <p className="text-[11.5px] font-medium text-destructive">
          This order was cancelled. Any reserved items were returned to stock.
        </p>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status)

  return (
    <div className="relative mt-4 flex justify-between">
      <div className="absolute top-3.5 right-6 left-6 h-0.5 bg-border" />
      {STEPS.map((step, i) => {
        const done = i < currentIdx
        const current = i === currentIdx
        const Icon = step.icon
        return (
          <div key={step.key} className="relative z-2 flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 bg-card text-[10px] font-semibold",
                done && "border-brand bg-brand text-white",
                current && "border-brand-deep text-brand-deep",
                !done && !current && "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3" /> : <Icon className="size-3" />}
            </span>
            <span
              className={cn(
                "text-[10.5px] font-medium",
                current ? "font-semibold text-brand-deep" : done ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
