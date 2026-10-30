import {
  createAnnouncement,
  createApplicationForm,
  createEmbed,
  createFeed,
  createQuestion,
  createScheduled,
  createTicketCategory,
  createTicketPanel,
  createButton,
  DEFAULT_ANTI_SPAM,
  DEFAULT_GENERAL,
  DEFAULT_SUGGESTIONS,
  DEFAULT_TICKET_SETTINGS,
  DEFAULT_WELCOME,
} from '@/lib/factories'
import type { AuditEvent, DiscordChannel, DiscordRole, ModerationRecord, ServerSummary } from '@/lib/types/config'
import type { ResourceMap } from './types'

export const DEMO_SERVER_ID = 'demo'

/** A clearly-labelled sandbox server. It does not represent any real Discord guild. */
export const DEMO_SERVER: ServerSummary = {
  id: DEMO_SERVER_ID,
  name: 'Demo Sandbox',
  iconUrl: null,
  memberCount: null,
  botInstalled: false,
  mode: 'demo',
}

export const DEMO_CHANNELS: DiscordChannel[] = [
  { id: '100000000000000001', name: 'SUPPORT', kind: 'category' },
  { id: '100000000000000002', name: 'support-panel', kind: 'text', parentId: '100000000000000001' },
  { id: '100000000000000003', name: 'ticket-logs', kind: 'text', parentId: '100000000000000001' },
  { id: '100000000000000004', name: 'OPEN TICKETS', kind: 'category' },
  { id: '100000000000000005', name: 'ARCHIVED TICKETS', kind: 'category' },
  { id: '100000000000000006', name: 'COMMUNITY', kind: 'category' },
  { id: '100000000000000007', name: 'announcements', kind: 'announcement', parentId: '100000000000000006' },
  { id: '100000000000000008', name: 'general', kind: 'text', parentId: '100000000000000006' },
  { id: '100000000000000009', name: 'welcome', kind: 'text', parentId: '100000000000000006' },
  { id: '100000000000000010', name: 'suggestions', kind: 'text', parentId: '100000000000000006' },
  { id: '100000000000000011', name: 'go-live', kind: 'text', parentId: '100000000000000006' },
  { id: '100000000000000012', name: 'STAFF', kind: 'category' },
  { id: '100000000000000013', name: 'applications', kind: 'text', parentId: '100000000000000012' },
  { id: '100000000000000014', name: 'mod-log', kind: 'text', parentId: '100000000000000012' },
  { id: '100000000000000015', name: 'Interview Room', kind: 'voice', parentId: '100000000000000012' },
]

export const DEMO_ROLES: DiscordRole[] = [
  { id: '200000000000000001', name: 'Administrator', color: '#FFD400' },
  { id: '200000000000000002', name: 'Moderator', color: '#F5A524' },
  { id: '200000000000000003', name: 'Support Team', color: '#3DDC84' },
  { id: '200000000000000004', name: 'Trial Staff', color: '#7DD3FC' },
  { id: '200000000000000005', name: 'Member', color: '#B5BAC1' },
  { id: '200000000000000006', name: 'Muted', color: '#6B6B6B' },
]

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000).toISOString()
}

