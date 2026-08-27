"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"

function safeNextPath(raw: string | null) {
  if (!raw) return "/"
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/"
  return raw
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-hero-gradient">
          <p className="text-xs text-white/80">Loading sign up…</p>
        </div>
      }
    >
      <RegisterForm />
    </React.Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get("next"))
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Registration failed")
        return
      }
      toast.add({ title: `Welcome to ecomi, ${data.name}!`, type: "success" })
      router.push(next)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-gradient p-4">
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            <span className="flex size-7 items-center justify-center rounded-lg bg-white shadow">
              <Lock className="size-3.5 text-brand-deep" />
            </span>
            <span className="text-sm font-semibold text-white">Join ecomi</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-7 shadow-xl">
          <h1 className="mb-1 text-lg font-semibold tracking-tight">Create your account</h1>
          <p className="mb-5 text-xs text-muted-foreground">
            Shop the Summer Drop, earn VIP cashback, and track every order live.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Full Name
              </Label>
              <Input
                id="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alina Putri"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ecomi.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-9"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-full bg-brand-gradient font-semibold text-white shadow-brand"
            >
              <UserPlus className="size-4" />
              {pending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-brand-deep hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-5 flex justify-center">
          <Link href="/" className="text-xs font-medium text-white/90 hover:underline">
            ← Continue browsing the store
          </Link>
        </div>
      </div>
    </div>
  )
}
