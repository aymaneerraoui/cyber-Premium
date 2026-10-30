import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createState, safeEqual, seal, unseal } from '../lib/server/session-crypto.ts'

const SECRET = 'a'.repeat(40)

test('seal/unseal round-trips the payload', () => {
  const payload = { user: { id: '123456789012345678' }, accessToken: 'tok', expiresAt: 1 }
  assert.deepEqual(unseal(seal(payload, SECRET), SECRET), payload)
})

test('sealed token does not contain the plaintext access token', () => {
  const token = seal({ accessToken: 'super-secret-token' }, SECRET)
  assert.ok(!token.includes('super-secret-token'))
  assert.ok(!Buffer.from(token.split('.')[1], 'base64url').toString('utf8').includes('super-secret-token'))
})

test('unseal rejects a token sealed with another secret', () => {
  assert.equal(unseal(seal({ a: 1 }, SECRET), 'b'.repeat(40)), null)
})

test('unseal rejects tampered and malformed tokens', () => {
  const token = seal({ a: 1 }, SECRET)
  const body = Buffer.from(token.split('.')[1], 'base64url')
  body[body.length - 1] ^= 0xff
  assert.equal(unseal(`v1.${body.toString('base64url')}`, SECRET), null)
  assert.equal(unseal('garbage', SECRET), null)
  assert.equal(unseal('v1.', SECRET), null)
  assert.equal(unseal('v2.' + token.split('.')[1], SECRET), null)
})

test('createState is random and URL-safe; safeEqual compares exactly', () => {
  const a = createState()
  const b = createState()
  assert.notEqual(a, b)
  assert.match(a, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(safeEqual(a, a), true)
  assert.equal(safeEqual(a, b), false)
  assert.equal(safeEqual(a, a.slice(1)), false)
})
