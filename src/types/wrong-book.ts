import type { Id, VerificationStatus } from './domain'
import type { QuestionAttempt, QuestionSession } from './question-engine'

export type WrongQuestionStatus = 'active' | 'resolved'

export interface WrongQuestionSource {
  questionSessionIds: Id[]
}

export interface WrongQuestionProvenance {
  isSampleDerived: boolean
  verificationStatus?: VerificationStatus
}

export interface WrongQuestionRecord {
  id: Id
  profileId: Id
  questionId: Id
  knowledgePointIds: Id[]
  firstWrongAt: string
  lastWrongAt: string
  wrongCount: number
  status: WrongQuestionStatus
  resolvedAt?: string
  source: WrongQuestionSource
  provenance: WrongQuestionProvenance
  /** Optional context metadata; the question body remains owned by QuestionRepository. */
  textbookId?: Id
  textbookIds?: Id[]
  unitId?: Id
  lessonId?: Id
}

export interface WrongBookStoragePayload {
  schemaVersion: 1
  records: WrongQuestionRecord[]
  processedAttemptIds: Id[]
}

export interface WrongBookListOptions {
  includeResolved?: boolean
  includeSample?: boolean
  textbookId?: Id
}

export interface WrongBookUpsertInput {
  profileId: Id
  questionId: Id
  knowledgePointIds: readonly Id[]
  wrongAt: string
  questionSessionId: Id
  isSampleDerived: boolean
  verificationStatus?: VerificationStatus
  textbookId?: Id
  unitId?: Id
  lessonId?: Id
}

export interface WrongBookRepository {
  listByProfile(profileId: Id, options?: WrongBookListOptions): WrongQuestionRecord[]
  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options?: Omit<WrongBookListOptions, 'textbookId'>,
  ): WrongQuestionRecord[]
  get(profileId: Id, questionId: Id): WrongQuestionRecord | null
  upsertWrong(input: WrongBookUpsertInput): WrongQuestionRecord
  markResolved(profileId: Id, questionId: Id, resolvedAt: string): WrongQuestionRecord | null
  markActive(profileId: Id, questionId: Id): WrongQuestionRecord | null
  hasProcessedAttempt(processedAttemptId: Id): boolean
  markAttemptProcessed(processedAttemptId: Id): void
  clearDemoWrongBook(profileId?: Id): void
  getLastWarning(): string | null
}

export interface WrongBookProjectionOptions {
  dataset?: 'profile' | 'golden' | 'demo'
  isSampleDerived?: boolean
  verificationStatus?: VerificationStatus
  /** When provided by Question Engine, limits projection to supported questions. */
  supportedQuestionIds?: ReadonlySet<Id>
  questionKnowledgePoints?: ReadonlyMap<Id, readonly Id[]> | Record<Id, readonly Id[]>
  textbookId?: Id
  unitId?: Id
  lessonId?: Id
}

export interface WrongBookProjectionResult {
  records: WrongQuestionRecord[]
  processedAttemptIds: Id[]
  skippedAttemptIds: Id[]
  diagnostics: string[]
}

export interface WrongBookRetryLaunch {
  record: WrongQuestionRecord
  session: QuestionSession
  questionAttempt?: QuestionAttempt
  context: {
    textbookId: Id
    unitId: Id
    lessonId: Id
    knowledgePointId: Id
    source: 'wrong_book'
  }
  sessionScope: Id
}
