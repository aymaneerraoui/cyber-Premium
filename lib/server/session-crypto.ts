import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/*
 * Authenticated encryption (AES-256-GCM) for the session cookie. The cookie
 * holds the Discord access token, so it is encrypted — not merely signed —
 * and any tampering makes it fail to decrypt.
 *
 * Kept free of framework and path-alias imports so it can be unit tested
 * directly with `node --test`.
 */

const VERSION = 'v1'
const IV_BYTES = 12
const TAG_BYTES = 16

function deriveKey(secret: string) {
  return createHash('sha256').update(`cyber-session:${secret}`).digest()
}

export function seal(payload: unknown, secret: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}.${Buffer.concat([iv, tag, ciphertext]).toString('base64url')}`
}

/** Returns null for any malformed, tampered, or foreign-key token. */
export function unseal<T>(token: string, secret: string): T | null {
  const [version, body] = token.split('.')
  if (version !== VERSION || !body) return null
  const raw = Buffer.from(body, 'base64url')
  if (raw.length <= IV_BYTES + TAG_BYTES) return null
  const iv = raw.subarray(0, IV_BYTES)
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES)
  try {
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), iv)
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    return JSON.parse(plaintext) as T
  } catch {
    // GCM authentication failure means the cookie was altered or sealed with another secret.
    return null
  }
}

export function createState() {
  return randomBytes(32).toString('base64url')
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
