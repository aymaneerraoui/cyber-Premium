'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { CharCount, ColorField, Field } from '@/components/dashboard/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createEmbed, createField, uid } from '@/lib/factories'
import type { EmbedConfig, EmbedField, MessageConfig } from '@/lib/types/config'
import { DISCORD_LIMITS, embedCharacterCount } from '@/lib/validation/discord'
import { cn } from '@/lib/utils'
import { ButtonsEditor, type ButtonTarget } from './buttons-editor'
import { Disclosure } from './disclosure'
import { MediaUpload } from './media-upload'
import { SortableList } from './sortable'

interface EmbedEditorProps {
  embed: EmbedConfig
  onChange: (embed: EmbedConfig) => void
  sections?: { author?: boolean; fields?: boolean; footer?: boolean; images?: boolean }
}

/** Shared visual editor for a single Discord embed. Powers panels, applications, announcements and notifications. */
export function EmbedEditor({ embed, onChange, sections = {} }: EmbedEditorProps) {
  const { author = true, fields = true, footer = true, images = true } = sections
  const id = useId()
  const set = <K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) => onChange({ ...embed, [key]: value })
  const L = DISCORD_LIMITS

  const updateField = (fid: string, patch: Partial<EmbedField>) => set('fields', embed.fields.map((f) => (f.id === fid ? { ...f, ...patch } : f)))

  return (
    <div className="flex flex-col gap-3">
      <Disclosure title="Content" defaultOpen meta={`${embedCharacterCount(embed)}/${L.embedTotal}`}>
        <Field label="Title" htmlFor={`${id}-title`} hint={<CharCount value={embed.title} max={L.title} />}>
          <Input id={`${id}-title`} value={embed.title} onChange={(e) => set('title', e.target.value)} placeholder="Embed title" className="bg-surface" />
        </Field>
        <Field label="Description" htmlFor={`${id}-desc`} hint={<CharCount value={embed.description} max={L.description} />} description="Supports **bold**, *italic*, __underline__, ~~strike~~, `code` and placeholders like {user}.">
          <Textarea id={`${id}-desc`} value={embed.description} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Write the embed body…" className="bg-surface" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title link" htmlFor={`${id}-url`}>
            <Input id={`${id}-url`} value={embed.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" className="bg-surface" type="url" />
          </Field>
          <Field label="Accent color" htmlFor={`${id}-color`}>
            <ColorField id={`${id}-color`} value={embed.color} onChange={(v) => set('color', v)} />
          </Field>
        </div>
      </Disclosure>

      {images && (
        <Disclosure title="Images" meta={[embed.image, embed.thumbnail].filter(Boolean).length ? `${[embed.image, embed.thumbnail].filter(Boolean).length} set` : undefined}>
          <MediaUpload label="Large image" value={embed.image} onChange={(v) => set('image', v)} hint="Shown below the body" />
          <MediaUpload label="Thumbnail" value={embed.thumbnail} onChange={(v) => set('thumbnail', v)} aspect="square" hint="Top right" />
        </Disclosure>
      )}

      {author && (
        <Disclosure title="Author" meta={embed.authorName ? 'set' : undefined}>
          <Field label="Author name" htmlFor={`${id}-author`} hint={<CharCount value={embed.authorName} max={L.author} />}>
            <Input id={`${id}-author`} value={embed.authorName} onChange={(e) => set('authorName', e.target.value)} placeholder="e.g. CYBER Staff" className="bg-surface" />
          </Field>
          <MediaUpload label="Author icon" value={embed.authorIcon} onChange={(v) => set('authorIcon', v)} aspect="square" />
        </Disclosure>
      )}

      {fields && (
        <Disclosure title="Fields" meta={`${embed.fields.length}/${L.fields}`}>
          {embed.fields.length === 0 && <p className="text-sm text-muted-foreground">No fields yet. Fields display as a name/value grid; inline fields sit side by side.</p>}
          <SortableList
            label="field"
            items={embed.fields}
            onReorder={(next) => set('fields', next)}
            renderItem={(field, index, handle) => (
              <div className="flex gap-2 rounded-lg border border-border bg-background p-3">
                {handle}
                <div className="grid flex-1 gap-2">
                  <Input aria-label={`Field ${index + 1} name`} value={field.name} onChange={(e) => updateField(field.id, { name: e.target.value })} placeholder="Name" className="h-8 bg-surface" />
                  <Textarea aria-label={`Field ${index + 1} value`} value={field.value} onChange={(e) => updateField(field.id, { value: e.target.value })} rows={2} placeholder="Value" className="min-h-0 bg-surface" />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={field.inline} onCheckedChange={(v) => updateField(field.id, { inline: Boolean(v) })} size="sm" />
                    Inline
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label={`Duplicate field ${index + 1}`} onClick={() => set('fields', [...embed.fields.slice(0, index + 1), { ...field, id: uid('fld') }, ...embed.fields.slice(index + 1)])} disabled={embed.fields.length >= L.fields}>
                    <Copy />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Remove field ${index + 1}`} onClick={() => set('fields', embed.fields.filter((f) => f.id !== field.id))} className="hover:text-destructive">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )}
          />
          <Button variant="outline" size="sm" className="w-fit" onClick={() => set('fields', [...embed.fields, createField()])} disabled={embed.fields.length >= L.fields}>
            <Plus /> Add field
          </Button>
        </Disclosure>
      )}

      {footer && (
        <Disclosure title="Footer" meta={embed.footerText || embed.timestamp ? 'set' : undefined}>
          <Field label="Footer text" htmlFor={`${id}-footer`} hint={<CharCount value={embed.footerText} max={L.footer} />}>
            <Input id={`${id}-footer`} value={embed.footerText} onChange={(e) => set('footerText', e.target.value)} placeholder="Footer" className="bg-surface" />
          </Field>
          <MediaUpload label="Footer icon" value={embed.footerIcon} onChange={(v) => set('footerIcon', v)} aspect="square" />
          <label className="flex items-center justify-between gap-3 text-sm">
            Show timestamp
            <Switch checked={embed.timestamp} onCheckedChange={(v) => set('timestamp', Boolean(v))} />
          </label>
        </Disclosure>
      )}
    </div>
  )
}

interface MessageEditorProps {
  message: MessageConfig
  onChange: (message: MessageConfig) => void
  allowContent?: boolean
  allowMultipleEmbeds?: boolean
  buttons?: boolean | { targets?: ButtonTarget[]; requireTarget?: boolean }
}

/** Composes content, one or more embeds and buttons into a Discord message. */
export function MessageEditor({ message, onChange, allowContent = true, allowMultipleEmbeds = true, buttons = true }: MessageEditorProps) {
  const id = useId()
  const [activeEmbed, setActiveEmbed] = useState(message.embeds[0]?.id ?? null)
  const current = message.embeds.find((e) => e.id === activeEmbed) ?? message.embeds[0]

  const updateEmbed = (next: EmbedConfig) => onChange({ ...message, embeds: message.embeds.map((e) => (e.id === next.id ? next : e)) })

  const addEmbed = () => {
    const embed = createEmbed({ title: `Embed ${message.embeds.length + 1}` })
    onChange({ ...message, embeds: [...message.embeds, embed] })
    setActiveEmbed(embed.id)
  }

  const removeEmbed = (embedId: string) => {
    const next = message.embeds.filter((e) => e.id !== embedId)
    onChange({ ...message, embeds: next })
    setActiveEmbed(next[0]?.id ?? null)
  }

  return (
    <div className="flex flex-col gap-5">
      {allowContent && (
        <Field label="Message content" htmlFor={`${id}-content`} hint={<CharCount value={message.content} max={DISCORD_LIMITS.content} />} description="Plain text shown above the embeds.">
          <Textarea id={`${id}-content`} value={message.content} onChange={(e) => onChange({ ...message, content: e.target.value })} rows={2} placeholder="Optional message text" className="bg-surface" />
        </Field>
      )}

      <div className="flex flex-col gap-3">
        {allowMultipleEmbeds && (
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Embeds">
            {message.embeds.map((e, i) => (
              <div key={e.id} className="flex items-center">
                <button
                  type="button"
                  role="tab"
                  aria-selected={current?.id === e.id}
                  onClick={() => setActiveEmbed(e.id)}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-l-md border px-3 text-xs transition-colors',
                    message.embeds.length === 1 && 'rounded-r-md',
                    current?.id === e.id ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-surface text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: e.color }} />
                  Embed {i + 1}
                </button>
                {message.embeds.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove embed ${i + 1}`}
                    onClick={() => removeEmbed(e.id)}
                    className={cn(
                      'grid h-8 w-7 place-items-center rounded-r-md border border-l-0 text-muted-foreground transition-colors hover:text-destructive',
                      current?.id === e.id ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface',
                    )}
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addEmbed} disabled={message.embeds.length >= DISCORD_LIMITS.embedsPerMessage}>
              <Plus /> Embed
            </Button>
            <span className="ml-auto font-mono text-[0.62rem] text-muted-foreground">
              {message.embeds.length}/{DISCORD_LIMITS.embedsPerMessage}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            <motion.div key={current.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
              <EmbedEditor embed={current} onChange={updateEmbed} />
            </motion.div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No embeds.{' '}
              <button type="button" onClick={addEmbed} className="text-primary hover:underline">
                Add one
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {buttons && (
        <ButtonsEditor
          buttons={message.buttons}
          onChange={(next) => onChange({ ...message, buttons: next })}
          targets={typeof buttons === 'object' ? buttons.targets : undefined}
        />
      )}
    </div>
  )
}