const SAMPLE_RECORDS: ModerationRecord[] = [
  { id: 'mod_1', action: 'timeout', targetId: '300000000000000001', targetTag: 'sample_user_01', moderatorTag: 'sample_mod_a', reason: 'Mention spam in #general', durationMinutes: 60, createdAt: minutesAgo(22) },
  { id: 'mod_2', action: 'warn', targetId: '300000000000000002', targetTag: 'sample_user_02', moderatorTag: 'sample_mod_b', reason: 'Off-topic advertising', createdAt: minutesAgo(95) },
  { id: 'mod_3', action: 'ban', targetId: '300000000000000003', targetTag: 'sample_user_03', moderatorTag: 'sample_mod_a', reason: 'Repeated harassment after final warning', createdAt: minutesAgo(380) },
  { id: 'mod_4', action: 'kick', targetId: '300000000000000004', targetTag: 'sample_user_04', moderatorTag: 'Anti-Spam (auto)', reason: 'Invite link flood', createdAt: minutesAgo(720) },
  { id: 'mod_5', action: 'warn', targetId: '300000000000000001', targetTag: 'sample_user_01', moderatorTag: 'sample_mod_c', reason: 'Excessive caps', createdAt: minutesAgo(1500) },
  { id: 'mod_6', action: 'timeout', targetId: '300000000000000005', targetTag: 'sample_user_05', moderatorTag: 'Anti-Spam (auto)', reason: 'Message burst: 9 messages / 4s', durationMinutes: 10, createdAt: minutesAgo(2100) },
  { id: 'mod_7', action: 'unban', targetId: '300000000000000006', targetTag: 'sample_user_06', moderatorTag: 'sample_mod_b', reason: 'Appeal accepted', createdAt: minutesAgo(3200) },
  { id: 'mod_8', action: 'warn', targetId: '300000000000000007', targetTag: 'sample_user_07', moderatorTag: 'sample_mod_a', reason: 'NSFW content outside designated channel', createdAt: minutesAgo(4400) },
  { id: 'mod_9', action: 'ban', targetId: '300000000000000008', targetTag: 'sample_user_08', moderatorTag: 'sample_mod_c', reason: 'Compromised account posting phishing links', createdAt: minutesAgo(6000) },
  { id: 'mod_10', action: 'timeout', targetId: '300000000000000009', targetTag: 'sample_user_09', moderatorTag: 'sample_mod_b', reason: 'Toxicity in voice chat', durationMinutes: 1440, createdAt: minutesAgo(8100) },
  { id: 'mod_11', action: 'warn', targetId: '300000000000000010', targetTag: 'sample_user_10', moderatorTag: 'sample_mod_a', reason: 'Impersonating staff', createdAt: minutesAgo(9800) },
  { id: 'mod_12', action: 'kick', targetId: '300000000000000011', targetTag: 'sample_user_11', moderatorTag: 'sample_mod_c', reason: 'Alt account of banned member', createdAt: minutesAgo(12000) },
]

const SAMPLE_AUDIT: AuditEvent[] = [
  { id: 'aud_1', category: 'security', severity: 'warning', actor: 'Anti-Spam', message: 'Mention threshold triggered in #general (sample)', createdAt: minutesAgo(18) },
  { id: 'aud_2', category: 'config', severity: 'info', actor: 'Demo Admin', message: 'Demo workspace initialised', createdAt: minutesAgo(60) },
  { id: 'aud_3', category: 'tickets', severity: 'info', actor: 'Demo Admin', message: 'Ticket category "Ban Appeals" created', createdAt: minutesAgo(140) },
  { id: 'aud_4', category: 'moderation', severity: 'critical', actor: 'sample_mod_a', message: 'Ban issued to sample_user_03', createdAt: minutesAgo(380) },
  { id: 'aud_5', category: 'system', severity: 'info', actor: 'System', message: 'Bot connection not configured — running in demo mode', createdAt: minutesAgo(400) },
  { id: 'aud_6', category: 'security', severity: 'critical', actor: 'Link Filter', message: 'Phishing domain blocked (sample)', createdAt: minutesAgo(6000) },
]

