import { z } from 'zod'

import type { LearningHistoryRecord, LearningHistoryStoragePayload } from '@/types'

export const LEARNING_HISTORY_STORAGE_KEY = 'knowledge-island.learning-history'
export const learningHistoryStorageKey = LEARNING_HISTORY_STORAGE_KEY

export interface LearningHistoryStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface LearningHistoryStorage {
  loadAll(): LearningHistoryRecord[]
  saveAll(records: readonly LearningHistoryRecord[]): void
  clear(): void
  getLastWarning(): string | null
}

const historyTypeSchema = z.enum([
  'lesson_started',
  'lesson_completed',
  'assessment_started',
  'assessment_completed',
])

const summarySchema = z.object({
  questionCount: z.number().int().nonnegative().optional(),
  correctCount: z.number().int().nonnegative().optional(),
  incorrectCount: z.number().int().nonnegative().optional(),
  manualReviewCount: z.number().int().nonnegative().optional(),
  assessmentPercentage: z.number().finite().min(0).max(100).nullable().optional(),
})

const recordSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  type: historyTypeSchema,
  textbookId: z.string().min(1),
  unitId: z.string().min(1),
  lessonId: z.string().min(1),
  knowledgePointId: z.string().min(1),
  sourceId: z.string().min(1),
  occurredAt: z.string().min(1),
  summary: summarySchema.optional(),
  provenance: z.object({
    isSampleDerived: z.boolean(),
    verificationStatus: z
      .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
      .optional(),
  }),
})

const payloadSchema = z.object({
  schemaVersion: z.literal(1),
  records: z.array(recordSchema),
})

function browserStorage(): LearningHistoryStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneRecord(record: LearningHistoryRecord): LearningHistoryRecord {
  return {
    ...record,
    ...(record.summary ? { summary: { ...record.summary } } : {}),
    provenance: { ...record.provenance },
  }
}

function parsePayload(value: string | null): LearningHistoryStoragePayload | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    const result = payloadSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createLearningHistoryStorage(
  storage: LearningHistoryStorageLike | null = browserStorage(),
  key = LEARNING_HISTORY_STORAGE_KEY,
): LearningHistoryStorage {
  let lastWarning: string | null = null

  function loadAll(): LearningHistoryRecord[] {
    lastWarning = null
    if (!storage) return []
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '学习记录暂时无法读取，将从空白记录开始。'
      return []
    }
    if (!raw) return []
    const payload = parsePayload(raw)
    if (!payload) {
      lastWarning = '学习记录存储已损坏，已安全恢复为空白记录。'
      try {
        storage.removeItem(key)
      } catch {
        // Corruption recovery must not break the page.
      }
      return []
    }
    return payload.records.map(cloneRecord)
  }

  function saveAll(records: readonly LearningHistoryRecord[]): void {
    if (!storage) return
    const payload: LearningHistoryStoragePayload = {
      schemaVersion: 1,
      records: records.map(cloneRecord),
    }
    const result = payloadSchema.safeParse(payload)
    if (!result.success) {
      lastWarning = '学习记录格式无效，本次记录未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '学习记录暂时无法保存，本次学习仍可继续。'
    }
  }

  return {
    loadAll,
    saveAll,
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '学习记录暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const learningHistoryStorage = createLearningHistoryStorage()

export function migrateLearningHistoryStoragePayload(value: unknown): {
  payload: LearningHistoryStoragePayload | null
  warning: string | null
} {
  const result = payloadSchema.safeParse(value)
  if (result.success) return { payload: result.data, warning: null }
  return {
    payload: null,
    warning: '学习记录版本或格式无法识别，已安全恢复为空白记录。',
  }
}
