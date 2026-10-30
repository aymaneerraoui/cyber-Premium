import { NextResponse, type NextRequest } from 'next/server'
import { isSnowflakeId } from '@/lib/discord-permissions'
import { getBotPermissions, getDiscordClientId } from '@/lib/server/env'

/**
 * Redirects to Discord's bot authorization screen. Discord itself verifies
 * that the user can add bots to the chosen server; `guild_id` only preselects it.
 *
 * Default permissions: Kick, Ban, Manage Channels, View Channel, Send Messages,
 * Manage Messages, Embed Links, Attach Files, Read History, Manage Roles,
 * Moderate Members. Administrator is never requested.
 */
export function GET(request: NextRequest) {
  const clientId = getDiscordClientId()
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?notice=invite-unconfigured', request.url))
  }
  const url = new URL('https://discord.com/oauth2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'bot applications.commands')
  url.searchParams.set('permissions', getBotPermissions())

  const guildId = request.nextUrl.searchParams.get('guild_id')
  if (isSnowflakeId(guildId)) {
    url.searchParams.set('guild_id', guildId)
    url.searchParams.set('disable_guild_select', 'true')
  }
  return NextResponse.redirect(url)
}
