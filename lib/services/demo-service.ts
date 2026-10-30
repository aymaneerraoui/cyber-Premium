import { uid } from '@/lib/factories'
import type { AuditEvent, ScanFinding, ScanResult } from '@/lib/types/config'
import { isSnowflake } from '@/lib/validation/discord'
import { createDemoSeed, DEMO_CHANNELS, DEMO_ROLES, DEMO_SERVER, DEMO_SERVER_ID } from './demo-seed'
import type { CyberService, PublishRequest, PublishResult, ResourceKey, ResourceMap } from './types'

/**
 * Demo-mode implementation. Draft configuration is kept in browser storage
 * so the builders are fully interactive without a backend. This is NOT a
 * production datastore — the HTTP service replaces it once the API exists.
 */
const STORAGE_PREFIX = 'cyber.demo.v1'
const LATENCY_MS = 220

const memoryFallback = new Map<string, string>()

function storage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function read<T>(key: string): T | null {
  const raw = storage()?.getItem(key) ?? memoryFallback.get(key) ?? null
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  const raw = JSON.stringify(value)
  try {
    storage()?.setItem(key, raw)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error('Browser storage is full. Remove large images or reset the demo workspace.')
    }
    memoryFallback.set(key, raw)
  }
}

const wait = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

function assertDemoServer(serverId: string) {
  if (serverId !== DEMO_SERVER_ID) throw new Error('This server is not connected. Only the demo sandbox is available without a backend.')
}

const storageKey = (serverId: string, key: ResourceKey) => `${STORAGE_PREFIX}.${serverId}.${key}`

/** Decodes the creation timestamp embedded in a Discord snowflake. */
export function snowflakeToDate(id: string) {
  const DISCORD_EPOCH = BigInt(1420070400000)
  const ms = (BigInt(id) >> BigInt(22)) + DISCORD_EPOCH
  return new Date(Number(ms))
}

export const demoService: CyberService = {
  mode: 'demo',

  async listServers() {
    await wait(120)
    return [DEMO_SERVER]
  },

  async getServer(serverId) {
    await wait(80)
    return serverId === DEMO_SERVER_ID ? DEMO_SERVER : null
  },

  async getChannels(serverId) {
    assertDemoServer(serverId)
    return DEMO_CHANNELS
  },

  async getRoles(serverId) {
    assertDemoServer(serverId)
    return DEMO_ROLES
  },

  async getResource<K extends ResourceKey>(serverId: string, key: K): Promise<ResourceMap[K]> {
    assertDemoServer(serverId)
    await wait()
    const stored = read<ResourceMap[K]>(storageKey(serverId, key))
    if (stored !== null) return stored
    const seed = createDemoSeed()[key]
    write(storageKey(serverId, key), seed)
    return seed
  },

  async saveResource<K extends ResourceKey>(serverId: string, key: K, value: ResourceMap[K], summary?: string) {
    assertDemoServer(serverId)
    await wait()
    write(storageKey(serverId, key), value)
    if (summary && key !== 'auditEvents') {
      const events = read<AuditEvent[]>(storageKey(serverId, 'auditEvents')) ?? createDemoSeed().auditEvents
      const event: AuditEvent = {
        id: uid('aud'),
        category: key.startsWith('ticket') ? 'tickets' : key === 'antiSpam' || key === 'staffPermissions' ? 'security' : 'config',
        severity: 'info',
        actor: 'Demo Admin',
        message: summary,
        createdAt: new Date().toISOString(),
      }
      write(storageKey(serverId, 'auditEvents'), [event, ...events].slice(0, 200))
    }
    return value
  },

  async publishMessage(serverId: string, request: PublishRequest): Promise<PublishResult> {
    assertDemoServer(serverId)
    await wait(650)
    return {
      simulated: true,
      messageId: null,
      channelId: request.channelId,
      publishedAt: new Date().toISOString(),
    }
  },

  async scanUser(serverId, userId): Promise<ScanResult> {
    assertDemoServer(serverId)
    await wait(900)
    const id = userId.trim()
    const checkedAt = new Date().toISOString()
    if (!isSnowflake(id)) {
      return { userId: id, status: 'unavailable', findings: [], checkedAt, notes: ['The value entered is not a valid Discord user ID.'] }
    }

    const findings: ScanFinding[] = [
      {
        label: 'Account created',
        value: snowflakeToDate(id).toUTCString(),
        source: 'verified',
        sourceName: 'Decoded from the Discord snowflake ID',
      },
    ]

    const records = read<ResourceMap['moderationRecords']>(storageKey(serverId, 'moderationRecords')) ?? createDemoSeed().moderationRecords
    const local = records.filter((r) => r.targetId === id)
    if (local.length > 0) {
      findings.push({
        label: 'Moderation records in this server',
        value: local.map((r) => `${r.action.toUpperCase()} — ${r.reason}`).join('\n'),
        source: 'verified',
        sourceName: 'CYBER moderation log (demo sample data)',
      })
    }

    findings.push(
      { label: 'Profile (username, avatar)', value: 'Requires the bot token to query the Discord API', source: 'unknown', sourceName: 'Discord API — not connected' },
      { label: 'External reputation', value: 'No external data source configured', source: 'unknown', sourceName: 'Integrations' },
    )

    return {
      userId: id,
      status: local.length > 0 ? 'found' : 'not-found',
      findings,
      checkedAt,
      notes: [
        'Discord does not offer a public API to list every server a user belongs to or their ban history elsewhere.',
        'Only data from this server, the Discord API, or explicitly configured integrations is shown.',
      ],
    }
  },

  async resetDemo(serverId) {
    const s = storage()
    if (!s) return
    Object.keys(s)
      .filter((k) => k.startsWith(`${STORAGE_PREFIX}.${serverId}.`))
      .forEach((k) => s.removeItem(k))
    memoryFallback.clear()
  },
}
