import type { MessageConfig, Snowflake } from './config'

export interface WelcomeConfig {
  enabled: boolean
  channelId: Snowflake | null
  message: MessageConfig
  dmEnabled: boolean
  dmText: string
  autoRoleIds: Snowflake[]
  leaveEnabled: boolean
  leaveText: string
}

export interface SuggestionsConfig {
  enabled: boolean
  channelId: Snowflake | null
  reviewChannelId: Snowflake | null
  anonymous: boolean
  threads: boolean
  upvoteEmoji: string
  downvoteEmoji: string
  cooldownMinutes: number
}

export interface ScheduledMessage {
  id: string
  name: string
  channelId: Snowflake | null
  content: string
  cadence: 'once' | 'daily' | 'weekly' | 'monthly'
  time: string
  weekday: number
  enabled: boolean
}

export interface GeneralSettings {
  language: string
  timezone: string
  embedColor: string
  managerRoleIds: Snowflake[]
  commandPrefix: string
  slashCommands: boolean
  deleteCommandMessages: boolean
}

export interface ModuleToggleMap {
  [moduleId: string]: boolean
}
