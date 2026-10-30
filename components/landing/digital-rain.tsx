'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DigitalRainProps {
  className?: string
  /** Glyph set used for the rain columns. */
  glyphs?: string
  density?: number
}

interface Column {
  x: number
  y: number
  speed: number
  size: number
  layer: 0 | 1
  trail: number
}

const DEFAULT_GLYPHS = '01010110100101ABCDEF0123456789'

/**
 * Two-layer canvas rain of binary/hex glyphs with depth parallax.
 * Pauses when off-screen or the tab is hidden; renders a single static
 * frame when the user prefers reduced motion.
 */
export function DigitalRain({ className, glyphs = DEFAULT_GLYPHS, density = 1 }: DigitalRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let width = 0
    let height = 0
    let columns: Column[] = []
    let raf = 0
    let visible = true
    let last = 0

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      columns = []
      const spacing = width < 640 ? 22 : 18
      const count = Math.floor((width / spacing) * density)
      for (let i = 0; i < count; i++) {
        const layer = (Math.random() < 0.35 ? 1 : 0) as 0 | 1
        columns.push({
          x: i * spacing + Math.random() * 6,
          y: Math.random() * height * 1.5 - height,
          speed: layer ? 1.6 + Math.random() * 1.6 : 0.6 + Math.random() * 0.9,
          size: layer ? 15 : 11,
          layer,
          trail: 8 + Math.floor(Math.random() * 18),
        })
      }
    }

    const draw = (advance: boolean) => {
      ctx.clearRect(0, 0, width, height)
      const offsetX = pointer.current.x
      const offsetY = pointer.current.y
      for (const col of columns) {
        const parallax = col.layer ? 14 : 5
        const x = col.x + offsetX * parallax
        ctx.font = `${col.size}px ui-monospace, monospace`
        for (let j = 0; j < col.trail; j++) {
          const y = col.y - j * col.size * 1.1 + offsetY * parallax
          if (y < -20 || y > height + 20) continue
          const fade = 1 - j / col.trail
          const glyph = glyphs[(Math.floor(col.y / col.size) + j * 7 + Math.floor(col.x)) % glyphs.length]
          if (j === 0) {
            ctx.fillStyle = `rgba(255, 246, 200, ${col.layer ? 0.9 : 0.5})`
          } else {
            ctx.fillStyle = `rgba(255, 212, 0, ${fade * (col.layer ? 0.42 : 0.16)})`
          }
          ctx.fillText(glyph, x, y)
        }
        if (advance) {
          col.y += col.speed * (col.size / 6)
          if (col.y - col.trail * col.size > height) {
            col.y = -Math.random() * height * 0.4
            col.trail = 8 + Math.floor(Math.random() * 18)
          }
        }
      }
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      if (now - last < 1000 / 30) return
      last = now
      draw(true)
    }

    build()
    if (reduced) {
      draw(false)
    } else {
      raf = requestAnimationFrame(loop)
    }

    const ro = new ResizeObserver(() => {
      build()
      if (reduced) draw(false)
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    const onPointer = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 }
    }
    if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [glyphs, density])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 size-full', className)} />
}
