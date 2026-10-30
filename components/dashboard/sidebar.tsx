'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { useParams, usePathname } from 'next/navigation'
import { CyberWordmark } from '@/components/brand/cyber-logo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useResource } from '@/hooks/use-cyber'
import { itemHref, matchNavItem, NAV_GROUPS, type NavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { ServerSwitcher } from './server-switcher'

interface SidebarProps {
  collapsed?: boolean
  onNavigate?: () => void
  layoutGroup?: string
}

export function SidebarContent({ collapsed = false, onNavigate, layoutGroup = 'sidebar' }: SidebarProps) {
  const params = useParams<{ serverId?: string }>()
  const pathname = usePathname()
  const serverId = params.serverId
  const active = matchNavItem(pathname, serverId)

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        <CyberWordmark href="/" compact={collapsed} />
      </div>

      <div className={cn('shrink-0 border-b border-sidebar-border', collapsed ? 'p-2' : 'p-3')}>
        <ServerSwitcher collapsed={collapsed} />
      </div>

      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed ? (
              <div className="px-2.5 pb-1.5 font-mono text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground/70">{group.label}</div>
            ) : (
              <div className="mx-auto mb-1.5 h-px w-6 bg-sidebar-border" aria-hidden="true" />
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  serverId={serverId}
                  active={active?.id === item.id}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  layoutGroup={layoutGroup}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

function SidebarItem({
  item,
  serverId,
  active,
  collapsed,
  onNavigate,
  layoutGroup,
}: {
  item: NavItem
  serverId?: string
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
  layoutGroup: string
}) {
  const href = itemHref(item, serverId)
  const Icon = item.icon

  const inner = (
    <>
      {active && (
        <motion.span
          layoutId={`${layoutGroup}-active`}
          className="absolute inset-0 rounded-md border border-primary/20 bg-primary/[0.08]"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />}
      <Icon className={cn('relative size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      {!collapsed && <span className="relative flex-1 truncate">{item.label}</span>}
      {!collapsed && item.module && serverId && <ModuleDot serverId={serverId} module={item.module} />}
      {!collapsed && !href && <Lock className="relative size-3 text-muted-foreground/60" />}
    </>
  )

  const className = cn(
    'group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
    collapsed && 'justify-center px-0',
    active ? 'text-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-foreground',
    !href && 'cursor-not-allowed opacity-50 hover:bg-transparent',
  )

  const node = href ? (
    <Link href={href} className={className} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
      {inner}
    </Link>
  ) : (
    <span className={className} aria-disabled="true">
      {inner}
    </span>
  )

  if (!collapsed && href) return <li>{node}</li>

  return (
    <li>
      <Tooltip>
        <TooltipTrigger render={node} />
        <TooltipContent side="right">{href ? item.label : `${item.label} — select a server first`}</TooltipContent>
      </Tooltip>
    </li>
  )
}

function ModuleDot({ serverId, module }: { serverId: string; module: string }) {
  const { data } = useResource(serverId, 'modules')
  if (!data) return null
  const enabled = data[module] !== false
  return (
    <span
      className={cn('relative size-1.5 rounded-full', enabled ? 'bg-success' : 'bg-muted-foreground/40')}
      aria-label={enabled ? 'Module enabled' : 'Module disabled'}
      role="img"
    />
  )
}
