import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[28%] bg-brand-gradient shadow-brand",
        className ?? "size-7"
      )}
    >
      <span
        aria-hidden
        className="absolute -top-1/3 left-1/4 h-full w-full rotate-12 bg-white/20 blur-md"
      />
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("relative", className?.match(/size-(\d+)/)?.[1] ? "size-1/2" : "size-4")}>
        <path
          d="M17.5 8.2A5.9 5.9 0 0 0 12 5.5c-3.4 0-6 2.9-6 6.5s2.6 6.5 6 6.5a5.9 5.9 0 0 0 5.5-2.7"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M6.4 10.8h7.2" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Logo({
  href = "/",
  tag,
  size = "md",
  className,
}: {
  href?: string
  tag?: string
  size?: "sm" | "md"
  className?: string
}) {
  const box = size === "md" ? "size-9" : "size-7"
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5 overflow-hidden", className)}>
      <LogoMark className={cn(box, "transition group-hover:scale-105")} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight text-foreground",
            size === "md" ? "text-xl" : "text-sm"
          )}
        >
          ecomi
        </span>
        {tag ? (
          <span className="mt-0.5 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
            {tag}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
