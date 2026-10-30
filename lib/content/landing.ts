import type { TextPreset } from '@/lib/motion'

/** Central, editable copy for the landing page. Change text or animation presets here. */
export const LANDING = {
  hero: {
    eyebrow: { text: '> cyber.core :: secure channel established', preset: 'heroEyebrow' as TextPreset },
    headline: { text: 'TOTAL CONTROL', preset: 'heroHeadline' as TextPreset },
    subheadline: 'for the Discord servers that matter.',
    description:
      'Ticket panels, recruitment pipelines, announcements, moderation, and security — engineered into one precise control surface for your community.',
    primaryCta: 'ENTER DASHBOARD',
    secondaryCta: 'INVITE BOT',
  },
  capabilities: [
    { value: 25, suffix: '', label: 'Buttons per ticket panel', note: 'Discord component limit, enforced live' },
    { value: 16, suffix: '', label: 'Configurable modules', note: 'Tickets to anti-spam' },
    { value: 6000, suffix: '', label: 'Embed characters validated', note: 'Before anything reaches Discord' },
    { value: 0, suffix: '', label: 'Lines of JSON required', note: 'Every message designed visually' },
  ],
  features: [
    { icon: 'Ticket', title: 'Ticket System', body: 'Multi-button panels, categories, private channels, claim, transcripts and logging.' },
    { icon: 'ClipboardList', title: 'Applications', body: 'Form builder with review stages, interviews and role outcomes.' },
    { icon: 'Megaphone', title: 'Announcements', body: 'Visual embed composer with templates, mentions and multiple embeds.' },
    { icon: 'ShieldAlert', title: 'Moderation', body: 'Bans, timeouts and warnings with a searchable, filterable history.' },
    { icon: 'Radar', title: 'Anti-Spam', body: 'Burst, mention, duplicate and link filters with ignored roles and channels.' },
    { icon: 'Radio', title: 'Stream Alerts', body: 'Twitch, YouTube and Kick notifications with custom message templates.' },
    { icon: 'CalendarClock', title: 'Scheduled Messages', body: 'Recurring reminders and event posts on a precise cadence.' },
    { icon: 'ScrollText', title: 'Audit Logs', body: 'Every configuration change and security event, recorded.' },
  ],
} as const

export const HEX_STREAM =
  '0x4359424552 :: AUTH OK :: 0xFFD400 :: MODULE.TICKETS ONLINE :: 0x7F3A9C :: ANTI-SPAM ARMED :: 0x00C0FFEE :: AUDIT LOG SYNCED :: 0xDEADBEEF :: PANEL.RENDER 60FPS :: 0x1F4A ::'
