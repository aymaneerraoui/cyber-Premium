'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Bot, KeyRound, Search } from 'lucide-react'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useServers } from '@/hooks/use-cyber'
import { useSession } from '@/hooks/use-session'
import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { ManagedGuilds } from './managed-guilds'
import { ServerAvatar } from './server-switcher'
import { ErrorState, LoadingBlock } from './status'

export function ServerList({ oauthConfigured, inviteConfigured }: { oauthConfigured: boolean; inviteConfigured: boolean }) {
  const { data, isLoading, error, mutate } = useServers()
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const servers = (data ?? []).filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
  const signedIn = Boolean(session?.user)

  return (
    <div className="flex flex-col gap-6">
      {signedIn && (
        <section aria-labelledby="your-servers" className="flex flex-col gap-4">
          <h2 id="your-servers" className="hud-label text-primary/90">
            YOUR DISCORD SERVERS
          </h2>
          <ManagedGuilds />
        </section>
      )}

      {signedIn && (
        <h2 className="hud-label pt-2 text-primary/90">WORKSPACES</h2>
      )}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter servers" aria-label="Filter servers" className="h-10 bg-surface pl-9" />
      </div>

      {isLoading && <LoadingBlock rows={2} />}
      {error && <ErrorState message="Could not load servers." onRetry={() => mutate()} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servers.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4, ease: EASE_OUT }}>
            <Link
              href={`/dashboard/${s.id}`}
              className="group flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-5 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <ServerAvatar server={s} className="size-11" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-semibold">{s.name}</span>
                  <span className="font-mono text-[0.65rem] tracking-wider text-warning">{s.mode === 'demo' ? 'DEMO · SAMPLE CHANNELS & ROLES' : 'CONNECTED'}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {s.mode === 'demo' ? 'Not a real Discord server. Drafts are stored in this browser.' : `${s.memberCount ?? '—'} members`}
              </p>
              <span className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
                Configure <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}

        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-surface/40 p-5">
          <span className="font-semibold">Connect a real server</span>
          <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-mono text-xs text-primary">01</span> Sign in with Discord to list servers you manage.
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-xs text-primary">02</span> Invite the CYBER bot with the required permissions.
            </li>
          </ol>
          <div className="mt-auto flex flex-wrap gap-2">
            {!signedIn && (
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
                <KeyRound /> Sign in
              </Link>
            )}
            <a href="/api/invite" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
              <Bot /> Invite bot
            </a>
          </div>
          {(!oauthConfigured || !inviteConfigured) && (
            <p className="text-xs text-warning/90">Discord application credentials are not configured yet, so these actions show setup guidance.</p>
          )}
        </div>
      </div>
    </div>
  )
}
