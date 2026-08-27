import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { StoreShell } from "@/components/store-shell"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect("/login?next=/account")
  if (user.role !== "customer") redirect("/admin")

  return (
    <Suspense>
      <StoreShell user={user} variant="account">
        {children}
      </StoreShell>
    </Suspense>
  )
}

export function generateMetadata() {
  return { title: "My Account · ecomi" }
}
