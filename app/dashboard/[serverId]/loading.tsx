import { LoadingBlock } from '@/components/dashboard/cards'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-16 w-72 animate-pulse rounded-lg bg-surface" />
      <LoadingBlock rows={4} />
    </div>
  )
}
