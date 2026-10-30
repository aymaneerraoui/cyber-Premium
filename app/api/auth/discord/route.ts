import { NextResponse, type NextRequest } from 'next/server'
import { getDiscordOAuthConfig } from '@/lib/server/env'
import { clientIp, rateLimit } from '@/lib/server/rate-limit'
import { setStateCookie } from '@/lib/server/session'
import { createState } from '@/lib/server/session-crypto'

/** Starts Discord OAuth2: issues a CSRF `state`, stores it in an HttpOnly cookie, and redirects to Discord. */
export function GET(request: NextRequest) {
  const config = getDiscordOAuthConfig()
  if (!config) {
    return NextResponse.redirect(new URL('/login?notice=oauth-unconfigured', request.url))
  }

  // The state cookie is host-only, so it must be set on the same host Discord
  // redirects back to. If sign-in starts on another domain (a second alias or a
  // preview URL), restart the flow on the callback's host first.
  const callback = new URL(config.redirectUri)
  const requestHost = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host).toLowerCase()
  if (requestHost !== callback.host.toLowerCase()) {
    return NextResponse.redirect(new URL('/api/auth/discord', callback.origin))
  }

  const limit = rateLimit(`oauth-start:${clientIp(request)}`, 20, 60_000)
  if (!limit.ok) return NextResponse.redirect(new URL('/login?notice=rate-limited', request.url))

  const state = createState()
  const url = new URL('https://discord.com/oauth2/authorize')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'identify guilds')
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'consent')

  const response = NextResponse.redirect(url)
  setStateCookie(response, state)
  return response
}
