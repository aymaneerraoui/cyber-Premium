
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

function authorized(request: NextRequest): boolean {
  const secret = process.env.BOT_API_SECRET
  const provided = request.headers.get('authorization')

  if (!secret || !provided?.startsWith('Bearer ')) return false

  const expected = Buffer.from(secret)
  const actual = Buffer.from(provided.slice(7))

  return expected.length === actual.length &&
    timingSafeEqual(expected, actual)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as { guildIds?: unknown }).guildIds)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const guildIds = (body as { guildIds: unknown[] }).guildIds

  if (
    guildIds.length > 1000 ||
    !guildIds.every(
      (id) => typeof id === 'string' && /^\d{17,20}$/.test(id)
    )
  ) {
    return NextResponse.json({ error: 'Invalid guild IDs' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    await sql`
      CREATE TABLE IF NOT EXISTS cyber_bot_status (
        bot_id TEXT PRIMARY KEY,
        guild_ids JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      INSERT INTO cyber_bot_status (bot_id, guild_ids, updated_at)
      VALUES ('cyber', ${JSON.stringify(guildIds)}::jsonb, NOW())
      ON CONFLICT (bot_id)
      DO UPDATE SET
        guild_ids = EXCLUDED.guild_ids,
        updated_at = NOW()
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[heartbeat] Database error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
