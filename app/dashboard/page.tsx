import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FlaskConical, LogIn, Plug } from 'lucide-react'
import { ConnectionChecklist } from '@/components/dashboard/connection-checklist'
import { PageHeader } from '@/components/dashboard/page-header'
import { SectionCard } from '@/components/dashboard/cards'
import { buttonVariants } from '@/components/ui/button'
import { getIntegrationStatus } from '@/lib/integration-status'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardHome() {
  const status = getIntegrationStatus()
  const connected = Object.values(status).filter(Boolean).length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONTROL CENTER"
        title="Dashboard"
        description="Connect your Discord account to manage real servers, or explore every module in the demo workspace with locally stored drafts."
        actions={
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
            <LogIn /> Sign in with Discord
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-card p-6 md:p-8">
          <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="relative flex flex-col gap-5">
            <span className="grid size-11 place-items-center rounded-lg border border-warning/40 bg-warning/10 text-warning">
              <FlaskConical className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">Demo workspace</h2>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                A sandbox server with sample channels and roles. Build ticket panels, applications and announcements, tune security — everything works, and nothing is sent to
                Discord.
              </p>
            </div>
            <Link href="/dashboard/demo" className={cn(buttonVariants(), 'group h-10 w-fit gap-2 px-5 font-semibold')}>
              Open demo workspace <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <SectionCard
          icon={Plug}
          title="Connection status"
          description={`${connected} of 3 integrations configured`}
          actions={
            <Link href="/dashboard/servers" className="text-xs text-primary hover:underline">
              Servers
            </Link>
          }
        >
          <ConnectionChecklist status={status} />
        </SectionCard>
      </div>
    </div>
  )
}
