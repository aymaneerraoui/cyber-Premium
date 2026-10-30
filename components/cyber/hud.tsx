import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Panel with technical corner brackets. Used for primary surfaces only. */
export function HudFrame({ className, children, bracketClassName, ...props }: ComponentProps<'div'> & { bracketClassName?: string }) {
  const b = cn('pointer-events-none absolute size-3 border-primary/60', bracketClassName)
  return (
    <div className={cn('relative', className)} {...props}>
      <span aria-hidden="true" className={cn(b, 'left-0 top-0 border-l border-t')} />
      <span aria-hidden="true" className={cn(b, 'right-0 top-0 border-r border-t')} />
      <span aria-hidden="true" className={cn(b, 'bottom-0 left-0 border-b border-l')} />
      <span aria-hidden="true" className={cn(b, 'bottom-0 right-0 border-b border-r')} />
      {children}
    </div>
  )
}

export function StatusDot({ tone = 'signal', className }: { tone?: 'signal' | 'success' | 'warning' | 'danger' | 'muted'; className?: string }) {
  const color = {
    signal: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    muted: 'bg-muted-foreground',
  }[tone]
  return (
    <span className={cn('relative inline-flex size-2', className)} aria-hidden="true">
      <span className={cn('absolute inset-0 rounded-full opacity-60 animate-ping', color)} style={{ animationDuration: '2.4s' }} />
      <span className={cn('relative inline-flex size-2 rounded-full', color)} />
    </span>
  )
}

export function HudLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('hud-label', className)}>{children}</span>
}
