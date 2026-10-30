import { NextRequest,NextResponse } from 'next/server'
import {getSession} from '@/lib/server/session'
import {fetchUserGuilds} from '@/lib/server/discord'
import {canManageGuild} from '@/lib/discord-permissions'
import {discord,publisher,publishLeaderboard} from '@/lib/server/cyber-leaderboard'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type C={params:Promise<{id:string}>}
async function permitted(id:string){const session=await getSession();if(!session)return {error:'Unauthenticated',status:401};const guilds=await fetchUserGuilds(session.accessToken);if(!guilds.some(g=>g.id===id&&canManageGuild(g)))return {error:'Forbidden',status:403};return null}
export async function GET(_req:NextRequest,{params}:C){
 const {id}=await params;try{const denial=await permitted(id);if(denial)return NextResponse.json({error:denial.error},{status:denial.status});const [channels,settings]=await Promise.all([discord(`/guilds/${id}/channels`),publisher(id)]);return NextResponse.json({ok:true,channels:channels.filter((x:any)=>[0,5].includes(x.type)).map((x:any)=>({id:x.id,name:x.name})),settings:settings||null})}catch(e){console.error('[V9 GET]',e);return NextResponse.json({error:'Unable to load publisher settings'},{status:503})}
}
export async function POST(req:NextRequest,{params}:C){
 const {id}=await params;try{const denial=await permitted(id);if(denial)return NextResponse.json({error:denial.error},{status:denial.status});const body=await req.json();if(!/^\d{17,20}$/.test(body?.channelId||''))return NextResponse.json({error:'Invalid channel'},{status:400});const result=await publishLeaderboard(id,body.channelId);return NextResponse.json(result)}catch(e){console.error('[V9 POST]',e);return NextResponse.json({error:e instanceof Error?e.message:'Publishing failed'},{status:503})}
}
