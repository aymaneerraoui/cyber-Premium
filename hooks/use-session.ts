'use client'

import useSWR from 'swr'
import type { ManagedGuildsResponse, SessionResponse } from '@/lib/auth-types'

export const SESSION_KEY = '/api/auth/session'
export const GUILDS_KEY = '/api/discord/guilds'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const code = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : `http_${res.status}`
    throw new ApiError(res.status, code)
  }
  return res.json() as Promise<T>
}

export function useSession() {
  return useSWR<SessionResponse>(SESSION_KEY, fetchJson, { revalidateOnFocus: true })
}

export function useManagedGuilds(enabled: boolean) {
  return useSWR<ManagedGuildsResponse, ApiError>(enabled ? GUILDS_KEY : null, fetchJson, { revalidateOnFocus: false })
}

export async function signOut() {
  const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  if (!res.ok) throw new ApiError(res.status, 'logout_failed')
}
