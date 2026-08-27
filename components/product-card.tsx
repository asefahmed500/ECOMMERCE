"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { WishlistButton } from "@/components/wishlist-button"
import type { ProductDTO } from "@/lib/types"
import { formatCurrency } from "@/lib/format"

export function ProductCard({
  product,
  wishlisted = false,
  authed = false,
}: {
  product: ProductDTO
  wishlisted?: boolean
  authed?: boolean
}) {
  const cart = useCart()
  const soldOut = product.stock <= 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-muted/60"
      >
        {product.sale ? (
          <span className="absolute top-2 left-2 z-10 rounded-full bg-[#FF4D1C] px-2 py-0.5 text-[10.5px] font-semibold text-white">
            {product.sale}
          </span>
        ) : null}
        <WishlistButton
          productId={product.id}
          initial={wishlisted}
          authed={authed}
          className="absolute top-2 right-2 z-10"
        />
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-106"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-1 text-[13px] font-medium hover:text-brand-deep"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
          <Star className="size-3 fill-amber-500 text-amber-500" />
          <span>
            {product.rating} ({product.reviewsCount})
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1.5">
          <span className="text-[15px] font-semibold">{formatCurrency(product.price)}</span>
          {product.oldPrice ? (
            <span className="text-[11.5px] text-muted-foreground line-through">
              {formatCurrency(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <div className="flex gap-1.5">
            {product.swatches.slice(0, 4).map((s) => (
              <span
                key={s}
                className="size-3 rounded-full border border-white ring-1 ring-border"
                style={{ backgroundColor: s }}
              />
            ))}
          </div>
          <Button
            size="icon-xs"
            disabled={soldOut}
            onClick={() =>
              cart.add({
                id: product.id,
                name: product.name,
                sub: product.sub,
                price: product.price,
                image: product.image,
              })
            }
            aria-label={soldOut ? "Out of stock" : "Add to cart"}
            className="rounded-full bg-brand-gradient text-white shadow-brand hover:scale-108 transition-transform disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
