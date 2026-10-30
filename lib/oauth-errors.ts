/**
 * Maps a failed Discord token exchange to a login-page notice. Uses only the
 * HTTP status and Discord's OAuth error code/description, which never contain
 * secrets. Kept framework-free so it can be unit tested with `node --test`.
 */

export type OAuthFailureNotice = 'oauth-client' | 'oauth-redirect' | 'oauth-expired' | 'rate-limited' | 'oauth-failed'

export function classifyTokenExchangeError(status: number, oauthError?: string, description?: string): OAuthFailureNotice {
  if (status === 429) return 'rate-limited'
  if (oauthError === 'invalid_client' || oauthError === 'unauthorized_client' || status === 401) return 'oauth-client'
  if (oauthError === 'invalid_grant' || oauthError === 'invalid_request') {
    if (description && /redirect_uri/i.test(description)) return 'oauth-redirect'
    return 'oauth-expired'
  }
  return 'oauth-failed'
}
