/*
 * Discord permission helpers. Pure functions with no imports so they can be
 * unit tested directly with `node --test`.
 */

export const PERMISSIONS = {
  ADMINISTRATOR: BigInt(1) << BigInt(3),
  MANAGE_GUILD: BigInt(1) << BigInt(5),
} as const

const SNOWFLAKE = /^\d{17,20}$/

export function isSnowflakeId(value: unknown): value is string {
  return typeof value === 'string' && SNOWFLAKE.test(value)
}

export function parsePermissions(value: unknown): bigint {
  if (typeof value !== 'string' || !/^\d{1,20}$/.test(value)) return BigInt(0)
  return BigInt(value)
}

/**
 * A user may manage a guild in CYBER only if Discord reports them as the
 * owner, or their computed permissions include Administrator or Manage Server.
 * The input must come from Discord's API on the server, never from the browser.
 */
export function canManageGuild(guild: { owner?: boolean; permissions?: unknown }): boolean {
  if (guild.owner === true) return true
  const perms = parsePermissions(guild.permissions)
  return (perms & PERMISSIONS.ADMINISTRATOR) !== BigInt(0) || (perms & PERMISSIONS.MANAGE_GUILD) !== BigInt(0)
}

export function guildIconUrl(guildId: string, icon: string | null | undefined) {
  if (!icon || !/^(a_)?[a-f0-9]{32}$/.test(icon)) return null
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${icon.startsWith('a_') ? 'gif' : 'png'}?size=128`
}

export function userAvatarUrl(userId: string, avatar: string | null | undefined) {
  if (!avatar || !/^(a_)?[a-f0-9]{32}$/.test(avatar)) return null
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
}
