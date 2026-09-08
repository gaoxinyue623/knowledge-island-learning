import { z } from 'zod'

import type { WrongBookStoragePayload, WrongQuestionRecord } from '@/types'

export const WRONG_BOOK_STORAGE_KEY = 'knowledge-island.wrong-book'
export const wrongBookStorageKey = WRONG_BOOK_STORAGE_KEY

export interface WrongBookStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface WrongBookStorage {
  load(): WrongBookStoragePayload
  save(payload: WrongBookStoragePayload): void
  clear(): void
  getLastWarning(): string | null
}

const recordSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  questionId: z.string().min(1),
  knowledgePointIds: z.array(z.string().min(1)),
  firstWrongAt: z.string().min(1),
  lastWrongAt: z.string().min(1),
  wrongCount: z.number().int().positive(),
  status: z.enum(['active', 'resolved']),
  resolvedAt: z.string().min(1).optional(),
  source: z.object({ questionSessionIds: z.array(z.string().min(1)) }),
  provenance: z.object({
    isSampleDerived: z.boolean(),
    verificationStatus: z
      .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
      .optional(),
  }),
  textbookId: z.string().min(1).optional(),
  textbookIds: z.array(z.string().min(1)).optional(),
  unitId: z.string().min(1).optional(),
  lessonId: z.string().min(1).optional(),
})

export const wrongBookStoragePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  records: z.array(recordSchema),
  processedAttemptIds: z.array(z.string().min(1)),
})

function browserStorage(): WrongBookStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneRecord(record: WrongQuestionRecord): WrongQuestionRecord {
  return {
    ...record,
    knowledgePointIds: [...record.knowledgePointIds],
    source: { questionSessionIds: [...record.source.questionSessionIds] },
    provenance: { ...record.provenance },
    ...(record.textbookIds ? { textbookIds: [...record.textbookIds] } : {}),
  }
}

function clonePayload(payload: WrongBookStoragePayload): WrongBookStoragePayload {
  return {
    schemaVersion: 1,
    records: payload.records.map(cloneRecord),
    processedAttemptIds: [...payload.processedAttemptIds],
  }
}

function parsePayload(raw: string | null): WrongBookStoragePayload | null {
  if (!raw) return null
  try {
    const result = wrongBookStoragePayloadSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function createWrongBookStorage(
  storage: WrongBookStorageLike | null = browserStorage(),
  key = WRONG_BOOK_STORAGE_KEY,
): WrongBookStorage {
  let lastWarning: string | null = null

  function load(): WrongBookStoragePayload {
    lastWarning = null
    if (!storage) return { schemaVersion: 1, records: [], processedAttemptIds: [] }
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '错题本暂时无法读取，将从空白错题本开始。'
      return { schemaVersion: 1, records: [], processedAttemptIds: [] }
    }
    if (!raw) return { schemaVersion: 1, records: [], processedAttemptIds: [] }
    const payload = parsePayload(raw)
    if (payload) return clonePayload(payload)
    lastWarning = '错题本存储已损坏，已安全恢复为空白错题本。'
    try {
      storage.removeItem(key)
    } catch {
      // Corruption recovery is best effort and must not blank the page.
    }
    return { schemaVersion: 1, records: [], processedAttemptIds: [] }
  }

  function save(payload: WrongBookStoragePayload): void {
    if (!storage) return
    const normalized: WrongBookStoragePayload = {
      schemaVersion: 1,
      records: payload.records.map(cloneRecord),
      processedAttemptIds: [...new Set(payload.processedAttemptIds)],
    }
    const result = wrongBookStoragePayloadSchema.safeParse(normalized)
    if (!result.success) {
      lastWarning = '错题本格式无效，本次记录未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '错题本暂时无法保存，本次作答仍可继续。'
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
        lastWarning = '错题本暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const wrongBookStorage = createWrongBookStorage()

export function migrateWrongBookStoragePayload(value: unknown): {
  payload: WrongBookStoragePayload | null
  warning: string | null
} {
  const result = wrongBookStoragePayloadSchema.safeParse(value)
  if (result.success) return { payload: result.data, warning: null }
  return {
    payload: null,
    warning: '错题本版本或格式无法识别，已安全恢复为空白错题本。',
  }
}
