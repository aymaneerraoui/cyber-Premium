
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

import { canManageGuild, guildIconUrl } from '@/lib/discord-permissions'
import { fetchUserGuilds } from '@/lib/server/discord'
import { getSession } from '@/lib/server/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'unauthenticated' },
      { status: 401 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'database_not_configured' },
      { status: 503 }
    )
  }

  try {
    const guilds = await fetchUserGuilds(session.accessToken)

    const sql = neon(process.env.DATABASE_URL)

    const rows = await sql`
      SELECT guild_ids
      FROM cyber_bot_status
      WHERE bot_id = 'cyber'
        AND updated_at > NOW() - INTERVAL '3 minutes'
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    const ids = rows[0].guild_ids

    if (!Array.isArray(ids) || !ids.every(
      (id: unknown) => typeof id === 'string'
    )) {
      return NextResponse.json(
        { error: 'invalid_bot_status' },
        { status: 503 }
      )
    }

    const installed = new Set(ids as string[])

    const servers = guilds
      .filter(canManageGuild)
      .filter((guild) => installed.has(guild.id))
      .map((guild) => ({
        id: guild.id,
        name: guild.name,
        iconUrl: guildIconUrl(guild.id, guild.icon),
        memberCount: null,
        botInstalled: true,
        mode: 'live' as const
      }))

    return NextResponse.json(servers, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    console.error('[servers] Failed:', error)

    return NextResponse.json(
      { error: 'server_list_unavailable' },
      { status: 502 }
    )
  }
}
