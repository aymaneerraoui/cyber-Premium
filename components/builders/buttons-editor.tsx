'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FieldSelect, type Option } from '@/components/dashboard/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createButton } from '@/lib/factories'
import type { ButtonStyle, MessageButton } from '@/lib/types/config'
import { DISCORD_LIMITS } from '@/lib/validation/discord'
import { cn } from '@/lib/utils'
import { SortableList } from './sortable'

export interface ButtonTarget {
  id: string
  label: string
}

const STYLE_OPTIONS: Option<ButtonStyle>[] = [
  { value: 'primary', label: 'Primary (blurple)', icon: <span className="size-2.5 rounded-sm bg-[#5865F2]" /> },
  { value: 'secondary', label: 'Secondary (grey)', icon: <span className="size-2.5 rounded-sm bg-[#4E5058]" /> },
  { value: 'success', label: 'Success (green)', icon: <span className="size-2.5 rounded-sm bg-[#248046]" /> },
  { value: 'danger', label: 'Danger (red)', icon: <span className="size-2.5 rounded-sm bg-[#DA373C]" /> },
  { value: 'link', label: 'Link', icon: <span className="size-2.5 rounded-sm border border-[#4E5058]" /> },
]

const NONE = '__none'

interface ButtonsEditorProps {
  buttons: MessageButton[]
  onChange: (buttons: MessageButton[]) => void
  /** When provided (e.g. ticket categories), each button can be routed to a target. */
  targets?: ButtonTarget[]
  title?: string
}

export function ButtonsEditor({ buttons, onChange, targets, title = 'Buttons' }: ButtonsEditorProps) {
  const update = (id: string, patch: Partial<MessageButton>) => onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const atLimit = buttons.length >= DISCORD_LIMITS.buttonsTotal

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[0.8rem] font-medium">{title}</span>
        <span className="font-mono text-[0.62rem] text-muted-foreground">
          {buttons.length}/{DISCORD_LIMITS.buttonsTotal} · {DISCORD_LIMITS.buttonsPerRow} per row
        </span>
      </div>
      {buttons.length === 0 && <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">No buttons. Add one so members can interact.</p>}
      <SortableList
        label="button"
        items={buttons}
        onReorder={onChange}
        renderItem={(b, index, handle) => (
          <div className="flex gap-2 rounded-lg border border-border bg-background p-3">
            {handle}
            <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_64px]">
              <Input aria-label={`Button ${index + 1} label`} value={b.label} maxLength={DISCORD_LIMITS.buttonLabel} onChange={(e) => update(b.id, { label: e.target.value })} placeholder="Label" className="h-8 bg-surface" />
              <Input aria-label={`Button ${index + 1} emoji`} value={b.emoji} maxLength={8} onChange={(e) => update(b.id, { emoji: e.target.value })} placeholder="Icon" className="h-8 bg-surface text-center" />
              <div className={cn('grid gap-2 sm:col-span-2', (targets || b.style === 'link') && 'sm:grid-cols-2')}>
                <FieldSelect aria-label={`Button ${index + 1} style`} value={b.style} onValueChange={(v) => update(b.id, { style: v, url: v === 'link' ? b.url ?? 'https://' : undefined })} options={STYLE_OPTIONS} className="h-8" />
                {b.style === 'link' ? (
                  <Input aria-label={`Button ${index + 1} URL`} value={b.url ?? ''} onChange={(e) => update(b.id, { url: e.target.value })} placeholder="https://" className="h-8 bg-surface" type="url" />
                ) : targets ? (
                  <FieldSelect
                    aria-label={`Button ${index + 1} category`}
                    value={b.categoryId ?? NONE}
                    onValueChange={(v) => update(b.id, { categoryId: v === NONE ? undefined : v })}
                    options={[{ value: NONE, label: 'Category picker (ask member)' }, ...targets.map((t) => ({ value: t.id, label: t.label }))]}
                    className="h-8"
                  />
                ) : null}
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove button ${index + 1}`} onClick={() => onChange(buttons.filter((x) => x.id !== b.id))} className="hover:text-destructive">
              <Trash2 />
            </Button>
          </div>
        )}
      />
      <Button variant="outline" size="sm" className="w-fit" disabled={atLimit} onClick={() => onChange([...buttons, createButton({ label: `Button ${buttons.length + 1}`, style: 'secondary' })])}>
        <Plus /> Add button
      </Button>
    </div>
  )
}
