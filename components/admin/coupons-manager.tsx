"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Plus, Power, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import type { CouponDTO } from "@/lib/types"
import { formatDate } from "@/lib/format"

function expiryLabel(iso: string) {
  const expired = new Date(iso) < new Date()
  return expired ? `Expired ${formatDate(iso)}` : `Valid until ${formatDate(iso)}`
}

export function CouponsManager({ initial }: { initial: CouponDTO[] }) {
  const router = useRouter()
  const [coupons, setCoupons] = React.useState(initial)
  const [prevInitial, setPrevInitial] = React.useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setCoupons(initial)
  }
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<CouponDTO | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [toggling, setToggling] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ code: "", percent: "10", minOrder: "0", maxUses: "", expiry: "", description: "" })

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          percent: Number(form.percent),
          minOrder: Number(form.minOrder),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiry: form.expiry,
          description: form.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.add({ title: data.error ?? "Create failed", type: "error" })
        return
      }
      setCoupons((prev) => [data.coupon, ...prev])
      setOpen(false)
      setForm({ code: "", percent: "10", minOrder: "0", maxUses: "", expiry: "", description: "" })
      toast.add({ title: `Voucher ${data.coupon.code} created`, type: "success" })
      router.refresh()
    } catch {
      toast.add({ title: "Network error", type: "error" })
    } finally {
      setPending(false)
    }
  }

  async function toggleActive(c: CouponDTO) {
    if (toggling) return
    setToggling(c.id)
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.add({ title: data.error ?? "Update failed", type: "error" })
        return
      }
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)))
      toast.add({ title: `${c.code} ${c.active ? "deactivated" : "activated"}`, type: "success" })
      router.refresh()
    } catch {
      toast.add({ title: "Network error — voucher status unchanged", type: "error" })
    } finally {
      setToggling(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return
    const target = deleteTarget
    setDeleting(true)
    try {
      const res = await fetch(`/api/coupons/${target.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.add({ title: data.error ?? "Delete failed", type: "error" })
        return
      }
      setDeleteTarget(null)
      setCoupons((prev) => prev.filter((x) => x.id !== target.id))
      toast.add({ title: `Voucher ${target.code} deleted`, type: "success" })
      router.refresh()
    } catch {
      toast.add({ title: "Network error — the voucher was not deleted", type: "error" })
    } finally {
      setDeleting(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
    toast.add({ title: `Voucher ${code} copied`, type: "success" })
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setOpen(true)} className="bg-brand-gradient text-white shadow-brand">
          <Plus className="size-3.5" />
          Create New Voucher
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {coupons.map((c) => {
          const expired = new Date(c.expiry) < new Date()
          const live = c.active && !expired
          return (
            <div
              key={c.id}
              className={cn(
                "relative flex items-center justify-between gap-4 rounded-xl border-[1.5px] border-dashed border-brand bg-[#FFFBF9] p-5",
                !live && "opacity-60"
              )}
            >
              <div className="min-w-0">
                <span className="inline-block rounded-md bg-brand-light px-2.5 py-1 font-mono text-[15px] font-semibold tracking-wider text-brand-deep">
                  {c.code}
                </span>
                <h3 className="mt-2 text-[15px] font-semibold">{c.percent}% OFF Entire Cart</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {c.description || `Applicable storewide${c.minOrder ? ` on orders over $${c.minOrder}` : ""}.`}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {expiryLabel(c.expiry)} · {c.uses}
                  {c.maxUses ? ` / ${c.maxUses}` : ""} uses
                  {c.minOrder ? ` · Min $${c.minOrder}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => copyCode(c.code)}>
                  {copied === c.code ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied === c.code ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={toggling === c.id || deleting}
                  onClick={() => toggleActive(c)}
                >
                  <Power className="size-3.5" />
                  {toggling === c.id ? "Saving…" : c.active ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting || toggling === c.id}
                  onClick={() => setDeleteTarget(c)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          )
        })}
        {coupons.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed bg-card p-14 text-center text-xs text-muted-foreground">
            No vouchers yet — create your first flash deal.
          </div>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Create New Voucher</DialogTitle>
            <DialogDescription className="text-[11px]">
              Code is auto-uppercased. Customers apply it in the cart.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createCoupon} className="space-y-3.5" id="coupon-form">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-code" className="text-xs">
                  Code *
                </Label>
                <Input
                  id="c-code"
                  required
                  minLength={3}
                  maxLength={20}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER25"
                  className="h-9 font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-percent" className="text-xs">
                  Percent OFF *
                </Label>
                <Input
                  id="c-percent"
                  required
                  type="number"
                  min={1}
                  max={100}
                  value={form.percent}
                  onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-min" className="text-xs">
                  Min Order ($)
                </Label>
                <Input
                  id="c-min"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minOrder}
                  onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-max-uses" className="text-xs">
                  Max Total Uses
                </Label>
                <Input
                  id="c-max-uses"
                  type="number"
                  min={0}
                  step="1"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-expiry" className="text-xs">
                  Expiry Date *
                </Label>
                <Input
                  id="c-expiry"
                  required
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.expiry}
                  onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-desc" className="text-xs">
                  Description
                </Label>
                <Input
                  id="c-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Special discount for VIP Club members."
                  className="h-9"
                />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="coupon-form" disabled={pending} className="bg-brand-gradient text-white shadow-brand">
              {pending ? "Creating…" : "Create Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete voucher confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete voucher code?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Promo voucher &quot;{deleteTarget?.code}&quot; will be permanently deleted and can no longer be redeemed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
