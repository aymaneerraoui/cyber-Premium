import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getSession } from '@/lib/server/session'
import { fetchUserGuilds } from '@/lib/server/discord'
import { canManageGuild } from '@/lib/discord-permissions'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Ctx={params:Promise<{id:string}>}
async function access(id:string){
 if(!/^\d{17,20}$/.test(id)) return false
 const session=await getSession();if(!session)return false
 const guilds=await fetchUserGuilds(session.accessToken)
 return guilds.some(g=>g.id===id&&canManageGuild(g))
}
async function db(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is missing')
 const sql=neon(process.env.DATABASE_URL)
 await sql`CREATE TABLE IF NOT EXISTS cyber_apply_config (guild_id TEXT PRIMARY KEY, config JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
 return sql
}
export async function GET(_req:Request,{params}:Ctx){
 try{const {id}=await params;if(!await access(id))return NextResponse.json({error:'Unauthorized'},{status:403});const sql=await db();const rows=await sql`SELECT config FROM cyber_apply_config WHERE guild_id=${id}`;return NextResponse.json({config:rows[0]?.config??null})}catch(e){console.error('[CYBER Apply GET]',e);return NextResponse.json({error:'Unable to load application configuration'},{status:503})}
}
export async function PUT(req:Request,{params}:Ctx){
 try{const {id}=await params;if(!await access(id))return NextResponse.json({error:'Unauthorized'},{status:403});const value=await req.json();if(!value||typeof value!=='object'||!Array.isArray(value.questions)||value.questions.length>10||value.questions.some((q:unknown)=>typeof q!=='object'||q===null||typeof (q as {text?:unknown}).text!=='string'||(q as {text:string}).text.length>300))return NextResponse.json({error:'Invalid questions (maximum 10)'},{status:400});const config=JSON.stringify(value);if(config.length>25000)return NextResponse.json({error:'Configuration too large'},{status:400});const sql=await db();await sql`INSERT INTO cyber_apply_config(guild_id,config) VALUES(${id},${config}::jsonb) ON CONFLICT(guild_id) DO UPDATE SET config=EXCLUDED.config,updated_at=NOW()`;return NextResponse.json({ok:true})}catch(e){console.error('[CYBER Apply PUT]',e);return NextResponse.json({error:'Unable to save application configuration'},{status:503})}
}
