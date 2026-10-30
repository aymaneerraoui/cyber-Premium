'use client'

import { motion } from 'motion/react'
import { DynamicIcon } from '@/components/cyber/icon'
import { Counter, Reveal } from '@/components/motion/primitives'
import { LANDING } from '@/lib/content/landing'
import { EASE_OUT } from '@/lib/motion'
import { SectionHeading } from './section-heading'

export function Capabilities() {
  return (
    <section aria-label="Platform specifications" className="relative border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {LANDING.capabilities.map((c, i) => (
          <Reveal
            key={c.label}
            delay={i * 0.08}
            className="flex flex-col gap-2 border-border px-5 py-10 md:px-8 md:py-14 [&:not(:last-child)]:border-r max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b"
          >
            <span className="hud-label">SPEC.{String(i + 1).padStart(2, '0')}</span>
            <Counter value={c.value} suffix={c.suffix} className="font-mono text-4xl font-bold text-foreground md:text-5xl" />
            <span className="text-sm font-medium text-foreground">{c.label}</span>
            <span className="text-xs text-muted-foreground">{c.note}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          index="01"
          label="MODULE INDEX"
          title="Every system your community runs on."
          description="Sixteen modules, one coherent control surface. Enable only what you need — each module is configured visually and validated against Discord's limits."
        />
        <motion.ul
          className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-10%' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {LANDING.features.map((f, i) => (
            <motion.li
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } } }}
              className="group relative flex min-h-52 flex-col justify-between gap-8 bg-background p-6 transition-colors duration-300 hover:bg-surface-raised"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-md border border-border bg-surface text-primary transition-colors group-hover:border-primary/40">
                  <DynamicIcon name={f.icon} className="size-5" />
                </span>
                <span className="font-mono text-[0.65rem] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100"
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
