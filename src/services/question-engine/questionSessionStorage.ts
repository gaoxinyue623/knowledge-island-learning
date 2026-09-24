import { z } from 'zod'

import type {
  QuestionAnswerDraft,
  QuestionAttempt,
  QuestionAttemptResult,
  QuestionSession,
  QuestionSessionStatus,
} from '@/types'

export const questionSessionStorageKey = 'knowledge-island.question-sessions'

export interface QuestionSessionStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface QuestionSessionStorage {
  loadAll(): QuestionSession[]
  get(sessionId: string): QuestionSession | null
  getForAssessment(assessmentId: string, studentSessionIdPrefix?: string): QuestionSession[]
  save(session: QuestionSession): void
  remove(sessionId: string): void
  clear(): void
  getLastWarning(): string | null
}

export interface QuestionSessionStoragePayload {
  schemaVersion: 1
  sessions: QuestionSession[]
}

const questionAnswerDraftSchema = z.union([
  z.object({ type: z.literal('singleChoice'), optionId: z.string().min(1).optional() }),
  z.object({ type: z.literal('multipleChoice'), optionIds: z.array(z.string()) }),
  z.object({ type: z.literal('trueFalse'), value: z.boolean().optional() }),
  z.object({ type: z.literal('fillBlank'), values: z.array(z.string()) }),
  z.object({ type: z.literal('calculation'), value: z.string() }),
  z.object({ type: z.literal('shortAnswer'), value: z.string() }),
])

const questionAttemptResultSchema = z.object({
  status: z.enum(['correct', 'incorrect', 'manual_review_required']),
  score: z.number().nonnegative(),
  maxScore: z.number().nonnegative(),
  feedback: z.string().optional(),
})

const questionAttemptSchema = z.object({
  errorPatterns: z
    .array(
      z.object({
        domain: z.string(),
        category: z.string(),
        code: z.string(),
        confidence: z.number().finite().min(0).max(1),
      }),
    )
    .optional(),
  questionId: z.string().min(1),
  answer: questionAnswerDraftSchema,
  submitted: z.boolean(),
  result: questionAttemptResultSchema.optional(),
  submittedAt: z.string().optional(),
  questionVersion: z.number().int().positive().optional(),
})

const questionSessionSchema = z.object({
  runtimeAgent: z
    .object({
      binding: z.string().min(1),
      reviewBindings: z.record(z.string(), z.string()),
      projectedAt: z.string().optional(),
    })
    .optional(),
  id: z.string().min(1),
  assessmentId: z.string().min(1),
  textbookId: z.string().min(1),
  unitId: z.string().min(1),
  lessonId: z.string().min(1),
  knowledgePointId: z.string().min(1),
  questionIds: z.array(z.string().min(1)),
  currentQuestionIndex: z.number().int().nonnegative(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  attempts: z.array(questionAttemptSchema),
  startedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  completedAt: z.string().optional(),
})

export const questionSessionStoragePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  sessions: z.array(questionSessionSchema),
})

function defaultStorage(): QuestionSessionStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function statusForSession(
  session: QuestionSession,
  questionIds: readonly string[],
): QuestionSessionStatus {
  if (
    session.status === 'completed' &&
    questionIds.length > 0 &&
    questionIds.every((questionId) =>
      session.attempts.some((attempt) => attempt.questionId === questionId && attempt.submitted),
    )
  ) {
    return 'completed'
  }
  if (session.status === 'in_progress' || session.attempts.length > 0) return 'in_progress'
  return 'not_started'
}

/** Remove attempts for question IDs that are no longer part of the assessment. */
export function normalizeQuestionSession(
  session: QuestionSession,
  questionIds: readonly string[],
): QuestionSession {
  const validIds = new Set(questionIds)
  const attemptsByQuestionId = new Map<string, QuestionAttempt>()
  for (const attempt of session.attempts) {
    if (validIds.has(attempt.questionId))
      attemptsByQuestionId.set(attempt.questionId, { ...attempt })
  }
  const normalizedIndex = Math.min(
    Math.max(0, session.currentQuestionIndex),
    Math.max(0, questionIds.length - 1),
  )
  const normalized: QuestionSession = {
    ...session,
    questionIds: [...questionIds],
    currentQuestionIndex: normalizedIndex,
    status: statusForSession(
      { ...session, attempts: [...attemptsByQuestionId.values()] },
      questionIds,
    ),
    attempts: [...attemptsByQuestionId.values()],
  }
  if (normalized.status !== 'completed') delete normalized.completedAt
  return normalized
}

export function createQuestionSessionStorage(
  storage: QuestionSessionStorageLike | null = defaultStorage(),
  key = questionSessionStorageKey,
): QuestionSessionStorage {
  let lastWarning: string | null = null

  function readPayload(): QuestionSessionStoragePayload {
    lastWarning = null
    if (!storage) return { schemaVersion: 1, sessions: [] }
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '题目会话暂时无法读取，将从空白练习开始。'
      return { schemaVersion: 1, sessions: [] }
    }
    if (!raw) return { schemaVersion: 1, sessions: [] }
    try {
      const parsed: unknown = JSON.parse(raw)
      const result = questionSessionStoragePayloadSchema.safeParse(parsed)
      if (!result.success) {
        storage.removeItem(key)
        lastWarning = '题目会话存储格式无法识别，已安全清理。'
        return { schemaVersion: 1, sessions: [] }
      }
      return result.data
    } catch {
      storage.removeItem(key)
      lastWarning = '题目会话存储已损坏，已安全清理。'
      return { schemaVersion: 1, sessions: [] }
    }
  }

  function writePayload(payload: QuestionSessionStoragePayload): void {
    if (!storage) return
    try {
      storage.setItem(key, JSON.stringify(payload))
      lastWarning = null
    } catch {
      lastWarning = '题目会话暂时无法保存，请稍后再试。'
    }
  }

  return {
    loadAll() {
      return readPayload().sessions.map((session) => ({
        ...session,
        attempts: [...session.attempts],
      }))
    },
    get(sessionId) {
      return readPayload().sessions.find((session) => session.id === sessionId) ?? null
    },
    getForAssessment(assessmentId, studentSessionIdPrefix) {
      return readPayload().sessions.filter(
        (session) =>
          session.assessmentId === assessmentId &&
          (!studentSessionIdPrefix || session.id.startsWith(studentSessionIdPrefix)),
      )
    },
    save(session) {
      const payload = readPayload()
      const sessions = payload.sessions.filter((candidate) => candidate.id !== session.id)
      sessions.push({ ...session, attempts: session.attempts.map((attempt) => ({ ...attempt })) })
      writePayload({ schemaVersion: 1, sessions })
    },
    remove(sessionId) {
      const payload = readPayload()
      writePayload({
        schemaVersion: 1,
        sessions: payload.sessions.filter((session) => session.id !== sessionId),
      })
    },
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '题目会话暂时无法清理，请稍后再试。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const questionSessionStorage = createQuestionSessionStorage()

export type { QuestionAnswerDraft, QuestionAttemptResult }
