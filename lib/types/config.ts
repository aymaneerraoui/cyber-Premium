/**
 * Typed configuration models shared by the dashboard UI and the
 * future CYBER backend / Discord bot. Field names intentionally mirror
 * Discord API concepts so the bot can map them without translation.
 */

export type Snowflake = string

export type ConnectionMode = 'demo' | 'live'

export interface ServerSummary {
  id: string
  name: string
  iconUrl: string | null
  memberCount: number | null
  botInstalled: boolean
  mode: ConnectionMode
}

export type ChannelKind = 'text' | 'voice' | 'category' | 'announcement'

export interface DiscordChannel {
  id: Snowflake
  name: string
  kind: ChannelKind
  parentId?: Snowflake | null
}

export interface DiscordRole {
  id: Snowflake
  name: string
  color: string
}

/* ------------------------------------------------------------------ */
/* Embeds & components                                                 */
/* ------------------------------------------------------------------ */

/** Images are stored as object/data URLs in demo mode and as uploaded asset URLs in live mode. */
export interface MediaAsset {
  url: string
  name: string
  size: number
  type: string
}

export interface EmbedField {
  id: string
  name: string
  value: string
  inline: boolean
}

export interface EmbedConfig {
  id: string
  title: string
  description: string
  url: string
  color: string
  authorName: string
  authorIcon: MediaAsset | null
  thumbnail: MediaAsset | null
  image: MediaAsset | null
  footerText: string
  footerIcon: MediaAsset | null
  timestamp: boolean
  fields: EmbedField[]
}

export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'link'

export interface MessageButton {
  id: string
  label: string
  emoji: string
  style: ButtonStyle
  /** For link buttons. */
  url?: string
  /** For ticket panels: which category this button opens. */
  categoryId?: string
}

export interface MessageConfig {
  content: string
  embeds: EmbedConfig[]
  buttons: MessageButton[]
}

/* ------------------------------------------------------------------ */
/* Questions (shared by tickets & applications)                        */
/* ------------------------------------------------------------------ */

export type QuestionType = 'short' | 'long' | 'dropdown' | 'multiple'

export interface Question {
  id: string
  type: QuestionType
  label: string
  description: string
  placeholder: string
  required: boolean
  minLength?: number
  maxLength?: number
  options: string[]
  /** Max selections for multiple-choice. */
  maxSelections?: number
}

/* ------------------------------------------------------------------ */
/* Tickets                                                             */
/* ------------------------------------------------------------------ */

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TicketCategory {
  id: string
  name: string
  description: string
  icon: string
  image: MediaAsset | null
  staffRoleIds: Snowflake[]
  questions: Question[]
  destinationCategoryId: Snowflake | null
  priority: TicketPriority
  enabled: boolean
}

export type PublishState = 'draft' | 'preview' | 'published'

export interface TicketPanel {
  id: string
  name: string
  channelId: Snowflake | null
  message: MessageConfig
  state: PublishState
  updatedAt: string
}

export interface TicketSettings {
  namingFormat: string
  privateTickets: boolean
  supportRoleIds: Snowflake[]
  claimButton: boolean
  closeButton: boolean
  reopenButton: boolean
  transcripts: 'off' | 'html' | 'text'
  transcriptDm: boolean
  logChannelId: Snowflake | null
  closeConfirmation: boolean
  openingMessage: string
  closingMessage: string
  duplicatePolicy: 'allow' | 'one-per-category' | 'one-total'
  staffNotification: 'none' | 'ping-role' | 'dm-online'
  autoCloseHours: number
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export type ApplicationStageId = 'submitted' | 'review' | 'interview' | 'decision'

export interface ApplicationStage {
  id: ApplicationStageId
  label: string
  enabled: boolean
  locked: boolean
}

export interface ApplicationForm {
  id: string
  title: string
  description: string
  icon: string
  image: MediaAsset | null
  questions: Question[]
  maxQuestions: number
  submissionChannelId: Snowflake | null
  reviewerRoleIds: Snowflake[]
  acceptTemplate: string
  rejectTemplate: string
  stages: ApplicationStage[]
  interviewChannelId: Snowflake | null
  acceptRoleIds: Snowflake[]
  rejectRoleIds: Snowflake[]
  enabled: boolean
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type MentionMode = 'none' | 'everyone' | 'here' | 'roles'

export interface Announcement {
  id: string
  name: string
  channelId: Snowflake | null
  mention: MentionMode
  mentionRoleIds: Snowflake[]
  message: MessageConfig
  kind: 'draft' | 'template'
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/* Security & moderation                                               */
/* ------------------------------------------------------------------ */

export type ModerationAction = 'ban' | 'timeout' | 'warn' | 'kick' | 'unban'

export interface ModerationRecord {
  id: string
  action: ModerationAction
  targetId: Snowflake
  targetTag: string
  moderatorTag: string
  reason: string
  durationMinutes?: number
  createdAt: string
}

export type AuditSeverity = 'info' | 'warning' | 'critical'

export interface AuditEvent {
  id: string
  category: 'config' | 'moderation' | 'security' | 'tickets' | 'system'
  severity: AuditSeverity
  actor: string
  message: string
  createdAt: string
}

export interface AntiSpamConfig {
  enabled: boolean
  messageBurst: { count: number; seconds: number }
  mentionThreshold: number
  duplicateThreshold: number
  linkFilter: 'off' | 'block-all' | 'allowlist'
  allowedDomains: string[]
  blockInvites: boolean
  action: 'delete' | 'timeout' | 'kick' | 'ban'
  timeoutMinutes: number
  ignoredRoleIds: Snowflake[]
  ignoredChannelIds: Snowflake[]
}

export interface StaffPermission {
  roleId: Snowflake
  canWarn: boolean
  canTimeout: boolean
  canKick: boolean
  canBan: boolean
  canManageConfig: boolean
}

/* ------------------------------------------------------------------ */
/* Notifications & generic modules                                     */
/* ------------------------------------------------------------------ */

export type FeedPlatform = 'twitch' | 'youtube' | 'kick'

export interface NotificationFeed {
  id: string
  platform: FeedPlatform
  handle: string
  channelId: Snowflake | null
  mention: MentionMode
  message: string
  enabled: boolean
}

export interface ModuleState {
  id: string
  enabled: boolean
}

/* ------------------------------------------------------------------ */
/* Security scanner                                                    */
/* ------------------------------------------------------------------ */

export type ScanFindingSource = 'verified' | 'external' | 'unknown'

export interface ScanFinding {
  label: string
  value: string
  source: ScanFindingSource
  sourceName: string
}

export interface ScanResult {
  userId: Snowflake
  status: 'found' | 'not-found' | 'unavailable'
  findings: ScanFinding[]
  checkedAt: string
  notes: string[]
}
