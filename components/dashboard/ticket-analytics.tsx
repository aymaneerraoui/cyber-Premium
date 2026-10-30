'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Crown, Medal, Trophy, RefreshCw, ScrollText, Ticket, UserRound, Clock3 } from 'lucide-react'

type Staff = { staffId: string; ticketsHandled: number; lastCompletedAt: string | null; rank: number; displayName?: string; avatarUrl?: string }
type Log = { eventId: string; ticketId: string; panelId: string; ownerId: string; actorId: string; type: string; claimedById: string | null; occurredAt: string }
type Analytics = {
  ok: boolean
  leaderboard: Staff[]
  logs: Log[]
  summary: { totalCreated: number; totalClosed: number; totalDeleted: number; staffWhoClaimed: number }
}

const GOLD = '#eabf46'
const dateLabel = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString()
}
const defaultAvatar = (id: string) => {
  try { return `https://cdn.discordapp.com/embed/avatars/${(Number(id.slice(-6)) % 6)}.png` }
  catch { return 'https://cdn.discordapp.com/embed/avatars/0.png' }
}
const eventLabel: Record<string, string> = {
  created: 'Created', claimed: 'Claimed', unclaimed: 'Unclaimed', closed: 'Closed', deleted: 'Deleted'
}

function PodiumMember({ staff, place }: { staff?: Staff; place: 1 | 2 | 3 }) {
  const reduced = useReducedMotion()
  const first = place === 1
  const height = first ? 'h-32 sm:h-40' : place === 2 ? 'h-24 sm:h-28' : 'h-20 sm:h-24'
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: place === 2 ? 0.1 : place === 1 ? 0.25 : 0.4 }}
      className="flex min-w-0 flex-col items-center justify-end gap-2"
    >
      <motion.div animate={reduced ? undefined : { y: [0, -7, 0] }} transition={{ duration: 3.7 + place * 0.4, repeat: Infinity, ease: 'easeInOut' }} className="flex w-full flex-col items-center gap-2">
        {first ? <Crown className="size-6 text-[#eabf46] drop-shadow-[0_0_12px_rgba(234,191,70,0.75)]" /> : <Medal className="size-5 text-[#c9b991]" />}
        <div className={`relative rounded-full border-2 ${first ? 'border-[#eabf46] p-1 shadow-[0_0_30px_rgba(234,191,70,0.4)]' : 'border-[#9b8144] p-0.5'}`}>
          {staff ? (
            <img src={staff.avatarUrl || defaultAvatar(staff.staffId)} alt={`${staff.displayName || "Staff"} Discord avatar`} className={`${first ? 'size-16 sm:size-20' : 'size-12 sm:size-16'} rounded-full bg-[#242327]`} />
          ) : <div className={`${first ? 'size-16 sm:size-20' : 'size-12 sm:size-16'} grid place-items-center rounded-full bg-[#242327]`}><UserRound className="size-6 text-[#8c8c92]" /></div>}
          <span className="absolute -bottom-1 -right-2 min-w-7 rounded-full border-2 border-[#111115] bg-[#eabf46] px-1.5 py-0.5 text-center text-[11px] font-black text-black">{staff?.ticketsHandled ?? 0}</span>
        </div>
        <p className="max-w-full truncate px-1 text-center text-xs font-bold text-white">{staff ? (staff.displayName || `Staff ${staff.staffId.slice(-6)}`) : 'Unranked'}</p>
        <p className="max-w-full truncate px-1 text-center text-[10px] text-[#8d8c93]" title={staff?.staffId}>{staff?.staffId ?? 'No staff yet'}</p>
      </motion.div>
      <div className={`flex w-full items-center justify-center rounded-t-xl border border-[#eabf46]/30 bg-gradient-to-b from-[#eabf46]/20 to-[#171619] ${height} ${first ? 'shadow-[0_0_35px_rgba(234,191,70,0.12)]' : ''}`}>
        <span className={`${first ? 'text-5xl' : 'text-4xl'} font-black text-[#eabf46]`}>{place}</span>
      </div>
    </motion.div>
  )
}

