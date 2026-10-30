'use client'

import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, ClipboardList, LayoutDashboard, Megaphone, Radar, ScrollText, Search, Shield, Ticket } from 'lucide-react'
import { useRef } from 'react'
import { CyberWordmark } from '@/components/brand/cyber-logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SectionHeading } from './section-heading'

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', active: false },
  { icon: Ticket, label: 'Tickets', active: true },
  { icon: ClipboardList, label: 'Applications', active: false },
  { icon: Megaphone, label: 'Announcements', active: false },
  { icon: Shield, label: 'Moderation', active: false },
  { icon: Radar, label: 'Anti-Spam', active: false },
  { icon: ScrollText, label: 'Audit Logs', active: false },
]

const BARS = [38, 52, 44, 70, 62, 84, 58, 76, 90, 66, 72, 95]

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 22, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0.9, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 1])

  return (
    <section id="preview" className="relative scroll-mt-20 overflow-hidden border-t border-border py-24 md:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14 px-5 md:px-8">
        <SectionHeading
          align="center"
          index="06"
          label="CONTROL SURFACE"
          title="One dashboard. Every module."
          description="A fast, keyboard-friendly control surface with a command menu, per-server configuration and clear status for every module."
        />

        <div ref={ref} className="w-full" style={{ perspective: 1400 }}>
          <motion.div
            style={{ rotateX, scale, opacity, transformOrigin: 'center top' }}
            className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-surface shadow-[0_60px_120px_-40px_rgba(255,212,0,0.18)]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="ml-4 hidden rounded-md bg-muted px-3 py-1 font-mono text-[0.65rem] text-muted-foreground sm:inline">cyber.app/dashboard/demo/tickets</span>
            </div>
            <div className="grid min-h-[420px] grid-cols-[56px_1fr] md:grid-cols-[220px_1fr]">
              <div className="flex flex-col gap-1 border-r border-border bg-sidebar p-2 md:p-3">
                <div className="mb-4 hidden px-2 md:block">
                  <CyberWordmark href="#preview" />
                </div>
                {NAV.map((n) => (
                  <div
                    key={n.label}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm',
                      n.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <n.icon className="size-4 shrink-0" />
                    <span className="hidden md:inline">{n.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="hud-label">TICKETS / OVERVIEW</div>
                    <div className="mt-1 text-lg font-semibold md:text-xl">Ticket System</div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                    <Search className="size-3.5" /> Search
                    <kbd className="ml-4 rounded bg-muted px-1.5 font-mono text-[0.6rem]">⌘K</kbd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {['Panels', 'Categories', 'Questions', 'Staff roles'].map((l, i) => (
                    <div key={l} className="rounded-lg border border-border bg-background p-3">
                      <div className="text-xs text-muted-foreground">{l}</div>
                      <div className="mt-1 font-mono text-2xl font-bold">{[1, 5, 7, 3][i]}</div>
                    </div>
                  ))}
                </div>
                <div className="grid flex-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
                  <div className="flex flex-col rounded-lg border border-border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Configuration activity (demo)</div>
                    <div className="mt-4 flex flex-1 items-end gap-1.5">
                      {BARS.map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm bg-primary/80"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.04, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          style={{ minHeight: 4, opacity: 0.35 + (h / 100) * 0.65 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Categories</div>
                    {['General Support', 'Technical Support', 'Player Reports', 'Ban Appeals'].map((c, i) => (
                      <div key={c} className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm">
                        <span>{c}</span>
                        <span className={cn('size-1.5 rounded-full', i === 3 ? 'bg-muted-foreground' : 'bg-success')} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'group h-11 gap-3 px-6 font-mono text-xs tracking-[0.2em] hover:border-primary/50 hover:text-primary')}>
          OPEN THE DEMO WORKSPACE <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
