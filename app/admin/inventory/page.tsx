import { PageHeader } from "@/components/page-header"
import { InventoryManager } from "@/components/admin/inventory-manager"
import { getProducts } from "@/lib/queries"

export const metadata = { title: "Inventory · ecomi Admin" }

export default async function AdminInventoryPage() {
  const products = await getProducts()

  return (
    <div>
      <PageHeader
        title="Warehouse Inventory & Stock Allocation"
        description="Live stock levels, reorder thresholds, and one-click supplier restock."
      />
      <InventoryManager initial={products} />
    </div>
  )
}
