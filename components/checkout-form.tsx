"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CheckCircle2, CreditCard, Lock, PackageCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/format"
import type { SessionUser } from "@/lib/types"

interface PlacedOrder {
  orderId: string
  orderNo: string
  trackingNo: string
  total: number
  subtotal: number
  discount: number
  shipping: number
  cashbackEarned: number
  items: Array<{ name: string; image: string; price: number; qty: number }>
  isGuest: boolean
}

export function CheckoutForm({ user }: { user: SessionUser | null }) {
  const cart = useCart()
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [orderSucceeded, setOrderSucceeded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [useCashback, setUseCashback] = React.useState(false)
  const [guestInfo, setGuestInfo] = React.useState({ name: "", email: "" })
  const [placed, setPlaced] = React.useState<PlacedOrder | null>(null)
  const [address, setAddress] = React.useState({
    line1: user?.address?.line1 || "",
    city: user?.address?.city || "",
    country: user?.address?.country || "",
    zip: user?.address?.zip || "",
  })
  const [card, setCard] = React.useState({ number: "4242 4242 4242 4242", expiry: "12/28", cvc: "123" })

  const isGuest = !user
  const cashbackValue = user ? Math.min(user.cashback, cart.total) : 0
  const finalTotal = Math.max(0, cart.total - (useCashback ? cashbackValue : 0))

  React.useEffect(() => {
    if (cart.hydrated && cart.items.length === 0 && !pending && !placed && !orderSucceeded) {
      router.replace("/catalog")
    }
  }, [cart.hydrated, cart.items.length, pending, placed, orderSucceeded, router])

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !cart.hydrated || cart.items.length === 0) return
    setPending(true)
    setError(null)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.id, qty: i.qty })),
          address,
          couponCode: cart.coupon && cart.couponValid ? cart.coupon.code : null,
          useCashback,
          guestName: guestInfo.name || undefined,
          guestEmail: guestInfo.email || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not place order")
        return
      }

      setOrderSucceeded(true)
      cart.clear()
      toast.add({
        title: "Order placed successfully!",
        description: `${data.orderNo} · ${formatCurrency(data.total)}${data.cashbackEarned ? ` · +$${data.cashbackEarned.toFixed(2)} cashback` : ""}`,
        type: "success",
      })

      if (data.isGuest) {
        setPlaced(data as PlacedOrder)
      } else {
        router.push(`/account/orders/${data.orderId}?placed=1`)
        router.refresh()
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/15">
          <PackageCheck className="size-7 text-success" />
        </span>
        <h2 className="text-lg font-semibold">Thanks for your order!</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Order <span className="font-mono font-semibold text-foreground">{placed.orderNo}</span> is confirmed and
          being prepared. A confirmation was sent to {guestInfo.email || "your email"}.
        </p>

        <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-left text-xs">
          {placed.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-0.5 text-muted-foreground">
              <span className="line-clamp-1">{item.name} ×{item.qty}</span>
              <span className="tabular-nums">{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
          {placed.discount > 0 ? (
            <div className="flex justify-between py-0.5 font-medium text-success">
              <span>Discount</span>
              <span>-{formatCurrency(placed.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between py-0.5">
            <span>Shipping</span>
            <span>{placed.shipping === 0 ? "Free" : formatCurrency(placed.shipping)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t pt-2 text-sm font-semibold text-foreground">
            <span>Total paid</span>
            <span>{formatCurrency(placed.total)}</span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Tracking number: <span className="font-mono font-medium text-foreground">{placed.trackingNo}</span> — save
          it to follow your delivery.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            render={<Link href={`/track?order=${placed.orderNo}`} />}
            nativeButton={false}
            variant="secondary"
          >
            Track This Order
          </Button>
          <Button render={<Link href="/catalog" />} nativeButton={false} className="rounded-full bg-brand-gradient px-8 font-semibold text-white shadow-brand">
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        {/* Guest info */}
        {isGuest ? (
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Contact Information</h2>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Enter your details to complete the order as a guest.
            </p>
            <div className="grid gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="guest-name" className="text-xs">Full Name</Label>
                <Input
                  id="guest-name"
                  required
                  value={guestInfo.name}
                  onChange={(e) => setGuestInfo((g) => ({ ...g, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-email" className="text-xs">Email Address</Label>
                <Input
                  id="guest-email"
                  type="email"
                  required
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo((g) => ({ ...g, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className="h-9"
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Shipping */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Shipping Address</h2>
          <div className="grid gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="line1" className="text-xs">Street Address</Label>
              <Input
                id="line1"
                required
                value={address.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                placeholder="Sudirman Tower B #14-02"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input
                  id="city"
                  required
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  placeholder="Jakarta"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip" className="text-xs">ZIP / Postal Code</Label>
                <Input
                  id="zip"
                  value={address.zip}
                  onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))}
                  placeholder="12190"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs">Country</Label>
              <Input
                id="country"
                required
                value={address.country}
                onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                placeholder="Indonesia"
                className="h-9"
              />
            </div>
          </div>
        </section>

        {/* Mock payment */}
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Payment</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Lock className="size-2.5" />
              Simulated gateway
            </span>
          </div>
          <div className="grid gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="card" className="text-xs">Card Number</Label>
              <div className="relative">
                <CreditCard className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  id="card"
                  required
                  value={card.number}
                  onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                  className="h-9 pl-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="expiry" className="text-xs">Expiry</Label>
                <Input
                  id="expiry"
                  required
                  value={card.expiry}
                  onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cvc" className="text-xs">CVC</Label>
                <Input
                  id="cvc"
                  required
                  value={card.cvc}
                  onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit space-y-3 rounded-xl border bg-card p-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <h2 className="text-sm font-semibold">Order Summary</h2>

        {!cart.hydrated ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-11 shrink-0 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? <Image src={item.image} alt="" fill sizes="44px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatCurrency(item.price)} x {item.qty}
                  </p>
                </div>
                <span className="text-xs font-semibold">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-foreground">{formatCurrency(cart.subtotal)}</span>
          </div>
          {cart.coupon && !cart.couponValid ? (
            <div className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive">
              Promo {cart.coupon.code} requires a ${cart.coupon.minOrder.toFixed(2)} minimum — add more items or it
              won&apos;t be applied to this order.
            </div>
          ) : cart.discount > 0 ? (
            <div className="flex justify-between text-success">
              <span>Promo {cart.coupon?.code}</span>
              <span>-{formatCurrency(cart.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-foreground">{cart.shipping === 0 ? "Free" : formatCurrency(cart.shipping)}</span>
          </div>
          {cashbackValue > 0 ? (
            <label className="mt-2 flex cursor-pointer items-center justify-between rounded-lg bg-muted/70 px-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-success" />
                Apply ${cashbackValue.toFixed(2)} cashback
              </span>
              <input
                type="checkbox"
                checked={useCashback}
                onChange={(e) => setUseCashback(e.target.checked)}
                className="size-4 accent-[#FF6B2C]"
              />
            </label>
          ) : null}
          <div className="flex justify-between border-t pt-2 text-sm font-semibold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={pending || !cart.hydrated || cart.items.length === 0}
          className="w-full rounded-full bg-brand-gradient py-3 text-[13.5px] font-semibold text-white shadow-brand"
        >
          <Lock className="size-3.5" />
          {pending ? "Processing payment..." : !cart.hydrated ? "Loading cart..." : `Pay ${formatCurrency(finalTotal)}`}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground">
          <ShieldCheck className="size-3" />
          256-bit Secure SSL Checkout
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {["VISA", "Mastercard", "Apple Pay", "GPay"].map((p) => (
            <span key={p} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{p}</span>
          ))}
        </div>
      </aside>
    </form>
  )
}
