import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { StoreShell } from "@/components/store-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect("/login?next=/admin&tab=admin")
  if (user.role !== "admin") redirect("/")

  return (
    <Suspense>
      <StoreShell user={user} variant="admin">
        {children}
      </StoreShell>
    </Suspense>
  )
}

export function generateMetadata() {
  return { title: "Admin · ecomi" }
}
