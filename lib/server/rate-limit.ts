import 'server-only'
import type { NextRequest } from 'next/server'

/*
 * Fixed-window, in-memory rate limiter. On serverless hosts each instance has
 * its own memory, so this is best-effort abuse protection for auth routes —
 * swap in a shared store (e.g. Upstash Redis) for strict global limits.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }
  bucket.count += 1
  if (bucket.count > limit) return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  return { ok: true, retryAfterSeconds: 0 }
}

export function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}
