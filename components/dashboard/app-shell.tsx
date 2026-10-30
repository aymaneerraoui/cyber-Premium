'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { EASE_OUT } from '@/lib/motion'
import { SidebarContent } from './sidebar'
import { DemoBanner, Topbar } from './topbar'

const COLLAPSE_KEY = 'cyber.ui.sidebar-collapsed'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // UI preference only — not application data.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1')
  }, [])

  const toggle = () => {
    setCollapsed((c) => {
      window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      return !c
    })
  }

  const width = collapsed ? 68 : 264

  return (
    <div className="min-h-svh bg-background" style={{ '--sidebar-width': `${width}px` } as CSSProperties}>
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar lg:block"
        animate={{ width }}
        initial={false}
        transition={{ duration: 0.3, ease: EASE_OUT }}
      >
        <SidebarContent collapsed={collapsed} />
      </motion.aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] gap-0 border-sidebar-border bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} layoutGroup="mobile" />
        </SheetContent>
      </Sheet>

      <motion.div className="flex min-h-svh flex-col lg:pl-[var(--sidebar-width)]" style={{ transition: 'padding-left 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <DemoBanner />
        <Topbar collapsed={collapsed} onToggleCollapse={toggle} onOpenMobile={() => setMobileOpen(true)} />
        <main id="main" className="flex-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pt-8"
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
