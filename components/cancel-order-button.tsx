"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/format"

export function CancelOrderButton({
  orderId,
  orderNo,
  total,
}: {
  orderId: string
  orderNo: string
  total: number
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function confirmCancel() {
    if (pending) return
    setPending(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.add({ title: data.error ?? "Could not cancel the order", type: "error" })
        return
      }
      setOpen(false)
      toast.add({
        title: `Order ${orderNo} cancelled${data.payment === "Refunded" ? " — payment refunded" : ""}`,
        description: "Items were returned to stock.",
        type: "success",
      })
      router.refresh()
    } catch {
      toast.add({ title: "Network error — the order was not cancelled", type: "error" })
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) setOpen(v)
      }}
    >
      <Button variant="destructive" size="sm" type="button" onClick={() => setOpen(true)}>
        <XCircle className="size-3.5" />
        Cancel Order
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm">Cancel order {orderNo}?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            This will cancel your order of <strong>{formatCurrency(total)}</strong> and refund your payment. The
            items will be returned to stock and any promo code or cashback used will be restored to your account.
            You&apos;ll receive a confirmation email. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep Order</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmCancel}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Cancelling…" : "Cancel My Order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
