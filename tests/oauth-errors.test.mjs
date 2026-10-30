import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classifyTokenExchangeError } from '../lib/oauth-errors.ts'

test('wrong client ID or secret maps to oauth-client', () => {
  assert.equal(classifyTokenExchangeError(401, 'invalid_client'), 'oauth-client')
  assert.equal(classifyTokenExchangeError(401), 'oauth-client')
})

test('redirect URI mismatch maps to oauth-redirect', () => {
  assert.equal(classifyTokenExchangeError(400, 'invalid_grant', 'Invalid "redirect_uri" in request.'), 'oauth-redirect')
})

test('expired or reused code maps to oauth-expired', () => {
  assert.equal(classifyTokenExchangeError(400, 'invalid_grant', 'Invalid "code" in request.'), 'oauth-expired')
})

test('rate limits and unknown failures', () => {
  assert.equal(classifyTokenExchangeError(429), 'rate-limited')
  assert.equal(classifyTokenExchangeError(500), 'oauth-failed')
  assert.equal(classifyTokenExchangeError(0), 'oauth-failed')
})
