"use client"

import * as React from "react"
import { Mail } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  return (
    <section className="mb-10 rounded-2xl bg-hero-gradient p-8 text-center text-white">
      <Mail className="mx-auto mb-3 size-6" />
      <h2 className="mb-1.5 text-lg font-semibold">Join the VIP List</h2>
      <p className="mb-4 text-[12.5px] text-white/85">
        Get early access to drops, exclusive deals, and 5% cashback on your first order.
      </p>
      {submitted ? (
        <p className="text-[13px] font-medium">Thanks for subscribing!</p>
      ) : (
        <form
          className="mx-auto flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (email.trim()) setSubmitted(true)
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="h-10 flex-1 rounded-full bg-white/20 px-4 text-[12.5px] text-white placeholder-white/60 backdrop-blur focus:bg-white/30 focus:outline-none"
          />
          <button
            type="submit"
            className="h-10 rounded-full bg-white px-5 text-[12.5px] font-semibold text-brand-deep shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Subscribe
          </button>
        </form>
      )}
    </section>
  )
}
