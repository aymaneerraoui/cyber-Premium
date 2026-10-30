import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSession } from '@/lib/server/session'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ id: string }> }
const responseHeaders = { 'Cache-Control': 'no-store' }
function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: responseHeaders })
}
type StaffRow = { staffId: string; ticketsHandled: number; lastCompletedAt: string | null }
type DiscordMember = { nick?: string | null; avatar?: string | null; user?: { id: string; username: string; global_name?: string | null; avatar?: string | null; discriminator?: string } }
function defaultAvatar(id: string) {
  const index = Number(id.slice(-6)) % 6
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}
async function getStaffProfile(guildId: string, staffId: string, token: string) {
  const fallback = { displayName: `Staff ${staffId.slice(-6)}`, avatarUrl: defaultAvatar(staffId) }
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${staffId}`, {
      headers: { Authorization: `Bot ${token}` },
      cache: 'no-store', signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) return fallback
    const member = await response.json() as DiscordMember
    const user = member.user
    const displayName = member.nick || user?.global_name || user?.username || fallback.displayName
    const avatarUrl = member.avatar
      ? `https://cdn.discordapp.com/guilds/${guildId}/users/${staffId}/avatars/${member.avatar}.png?size=128`
      : user?.avatar
        ? `https://cdn.discordapp.com/avatars/${staffId}/${user.avatar}.png?size=128`
        : fallback.avatarUrl
    return { displayName, avatarUrl }
  } catch {
    return fallback
  }
}
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  if (!/^\d{17,20}$/.test(id)) return fail('invalid_guild_id', 400)
  try {
    const session = await getSession()
    if (!session) return fail('unauthenticated', 401)
    const guilds = await fetchUserGuilds(session.accessToken)
    if (!guilds.some(guild => guild.id === id && canManageGuild(guild))) return fail('forbidden', 403)
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) return fail('database_not_configured', 503)
    const sql = neon(databaseUrl)
    const leaderboard = await sql`
      WITH closed_tickets AS (
        SELECT DISTINCT ON (ticket_id) ticket_id, claimed_by_id, occurred_at
        FROM cyber_ticket_events
        WHERE guild_id = ${id} AND event_type = 'closed'
        ORDER BY ticket_id, occurred_at ASC, event_id ASC
      )
      SELECT claimed_by_id AS "staffId", COUNT(*)::int AS "ticketsHandled",
        MAX(occurred_at) AS "lastCompletedAt"
      FROM closed_tickets WHERE claimed_by_id IS NOT NULL
      GROUP BY claimed_by_id
      ORDER BY "ticketsHandled" DESC, "lastCompletedAt" ASC, "staffId" ASC
      LIMIT 100
    `
    const logs = await sql`
      SELECT event_id AS "eventId", ticket_id AS "ticketId", panel_id AS "panelId",
        owner_id AS "ownerId", actor_id AS "actorId", event_type AS "type",
        claimed_by_id AS "claimedById", occurred_at AS "occurredAt"
      FROM cyber_ticket_events WHERE guild_id = ${id}
      ORDER BY occurred_at DESC, event_id DESC LIMIT 100
    `
    const summaryRows = await sql`
      SELECT
        COUNT(DISTINCT ticket_id) FILTER (WHERE event_type = 'created')::int AS "totalCreated",
        COUNT(DISTINCT ticket_id) FILTER (WHERE event_type = 'closed')::int AS "totalClosed",
        COUNT(DISTINCT ticket_id) FILTER (WHERE event_type = 'deleted')::int AS "totalDeleted",
        COUNT(DISTINCT actor_id) FILTER (WHERE event_type = 'claimed')::int AS "staffWhoClaimed"
      FROM cyber_ticket_events WHERE guild_id = ${id}
    `
    const token = process.env.DISCORD_BOT_TOKEN
    const enriched = await Promise.all(leaderboard.map(async (row, index) => {
      const staff = row as StaffRow
      const profile = token ? await getStaffProfile(id, staff.staffId, token) : {
        displayName: `Staff ${staff.staffId.slice(-6)}`, avatarUrl: defaultAvatar(staff.staffId)
      }
      return { ...staff, rank: index + 1, ...profile }
    }))
    return NextResponse.json({
      ok: true, guildId: id, leaderboard: enriched, logs,
      summary: summaryRows[0] || { totalCreated: 0, totalClosed: 0, totalDeleted: 0, staffWhoClaimed: 0 },
      fetchedAt: new Date().toISOString()
    }, { headers: responseHeaders })
  } catch (error) {
    console.error('[CYBER V8.1 Analytics]', error instanceof Error ? error.message : 'Unknown error')
    return fail('analytics_unavailable', 502)
  }
}
