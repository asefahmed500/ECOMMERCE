"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold">Something went wrong in the dashboard</h2>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        The page failed to load its data. Try again — if the problem persists, check the server logs.
      </p>
      <Button onClick={reset} className="mt-5 rounded-full bg-brand-gradient px-8 font-semibold text-white shadow-brand">
        Retry
      </Button>
    </div>
  )
}
