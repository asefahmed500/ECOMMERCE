import Link from "next/link"
import { ArrowRight, Headphones, Layers, ShieldCheck, Shirt, Sparkle, Star, Truck, Watch, Briefcase, Zap, RotateCcw, CreditCard, Award, Radio, Smartphone, Gem, ShoppingBag, Wind } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { HeroCarousel } from "@/components/hero-carousel"
import { NewsletterSection } from "@/components/newsletter-section"
import { getSession } from "@/lib/auth"
import { getProducts, getWishlistIds } from "@/lib/queries"
import { CATEGORIES } from "@/lib/format"

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Fashion: Shirt,
  Beauty: Sparkle,
  Electronics: Headphones,
  Wearables: Watch,
  Bags: Briefcase,
}

const TESTIMONIALS = [
  { name: "Alina P.", role: "VIP Gold Member", text: "Absolutely love the quality! My Sony headphones arrived in 2 days. The cashback program is incredible.", rating: 5 },
  { name: "Dewi S.", role: "Fashion Lover", text: "The Italian leather bag exceeded my expectations. Premium craftsmanship at an unbeatable price.", rating: 5 },
  { name: "Rangga M.", role: "Tech Enthusiast", text: "Best shopping experience ever. The checkout was seamless and the Apple Watch works perfectly.", rating: 5 },
]

const BRANDS = [
  { name: "Sony", desc: "Premium audio & tech", Icon: Headphones },
  { name: "Apple", desc: "Innovation & design", Icon: Smartphone },
  { name: "Chanel", desc: "Luxury fragrances", Icon: Gem },
  { name: "Nike", desc: "Performance sportswear", Icon: ShoppingBag },
  { name: "Samsung", desc: "Smart technology", Icon: Radio },
  { name: "Dyson", desc: "Engineering excellence", Icon: Wind },
]

const FEATURES = [
  { icon: Truck, title: "Free Express Shipping", desc: "Complimentary priority shipping on all orders over $50. Worldwide DHL Express delivery." },
  { icon: ShieldCheck, title: "Authentic Guarantee", desc: "Every product is verified authentic. We partner directly with brands and authorized distributors." },
  { icon: Zap, title: "VIP Cashback Rewards", desc: "Earn up to 5% cashback on every purchase. Gold and Silver tiers unlock exclusive perks." },
  { icon: RotateCcw, title: "30-Day Easy Returns", desc: "Not satisfied? Return within 30 days for a full refund. No questions asked." },
  { icon: CreditCard, title: "Secure Payment", desc: "256-bit SSL encryption. Visa, Mastercard, Apple Pay, and Google Pay accepted." },
  { icon: Award, title: "Top-Rated Support", desc: "24/7 VIP concierge support. Our team responds within minutes, not hours." },
]

