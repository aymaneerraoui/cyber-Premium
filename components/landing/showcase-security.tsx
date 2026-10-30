'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { HudFrame } from '@/components/cyber/hud'
import { Reveal } from '@/components/motion/primitives'
import { cn } from '@/lib/utils'
import { SectionHeading } from './section-heading'

const LOG = [
  { t: '00:00:01', level: 'SYS', text: 'anti-spam module armed · burst 6/5s · mentions 5' },
  { t: '00:00:04', level: 'OK', text: 'link filter loaded · 3 allowlisted domains' },
  { t: '00:12:47', level: 'WARN', text: 'mention threshold reached · #general · sample_user_01' },
  { t: '00:12:47', level: 'ACT', text: 'timeout applied · 10m · reason: mention spam' },
  { t: '00:31:09', level: 'BLOCK', text: 'invite link removed · ignored roles bypassed: 0' },
  { t: '00:31:10', level: 'LOG', text: 'event written to #mod-log and audit trail' },
]

const LEVEL_TONE: Record<string, string> = {
  SYS: 'text-muted-foreground',
  OK: 'text-success',
  WARN: 'text-warning',
  ACT: 'text-primary',
  BLOCK: 'text-destructive',
  LOG: 'text-frost/70',
}

const METERS = [
  { label: 'Message burst', value: 6, max: 10, unit: 'msgs / 5s' },
  { label: 'Mention threshold', value: 5, max: 10, unit: 'mentions' },
  { label: 'Duplicate messages', value: 3, max: 10, unit: 'repeats' },
]

export function SecurityShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? LOG.length : 0)

  useEffect(() => {
    if (!inView || reduced) return
    if (shown >= LOG.length) return
    const id = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 300 : 650)
    return () => clearTimeout(id)
  }, [inView, shown, reduced])

  return (
    <section id="security" className="relative scroll-mt-20 border-t border-border py-24 md:py-32">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-dots opacity-40 mask-fade-y" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col gap-10">
          <SectionHeading
            index="04"
            label="MODERATION & SECURITY"
            title="Threats handled before they spread."
            description="Burst, mention, duplicate and link filters act in milliseconds. Every action is logged with the reason, the moderator and the evidence."
          />
          <Reveal delay={0.1} className="flex flex-col gap-5">
            {METERS.map((m, i) => (
              <div key={m.label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{m.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.value} {m.unit}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(m.value / m.max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <HudFrame ref={ref} className="overflow-hidden rounded-lg border border-border bg-[#070707]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="ml-3 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">cyber://security/stream — sample events</span>
            </div>
            <div className="flex min-h-[300px] flex-col gap-2 p-4 font-mono text-xs md:p-5 md:text-[0.8rem]" role="log" aria-live="polite">
              {LOG.slice(0, shown).map((line, i) => (
                <motion.div
                  key={i}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex gap-3"
                >
                  <span className="shrink-0 text-muted-foreground/60">{line.t}</span>
                  <span className={cn('w-12 shrink-0 font-bold', LEVEL_TONE[line.level])}>{line.level}</span>
                  <span className="text-foreground/85">{line.text}</span>
                </motion.div>
              ))}
              <span className="mt-1 inline-block h-4 w-2 animate-flicker bg-primary" style={{ animationDuration: '1.1s' }} aria-hidden="true" />
            </div>
          </HudFrame>
        </Reveal>
      </div>
    </section>
  )
}
