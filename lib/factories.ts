import type {
  AntiSpamConfig,
  ApplicationForm,
  ApplicationStage,
  Announcement,
  EmbedConfig,
  EmbedField,
  MessageButton,
  MessageConfig,
  NotificationFeed,
  Question,
  QuestionType,
  TicketCategory,
  TicketPanel,
  TicketSettings,
} from '@/lib/types/config'
import type { GeneralSettings, ScheduledMessage, SuggestionsConfig, WelcomeConfig } from '@/lib/types/modules'

export function uid(prefix = 'id') {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

export const BRAND_COLOR = '#FFD400'

export function createEmbed(partial: Partial<EmbedConfig> = {}): EmbedConfig {
  return {
    id: uid('emb'),
    title: '',
    description: '',
    url: '',
    color: BRAND_COLOR,
    authorName: '',
    authorIcon: null,
    thumbnail: null,
    image: null,
    footerText: '',
    footerIcon: null,
    timestamp: false,
    fields: [],
    ...partial,
  }
}

export function createField(partial: Partial<EmbedField> = {}): EmbedField {
  return { id: uid('fld'), name: 'Field name', value: 'Field value', inline: true, ...partial }
}

export function createButton(partial: Partial<MessageButton> = {}): MessageButton {
  return { id: uid('btn'), label: 'Open Ticket', emoji: '', style: 'primary', ...partial }
}

export function createMessage(partial: Partial<MessageConfig> = {}): MessageConfig {
  return { content: '', embeds: [createEmbed()], buttons: [], ...partial }
}

export function createQuestion(type: QuestionType = 'short', partial: Partial<Question> = {}): Question {
  const base: Question = {
    id: uid('q'),
    type,
    label: 'New question',
    description: '',
    placeholder: '',
    required: true,
    options: type === 'dropdown' || type === 'multiple' ? ['Option A', 'Option B'] : [],
  }
  if (type === 'short') Object.assign(base, { minLength: 0, maxLength: 100 })
  if (type === 'long') Object.assign(base, { minLength: 0, maxLength: 1000 })
  if (type === 'multiple') Object.assign(base, { maxSelections: 2 })
  return { ...base, ...partial }
}

export function createTicketCategory(partial: Partial<TicketCategory> = {}): TicketCategory {
  return {
    id: uid('cat'),
    name: 'New Category',
    description: '',
    icon: 'LifeBuoy',
    image: null,
    staffRoleIds: [],
    questions: [],
    destinationCategoryId: null,
    priority: 'normal',
    enabled: true,
    ...partial,
  }
}

export function createTicketPanel(partial: Partial<TicketPanel> = {}): TicketPanel {
  return {
    id: uid('pnl'),
    name: 'Support Panel',
    channelId: null,
    message: createMessage({
      embeds: [
        createEmbed({
          title: 'Need assistance?',
          description:
            'Select the category that best matches your request. A private channel will be opened with our support team.',
          footerText: 'CYBER Support System',
        }),
      ],
      buttons: [createButton({ label: 'Open Ticket' })],
    }),
    state: 'draft',
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export const DEFAULT_TICKET_SETTINGS: TicketSettings = {
  namingFormat: 'ticket-{number}',
  privateTickets: true,
  supportRoleIds: [],
  claimButton: true,
  closeButton: true,
  reopenButton: true,
  transcripts: 'html',
  transcriptDm: false,
  logChannelId: null,
  closeConfirmation: true,
  openingMessage: 'Hello {user}, thank you for contacting support. A team member will be with you shortly.',
  closingMessage: 'This ticket has been closed by {staff}. A transcript has been saved.',
  duplicatePolicy: 'one-per-category',
  staffNotification: 'ping-role',
  autoCloseHours: 48,
}

export function defaultStages(): ApplicationStage[] {
  return [
    { id: 'submitted', label: 'Application Submitted', enabled: true, locked: true },
    { id: 'review', label: 'Under Review', enabled: true, locked: false },
    { id: 'interview', label: 'Interview Required', enabled: true, locked: false },
    { id: 'decision', label: 'Accepted or Rejected', enabled: true, locked: true },
  ]
}

export function createApplicationForm(partial: Partial<ApplicationForm> = {}): ApplicationForm {
  return {
    id: uid('app'),
    title: 'Staff Application',
    description: 'Apply to join the moderation team. Answer every question honestly and in detail.',
    icon: 'ShieldCheck',
    image: null,
    questions: [
      createQuestion('short', { label: 'How old are you?', maxLength: 3, placeholder: 'e.g. 19' }),
      createQuestion('long', { label: 'Why do you want to join the team?', maxLength: 1500 }),
      createQuestion('dropdown', {
        label: 'Weekly availability',
        options: ['Less than 5 hours', '5–10 hours', '10–20 hours', '20+ hours'],
      }),
    ],
    maxQuestions: 10,
    submissionChannelId: null,
    reviewerRoleIds: [],
    acceptTemplate: 'Congratulations {user}! Your application for {form} has been accepted.',
    rejectTemplate: 'Hello {user}, thank you for applying. Unfortunately your application was not accepted at this time.',
    stages: defaultStages(),
    interviewChannelId: null,
    acceptRoleIds: [],
    rejectRoleIds: [],
    enabled: true,
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export function createAnnouncement(partial: Partial<Announcement> = {}): Announcement {
  return {
    id: uid('ann'),
    name: 'Untitled announcement',
    channelId: null,
    mention: 'none',
    mentionRoleIds: [],
    message: createMessage({
      embeds: [createEmbed({ title: 'Announcement', description: 'Write your announcement here.', timestamp: true })],
    }),
    kind: 'draft',
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export const DEFAULT_ANTI_SPAM: AntiSpamConfig = {
  enabled: true,
  messageBurst: { count: 6, seconds: 5 },
  mentionThreshold: 5,
  duplicateThreshold: 3,
  linkFilter: 'allowlist',
  allowedDomains: ['youtube.com', 'twitch.tv', 'github.com'],
  blockInvites: true,
  action: 'timeout',
  timeoutMinutes: 10,
  ignoredRoleIds: [],
  ignoredChannelIds: [],
}

export function createFeed(partial: Partial<NotificationFeed> = {}): NotificationFeed {
  return {
    id: uid('feed'),
    platform: 'twitch',
    handle: '',
    channelId: null,
    mention: 'none',
    message: '{streamer} is now live: {title}\n{url}',
    enabled: true,
    ...partial,
  }
}

export const DEFAULT_WELCOME: WelcomeConfig = {
  enabled: true,
  channelId: null,
  message: createMessage({
    content: 'Welcome {user}!',
    embeds: [
      createEmbed({
        title: 'Welcome to {server}',
        description: 'You are member #{memberCount}. Read the rules and enjoy your stay.',
      }),
    ],
  }),
  dmEnabled: false,
  dmText: 'Thanks for joining {server}!',
  autoRoleIds: [],
  leaveEnabled: false,
  leaveText: '{username} has left the server.',
}

export const DEFAULT_SUGGESTIONS: SuggestionsConfig = {
  enabled: false,
  channelId: null,
  reviewChannelId: null,
  anonymous: false,
  threads: true,
  upvoteEmoji: '▲',
  downvoteEmoji: '▼',
  cooldownMinutes: 10,
}

export function createScheduled(partial: Partial<ScheduledMessage> = {}): ScheduledMessage {
  return {
    id: uid('sch'),
    name: 'New scheduled message',
    channelId: null,
    content: '',
    cadence: 'weekly',
    time: '18:00',
    weekday: 5,
    enabled: true,
    ...partial,
  }
}

export const DEFAULT_GENERAL: GeneralSettings = {
  language: 'en',
  timezone: 'UTC',
  embedColor: BRAND_COLOR,
  managerRoleIds: [],
  commandPrefix: '!',
  slashCommands: true,
  deleteCommandMessages: false,
}

/** Utility for immutable array reordering. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
