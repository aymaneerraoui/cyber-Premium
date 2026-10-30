
import { NextResponse } from 'next/server'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'
import { getSession } from '@/lib/server/session'
import { neon } from '@neondatabase/serverless'

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
    const guilds = await fetchUserGuilds(
      session.accessToken
    )

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
      `https://discord.com/api/v10/guilds/${id}/channels`,
      {
        headers: {
          Authorization: `Bot ${token}`
        },
        cache: 'no-store'
      }
    )

    
if (!response.ok) {
  console.error(
    '[channels] Discord API error:',
    response.status
  )

  return NextResponse.json(
    {
      error: 'discord_api_failed',
      discordStatus: response.status
    },
    { status: 502 }
  )
}

    const channels = await response.json()

    if (!Array.isArray(channels)) {
      return NextResponse.json(
        { error: 'invalid_discord_response' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      channels
        .filter((channel) =>
          [0, 2, 4, 5].includes(channel.type)
        )
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          kind:
            channel.type === 2
              ? 'voice'
              : channel.type === 4
                ? 'category'
                : channel.type === 5
                  ? 'announcement'
                  : 'text',
          parentId: channel.parent_id ?? null
        })),
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error('[channels] Failed:', error)

    return NextResponse.json(
      { error: 'channels_unavailable' },
      { status: 502 }
    )
  }
}
