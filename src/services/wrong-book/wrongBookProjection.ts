import type {
  Id,
  QuestionSession,
  WrongBookProjectionOptions,
  WrongBookProjectionResult,
  WrongBookRepository,
  WrongQuestionRecord,
} from '@/types'

import { buildQuestionAttemptProjectionId } from './wrongBookRepository'
import { wrongBookRepository } from './wrongBookRepository'

const EPOCH = '1970-01-01T00:00:00.000Z'
const UNSAFE_PROVENANCE = new Set(['SAMPLE', 'UNVERIFIED', 'REJECTED'])

function mappingIds(
  questionId: Id,
  session: QuestionSession,
  options: WrongBookProjectionOptions,
): Id[] {
  const mappings = options.questionKnowledgePoints
  const fromMap =
    mappings instanceof Map
      ? mappings.get(questionId)
      : mappings
        ? (mappings as Record<Id, readonly Id[]>)[questionId]
        : undefined
  return [...new Set([...(fromMap ?? []), session.knowledgePointId])].filter(Boolean).sort()
}

function provenanceIsSample(options: WrongBookProjectionOptions): boolean {
  return options.isSampleDerived === true || options.dataset === 'demo'
}

function sourceIsUnsafe(options: WrongBookProjectionOptions): boolean {
  return provenanceIsSample(options) || UNSAFE_PROVENANCE.has(options.verificationStatus ?? '')
}

function wrongAt(
  session: QuestionSession,
  submittedAt: string | undefined,
  diagnostics: string[],
): string {
  if (submittedAt) return submittedAt
  const fallback = session.completedAt ?? session.updatedAt ?? session.startedAt
  if (fallback) {
    diagnostics.push(`WRONG_BOOK_TIME_FALLBACK: ${session.id}`)
    return fallback
  }
  diagnostics.push(`WRONG_BOOK_TIME_MISSING: ${session.id}`)
  return EPOCH
}

export class WrongBookProjectionService {
  constructor(private readonly repository: WrongBookRepository = wrongBookRepository) {}

  projectQuestionSession(
    profileId: Id,
    session: QuestionSession,
    options: WrongBookProjectionOptions = {},
  ): WrongBookProjectionResult {
    const diagnostics: string[] = []
    const records: WrongQuestionRecord[] = []
    const processedAttemptIds: string[] = []
    const skippedAttemptIds: string[] = []
    const sampleDerived = provenanceIsSample(options)
    if (options.dataset === 'profile' && sourceIsUnsafe(options)) {
      diagnostics.push(`WRONG_BOOK_SOURCE_NOT_ALLOWED: ${session.id}`)
      return { records, processedAttemptIds, skippedAttemptIds, diagnostics }
    }

    const sessionQuestionIds = new Set(session.questionIds)
    for (const attempt of session.attempts) {
      if (!attempt.submitted) continue
      const processedId = buildQuestionAttemptProjectionId(
        profileId,
        session.id,
        attempt.questionId,
      )
      if (this.repository.hasProcessedAttempt(processedId)) continue
      if (attempt.result?.status !== 'incorrect') {
        this.repository.markAttemptProcessed(processedId)
        processedAttemptIds.push(processedId)
      }
      if (!sessionQuestionIds.has(attempt.questionId)) {
        diagnostics.push(`WRONG_BOOK_ATTEMPT_ORPHAN: ${attempt.questionId}`)
        skippedAttemptIds.push(processedId)
        continue
      }
      if (options.supportedQuestionIds && !options.supportedQuestionIds.has(attempt.questionId)) {
        diagnostics.push(`WRONG_BOOK_UNSUPPORTED_QUESTION: ${attempt.questionId}`)
        skippedAttemptIds.push(processedId)
        continue
      }
      if (attempt.result?.status !== 'incorrect') {
        if (!attempt.result) diagnostics.push(`WRONG_BOOK_ATTEMPT_NO_RESULT: ${attempt.questionId}`)
        skippedAttemptIds.push(processedId)
        continue
      }
      const knowledgePointIds = mappingIds(attempt.questionId, session, options)
      if (!knowledgePointIds.length) {
        diagnostics.push(`WRONG_BOOK_KNOWLEDGE_POINT_MISSING: ${attempt.questionId}`)
        skippedAttemptIds.push(processedId)
        continue
      }
      records.push(
        this.repository.upsertWrong({
          profileId,
          questionId: attempt.questionId,
          knowledgePointIds,
          wrongAt: wrongAt(session, attempt.submittedAt, diagnostics),
          questionSessionId: session.id,
          isSampleDerived: sampleDerived,
          ...(options.verificationStatus
            ? { verificationStatus: options.verificationStatus }
            : sampleDerived
              ? { verificationStatus: 'SAMPLE' as const }
              : {}),
          ...(options.textbookId ? { textbookId: options.textbookId } : {}),
          ...(options.unitId ? { unitId: options.unitId } : {}),
          ...(options.lessonId ? { lessonId: options.lessonId } : {}),
        }),
      )
      if (this.repository.getLastWarning()) {
        diagnostics.push(`WRONG_BOOK_STORAGE_FAILED: ${attempt.questionId}`)
        return { records, processedAttemptIds, skippedAttemptIds, diagnostics }
      }
      this.repository.markAttemptProcessed(processedId)
      processedAttemptIds.push(processedId)
    }
    return { records, processedAttemptIds, skippedAttemptIds, diagnostics }
  }

  resolveRetry(
    profileId: Id,
    session: QuestionSession,
    questionId: Id,
    resolvedAt: string,
    options: WrongBookProjectionOptions = {},
  ): WrongBookProjectionResult {
    const projection = this.projectQuestionSession(profileId, session, options)
    const attempt = session.attempts.find(
      (candidate) => candidate.questionId === questionId && candidate.submitted,
    )
    if (attempt?.result?.status === 'correct') {
      const resolved = this.repository.markResolved(profileId, questionId, resolvedAt)
      if (resolved) projection.records.push(resolved)
      else projection.diagnostics.push(`WRONG_BOOK_RECORD_NOT_FOUND: ${questionId}`)
    }
    return projection
  }
}

export const wrongBookProjectionService = new WrongBookProjectionService()
