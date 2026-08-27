import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Notification, Order, Product, User, canTransition, type OrderStatus } from "@/lib/models"
import { orderStatusEmail, sendMail } from "@/lib/mailer"

const statusSchema = z.object({ status: z.string().min(1).max(20) })

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/status">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  try {
    const parsed = statusSchema.safeParse(await request.json())
    if (!parsed.success || !["Processing", "Shipped", "Delivered", "Cancelled"].includes(parsed.data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    const status = parsed.data.status

    await dbConnect()
    const order = await Order.findById(id)
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.status === status) {
      return NextResponse.json({ error: `Order is already ${status}` }, { status: 400 })
    }
    if (!canTransition(order.status as never, status as never)) {
      return NextResponse.json(
        { error: `Cannot move an order from ${order.status} to ${status}` },
        { status: 422 }
      )
    }

    const wasPaid = order.payment === "Paid"

    if (status === "Cancelled") {
      for (const item of order.items ?? []) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } })
      }
      if (wasPaid) order.payment = "Refunded"
      if (order.cashbackApplied > 0 && order.user) {
        await User.updateOne({ _id: order.user }, { $inc: { cashback: order.cashbackApplied } })
      }
    }

    order.status = status as OrderStatus
    order.history.push({ status, at: new Date() })
    await order.save()

    let detail: string
    if (status === "Shipped") detail = `Tracking ${order.trackingNo} via ${order.courier}.`
    else if (status === "Delivered") detail = "Your package was delivered. Enjoy your purchase!"
    else if (status === "Cancelled")
      detail = wasPaid
        ? "Your order was cancelled and your payment has been refunded."
        : "Your order was cancelled."
    else detail = "We are preparing your items."

    await Notification.create({
      user: order.user,
      type: "order-status",
      title: `Order ${order.orderNo} is ${status}`,
      message: detail,
      orderId: order.orderNo,
    })

    const buyer = order.user
      ? await User.findById(order.user).select("name email").lean()
      : null
    const recipient = buyer?.email ?? order.guestEmail
    if (recipient) {
      const email = orderStatusEmail({
        name: buyer?.name ?? order.customerName,
        orderNo: order.orderNo,
        status,
        detail,
        orderUrl: `${request.nextUrl.origin}${buyer ? `/account/orders/${order._id}` : "/catalog"}`,
      })
      await sendMail({ to: recipient, ...email })
    }

    return NextResponse.json({ ok: true, status, payment: order.payment })
  } catch (err) {
    console.error("Order status update error:", err)
    return NextResponse.json({ error: "Could not update order status" }, { status: 500 })
  }
}
