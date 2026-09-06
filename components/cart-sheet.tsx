"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Lock, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/components/cart-provider"
import { formatCurrency } from "@/lib/format"

export function CartSheet() {
  const cart = useCart()
  const [promo, setPromo] = React.useState("")
  const [promoMsg, setPromoMsg] = React.useState<{ ok: boolean; text: string } | null>(null)
  const [applying, setApplying] = React.useState(false)

  async function applyPromo() {
    if (!promo.trim()) return
    setApplying(true)
    const result = await cart.applyCoupon(promo)
    setPromoMsg({ ok: result.ok, text: result.message })
    if (result.ok) setPromo("")
    setApplying(false)
  }

  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-sm font-semibold">My Cart ({cart.count})</SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-xs text-muted-foreground">Discover the Summer Drop and find your style.</p>
            <Button
              render={<Link href="/catalog" onClick={() => cart.setOpen(false)} />}
              nativeButton={false}
              className="mt-2 rounded-full bg-brand-gradient text-white shadow-brand"
            >
              Browse Catalog
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3.5 border-b py-4 last:border-b-0">
                  <Link
                    href={`/product/${item.id}`}
                    onClick={() => cart.setOpen(false)}
                    className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted"
                  >
                    {item.image ? <Image src={item.image} alt="" fill sizes="56px" className="object-cover" /> : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.id}`}
                        onClick={() => cart.setOpen(false)}
                        className="line-clamp-2 text-[13px] font-medium leading-snug hover:text-brand-deep"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        aria-label="Remove item"
                        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => cart.remove(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {item.sub ? (
                      <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{item.sub}</p>
                    ) : null}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[14px] font-semibold tabular-nums">{formatCurrency(item.price * item.qty)}</span>
                      <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1">
                        <button
                          type="button"
                          aria-label="Decrease"
                          className="flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition hover:bg-muted-foreground/10"
                          onClick={() => cart.setQty(item.id, item.qty - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-5 text-center text-[13px] font-semibold tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          className="flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition hover:bg-muted-foreground/10"
                          onClick={() => cart.setQty(item.id, item.qty + 1)}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo + Summary + Checkout */}
            <div className="space-y-3 border-t px-5 pt-4 pb-5">
              {/* Promo code */}
              <div className="flex gap-2">
                <Input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Promo Code (SAVE10 / ECOMI20)"
                  className="h-9 bg-muted text-xs"
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                />
                <Button size="sm" className="h-9 px-4" disabled={applying} onClick={applyPromo}>
                  Apply
                </Button>
              </div>
              {promoMsg ? (
                <p className={`text-[11px] ${promoMsg.ok ? "text-success" : "text-destructive"}`}>{promoMsg.text}</p>
              ) : cart.coupon && !cart.couponValid ? (
                <p className="text-[11px] text-destructive">
                  {cart.coupon.code} requires a ${cart.coupon.minOrder.toFixed(2)} minimum — add more items to use it.
                </p>
              ) : cart.coupon ? (
                <p className="text-[11px] text-success">{cart.coupon.code} applied — {cart.coupon.percent}% off</p>
              ) : null}

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-foreground">{formatCurrency(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 ? (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatCurrency(cart.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="tabular-nums text-foreground">
                    {cart.shipping === 0 ? "Free" : formatCurrency(cart.shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-[15px] font-semibold text-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(cart.total)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <Button
                render={<Link href="/checkout" onClick={() => cart.setOpen(false)} />}
                nativeButton={false}
                className="w-full rounded-full bg-brand-gradient py-3 text-[14px] font-semibold text-white shadow-brand"
              >
                <Lock className="size-3.5" />
                Checkout ({cart.count})
              </Button>

              {/* Payment methods + security */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                {["VISA", "Mastercard", "Apple Pay", "GPay"].map((p) => (
                  <span
                    key={p}
                    className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3" />
                256-bit Secure SSL Checkout
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
