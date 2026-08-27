"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "@/components/ui/toast"

export function SettingsForm({
  initial,
}: {
  initial: { brandName: string; supportEmail: string; freeShippingThreshold: number; shippingFee: number }
}) {
  const router = useRouter()
  const [form, setForm] = React.useState({
    brandName: initial.brandName,
    supportEmail: initial.supportEmail,
    freeShippingThreshold: String(initial.freeShippingThreshold),
    shippingFee: String(initial.shippingFee),
  })
  const [pending, setPending] = React.useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: form.brandName,
          supportEmail: form.supportEmail,
          freeShippingThreshold: Number(form.freeShippingThreshold),
          shippingFee: Number(form.shippingFee),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.add({ title: data.error ?? "Save failed", type: "error" })
        return
      }
      toast.add({ title: "Settings saved successfully", type: "success" })
      router.refresh()
    } catch {
      toast.add({ title: "Network error", type: "error" })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="s-brand" className="text-xs">
          Store Brand Name
        </Label>
        <Input
          id="s-brand"
          required
          value={form.brandName}
          onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s-email" className="text-xs">
          Support Contact Email
        </Label>
        <Input
          id="s-email"
          type="email"
          required
          value={form.supportEmail}
          onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
          className="h-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="s-free" className="text-xs">
            Free Shipping Threshold ($)
          </Label>
          <Input
            id="s-free"
            type="number"
            min={0}
            step="0.01"
            value={form.freeShippingThreshold}
            onChange={(e) => setForm((f) => ({ ...f, freeShippingThreshold: e.target.value }))}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-fee" className="text-xs">
            Standard Shipping Fee ($)
          </Label>
          <Input
            id="s-fee"
            type="number"
            min={0}
            step="0.01"
            value={form.shippingFee}
            onChange={(e) => setForm((f) => ({ ...f, shippingFee: e.target.value }))}
            className="h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Payment Gateways Connected</Label>
        <div className="flex gap-2">
          <StatusBadge tone="success">
            <Check className="size-3" />
            Stripe (Simulated)
          </StatusBadge>
          <StatusBadge tone="success">
            <Check className="size-3" />
            Apple Pay (Simulated)
          </StatusBadge>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="bg-brand-gradient text-white shadow-brand">
        <CheckCircle2 className="size-3.5" />
        {pending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  )
}
