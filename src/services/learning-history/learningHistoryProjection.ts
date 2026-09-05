import type {
  Id,
  LearningHistoryProjectionOptions,
  LearningHistoryProjectionResult,
  LearningHistoryRecord,
  LessonSession,
  QuestionSession,
} from '@/types'

const EPOCH = '1970-01-01T00:00:00.000Z'

function historyId(profileId: Id, type: LearningHistoryRecord['type'], sourceId: Id): Id {
  return `learning-history:${profileId}:${type}:${sourceId}`
}

function eventTime(
  value: string | undefined,
  fallback: string | undefined,
  type: LearningHistoryRecord['type'],
  sourceId: Id,
  diagnostics: string[],
): string {
  if (value) return value
  if (fallback) {
    diagnostics.push(`HISTORY_EVENT_TIME_FALLBACK: ${type}:${sourceId}`)
    return fallback
  }
  diagnostics.push(`HISTORY_EVENT_TIME_MISSING: ${type}:${sourceId}`)
  return EPOCH
}

function provenance(options: LearningHistoryProjectionOptions) {
  const isSampleDerived =
    options.isSampleDerived === true || options.verificationStatus === 'SAMPLE'
  return {
    isSampleDerived,
    ...(options.verificationStatus
      ? { verificationStatus: options.verificationStatus }
      : isSampleDerived
        ? { verificationStatus: 'SAMPLE' as const }
        : {}),
  }
}

function lessonRecord(
  profileId: Id,
  session: LessonSession,
  type: 'lesson_started' | 'lesson_completed',
  occurredAt: string,
  options: LearningHistoryProjectionOptions,
): LearningHistoryRecord {
  return {
    id: historyId(profileId, type, session.id),
    profileId,
    type,
    textbookId: session.textbookId,
    unitId: session.unitId,
    lessonId: session.lessonId,
    knowledgePointId: session.knowledgePointId,
    sourceId: session.id,
    occurredAt,
    provenance: provenance(options),
  }
}

function assessmentSummary(session: QuestionSession) {
  const questionIds = new Set(session.questionIds)
  const submitted = session.attempts.filter(
    (attempt) => questionIds.has(attempt.questionId) && attempt.submitted,
  )
  const correctCount = submitted.filter((attempt) => attempt.result?.status === 'correct').length
  const incorrectCount = submitted.filter(
    (attempt) => attempt.result?.status === 'incorrect',
  ).length
  const manualReviewCount = submitted.filter(
    (attempt) => attempt.result?.status === 'manual_review_required',
  ).length
  const scorable = correctCount + incorrectCount
  return {
    questionCount: session.questionIds.length,
    correctCount,
    incorrectCount,
    manualReviewCount,
    assessmentPercentage: scorable > 0 ? Math.round((correctCount / scorable) * 100) : null,
  }
}

function assessmentRecord(
  profileId: Id,
  session: QuestionSession,
  type: 'assessment_started' | 'assessment_completed',
  occurredAt: string,
  options: LearningHistoryProjectionOptions,
): LearningHistoryRecord {
  return {
    id: historyId(profileId, type, session.id),
    profileId,
    type,
    textbookId: session.textbookId,
    unitId: session.unitId,
    lessonId: session.lessonId,
    knowledgePointId: session.knowledgePointId,
    sourceId: session.id,
    occurredAt,
    ...(type === 'assessment_completed' ? { summary: assessmentSummary(session) } : {}),
    provenance: provenance(options),
  }
}

export function buildLearningHistoryId(
  profileId: Id,
  type: LearningHistoryRecord['type'],
  sourceId: Id,
): Id {
  return historyId(profileId, type, sourceId)
}

export function projectLessonSessionToHistory(
  profileId: Id,
  session: LessonSession,
  options: LearningHistoryProjectionOptions = {},
): LearningHistoryProjectionResult {
  const diagnostics: string[] = []
  const records: LearningHistoryRecord[] = []
  if (session.status === 'in_progress' || session.status === 'completed') {
    records.push(
      lessonRecord(
        profileId,
        session,
        'lesson_started',
        eventTime(session.startedAt, session.updatedAt, 'lesson_started', session.id, diagnostics),
        options,
      ),
    )
  }
  if (session.status === 'completed') {
    records.push(
      lessonRecord(
        profileId,
        session,
        'lesson_completed',
        eventTime(
          session.completedAt,
          session.updatedAt,
          'lesson_completed',
          session.id,
          diagnostics,
        ),
        options,
      ),
    )
  }
  return { records, diagnostics }
}

export function projectQuestionSessionToHistory(
  profileId: Id,
  session: QuestionSession,
  options: LearningHistoryProjectionOptions = {},
): LearningHistoryProjectionResult {
  const diagnostics: string[] = []
  const records: LearningHistoryRecord[] = []
  if (session.status === 'in_progress' || session.status === 'completed') {
    records.push(
      assessmentRecord(
        profileId,
        session,
        'assessment_started',
        eventTime(
          session.startedAt,
          session.updatedAt,
          'assessment_started',
          session.id,
          diagnostics,
        ),
        options,
      ),
    )
  }
  if (session.status === 'completed') {
    records.push(
      assessmentRecord(
        profileId,
        session,
        'assessment_completed',
        eventTime(
          session.completedAt,
          session.updatedAt,
          'assessment_completed',
          session.id,
          diagnostics,
        ),
        options,
      ),
    )
  }
  return { records, diagnostics }
}
