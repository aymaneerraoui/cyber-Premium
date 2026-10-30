'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Check, MousePointerClick } from 'lucide-react'
import { useState } from 'react'
import { DiscordMessage, DiscordModal } from '@/components/builders/discord-preview'
import { HudFrame } from '@/components/cyber/hud'
import { Reveal } from '@/components/motion/primitives'
import { createButton, createEmbed, createQuestion } from '@/lib/factories'
import type { MessageButton, MessageConfig, Question } from '@/lib/types/config'
import { SectionHeading } from './section-heading'

const SAMPLE_BUTTONS = [
  createButton({ id: 'b-general', label: 'General Support', style: 'primary' }),
  createButton({ id: 'b-tech', label: 'Technical', style: 'secondary' }),
  createButton({ id: 'b-report', label: 'Report a Player', style: 'danger' }),
  createButton({ id: 'b-appeal', label: 'Ban Appeal', style: 'success' }),
]

const SAMPLE_MESSAGE: MessageConfig = {
  content: '',
  embeds: [
    createEmbed({
      id: 'sample-embed',
      title: 'Support Center',
      description: 'Select the category that best matches your request.\nA **private channel** will open with the right team.',
      fields: [
        { id: 'f1', name: 'Response time', value: 'Under 2 hours', inline: true },
        { id: 'f2', name: 'Availability', value: '24 / 7', inline: true },
      ],
      footerText: 'CYBER Support System',
    }),
  ],
  buttons: SAMPLE_BUTTONS,
}

const QUESTIONS: Record<string, Question[]> = {
  'b-general': [createQuestion('long', { id: 'q1', label: 'How can we help?', placeholder: 'Describe your request' })],
  'b-tech': [
    createQuestion('dropdown', { id: 'q2', label: 'Platform', options: ['PC', 'Console', 'Mobile'] }),
    createQuestion('long', { id: 'q3', label: 'Describe the issue', placeholder: 'Steps to reproduce…' }),
  ],
  'b-report': [
    createQuestion('short', { id: 'q4', label: 'User ID of the member', placeholder: '17–20 digit ID' }),
    createQuestion('long', { id: 'q5', label: 'What happened?' }),
  ],
  'b-appeal': [createQuestion('long', { id: 'q6', label: 'Why should the decision be reconsidered?' })],
}

const POINTS = [
  'Up to 25 buttons per panel, each routed to its own category',
  'Per-category staff roles, questions and destination',
  'Claim, close, reopen, transcripts and logging',
  'Live Discord-accurate preview while you edit',
]

export function TicketShowcase() {
  const [active, setActive] = useState<MessageButton | null>(null)

  return (
    <section id="tickets" className="relative scroll-mt-20 border-t border-border py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-8">
          <SectionHeading
            index="02"
            label="TICKET SYSTEM"
            title="Support panels, engineered."
            description="Design multi-button ticket panels with categories, intake questions and staff routing — then watch the exact Discord result render as you type."
          />
          <Reveal delay={0.15}>
            <ul className="flex flex-col gap-3">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
                    <Check className="size-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <HudFrame className="rounded-lg border border-border bg-surface p-3 md:p-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="hud-label">LIVE PREVIEW · #support-panel</span>
              <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-primary">
                <MousePointerClick className="size-3.5" /> TRY A BUTTON
              </span>
            </div>
            <div className="relative">
              <DiscordMessage message={SAMPLE_MESSAGE} onButtonPress={setActive} />
              <AnimatePresence>
                {active && (
                  <motion.div
                    className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-black/70 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActive(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.92, y: 12 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="w-full max-w-[400px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DiscordModal title={active.label} questions={QUESTIONS[active.id] ?? []} />
                      <button
                        type="button"
                        onClick={() => setActive(null)}
                        className="mt-3 w-full font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground hover:text-foreground"
                      >
                        CLOSE PREVIEW
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </HudFrame>
        </Reveal>
      </div>
    </section>
  )
}
