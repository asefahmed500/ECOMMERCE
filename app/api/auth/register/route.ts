import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession, hashPassword } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Order, User } from "@/lib/models"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { sendMail, welcomeEmail } from "@/lib/mailer"

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
})

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "register"), 6, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  try {
    const parsed = registerSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "All fields are required"
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { name, email, password } = parsed.data

    await dbConnect()
    const existing = await User.findOne({ email }).lean()
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "customer",
    })

    // Automatically claim and link past guest orders placed with this email
    await Order.updateMany({ user: null, guestEmail: email }, { $set: { user: user._id } })

    await createSession(String(user._id))

    const welcome = welcomeEmail({ name, homeUrl: request.nextUrl.origin })
    await sendMail({ to: email, ...welcome })

    return NextResponse.json({ ok: true, role: user.role, name: user.name })
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