export default async function HomePage() {
  const user = await getSession()
  const [products, wishlist] = await Promise.all([
    getProducts(),
    user && user.role === "customer" ? getWishlistIds(user.id) : Promise.resolve([]),
  ])

  const featured = products.filter((p) => p.isFeatured).slice(0, 8)
  const deals = products.filter((p) => p.sale).slice(0, 4)
  const heroProducts = products.slice(0, 5)

  const productsByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    items: products.filter((p) => p.category === cat).slice(0, 4),
  })).filter((g) => g.items.length > 0)

  return (
    <div>
      {/* HERO CAROUSEL */}
      <HeroCarousel products={heroProducts} />

      {/* TRUST BADGES */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Truck, label: "Free Shipping", desc: "Orders over $50" },
          { icon: ShieldCheck, label: "Secure Checkout", desc: "256-bit SSL" },
          { icon: Zap, label: "VIP Cashback", desc: "Earn 5% every order" },
          { icon: Star, label: "Top Rated", desc: "4.9 from 2,400+ reviews" },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-card-hover">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-light">
              <b.icon className="size-4 text-brand-deep" />
            </span>
            <div>
              <p className="text-[12px] font-semibold">{b.label}</p>
              <p className="text-[10.5px] text-muted-foreground">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORIES */}
      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Shop by Category</h2>
        <div className="flex gap-4 overflow-x-auto pb-1">
          <Link href="/catalog" className="flex w-21 shrink-0 flex-col items-center gap-1.5">
            <span className="flex size-12 items-center justify-center rounded-full border bg-card transition hover:-translate-y-0.5 hover:border-brand hover:text-brand-deep">
              <Layers className="size-4.5" />
            </span>
            <span className="text-[11.5px] font-medium text-muted-foreground">All Items</span>
          </Link>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? Layers
            return (
              <Link key={cat} href={`/catalog?category=${encodeURIComponent(cat)}`} className="flex w-21 shrink-0 flex-col items-center gap-1.5">
                <span className="flex size-12 items-center justify-center rounded-full border bg-card transition hover:-translate-y-0.5 hover:border-brand hover:text-brand-deep">
                  <Icon className="size-4.5" />
                </span>
                <span className="text-[11.5px] font-medium text-muted-foreground">{cat}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* PROMOS */}
      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="flex min-h-32 flex-col justify-between rounded-xl border border-[#FED7AA] bg-[#FFF4ED] p-5 text-[#9A3412]">
          <div>
            <p className="text-[10px] font-semibold tracking-wide uppercase">Flash Sale</p>
            <h3 className="my-0.5 text-[15px] font-semibold">Limited Time Deals</h3>
            <p className="text-[11px] text-[#C2410C]">Up to 30% off selected SKUs</p>
          </div>
          <Link href="/catalog" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
            Shop now <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="flex min-h-32 flex-col justify-between rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 text-[#065F46]">
          <div>
            <p className="text-[10px] font-semibold tracking-wide uppercase">Free Shipping</p>
            <h3 className="my-0.5 text-[15px] font-semibold">On Orders Over $50</h3>
            <p className="text-[11px] text-[#047857]">Worldwide priority air dispatch</p>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
            <Truck className="size-3" /> Applied automatically at checkout
          </span>
        </div>
        <div className="flex min-h-32 flex-col justify-between rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] p-5 text-[#581C87]">
          <div>
            <p className="text-[10px] font-semibold tracking-wide uppercase">New Arrivals</p>
            <h3 className="my-0.5 text-[15px] font-semibold">Premium Summer Line</h3>
            <p className="text-[11px] text-[#7E22CE]">Authentic certified products</p>
          </div>
          <Link href="/catalog" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold">
            Explore <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* DEALS OF THE DAY */}
      {deals.length > 0 ? (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              <Zap className="mb-0.5 mr-1.5 inline size-4.5 text-[#F59E0B]" />
              Deals of the Day
            </h2>
            <Link href="/catalog" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-deep hover:text-brand">
              View All <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} wishlisted={wishlist.includes(p.id)} authed={Boolean(user)} />
            ))}
          </div>
        </div>
      ) : null}

      {/* FEATURED */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Featured Catalog</h2>
        <Link href="/catalog" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-deep hover:text-brand">
          View All Items <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} wishlisted={wishlist.includes(p.id)} authed={Boolean(user)} />
        ))}
      </div>

      {/* PRODUCTS BY CATEGORY */}
      {productsByCategory.map((group) => (
        <div key={group.category} className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">{group.category}</h2>
            <Link
              href={`/catalog?category=${encodeURIComponent(group.category)}`}
              className="flex items-center gap-1 text-[12.5px] font-medium text-brand-deep hover:text-brand"
            >
              View All <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {group.items.map((p) => (
              <ProductCard key={p.id} product={p} wishlisted={wishlist.includes(p.id)} authed={Boolean(user)} />
            ))}
          </div>
        </div>
      ))}

      {/* BRANDS */}
      <section className="mb-10 rounded-2xl border bg-card p-6 lg:p-8">
        <p className="mb-1 text-center text-[10.5px] font-semibold tracking-widest text-brand uppercase">Trusted Brands We Carry</p>
        <h2 className="mb-6 text-center text-lg font-semibold tracking-tight">Shop by Brand</h2>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {BRANDS.map((b) => (
            <Link
              key={b.name}
              href={`/catalog?q=${encodeURIComponent(b.name)}`}
              className="group flex flex-col items-center gap-2 opacity-50 transition hover:opacity-100"
            >
              <div className="flex size-16 items-center justify-center rounded-full border bg-white shadow-sm transition group-hover:shadow-md group-hover:scale-110">
                <b.Icon className="size-6 text-foreground" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <div className="mb-10">
        <p className="mb-1 text-center text-[10.5px] font-semibold tracking-widest text-brand uppercase">Testimonials</p>
        <h2 className="mb-6 text-center text-lg font-semibold tracking-tight">What Our Customers Say</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-light text-[10px] font-semibold text-brand-deep">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-[11.5px] font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY CHOOSE ECOMI — before footer */}
      <section className="mb-10 rounded-2xl border bg-card p-6 lg:p-8">
        <div className="mb-6 text-center">
          <p className="mb-1 text-[10.5px] font-semibold tracking-widest text-brand uppercase">Why Choose ecomi</p>
          <h2 className="text-lg font-semibold tracking-tight">The Premium Shopping Experience</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            We curate the finest products with unmatched service, so you can shop with confidence.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 rounded-xl bg-muted/50 p-4 transition hover:bg-muted/80">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-light">
                <f.icon className="size-4 text-brand-deep" />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold">{f.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <NewsletterSection />
    </div>
  )
}
