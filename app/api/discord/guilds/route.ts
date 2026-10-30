
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

import type { ManagedGuildsResponse } from '@/lib/auth-types'
import { canManageGuild, guildIconUrl } from '@/lib/discord-permissions'
import { DiscordApiError, fetchUserGuilds } from '@/lib/server/discord'
import { rateLimit } from '@/lib/server/rate-limit'
import { clearSessionCookie, getSession } from '@/lib/server/session'

export const runtime = 'nodejs'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'unauthenticated' },
      { status: 401, headers: NO_STORE }
    )
  }

  const limit = rateLimit(`guilds:${session.user.id}`, 10, 60_000)

  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          ...NO_STORE,
          'Retry-After': String(limit.retryAfterSeconds)
        }
      }
    )
  }

  let guilds

  try {
    guilds = await fetchUserGuilds(session.accessToken)
  } catch (err) {
    if (err instanceof DiscordApiError && err.status === 401) {
      const response = NextResponse.json(
        { error: 'session_expired' },
        { status: 401, headers: NO_STORE }
      )
      clearSessionCookie(response)
      return response
    }

    if (err instanceof DiscordApiError && err.status === 429) {
      return NextResponse.json(
        { error: 'discord_rate_limited' },
        {
          status: 429,
          headers: {
            ...NO_STORE,
            'Retry-After': String(err.retryAfterSeconds ?? 5)
          }
        }
      )
    }

    console.error('[guilds] Failed to load user guilds:', err)

    return NextResponse.json(
      { error: 'discord_unavailable' },
      { status: 502, headers: NO_STORE }
    )
  }

  let botGuildIds: Set<string> | null = null

  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL)

      const rows = await sql`
        SELECT guild_ids, updated_at
        FROM cyber_bot_status
        WHERE bot_id = 'cyber'
          AND updated_at > NOW() - INTERVAL '3 minutes'
        LIMIT 1
      `

      if (rows.length > 0) {
        const ids: unknown = rows[0].guild_ids

        if (
          Array.isArray(ids) &&
          ids.every((id) => typeof id === 'string')
        ) {
          botGuildIds = new Set(ids as string[])
        }
      }
    } catch (err) {
      console.error(
        '[guilds] Failed to read bot status:',
        err instanceof Error ? err.message : 'unknown error'
      )
    }
  }

  const body: ManagedGuildsResponse = {
    guilds: guilds.filter(canManageGuild).map((g) => ({
      id: g.id,
      name: g.name,
      iconUrl: guildIconUrl(g.id, g.icon),
      owner: g.owner,
      botInstalled: botGuildIds ? botGuildIds.has(g.id) : null
    })),
    botStatusKnown: botGuildIds !== null
  }

  return NextResponse.json(body, { headers: NO_STORE })
}
