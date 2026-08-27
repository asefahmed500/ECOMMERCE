"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function WishlistButton({
  productId,
  initial = false,
  authed,
  className,
}: {
  productId: string
  initial?: boolean
  authed: boolean
  className?: string
}) {
  const router = useRouter()
  const [active, setActive] = React.useState(initial)
  const [pending, setPending] = React.useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!authed) {
      toast.add({ title: "Sign in to save items", description: "Your wishlist is tied to your account.", type: "info" })
      router.push("/login?next=/account/wishlist")
      return
    }
    if (pending) return
    setPending(true)
    const next = !active
    setActive(next)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setActive(Boolean(data.wishlisted))
      toast.add({
        title: data.wishlisted ? "Saved to your Wishlist" : "Removed from Wishlist",
        type: "success",
      })
      router.refresh()
    } catch {
      setActive(!next)
      toast.add({ title: "Could not update wishlist", type: "error" })
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle wishlist"
      className={cn(
        "pointer-events-auto flex size-7 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm transition hover:scale-108 hover:text-red-500",
        active && "text-red-500",
        className
      )}
    >
      <Heart className={cn("size-3.5", active && "fill-current")} />
    </button>
  )
}
