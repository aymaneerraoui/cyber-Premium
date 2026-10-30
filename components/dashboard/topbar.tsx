'use client'

import Link from 'next/link'
import { Bell, ChevronRight, FlaskConical, House, LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, RotateCcw, User } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useResource, useServer } from '@/hooks/use-cyber'
import { GUILDS_KEY, SESSION_KEY, signOut, useSession } from '@/hooks/use-session'
import { cyberService, isDemoMode } from '@/lib/services'
import { matchNavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { CommandMenu } from './command-menu'

export function Topbar({ collapsed, onToggleCollapse, onOpenMobile }: { collapsed: boolean; onToggleCollapse: () => void; onOpenMobile: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Open navigation">
        <Menu />
      </Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden w-64 md:block">
          <CommandMenu />
        </div>
        <NotificationsButton />
        <UserMenu />
      </div>
    </header>
  )
}

function Breadcrumbs() {
  const params = useParams<{ serverId?: string }>()
  const pathname = usePathname()
  const { data: server } = useServer(params.serverId)
  const item = matchNavItem(pathname, params.serverId)
  const child = item?.children?.find((c) => pathname.endsWith(`/${c.segment}`) && c.segment !== item.segment)

  const crumbs: { label: string; href?: string }[] = [{ label: 'Dashboard', href: '/dashboard' }]
  if (params.serverId) crumbs.push({ label: server?.name ?? params.serverId, href: `/dashboard/${params.serverId}` })
  if (item && item.segment !== '' && item.id !== 'servers') {
    crumbs.push({ label: item.label, href: child ? `/dashboard/${params.serverId}/${item.segment}` : undefined })
  }
  if (item?.id === 'servers') crumbs.push({ label: 'Servers' })
  if (child) crumbs.push({ label: child.label })

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />}
              {c.href && !last ? (
                <Link href={c.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('truncate', last ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {c.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function NotificationsButton() {
  const params = useParams<{ serverId?: string }>()
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />}>
        <Bell />
        {params.serverId && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" aria-hidden="true" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Recent activity</span>
          {params.serverId && (
            <Link href={`/dashboard/${params.serverId}/logs`} className="text-xs text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        {params.serverId ? <ActivityList serverId={params.serverId} /> : <p className="px-4 py-6 text-center text-sm text-muted-foreground">Select a server to see its activity.</p>}
      </PopoverContent>
    </Popover>
  )
}

function ActivityList({ serverId }: { serverId: string }) {
  const { data, error } = useResource(serverId, 'auditEvents')
  if (error) return <p className="px-4 py-6 text-center text-sm text-muted-foreground">Activity unavailable for this server.</p>
  if (!data) return <div className="m-4 h-24 animate-pulse rounded-md bg-muted" />
  return (
    <ul className="max-h-80 overflow-y-auto py-1">
      {data.slice(0, 6).map((e) => (
        <li key={e.id} className="flex gap-3 px-4 py-2.5">
          <span
            className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', e.severity === 'critical' ? 'bg-destructive' : e.severity === 'warning' ? 'bg-warning' : 'bg-muted-foreground')}
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm leading-snug">{e.message}</span>
            <span className="font-mono text-[0.65rem] text-muted-foreground">
              {e.actor} · {new Date(e.createdAt).toLocaleString()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function UserMenu() {
  const router = useRouter()
  const params = useParams<{ serverId?: string }>()
  const { mutate } = useSWRConfig()
  const { data: session } = useSession()
  const user = session?.user ?? null

  async function resetDemo() {
    if (!params.serverId || !cyberService.resetDemo) return
    await cyberService.resetDemo(params.serverId)
    await mutate((key) => Array.isArray(key) && key[0] === 'resource', undefined, { revalidate: true })
    toast.success('Demo workspace reset', { description: 'All local drafts were cleared and sample data restored.' })
  }

  async function handleSignOut() {
    try {
      await signOut()
      await mutate(SESSION_KEY)
      await mutate(GUILDS_KEY, undefined, { revalidate: false })
      toast.success('Signed out')
      router.push('/login')
    } catch {
      toast.error('Sign out failed', { description: 'Please try again.' })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border p-0.5 pr-2.5 outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          />
        }
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-7 rounded-full object-cover" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground">
            <User className="size-3.5" />
          </span>
        )}
        <span className="hidden max-w-28 truncate font-mono text-[0.65rem] tracking-wider text-muted-foreground sm:inline">
          {user ? (user.globalName ?? user.username).toUpperCase() : 'GUEST'}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            {user ? (
              <>
                <span className="truncate text-sm text-foreground">{user.globalName ?? user.username}</span>
                <span className="truncate text-xs font-normal">@{user.username}</span>
              </>
            ) : (
              <>
                <span className="text-sm text-foreground">Not signed in</span>
                <span className="text-xs font-normal">
                  {session && !session.oauthConfigured ? 'Discord OAuth2 is not configured yet' : 'Sign in to list your servers'}
                </span>
              </>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => router.push('/login')}>
            <LogIn /> Sign in with Discord
          </DropdownMenuItem>
        )}
        {isDemoMode && params.serverId && (
          <DropdownMenuItem onClick={resetDemo}>
            <RotateCcw /> Reset demo workspace
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/')}>
          <House /> Exit to site
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DemoBanner() {
  if (!isDemoMode) return null
  return (
    <div className="flex items-center justify-center gap-2 border-b border-warning/20 bg-warning/[0.06] px-4 py-1.5 text-center text-[0.72rem] text-warning">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Demo mode</strong>
        <span className="text-warning/80"> — configuration is saved in this browser only. Nothing is sent to Discord until the bot is connected.</span>
      </span>
    </div>
  )
}
