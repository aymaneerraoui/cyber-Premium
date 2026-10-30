'use client'

import { Check, ChevronDown, Folder, Hash, Megaphone, Volume2, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useChannels, useRoles } from '@/hooks/use-cyber'
import type { ChannelKind, Snowflake } from '@/lib/types/config'
import { cn } from '@/lib/utils'
import { RequiresBackend } from './status'

interface FieldProps {
  label: string
  htmlFor?: string
  description?: ReactNode
  error?: string
  hint?: ReactNode
  backend?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, description, error, hint, backend, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-[0.8rem] font-medium text-foreground/90">
          {label}
          {backend && <RequiresBackend compact />}
        </Label>
        {hint && <span className="font-mono text-[0.65rem] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {description && !error && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <span className={cn(over && 'text-destructive')}>
      {value.length}/{max}
    </span>
  )
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  backend?: boolean
  disabled?: boolean
}

export function ToggleRow({ label, description, checked, onCheckedChange, backend, disabled }: ToggleRowProps) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
          {label}
          {backend && <RequiresBackend compact />}
        </label>
        {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(Boolean(v))} disabled={disabled} />
    </div>
  )
}

export interface Option<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  description?: string
}

interface FieldSelectProps<T extends string> {
  id?: string
  value: T | null
  onValueChange: (value: T) => void
  options: Option<T>[]
  placeholder?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

export function FieldSelect<T extends string>({ id, value, onValueChange, options, placeholder = 'Select…', className, disabled, ...rest }: FieldSelectProps<T>) {
  return (
    <Select
      items={options.map((o) => ({ value: o.value, label: o.label }))}
      value={value}
      onValueChange={(v) => v !== null && onValueChange(v as T)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn('h-9 w-full bg-surface', className)} aria-label={rest['aria-label']}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.icon}
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const CHANNEL_ICON: Record<ChannelKind, typeof Hash> = {
  text: Hash,
  announcement: Megaphone,
  voice: Volume2,
  category: Folder,
}

const NONE = '__none'

interface ChannelSelectProps {
  serverId: string
  id?: string
  value: Snowflake | null
  onValueChange: (value: Snowflake | null) => void
  kinds?: ChannelKind[]
  allowNone?: boolean
  placeholder?: string
}

export function ChannelSelect({ serverId, id, value, onValueChange, kinds = ['text', 'announcement'], allowNone = true, placeholder = 'Select a channel' }: ChannelSelectProps) {
  const { data: channels = [], isLoading } = useChannels(serverId)
  const options: Option[] = channels
    .filter((c) => kinds.includes(c.kind))
    .map((c) => {
      const Icon = CHANNEL_ICON[c.kind]
      return { value: c.id, label: c.kind === 'category' ? c.name : c.name, icon: <Icon className="size-3.5 text-muted-foreground" /> }
    })
  if (allowNone) options.unshift({ value: NONE, label: 'None' })
  return (
    <FieldSelect
      id={id}
      value={value ?? (allowNone ? NONE : null)}
      onValueChange={(v) => onValueChange(v === NONE ? null : v)}
      options={options}
      placeholder={isLoading ? 'Loading channels…' : placeholder}
      disabled={isLoading}
    />
  )
}

interface RoleMultiSelectProps {
  serverId: string
  value: Snowflake[]
  onValueChange: (value: Snowflake[]) => void
  placeholder?: string
  id?: string
}

export function RoleMultiSelect({ serverId, value, onValueChange, placeholder = 'Select roles', id }: RoleMultiSelectProps) {
  const { data: roles = [] } = useRoles(serverId)
  const selected = roles.filter((r) => value.includes(r.id))
  const toggle = (roleId: string) =>
    onValueChange(value.includes(roleId) ? value.filter((v) => v !== roleId) : [...value, roleId])

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-surface px-2.5 py-1.5 text-left text-sm outline-none transition-colors hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <span className="flex flex-1 flex-wrap gap-1.5">
          {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
          {selected.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
              <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.name}
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Remove ${r.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(r.id)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </span>
            </span>
          ))}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div role="listbox" aria-multiselectable="true" className="flex flex-col">
          {roles.map((r) => {
            const checked = value.includes(r.id)
            return (
              <label key={r.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <Checkbox checked={checked} onCheckedChange={() => toggle(r.id)} />
                <span className="size-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="flex-1">{r.name}</span>
                {checked && <Check className="size-3.5 text-primary" />}
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ColorField({ id, value, onChange }: { id?: string; value: string; onChange: (value: string) => void }) {
  const presets = ['#FFD400', '#F5A524', '#3DDC84', '#5865F2', '#ED4245', '#E6F1FF', '#9146FF', '#111214']
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-input" style={{ backgroundColor: value }}>
        <span className="sr-only">Custom color</span>
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <input
        aria-label="Hex color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-24 rounded-md border border-input bg-surface px-2 font-mono text-xs uppercase outline-none focus-visible:border-ring"
        maxLength={7}
      />
      <div className="flex gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            aria-label={`Use color ${p}`}
            onClick={() => onChange(p)}
            className={cn('size-6 rounded-sm border border-border transition-transform hover:scale-110', value.toUpperCase() === p && 'ring-2 ring-ring ring-offset-2 ring-offset-background')}
            style={{ backgroundColor: p }}
          />
        ))}
      </div>
    </div>
  )
}
