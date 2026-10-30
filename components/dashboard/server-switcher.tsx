'use client'

import { Check, ChevronsUpDown, FlaskConical, Plus, Server } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServer, useServers } from '@/hooks/use-cyber'
import type { ServerSummary } from '@/lib/types/config'
import { cn } from '@/lib/utils'

export function ServerAvatar({ server, className }: { server: Pick<ServerSummary, 'name' | 'iconUrl' | 'mode'> | null; className?: string }) {
  if (!server)
    return (
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-md border border-dashed border-border text-muted-foreground', className)}>
        <Server className="size-4" />
      </span>
    )
  if (server.iconUrl) return <img src={server.iconUrl || "/placeholder.svg"} alt="" className={cn('size-8 shrink-0 rounded-md object-cover', className)} />
  return (
    <span
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-md border font-mono text-xs font-bold',
        server.mode === 'demo' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-border bg-muted',
        className,
      )}
    >
      {server.mode === 'demo' ? <FlaskConical className="size-4" /> : server.name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function ServerSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const params = useParams<{ serverId?: string }>()
  const router = useRouter()
  const { data: servers = [] } = useServers()
  const { data: current } = useServer(params.serverId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Switch server"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-background/40 text-left outline-none transition-colors hover:border-foreground/15 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring',
              collapsed ? 'justify-center p-1' : 'p-2',
            )}
          />
        }
      >
        <ServerAvatar server={current ?? null} />
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{current?.name ?? 'No server selected'}</span>
              <span className="truncate font-mono text-[0.6rem] tracking-wider text-muted-foreground">
                {current ? (current.mode === 'demo' ? 'DEMO · LOCAL DRAFTS' : 'CONNECTED') : 'SELECT TO CONFIGURE'}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Servers</DropdownMenuLabel>
          {servers.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => router.push(`/dashboard/${s.id}`)}>
              <ServerAvatar server={s} className="size-6 [&_svg]:size-3.5" />
              <span className="flex-1 truncate">{s.name}</span>
              {s.id === params.serverId && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/servers')}>
          <Plus /> Connect a server
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
