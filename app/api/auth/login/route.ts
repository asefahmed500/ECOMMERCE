import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession, verifyPassword } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { User } from "@/lib/models"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
})

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, "login"), 10, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    )
  }

  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 })
    }
    const { email, password } = parsed.data

    await dbConnect()
    const user = await User.findOne({ email }).lean()
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    await createSession(String(user._id))
    return NextResponse.json({ ok: true, role: user.role, name: user.name })
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
