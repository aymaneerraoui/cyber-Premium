
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSession } from '@/lib/server/session'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = {
  params: Promise<{ id: string }>
}

const headers = {
  'Cache-Control': 'no-store'
}

function fail(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers }
  )
}

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { id } = await params

  if (!/^\d{17,20}$/.test(id)) {
    return fail('invalid_guild_id', 400)
  }

  try {
    // 1. Verify Discord login
    const session = await getSession()

    if (!session) {
      return fail('unauthenticated', 401)
    }

    // 2. Verify server management permission
    const guilds = await fetchUserGuilds(
      session.accessToken
    )

    const allowed = guilds.some(
      guild =>
        guild.id === id &&
        canManageGuild(guild)
    )

    if (!allowed) {
      return fail('forbidden', 403)
    }

    // 3. Verify Neon database configuration
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      return fail('database_not_configured', 503)
    }

    const sql = neon(databaseUrl)

    // 4. Read tickets synced by KataBump
    const rows = await sql`
      SELECT
        tickets,
        updated_at
      FROM cyber_ticket_snapshots
      WHERE guild_id = ${id}
      LIMIT 1
    `

    // 5. No snapshot yet
    if (rows.length === 0) {
      return NextResponse.json(
        {
          guildId: id,
          tickets: [],
          totalVisible: 0,
          truncated: false,
          fetchedAt: null,
          synced: false
        },
        { headers }
      )
    }

    // 6. Validate saved snapshot
    const row = rows[0]
    const tickets = row.tickets

    if (!Array.isArray(tickets)) {
      return fail('invalid_ticket_snapshot', 502)
    }

    // 7. Return data in existing V7 format
    return NextResponse.json(
      {
        guildId: id,
        tickets,
        totalVisible: tickets.length,
        truncated: tickets.length >= 100,
        fetchedAt: row.updated_at,
        synced: true
      },
      { headers }
    )

  } catch (error) {
    console.error(
      '[CYBER V7 Live Tickets]',
      error instanceof Error
        ? error.message
        : 'Unknown error'
    )

    return fail('tickets_unavailable', 502)
  }
}
