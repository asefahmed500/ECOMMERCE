import { PageHeader } from "@/components/page-header"
import { CouponsManager } from "@/components/admin/coupons-manager"
import { getCoupons } from "@/lib/queries"

export const metadata = { title: "Coupons · ecomi Admin" }

export default async function AdminCouponsPage() {
  const coupons = await getCoupons()

  return (
    <div>
      <PageHeader
        title="Promotions, Coupons & Flash Vouchers"
        description="Ticket vouchers validate live in the customer cart drawer."
      />
      <CouponsManager initial={coupons} />
    </div>
  )
}
