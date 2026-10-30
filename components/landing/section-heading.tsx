import { AnimatedText } from '@/components/motion/animated-text'
import { Reveal } from '@/components/motion/primitives'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  index: string
  label: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({ index, label, title, description, align = 'left', className }: SectionHeadingProps) {
  return (
    <div className={cn('flex max-w-2xl flex-col gap-4', align === 'center' && 'mx-auto items-center text-center', className)}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-primary">{index}</span>
        <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
        <AnimatedText text={label} preset="sectionLabel" className="hud-label text-foreground/80" />
      </div>
      <AnimatedText as="h2" text={title} preset="sectionTitle" className="text-balance text-3xl font-bold leading-[1.05] tracking-tight md:text-5xl" />
      {description && (
        <Reveal delay={0.2}>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
        </Reveal>
      )}
    </div>
  )
}
