import { ServerGuard } from '@/components/dashboard/server-guard'

export default async function ServerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ serverId: string }> }) {
  const { serverId } = await params
  return <ServerGuard serverId={serverId}>{children}</ServerGuard>
}
