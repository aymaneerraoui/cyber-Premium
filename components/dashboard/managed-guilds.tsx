'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Bot, Crown, KeyRound, ServerOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useManagedGuilds } from '@/hooks/use-session'
import type { ManagedGuild } from '@/lib/auth-types'
import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingBlock } from './cards'
import { ServerAvatar } from './server-switcher'
import { ErrorState } from './status'

const ERROR_COPY: Record<string, string> = {
  session_expired: 'Your Discord session expired. Sign in again to load your servers.',
  rate_limited: 'Too many requests. Wait a minute and try again.',
  discord_rate_limited: 'Discord is rate limiting requests. Try again shortly.',
  discord_unavailable: 'Discord could not be reached. Try again shortly.',
}

/** Discord servers the signed-in user can manage (owner, Administrator, or Manage Server). */
export function ManagedGuilds() {
  const { data, error, isLoading, mutate } = useManagedGuilds(true)

  if (isLoading) return <LoadingBlock rows={2} />

  if (error) {
    if (error.status === 401) {
      return (
        <EmptyState
          icon={KeyRound}
          title="Sign in again"
          description={ERROR_COPY.session_expired}
          action={
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }))}>
              Sign in with Discord
            </Link>
          }
        />
      )
    }
    return <ErrorState message={ERROR_COPY[error.code] ?? 'Could not load your Discord servers.'} onRetry={() => mutate()} />
  }

  if (!data || data.guilds.length === 0) {
    return (
      <EmptyState
        icon={ServerOff}
        title="No manageable servers"
        description="CYBER lists servers you own or where you have the Administrator or Manage Server permission."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!data.botStatusKnown && (
        <p className="text-xs text-muted-foreground">
          Bot presence is unknown because <code className="font-mono text-foreground/80">DISCORD_BOT_TOKEN</code> is not configured on the server.
        </p>
      )}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.guilds.map((g, i) => (
          <motion.li key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4, ease: EASE_OUT }}>
            <GuildCard guild={g} />
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function GuildCard({ guild }: { guild: ManagedGuild }) {
  const status =
    guild.botInstalled === null
      ? { label: 'BOT STATUS UNKNOWN', className: 'text-muted-foreground' }
      : guild.botInstalled
        ? { label: 'BOT INSTALLED', className: 'text-success' }
        : { label: 'BOT NOT INSTALLED', className: 'text-warning' }

  return (
    <div className="flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <ServerAvatar server={{ name: guild.name, iconUrl: guild.iconUrl, mode: 'live' }} className="size-11" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5 truncate font-semibold">
            <span className="truncate">{guild.name}</span>
            {guild.owner && <Crown className="size-3.5 shrink-0 text-primary" aria-label="Owner" />}
          </span>
          <span className={cn('font-mono text-[0.65rem] tracking-wider', status.className)}>{status.label}</span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {guild.botInstalled !== true && (
          <a href={`/api/invite?guild_id=${guild.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
            <Bot /> Invite bot
          </a>
        )}
{guild.botInstalled === true && (
  <Link
    href={`/dashboard/${guild.id}`}
    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
  >
    Configure <ArrowRight className="size-4" />
  </Link>
)}
      </div>
    </div>
  )
}
