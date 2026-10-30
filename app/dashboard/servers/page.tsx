import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/page-header'
import { ServerList } from '@/components/dashboard/server-list'
import { getIntegrationStatus } from '@/lib/integration-status'

export const metadata: Metadata = { title: 'Servers' }

export default function ServersPage() {
  const status = getIntegrationStatus()
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="OVERVIEW" title="Servers" description="Choose a server to configure. Servers you manage on Discord appear here after signing in and inviting the bot." />
      <ServerList oauthConfigured={status.discordOAuth} inviteConfigured={status.botInvite} />
    </div>
  )
}
