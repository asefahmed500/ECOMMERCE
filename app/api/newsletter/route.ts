import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import dbConnect from "@/lib/db"
import { NewsletterSubscriber } from "@/lib/models"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
})

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "newsletter"), 6, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  try {
    const parsed = subscribeSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }

    await dbConnect()
    // Idempotent: re-subscribing an existing email is a success, not an error.
    await NewsletterSubscriber.updateOne(
      { email: parsed.data.email },
      { $setOnInsert: { email: parsed.data.email, source: "footer-form" } },
      { upsert: true }
    )

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not subscribe right now. Please try again." }, { status: 500 })
  }
}
