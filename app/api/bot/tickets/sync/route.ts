import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest): boolean {
  const secret = process.env.BOT_API_SECRET
  const provided = request.headers.get('authorization')
  if (!secret || !provided?.startsWith('Bearer ')) return false
  const expected = Buffer.from(secret)
  const actual = Buffer.from(provided.slice(7))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

type Ticket = {
  id: string
  guildId: string
  panelId: string
  ownerId: string
  name: string
  status: 'open' | 'closed'
  createdAt: string | null
  url: string
  claimedById: string | null
}

const snowflake = /^\d{17,20}$/

function isTicket(value: unknown, guildId: string): value is Ticket {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return snowflake.test(String(t.id ?? '')) &&
    t.guildId === guildId &&
    typeof t.panelId === 'string' && t.panelId.length > 0 && t.panelId.length <= 128 &&
    typeof t.ownerId === 'string' && snowflake.test(t.ownerId) &&
    typeof t.name === 'string' && t.name.length <= 100 &&
    (t.status === 'open' || t.status === 'closed') &&
    (t.createdAt === null || (typeof t.createdAt === 'string' && !Number.isNaN(Date.parse(t.createdAt)))) &&
    typeof t.url === 'string' && t.url === `https://discord.com/channels/${guildId}/${t.id}` &&
    (t.claimedById === null || (typeof t.claimedById === 'string' && snowflake.test(t.claimedById)))
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  let payload: unknown
  try { payload = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const body = payload as Record<string, unknown>
  const guildId = body.guildId
  const tickets = body.tickets
  if (typeof guildId !== 'string' || !snowflake.test(guildId) || !Array.isArray(tickets) || tickets.length > 100 || !tickets.every(t => isTicket(t, guildId))) {
    return NextResponse.json({ error: 'Invalid ticket payload' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)
    await sql`
      CREATE TABLE IF NOT EXISTS cyber_ticket_snapshots (
        guild_id TEXT PRIMARY KEY,
        tickets JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      INSERT INTO cyber_ticket_snapshots (guild_id, tickets, updated_at)
      VALUES (${guildId}, ${JSON.stringify(tickets)}::jsonb, NOW())
      ON CONFLICT (guild_id) DO UPDATE SET
        tickets = EXCLUDED.tickets,
        updated_at = NOW()
    `
    return NextResponse.json({ ok: true, count: tickets.length })
  } catch (error) {
    console.error('[ticket sync]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
