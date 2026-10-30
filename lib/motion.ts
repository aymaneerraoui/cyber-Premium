import type { Transition, Variants } from 'motion/react'

/** Shared motion language. Primary motion is slower and deliberate; secondary motion is quick and subtle. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export const DURATION = {
  micro: 0.15,
  fast: 0.25,
  base: 0.45,
  slow: 0.8,
  cinematic: 1.4,
} as const

export const spring: Transition = { type: 'spring', stiffness: 380, damping: 32 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
}

export const stagger = (delayChildren = 0, staggerChildren = 0.06): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

export type TextAnimationMode = 'reveal' | 'decode' | 'scramble' | 'type' | 'glitch' | 'lines' | 'none'
export type TextDirection = 'forward' | 'reverse' | 'center' | 'random'

export interface TextAnimationOptions {
  mode: TextAnimationMode
  duration?: number
  delay?: number
  stagger?: number
  direction?: TextDirection
  charset?: string
  /** For glitch mode: replay the glitch every N seconds. */
  repeatEvery?: number
  trigger?: 'mount' | 'inView'
  cursor?: boolean
}

export const CHARSETS = {
  hex: '0123456789ABCDEF',
  binary: '01',
  glyph: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\',
  katakana: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ',
} as const

/** Central, editable text animation presets. Components reference these by name. */
export const TEXT_PRESETS = {
  heroHeadline: { mode: 'decode', duration: 1.6, delay: 0.9, direction: 'forward', charset: CHARSETS.glyph, trigger: 'mount' },
  heroEyebrow: { mode: 'type', duration: 1.2, delay: 0.4, cursor: true, trigger: 'mount' },
  sectionTitle: { mode: 'reveal', duration: 0.6, stagger: 0.018, direction: 'forward', trigger: 'inView' },
  sectionLabel: { mode: 'scramble', duration: 0.8, charset: CHARSETS.hex, trigger: 'inView' },
  ctaTitle: { mode: 'glitch', repeatEvery: 6, trigger: 'inView' },
  terminal: { mode: 'type', duration: 1.4, cursor: true, trigger: 'inView' },
  paragraph: { mode: 'lines', duration: 0.7, stagger: 0.08, trigger: 'inView' },
  pageTitle: { mode: 'decode', duration: 0.6, charset: CHARSETS.glyph, trigger: 'mount' },
} satisfies Record<string, TextAnimationOptions>

export type TextPreset = keyof typeof TEXT_PRESETS
