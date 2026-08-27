"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Heart,
  Headphones,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  PanelRight,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Tag,
  User,
  Users,
  Warehouse,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { SiteFooter } from "@/components/site-footer"
import { CartSheet } from "@/components/cart-sheet"
import { NotificationsBell } from "@/components/notifications-bell"
import { useCart } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import type { SessionUser, ProductDTO } from "@/lib/types"
import { formatCurrency } from "@/lib/format"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const CUSTOMER_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/catalog", label: "Catalog", icon: LayoutGrid },
]

const ACCOUNT_NAV: NavItem[] = [
  { href: "/account", label: "Account Overview", icon: User, exact: true },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/wishlist", label: "Saved Wishlist", icon: Heart },
  { href: "/catalog", label: "Continue Shopping", icon: LayoutGrid },
]

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products CRUD", icon: Boxes },
  { href: "/admin/orders", label: "Fulfillment", icon: PackageCheck },
  { href: "/admin/customers", label: "Customers CRM", icon: Users },
  { href: "/admin/inventory", label: "Inventory Hub", icon: Warehouse },
  { href: "/admin/coupons", label: "Coupons & Deals", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Store Settings", icon: Settings },
]

function NavLinks({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition",
              active
                ? "bg-brand-light font-semibold text-brand-deep"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-brand")} />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        )
      })}
    </nav>
  )
}

function TopNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[15px] font-medium whitespace-nowrap transition",
        active
          ? "bg-brand-light font-semibold text-brand-deep"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("size-4.5 shrink-0", active && "text-brand")} />
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  )
}

