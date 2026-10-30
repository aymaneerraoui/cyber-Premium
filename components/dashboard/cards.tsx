import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/*
 * Purely presentational building blocks with no hooks or browser APIs.
 * This module intentionally has no "use client" directive so Server
 * Components can render it directly and pass icon components as props —
 * component functions cannot cross the server → client boundary.
 */

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  icon: Icon,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  icon?: LucideIcon
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                <Icon className="size-4" />
              </span>
            )}
            <div className="flex flex-col gap-0.5">
              {title && <h2 className="text-sm font-semibold">{title}</h2>}
              {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full border border-border bg-background text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-surface" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  )
}
