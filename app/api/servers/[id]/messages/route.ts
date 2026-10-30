import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSession } from '@/lib/server/session'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ id: string }> }
type Button = { id: string; label: string; emoji?: string; style: string }
type Asset = { url: string } | null
type Embed = { title?: string; description?: string; color?: string; thumbnail?: Asset; image?: Asset; footerText?: string }
type Panel = { id: string; channelId: string | null; message: { content: string; embeds: Embed[]; buttons: Button[] } }
const snowflake = /^\d{17,20}$/
const noStore = { 'Cache-Control': 'no-store' }
const fail = (message: string, status: number) => NextResponse.json({ message }, { status, headers: noStore })
function imageUrl(url?: string) {
  if (!url) return undefined
  try { const u = new URL(url); return u.protocol === 'https:' ? url : undefined } catch { return undefined }
}
function embedPayload(e: Embed) {
  const thumbnail = imageUrl(e.thumbnail?.url)
  const image = imageUrl(e.image?.url)
  return {
    title: (e.title ?? '').slice(0, 256),
    description: (e.description ?? '').slice(0, 4096),
    color: /^#[\da-f]{6}$/i.test(e.color ?? '') ? parseInt(e.color!.slice(1), 16) : 0xeabf46,
    ...(thumbnail ? { thumbnail: { url: thumbnail } } : {}),
    ...(image ? { image: { url: image } } : {}),
    ...(e.footerText ? { footer: { text: e.footerText.slice(0, 2048) } } : {})
  }
}
function buttonPayload(b: Button, panelId: string) {
  const styles: Record<string, number> = { primary: 1, secondary: 2, success: 3, danger: 4 }
  const result: { type: number; style: number; label: string; custom_id: string; emoji?: { name: string; id?: string } } = {
    type: 2, style: styles[b.style], label: b.label.slice(0, 80), custom_id: `cyber_ticket:${panelId}:${b.id}`
  }
  const emoji = b.emoji?.trim()
  if (emoji) {
    const custom = emoji.match(/^<a?:([^:]+):(\d{17,20})>$/)
    if (custom) result.emoji = { name: custom[1], id: custom[2] }
    else if (!emoji.includes(':')) result.emoji = { name: emoji }
  }
  return result
}
async function discordPost(url: string, body: unknown, token?: string) {
  return fetch(url, {
    method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bot ${token}` } : {}) },
    body: JSON.stringify(body)
  })
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params
    if (!snowflake.test(id)) return fail('Invalid server ID', 400)
    const session = await getSession()
    if (!session) return fail('Login required', 401)
    const databaseUrl = process.env.DATABASE_URL
    const botToken = process.env.DISCORD_BOT_TOKEN
    if (!databaseUrl || !botToken) return fail('Bot or database not configured', 503)
    const guilds = await fetchUserGuilds(session.accessToken)
    if (!guilds.some(g => g.id === id && canManageGuild(g))) return fail('No permission to manage this server', 403)
    const sql = neon(databaseUrl)
    const connected = await sql`
      SELECT guild_ids FROM cyber_bot_status
      WHERE bot_id = 'cyber' AND updated_at > NOW() - INTERVAL '3 minutes' LIMIT 1
    `
    const guildIds: unknown = connected[0]?.guild_ids
    if (!Array.isArray(guildIds) || !guildIds.includes(id)) return fail('CYBER Bot is not connected', 503)
    const raw = await request.text()
    if (raw.length > 3000) return fail('Request too large', 413)
    let body: unknown
    try { body = JSON.parse(raw) } catch { return fail('Invalid JSON', 400) }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request', 400)
    const input = body as Record<string, unknown>
    if (typeof input.panelId !== 'string' || !/^[\da-f-]{36}$/i.test(input.panelId)) return fail('Invalid panel ID', 400)
    if (input.webhookUrl !== undefined && typeof input.webhookUrl !== 'string') return fail('Invalid webhook URL', 400)
    const webhookUrl = typeof input.webhookUrl === 'string' ? input.webhookUrl.trim() : ''
    const rows = await sql`
      SELECT config FROM cyber_server_config
      WHERE guild_id = ${id} AND resource_key = 'ticketPanels' LIMIT 1
    `
    const panels: unknown = rows[0]?.config
    if (!Array.isArray(panels)) return fail('Ticket panels not found', 404)
    const panel = panels.find((p: Panel) => p && p.id === input.panelId) as Panel | undefined
    if (!panel || !panel.channelId || !snowflake.test(panel.channelId)) return fail('Panel or channel not found', 404)
    if (!panel.message || !Array.isArray(panel.message.embeds) || !Array.isArray(panel.message.buttons)) return fail('Invalid panel configuration', 400)
    if (panel.message.embeds.length > 10 || panel.message.buttons.length > 5) return fail('Too many embeds or buttons', 400)
    const buttons = panel.message.buttons
    if (buttons.some(b => !b || typeof b.id !== 'string' || !/^[\da-f-]{36}$/i.test(b.id) || !b.label?.trim() || !['primary','secondary','success','danger'].includes(b.style))) return fail('Invalid ticket buttons', 400)
    const channelResponse = await fetch(`https://discord.com/api/v10/channels/${panel.channelId}`, {
      headers: { Authorization: `Bot ${botToken}` }, cache: 'no-store'
    })
    if (!channelResponse.ok) return fail('Unable to verify Discord channel', 502)
    const channel = await channelResponse.json()
    if (channel.guild_id !== id || ![0,5].includes(channel.type)) return fail('Channel does not belong to this server', 403)
    const embeds = panel.message.embeds.map(embedPayload)
    const content = typeof panel.message.content === 'string' ? panel.message.content.slice(0, 2000) : ''
    if (!content && !embeds.length) return fail('Panel message is empty', 400)
    const base = { content, embeds, allowed_mentions: { parse: [] } }
    const components = buttons.length ? [{ type: 1, components: buttons.map(b => buttonPayload(b, panel.id)) }] : []
    let messageId: string
    let buttonMessageId: string | undefined
    if (webhookUrl) {
      // Only Discord's fixed API hostname is contacted: never fetch an arbitrary user URL.
      const match = webhookUrl.match(/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/(\d{17,20})\/([\w.-]{30,})\/?$/)
      if (!match) return fail('Invalid Discord webhook URL', 400)
      const endpoint = `https://discord.com/api/v10/webhooks/${match[1]}/${match[2]}`
      const check = await fetch(endpoint, { cache: 'no-store' })
      if (!check.ok) return fail('Webhook not found or token invalid', 400)
      const webhook = await check.json()
      if (webhook.guild_id !== id || webhook.channel_id !== panel.channelId) return fail('Webhook must belong to the selected channel', 403)
      // User-created webhooks cannot host interactive buttons. Bot posts those separately.
      const posted = await discordPost(`${endpoint}?wait=true`, base)
      if (!posted.ok) return fail('Discord rejected the webhook message', 502)
      messageId = (await posted.json()).id
      if (components.length) {
        const buttonPost = await discordPost(`https://discord.com/api/v10/channels/${panel.channelId}/messages`, {
          content: '🎟️ Open a ticket using the button below.', components, allowed_mentions: { parse: [] }
        }, botToken)
        if (!buttonPost.ok) {
          console.error('[CYBER WEBHOOK BUTTONS]', buttonPost.status)
          return fail('Webhook panel sent, but CYBER could not send its ticket buttons', 502)
        }
        buttonMessageId = (await buttonPost.json()).id
      }
    } else {
      const posted = await discordPost(`https://discord.com/api/v10/channels/${panel.channelId}/messages`, {
        ...base, ...(components.length ? { components } : {})
      }, botToken)
      if (!posted.ok) {
        console.error('[CYBER BOT PUBLISH]', posted.status)
        return fail('Discord rejected the message', 502)
      }
      messageId = (await posted.json()).id
    }
    return NextResponse.json({ success: true, messageId, buttonMessageId, channelId: panel.channelId,
      message: webhookUrl ? 'Webhook panel published; CYBER buttons sent separately.' : 'Ticket panel published successfully.'
    }, { headers: noStore })
  } catch (error) {
    console.error('[CYBER TICKET PUBLISH]', error)
    return fail('Unable to publish ticket panel', 502)
  }
}
