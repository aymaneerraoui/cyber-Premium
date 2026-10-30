import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateOAuthEnv } from '../lib/oauth-config-validation.ts'

const valid = {
  DISCORD_CLIENT_ID: '1564766771402121428',
  DISCORD_CLIENT_SECRET: 'aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY',
  DISCORD_REDIRECT_URI: 'https://cyber-eta-ruby.vercel.app/api/auth/discord/callback',
  SESSION_SECRET: 'x'.repeat(44),
}

const variablesWithIssues = (env) => validateOAuthEnv(env).issues.map((i) => i.variable)

test('accepts a complete production configuration', () => {
  const result = validateOAuthEnv(valid)
  assert.equal(result.ok, true)
  assert.equal(result.config.redirectUri, valid.DISCORD_REDIRECT_URI)
})

test('reports every missing variable by name', () => {
  assert.deepEqual(variablesWithIssues({}), ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI', 'SESSION_SECRET'])
})

test('rejects a numeric ID pasted as the client secret', () => {
  assert.deepEqual(variablesWithIssues({ ...valid, DISCORD_CLIENT_SECRET: '1564766771402121428' }), ['DISCORD_CLIENT_SECRET'])
})

test('rejects a non-numeric client ID', () => {
  assert.deepEqual(variablesWithIssues({ ...valid, DISCORD_CLIENT_ID: 'my-app' }), ['DISCORD_CLIENT_ID'])
})

test('requires the exact callback path, https, and no query string', () => {
  for (const uri of [
    'https://cyber-eta-ruby.vercel.app/api/auth/discord/callback/',
    'https://cyber-eta-ruby.vercel.app/api/auth/callback',
    'https://cyber-eta-ruby.vercel.app',
    'http://cyber-eta-ruby.vercel.app/api/auth/discord/callback',
    'https://cyber-eta-ruby.vercel.app/api/auth/discord/callback?x=1',
    'cyber-eta-ruby.vercel.app/api/auth/discord/callback',
  ]) {
    assert.deepEqual(variablesWithIssues({ ...valid, DISCORD_REDIRECT_URI: uri }), ['DISCORD_REDIRECT_URI'], uri)
  }
})

test('allows http only for localhost development', () => {
  assert.equal(validateOAuthEnv({ ...valid, DISCORD_REDIRECT_URI: 'http://localhost:3000/api/auth/discord/callback' }).ok, true)
})

test('rejects a short session secret and trims whitespace', () => {
  assert.deepEqual(variablesWithIssues({ ...valid, SESSION_SECRET: 'short' }), ['SESSION_SECRET'])
  assert.equal(validateOAuthEnv({ ...valid, DISCORD_CLIENT_ID: `  ${valid.DISCORD_CLIENT_ID}\n` }).ok, true)
})

test('strips wrapping quotes pasted into the dashboard', () => {
  const result = validateOAuthEnv({ ...valid, DISCORD_CLIENT_ID: `"${valid.DISCORD_CLIENT_ID}"`, DISCORD_REDIRECT_URI: `'${valid.DISCORD_REDIRECT_URI}'` })
  assert.equal(result.ok, true)
  assert.equal(result.config.clientId, valid.DISCORD_CLIENT_ID)
})

test('rejects placeholder text left from .env.example or setup guides', () => {
  assert.deepEqual(variablesWithIssues({ ...valid, SESSION_SECRET: 'replace-with-at-least-32-random-characters' }), ['SESSION_SECRET'])
  assert.deepEqual(variablesWithIssues({ ...valid, DISCORD_CLIENT_SECRET: '********' }), ['DISCORD_CLIENT_SECRET'])
  assert.deepEqual(variablesWithIssues({ ...valid, DISCORD_CLIENT_SECRET: '(your client secret here)' }), ['DISCORD_CLIENT_SECRET'])
})

test('rejects a client secret containing spaces', () => {
  assert.deepEqual(variablesWithIssues({ ...valid, DISCORD_CLIENT_SECRET: 'aB3dE5fG7hJ9 kL1mN3pQ5rS7tU9vW1xY' }), ['DISCORD_CLIENT_SECRET'])
})

test('issues never contain configured values', () => {
  const secret = 'S3cretValueThatMustNeverLeak!!'
  const { issues } = validateOAuthEnv({ ...valid, SESSION_SECRET: secret.slice(0, 20), DISCORD_CLIENT_SECRET: '1234567890123456789' })
  const text = JSON.stringify(issues)
  assert.ok(!text.includes(secret.slice(0, 20)))
  assert.ok(!text.includes('1234567890123456789'))
})
