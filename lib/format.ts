export function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export const CATEGORIES = ["Fashion", "Beauty", "Electronics", "Wearables", "Bags"] as const
export type Category = (typeof CATEGORIES)[number]
