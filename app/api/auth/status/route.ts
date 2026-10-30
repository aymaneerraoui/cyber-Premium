import { NextResponse, type NextRequest } from 'next/server'
import { DISCORD_CALLBACK_PATH } from '@/lib/oauth-config-validation'
import { getDiscordOAuthConfig, getOAuthConfigIssues } from '@/lib/server/env'

export const dynamic = 'force-dynamic'

/**
 * Configuration self-check for Discord sign-in. Returns variable names and
 * problems only. The redirect URI is not secret — Discord shows it in the
 * public authorize URL — so it is echoed to help match the Developer Portal.
 */
export function GET(request: NextRequest) {
  const config = getDiscordOAuthConfig()
  return NextResponse.json(
    {
      configured: config !== null,
      issues: getOAuthConfigIssues(),
      configuredRedirectUri: config?.redirectUri ?? null,
      expectedRedirectUriForThisHost: `${request.nextUrl.origin}${DISCORD_CALLBACK_PATH}`,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
