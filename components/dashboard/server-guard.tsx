'use client'

import Link from 'next/link'
import { ServerOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { useServer } from '@/hooks/use-cyber'
import { isDemoMode } from '@/lib/services'
import { cn } from '@/lib/utils'
import { EmptyState, LoadingBlock } from './status'

export function ServerGuard({ serverId, children }: { serverId: string; children: ReactNode }) {
  const { data, isLoading, error } = useServer(serverId)

  if (isLoading) return <LoadingBlock rows={3} />

  if (error || !data) {
    return (
      <EmptyState
        icon={ServerOff}
        title="Server not connected"
        description={
          <>
            CYBER has no connection to a server with the ID <code className="font-mono text-foreground">{serverId}</code>.
            {isDemoMode
              ? ' Managing real servers requires the CYBER backend API and bot, which are not connected in this environment.'
              : ' Make sure the bot is in this server and that your account has the Manage Server permission.'}
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/servers" className={cn(buttonVariants({ variant: 'outline' }))}>
              View servers
            </Link>
            <Link href="/dashboard/demo" className={cn(buttonVariants())}>
              Open demo workspace
            </Link>
          </div>
        }
      />
    )
  }

  return <>{children}</>
}
