import { Capabilities, Features } from '@/components/landing/capabilities'
import { DashboardPreview } from '@/components/landing/dashboard-preview'
import { FinalCta, SiteFooter } from '@/components/landing/final-cta'
import { Hero } from '@/components/landing/hero'
import { SecurityShowcase } from '@/components/landing/showcase-security'
import { TicketShowcase } from '@/components/landing/showcase-tickets'
import { ApplicationShowcase, NotificationShowcase } from '@/components/landing/showcase-workflows'
import { SiteHeader } from '@/components/landing/site-header'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Capabilities />
        <Features />
        <TicketShowcase />
        <ApplicationShowcase />
        <SecurityShowcase />
        <NotificationShowcase />
        <DashboardPreview />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
