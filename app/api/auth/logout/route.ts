import { NextResponse, type NextRequest } from 'next/server'
import { revokeToken } from '@/lib/server/discord'
import { getDiscordOAuthConfig } from '@/lib/server/env'
import { isSameOrigin } from '@/lib/server/request'
import { clearSessionCookie, getSession } from '@/lib/server/session'

/** Ends the session. POST-only with an Origin check so third-party pages cannot sign users out. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const session = await getSession()
  const config = getDiscordOAuthConfig()
  if (session && config) {
    try {
      await revokeToken(session.accessToken, config)
    } catch (err) {
      // The local session is still cleared below; the token simply expires on Discord's side.
      console.warn('[auth] Discord token revocation failed:', err instanceof Error ? err.name : 'unknown error')
    }
  }

  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  clearSessionCookie(response)
  return response
}
