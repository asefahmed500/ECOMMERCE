import { NextRequest, NextResponse } from "next/server"
import { requireApiAdmin, guardResponse } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Setting } from "@/lib/models"
import { DEFAULT_SETTINGS, getStoreSettings } from "@/lib/queries"

export async function GET() {
  const settings = await getStoreSettings()
  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.brandName !== undefined) {
      const brandName = String(body.brandName).trim().slice(0, 80)
      if (!brandName) return NextResponse.json({ error: "Brand name cannot be empty" }, { status: 400 })
      updates.brandName = brandName
    }
    if (body.supportEmail !== undefined) {
      const supportEmail = String(body.supportEmail).trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
        return NextResponse.json({ error: "Support email is not valid" }, { status: 400 })
      }
      updates.supportEmail = supportEmail
    }
    for (const field of ["freeShippingThreshold", "shippingFee"] as const) {
      if (body[field] !== undefined) {
        const value = Number(body[field])
        if (!Number.isFinite(value) || value < 0 || value > 100000) {
          return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 })
        }
        updates[field] = value
      }
    }

    await dbConnect()
    await Setting.findOneAndUpdate({ key: "store" }, updates, { new: true, upsert: true })
    return NextResponse.json({ settings: await getStoreSettings(), defaults: DEFAULT_SETTINGS })
  } catch {
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 })
  }
}
