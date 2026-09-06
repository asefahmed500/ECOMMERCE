import "server-only"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db"
import { User } from "@/lib/models"
import type { SessionUser } from "@/lib/types"

export type { SessionUser }

const COOKIE_NAME = "ecomi_session"
const SESSION_DAYS = 7
const BCRYPT_ROUNDS = 12

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    try {
      process.loadEnvFile?.()
    } catch {
      // ignore
    }
  }
  const secret = process.env.AUTH_SECRET || process.env["\uFEFFAUTH_SECRET"]
  if (!secret) {
    throw new Error("Please define the AUTH_SECRET environment variable inside .env")
  }
  return secret
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const token = jwt.sign({ sub: userId }, getSecret(), {
    expiresIn: `${SESSION_DAYS}d`,
  })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = jwt.verify(token, getSecret())
    const userId = typeof payload === "string" ? null : (payload.sub as string | null)
    if (!userId) return null

    await dbConnect()
    const user = await User.findById(userId).lean()
    if (!user) return null

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as "customer" | "admin",
      tier: user.tier,
      cashback: user.cashback,
      address: user.address ?? { line1: "", city: "", country: "", zip: "" },
      paymentMethod: user.paymentMethod ?? "",
    }
  } catch {
    return null
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error("UNAUTHORIZED")
  return session
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession()
  if (!session || session.role !== "admin") throw new Error("FORBIDDEN")
  return session
}

type ApiGuard = SessionUser | NextResponse

function isResponse(value: ApiGuard): value is NextResponse {
  return value instanceof NextResponse
}

export function guardResponse(guard: ApiGuard): guard is NextResponse {
  return isResponse(guard)
}

export async function requireApiUser(): Promise<ApiGuard> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return session
}

export async function requireApiAdmin(): Promise<ApiGuard> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }
  return session
}

// Universal guard for customer-only pages: guests go to login (with return
// path), signed-in admins are bounced to their own portal. Keeps the two
// role domains strictly separate on the server, not just in the UI.
export async function getCustomerSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role === "admin") redirect("/admin")
  return session
}
