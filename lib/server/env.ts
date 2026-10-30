import 'server-only'
import { MIN_SESSION_SECRET_LENGTH, type OAuthConfigIssue, validateOAuthEnv } from '@/lib/oauth-config-validation'

/*
 * Server-side configuration. Every getter returns null instead of throwing
 * so routes and pages degrade to a "not configured" state rather than
 * crashing during static generation when a variable is absent.
 */

export interface DiscordOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

function read(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : null
}

function validate() {
  return validateOAuthEnv({
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI,
    SESSION_SECRET: process.env.SESSION_SECRET,
  })
}

/** Variable names and problems only (never values); safe to render publicly. */
export function getOAuthConfigIssues(): OAuthConfigIssue[] {
  return validate().issues
}

export function getDiscordOAuthConfig(): DiscordOAuthConfig | null {
  const result = validate()
  if (!result.ok) return null
  const { clientId, clientSecret, redirectUri } = result.config
  return { clientId, clientSecret, redirectUri }
}

export function getDiscordClientId() {
  const clientId = read('DISCORD_CLIENT_ID')
  return clientId && /^\d{17,20}$/.test(clientId) ? clientId : null
}

export function getSessionSecret() {
  const secret = read('SESSION_SECRET')
  return secret && secret.length >= MIN_SESSION_SECRET_LENGTH ? secret : null
}

/** Optional. Only used server-side to check which guilds the bot has joined. */
export function getBotToken() {
  return read('DISCORD_BOT_TOKEN')
}

const DEFAULT_BOT_PERMISSIONS = '1099780189206'

export function getBotPermissions() {
  const value = read('DISCORD_BOT_PERMISSIONS')
  if (value && /^\d{1,20}$/.test(value)) return value
  if (value) console.error('[env] DISCORD_BOT_PERMISSIONS must be a numeric permission bitfield; using the default.')
  return DEFAULT_BOT_PERMISSIONS
}

export function isOAuthReady() {
  return getDiscordOAuthConfig() !== null && getSessionSecret() !== null
}
