
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSession } from '@/lib/server/session'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = {
  params: Promise<{ id: string; resource: string }>
}

const resources = new Set([
  'ticketPanels',
  'ticketCategories',
  'ticketSettings',
  'applicationForms',
  'announcements',
  'antiSpam',
  'staffPermissions',
  'moderationRecords',
  'auditEvents',
  'streamFeeds',
  'videoFeeds',
  'modules',
  'welcome',
  'suggestions',
  'scheduled',
  'general'
])

const NO_STORE = { 'Cache-Control': 'no-store' }

async function authorize(id: string, resource: string) {
  if (!/^\d{17,20}$/.test(id) || !resources.has(resource)) {
    return { error: 'invalid_request', status: 400 }
  }

  const session = await getSession()

  if (!session) {
    return { error: 'unauthenticated', status: 401 }
  }

  if (!process.env.DATABASE_URL) {
    return { error: 'database_unavailable', status: 503 }
  }

  const guilds = await fetchUserGuilds(session.accessToken)

  if (!guilds.some(g => g.id === id && canManageGuild(g))) {
    return { error: 'forbidden', status: 403 }
  }

  const sql = neon(process.env.DATABASE_URL)

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
    !ids.every(value => typeof value === 'string') ||
    !ids.includes(id)
  ) {
    return { error: 'bot_not_connected', status: 503 }
  }

  return { sql }
}

function failure(error: string, status: number) {
  return NextResponse.json(
    { error, message: error },
    { status, headers: NO_STORE }
  )
}

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { id, resource } = await params

  try {
    const auth = await authorize(id, resource)

    if ('error' in auth) {
      return failure(auth.error!, auth.status!)
    }

    const rows = await auth.sql`
      SELECT config
      FROM cyber_server_config
      WHERE guild_id = ${id}
        AND resource_key = ${resource}
      LIMIT 1
    `

    if (!rows.length) {
      return failure('config_not_initialized', 404)
    }

    return NextResponse.json(rows[0].config, {
      headers: NO_STORE
    })
  } catch (error) {
    console.error('[config GET]', error)
    return failure('config_unavailable', 502)
  }
}

export async function PUT(
  request: Request,
  { params }: Context
) {
  const { id, resource } = await params

  try {
    const auth = await authorize(id, resource)

    if ('error' in auth) {
      return failure(auth.error!, auth.status!)
    }

    const raw = await request.text()

    if (raw.length > 500_000) {
      return failure('config_too_large', 413)
    }

    let body: unknown

    try {
      body = JSON.parse(raw)
    } catch {
      return failure('invalid_json', 400)
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      !('value' in body)
    ) {
      return failure('invalid_config', 400)
    }

    const value = (body as { value: unknown }).value

    if (value === undefined || value === null) {
      return failure('invalid_config', 400)
    }

    const serialized = JSON.stringify(value)

    const rows = await auth.sql`
      INSERT INTO cyber_server_config (
        guild_id, resource_key, config, updated_at
      )
      VALUES (
        ${id}, ${resource}, ${serialized}::jsonb, NOW()
      )
      ON CONFLICT (guild_id, resource_key)
      DO UPDATE SET
        config = EXCLUDED.config,
        updated_at = NOW()
      RETURNING config
    `

    return NextResponse.json(rows[0].config, {
      headers: NO_STORE
    })
  } catch (error) {
    console.error('[config PUT]', error)
    return failure('config_save_failed', 502)
  }
}
