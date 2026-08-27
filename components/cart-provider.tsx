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
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id)
        if (existing) {
          return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i))
        }
        return [...prev, { ...item, qty }]
      })
      if (!silent) {
        toast.add({ title: "Added to cart", description: item.name, type: "success" })
      }
    },
    []
  )

  const setQty = React.useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))
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
        setCoupon({ code: trimmed, percent: data.percent })
        return { ok: true, message: `Promo applied — ${data.percent}% off!` }
      } catch {
        return { ok: false, message: "Could not validate code. Try again." }
      }
    },
    [items]
  )

  const clearCoupon = React.useCallback(() => setCoupon(null), [])

  const { subtotal, discount, shipping, total, count } = React.useMemo(() => {
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0)
    const disc = coupon ? sub * (coupon.percent / 100) : 0
    const after = sub - disc
    const ship = after > freeShippingThreshold || after === 0 ? 0 : shippingFee
    return {
      subtotal: sub,
      discount: disc,
      shipping: ship,
      total: after + ship,
      count: items.reduce((s, i) => s + i.qty, 0),
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
    }),
    [items, coupon, open, hydrated, add, setQty, remove, clear, applyCoupon, clearCoupon, subtotal, discount, shipping, total, count]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
