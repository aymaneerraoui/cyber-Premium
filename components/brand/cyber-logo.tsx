'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { PointerEvent } from 'react'
import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

export const LOGO_SRC = '/images/cyber-logo.png'

/** Compact mark + wordmark used in navigation. */
export function CyberWordmark({ href = '/', className, compact = false }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn('group flex items-center gap-2.5 outline-none', className)} aria-label="CYBER home">
      <span className="relative size-8 shrink-0 rounded-full ring-1 ring-primary/30 transition-[box-shadow] duration-300 group-hover:shadow-[0_0_18px_rgba(255,212,0,0.35)]">
        <Image src={LOGO_SRC || "/placeholder.svg"} alt="" fill sizes="32px" className="rounded-full object-cover" priority />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-mono text-sm font-bold tracking-[0.32em] text-foreground">CYBER</span>
          <span className="mt-1 font-mono text-[0.55rem] tracking-[0.28em] text-muted-foreground">FG ORGANIZATION</span>
        </span>
      )}
    </Link>
  )
}

interface CyberEmblemProps {
  size?: number
  className?: string
  interactive?: boolean
  /** Delay (s) for the entrance animation. */
  delay?: number
}

/**
 * Hero emblem: the official logo with perspective tilt, lighting sheen,
 * rotating HUD rings and a controlled entrance.
 */
export function CyberEmblem({ size = 420, className, interactive = true, delay = 0.2 }: CyberEmblemProps) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), { stiffness: 140, damping: 18 })
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-16, 16]), { stiffness: 140, damping: 18 })
  const sheenX = useTransform(px, [-0.5, 0.5], ['20%', '80%'])
  const sheenY = useTransform(py, [-0.5, 0.5], ['15%', '85%'])
  const sheen = useTransform(
    [sheenX, sheenY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,240,180,0.28), transparent 45%)`,
  )

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (!interactive || reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    px.set(0)
    py.set(0)
  }

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size, perspective: 1100, maxWidth: '100%', aspectRatio: '1 / 1' }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {/* HUD rings */}
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute inset-[-8%] size-[116%] text-primary"
        initial={reduced ? false : { opacity: 0, rotate: -40, scale: 0.9 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 1.6, delay: delay + 0.3, ease: EASE_OUT }}
      >
        <g className={reduced ? undefined : 'origin-center animate-[spin_60s_linear_infinite]'} style={{ transformBox: 'fill-box' }}>
          <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.4" strokeDasharray="1 3" />
          <path d="M100 4 A96 96 0 0 1 168 32" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="0.8" />
          <path d="M32 168 A96 96 0 0 1 4 100" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.8" />
        </g>
        <g className={reduced ? undefined : 'origin-center animate-[spin_38s_linear_infinite_reverse]'} style={{ transformBox: 'fill-box' }}>
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" />
          {Array.from({ length: 36 }).map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="12"
              x2="100"
              y2={i % 3 === 0 ? 17 : 14.5}
              stroke="currentColor"
              strokeOpacity={i % 3 === 0 ? 0.55 : 0.22}
              strokeWidth="0.5"
              transform={`rotate(${i * 10} 100 100)`}
            />
          ))}
        </g>
      </motion.svg>

      {/* Ambient light */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[12%] rounded-full bg-primary/15 blur-3xl" />

      <motion.div
        className="relative size-[82%] will-change-transform"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={reduced ? false : { opacity: 0, scale: 0.6, filter: 'blur(18px) brightness(2.2)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' }}
        transition={{ duration: 1.3, delay, ease: EASE_OUT }}
        whileHover={reduced ? undefined : { scale: 1.03 }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-[3%] rounded-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),0_0_60px_rgba(255,212,0,0.12)]"
          style={{ transform: 'translateZ(-30px)' }}
        />
        <Image
          src={LOGO_SRC || "/placeholder.svg"}
          alt="CYBER — FG Organization emblem"
          fill
          priority
          sizes="(min-width: 1024px) 420px, 70vw"
          className="select-none object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-[4%] rounded-full mix-blend-screen" style={{ background: sheen }} />
      </motion.div>
    </div>
  )
}
