import { z } from 'zod'

import type { ActivityProgress, ActivityProgressStoragePayload, Id } from '@/types'
import { activityProgressStoragePayloadSchema } from '@/services/validation'

export const interactiveActivityStorageKey = 'knowledge-island.interactive-activity-progress'

export interface ActivityStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function resolveStorage(): ActivityStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function emptyPayload(): ActivityProgressStoragePayload {
  return { schemaVersion: 1, progress: [] }
}

function cloneProgress(progress: ActivityProgress): ActivityProgress {
  return { ...progress }
}

function parsePayload(raw: string | null): ActivityProgressStoragePayload | null {
  if (!raw) return null
  try {
    const result = activityProgressStoragePayloadSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export interface InteractiveActivityStorage {
  load(): ActivityProgressStoragePayload
  save(payload: ActivityProgressStoragePayload): void
  get(profileId: Id, activityId: Id): ActivityProgress | null
  upsert(progress: ActivityProgress): void
  clearProfile(profileId: Id): void
  clear(): void
  getLastWarning(): string | null
}

export function createInteractiveActivityStorage(
  storage: ActivityStorageLike | null = resolveStorage(),
): InteractiveActivityStorage {
  let lastWarning: string | null = null

  function load(): ActivityProgressStoragePayload {
    lastWarning = null
    if (!storage) return emptyPayload()
    const raw = storage.getItem(interactiveActivityStorageKey)
    if (!raw) return emptyPayload()
    const parsed = parsePayload(raw)
    if (parsed) return { schemaVersion: 1, progress: parsed.progress.map(cloneProgress) }
    lastWarning = '交互活动进度存储已损坏，已回退为空记录。'
    storage.removeItem(interactiveActivityStorageKey)
    return emptyPayload()
  }

  function save(payload: ActivityProgressStoragePayload): void {
    const normalized: ActivityProgressStoragePayload = {
      schemaVersion: 1,
      progress: payload.progress.map(cloneProgress),
    }
    const result = activityProgressStoragePayloadSchema.safeParse(normalized)
    if (!result.success) {
      lastWarning = '交互活动进度未能保存。'
      return
    }
    if (!storage) return
    try {
      storage.setItem(interactiveActivityStorageKey, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '交互活动进度未能保存，本次体验仍可继续。'
    }
  }

  function upsert(progress: ActivityProgress): void {
    const payload = load()
    const next = payload.progress.filter(
      (item) => !(item.profileId === progress.profileId && item.activityId === progress.activityId),
    )
    next.push(cloneProgress(progress))
    save({ schemaVersion: 1, progress: next })
  }

  function get(profileId: Id, activityId: Id): ActivityProgress | null {
    return (
      load().progress.find(
        (item) => item.profileId === profileId && item.activityId === activityId,
      ) ?? null
    )
  }

  function clearProfile(profileId: Id): void {
    const payload = load()
    save({
      schemaVersion: 1,
      progress: payload.progress.filter((item) => item.profileId !== profileId),
    })
  }

  function clear(): void {
    if (storage) storage.removeItem(interactiveActivityStorageKey)
    lastWarning = null
  }

  return { load, save, get, upsert, clearProfile, clear, getLastWarning: () => lastWarning }
}

export const interactiveActivityStorage = createInteractiveActivityStorage()

// Keep zod in this module's public dependency graph so future migrations can
// add a version-specific parser without changing callers.
export type InteractiveActivityStorageSchema = z.infer<typeof activityProgressStoragePayloadSchema>
