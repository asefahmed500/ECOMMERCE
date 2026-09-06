import { TrackOrderForm } from "@/components/track-order-form"
import { PageHeader } from "@/components/page-header"

export const metadata = { title: "Track Your Order · ecomi" }

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const sp = await searchParams
  const initialOrderNo = typeof sp.order === "string" ? sp.order : ""

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Track Your Order"
        description="Enter your order number and the email you used at checkout."
      />
      <TrackOrderForm initialOrderNo={initialOrderNo} />
    </div>
  )
}
