'use client'

import Link from 'next/link'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { CyberWordmark } from '@/components/brand/cyber-logo'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#security', label: 'Security' },
  { href: '#preview', label: 'Dashboard' },
]

export function SiteHeader() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled ? 'border-b border-border bg-background/75 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <CyberWordmark />
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), 'hidden h-9 px-4 font-mono text-xs tracking-widest sm:inline-flex')}>
            LOGIN
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants(), 'hidden h-9 px-4 font-mono text-xs font-bold tracking-widest sm:inline-flex')}>
            DASHBOARD
          </Link>
          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-md border border-border text-foreground md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-background">
              <SheetHeader>
                <SheetTitle className="font-mono tracking-[0.3em]">CYBER</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href} className="rounded-md px-3 py-3 font-mono text-sm tracking-widest uppercase hover:bg-muted">
                    {item.label}
                  </a>
                ))}
                <Link href="/dashboard" className={cn(buttonVariants(), 'mt-4 h-11 font-mono font-bold tracking-widest')}>
                  ENTER DASHBOARD
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 font-mono tracking-widest')}>
                  LOGIN
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
