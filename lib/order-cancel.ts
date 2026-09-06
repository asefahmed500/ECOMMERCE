import "server-only"
import { Coupon, Notification, Product, User } from "@/lib/models"
import type { OrderDoc } from "@/lib/models"

// Shared cancellation pipeline used by BOTH the admin status route and the
// customer self-service cancel route, so financial side-effects can never
// drift between the two entry points.
export async function applyCancellationSideEffects(order: OrderDoc) {
  // 1. Restore product inventory
  for (const item of order.items ?? []) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } })
  }

  // 2. Reverse cashback: refund what was applied, retract what was earned
  if (order.user) {
    const userDoc = await User.findById(order.user)
    if (userDoc) {
      const earned = (order as OrderDoc & { cashbackEarned?: number }).cashbackEarned ?? 0
      const applied = order.cashbackApplied ?? 0
      const netAdjustment = applied - earned
      if (netAdjustment !== 0) {
        const newCashback = Math.max(0, (userDoc.cashback ?? 0) + netAdjustment)
        await User.updateOne({ _id: order.user }, { cashback: Math.round(newCashback * 100) / 100 })
      }
    }
  }

  // 3. Release the coupon so the customer can redeem it again
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

export function cancellationDetail(order: OrderDoc) {
  return order.payment === "Refunded"
    ? "Your order was cancelled and your payment has been refunded."
    : "Your order was cancelled."
}

export async function createCancellationNotification(order: OrderDoc, detail: string) {
  await Notification.create({
    user: order.user ?? undefined,
    type: "order-status",
    title: `Order ${order.orderNo} is Cancelled`,
    message: detail,
    orderId: order.orderNo,
  })
}
