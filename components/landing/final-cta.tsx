import Link from 'next/link'
import { ArrowRight, Bot } from 'lucide-react'
import { CyberWordmark } from '@/components/brand/cyber-logo'
import { AnimatedText } from '@/components/motion/animated-text'
import { Reveal } from '@/components/motion/primitives'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DigitalRain } from './digital-rain'

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden border-t border-border py-28 md:py-40">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <DigitalRain className="opacity-30" density={0.6} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,212,0,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050505_85%)]" />
      </div>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-5 text-center md:px-8">
        <span className="hud-label text-primary">{'// ACCESS LEVEL: ADMINISTRATOR'}</span>
        <AnimatedText
          as="h2"
          text="Take control."
          preset="ctaTitle"
          className="text-balance text-5xl font-bold tracking-tight md:text-7xl"
        />
        <Reveal delay={0.1}>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Explore the full dashboard in the demo workspace today. Connect your Discord server when the bot integration goes live.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/dashboard" className={cn(buttonVariants(), 'group h-12 gap-3 px-7 font-mono text-sm font-bold tracking-[0.18em]')}>
            ENTER DASHBOARD <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="/api/invite" className={cn(buttonVariants({ variant: 'outline' }), 'h-12 gap-3 px-7 font-mono text-sm tracking-[0.18em] hover:border-primary/50 hover:text-primary')}>
            <Bot className="size-4" /> INVITE BOT
          </a>
        </Reveal>
      </div>
    </section>
  )
}

const FOOTER_LINKS = [
  {
    title: 'Platform',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/servers', label: 'Servers' },
      { href: '/login', label: 'Login' },
    ],
  },
  {
    title: 'Modules',
    links: [
      { href: '/dashboard/demo/tickets', label: 'Tickets' },
      { href: '/dashboard/demo/applications', label: 'Applications' },
      { href: '/dashboard/demo/announcements', label: 'Announcements' },
      { href: '/dashboard/demo/security', label: 'Security' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: 'https://discord.com/developers/docs', label: 'Discord API docs' },
      { href: 'https://support.discord.com', label: 'Discord support' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div className="flex flex-col gap-4">
          <CyberWordmark />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Premium Discord server management by FG Organization. Precision tools for communities that take control seriously.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
            <span className="hud-label">{group.title}</span>
            {group.links.map((l) =>
              l.href.startsWith('http') ? (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-sm text-foreground/80 transition-colors hover:text-primary">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="text-sm text-foreground/80 transition-colors hover:text-primary">
                  {l.label}
                </Link>
              ),
            )}
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground sm:flex-row md:px-8">
          <span>© {new Date().getFullYear()} FG ORGANIZATION · CYBER</span>
          <span>NOT AFFILIATED WITH DISCORD INC.</span>
        </div>
      </div>
    </footer>
  )
}
