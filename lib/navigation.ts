import {
  Bell,
  CalendarClock,
  ClipboardList,
  Fingerprint,
  Hand,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Plug,
  Radar,
  ScrollText,
  Server,
  Settings,
  Shield,
  SlidersHorizontal,
  Ticket,
  Video,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  /** Path segment after /dashboard/[serverId]. Empty string = overview. */
  segment?: string
  /** Absolute path for non-server routes. */
  href?: string
  /** Module toggle key, if the page is a toggleable module. */
  module?: string
  description: string
  children?: { label: string; segment: string }[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, segment: '', description: 'Server overview and module status' },
      { id: 'servers', label: 'Servers', icon: Server, href: '/dashboard/servers', description: 'Select or connect a server' },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'welcome', label: 'Welcome', icon: Hand, segment: 'welcome', module: 'welcome', description: 'Greet new members' },
      {
        id: 'tickets',
        label: 'Tickets',
        icon: Ticket,
        segment: 'tickets',
        module: 'tickets',
        description: 'Panels, categories and workflow',
        children: [
          { label: 'Overview', segment: 'tickets' },
          { label: 'Panels', segment: 'tickets/panels' },
          { label: 'Categories', segment: 'tickets/categories' },
          { label: 'Settings', segment: 'tickets/settings' },
        ],
      },
      { id: 'applications', label: 'Applications', icon: ClipboardList, segment: 'applications', module: 'applications', description: 'Forms and review pipeline' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, segment: 'announcements', module: 'announcements', description: 'Embed composer and templates' },
      { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, segment: 'suggestions', module: 'suggestions', description: 'Community suggestion board' },
    ],
  },
  {
    label: 'Automation',
    items: [
      { id: 'streams', label: 'Stream Notifications', icon: Bell, segment: 'notifications', module: 'streams', description: 'Go-live alerts' },
      { id: 'videos', label: 'Video Notifications', icon: Video, segment: 'notifications/videos', module: 'videos', description: 'New upload alerts' },
      { id: 'scheduled', label: 'Scheduled Messages', icon: CalendarClock, segment: 'scheduled', module: 'scheduled', description: 'Recurring posts' },
    ],
  },
  {
    label: 'Security',
    items: [
      { id: 'moderation', label: 'Moderation', icon: Shield, segment: 'moderation', module: 'moderation', description: 'Bans, timeouts and warnings' },
      { id: 'antispam', label: 'Anti-Spam', icon: Radar, segment: 'security', module: 'antispam', description: 'Filters and thresholds' },
      { id: 'scanner', label: 'Security Scanner', icon: Fingerprint, segment: 'security/scanner', module: 'scanner', description: 'Look up a user ID' },
      { id: 'logs', label: 'Audit Logs', icon: ScrollText, segment: 'logs', module: 'logs', description: 'Configuration and security events' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'integrations', label: 'Integrations', icon: Plug, segment: 'integrations', description: 'Discord, API and external services' },
      { id: 'modules', label: 'Module Settings', icon: SlidersHorizontal, segment: 'modules', description: 'Enable or disable modules' },
      { id: 'settings', label: 'General Settings', icon: Settings, segment: 'settings', description: 'Language, timezone and defaults' },
    ],
  },
]

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

export function itemHref(item: NavItem, serverId: string | undefined) {
  if (item.href) return item.href
  if (!serverId) return null
  return `/dashboard/${serverId}${item.segment ? `/${item.segment}` : ''}`
}

/** Finds the nav item that best matches the current pathname (longest segment wins). */
export function matchNavItem(pathname: string, serverId: string | undefined): NavItem | undefined {
  let best: NavItem | undefined
  let bestLen = -1
  for (const item of ALL_NAV_ITEMS) {
    const href = itemHref(item, serverId)
    if (!href) continue
    const isMatch = item.segment === '' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
    if (isMatch && href.length > bestLen) {
      best = item
      bestLen = href.length
    }
  }
  return best
}
