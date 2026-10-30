import { neon } from '@neondatabase/serverless'

const API = 'https://discord.com/api/v10'
const snowflake = /^\d{17,20}$/
const token = () => { const t=process.env.DISCORD_BOT_TOKEN; if(!t) throw new Error('DISCORD_BOT_TOKEN missing'); return t }
const db = () => { const url=process.env.DATABASE_URL; if(!url) throw new Error('DATABASE_URL missing'); return neon(url) }
export async function discord(path:string, init:RequestInit={}) {
 const r=await fetch(`${API}${path}`,{...init,headers:{Authorization:`Bot ${token()}`,...(init.headers||{})},cache:'no-store'})
 if(!r.ok) throw new Error(`Discord HTTP ${r.status}: ${(await r.text()).slice(0,250)}`)
 return r.status===204?null:r.json()
}
export async function ensurePublisherTable(){
 const sql=db(); await sql`CREATE TABLE IF NOT EXISTS cyber_leaderboard_publishers (guild_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, message_id TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
}
export async function publisher(guildId:string){
 await ensurePublisherTable();const sql=db();const rows=await sql`SELECT channel_id AS "channelId", message_id AS "messageId" FROM cyber_leaderboard_publishers WHERE guild_id=${guildId}`;return rows[0] as {channelId:string;messageId:string|null}|undefined
}
async function ranking(guildId:string){
 const sql=db();const rows=await sql`
 WITH closed AS (SELECT DISTINCT ON (ticket_id) ticket_id,claimed_by_id,occurred_at FROM cyber_ticket_events WHERE guild_id=${guildId} AND event_type='closed' ORDER BY ticket_id,occurred_at ASC,event_id ASC)
 SELECT claimed_by_id AS "staffId",COUNT(*)::int AS "ticketsHandled" FROM closed WHERE claimed_by_id IS NOT NULL GROUP BY claimed_by_id ORDER BY "ticketsHandled" DESC,"staffId" ASC LIMIT 10`
 return Promise.all(rows.map(async (r:any)=>{
  let name=`Staff ${String(r.staffId).slice(-6)}`
  try { const u=await discord(`/users/${r.staffId}`);name=String(u.global_name||u.username||name) }catch{}
  return {staffId:String(r.staffId),name,ticketsHandled:Number(r.ticketsHandled)}
 }))
}
const locks=new Set<string>()
export async function publishLeaderboard(guildId:string,channelOverride?:string){
 if(!snowflake.test(guildId)) throw new Error('Invalid guild')
 if(locks.has(guildId)) return {skipped:true}
 locks.add(guildId)
 try{
  await ensurePublisherTable();const sql=db();const previous=await publisher(guildId)
  const channelId=channelOverride||previous?.channelId
  if(!channelId||!snowflake.test(channelId)) throw new Error('Select a valid channel')
  const ch=await discord(`/channels/${channelId}`)
  if(ch.guild_id!==guildId||![0,5].includes(ch.type))throw new Error('Channel must be a text/announcement channel in this server')
  const people = await ranking(guildId)
  const LRM = '\u200e'
  const fields = Array.from({ length: 10 }, (_, i) => {
    const person = people[i]
    const rank = ['🥇 #1', '🥈 #2', '🥉 #3'][i] || `#${i + 1}`
    return {
      name: `${LRM}${rank}  |  ${person ? `${person.ticketsHandled} Tickets Closed` : '0 Tickets Closed'}`,
      value: person ? `${LRM}<@${person.staffId}>` : `${LRM}Unranked`,
      inline: false
    }
  })
  const embed = {
    title: `${LRM}🏆 CYBER STAFF LEADERBOARD — TOP 10`,
    description: `${LRM}**LIVE TICKET PERFORMANCE**\nRanked by unique tickets closed while claimed.`,
    color: 0xeabf46,
    fields,
    footer: { text: 'ONE COMMUNITY. ONE POWER. ONE LEGACY. • Automatically updated' },
    timestamp: new Date().toISOString()
  }
  const payload = {
    content: '',
    embeds: [embed],
    attachments: [],
    allowed_mentions: { parse: [], users: [], roles: [] }
  }
  let message: any
  let edited = false
  if (previous?.messageId && previous.channelId === channelId) {
    try {
      message = await discord(`/channels/${channelId}/messages/${previous.messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      edited = true
    } catch (e) {
      if (!String(e).includes('Discord HTTP 404')) throw e
    }
  }
  if (!message) {
    message = await discord(`/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
  await sql`INSERT INTO cyber_leaderboard_publishers(guild_id,channel_id,message_id,updated_at) VALUES(${guildId},${channelId},${String(message.id)},NOW()) ON CONFLICT(guild_id) DO UPDATE SET channel_id=EXCLUDED.channel_id,message_id=EXCLUDED.message_id,updated_at=NOW()`
  return {ok:true,channelId,messageId:String(message.id),edited,staffCount:people.length}
 }finally{locks.delete(guildId)}
}
export async function refreshPublishedLeaderboard(guildId:string){
 const setting=await publisher(guildId);if(!setting)return {skipped:true};return publishLeaderboard(guildId)
}
