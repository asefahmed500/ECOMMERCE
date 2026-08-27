"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StockStatusBadge } from "@/components/status-badge"
import { toast } from "@/components/ui/toast"
import type { ProductDTO } from "@/lib/types"
import { formatCurrency } from "@/lib/format"

export function InventoryManager({ initial }: { initial: ProductDTO[] }) {
  const router = useRouter()
  const [products, setProducts] = React.useState(initial)
  const [prevInitial, setPrevInitial] = React.useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setProducts(initial)
  }
  const [busy, setBusy] = React.useState<string | null>(null)

  const lowCount = products.filter((p) => p.stock < 15).length

  async function restock(id: string) {
    setBusy(id)
    try {
      const res = await fetch(`/api/products/${id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.add({ title: data.error ?? "Restock failed", type: "error" })
        return
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: data.stock } : p)))
      const p = products.find((x) => x.id === id)
      toast.add({ title: `Restocked +50 units for ${p?.name}`, type: "success" })
      router.refresh()
    } catch {
      toast.add({ title: "Network error", type: "error" })
    } finally {
      setBusy(null)
    }
  }

  async function restockAll() {
    const low = products.filter((p) => p.stock < 15)
    for (const p of low) {
      await restock(p.id)
    }
    toast.add({ title: `Suppliers notified — restocked ${low.length} low items`, type: "success" })
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          West Hub Primary Storage · <span className="font-semibold text-foreground">{lowCount}</span> items below
          reorder level
        </p>
        <Button onClick={restockAll} className="bg-brand-gradient text-white shadow-brand" size="sm">
          <RefreshCw className="size-3.5" />
          Restock All Low Items
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product & SKU</TableHead>
              <TableHead>Regional Hub</TableHead>
              <TableHead>Available Units</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead className="text-right">Quick Restock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="text-xs font-semibold">{p.name}</p>
                  <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">{p.sku}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">West Hub 1</TableCell>
                <TableCell>
                  <span className="text-xs font-semibold">{p.stock}</span>
                  <span className="text-[11px] text-muted-foreground"> units · {formatCurrency(p.price * p.stock)} value</span>
                </TableCell>
                <TableCell>
                  <div className="w-28">
                    <Progress value={Math.min(100, (p.stock / 100) * 100)}>
                      <ProgressTrack className="h-1.5">
                        <ProgressIndicator
                          className={p.stock < 15 ? "bg-destructive" : "bg-brand-gradient"}
                        />
                      </ProgressTrack>
                    </Progress>
                  </div>
                </TableCell>
                <TableCell>
                  <StockStatusBadge stock={p.stock} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="xs"
                    disabled={busy === p.id}
                    onClick={() => restock(p.id)}
                  >
                    +50 Units
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
