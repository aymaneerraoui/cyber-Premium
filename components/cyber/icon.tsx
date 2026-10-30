import {
  Ban,
  Bell,
  Bot,
  Bug,
  CalendarClock,
  CircleHelp,
  ClipboardList,
  Crown,
  Flag,
  Gamepad2,
  Gavel,
  Gem,
  Handshake,
  Heart,
  LifeBuoy,
  Lightbulb,
  Lock,
  Megaphone,
  MessageSquare,
  Radar,
  Radio,
  Scale,
  ScrollText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Ticket,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Icons selectable by admins for categories, forms, and features. */
export const ICONS = {
  LifeBuoy,
  Wrench,
  Flag,
  Scale,
  Handshake,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Users,
  Gem,
  Star,
  Bug,
  MessageSquare,
  CircleHelp,
  Crown,
  Gamepad2,
  Heart,
  Zap,
  Bell,
  Lightbulb,
  Lock,
  Gavel,
  Ban,
  Bot,
  Ticket,
  ClipboardList,
  Megaphone,
  Radar,
  Radio,
  CalendarClock,
  ScrollText,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export const ICON_NAMES = Object.keys(ICONS) as IconName[]

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as IconName] ?? CircleHelp
  return <Icon className={className} aria-hidden="true" />
}
