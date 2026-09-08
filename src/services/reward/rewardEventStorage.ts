import { notifyPetLearningChanged } from '@/services/pet/petNotifications'
import { z } from 'zod'

import type { RewardEvent, RewardEventStoragePayload } from '@/types'

export const REWARD_EVENT_STORAGE_KEY = 'knowledge-island.reward-events'
export const rewardEventStorageKey = REWARD_EVENT_STORAGE_KEY
export const rewardEventStorageSchemaVersion = 1 as const

export interface RewardEventStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface RewardEventStorage {
  load(): RewardEventStoragePayload
  save(payload: RewardEventStoragePayload): void
  loadAll(): RewardEvent[]
  saveAll(events: readonly RewardEvent[]): void
  clear(): void
  getLastWarning(): string | null
}

const verificationStatusSchema = z.enum([
  'SAMPLE',
  'UNVERIFIED',
  'VERIFIED',
  'REVIEWED',
  'REJECTED',
])

const rewardGrantSchema = z
  .object({
    knowledgeEnergy: z.number().int().nonnegative(),
  })
  .strict()

const rewardEventSchema = z
  .object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    type: z.enum([
      'lesson_completed',
      'assessment_completed',
      'knowledge_mastered',
      'review_completed',
      'wrong_question_resolved',
    ]),
    sourceId: z.string().min(1),
    textbookId: z.string().min(1).optional(),
    knowledgePointId: z.string().min(1).optional(),
    occurredAt: z.string().min(1),
    reward: rewardGrantSchema,
    provenance: z
      .object({
        isSampleDerived: z.boolean(),
        verificationStatus: verificationStatusSchema.optional(),
      })
      .strict(),
  })
  .strict()

export const rewardEventStoragePayloadSchema = z
  .object({
    schemaVersion: z.literal(rewardEventStorageSchemaVersion),
    events: z.array(rewardEventSchema),
  })
  .strict()

function browserStorage(): RewardEventStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneEvent(event: RewardEvent): RewardEvent {
  return {
    ...event,
    reward: { ...event.reward },
    provenance: { ...event.provenance },
  }
}

function clonePayload(payload: RewardEventStoragePayload): RewardEventStoragePayload {
  return {
    schemaVersion: rewardEventStorageSchemaVersion,
    events: payload.events.map(cloneEvent),
  }
}

function parsePayload(raw: string | null): RewardEventStoragePayload | null {
  if (!raw) return null
  try {
    const result = rewardEventStoragePayloadSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createRewardEventStorage(
  storage: RewardEventStorageLike | null = browserStorage(),
  key = REWARD_EVENT_STORAGE_KEY,
): RewardEventStorage {
  let lastWarning: string | null = null

  function load(): RewardEventStoragePayload {
    lastWarning = null
    if (!storage) return { schemaVersion: rewardEventStorageSchemaVersion, events: [] }

    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '成长奖励记录暂时无法读取，原记录已保留，相关奖励暂不保存。'
      return { schemaVersion: rewardEventStorageSchemaVersion, events: [] }
    }
    if (!raw) return { schemaVersion: rewardEventStorageSchemaVersion, events: [] }

    const payload = parsePayload(raw)
    if (payload) return clonePayload(payload)

    lastWarning = '成长奖励记录格式或版本损坏，原记录已保留，相关奖励暂不保存。'
    return { schemaVersion: rewardEventStorageSchemaVersion, events: [] }
  }

  function save(payload: RewardEventStoragePayload): void {
    if (!storage) return
    // Never replace an unreadable source ledger with a partial set of newly earned rewards.
    load()
    if (lastWarning) return
    const normalized: RewardEventStoragePayload = {
      schemaVersion: rewardEventStorageSchemaVersion,
      events: payload.events.map(cloneEvent),
    }
    const result = rewardEventStoragePayloadSchema.safeParse(normalized)
    if (!result.success) {
      lastWarning = '成长奖励记录格式无效，本次记录未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      notifyPetLearningChanged()
      lastWarning = null
    } catch {
      lastWarning = '成长奖励记录暂时无法保存，本次学习仍可继续。'
    }
  }

  return {
    load,
    save,
    loadAll() {
      return load().events.map(cloneEvent)
    },
    saveAll(events) {
      save({ schemaVersion: rewardEventStorageSchemaVersion, events: [...events] })
    },
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '成长奖励记录暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const rewardEventStorage = createRewardEventStorage()

export function migrateRewardEventStoragePayload(value: unknown): {
  payload: RewardEventStoragePayload | null
  warning: string | null
} {
  const result = rewardEventStoragePayloadSchema.safeParse(value)
  if (result.success) return { payload: result.data, warning: null }
  return {
    payload: null,
    warning: '成长奖励记录版本或格式无法识别，已安全恢复为空白记录。',
  }
}
