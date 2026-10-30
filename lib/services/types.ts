import type {
  AntiSpamConfig,
  Announcement,
  ApplicationForm,
  AuditEvent,
  ConnectionMode,
  DiscordChannel,
  DiscordRole,
  MessageConfig,
  ModerationRecord,
  NotificationFeed,
  ScanResult,
  ServerSummary,
  Snowflake,
  StaffPermission,
  TicketCategory,
  TicketPanel,
  TicketSettings,
} from '@/lib/types/config'
import type {
  GeneralSettings,
  ModuleToggleMap,
  ScheduledMessage,
  SuggestionsConfig,
  WelcomeConfig,
} from '@/lib/types/modules'
import type { ValidationIssue } from '@/lib/validation/discord'

/** Every persisted, per-server configuration resource and its shape. */
export interface ResourceMap {
  ticketPanels: TicketPanel[]
  ticketCategories: TicketCategory[]
  ticketSettings: TicketSettings
  applicationForms: ApplicationForm[]
  announcements: Announcement[]
  antiSpam: AntiSpamConfig
  staffPermissions: StaffPermission[]
  moderationRecords: ModerationRecord[]
  auditEvents: AuditEvent[]
  streamFeeds: NotificationFeed[]
  videoFeeds: NotificationFeed[]
  modules: ModuleToggleMap
  welcome: WelcomeConfig
  suggestions: SuggestionsConfig
  scheduled: ScheduledMessage[]
  general: GeneralSettings
}

export type ResourceKey = keyof ResourceMap

export interface PublishRequest {
  kind: 'ticket-panel' | 'application-panel' | 'announcement'
  channelId: Snowflake | null
  message: MessageConfig
  sourceId: string
}

export interface PublishResult {
  /** True when the action did not reach Discord (demo mode). */
  simulated: boolean
  messageId: string | null
  channelId: Snowflake | null
  publishedAt: string
}

export interface TestReport {
  ok: boolean
  issues: ValidationIssue[]
  /** Checks that can only be confirmed by the live bot (permissions, channel access). */
  pendingBackendChecks: string[]
}

/**
 * The single boundary between the UI and data. The demo implementation
 * persists drafts in the browser; the HTTP implementation talks to the
 * CYBER API, which in turn drives the Discord bot.
 */
export interface CyberService {
  readonly mode: ConnectionMode
  listServers(): Promise<ServerSummary[]>
  getServer(serverId: string): Promise<ServerSummary | null>
  getChannels(serverId: string): Promise<DiscordChannel[]>
  getRoles(serverId: string): Promise<DiscordRole[]>
  getResource<K extends ResourceKey>(serverId: string, key: K): Promise<ResourceMap[K]>
  saveResource<K extends ResourceKey>(serverId: string, key: K, value: ResourceMap[K], summary?: string): Promise<ResourceMap[K]>
  publishMessage(serverId: string, request: PublishRequest): Promise<PublishResult>
  scanUser(serverId: string, userId: Snowflake): Promise<ScanResult>
  resetDemo?(serverId: string): Promise<void>
}
