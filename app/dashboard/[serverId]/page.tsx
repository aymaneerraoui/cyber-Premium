import type { Metadata } from 'next'
import { ServerOverview } from '@/components/dashboard/server-overview'

export const metadata: Metadata = { title: 'Server Overview' }

export default async function ServerOverviewPage({ params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params
  return <ServerOverview serverId={serverId} />
}
