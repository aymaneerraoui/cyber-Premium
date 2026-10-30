'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ImagePlus, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import type { MediaAsset } from '@/lib/types/config'
import { validateMedia } from '@/lib/validation/discord'
import { cn } from '@/lib/utils'

const MAX_DIMENSION = 1280

/**
 * Converts an image into a compact data URL for demo-mode drafts.
 * In live mode this is replaced by an upload to the CYBER asset endpoint.
 */
async function toAsset(file: File): Promise<MediaAsset> {
  if (file.type === 'image/gif' && file.size < 900_000) {
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    return { url, name: file.name, size: file.size, type: file.type }
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const url = canvas.toDataURL('image/webp', 0.82)
  return { url, name: file.name, size: Math.round((url.length * 3) / 4), type: 'image/webp' }
}

interface MediaUploadProps {
  label: string
  value: MediaAsset | null
  onChange: (value: MediaAsset | null) => void
  aspect?: 'square' | 'wide'
  hint?: string
  className?: string
}

export function MediaUpload({ label, value, onChange, aspect = 'wide', hint, className }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    const error = validateMedia(file)
    if (error) {
      toast.error('Image rejected', { description: error })
      return
    }
    setBusy(true)
    try {
      onChange(await toAsset(file))
    } catch {
      toast.error('Could not read this image.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    void handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[0.8rem] font-medium text-foreground/90">
          {label}
        </label>
        {hint && <span className="font-mono text-[0.62rem] text-muted-foreground">{hint}</span>}
      </div>
      <input ref={inputRef} id={id} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(e) => void handleFile(e.target.files?.[0])} />

      <AnimatePresence mode="wait" initial={false}>
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-surface p-2"
          >
            <img src={value.url || "/placeholder.svg"} alt={`${label} preview`} className={cn('shrink-0 rounded-md object-cover', aspect === 'square' ? 'size-14' : 'h-14 w-24')} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{value.name}</span>
              <span className="font-mono text-[0.62rem] text-muted-foreground">{value.size ? `${Math.max(1, Math.round(value.size / 1024))} KB` : 'Asset'}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Replace ${label}`}
              >
                <RefreshCw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${label}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="drop"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              dragging ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-surface/50 text-muted-foreground hover:border-foreground/25 hover:text-foreground',
            )}
            aria-describedby={`${id}-help`}
          >
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-md border transition-colors', dragging ? 'border-primary/50 text-primary' : 'border-border')}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : dragging ? <Upload className="size-4" /> : <ImagePlus className="size-4" />}
            </span>
            <span className="flex flex-col">
              <span>{dragging ? 'Drop to upload' : 'Upload or drag an image'}</span>
              <span id={`${id}-help`} className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WEBP · max 8 MB
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
