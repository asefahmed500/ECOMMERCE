import "server-only"

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function cleanup(now: number) {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  cleanup(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true as const, retryAfter: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false as const, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true as const, retryAfter: 0 }
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local"
  return `${scope}:${ip}`
}
