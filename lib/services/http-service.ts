import type { CyberService, PublishRequest, ResourceKey, ResourceMap } from './types'

/**
 * Live implementation targeting the future CYBER REST API.
 * Activated by setting NEXT_PUBLIC_CYBER_API_URL. Endpoints are the
 * contract the backend must implement — the UI does not change.
 *
 *   GET    /servers
 *   GET    /servers/:id
 *   GET    /servers/:id/channels
 *   GET    /servers/:id/roles
 *   GET    /servers/:id/config/:resource
 *   PUT    /servers/:id/config/:resource
 *   POST   /servers/:id/messages          (publish panel / announcement)
 *   POST   /servers/:id/scanner/:userId
 */
export function createHttpService(baseUrl: string): CyberService {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.message ?? `Request failed (${res.status})`)
    }
    return res.json() as Promise<T>
  }

  return {
    mode: 'live',
    listServers: () => request('/servers'),
    getServer: (id) => request(`/servers/${encodeURIComponent(id)}`),
    getChannels: (id) => request(`/servers/${encodeURIComponent(id)}/channels`),
    getRoles: (id) => request(`/servers/${encodeURIComponent(id)}/roles`),
    getResource: <K extends ResourceKey>(id: string, key: K) =>
      request<ResourceMap[K]>(`/servers/${encodeURIComponent(id)}/config/${key}`),
    saveResource: <K extends ResourceKey>(id: string, key: K, value: ResourceMap[K], summary?: string) =>
      request<ResourceMap[K]>(`/servers/${encodeURIComponent(id)}/config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value, summary }),
      }),
    publishMessage: (id: string, body: PublishRequest) =>
      request(`/servers/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify(body) }),
    scanUser: (id, userId) =>
      request(`/servers/${encodeURIComponent(id)}/scanner/${encodeURIComponent(userId)}`, { method: 'POST' }),
  }
}
