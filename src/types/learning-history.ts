import type { Id, VerificationStatus } from './domain'
import type { LessonSession } from './lesson-player'
import type { QuestionSession } from './question-engine'

export type LearningHistoryType =
  'lesson_started' | 'lesson_completed' | 'assessment_started' | 'assessment_completed'

export interface LearningHistorySummary {
  questionCount?: number
  correctCount?: number
  incorrectCount?: number
  manualReviewCount?: number
  assessmentPercentage?: number | null
}

export interface LearningHistoryProvenance {
  isSampleDerived: boolean
  verificationStatus?: VerificationStatus
}

export interface LearningHistoryRecord {
  id: Id
  profileId: Id
  type: LearningHistoryType
  textbookId: Id
  unitId: Id
  lessonId: Id
  knowledgePointId: Id
  sourceId: Id
  occurredAt: string
  summary?: LearningHistorySummary
  provenance: LearningHistoryProvenance
}

export interface LearningHistoryStoragePayload {
  schemaVersion: 1
  records: LearningHistoryRecord[]
}

export interface LearningHistoryListOptions {
  includeSample?: boolean
  textbookId?: Id
}

export interface LearningHistoryRepository {
  append(record: LearningHistoryRecord): LearningHistoryRecord
  appendMany(records: readonly LearningHistoryRecord[]): LearningHistoryRecord[]
  listByProfile(profileId: Id, options?: LearningHistoryListOptions): LearningHistoryRecord[]
  listByKnowledgePoint(
    profileId: Id,
    knowledgePointId: Id,
    options?: LearningHistoryListOptions,
  ): LearningHistoryRecord[]
  listByLesson(
    profileId: Id,
    lessonId: Id,
    options?: LearningHistoryListOptions,
  ): LearningHistoryRecord[]
  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options?: Omit<LearningHistoryListOptions, 'textbookId'>,
  ): LearningHistoryRecord[]
  clearDemoHistory(profileId?: Id): void
  getLastWarning(): string | null
}

export interface LearningHistoryProjectionOptions {
  isSampleDerived?: boolean
  verificationStatus?: VerificationStatus
}

export interface LearningHistoryProjectionResult {
  records: LearningHistoryRecord[]
  diagnostics: string[]
}

export interface LearningHistoryProjectionSource {
  lessonSession?: LessonSession
  questionSession?: QuestionSession
}
