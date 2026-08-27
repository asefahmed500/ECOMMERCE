"use client"

import * as React from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import type { ProductDTO } from "@/lib/types"

export function ProductPurchase({ product }: { product: ProductDTO }) {
  const cart = useCart()
  const [qty, setQty] = React.useState(1)
  const max = Math.max(1, product.stock)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3 rounded-full bg-muted px-2 py-1">
        <button
          type="button"
          aria-label="Decrease quantity"
          className="flex size-6 items-center justify-center rounded-full bg-background text-xs font-semibold shadow-sm hover:text-brand-deep"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
        >
          <Minus className="size-3" />
        </button>
        <span className="min-w-5 text-center text-sm font-semibold">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          className="flex size-6 items-center justify-center rounded-full bg-background text-xs font-semibold shadow-sm hover:text-brand-deep"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={qty >= max}
        >
          <Plus className="size-3" />
        </button>
      </div>

      <Button
        size="lg"
        disabled={product.stock <= 0}
        onClick={() =>
          cart.add(
            {
              id: product.id,
              name: product.name,
              sub: product.sub,
              price: product.price,
              image: product.image,
            },
            qty
          )
        }
        className="rounded-full bg-brand-gradient px-8 font-semibold text-white shadow-brand"
      >
        <ShoppingCart className="size-4" />
        {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
      </Button>
    </div>
  )
}
