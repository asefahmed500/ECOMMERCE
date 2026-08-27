import { Logo } from "@/components/logo"
import { CartSheet } from "@/components/cart-sheet"

export const metadata = { title: "Checkout · ecomi" }

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <Logo />
          <p className="text-xs text-muted-foreground">Secure Checkout</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-8">{children}</main>
      <CartSheet />
    </div>
  )
}
