import 'server-only'
import { getDiscordClientId, isOAuthReady } from '@/lib/server/env'

export interface IntegrationStatus {
  discordOAuth: boolean
  botInvite: boolean
  backendApi: boolean
}

/** Reports which integrations are configured. Only booleans leave the server. */
export function getIntegrationStatus(): IntegrationStatus {
  return {
    discordOAuth: isOAuthReady(),
    botInvite: Boolean(getDiscordClientId()),
    backendApi: Boolean(process.env.NEXT_PUBLIC_CYBER_API_URL),
  }
}
