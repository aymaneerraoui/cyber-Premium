'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AnimatedText } from '@/components/motion/animated-text'
import { ALL_NAV_ITEMS, itemHref } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  badges?: ReactNode
}

export function PageHeader({ title, description, eyebrow, actions, badges }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && <span className="hud-label text-primary/90">{eyebrow}</span>}
        <div className="flex flex-wrap items-center gap-3">
          <AnimatedText as="h1" text={title} preset="pageTitle" className="text-2xl font-bold tracking-tight md:text-3xl" />
          {badges}
        </div>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Secondary tab navigation for sub-routes (e.g. Tickets → Panels / Categories / Settings). */
export function SubNav({ parentId }: { parentId: string }) {
  const params = useParams<{ serverId: string }>()
  const pathname = usePathname()
  const parent = ALL_NAV_ITEMS.find((i) => i.id === parentId)
  if (!parent?.children) return null
  const base = `/dashboard/${params.serverId}`
  return (
    <nav aria-label={`${parent.label} sections`} className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {parent.children.map((child) => {
        const href = `${base}/${child.segment}`
        const active = pathname === href
        return (
          <Link
            key={child.segment}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {child.label}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </Link>
        )
      })}
    </nav>
  )
}

export function useServerHref() {
  const params = useParams<{ serverId?: string }>()
  return (segment: string) => {
    const item = ALL_NAV_ITEMS.find((i) => i.segment === segment)
    return item ? itemHref(item, params.serverId) ?? '/dashboard/servers' : `/dashboard/${params.serverId}/${segment}`
  }
}