export function TicketAnalytics({ serverId }: { serverId: string }) {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/servers/${encodeURIComponent(serverId)}/tickets/analytics`, {
          credentials: 'include', cache: 'no-store', signal: controller.signal
        })
        const json: unknown = await response.json()
        if (!response.ok) throw new Error((json as { error?: string })?.error || `HTTP ${response.status}`)
        const result = json as Analytics
        if (!Array.isArray(result.leaderboard) || !Array.isArray(result.logs)) throw new Error('Invalid analytics response')
        if (!controller.signal.aborted) setData(result)
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load analytics')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [serverId, refresh])

  const staff = data?.leaderboard ?? []
  const logs = data?.logs ?? []
  return (
    <div className="space-y-6">
      <motion.section initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-[#eabf46]/30 bg-[#101014] p-5 text-white sm:p-7">
        <motion.div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full border border-[#eabf46]/20" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }} />
        <div className="relative mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#eabf46]">CYBER V8 · Staff Performance</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black sm:text-2xl"><Trophy className="size-6 text-[#eabf46]" /> Staff Leaderboard</h2>
            <p className="mt-1 text-xs text-[#9b9ba5]">Ranked by unique tickets closed while claimed · Since V8 tracking began</p>
          </div>
          <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={loading} className="flex items-center gap-2 rounded-lg border border-[#eabf46]/40 px-3 py-2 text-xs font-semibold text-[#eabf46] hover:bg-[#eabf46]/10 disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
        {error && <p role="alert" className="mb-4 text-sm text-red-400">Analytics unavailable: {error}</p>}
        {loading && <p className="mb-4 text-sm text-[#a3a3ad]">Loading performance data...</p>}
        {!loading && !error && <>
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-5">
            <PodiumMember place={2} staff={staff[1]} />
            <PodiumMember place={1} staff={staff[0]} />
            <PodiumMember place={3} staff={staff[2]} />
          </div>
          {staff.length === 0 && <p className="mt-4 text-center text-xs text-[#a3a3ad]">Close a claimed ticket to populate the leaderboard.</p>}
          <div className="mt-6 space-y-2 border-t border-[#eabf46]/20 pt-5">
            <h3 className="mb-3 text-sm font-bold text-[#eabf46]">Top Staff Ranking · #4–#10</h3>
            {Array.from({ length: 7 }, (_, index) => {
              const person = staff[index + 3]
              return <motion.div key={person?.staffId ?? `empty-${index}`} initial={reduced ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.06, 0.5) }} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="w-7 text-center font-black text-[#eabf46]">#{index + 4}</span>
                {person ? <img src={person.avatarUrl || defaultAvatar(person.staffId)} alt={`${person.displayName || 'Staff'} avatar`} className="size-9 rounded-full" /> : <div className="grid size-9 place-items-center rounded-full bg-[#242327]"><UserRound className="size-5 text-[#8c8c92]" /></div>}
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{person?.displayName || (person ? `Staff ${person.staffId.slice(-6)}` : 'No staff assigned')}</p><p className="truncate text-[10px] text-[#9b9ba5]">{person?.staffId || 'Not ranked yet'}</p></div>
                <span className="rounded-full bg-[#eabf46]/15 px-3 py-1 text-xs font-bold text-[#eabf46]">{person?.ticketsHandled ?? 0} tickets</span>
              </motion.div>
            })}
          </div>
        </>}
      </motion.section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><ScrollText className="size-5 text-primary" /><div><h2 className="font-bold">Ticket Logs</h2><p className="text-xs text-muted-foreground">Permanent event history · Latest 100 events</p></div></div>
        {data && <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([['Created', data.summary.totalCreated], ['Closed', data.summary.totalClosed], ['Deleted', data.summary.totalDeleted], ['Staff claimed', data.summary.staffWhoClaimed]] as const).map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black text-primary">{value}</p></div>)}
        </div>}
        {!loading && !error && logs.length === 0 && <p className="py-5 text-sm text-muted-foreground">No ticket events recorded yet.</p>}
        <div className="max-h-[420px] space-y-2 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin] [scrollbar-color:#eabf46_#18181b]">
          {logs.map(log => <div key={log.eventId} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3 sm:p-4">
            <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10"><Ticket className="size-4 text-primary" /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{eventLabel[log.type] ?? log.type} <span className="font-normal text-muted-foreground">· Ticket {log.ticketId.slice(-6)}</span></p><p className="break-all text-xs text-muted-foreground">By: {log.actorId} · Ticket: {log.ticketId}</p></div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {dateLabel(log.occurredAt)}</span>
          </div>)}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">Could not load ticket logs: {error}</p>}
      </section>
    </div>
  )
}
