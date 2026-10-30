'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowUpRight, ClipboardList, Megaphone, ScrollText, Shield, Ticket } from 'lucide-react'
import { useMemo } from 'react'
import { Counter } from '@/components/motion/primitives'
import { useResource, useServer } from '@/hooks/use-cyber'
import { EASE_OUT } from '@/lib/motion'
import { NAV_GROUPS } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { PageHeader } from './page-header'
import { SectionCard } from './status'

export function ServerOverview({ serverId }: { serverId: string }) {
  const { data: server } = useServer(serverId)
  const panels = useResource(serverId, 'ticketPanels').data
  const categories = useResource(serverId, 'ticketCategories').data
  const forms = useResource(serverId, 'applicationForms').data
  const announcements = useResource(serverId, 'announcements').data
  const records = useResource(serverId, 'moderationRecords').data
  const audit = useResource(serverId, 'auditEvents').data
  const modules = useResource(serverId, 'modules').data

  const stats = [
    { label: 'Ticket panels', value: panels?.length, icon: Ticket, href: 'tickets/panels' },
    { label: 'Active categories', value: categories?.filter((c) => c.enabled).length, icon: ScrollText, href: 'tickets/categories' },
    { label: 'Application forms', value: forms?.length, icon: ClipboardList, href: 'applications' },
    { label: 'Announcement drafts', value: announcements?.filter((a) => a.kind === 'draft').length, icon: Megaphone, href: 'announcements' },
  ]

  const activity = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (13 - i))
      return { date: d, count: 0 }
    })
    for (const r of records ?? []) {
      const t = new Date(r.createdAt)
      t.setHours(0, 0, 0, 0)
      const day = days.find((d) => d.date.getTime() === t.getTime())
      if (day) day.count += 1
    }
    return days
  }, [records])
  const maxActivity = Math.max(1, ...activity.map((a) => a.count))

  const moduleItems = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.module)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SERVER OVERVIEW"
        title={server?.name ?? 'Overview'}
        description="Module status, configuration totals and recent activity for this server."
        badges={
          server?.mode === 'demo' ? (
            <span className="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wider text-warning">SAMPLE DATA</span>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.45, ease: EASE_OUT }}>
            <Link
              href={`/dashboard/${serverId}/${s.href}`}
              className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between">
                <s.icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <ArrowUpRight className="size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                {s.value === undefined ? (
                  <span className="h-9 w-12 animate-pulse rounded bg-muted" />
                ) : (
                  <Counter value={s.value} duration={0.9} className="font-mono text-3xl font-bold" />
                )}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard icon={Shield} title="Moderation activity" description="Actions recorded over the last 14 days">
          <div className="flex h-44 items-end gap-1.5" role="img" aria-label={`Moderation actions per day, maximum ${maxActivity}`}>
            {activity.map((a, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <motion.div
                  className={cn('w-full rounded-sm', a.count > 0 ? 'bg-primary' : 'bg-muted')}
                  initial={{ height: 0 }}
                  animate={{ height: a.count > 0 ? `${(a.count / maxActivity) * 100}%` : 3 }}
                  transition={{ delay: 0.2 + i * 0.03, duration: 0.7, ease: EASE_OUT }}
                  style={{ opacity: a.count > 0 ? 0.4 + (a.count / maxActivity) * 0.6 : 1 }}
                />
                <span className="font-mono text-[0.55rem] text-muted-foreground">{a.date.getDate()}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={ScrollText}
          title="Recent events"
          actions={
            <Link href={`/dashboard/${serverId}/logs`} className="text-xs text-primary hover:underline">
              Audit log
            </Link>
          }
          contentClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {(audit ?? []).slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', e.severity === 'critical' ? 'bg-destructive' : e.severity === 'warning' ? 'bg-warning' : 'bg-muted-foreground')}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm">{e.message}</span>
                  <span className="font-mono text-[0.62rem] text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
            {!audit && <li className="m-5 h-24 animate-pulse rounded-md bg-muted" />}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Modules"
        description="Status of each module on this server"
        actions={
          <Link href={`/dashboard/${serverId}/modules`} className="text-xs text-primary hover:underline">
            Manage modules
          </Link>
        }
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {moduleItems.map((m) => {
            const enabled = modules ? modules[m.module!] !== false : undefined
            return (
              <li key={m.id}>
                <Link
                  href={`/dashboard/${serverId}/${m.segment}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:border-foreground/15"
                >
                  <m.icon className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{m.label}</span>
                  <span
                    className={cn(
                      'font-mono text-[0.6rem] tracking-wider',
                      enabled === undefined ? 'text-muted-foreground' : enabled ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {enabled === undefined ? '…' : enabled ? 'ON' : 'OFF'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </SectionCard>
    </div>
  )
}
