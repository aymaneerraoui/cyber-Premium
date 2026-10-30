
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

import { canManageGuild, guildIconUrl } from '@/lib/discord-permissions'
import { fetchUserGuilds } from '@/lib/server/discord'
import { getSession } from '@/lib/server/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

const HEADERS = { 'Cache-Control': 'no-store' }

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'unauthenticated' },
      { status: 401, headers: HEADERS }
    )
  }

  if (!/^\d{17,20}$/.test(id)) {
    return NextResponse.json(
      { error: 'invalid_server_id' },
      { status: 400, headers: HEADERS }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'database_unavailable' },
      { status: 503, headers: HEADERS }
    )
  }

  try {
    const guilds = await fetchUserGuilds(session.accessToken)

    const guild = guilds.find(
      (g) => g.id === id && canManageGuild(g)
    )

    if (!guild) {
      return NextResponse.json(
        { error: 'server_not_accessible' },
        { status: 403, headers: HEADERS }
      )
    }

    const sql = neon(process.env.DATABASE_URL)

    const rows = await sql`
      SELECT guild_ids
      FROM cyber_bot_status
      WHERE bot_id = 'cyber'
        AND updated_at > NOW() - INTERVAL '3 minutes'
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'bot_offline' },
        { status: 503, headers: HEADERS }
      )
    }

    const ids: unknown = rows[0].guild_ids

    if (
      !Array.isArray(ids) ||
      !ids.every((value) => typeof value === 'string')
    ) {
      return NextResponse.json(
        { error: 'invalid_bot_status' },
        { status: 503, headers: HEADERS }
      )
    }

    if (!ids.includes(id)) {
      return NextResponse.json(
        { error: 'bot_not_installed' },
        { status: 404, headers: HEADERS }
      )
    }

    return NextResponse.json(
      {
        id: guild.id,
        name: guild.name,
        iconUrl: guildIconUrl(guild.id, guild.icon),
        memberCount: null,
        botInstalled: true,
        mode: 'live'
      },
      { headers: HEADERS }
    )
  } catch (error) {
    console.error('[server-overview] Failed:', error)

    return NextResponse.json(
      { error: 'server_unavailable' },
      { status: 502, headers: HEADERS }
    )
  }
}
