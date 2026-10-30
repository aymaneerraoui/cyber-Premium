
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = {
  params: Promise<{
    guildId: string
    panelId: string
  }>
}

function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

function validSecret(provided: string, expected: string) {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)

  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(
  request: Request,
  { params }: Context
) {
  const { guildId, panelId } = await params

  const secret = process.env.BOT_API_SECRET
  const authorization = request.headers.get('authorization') ?? ''

  if (
    !secret ||
    !authorization.startsWith('Bearer ') ||
    !validSecret(authorization.slice(7), secret)
  ) {
    return unauthorized()
  }

  if (
    !/^\d{17,20}$/.test(guildId) ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(panelId)
  ) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database unavailable' },
      { status: 503 }
    )
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    const rows = await sql`
      SELECT config
      FROM cyber_server_config
      WHERE guild_id = ${guildId}
        AND resource_key = 'ticketPanels'
      LIMIT 1
    `

    const panels = rows[0]?.config

    if (!Array.isArray(panels)) {
      return NextResponse.json(
        { error: 'Ticket panels not found' },
        { status: 404 }
      )
    }

    const panel = panels.find(
      (item: { id?: string }) => item.id === panelId
    )

    if (!panel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        panelId: panel.id,
        name: panel.name,
        ticketSettings: panel.ticketSettings ?? {},
        ticketWelcome: panel.ticketWelcome ?? {},
        ticketCategoryId: panel.ticketCategoryId ?? null,
        staffRoleIds: panel.staffRoleIds ?? []
      },
      {
        headers: { 'Cache-Control': 'no-store' }
      }
    )
  } catch (error) {
    console.error('[BOT TICKET CONFIG]', error)

    return NextResponse.json(
      { error: 'Failed to load ticket configuration' },
      { status: 500 }
    )
  }
}
