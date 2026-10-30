import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canManageGuild, guildIconUrl, isSnowflakeId, parsePermissions } from '../lib/discord-permissions.ts'

test('owners can always manage', () => {
  assert.equal(canManageGuild({ owner: true, permissions: '0' }), true)
})

test('Administrator or Manage Server grants management', () => {
  assert.equal(canManageGuild({ owner: false, permissions: String(1 << 3) }), true)
  assert.equal(canManageGuild({ owner: false, permissions: String(1 << 5) }), true)
})

test('other permissions do not grant management', () => {
  const kickBanSend = String((1 << 1) | (1 << 2) | (1 << 11))
  assert.equal(canManageGuild({ owner: false, permissions: kickBanSend }), false)
  assert.equal(canManageGuild({ owner: false, permissions: '0' }), false)
})

test('malformed permission values are treated as no permissions', () => {
  assert.equal(parsePermissions('8; DROP'), BigInt(0))
  assert.equal(parsePermissions(8), BigInt(0))
  assert.equal(canManageGuild({ owner: 'true', permissions: 'abc' }), false)
})

test('high permission bits beyond 2^53 are parsed exactly', () => {
  const bits = (BigInt(1) << BigInt(50)) | (BigInt(1) << BigInt(5))
  assert.equal(canManageGuild({ owner: false, permissions: bits.toString() }), true)
})

test('snowflake and icon validation', () => {
  assert.equal(isSnowflakeId('123456789012345678'), true)
  assert.equal(isSnowflakeId('12345'), false)
  assert.equal(isSnowflakeId('123456789012345678&x=1'), false)
  assert.equal(guildIconUrl('1', null), null)
  assert.equal(guildIconUrl('1', '../evil'), null)
  assert.equal(guildIconUrl('1', 'a_' + 'f'.repeat(32)), `https://cdn.discordapp.com/icons/1/a_${'f'.repeat(32)}.gif?size=128`)
})
