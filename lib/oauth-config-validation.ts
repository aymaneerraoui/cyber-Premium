/**
 * Pure validation for the Discord OAuth2 server configuration.
 * Reports variable names and problems only — never values — so the result
 * is safe to show on the login page and in the status endpoint.
 */

export const DISCORD_CALLBACK_PATH = '/api/auth/discord/callback'
export const MIN_SESSION_SECRET_LENGTH = 32

export type OAuthVariable = 'DISCORD_CLIENT_ID' | 'DISCORD_CLIENT_SECRET' | 'DISCORD_REDIRECT_URI' | 'SESSION_SECRET'

export interface OAuthConfigIssue {
  variable: OAuthVariable
  problem: string
}

export interface ValidatedOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  sessionSecret: string
}

export type OAuthValidationResult =
  | { ok: true; config: ValidatedOAuthConfig; issues: [] }
  | { ok: false; config: null; issues: OAuthConfigIssue[] }

const SNOWFLAKE = /^\d{17,20}$/
const CLIENT_SECRET_CHARS = /^[A-Za-z0-9_-]+$/
const PLACEHOLDER = /replace-with|your[-_ ]|\*{3,}|^<.*>$|^\(.*\)$/i

/** Trims whitespace and one pair of wrapping quotes, a common copy/paste mistake in dashboards. */
function clean(value: string | undefined) {
  let trimmed = value?.trim() ?? ''
  if (trimmed.length >= 2 && /^(["'`]).*\1$/.test(trimmed)) trimmed = trimmed.slice(1, -1).trim()
  return trimmed ? trimmed : null
}

const placeholderProblem = 'still contains placeholder text. Replace it with the real value.'

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function validateOAuthEnv(env: Record<string, string | undefined>): OAuthValidationResult {
  const issues: OAuthConfigIssue[] = []
  const clientId = clean(env.DISCORD_CLIENT_ID)
  const clientSecret = clean(env.DISCORD_CLIENT_SECRET)
  const redirectUri = clean(env.DISCORD_REDIRECT_URI)
  const sessionSecret = clean(env.SESSION_SECRET)

  if (!clientId) {
    issues.push({ variable: 'DISCORD_CLIENT_ID', problem: 'is not set.' })
  } else if (PLACEHOLDER.test(clientId)) {
    issues.push({ variable: 'DISCORD_CLIENT_ID', problem: placeholderProblem })
  } else if (!SNOWFLAKE.test(clientId)) {
    issues.push({ variable: 'DISCORD_CLIENT_ID', problem: 'must be the numeric Application ID (17–20 digits).' })
  }

  if (!clientSecret) {
    issues.push({ variable: 'DISCORD_CLIENT_SECRET', problem: 'is not set.' })
  } else if (PLACEHOLDER.test(clientSecret)) {
    issues.push({ variable: 'DISCORD_CLIENT_SECRET', problem: placeholderProblem })
  } else if (!CLIENT_SECRET_CHARS.test(clientSecret)) {
    issues.push({
      variable: 'DISCORD_CLIENT_SECRET',
      problem: 'contains characters a Discord client secret never has (spaces, brackets, or symbols). Paste only the secret itself.',
    })
  } else if (SNOWFLAKE.test(clientSecret) || clientSecret === clientId) {
    issues.push({
      variable: 'DISCORD_CLIENT_SECRET',
      problem: 'looks like an ID, not a secret. Use OAuth2 → Client Secret → Reset Secret in the Developer Portal.',
    })
  } else if (clientSecret.length < 16) {
    issues.push({ variable: 'DISCORD_CLIENT_SECRET', problem: 'is too short to be a Discord client secret.' })
  }

  if (!redirectUri) {
    issues.push({ variable: 'DISCORD_REDIRECT_URI', problem: 'is not set.' })
  } else {
    let url: URL | null = null
    try {
      url = new URL(redirectUri)
    } catch {
      issues.push({ variable: 'DISCORD_REDIRECT_URI', problem: 'must be a full URL starting with https://.' })
    }
    if (url) {
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalHost(url.hostname))) {
        issues.push({ variable: 'DISCORD_REDIRECT_URI', problem: 'must use https:// (http:// is only allowed for localhost).' })
      }
      if (url.pathname !== DISCORD_CALLBACK_PATH) {
        issues.push({ variable: 'DISCORD_REDIRECT_URI', problem: `must end with ${DISCORD_CALLBACK_PATH} (no trailing slash).` })
      }
      if (url.search || url.hash) {
        issues.push({ variable: 'DISCORD_REDIRECT_URI', problem: 'must not contain ? or # parts.' })
      }
    }
  }

  if (!sessionSecret) {
    issues.push({ variable: 'SESSION_SECRET', problem: 'is not set.' })
  } else if (PLACEHOLDER.test(sessionSecret)) {
    issues.push({ variable: 'SESSION_SECRET', problem: placeholderProblem })
  } else if (sessionSecret.length < MIN_SESSION_SECRET_LENGTH) {
    issues.push({ variable: 'SESSION_SECRET', problem: `must be at least ${MIN_SESSION_SECRET_LENGTH} characters.` })
  }

  if (issues.length > 0 || !clientId || !clientSecret || !redirectUri || !sessionSecret) {
    return { ok: false, config: null, issues }
  }
  return { ok: true, config: { clientId, clientSecret, redirectUri, sessionSecret }, issues: [] }
}
