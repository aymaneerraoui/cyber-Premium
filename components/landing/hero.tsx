'use client'

import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Bot } from 'lucide-react'
import { useRef } from 'react'
import { CyberEmblem } from '@/components/brand/cyber-logo'
import { StatusDot } from '@/components/cyber/hud'
import { AnimatedText } from '@/components/motion/animated-text'
import { buttonVariants } from '@/components/ui/button'
import { HEX_STREAM, LANDING } from '@/lib/content/landing'
import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DigitalRain } from './digital-rain'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120])
  const emblemY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const { hero } = LANDING

  return (
    <section ref={ref} className="relative isolate flex min-h-svh flex-col overflow-hidden" aria-labelledby="hero-title">
      {/* Environment */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <DigitalRain className="opacity-70 mask-fade-b" />
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(255,212,0,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#050505_95%)]" />
        <div className="absolute inset-0 scanlines opacity-60" />
        {!reduced && (
          <div className="absolute inset-x-0 top-0 h-40 animate-scan bg-gradient-to-b from-transparent via-primary/[0.05] to-transparent" />
        )}
      </div>

      <motion.div style={{ opacity: fade }} className="mx-auto flex w-full max-w-7xl flex-1 flex-col-reverse items-center justify-center gap-10 px-5 pb-16 pt-28 md:px-8 lg:flex-row lg:justify-between lg:gap-8 lg:pt-20">
        <motion.div style={{ y: contentY }} className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
          <AnimatedText
            as="p"
            text={hero.eyebrow.text}
            preset={hero.eyebrow.preset}
            className="font-mono text-xs tracking-wider text-primary/90 md:text-sm"
          />

          <h1 id="hero-title" className="mt-6 text-balance">
            <AnimatedText
              text={hero.headline.text}
              preset={hero.headline.preset}
              className="block font-sans text-5xl font-bold leading-[0.92] tracking-tight text-foreground sm:text-7xl xl:text-8xl"
            />
            <AnimatedText
              text={hero.subheadline}
              mode="reveal"
              trigger="mount"
              delay={1.9}
              stagger={0.012}
              duration={0.5}
              className="mt-3 block text-2xl font-medium leading-tight text-muted-foreground sm:text-3xl xl:text-4xl"
            />
          </h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.4, ease: EASE_OUT }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {hero.description}
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.6, ease: EASE_OUT }}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants(),
                'group h-12 gap-3 px-7 font-mono text-sm font-bold tracking-[0.18em] shadow-[0_0_0_1px_rgba(255,212,0,0.5),0_10px_40px_-10px_rgba(255,212,0,0.55)] hover:bg-primary/90',
              )}
            >
              {hero.primaryCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="/api/invite"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-12 gap-3 border-border bg-background/40 px-7 font-mono text-sm tracking-[0.18em] backdrop-blur hover:border-primary/50 hover:text-primary',
              )}
            >
              <Bot className="size-4" />
              {hero.secondaryCta}
            </a>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.9 }}
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-border bg-background/60 px-4 py-2 backdrop-blur"
            role="status"
          >
            <StatusDot tone="success" />
            <span className="font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground">
              INTERFACE <span className="text-foreground">ONLINE</span>
              <span className="mx-2 text-border">|</span>
              BOT LINK <span className="text-warning">PENDING SETUP</span>
            </span>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: emblemY }} className="relative w-[min(78vw,320px)] sm:w-[380px] lg:w-[460px]">
          <CyberEmblem size={460} className="w-full" delay={0.15} />
          <HexReadout />
        </motion.div>
      </motion.div>

      <HexTicker />
    </section>
  )
}

function HexReadout() {
  const lines = ['SIG  0xFFD400', 'NODE 07/16', 'LAT  12ms', 'ENC  AES-256']
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-6 hidden flex-col gap-1 xl:flex">
      {lines.map((l, i) => (
        <motion.span
          key={l}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6 + i * 0.12, duration: 0.5, ease: EASE_OUT }}
          className="font-mono text-[0.62rem] tracking-[0.2em] text-muted-foreground"
        >
          {l}
        </motion.span>
      ))}
    </div>
  )
}

function HexTicker() {
  return (
    <div aria-hidden="true" className="relative border-y border-border bg-background/70 py-3 backdrop-blur">
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        {[0, 1].map((k) => (
          <span key={k} className="font-mono text-[0.7rem] tracking-[0.25em] text-muted-foreground">
            {HEX_STREAM} {HEX_STREAM}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
