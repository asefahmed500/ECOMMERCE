import dbConnect from "@/lib/db"
import { Setting } from "@/lib/models"
import { PageHeader } from "@/components/page-header"
import { SettingsForm } from "@/components/admin/settings-form"

export const metadata = { title: "Settings · ecomi Admin" }

export default async function AdminSettingsPage() {
  await dbConnect()
  let settings = await Setting.findOne({ key: "store" }).lean()
  if (!settings) {
    const created = await Setting.create({ key: "store" })
    settings = created
  }

  const s = settings as { brandName: string; supportEmail: string; freeShippingThreshold: number; shippingFee: number }

  return (
    <div>
      <PageHeader title="Store Configuration & Gateway Connectors" description="Shipping rules apply live at checkout." />
      <SettingsForm
        initial={{
          brandName: s.brandName,
          supportEmail: s.supportEmail,
          freeShippingThreshold: s.freeShippingThreshold,
          shippingFee: s.shippingFee,
        }}
      />
    </div>
  )
}
