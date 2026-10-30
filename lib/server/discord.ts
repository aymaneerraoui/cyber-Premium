import 'server-only'
import type { SessionUser } from '@/lib/auth-types'
import { userAvatarUrl } from '@/lib/discord-permissions'
import type { DiscordOAuthConfig } from './env'

const API = 'https://discord.com/api/v10'
const TIMEOUT_MS = 8_000

/**
 * Carries only status, path, and Discord's OAuth error code/description —
 * never request bodies or tokens — so it is safe to log.
 */
export class DiscordApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly retryAfterSeconds?: number,
    readonly oauthError?: string,
    readonly oauthErrorDescription?: string,
  ) {
    super(`Discord API ${status} on ${path}${oauthError ? ` (${oauthError}${oauthErrorDescription ? `: ${oauthErrorDescription}` : ''})` : ''}`)
    this.name = 'DiscordApiError'
  }
}

async function readOAuthError(res: Response) {
  const body: unknown = await res.json().catch(() => null)
  if (!body || typeof body !== 'object') return {}
  const { error, error_description } = body as { error?: unknown; error_description?: unknown }
  return {
    error: typeof error === 'string' ? error.slice(0, 64) : undefined,
    description: typeof error_description === 'string' ? error_description.slice(0, 160) : undefined,
  }
}

async function discordFetch<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, { ...init, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (err) {
    const reason = err instanceof Error ? err.name : 'unknown'
    throw new DiscordApiError(0, `${path} (${reason})`)
  }
  if (!res.ok) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const oauth = path.startsWith('/oauth2/') ? await readOAuthError(res) : {}
    throw new DiscordApiError(res.status, path, Number.isFinite(retryAfter) ? Math.ceil(retryAfter) : undefined, oauth.error, oauth.description)
  }
  return (await res.json()) as T
}

export interface DiscordTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export function exchangeCode(code: string, config: DiscordOAuthConfig) {
  return discordFetch<DiscordTokenResponse>('/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })
}

export async function revokeToken(token: string, config: DiscordOAuthConfig) {
  await fetch(`${API}/oauth2/token/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token, token_type_hint: 'access_token', client_id: config.clientId, client_secret: config.clientSecret }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
}

interface DiscordUser {
  id: string
  username: string
  global_name: string | null
  avatar: string | null
}

export async function fetchCurrentUser(accessToken: string): Promise<SessionUser> {
  const user = await discordFetch<DiscordUser>('/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } })
  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    avatarUrl: userAvatarUrl(user.id, user.avatar),
  }
}

export interface DiscordPartialGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}


const guildCache = new Map<string, {
  data: DiscordPartialGuild[]
  expiresAt: number
}>()

const guildRequests = new Map<
  string,
  Promise<DiscordPartialGuild[]>
>()

const GUILD_CACHE_MS = 60_000

export async function fetchUserGuilds(
  accessToken: string
): Promise<DiscordPartialGuild[]> {
  const now = Date.now()

  const cached = guildCache.get(accessToken)

  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const pending = guildRequests.get(accessToken)

  if (pending) {
    return pending
  }

  const request = discordFetch<DiscordPartialGuild[]>(
    '/users/@me/guilds',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  ).then(data => {
    guildCache.set(accessToken, {
      data,
      expiresAt: Date.now() + GUILD_CACHE_MS
    })

    return data
  })

  guildRequests.set(accessToken, request)

  try {
    return await request
  } finally {
    guildRequests.delete(accessToken)
  }
}


const BOT_GUILD_PAGE = 200
const BOT_GUILD_MAX_PAGES = 5

/** IDs of guilds the bot has joined (up to 1,000). Requires DISCORD_BOT_TOKEN. */
export async function fetchBotGuildIds(botToken: string): Promise<Set<string>> {
  const ids = new Set<string>()
  let after: string | undefined
  for (let page = 0; page < BOT_GUILD_MAX_PAGES; page++) {
    const query = new URLSearchParams({ limit: String(BOT_GUILD_PAGE) })
    if (after) query.set('after', after)
    const guilds = await discordFetch<{ id: string }[]>(`/users/@me/guilds?${query}`, { headers: { Authorization: `Bot ${botToken}` } })
    for (const g of guilds) ids.add(g.id)
    if (guilds.length < BOT_GUILD_PAGE) break
    after = guilds[guilds.length - 1].id
  }
  return ids
}
