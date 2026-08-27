"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Boxes,
  Download,
  LayoutGrid,
  Pencil,
  Plus,
  Table as TableIcon,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StockStatusBadge } from "@/components/status-badge"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import type { ProductDTO } from "@/lib/types"
import { CATEGORIES, formatCurrency } from "@/lib/format"

interface FormState {
  id?: string
  name: string
  sub: string
  category: string
  sku: string
  price: string
  oldPrice: string
  stock: string
  image: string
  description: string
  isFeatured: boolean
}

const EMPTY: FormState = {
  name: "",
  sub: "",
  category: "Fashion",
  sku: "",
  price: "",
  oldPrice: "",
  stock: "",
  image: "",
  description: "",
  isFeatured: false,
}

export function ProductsManager({ initial, openNew }: { initial: ProductDTO[]; openNew?: boolean }) {
  const router = useRouter()
  const [products, setProducts] = React.useState(initial)
  const [prevInitial, setPrevInitial] = React.useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setProducts(initial)
  }
  const [view, setView] = React.useState<"table" | "grid">("table")
  const [dialogOpen, setDialogOpen] = React.useState(Boolean(openNew))
  const [form, setForm] = React.useState<FormState>(EMPTY)
  const [pending, setPending] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ProductDTO | null>(null)

  function openAdd() {
    setForm(EMPTY)
    setDialogOpen(true)
  }

  function openEdit(p: ProductDTO) {
    setForm({
      id: p.id,
      name: p.name,
      sub: p.sub,
      category: p.category,
      sku: p.sku,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : "",
      stock: String(p.stock),
      image: p.image,
      description: p.description,
      isFeatured: p.isFeatured,
    })
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const payload = {
        name: form.name,
        sub: form.sub,
        category: form.category,
        sku: form.sku,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        sale:
          form.oldPrice && Number(form.oldPrice) > Number(form.price)
            ? `-${Math.round((1 - Number(form.price) / Number(form.oldPrice)) * 100)}%`
            : null,
        stock: Number(form.stock),
        image: form.image,
        description: form.description,
        isFeatured: form.isFeatured,
      }
      const res = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.add({ title: data.error ?? "Save failed", type: "error" })
        return
      }
      const saved: ProductDTO = data.product
      setProducts((prev) => (form.id ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]))
      setDialogOpen(false)
      toast.add({ title: form.id ? `Product updated: ${saved.name}` : `Product added: ${saved.name}`, type: "success" })
      router.refresh()
    } catch {
      toast.add({ title: "Network error", type: "error" })
    } finally {
      setPending(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    const res = await fetch(`/api/products/${target.id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.add({ title: "Delete failed", type: "error" })
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== target.id))
    toast.add({ title: `Product deleted: ${target.name}`, type: "success" })
    router.refresh()
  }

  function exportCsv() {
    const header = "Name,Category,SKU,Price,Stock\n"
    const rows = products
      .map((p) => `"${p.name}",${p.category},${p.sku},${p.price},${p.stock}`)
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ecomi-products.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: "Product catalog exported as CSV", type: "success" })
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/60 p-0.5">
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
                view === "table" ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
            >
              <TableIcon className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
                view === "grid" ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              Visual Cards
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
        <Button onClick={openAdd} className="bg-brand-gradient text-white shadow-brand">
          <Plus className="size-3.5" />
          Add New Product
        </Button>
      </div>

      {view === "table" ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo & Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/product/${p.id}`} className="flex items-center gap-3">
                      <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={p.image} alt={p.name} fill sizes="36px" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{p.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{p.sub}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{p.category}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{p.sku}</code>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{formatCurrency(p.price)}</TableCell>
                  <TableCell className="text-xs">{p.stock} units</TableCell>
                  <TableCell>
                    <StockStatusBadge stock={p.stock} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="icon-xs" className="mr-1" onClick={() => openEdit(p)} aria-label="Edit">
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="destructive" size="icon-xs" onClick={() => setDeleteTarget(p)} aria-label="Delete">
                      <Trash2 className="size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                    <Boxes className="mx-auto mb-2 size-5" />
                    No products match the current filters
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
              <Link href={`/product/${p.id}`} className="relative aspect-square bg-muted">
                <Image src={p.image} alt={p.name} fill sizes="25vw" className="object-cover" />
                <span className="absolute bottom-2 left-2">
                  <StockStatusBadge stock={p.stock} />
                </span>
              </Link>
              <div className="flex flex-1 flex-col gap-1 p-3.5">
                <Link href={`/product/${p.id}`} className="line-clamp-1 text-[13px] font-medium hover:text-brand-deep">
                  {p.name}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {p.category} · {p.sku}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold">{formatCurrency(p.price)}</span>
                  <Button variant="secondary" size="xs" onClick={() => openEdit(p)}>
                    <Pencil className="size-3" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog — mirrors reference product modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{form.id ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription className="text-[11px]">
              SKU must be unique. Sale badge is computed from Old Price vs Price.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3.5" id="product-form">
            <div className="space-y-1.5">
              <Label htmlFor="p-name" className="text-xs">
                Product Title *
              </Label>
              <Input
                id="p-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Air Max 270 React"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    if (v) setForm((f) => ({ ...f, category: v }))
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sku" className="text-xs">
                  SKU Code *
                </Label>
                <Input
                  id="p-sku"
                  required
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU-NK-10293"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sub" className="text-xs">
                Subtitle
              </Label>
              <Input
                id="p-sub"
                value={form.sub}
                onChange={(e) => setForm((f) => ({ ...f, sub: e.target.value }))}
                placeholder="e.g. Women's Performance Footwear"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-image" className="text-xs">
                Image URL
              </Label>
              <Input
                id="p-image"
                type="url"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price" className="text-xs">
                  Price ($) *
                </Label>
                <Input
                  id="p-price"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-old" className="text-xs">
                  Old Price ($)
                </Label>
                <Input
                  id="p-old"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.oldPrice}
                  onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock" className="text-xs">
                  Stock *
                </Label>
                <Input
                  id="p-stock"
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc" className="text-xs">
                Description
              </Label>
              <Input
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short marketing copy"
                className="h-9"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="size-4 accent-[#FF6B2C]"
              />
              Feature on the home page
            </label>
          </form>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="product-form" disabled={pending} className="bg-brand-gradient text-white shadow-brand">
              {pending ? "Saving…" : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete product?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              &quot;{deleteTarget?.name}&quot; will be permanently removed from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