export function createDemoSeed(): ResourceMap {
  const general = createTicketCategory({
    name: 'General Support',
    description: 'Questions about the server, roles, or anything else.',
    icon: 'LifeBuoy',
    staffRoleIds: ['200000000000000003'],
    destinationCategoryId: '100000000000000004',
    questions: [createQuestion('long', { label: 'How can we help?', maxLength: 1000 })],
  })
  const technical = createTicketCategory({
    name: 'Technical Support',
    description: 'Bugs, connection problems, and technical issues.',
    icon: 'Wrench',
    staffRoleIds: ['200000000000000003'],
    destinationCategoryId: '100000000000000004',
    priority: 'high',
    questions: [
      createQuestion('dropdown', { label: 'Platform', options: ['PC', 'Console', 'Mobile'] }),
      createQuestion('long', { label: 'Describe the issue', placeholder: 'Steps to reproduce, error messages...' }),
    ],
  })
  const reports = createTicketCategory({
    name: 'Player Reports',
    description: 'Report a member for breaking the rules.',
    icon: 'Flag',
    staffRoleIds: ['200000000000000002'],
    destinationCategoryId: '100000000000000004',
    priority: 'high',
    questions: [
      createQuestion('short', { label: 'User ID of the member', placeholder: '17–20 digit Discord ID', maxLength: 20 }),
      createQuestion('long', { label: 'What happened?' }),
    ],
  })
  const appeals = createTicketCategory({
    name: 'Ban Appeals',
    description: 'Appeal a moderation decision.',
    icon: 'Scale',
    staffRoleIds: ['200000000000000001'],
    destinationCategoryId: '100000000000000004',
    questions: [createQuestion('long', { label: 'Why should the decision be reconsidered?' })],
  })
  const partnerships = createTicketCategory({
    name: 'Partnerships',
    description: 'Collaboration and partnership enquiries.',
    icon: 'Handshake',
    staffRoleIds: ['200000000000000001'],
    destinationCategoryId: '100000000000000004',
    priority: 'low',
    enabled: false,
  })

  const categories = [general, technical, reports, appeals, partnerships]

  const panel = createTicketPanel({
    name: 'Main Support Panel',
    channelId: '100000000000000002',
  })
  panel.message.buttons = [
    createButton({ label: 'General Support', style: 'primary', categoryId: general.id }),
    createButton({ label: 'Technical', style: 'secondary', categoryId: technical.id }),
    createButton({ label: 'Report a Player', style: 'danger', categoryId: reports.id }),
  ]

  return {
    ticketPanels: [panel],
    ticketCategories: categories,
    ticketSettings: { ...DEFAULT_TICKET_SETTINGS, supportRoleIds: ['200000000000000003'], logChannelId: '100000000000000003' },
    applicationForms: [createApplicationForm({ submissionChannelId: '100000000000000013', interviewChannelId: '100000000000000015' })],
    announcements: [
      createAnnouncement({ name: 'Weekly update', channelId: '100000000000000007' }),
      createAnnouncement({
        name: 'Maintenance notice',
        kind: 'template',
        channelId: '100000000000000007',
        message: {
          content: '',
          buttons: [],
          embeds: [
            createEmbed({
              title: 'Scheduled maintenance',
              description: 'Services will be unavailable on **{date}** from **{start}** to **{end}** (UTC).',
              color: '#F5A524',
              timestamp: true,
            }),
          ],
        },
      }),
    ],
    antiSpam: DEFAULT_ANTI_SPAM,
    staffPermissions: [
      { roleId: '200000000000000001', canWarn: true, canTimeout: true, canKick: true, canBan: true, canManageConfig: true },
      { roleId: '200000000000000002', canWarn: true, canTimeout: true, canKick: true, canBan: false, canManageConfig: false },
      { roleId: '200000000000000004', canWarn: true, canTimeout: false, canKick: false, canBan: false, canManageConfig: false },
    ],
    moderationRecords: SAMPLE_RECORDS,
    auditEvents: SAMPLE_AUDIT,
    streamFeeds: [createFeed({ platform: 'twitch', handle: 'example_streamer', channelId: '100000000000000011' })],
    videoFeeds: [
      createFeed({
        platform: 'youtube',
        handle: '@example-channel',
        channelId: '100000000000000011',
        message: 'New upload from {channel}: {title}\n{url}',
      }),
    ],
    modules: {
      welcome: true,
      tickets: true,
      applications: true,
      announcements: true,
      suggestions: false,
      streams: true,
      videos: true,
      scheduled: false,
      moderation: true,
      antispam: true,
      scanner: true,
      logs: true,
    },
    welcome: { ...DEFAULT_WELCOME, channelId: '100000000000000009' },
    suggestions: DEFAULT_SUGGESTIONS,
    scheduled: [
      createScheduled({
        name: 'Friday event reminder',
        channelId: '100000000000000007',
        content: 'Community game night starts in one hour. See you there!',
      }),
    ],
    general: DEFAULT_GENERAL,
  }
}
