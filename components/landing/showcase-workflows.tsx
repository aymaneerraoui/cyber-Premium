'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ClipboardList, Eye, Mic, UserCheck } from 'lucide-react'
import { DiscordMessage } from '@/components/builders/discord-preview'
import { HudFrame, StatusDot } from '@/components/cyber/hud'
import { Reveal } from '@/components/motion/primitives'
import { createButton, createEmbed } from '@/lib/factories'
import { EASE_OUT } from '@/lib/motion'
import type { MessageConfig } from '@/lib/types/config'
import { SectionHeading } from './section-heading'

const STAGES = [
  { icon: ClipboardList, label: 'Submitted', meta: 'Form received' },
  { icon: Eye, label: 'Under Review', meta: 'Reviewer roles notified' },
  { icon: Mic, label: 'Interview', meta: 'Voice channel assigned' },
  { icon: UserCheck, label: 'Decision', meta: 'Roles + template sent' },
]

export function ApplicationShowcase() {
  const reduced = useReducedMotion()
  return (
    <section className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-5 md:px-8">
        <SectionHeading
          index="03"
          label="RECRUITMENT PIPELINE"
          title="Applications with a real review process."
          description="Build staff and partner applications with custom questions, then route every submission through the stages you choose."
        />
        <Reveal>
          <HudFrame className="rounded-lg border border-border bg-surface p-6 md:p-10">
            <ol className="relative grid gap-6 md:grid-cols-4 md:gap-4">
              <div aria-hidden="true" className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-border md:block">
                {!reduced && (
                  <motion.div
                    className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent"
                    animate={{ x: ['-10%', '1100%'] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
              {STAGES.map((s, i) => (
                <motion.li
                  key={s.label}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i, duration: 0.6, ease: EASE_OUT }}
                  className="relative flex items-start gap-4 md:flex-col"
                >
                  <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-md border border-primary/40 bg-background text-primary">
                    <s.icon className="size-4" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[0.65rem] text-muted-foreground">STAGE {String(i + 1).padStart(2, '0')}</span>
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-sm text-muted-foreground">{s.meta}</span>
                  </div>
                </motion.li>
              ))}
            </ol>
          </HudFrame>
        </Reveal>
      </div>
    </section>
  )
}

const STREAM_MESSAGE: MessageConfig = {
  content: '',
  embeds: [
    createEmbed({
      id: 'stream-embed',
      color: '#9146FF',
      authorName: 'example_streamer is now live',
      title: 'Night city ranked grind — road to top 500',
      url: 'https://example.com',
      fields: [
        { id: 's1', name: 'Category', value: 'Action / Adventure', inline: true },
        { id: 's2', name: 'Platform', value: 'Twitch', inline: true },
      ],
      image: { url: '/images/stream-preview.png', name: 'stream-preview.png', size: 0, type: 'image/png' },
      footerText: 'Stream Notifications',
      timestamp: true,
    }),
  ],
  buttons: [createButton({ id: 'watch', label: 'Watch Stream', style: 'link', url: 'https://example.com' })],
}

export function NotificationShowcase() {
  return (
    <section className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="order-2 lg:order-1">
          <HudFrame className="rounded-lg border border-border bg-surface p-3 md:p-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="hud-label">EXAMPLE ALERT · #go-live</span>
              <span className="flex items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">
                <StatusDot tone="danger" /> LIVE
              </span>
            </div>
            <DiscordMessage message={STREAM_MESSAGE} mentionLine="@here" />
          </HudFrame>
        </Reveal>
        <div className="order-1 lg:order-2">
          <SectionHeading
            index="05"
            label="STREAM NOTIFICATIONS"
            title="Go-live alerts that look intentional."
            description="Track Twitch, YouTube and Kick creators. Every alert uses your template, your mention rules and your channel — never a generic default."
          />
        </div>
      </div>
    </section>
  )
}
