
import type { Metadata } from 'next'
import { TicketsDashboard } from '@/components/dashboard/tickets'

export const metadata: Metadata = {
  title: 'Tickets | CYBER'
}

export default async function TicketsPage({
  params
}: {
  params: Promise<{ serverId: string }>
}) {
  const { serverId } = await params

  return <TicketsDashboard serverId={serverId} />
}
