import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { guardResponse, requireApiAdmin } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Coupon, Notification, Order, Product, User, canTransition, isValidObjectId, type OrderStatus } from "@/lib/models"
import { orderStatusEmail, sendMail } from "@/lib/mailer"

const statusSchema = z.object({ status: z.string().min(1).max(20) })

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/status">) {
  const guard = await requireApiAdmin()
  if (guardResponse(guard)) return guard

  const { id } = await ctx.params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  try {
    const parsed = statusSchema.safeParse(await request.json().catch(() => null))
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

    const previousStatus = order.status
    const wasPaid = order.payment === "Paid"
    const newPayment = status === "Cancelled" && wasPaid ? "Refunded" : order.payment

    // Atomic conditional update guarantees only one concurrent call succeeds
    const updated = await Order.findOneAndUpdate(
      { _id: id, status: previousStatus },
      {
        $set: { status: status as OrderStatus, payment: newPayment },
        $push: { history: { status, at: new Date() } },
      },
      { returnDocument: "after" }
    )

    if (!updated) {
      return NextResponse.json({ error: "Order was already updated concurrently" }, { status: 409 })
    }

    if (status === "Cancelled") {
      // 1. Restore product inventory
      for (const item of order.items ?? []) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } })
      }

      // 2. Adjust cashback: refund applied cashback AND deduct unearned cashback (prevent infinite exploit)
      if (order.user) {
        const userDoc = await User.findById(order.user)
        if (userDoc) {
          const earned = (order as { cashbackEarned?: number }).cashbackEarned ?? 0
          const applied = order.cashbackApplied ?? 0
          const netCashbackAdjustment = applied - earned
          if (netCashbackAdjustment !== 0) {
            const newCashback = Math.max(0, (userDoc.cashback ?? 0) + netCashbackAdjustment)
            await User.updateOne({ _id: order.user }, { cashback: Math.round(newCashback * 100) / 100 })
          }
        }
      }

      // 3. Release coupon so customer can use it again if staff cancelled
      if (order.couponCode) {
        const buyer = order.user ? await User.findById(order.user).select("email").lean() : null
        const couponIdentity = buyer?.email ?? (order.guestEmail ? `email:${order.guestEmail}` : null)
        await Coupon.updateOne(
          { code: order.couponCode },
          {
            $inc: { uses: -1 },
            ...(couponIdentity ? { $pull: { usedBy: couponIdentity } } : {}),
          }
        )
      }
    }

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

    return NextResponse.json({ ok: true, status, payment: updated.payment })
  } catch (err) {
    console.error("Order status update error:", err)
    return NextResponse.json({ error: "Could not update order status" }, { status: 500 })
  }
}
