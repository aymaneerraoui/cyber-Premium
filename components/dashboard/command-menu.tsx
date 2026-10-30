'use client'

import { Home, LogIn, Search } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import { itemHref, NAV_GROUPS } from '@/lib/navigation'

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const params = useParams<{ serverId?: string }>()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground outline-none transition-colors hover:border-foreground/15 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 font-mono text-[0.6rem] sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command menu" description="Jump to any dashboard page">
        <CommandInput placeholder="Type a page or module…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {NAV_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => {
                const href = itemHref(item, params.serverId)
                const Icon = item.icon
                return (
                  <CommandItem key={item.id} value={`${item.label} ${item.description}`} disabled={!href} onSelect={() => href && go(href)}>
                    <Icon />
                    <span>{item.label}</span>
                    <span className="ml-2 truncate text-xs text-muted-foreground">{href ? item.description : 'Select a server first'}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
          <CommandGroup heading="General">
            <CommandItem value="home landing" onSelect={() => go('/')}>
              <Home /> Landing page
            </CommandItem>
            <CommandItem value="login sign in discord" onSelect={() => go('/login')}>
              <LogIn /> Sign in with Discord
              <CommandShortcut>OAuth2</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
