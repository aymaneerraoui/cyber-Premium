import { NextResponse, type NextRequest } from 'next/server'
import { DiscordApiError, exchangeCode, fetchCurrentUser } from '@/lib/server/discord'
import { classifyTokenExchangeError } from '@/lib/oauth-errors'
import { getDiscordOAuthConfig, getSessionSecret } from '@/lib/server/env'
import { clientIp, rateLimit } from '@/lib/server/rate-limit'
import { clearStateCookie, MAX_SESSION_SECONDS, OAUTH_STATE_COOKIE, setSessionCookie } from '@/lib/server/session'
import { safeEqual } from '@/lib/server/session-crypto'

const CODE_PATTERN = /^[A-Za-z0-9]{10,64}$/

function redirectToLogin(request: NextRequest, notice: string) {
  const response = NextResponse.redirect(new URL(`/login?notice=${notice}`, request.url))
  clearStateCookie(response)
  return response
}

/** Discord OAuth2 callback: validates `state`, exchanges the code server-side, and creates an encrypted session. */
export async function GET(request: NextRequest) {
  const config = getDiscordOAuthConfig()
  if (!config || !getSessionSecret()) return redirectToLogin(request, 'oauth-unconfigured')

  const limit = rateLimit(`oauth-callback:${clientIp(request)}`, 20, 60_000)
  if (!limit.ok) return redirectToLogin(request, 'rate-limited')

  const params = request.nextUrl.searchParams
  const oauthError = params.get('error')
  if (oauthError) return redirectToLogin(request, oauthError === 'access_denied' ? 'oauth-denied' : 'oauth-failed')

  const code = params.get('code')
  const state = params.get('state')
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  if (!state || !expectedState || !safeEqual(state, expectedState)) return redirectToLogin(request, 'oauth-state')
  if (!code || !CODE_PATTERN.test(code)) return redirectToLogin(request, 'oauth-failed')

  let token
  try {
    token = await exchangeCode(code, config)
  } catch (err) {
    if (err instanceof DiscordApiError) {
      console.error('[auth] Discord token exchange failed:', err.message)
      return redirectToLogin(request, classifyTokenExchangeError(err.status, err.oauthError, err.oauthErrorDescription))
    }
    console.error('[auth] Discord token exchange failed:', err instanceof Error ? err.name : 'unknown error')
    return redirectToLogin(request, 'oauth-failed')
  }

  try {
    const scopes = token.scope.split(' ')
    if (!scopes.includes('identify') || !scopes.includes('guilds')) return redirectToLogin(request, 'oauth-scope')

    const user = await fetchCurrentUser(token.access_token)
    const lifetime = Math.min(Math.max(token.expires_in, 0), MAX_SESSION_SECONDS)

    const response = NextResponse.redirect(new URL('/dashboard/servers', request.url))
    setSessionCookie(response, { user, accessToken: token.access_token, expiresAt: Date.now() + lifetime * 1000 })
    clearStateCookie(response)
    return response
  } catch (err) {
    console.error('[auth] Discord OAuth callback failed:', err instanceof DiscordApiError ? err.message : err instanceof Error ? err.name : 'unknown error')
    return redirectToLogin(request, 'oauth-failed')
  }
}
