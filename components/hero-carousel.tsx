"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductDTO } from "@/lib/types"

export function HeroCarousel({ products }: { products: ProductDTO[] }) {
  const [idx, setIdx] = React.useState(0)

  React.useEffect(() => {
    if (products.length <= 1) return
    const id = setInterval(() => setIdx((i) => (i + 1) % products.length), 4000)
    return () => clearInterval(id)
  }, [products.length])

  if (products.length === 0) return null
  const safeIdx = idx % products.length
  const current = products[safeIdx]

  return (
    <section className="relative mb-10 grid min-h-[360px] overflow-hidden rounded-2xl bg-hero-gradient shadow-card-hover md:min-h-[400px] md:grid-cols-[1.2fr_0.8fr]">
      <div className="relative z-2 p-8 text-white lg:p-12">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
          Summer Drop 2026
        </span>
        <h1 className="mb-3 max-w-md text-[32px] leading-tight font-semibold tracking-tight text-white">
          Find Your Style, Love Your Look
        </h1>
        <p className="mb-6 max-w-sm text-[14px] leading-relaxed text-white/90">
          Discover high-performance sneakers, audio tech, fragrances, and luxury apparel curated for you.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/product/${current.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-brand-deep shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Shop Now
            <ArrowRight className="size-3" />
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3.5 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            View Catalog
          </Link>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-8 z-3 flex gap-1.5 lg:left-10">
          {products.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={cn("h-1.5 rounded-full transition-all", i === safeIdx ? "w-5 bg-white" : "size-1.5 bg-white/40")}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>

      {/* Product image */}
      <div className="relative hidden items-center justify-center pr-8 md:flex">
        <Link href={`/product/${current.id}`} key={current.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.image}
            alt={current.name}
            className="max-h-[260px] max-w-[280px] rounded-2xl border-[3px] border-white/45 object-cover shadow-2xl transition-all duration-500 hover:scale-105"
          />
        </Link>
      </div>
    </section>
  )
}
