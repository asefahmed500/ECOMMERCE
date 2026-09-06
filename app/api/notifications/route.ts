import { NextRequest, NextResponse } from "next/server"
import { guardResponse, requireApiUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Notification, isValidObjectId } from "@/lib/models"
import { toNotificationDTO } from "@/lib/serialize"

export async function GET() {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  await dbConnect()
  const filter = guard.role === "admin" ? { forAdmin: true } : { user: guard.id }
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(20).lean()
  const unread = await Notification.countDocuments({ ...filter, read: false })

  return NextResponse.json({ items: items.map((n) => toNotificationDTO(n as never)), unread })
}

export async function PATCH(request: NextRequest) {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  try {
    const body = await request.json().catch(() => ({}))
    await dbConnect()
    const filter = guard.role === "admin" ? { forAdmin: true } : { user: guard.id }

    if (body.id) {
      if (!isValidObjectId(body.id)) {
        return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
      }
      await Notification.updateOne({ ...filter, _id: body.id }, { read: true })
    } else {
      await Notification.updateMany(filter, { read: true })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not update notifications" }, { status: 500 })
  }
}
