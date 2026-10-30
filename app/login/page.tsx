import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, FlaskConical, KeyRound, ShieldCheck, XCircle } from 'lucide-react'
import { CyberEmblem } from '@/components/brand/cyber-logo'
import { HudFrame } from '@/components/cyber/hud'
import { DigitalRain } from '@/components/landing/digital-rain'
import { AnimatedText } from '@/components/motion/animated-text'
import { buttonVariants } from '@/components/ui/button'
import { getIntegrationStatus } from '@/lib/integration-status'
import { DISCORD_CALLBACK_PATH } from '@/lib/oauth-config-validation'
import { getOAuthConfigIssues } from '@/lib/server/env'
import { getSession } from '@/lib/server/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Sign in' }

const NOTICES: Record<string, string> = {
  'oauth-unconfigured': 'Discord sign-in is not configured on the server yet. See the checklist below.',
  'invite-unconfigured': 'The bot invite link is not configured yet. Add DISCORD_CLIENT_ID to enable it.',
  'oauth-denied': 'Discord authorization was cancelled. No account data was shared.',
  'oauth-state': 'The sign-in request expired or could not be verified. Please start again.',
  'oauth-scope': 'CYBER needs both the identify and guilds permissions to list your servers.',
  'oauth-client': 'Discord rejected the app credentials. Check that DISCORD_CLIENT_ID is the Application ID and DISCORD_CLIENT_SECRET is the current client secret, then redeploy.',
  'oauth-redirect': 'Discord rejected the redirect URI. DISCORD_REDIRECT_URI must exactly match an entry in Developer Portal → OAuth2 → Redirects.',
  'oauth-expired': 'The Discord sign-in code expired or was already used. Please start again.',
  'oauth-failed': 'Discord sign-in failed. Please try again in a moment.',
  'rate-limited': 'Too many sign-in attempts. Wait a minute and try again.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams
  const status = getIntegrationStatus()
  const session = await getSession()
  const issues = status.discordOAuth ? [] : getOAuthConfigIssues()
  const message = notice ? NOTICES[notice] : undefined
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const expectedRedirectUri = host ? `${proto}://${host}${DISCORD_CALLBACK_PATH}` : DISCORD_CALLBACK_PATH

  return (
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden px-4 py-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <DigitalRain className="opacity-40" density={0.7} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#050505_80%)]" />
      </div>

      <Link href="/" className="absolute left-5 top-5 flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> BACK
      </Link>

      <HudFrame className="w-full max-w-md rounded-xl border border-border bg-background/85 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <CyberEmblem size={140} interactive={false} delay={0} />
          <div className="flex flex-col gap-2">
            <AnimatedText as="h1" text="AUTHENTICATE" preset="pageTitle" className="font-mono text-2xl font-bold tracking-[0.3em]" />
            <p className="text-sm text-muted-foreground">Sign in with the Discord account that manages your server.</p>
          </div>

          {message && (
            <div role="status" className="flex w-full items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-left text-xs text-warning">
              <AlertTriangle className="mt-px size-4 shrink-0" />
              {message}
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            {session ? (
              <Link href="/dashboard/servers" className={cn(buttonVariants(), 'h-11 gap-2.5 font-semibold')}>
                <KeyRound /> Continue as {session.user.globalName ?? session.user.username}
              </Link>
            ) : status.discordOAuth ? (
              <a href="/api/auth/discord" className={cn(buttonVariants(), 'h-11 gap-2.5 font-semibold')}>
                <KeyRound /> Continue with Discord
              </a>
            ) : (
              <button type="button" disabled aria-describedby="oauth-config-issues" className={cn(buttonVariants(), 'h-11 gap-2.5 font-semibold')}>
                <KeyRound /> Continue with Discord
              </button>
            )}
            {!session && issues.length > 0 && (
              <div id="oauth-config-issues" className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 text-left text-xs">
                <p className="font-mono text-[0.65rem] tracking-widest text-muted-foreground">SERVER CONFIGURATION NEEDED</p>
                <ul className="flex flex-col gap-1.5">
                  {issues.map((issue) => (
                    <li key={`${issue.variable}-${issue.problem}`} className="flex items-start gap-2">
                      <XCircle className="mt-px size-3.5 shrink-0 text-destructive" aria-hidden="true" />
                      <span className="text-muted-foreground">
                        <code className="font-mono text-foreground">{issue.variable}</code> {issue.problem}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground">
                  Redirect URI for this domain: <code className="break-all font-mono text-foreground">{expectedRedirectUri}</code>
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 py-1 text-[0.65rem] tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
            </div>
            <Link href="/dashboard/demo" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 gap-2.5')}>
              <FlaskConical /> Explore the demo workspace
            </Link>
          </div>

          <p className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> CYBER requests only the identify and guilds scopes.
          </p>
        </div>
      </HudFrame>
    </main>
  )
}
