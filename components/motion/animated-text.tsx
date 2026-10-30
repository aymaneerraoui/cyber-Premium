'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ElementType } from 'react'
import { CHARSETS, EASE_OUT, TEXT_PRESETS, type TextAnimationOptions, type TextDirection, type TextPreset } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface AnimatedTextProps extends Partial<TextAnimationOptions> {
  text: string
  preset?: TextPreset
  as?: ElementType
  className?: string
  /** Class applied to unresolved (scrambling) characters. */
  scrambleClassName?: string
}

function rankOrder(length: number, direction: TextDirection, seed = 1): number[] {
  const ranks = Array.from({ length }, (_, i) => {
    if (length <= 1) return 0
    const t = i / (length - 1)
    switch (direction) {
      case 'reverse':
        return 1 - t
      case 'center':
        return Math.abs(t - 0.5) * 2
      case 'random': {
        const x = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453
        return x - Math.floor(x)
      }
      default:
        return t
    }
  })
  return ranks
}

function useActivation(trigger: 'mount' | 'inView') {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return { ref, active: trigger === 'mount' ? mounted : inView }
}

/** rAF-driven decode / scramble / type engine. */
function useTextEngine(
  text: string,
  opts: Required<Pick<TextAnimationOptions, 'mode' | 'duration' | 'delay' | 'direction' | 'charset'>> & { active: boolean; reduced: boolean },
) {
  const { mode, duration, delay, direction, charset, active, reduced } = opts
  const [output, setOutput] = useState(text)
  const [progress, setProgress] = useState(reduced ? 1 : 0)

  useEffect(() => {
    if (!active) return
    if (reduced || mode === 'none') {
      setOutput(text)
      setProgress(1)
      return
    }
    const chars = [...text]
    const ranks = rankOrder(chars.length, mode === 'scramble' ? 'random' : direction)
    if (mode === 'decode' || mode === 'scramble') {
      setOutput(chars.map((c) => (c === ' ' || c === '\n' ? c : charset[Math.floor(Math.random() * charset.length)])).join(''))
    }
    let raf = 0
    let start: number | null = null
    let lastFrame = 0

    const tick = (now: number) => {
      if (start === null) start = now
      const elapsed = (now - start) / 1000 - delay
      const t = Math.min(1, Math.max(0, elapsed / duration))
      if (elapsed >= 0 && now - lastFrame > 32) {
        lastFrame = now
        setProgress(t)
        if (mode === 'decode' || mode === 'scramble') {
          setOutput(
            chars
              .map((c, i) => (c === ' ' || c === '\n' || t >= ranks[i] * 0.92 + 0.04 ? c : charset[Math.floor(Math.random() * charset.length)]))
              .join(''),
          )
        }
      }
      if (t < 1) raf = requestAnimationFrame(tick)
      else {
        setOutput(text)
        setProgress(1)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, mode, duration, delay, direction, charset, active, reduced])

  return { output, progress }
}

export function AnimatedText({ text, preset, as, className, scrambleClassName, ...overrides }: AnimatedTextProps) {
  const options: TextAnimationOptions = { ...(preset ? TEXT_PRESETS[preset] : { mode: 'reveal' }), ...stripUndefined(overrides) }
  const {
    mode,
    duration = 0.8,
    delay = 0,
    stagger = 0.02,
    direction = 'forward',
    charset = CHARSETS.glyph,
    repeatEvery,
    trigger = 'inView',
    cursor = false,
  } = options

  const Tag = (as ?? 'span') as ElementType
  const reduced = useReducedMotion() ?? false
  const { ref, active } = useActivation(trigger)
  const { output, progress } = useTextEngine(text, { mode, duration, delay, direction, charset, active, reduced })

  const content = (() => {
    switch (mode) {
      case 'reveal':
        return <RevealChars text={text} active={active} reduced={reduced} delay={delay} stagger={stagger} duration={duration} direction={direction} />
      case 'lines':
        return <RevealLines text={text} active={active} reduced={reduced} delay={delay} stagger={stagger} duration={duration} />
      case 'type': {
        const count = Math.round(progress * text.length)
        return (
          <span className="relative">
            <span>{text.slice(0, count)}</span>
            {cursor && (
              <span
                className={cn('inline-block w-[0.55em] -mb-[0.1em] h-[1em] bg-primary align-baseline', progress >= 1 && 'animate-flicker')}
                style={{ animationDuration: '1.1s' }}
              />
            )}
            <span className="opacity-0">{text.slice(count)}</span>
          </span>
        )
      }
      case 'glitch':
        return <GlitchText text={text} active={active} reduced={reduced} repeatEvery={repeatEvery} />
      case 'decode':
      case 'scramble':
        return (
          <span className={cn('transition-opacity duration-300', active || reduced ? 'opacity-100' : 'opacity-0')}>
            {[...output].map((c, i) => (
              <span key={i} className={c !== text[i] ? cn('text-primary/80', scrambleClassName) : undefined}>
                {c}
              </span>
            ))}
          </span>
        )
      default:
        return text
    }
  })()

  return (
    <Tag ref={ref} className={cn(className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{content}</span>
    </Tag>
  )
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

interface RevealProps {
  text: string
  active: boolean
  reduced: boolean
  delay: number
  stagger: number
  duration: number
}

function RevealChars({ text, active, reduced, delay, stagger, duration, direction }: RevealProps & { direction: TextDirection }) {
  const words = useMemo(() => text.split(' '), [text])
  const total = text.replace(/ /g, '').length
  const ranks = useMemo(() => rankOrder(total, direction), [total, direction])
  let index = -1
  return (
    <>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {[...word].map((char, ci) => {
            index += 1
            const order = ranks[index] * total
            return (
              <motion.span
                key={ci}
                className="inline-block"
                initial={reduced ? false : { opacity: 0, y: '0.45em', filter: 'blur(6px)' }}
                animate={active || reduced ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
                transition={{ duration, delay: delay + order * stagger, ease: EASE_OUT }}
              >
                {char}
              </motion.span>
            )
          })}
          {wi < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </>
  )
}

function RevealLines({ text, active, reduced, delay, stagger, duration }: RevealProps) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={reduced ? false : { y: '105%', opacity: 0 }}
            animate={active || reduced ? { y: 0, opacity: 1 } : undefined}
            transition={{ duration, delay: delay + i * stagger, ease: EASE_OUT }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </>
  )
}

function GlitchText({ text, active, reduced, repeatEvery }: { text: string; active: boolean; reduced: boolean; repeatEvery?: number }) {
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (!active || reduced) return
    setBurst((b) => b + 1)
    if (!repeatEvery) return
    const id = setInterval(() => setBurst((b) => b + 1), repeatEvery * 1000)
    return () => clearInterval(id)
  }, [active, reduced, repeatEvery])

  return (
    <span className="relative inline-block">
      <span>{text}</span>
      {burst > 0 && (
        <>
          <span key={`a${burst}`} className="glitch-layer pointer-events-none absolute inset-0 text-primary" style={{ transform: 'translate(-2px,0)' }}>
            {text}
          </span>
          <span
            key={`b${burst}`}
            className="glitch-layer pointer-events-none absolute inset-0 text-frost/70"
            style={{ animationDelay: '60ms', animationDirection: 'reverse' }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  )
}
