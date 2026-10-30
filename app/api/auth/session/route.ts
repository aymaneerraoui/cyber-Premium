import { NextResponse } from 'next/server'
import type { SessionResponse } from '@/lib/auth-types'
import { isOAuthReady } from '@/lib/server/env'
import { getSession } from '@/lib/server/session'

/** Public profile of the signed-in user. The access token never leaves the server. */
export async function GET() {
  const session = await getSession()
  const body: SessionResponse = { user: session?.user ?? null, oauthConfigured: isOAuthReady() }
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
