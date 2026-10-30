'use client'

import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import { SWRConfig } from 'swr'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ shouldRetryOnError: false }}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delay={250}>{children}</TooltipProvider>
      </MotionConfig>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: '!bg-popover !border !border-border !text-foreground !font-sans !rounded-lg',
            description: '!text-muted-foreground',
            success: '[&_[data-icon]]:!text-primary',
            error: '[&_[data-icon]]:!text-destructive',
          },
        }}
      />
    </SWRConfig>
  )
}
