import { z } from 'zod'

import type { ReviewQueueItem, ReviewQueueStoragePayload } from '@/types'

export const REVIEW_QUEUE_STORAGE_KEY = 'knowledge-island.review-queue'
export const reviewQueueStorageKey = REVIEW_QUEUE_STORAGE_KEY

export interface ReviewQueueStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ReviewQueueStorage {
  load(): ReviewQueueStoragePayload
  save(payload: ReviewQueueStoragePayload): void
  clear(): void
  getLastWarning(): string | null
}

const reasonCodeSchema = z.enum([
  'WEAK_MASTERY',
  'LOW_CONFIDENCE',
  'INSUFFICIENT_EVIDENCE',
  'NOT_STARTED',
  'IN_PROGRESS',
  'MASTERED',
  'CURRENT_KNOWLEDGE_POINT',
  'NEXT_AVAILABLE_KNOWLEDGE_POINT',
  'PREREQUISITE_LOCKED',
  'NO_AVAILABLE_KNOWLEDGE_POINT',
  'SOURCE_NOT_ALLOWED',
  'KNOWLEDGE_POINT_NOT_FOUND',
  'MASTERY_RECORD_NOT_FOUND',
])

const reasonSchema = z.object({
  code: reasonCodeSchema,
  masteryScore: z.number().finite().min(0).max(100),
  confidence: z.number().finite().min(0).max(1),
  evidenceCount: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string(),
})

const itemSchema = z.object({
  dueAt: z.string().datetime().optional(),
  evidenceId: z.string().optional(),
  id: z.string().min(1),
  profileId: z.string().min(1),
  textbookId: z.string().min(1),
  knowledgePointId: z.string().min(1),
  mapNodeId: z.string().min(1).optional(),
  recommendationType: z.enum(['REINFORCE', 'GATHER_MORE_EVIDENCE']),
  priority: z.number().int().nonnegative(),
  reason: reasonSchema,
  reasonCode: reasonCodeSchema,
  status: z.enum(['active', 'completed']),
  sourceStrategyVersion: z.string().min(1),
  sourceRecommendationId: z.string().min(1),
  provenance: z.object({
    isSampleDerived: z.boolean(),
    verificationStatus: z
      .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
      .optional(),
  }),
  completedAt: z.string().min(1).optional(),
})

export const reviewQueueStoragePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  items: z.array(itemSchema),
})

function browserStorage(): ReviewQueueStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneItem(item: ReviewQueueItem): ReviewQueueItem {
  return {
    ...item,
    reason: { ...item.reason },
    provenance: { ...item.provenance },
  }
}

function clonePayload(payload: ReviewQueueStoragePayload): ReviewQueueStoragePayload {
  return { schemaVersion: 1, items: payload.items.map(cloneItem) }
}

function parsePayload(raw: string | null): ReviewQueueStoragePayload | null {
  if (!raw) return null
  try {
    const result = reviewQueueStoragePayloadSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createReviewQueueStorage(
  storage: ReviewQueueStorageLike | null = browserStorage(),
  key = REVIEW_QUEUE_STORAGE_KEY,
): ReviewQueueStorage {
  let lastWarning: string | null = null

  function load(): ReviewQueueStoragePayload {
    lastWarning = null
    if (!storage) return { schemaVersion: 1, items: [] }
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '待巩固列表暂时无法读取，将从空白列表开始。'
      return { schemaVersion: 1, items: [] }
    }
    if (!raw) return { schemaVersion: 1, items: [] }
    const payload = parsePayload(raw)
    if (payload) return clonePayload(payload)
    lastWarning = '待巩固列表存储已损坏，已安全恢复为空白列表。'
    try {
      storage.removeItem(key)
    } catch {
      // Corruption recovery must not break the page.
    }
    return { schemaVersion: 1, items: [] }
  }

  function save(payload: ReviewQueueStoragePayload): void {
    if (!storage) return
    const normalized: ReviewQueueStoragePayload = {
      schemaVersion: 1,
      items: payload.items.map(cloneItem),
    }
    const result = reviewQueueStoragePayloadSchema.safeParse(normalized)
    if (!result.success) {
      lastWarning = '待巩固列表格式无效，本次更新未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '待巩固列表暂时无法保存，本次学习仍可继续。'
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
        lastWarning = '待巩固列表暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const reviewQueueStorage = createReviewQueueStorage()

export function migrateReviewQueueStoragePayload(value: unknown): {
  payload: ReviewQueueStoragePayload | null
  warning: string | null
} {
  const result = reviewQueueStoragePayloadSchema.safeParse(value)
  if (result.success) return { payload: result.data, warning: null }
  return {
    payload: null,
    warning: '待巩固列表版本或格式无法识别，已安全恢复为空白列表。',
  }
}
