import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminPagination({
  page,
  pages,
  total,
  buildHref,
}: {
  page: number
  pages: number
  total: number
  buildHref: (page: number) => string
}) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-[11px] text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {pages} · {total} record
        {total === 1 ? "" : "s"}
      </p>
      {pages > 1 ? (
        <div className="flex items-center gap-1">
          <Link
            aria-label="Previous page"
            href={buildHref(Math.max(1, page - 1))}
            className={cn(
              "flex size-7 items-center justify-center rounded-md border text-muted-foreground transition",
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted hover:text-foreground"
            )}
          >
            <ChevronLeft className="size-3.5" />
          </Link>
          {windowPages(page, pages).map((p) => (
            <Link
              key={p}
              href={buildHref(p)}
              className={cn(
                "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11.5px] font-medium transition",
                p === page ? "bg-brand-light font-semibold text-brand-deep" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {p}
            </Link>
          ))}
          <Link
            aria-label="Next page"
            href={buildHref(Math.min(pages, page + 1))}
            className={cn(
              "flex size-7 items-center justify-center rounded-md border text-muted-foreground transition",
              page >= pages ? "pointer-events-none opacity-40" : "hover:bg-muted hover:text-foreground"
            )}
          >
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function windowPages(page: number, pages: number): number[] {
  const span = 2
  const start = Math.max(1, Math.min(page - span, pages - span * 2))
  const end = Math.min(pages, Math.max(page + span, span * 2 + 1))
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}
