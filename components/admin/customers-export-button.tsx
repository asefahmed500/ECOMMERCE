"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import type { CustomerStatDTO } from "@/lib/types"

export function CustomersExportButton({ rows }: { rows: CustomerStatDTO[] }) {
  function exportCsv() {
    if (rows.length === 0) {
      toast.add({ title: "Nothing to export — no customers match the current filters", type: "info" })
      return
    }
    const header = "Name,Email,Location,Orders,Lifetime Spend,Avg Order,Last Order,Customer Since,Tier\n"
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const body = rows
      .map((c) =>
        [
          escape(c.name),
          escape(c.email),
          escape(c.location),
          c.orders,
          c.spent.toFixed(2),
          c.avgOrderValue.toFixed(2),
          c.lastOrderAt ? new Date(c.lastOrderAt).toISOString().slice(0, 10) : "",
          new Date(c.customerSince).toISOString().slice(0, 10),
          c.tier,
        ].join(",")
      )
      .join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ecomi-customers.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: `Exported ${rows.length} customers as CSV`, type: "success" })
  }

  return (
    <Button variant="secondary" size="sm" onClick={exportCsv} type="button">
      <Download className="size-3.5" />
      Export CSV
    </Button>
  )
}
