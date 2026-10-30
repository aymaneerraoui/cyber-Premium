'use client'

import { useCallback, useMemo, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { cyberService } from '@/lib/services'
import type { ResourceKey, ResourceMap } from '@/lib/services/types'

export const resourceKey = (serverId: string, key: ResourceKey) => ['resource', serverId, key] as const

export function useServers() {
  return useSWR(['servers'], () => cyberService.listServers())
}

export function useServer(serverId: string | undefined) {
  return useSWR(serverId ? ['server', serverId] : null, () => cyberService.getServer(serverId!))
}

export function useChannels(serverId: string) {
  return useSWR(['channels', serverId], () => cyberService.getChannels(serverId), { revalidateOnFocus: false })
}

export function useRoles(serverId: string) {
  return useSWR(['roles', serverId], () => cyberService.getRoles(serverId), { revalidateOnFocus: false })
}

export function useResource<K extends ResourceKey>(serverId: string, key: K) {
  const { mutate: globalMutate } = useSWRConfig()
  const swr = useSWR(resourceKey(serverId, key), () => cyberService.getResource(serverId, key), {
    revalidateOnFocus: false,
  })

  const save = useCallback(
    async (value: ResourceMap[K], summary?: string) => {
      const result = await swr.mutate(cyberService.saveResource(serverId, key, value, summary), {
        optimisticData: value,
        rollbackOnError: true,
        revalidate: false,
      })
      if (summary) void globalMutate(resourceKey(serverId, 'auditEvents'))
      return result
    },
    [serverId, key, swr, globalMutate],
  )

  return { ...swr, save }
}

/**
 * Local editable copy of a loaded resource. Changes stay in the draft until
 * saved; discarding falls back to the persisted value.
 */
export function useDraft<T>(source: T | undefined) {
  const [draft, setDraft] = useState<T | null>(null)
  const value = (draft ?? source) as T | undefined
  const dirty = useMemo(
    () => draft !== null && source !== undefined && JSON.stringify(draft) !== JSON.stringify(source),
    [draft, source],
  )
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setDraft((prev) => {
        const base = (prev ?? source) as T
        return typeof next === 'function' ? (next as (p: T) => T)(base) : next
      })
    },
    [source],
  )
  const reset = useCallback(() => setDraft(null), [])
  return { value, update, dirty, reset }
}
