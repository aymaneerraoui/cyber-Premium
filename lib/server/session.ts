import 'server-only'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import type { SessionUser } from '@/lib/auth-types'
import { getSessionSecret } from './env'
import { seal, unseal } from './session-crypto'

export const SESSION_COOKIE = 'cyber_session'
export const OAUTH_STATE_COOKIE = 'cyber_oauth_state'

/** Discord access tokens last 7 days; the session never outlives the token. */
export const MAX_SESSION_SECONDS = 60 * 60 * 24 * 7

export interface SessionData {
  user: SessionUser
  accessToken: string
  expiresAt: number
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  }
}

function isSessionData(value: unknown): value is SessionData {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<SessionData>
  return typeof v.accessToken === 'string' && typeof v.expiresAt === 'number' && typeof v.user?.id === 'string'
}

export function readSessionToken(token: string | undefined): SessionData | null {
  const secret = getSessionSecret()
  if (!token || !secret) return null
  const data = unseal<unknown>(token, secret)
  if (!isSessionData(data) || data.expiresAt <= Date.now()) return null
  return data
}

/** Reads and decrypts the session for the current request (Server Components and Route Handlers). */
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies()
  return readSessionToken(store.get(SESSION_COOKIE)?.value)
}

export function setSessionCookie(response: NextResponse, session: SessionData) {
  const secret = getSessionSecret()
  if (!secret) throw new Error('SESSION_SECRET is not configured')
  const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
  response.cookies.set(SESSION_COOKIE, seal(session, secret), { ...baseCookieOptions(), maxAge })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', { ...baseCookieOptions(), maxAge: 0 })
}

export function setStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE, state, { ...baseCookieOptions(), maxAge: 600 })
}

export function clearStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, '', { ...baseCookieOptions(), maxAge: 0 })
}