function SidebarBody({
  variant,
  collapsed,
  authed,
  onNavigate,
}: {
  variant: "customer" | "admin" | "account"
  collapsed: boolean
  authed?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    onNavigate?.()
    router.push("/")
    router.refresh()
  }

  const items = variant === "admin" ? ADMIN_NAV : variant === "account" ? ACCOUNT_NAV : CUSTOMER_NAV
  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 pb-4">
      <div
        className={cn(
          "mt-3 mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
          variant === "admin" ? "bg-brand-light text-brand-deep" : "bg-[#ECFDF5] text-[#047857]"
        )}
      >
        <Sparkles className="size-2.5" />
        {!collapsed ? <span>{variant === "admin" ? "Admin Portal" : "Customer Portal"}</span> : null}
      </div>

      {!collapsed ? (
        <p className="px-2.5 pb-1 text-[9.5px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
          {variant === "admin" ? "Admin Controls" : "My Account"}
        </p>
      ) : null}
      <NavLinks items={items} collapsed={collapsed} onNavigate={onNavigate} />

      <div className="mt-auto pt-4">
        {variant !== "admin" && !collapsed ? (
          <div className="mb-2 rounded-lg border border-[#FFDCCB] bg-brand-light px-3 py-2.5 text-center">
            <Headphones className="mx-auto mb-1 size-4 text-brand-deep" />
            <p className="text-[11px] font-semibold text-brand-deep">24/7 ecomi Care</p>
            <p className="text-[9.5px] text-muted-foreground">Instant VIP Concierge</p>
          </div>
        ) : null}

        {authed ? (
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[12.5px] font-medium text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed ? <span>Sign Out</span> : null}
          </button>
        ) : !collapsed ? (
          <Link
            href="/login"
            onClick={onNavigate}
            className="flex w-full items-center gap-2.5 rounded-lg bg-brand-gradient px-2.5 py-2 text-[12.5px] font-semibold text-white shadow-brand"
          >
            <LogIn className="size-4 shrink-0" />
            <span>Sign In</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function HeaderActions({ user, variant }: { user: SessionUser | null; variant: "customer" | "admin" }) {
  const cart = useCart()
  const router = useRouter()
  const authed = Boolean(user)

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
      <NotificationsBell authed={authed} />

      {variant === "customer" ? (
        <button
          type="button"
          aria-label="Open cart"
          onClick={() => cart.setOpen(true)}
          className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ShoppingCart className="size-4" />
          {cart.count > 0 ? (
            <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-[#FF4D1C] px-1 text-[9px] font-semibold text-white">
              {cart.count}
            </span>
          ) : null}
        </button>
      ) : null}

      {authed && user ? (
        <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border bg-card py-1 pr-2.5 pl-1 transition hover:bg-muted"
            />
          }
        >
              <Avatar className="size-6">
                <AvatarFallback className="bg-brand-gradient text-[10px] font-semibold text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-24 truncate text-xs font-medium md:inline">{user.name}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">
              <p className="font-medium">{user.name}</p>
              <p className="truncate text-[10.5px] font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role === "customer" ? (
              <>
                <DropdownMenuItem render={<Link href="/account" />}>
                  <User className="size-3.5" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/orders" />}>
                  <Package className="size-3.5" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/wishlist" />}>
                  <Heart className="size-3.5" />
                  Saved Wishlist
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem render={<Link href="/admin" />}>
                <LayoutDashboard className="size-3.5" />
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut className="size-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          size="sm"
          className="rounded-full bg-brand-gradient font-medium text-white shadow-brand"
        >
          <LogIn className="size-3.5" />
          Sign In
        </Button>
      )}
    </div>
  )
}

export function StoreShell({
  user,
  variant = "customer",
  children,
}: {
  user: SessionUser | null
  variant?: "customer" | "admin" | "account"
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "")
  const [results, setResults] = React.useState<ProductDTO[]>([])
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const searchBoxRef = React.useRef<HTMLDivElement>(null)

  const showSidebar = variant !== "customer"

  React.useEffect(() => {
    setCollapsed(localStorage.getItem("ecomi_sidebar_collapsed") === "1") // eslint-disable-line
  }, [])

  // Live search: debounced product lookup as the user types.
  React.useEffect(() => {
    const q = query.trim()
    const controller = new AbortController()
    const timer = setTimeout(
      async () => {
        if (q.length < 2) {
          setResults([])
          setSearching(false)
          return
        }
        setSearching(true)
        try {
          const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&pageSize=6`, {
            signal: controller.signal,
          })
          if (res.ok) {
            const data = await res.json()
            setResults(data.products ?? [])
          }
        } catch {
          // aborted or offline
        } finally {
          setSearching(false)
        }
      },
      q.length < 2 ? 0 : 250
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Close the suggestions panel when clicking outside of it.
  React.useEffect(() => {
    if (!searchOpen) return
    function onPointerDown(e: PointerEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [searchOpen])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("ecomi_sidebar_collapsed", prev ? "0" : "1")
      return !prev
    })
  }

  function clearSearch() {
    setQuery("")
    setResults([])
    setSearchOpen(false)
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    setSearchOpen(false)
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {showSidebar ? (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex",
            collapsed ? "w-16" : "w-52"
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b px-3 py-3.5">
            <Logo tag={variant === "admin" ? "Management" : "Storefront"} />
            {!collapsed ? (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                className="flex size-6 items-center justify-center rounded-md border text-muted-foreground transition hover:border-[#FFDCCB] hover:bg-brand-light hover:text-brand-deep"
              >
                <PanelRight className="size-3" />
              </button>
            ) : null}
          </div>
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="mx-auto mt-2 flex size-6 items-center justify-center rounded-md border text-muted-foreground transition hover:border-[#FFDCCB] hover:bg-brand-light hover:text-brand-deep"
            >
              <PanelRight className="size-3" />
            </button>
          ) : null}
          <SidebarBody variant={variant} collapsed={collapsed} authed={Boolean(user)} />
        </aside>
      ) : null}

      {/* Mobile sidebar */}
      {showSidebar ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 gap-0 p-0">
            <SheetHeader className="border-b px-3 py-3.5">
              <SheetTitle render={<div className="contents" />}>
                <Logo tag={variant === "admin" ? "Management" : "Storefront"} />
              </SheetTitle>
            </SheetHeader>
            <SidebarBody variant={variant} collapsed={false} authed={Boolean(user)} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : null}

      {/* Main column */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", showSidebar ? (collapsed ? "lg:pl-16" : "lg:pl-52") : "")}>
        {variant === "customer" ? (
        <header className="sticky top-0 z-30">
          {/* Main navbar â€” links left / logo center / links + actions right */}
          <div className="border-b bg-background/90 backdrop-blur">
            <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 lg:px-8">
              <div className="flex min-w-0 items-center gap-0.5 justify-self-start">
                {showSidebar ? (
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                    className="rounded-lg border p-2 lg:hidden"
                  >
                    <Menu className="size-4" />
                  </button>
                ) : null}
                {variant === "customer"
                  ? CUSTOMER_NAV.map((item) => <TopNavLink key={item.href} item={item} />)
                  : null}
              </div>

              <div className="min-w-0 justify-self-center px-1">
                <Logo />
              </div>

              <div className="flex min-w-0 items-center gap-1 justify-self-end">
                <HeaderActions user={user} variant={variant} />
              </div>
            </div>
          </div>

          {/* Sub-navbar search with live product suggestions */}
          <div className="border-b bg-muted/40 backdrop-blur">
            <form
              onSubmit={onSearch}
              className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 lg:px-8"
              role="search"
            >
              <div ref={searchBoxRef} className="relative w-full">
                <label
                  className={cn(
                    "flex h-9 w-full items-center gap-2.5 rounded-full border bg-card px-4 transition",
                    "focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/10"
                  )}
                >
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSearchOpen(true)
                    }}
                    onFocus={() => {
                      if (query.trim().length >= 2) setSearchOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") clearSearch()
                    }}
                    placeholder="Search products, brands, SKUâ€¦"
                    aria-label="Search products"
                    autoComplete="off"
                    className="h-full min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
                  />
                  {searching ? (
                    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                  ) : query ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={clearSearch}
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </label>

                {searchOpen && query.trim().length >= 2 ? (
                  <div className="absolute top-11 right-0 left-0 z-50 overflow-hidden rounded-xl border bg-card text-left shadow-card-hover">
                    {results.length > 0 ? (
                      <ul>
                        {results.map((p) => (
                          <li key={p.id}>
                            <Link
                              href={`/product/${p.id}`}
                              onClick={clearSearch}
                              className="flex items-center gap-3 px-3 py-2 transition hover:bg-muted"
                            >
                              <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-medium">{p.name}</span>
                                <span className="block truncate text-[10.5px] text-muted-foreground">
                                  {p.category} Â· {p.sku}
                                </span>
                              </span>
                              {p.sale ? (
                                <span className="shrink-0 rounded-full bg-[#FF4D1C] px-1.5 py-px text-[9.5px] font-semibold text-white">
                                  {p.sale}
                                </span>
                              ) : null}
                              <span className="shrink-0 text-[11.5px] font-semibold tabular-nums">
                                {formatCurrency(p.price)}
                              </span>
                            </Link>
                          </li>
                        ))}
                        <li className="border-t">
                          <button
                            type="submit"
                            className="w-full px-4 py-2.5 text-center text-[11.5px] font-medium text-brand-deep transition hover:bg-brand-light/50"
                          >
                            See all results for &ldquo;{query.trim()}&rdquo;
                          </button>
                        </li>
                      </ul>
                    ) : searching ? (
                      <div className="flex items-center gap-2 px-4 py-3.5 text-xs text-muted-foreground">
                        <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
                        Searching productsâ€¦
                      </div>
                    ) : (
                      <p className="px-4 py-3.5 text-xs text-muted-foreground">
                        No products match &ldquo;{query.trim()}&rdquo;. Try a different keyword.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </header>
        ) : (
          <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur lg:hidden">
            <div className="flex h-12 items-center justify-between px-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="rounded-lg border p-2"
              >
                <Menu className="size-4" />
              </button>
              <Logo />
              <span className="size-9" aria-hidden />
            </div>
          </header>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">{children}</main>

        {variant === "customer" ? <SiteFooter /> : null}
      </div>

      {variant === "customer" ? <CartSheet /> : null}
    </div>
  )
}
