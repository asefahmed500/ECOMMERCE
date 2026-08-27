import Link from "next/link"
import { AtSign, Globe, MessageCircle, Send } from "lucide-react"
import { LogoMark } from "@/components/logo"
import { CATEGORIES } from "@/lib/format"

const LINK_GROUPS = [
  {
    label: "Shop",
    links: [
      { href: "/catalog", label: "All Items" },
      ...CATEGORIES.slice(0, 3).map((c) => ({ href: `/catalog?category=${encodeURIComponent(c)}`, label: c })),
      { href: "/catalog", label: "Deals of the Day" },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/account/orders", label: "My Orders" },
      { href: "/account/wishlist", label: "Saved Wishlist" },
      { href: "/notifications", label: "Notifications" },
    ],
  },
  {
    label: "Company",
    links: [
      { href: "/", label: "Home" },
      { href: "/login", label: "Sign In" },
      { href: "/register", label: "Create Account" },
    ],
  },
]

const SOCIALS = [
  { href: "https://instagram.com", label: "Instagram", Icon: Globe },
  { href: "https://twitter.com", label: "Twitter", Icon: AtSign },
  { href: "https://youtube.com", label: "YouTube", Icon: MessageCircle },
  { href: "mailto:support@ecomi.store", label: "Email", Icon: Send },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      {/* Wordmark centerpiece */}
      <div className="overflow-hidden px-6 pt-14 pb-10 text-center lg:pt-20">
        <LogoMark className="mx-auto mb-5 size-14 lg:size-16" />
        <p
          aria-hidden
          className="bg-hero-gradient bg-clip-text text-[22vw] leading-[0.85] font-extrabold tracking-tighter text-transparent select-none sm:text-[19vw] lg:text-[13rem]"
        >
          ecomi
        </p>
        <p className="mt-6 text-[12px] font-medium tracking-widest text-muted-foreground uppercase">
          Modern Commerce &amp; Product Suite
        </p>
      </div>

      {/* Supporting links */}
      <div className="border-t">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-6 py-12 sm:grid-cols-3 lg:grid-cols-5">
          {LINK_GROUPS.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <p className="mb-3 text-[10px] font-semibold tracking-widest text-brand uppercase">{group.label}</p>
              <ul className="space-y-2">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[12.5px] text-muted-foreground transition hover:text-brand-deep"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-1">
            <p className="mb-3 text-[10px] font-semibold tracking-widest text-brand uppercase">Follow</p>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition hover:-translate-y-0.5 hover:border-brand hover:text-brand-deep"
                >
                  <s.Icon className="size-4" />
                </Link>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              VIP support 24/7
              <br />
              support@ecomi.store
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-[11px] text-muted-foreground sm:flex-row">
          <p>© 2026 ecomi · All rights reserved</p>
          <div className="flex items-center gap-1.5">
            {["VISA", "Mastercard", "Apple Pay", "GPay"].map((p) => (
              <span key={p} className="rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-semibold">
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="transition hover:text-foreground">
              Privacy
            </Link>
            <Link href="/" className="transition hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
