'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { Fragment, useSyncExternalStore, type ReactNode } from 'react'
import { LOGO_SRC } from '@/components/brand/cyber-logo'
import type { ButtonStyle, EmbedConfig, MessageButton, MessageConfig, Question } from '@/lib/types/config'
import { DISCORD_LIMITS } from '@/lib/validation/discord'
import { cn } from '@/lib/utils'

/* Discord's own palette is used inside previews for fidelity. */
const BUTTON_STYLE: Record<ButtonStyle, string> = {
  primary: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
  secondary: 'bg-[#4E5058] hover:bg-[#6D6F78] text-white',
  success: 'bg-[#248046] hover:bg-[#1A6334] text-white',
  danger: 'bg-[#DA373C] hover:bg-[#A12828] text-white',
  link: 'bg-[#4E5058] hover:bg-[#6D6F78] text-white',
}

const TOKEN = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\{[a-zA-Z]+\}|<@&?[^>]+>|@everyone|@here)/g

/** Minimal, XSS-safe Discord markdown renderer (no HTML injection). */
export function DiscordMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {line.split(TOKEN).map((part, i) => {
            if (!part) return null
            if (part.startsWith('**')) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
            if (part.startsWith('__')) return <u key={i}>{part.slice(2, -2)}</u>
            if (part.startsWith('~~')) return <s key={i}>{part.slice(2, -2)}</s>
            if (part.startsWith('`')) return <code key={i} className="rounded bg-[#1E1F22] px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>
            if (part.startsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
            if (part.startsWith('{') || part.startsWith('<@') || part.startsWith('@'))
              return <span key={i} className="rounded bg-[#5865F2]/30 px-0.5 font-medium text-[#C9CDFB]">{part}</span>
            return <Fragment key={i}>{part}</Fragment>
          })}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  )
}

const clockFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function subscribeToClock(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(id)
}
const getClientClock = () => clockFormatter.format(new Date())
const getServerClock = () => null

/**
 * Discord-style "Today at h:mm" label in the viewer's local time.
 * The server cannot know the viewer's timezone, so it (and the hydration
 * pass) renders a neutral placeholder; React swaps in the real clock right
 * after hydration via useSyncExternalStore, then keeps it ticking.
 */
function DiscordTimestamp({ className }: { className?: string }) {
  const clock = useSyncExternalStore(subscribeToClock, getClientClock, getServerClock)
  return <time className={className}>Today at {clock ?? '--:--'}</time>
}

