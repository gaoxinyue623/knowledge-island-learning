import type { Id, LessonLaunchContext, LessonSession, LessonSessionStoragePayload } from '@/types'

export const LESSON_SESSION_STORAGE_KEY = 'knowledge-island.lesson-sessions'
export const lessonSessionStorageKey = LESSON_SESSION_STORAGE_KEY

export interface LessonSessionStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function browserStorage(): LessonSessionStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

const SESSION_STATUSES = new Set<LessonSession['status']>([
  'not_started',
  'in_progress',
  'completed',
])

function optionalString(value: unknown): string | undefined | null {
  if (value === undefined) return undefined
  return typeof value === 'string' && value.length > 0 ? value : null
}

function parseSession(value: unknown): LessonSession | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>
  const requiredStrings = ['id', 'textbookId', 'unitId', 'lessonId', 'knowledgePointId'] as const
  if (requiredStrings.some((key) => typeof candidate[key] !== 'string' || !candidate[key])) {
    return null
  }
  if (
    typeof candidate.status !== 'string' ||
    !SESSION_STATUSES.has(candidate.status as LessonSession['status']) ||
    typeof candidate.currentStepIndex !== 'number' ||
    !Number.isInteger(candidate.currentStepIndex) ||
    candidate.currentStepIndex < 0 ||
    !Array.isArray(candidate.completedStepIds) ||
    candidate.completedStepIds.some((id) => typeof id !== 'string' || !id)
  ) {
    return null
  }

  const startedAt = optionalString(candidate.startedAt)
  const updatedAt = optionalString(candidate.updatedAt)
  const completedAt = optionalString(candidate.completedAt)
  if (startedAt === null || updatedAt === null || completedAt === null) return null

  return {
    id: candidate.id as Id,
    textbookId: candidate.textbookId as Id,
    unitId: candidate.unitId as Id,
    lessonId: candidate.lessonId as Id,
    knowledgePointId: candidate.knowledgePointId as Id,
    status: candidate.status as LessonSession['status'],
    currentStepIndex: candidate.currentStepIndex,
    completedStepIds: [...new Set(candidate.completedStepIds as string[])],
    ...(startedAt ? { startedAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    ...(completedAt ? { completedAt } : {}),
  }
}

function parsePayload(value: string | null): LessonSessionStoragePayload | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as Record<string, unknown>
    if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.sessions)) return null
    const sessions = candidate.sessions.map(parseSession)
    if (sessions.some((session) => session === null)) return null
    return { schemaVersion: 1, sessions: sessions as LessonSession[] }
  } catch {
    return null
  }
}

export function buildLessonSessionId(
  context: LessonLaunchContext,
  studentId = 'local-profile',
): Id {
  return [
    'lesson-session',
    studentId,
    context.textbookId,
    context.unitId,
    context.lessonId,
    context.knowledgePointId,
  ].join(':')
}

export function normalizeLessonSession(
  session: LessonSession,
  stepIds: readonly Id[],
): LessonSession {
  const legalStepIds = new Set(stepIds)
  const completedStepIds = session.completedStepIds.filter((id) => legalStepIds.has(id))
  const maxIndex = Math.max(0, stepIds.length - 1)
  return {
    ...session,
    currentStepIndex: Math.min(Math.max(0, session.currentStepIndex), maxIndex),
    completedStepIds: [...new Set(completedStepIds)],
    ...(session.status === 'completed' && stepIds.length > 0 ? { currentStepIndex: maxIndex } : {}),
  }
}

export interface LessonSessionStorage {
  loadAll(): LessonSession[]
  get(sessionId: Id): LessonSession | null
  getForContext(context: LessonLaunchContext, studentId?: Id): LessonSession | null
  save(session: LessonSession): void
  remove(sessionId: Id): void
  clear(): void
  getLastWarning(): string | null
}

export function createLessonSessionStorage(
  storage: LessonSessionStorageLike | null = browserStorage(),
): LessonSessionStorage {
  let lastWarning: string | null = null

  function loadAll(): LessonSession[] {
    lastWarning = null
    if (!storage) return []
    let raw: string | null = null
    try {
      raw = storage.getItem(LESSON_SESSION_STORAGE_KEY)
    } catch {
      lastWarning = '学习进度暂时无法读取，将从空白会话开始。'
      return []
    }
    if (!raw) return []
    const payload = parsePayload(raw)
    if (!payload) {
      lastWarning = '学习进度格式需要更新，已安全恢复为空白会话。'
      try {
        storage.removeItem(LESSON_SESSION_STORAGE_KEY)
      } catch {
        // A storage failure must not break the LessonPlayer.
      }
      return []
    }
    return payload.sessions
  }

  function write(sessions: LessonSession[]) {
    if (!storage) return
    const payload: LessonSessionStoragePayload = { schemaVersion: 1, sessions }
    try {
      storage.setItem(LESSON_SESSION_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      lastWarning = '学习进度暂时无法保存，本次学习仍可继续。'
    }
  }

  return {
    loadAll,
    get(sessionId) {
      return loadAll().find((session) => session.id === sessionId) ?? null
    },
    getForContext(context, studentId = 'local-profile') {
      return this.get(buildLessonSessionId(context, studentId))
    },
    save(session) {
      const sessions = loadAll().filter((item) => item.id !== session.id)
      write([...sessions, session])
    },
    remove(sessionId) {
      const sessions = loadAll().filter((session) => session.id !== sessionId)
      write(sessions)
    },
    clear() {
      try {
        storage?.removeItem(LESSON_SESSION_STORAGE_KEY)
      } catch {
        lastWarning = '学习进度暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const lessonSessionStorage = createLessonSessionStorage()
