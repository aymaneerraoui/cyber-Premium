import 'server-only'
import type { NextRequest } from 'next/server'

/** Rejects state-changing requests that do not originate from this site. */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
