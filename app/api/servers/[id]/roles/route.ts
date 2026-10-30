
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'
import { getSession } from '@/lib/server/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { id } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'unauthenticated' },
      { status: 401 }
    )
  }

  if (!/^\d{17,20}$/.test(id)) {
    return NextResponse.json(
      { error: 'invalid_server_id' },
      { status: 400 }
    )
  }

  const token = process.env.DISCORD_BOT_TOKEN
  const databaseUrl = process.env.DATABASE_URL

  if (!token || !databaseUrl) {
    return NextResponse.json(
      { error: 'configuration_missing' },
      { status: 503 }
    )
  }

  try {
    const guilds = await fetchUserGuilds(session.accessToken)

    const allowed = guilds.some(
      (guild) =>
        guild.id === id && canManageGuild(guild)
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'forbidden' },
        { status: 403 }
      )
    }

    const sql = neon(databaseUrl)

    const rows = await sql`
      SELECT guild_ids
      FROM cyber_bot_status
      WHERE bot_id = 'cyber'
        AND updated_at > NOW() - INTERVAL '3 minutes'
      LIMIT 1
    `

    const ids: unknown = rows[0]?.guild_ids

    if (
      !Array.isArray(ids) ||
      !ids.includes(id)
    ) {
      return NextResponse.json(
        { error: 'bot_not_connected' },
        { status: 503 }
      )
    }

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${id}/roles`,
      {
        headers: {
          Authorization: `Bot ${token}`
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'discord_api_failed',
          discordStatus: response.status
        },
        { status: 502 }
      )
    }

    const roles = await response.json()

    if (!Array.isArray(roles)) {
      return NextResponse.json(
        { error: 'invalid_discord_response' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      roles.map((role) => ({
        id: role.id,
        name: role.name,
        color: `#${role.color.toString(16).padStart(6, '0')}`
      })),
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error('[roles] Failed:', error)

    return NextResponse.json(
      { error: 'roles_unavailable' },
      { status: 502 }
    )
  }
}
