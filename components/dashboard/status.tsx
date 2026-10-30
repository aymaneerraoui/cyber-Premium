'use client'

import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Loader2, Plug, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export { EmptyState, LoadingBlock, SectionCard } from './cards'

/** Marks a setting that only takes effect once the live bot/backend is connected. */
export function RequiresBackend({ compact = false, label = 'Requires bot' }: { compact?: boolean; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className={cn(
              'inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 font-mono text-warning outline-none focus-visible:ring-2 focus-visible:ring-ring',
              compact ? 'ml-1.5 px-1 py-px text-[0.58rem]' : 'px-1.5 py-0.5 text-[0.62rem] tracking-wider',
            )}
          />
        }
      >
        <Plug className={compact ? 'size-2.5' : 'size-3'} aria-hidden="true" />
        {!compact && label.toUpperCase()}
        {compact && <span className="sr-only">{label}</span>}
      </TooltipTrigger>
      <TooltipContent className="max-w-56">This setting is saved now but only takes effect once the CYBER bot is connected to your server.</TooltipContent>
    </Tooltip>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="max-w-md text-sm text-foreground/90">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw /> Retry
        </Button>
      )}
    </div>
  )
}

/** Sticky save bar that appears when a draft differs from the persisted value. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  issues = 0,
  saveLabel = 'Save changes',
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
  issues?: number
  saveLabel?: string
}) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:pl-[var(--sidebar-width,0px)]"
        >
          <div
            role="region"
            aria-label="Unsaved changes"
            className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border border-primary/30 bg-popover/95 px-4 py-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur"
          >
            <div className="flex items-center gap-2.5 text-sm">
              <span className="size-2 animate-pulse-dot rounded-full bg-primary" aria-hidden="true" />
              <span>Unsaved changes</span>
              {issues > 0 && <span className="font-mono text-xs text-destructive">· {issues} issue{issues > 1 ? 's' : ''}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
                Discard
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving} className="font-semibold">
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {saveLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ValidationList({ issues }: { issues: { path: string; message: string }[] }) {
  if (issues.length === 0) return null
  return (
    <div role="alert" className="flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <span className="flex items-center gap-2 text-xs font-semibold text-destructive">
        <AlertTriangle className="size-3.5" /> {issues.length} validation issue{issues.length > 1 ? 's' : ''}
      </span>
      <ul className="flex flex-col gap-1 pl-5 text-xs text-foreground/80">
        {issues.slice(0, 8).map((i) => (
          <li key={i.path + i.message} className="list-disc">
            {i.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
