import { z } from 'zod'

import type { AchievementStoragePayload, AchievementUnlock } from '@/types'

export const ACHIEVEMENT_STORAGE_KEY = 'knowledge-island.achievements'
export const achievementStorageKey = ACHIEVEMENT_STORAGE_KEY
export const achievementStorageSchemaVersion = 1 as const

export interface AchievementStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface AchievementStorage {
  load(): AchievementStoragePayload
  save(payload: AchievementStoragePayload): void
  clear(): void
  getLastWarning(): string | null
}

const unlockSchema = z
  .object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    achievementId: z.string().min(1),
    unlockedAt: z.string().min(1),
    provenance: z
      .object({
        isSampleDerived: z.boolean(),
        verificationStatus: z
          .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
          .optional(),
      })
      .strict(),
  })
  .strict()

export const achievementStoragePayloadSchema = z
  .object({
    schemaVersion: z.literal(achievementStorageSchemaVersion),
    unlocks: z.array(unlockSchema),
  })
  .strict()

function browserStorage(): AchievementStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneUnlock(unlock: AchievementUnlock): AchievementUnlock {
  return { ...unlock, provenance: { ...unlock.provenance } }
}

function clonePayload(payload: AchievementStoragePayload): AchievementStoragePayload {
  return {
    schemaVersion: achievementStorageSchemaVersion,
    unlocks: payload.unlocks.map(cloneUnlock),
  }
}

function parsePayload(raw: string | null): AchievementStoragePayload | null {
  if (!raw) return null
  try {
    const result = achievementStoragePayloadSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createAchievementStorage(
  storage: AchievementStorageLike | null = browserStorage(),
  key = ACHIEVEMENT_STORAGE_KEY,
): AchievementStorage {
  let lastWarning: string | null = null

  function load(): AchievementStoragePayload {
    lastWarning = null
    if (!storage) return { schemaVersion: achievementStorageSchemaVersion, unlocks: [] }
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '里程碑记录暂时无法读取，将从空白记录开始。'
      return { schemaVersion: achievementStorageSchemaVersion, unlocks: [] }
    }
    if (!raw) return { schemaVersion: achievementStorageSchemaVersion, unlocks: [] }
    const payload = parsePayload(raw)
    if (payload) return clonePayload(payload)
    lastWarning = '里程碑记录存储已损坏，已安全恢复为空白记录。'
    try {
      storage.removeItem(key)
    } catch {
      // Corruption recovery is best effort.
    }
    return { schemaVersion: achievementStorageSchemaVersion, unlocks: [] }
  }

  function save(payload: AchievementStoragePayload): void {
    if (!storage) return
    const normalized: AchievementStoragePayload = {
      schemaVersion: achievementStorageSchemaVersion,
      unlocks: payload.unlocks.map(cloneUnlock),
    }
    const result = achievementStoragePayloadSchema.safeParse(normalized)
    if (!result.success) {
      lastWarning = '里程碑记录格式无效，本次记录未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '里程碑记录暂时无法保存，本次学习仍可继续。'
    }
  }

  return {
    load,
    save,
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '里程碑记录暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const achievementStorage = createAchievementStorage()

export function migrateAchievementStoragePayload(value: unknown): {
  payload: AchievementStoragePayload | null
  warning: string | null
} {
  const result = achievementStoragePayloadSchema.safeParse(value)
  return result.success
    ? { payload: result.data, warning: null }
    : {
        payload: null,
        warning: '里程碑记录版本或格式无法识别，已安全恢复为空白记录。',
      }
}
