"use client"

import * as React from "react"
import { Mail } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !email.trim()) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Could not subscribe. Please try again.")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mb-10 rounded-2xl bg-hero-gradient p-8 text-center text-white">
      <Mail className="mx-auto mb-3 size-6" />
      <h2 className="mb-1.5 text-lg font-semibold">Join the VIP List</h2>
      <p className="mb-4 text-[12.5px] text-white/85">
        Get early access to drops, exclusive deals, and 5% cashback on your first order.
      </p>
      {submitted ? (
        <p className="text-[13px] font-medium">Thanks for subscribing — you&apos;re on the list!</p>
      ) : (
        <>
          <form className="mx-auto flex max-w-md gap-2" onSubmit={subscribe}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Email address"
              className="h-10 flex-1 rounded-full bg-white/20 px-4 text-[12.5px] text-white placeholder-white/60 backdrop-blur focus:bg-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="h-10 rounded-full bg-white px-5 text-[12.5px] font-semibold text-brand-deep shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
            >
              {pending ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
          {error ? <p className="mt-2 text-[11.5px] font-medium text-white">{error}</p> : null}
        </>
      )}
    </section>
  )
}
