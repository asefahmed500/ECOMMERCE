import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl font-semibold text-brand">404</span>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="max-w-sm text-xs text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-brand-gradient px-5 py-2 text-xs font-semibold text-white shadow-brand"
      >
        Back to Store
      </Link>
    </div>
  )
}
