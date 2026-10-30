'use client'

import { ErrorState } from '@/components/dashboard/status'

export default function ServerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-10">
      <ErrorState message={error.message || 'Something went wrong while loading this page.'} onRetry={reset} />
    </div>
  )
}
