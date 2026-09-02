import { z } from 'zod'

import type { LearningEvidence, MasteryRecord } from '@/types'

export const masteryRecordStorageKey = 'knowledge-island.mastery-records'
export const learningEvidenceStorageKey = 'knowledge-island.learning-evidence'
export const masteryStorageSchemaVersion = 1 as const

export interface MasteryStorageMigrationResult<T> {
  valid: boolean
  migrated: boolean
  payload: T
  warning: string | null
}

export interface MasteryStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface MasteryStorage {
  loadEvidence(): LearningEvidence[]
  loadRecords(): MasteryRecord[]
  saveEvidence(evidence: readonly LearningEvidence[]): void
  saveRecords(records: readonly MasteryRecord[]): void
  clearEvidence(): void
  clearRecords(): void
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

const learningEvidenceSchema = z.object({
  id: z.string().min(1),
  type: z.literal('question_attempt'),
  studentProfileId: z.string().min(1),
  knowledgePointId: z.string().min(1),
  source: z.object({
    questionId: z.string().min(1),
    questionAttemptId: z.string().min(1).optional(),
    assessmentId: z.string().min(1).optional(),
    questionSessionId: z.string().min(1).optional(),
  }),
  outcome: z.enum(['correct', 'incorrect']),
  questionDifficulty: z.number().int().min(1).max(5),
  knowledgeWeight: z.number().positive().max(1),
  evidenceWeight: z.number().positive(),
  occurredAt: z.string().min(1),
  metadata: z
    .object({
      sourceVerificationStatus: verificationStatusSchema.optional(),
      isSample: z.boolean().optional(),
      questionVersion: z.number().int().positive().optional(),
    })
    .optional(),
})

const masteryRecordSchema = z.object({
  studentProfileId: z.string().min(1),
  knowledgePointId: z.string().min(1),
  masteryScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  state: z.enum(['not_started', 'learning', 'weak', 'mastered']),
  evidenceCount: z.number().int().nonnegative(),
  correctEvidenceCount: z.number().int().nonnegative(),
  incorrectEvidenceCount: z.number().int().nonnegative(),
  lastEvidenceAt: z.string().min(1).optional(),
  updatedAt: z.string().min(1),
  version: z.number().int().positive(),
  algorithmVersion: z.string().min(1),
  isSampleDerived: z.boolean(),
  evidenceSourceStatus: z.enum(['NONE', 'SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'MIXED']),
})

export const learningEvidenceStoragePayloadSchema = z.object({
  schemaVersion: z.literal(masteryStorageSchemaVersion),
  evidence: z.array(learningEvidenceSchema),
})

export const masteryRecordStoragePayloadSchema = z.object({
  schemaVersion: z.literal(masteryStorageSchemaVersion),
  records: z.array(masteryRecordSchema),
})

type LearningEvidenceStoragePayload = {
  schemaVersion: typeof masteryStorageSchemaVersion
  evidence: LearningEvidence[]
}

type MasteryRecordStoragePayload = {
  schemaVersion: typeof masteryStorageSchemaVersion
  records: MasteryRecord[]
}

/**
 * Version 1 is the first persisted mastery contract. Keeping migration at
 * this boundary prevents a future schema change from being silently treated
 * as valid domain data.
 */
export function migrateLearningEvidenceStoragePayload(
  input: unknown,
): MasteryStorageMigrationResult<LearningEvidenceStoragePayload> {
  const result = learningEvidenceStoragePayloadSchema.safeParse(input)
  if (result.success) {
    return { valid: true, migrated: false, payload: result.data, warning: null }
  }
  return {
    valid: false,
    migrated: false,
    payload: { schemaVersion: masteryStorageSchemaVersion, evidence: [] },
    warning: '学习证据存储版本或格式无法识别。',
  }
}

export function migrateMasteryRecordStoragePayload(
  input: unknown,
): MasteryStorageMigrationResult<MasteryRecordStoragePayload> {
  const result = masteryRecordStoragePayloadSchema.safeParse(input)
  if (result.success) {
    return { valid: true, migrated: false, payload: result.data, warning: null }
  }
  return {
    valid: false,
    migrated: false,
    payload: { schemaVersion: masteryStorageSchemaVersion, records: [] },
    warning: '掌握度记录存储版本或格式无法识别。',
  }
}

function defaultStorage(): MasteryStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

export function createMasteryStorage(
  storage: MasteryStorageLike | null = defaultStorage(),
  keys: { evidence?: string; records?: string } = {},
): MasteryStorage {
  const evidenceKey = keys.evidence ?? learningEvidenceStorageKey
  const recordsKey = keys.records ?? masteryRecordStorageKey
  let lastWarning: string | null = null

  function removeSafely(key: string): void {
    if (!storage) return
    try {
      storage.removeItem(key)
    } catch {
      lastWarning = '掌握度存储无法清理，将使用空白数据继续。'
    }
  }

  function readEvidence(): LearningEvidence[] {
    if (!storage) return []
    let raw: string | null
    try {
      raw = storage.getItem(evidenceKey)
    } catch {
      lastWarning = '学习证据暂时无法读取，将使用空白数据继续。'
      return []
    }
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      const migration = migrateLearningEvidenceStoragePayload(parsed)
      if (!migration.valid) {
        removeSafely(evidenceKey)
        lastWarning = `${migration.warning ?? '学习证据存储无法识别。'}已安全清理。`
        return []
      }
      return migration.payload.evidence
    } catch {
      removeSafely(evidenceKey)
      lastWarning = '学习证据存储已损坏，已安全清理。'
      return []
    }
  }

  function readRecords(): MasteryRecord[] {
    if (!storage) return []
    let raw: string | null
    try {
      raw = storage.getItem(recordsKey)
    } catch {
      lastWarning = '掌握度记录暂时无法读取，将使用空白数据继续。'
      return []
    }
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      const migration = migrateMasteryRecordStoragePayload(parsed)
      if (!migration.valid) {
        removeSafely(recordsKey)
        lastWarning = `${migration.warning ?? '掌握度记录存储无法识别。'}已安全清理。`
        return []
      }
      return migration.payload.records
    } catch {
      removeSafely(recordsKey)
      lastWarning = '掌握度记录存储已损坏，已安全清理。'
      return []
    }
  }

  function write(key: string, payload: unknown, message: string): void {
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify(payload))
      lastWarning = null
    } catch {
      lastWarning = message
    }
  }

  function clearKey(key: string, message: string): void {
    if (!storage) return
    try {
      storage.removeItem(key)
      lastWarning = null
    } catch {
      lastWarning = message
    }
  }

  return {
    loadEvidence() {
      lastWarning = null
      return readEvidence().map((evidence) => ({
        ...evidence,
        source: { ...evidence.source },
        ...(evidence.metadata ? { metadata: { ...evidence.metadata } } : {}),
      }))
    },
    loadRecords() {
      lastWarning = null
      return readRecords().map((record) => ({ ...record }))
    },
    saveEvidence(evidence) {
      write(
        evidenceKey,
        { schemaVersion: masteryStorageSchemaVersion, evidence: [...evidence] },
        '学习证据暂时无法保存，请稍后再试。',
      )
    },
    saveRecords(records) {
      write(
        recordsKey,
        { schemaVersion: masteryStorageSchemaVersion, records: [...records] },
        '掌握度记录暂时无法保存，请稍后再试。',
      )
    },
    clearEvidence() {
      clearKey(evidenceKey, '学习证据暂时无法清理，请稍后再试。')
    },
    clearRecords() {
      clearKey(recordsKey, '掌握度记录暂时无法清理，请稍后再试。')
    },
    clear() {
      clearKey(evidenceKey, '学习证据暂时无法清理，请稍后再试。')
      clearKey(recordsKey, '掌握度记录暂时无法清理，请稍后再试。')
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const masteryStorage = createMasteryStorage()