export function DiscordEmbed({ embed }: { embed: EmbedConfig }) {
  const inlineGroups: EmbedConfig['fields'][] = []
  for (const field of embed.fields) {
    const lastGroup = inlineGroups[inlineGroups.length - 1]
    if (field.inline && lastGroup && lastGroup[0].inline && lastGroup.length < 3) lastGroup.push(field)
    else inlineGroups.push([field])
  }

  return (
    <motion.div
      layout
      className="grid max-w-[520px] overflow-hidden rounded-[4px] border-l-4 bg-[#2B2D31]"
      style={{ borderLeftColor: embed.color || '#1E1F22' }}
    >
      <div className={cn('grid gap-2 p-3 pr-4', embed.thumbnail && 'grid-cols-[1fr_80px]')}>
        <div className="flex min-w-0 flex-col gap-2">
          {embed.authorName && (
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F2F3F5]">
              {embed.authorIcon && <img src={embed.authorIcon.url || "/placeholder.svg"} alt="" className="size-6 rounded-full object-cover" />}
              <span className="truncate">{embed.authorName}</span>
            </div>
          )}
          {embed.title && (
            <div className={cn('text-base font-semibold leading-snug', embed.url ? 'text-[#00A8FC]' : 'text-[#F2F3F5]')}>
              <DiscordMarkdown text={embed.title.slice(0, DISCORD_LIMITS.title)} />
            </div>
          )}
          {embed.description && (
            <div className="break-words text-sm leading-[1.375rem] text-[#DBDEE1]">
              <DiscordMarkdown text={embed.description} />
            </div>
          )}
          {inlineGroups.length > 0 && (
            <div className="flex flex-col gap-2">
              {inlineGroups.map((group, gi) => (
                <div key={gi} className={cn('grid gap-2', group.length === 3 ? 'grid-cols-3' : group.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {group.map((f) => (
                    <div key={f.id} className="min-w-0 text-sm">
                      <div className="font-semibold text-[#F2F3F5]">{f.name}</div>
                      <div className="break-words text-[#DBDEE1]">
                        <DiscordMarkdown text={f.value} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {embed.thumbnail && (
          <img src={embed.thumbnail.url || "/placeholder.svg"} alt="" className="size-20 rounded-[4px] object-cover" />
        )}
        {embed.image && (
          <img
            src={embed.image.url || "/placeholder.svg"}
            alt=""
            className={cn('mt-1 max-h-[300px] w-full rounded-[4px] object-cover', embed.thumbnail && 'col-span-2')}
          />
        )}
        {(embed.footerText || embed.timestamp) && (
          <div className={cn('flex items-center gap-2 text-xs text-[#B5BAC1]', embed.thumbnail && 'col-span-2')}>
            {embed.footerIcon && <img src={embed.footerIcon.url || "/placeholder.svg"} alt="" className="size-5 rounded-full object-cover" />}
            <span>
              {embed.footerText}
              {embed.footerText && embed.timestamp && ' • '}
              {embed.timestamp && <DiscordTimestamp />}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function DiscordButtons({ buttons, onPress }: { buttons: MessageButton[]; onPress?: (button: MessageButton) => void }) {
  const rows: MessageButton[][] = []
  buttons.slice(0, DISCORD_LIMITS.buttonsTotal).forEach((b, i) => {
    if (i % DISCORD_LIMITS.buttonsPerRow === 0) rows.push([])
    rows[rows.length - 1].push(b)
  })
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, ri) => (
        <div key={ri} className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {row.map((b) => (
              <motion.button
                key={b.id}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onPress?.(b)}
                className={cn(
                  'inline-flex h-8 min-w-[60px] items-center justify-center gap-1.5 rounded-[3px] px-4 text-sm font-medium transition-colors',
                  BUTTON_STYLE[b.style],
                )}
              >
                {b.emoji && <span aria-hidden="true">{b.emoji}</span>}
                <span>{b.label || (b.emoji ? '' : 'Button')}</span>
                {b.style === 'link' && <ExternalLink className="size-3.5 opacity-80" />}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

interface DiscordMessageProps {
  message: MessageConfig
  mentionLine?: string
  className?: string
  onButtonPress?: (button: MessageButton) => void
  children?: ReactNode
}

/** Discord-inspired message preview with bot header, content, embeds and buttons. */
export function DiscordMessage({ message, mentionLine, className, onButtonPress, children }: DiscordMessageProps) {
  return (
    <div className={cn('rounded-lg bg-[#313338] p-4 font-[system-ui,sans-serif] text-[#DBDEE1]', className)}>
      <div className="flex gap-4">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-[#1E1F22]">
          <Image src={LOGO_SRC || "/placeholder.svg"} alt="" fill sizes="40px" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-medium text-[#F2F3F5]">CYBER</span>
            <span className="rounded-[3px] bg-[#5865F2] px-1 text-[10px] font-semibold leading-4 text-white">APP</span>
            <DiscordTimestamp className="text-xs text-[#949BA4]" />
          </div>
          {mentionLine && (
            <div className="text-sm">
              <DiscordMarkdown text={mentionLine} />
            </div>
          )}
          {message.content && (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.375rem]">
              <DiscordMarkdown text={message.content} />
            </div>
          )}
          <AnimatePresence initial={false}>
            {message.embeds.map((embed) => (
              <motion.div key={embed.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                <DiscordEmbed embed={embed} />
              </motion.div>
            ))}
          </AnimatePresence>
          {message.buttons.length > 0 && (
            <div className="mt-1">
              <DiscordButtons buttons={message.buttons} onPress={onButtonPress} />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

/** Discord modal preview for ticket / application questions. */
export function DiscordModal({ title, questions, className }: { title: string; questions: Question[]; className?: string }) {
  return (
    <div className={cn('w-full max-w-[440px] overflow-hidden rounded-lg bg-[#313338] font-[system-ui,sans-serif] text-[#DBDEE1] shadow-2xl', className)}>
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <div className="relative size-6 overflow-hidden rounded-full">
          <Image src={LOGO_SRC || "/placeholder.svg"} alt="" fill sizes="24px" className="object-cover" />
        </div>
        <span className="truncate text-xl font-semibold text-[#F2F3F5]">{title || 'Untitled'}</span>
      </div>
      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto px-4 py-3">
        {questions.length === 0 && <p className="text-sm text-[#949BA4]">No questions configured. Users will open the ticket directly.</p>}
        <AnimatePresence initial={false}>
          {questions.map((q) => (
            <motion.div key={q.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-[#B5BAC1]">
                {q.label || 'Untitled question'}
                {q.required && <span className="ml-1 text-[#F23F42]">*</span>}
              </label>
              {q.description && <p className="-mt-1 text-xs text-[#949BA4]">{q.description}</p>}
              {q.type === 'short' && (
                <div className="h-10 rounded-[3px] bg-[#1E1F22] px-3 py-2.5 text-sm text-[#6D6F78]">{q.placeholder || ' '}</div>
              )}
              {q.type === 'long' && (
                <div className="h-20 rounded-[3px] bg-[#1E1F22] px-3 py-2.5 text-sm text-[#6D6F78]">{q.placeholder || ' '}</div>
              )}
              {(q.type === 'dropdown' || q.type === 'multiple') && (
                <div className="flex h-10 items-center justify-between rounded-[3px] bg-[#1E1F22] px-3 text-sm text-[#949BA4]">
                  <span className="truncate">
                    {q.type === 'multiple' ? `Select up to ${q.maxSelections ?? q.options.length}` : 'Make a selection'}
                    {q.options.length > 0 && ` — ${q.options.filter(Boolean).slice(0, 3).join(', ')}${q.options.length > 3 ? '…' : ''}`}
                  </span>
                  <ChevronDown className="size-4 shrink-0" />
                </div>
              )}
              {(q.type === 'short' || q.type === 'long') && q.maxLength ? (
                <span className="self-end text-[10px] text-[#6D6F78]">0 / {q.maxLength}</span>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex justify-end gap-2 bg-[#2B2D31] px-4 py-3">
        <span className="px-4 py-2 text-sm text-white">Cancel</span>
        <span className="rounded-[3px] bg-[#5865F2] px-6 py-2 text-sm font-medium text-white">Submit</span>
      </div>
    </div>
  )
}
