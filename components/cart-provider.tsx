"use client"

import * as React from "react"
import { toast } from "@/components/ui/toast"

export interface CartItem {
  id: string
  name: string
  sub: string
  price: number
  image: string
  qty: number
}

export interface AppliedCoupon {
  code: string
  percent: number
  minOrder: number
}

export const FREE_SHIPPING_THRESHOLD = 50
export const SHIPPING_FEE = 4.99

interface CartContextValue {
  items: CartItem[]
  coupon: AppliedCoupon | null
  open: boolean
  hydrated: boolean
  setOpen: (v: boolean) => void
  add: (item: Omit<CartItem, "qty">, qty?: number, silent?: boolean) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>
  clearCoupon: () => void
   subtotal: number
   discount: number
   shipping: number
   total: number
   count: number
   couponValid: boolean
 }

const CartContext = React.createContext<CartContextValue | null>(null)

const STORAGE_KEY = "ecomi_cart_v1"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [coupon, setCoupon] = React.useState<AppliedCoupon | null>(null)
  const [open, setOpen] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState(FREE_SHIPPING_THRESHOLD)
  const [shippingFee, setShippingFee] = React.useState(SHIPPING_FEE)

  React.useEffect(() => {
    // Sync from the external localStorage store on mount.
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.items)) setItems(parsed.items) // eslint-disable-line
        if (parsed.coupon) setCoupon(parsed.coupon)
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true)

    // Listen for storage events from other tabs to keep multiple tabs in sync
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue)
        if (Array.isArray(parsed.items)) setItems(parsed.items)
        setCoupon(parsed.coupon ?? null)
      } catch {
        // ignore malformed update
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.settings) {
          if (typeof data.settings.freeShippingThreshold === "number") {
            setFreeShippingThreshold(data.settings.freeShippingThreshold)
          }
          if (typeof data.settings.shippingFee === "number") setShippingFee(data.settings.shippingFee)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, coupon }))
  }, [items, coupon, hydrated])

  const add = React.useCallback(
    (item: Omit<CartItem, "qty">, qty = 1, silent = false) => {
      const safeQty = Math.max(1, Math.min(999, Math.floor(Number(qty)) || 1))
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id)
        if (existing) {
          return prev.map((i) => (i.id === item.id ? { ...i, qty: Math.min(999, i.qty + safeQty) } : i))
        }
        return [...prev, { ...item, qty: safeQty }]
      })
      if (!silent) {
        toast.add({ title: "Added to cart", description: item.name, type: "success" })
      }
    },
    []
  )

  const setQty = React.useCallback((id: string, qty: number) => {
    const safeQty = Math.floor(Number(qty))
    setItems((prev) =>
      !Number.isFinite(safeQty) || safeQty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty: Math.min(999, safeQty) } : i))
    )
  }, [])

  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clear = React.useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

  const applyCoupon = React.useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase()
      if (!trimmed) return { ok: false, message: "Enter a promo code" }
      const subtotalNow = items.reduce((s, i) => s + i.price * i.qty, 0)
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed, subtotal: subtotalNow }),
        })
        const data = await res.json()
        if (!res.ok || !data.valid) {
          setCoupon(null)
          return { ok: false, message: data.message ?? "Invalid promo code" }
        }
        setCoupon({ code: data.code ?? trimmed, percent: data.percent, minOrder: Number(data.minOrder) || 0 })
        return { ok: true, message: `Promo applied — ${data.percent}% off!` }
      } catch {
        return { ok: false, message: "Could not validate code. Try again." }
      }
    },
    [items]
  )

  const clearCoupon = React.useCallback(() => setCoupon(null), [])

  // Mirror the server's money math exactly (2dp rounding on the discount) so
  // the total the shopper approves is the total the order API charges.
  const round2 = (n: number) => Math.round(n * 100) / 100

  const { subtotal, discount, shipping, total, count, couponValid } = React.useMemo(() => {
    const sub = round2(items.reduce((s, i) => s + i.price * i.qty, 0))
    const valid = Boolean(coupon) && sub >= (coupon?.minOrder ?? 0)
    const disc = coupon && valid ? round2(sub * (coupon.percent / 100)) : 0
    const after = round2(sub - disc)
    const ship = after > freeShippingThreshold || after === 0 ? 0 : shippingFee
    return {
      subtotal: sub,
      discount: disc,
      shipping: ship,
      total: round2(after + ship),
      count: items.reduce((s, i) => s + i.qty, 0),
      couponValid: valid,
    }
  }, [items, coupon, freeShippingThreshold, shippingFee])

  const value = React.useMemo(
    () => ({
      items,
      coupon,
      open,
      hydrated,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      applyCoupon,
      clearCoupon,
      subtotal,
      discount,
      shipping,
      total,
      count,
      couponValid,
    }),
    [items, coupon, open, hydrated, add, setQty, remove, clear, applyCoupon, clearCoupon, subtotal, discount, shipping, total, count, couponValid]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
