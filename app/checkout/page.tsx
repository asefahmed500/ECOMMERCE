import { CheckoutForm } from "@/components/checkout-form"
import { getSession } from "@/lib/auth"

export default async function CheckoutPage() {
  const user = await getSession()
  return <CheckoutForm user={user} />
}
