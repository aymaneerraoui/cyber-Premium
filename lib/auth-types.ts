/** Shapes shared by the auth API routes and the client hooks. No secrets live here. */

export interface SessionUser {
  id: string
  username: string
  globalName: string | null
  avatarUrl: string | null
}

export interface SessionResponse {
  user: SessionUser | null
  oauthConfigured: boolean
}

export interface ManagedGuild {
  id: string
  name: string
  iconUrl: string | null
  owner: boolean
  /** null when DISCORD_BOT_TOKEN is not configured, so presence cannot be checked. */
  botInstalled: boolean | null
}

export interface ManagedGuildsResponse {
  guilds: ManagedGuild[]
  botStatusKnown: boolean
}
