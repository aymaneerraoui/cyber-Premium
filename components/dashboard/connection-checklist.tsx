import { Bot, CircleCheck, Database, KeyRound, type LucideIcon } from 'lucide-react'
import type { IntegrationStatus } from '@/lib/integration-status'
import { cn } from '@/lib/utils'

const STEPS: { key: keyof IntegrationStatus; icon: LucideIcon; title: string; body: string; env: string }[] = [
  { key: 'discordOAuth', icon: KeyRound, title: 'Discord OAuth2', body: 'Lets administrators sign in and lists the servers they manage.', env: 'DISCORD_CLIENT_ID · DISCORD_CLIENT_SECRET · DISCORD_REDIRECT_URI · SESSION_SECRET' },
  { key: 'botInvite', icon: Bot, title: 'Bot invite', body: 'Adds the CYBER bot to a server with the required permissions.', env: 'DISCORD_CLIENT_ID' },
  { key: 'backendApi', icon: Database, title: 'CYBER backend API', body: 'Persists configuration and relays publish actions to the bot.', env: 'NEXT_PUBLIC_CYBER_API_URL' },
]

export function ConnectionChecklist({ status }: { status: IntegrationStatus }) {
  return (
    <ol className="flex flex-col divide-y divide-border">
      {STEPS.map((s, i) => {
        const done = status[s.key]
        return (
          <li key={s.key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-md border',
                done ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-surface text-muted-foreground',
              )}
            >
              {done ? <CircleCheck className="size-4" /> : <s.icon className="size-4" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.65rem] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm font-medium">{s.title}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-px font-mono text-[0.6rem] tracking-wider',
                    done ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
                  )}
                >
                  {done ? 'CONFIGURED' : 'NOT CONFIGURED'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              <code className="mt-1 w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] text-foreground/70">{s.env}</code>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
