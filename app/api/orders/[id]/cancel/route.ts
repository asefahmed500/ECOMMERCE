import { NextRequest, NextResponse } from "next/server"
import { guardResponse, requireApiUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Order, isValidObjectId } from "@/lib/models"
import { orderStatusEmail, sendMail } from "@/lib/mailer"
import { applyCancellationSideEffects, cancellationDetail, createCancellationNotification } from "@/lib/order-cancel"

// Customer self-service cancellation: allowed only while an order is still
// Processing, only by its owner. After Shipped, the admin pipeline takes over.
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]/cancel">) {
  const guard = await requireApiUser()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  try {
    await dbConnect()
    const order = await Order.findById(id)
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    // 404 (not 403) for other people's orders — no existence leak.
    if (!order.user || String(order.user) !== guard.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (order.status !== "Processing") {
      return NextResponse.json(
        { error: `Only orders that are still processing can be cancelled. This order is ${order.status}.` },
        { status: 422 }
      )
    }

    // Atomic conditional update: only one concurrent cancel can win.
    const updated = await Order.findOneAndUpdate(
      { _id: id, status: "Processing" },
      {
        $set: { status: "Cancelled", payment: order.payment === "Paid" ? "Refunded" : order.payment },
        $push: { history: { status: "Cancelled", at: new Date() } },
      },
      { returnDocument: "after" }
    )
    if (!updated) {
      return NextResponse.json({ error: "Order was already updated" }, { status: 409 })
    }

    await applyCancellationSideEffects(order)

    const detail = cancellationDetail(updated)
    await createCancellationNotification(order, detail)

    const recipient = guard.email
    const email = orderStatusEmail({
      name: guard.name,
      orderNo: order.orderNo,
      status: "Cancelled",
      detail,
      orderUrl: `${_req.nextUrl.origin}/track?order=${order.orderNo}`,
    })
    await sendMail({ to: recipient, ...email })

    return NextResponse.json({ ok: true, status: "Cancelled", payment: updated.payment })
  } catch (err) {
    console.error("Customer order cancellation error:", err)
    return NextResponse.json({ error: "Could not cancel the order" }, { status: 500 })
  }
}
