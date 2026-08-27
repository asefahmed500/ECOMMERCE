import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { StoreShell } from "@/components/store-shell"

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  return (
    <Suspense>
      <StoreShell user={user} variant="customer">
        {children}
      </StoreShell>
    </Suspense>
  )
}

export function generateMetadata() {
  return { title: "ecomi · Modern Commerce & Product Suite" }
}
