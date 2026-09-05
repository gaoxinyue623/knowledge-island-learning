import type {
  Id,
  WrongBookListOptions,
  WrongBookRepository,
  WrongBookUpsertInput,
  WrongQuestionRecord,
} from '@/types'

import { wrongBookStorage } from './wrongBookStorage'
import type { WrongBookStorage } from './wrongBookStorage'

function clone(record: WrongQuestionRecord): WrongQuestionRecord {
  return {
    ...record,
    knowledgePointIds: [...record.knowledgePointIds],
    source: { questionSessionIds: [...record.source.questionSessionIds] },
    provenance: { ...record.provenance },
    ...(record.textbookIds ? { textbookIds: [...record.textbookIds] } : {}),
  }
}

function sortWrongBook(left: WrongQuestionRecord, right: WrongQuestionRecord): number {
  return (
    (left.status === 'active' ? 0 : 1) - (right.status === 'active' ? 0 : 1) ||
    right.lastWrongAt.localeCompare(left.lastWrongAt) ||
    right.wrongCount - left.wrongCount ||
    left.questionId.localeCompare(right.questionId) ||
    left.id.localeCompare(right.id)
  )
}

function matches(record: WrongQuestionRecord, options: WrongBookListOptions): boolean {
  if (!options.includeResolved && record.status !== 'active') return false
  if (options.includeSample === false && record.provenance.isSampleDerived) return false
  if (options.textbookId) {
    const textbookIds = new Set([
      ...(record.textbookId ? [record.textbookId] : []),
      ...(record.textbookIds ?? []),
    ])
    if (!textbookIds.has(options.textbookId)) return false
  }
  return true
}

function mergedTextbookIds(record: WrongQuestionRecord, textbookId?: Id): Id[] {
  return [
    ...new Set([
      ...(record.textbookId ? [record.textbookId] : []),
      ...(record.textbookIds ?? []),
      ...(textbookId ? [textbookId] : []),
    ]),
  ].sort()
}

export function buildWrongQuestionRecordId(profileId: Id, questionId: Id): Id {
  return `wrong-question:${profileId}:${questionId}`
}

export function buildQuestionAttemptProjectionId(
  profileId: Id,
  questionSessionId: Id,
  questionId: Id,
): Id {
  return `wrong-attempt:${profileId}:${questionSessionId}:${questionId}`
}

function placeholder(input: WrongBookUpsertInput): WrongQuestionRecord {
  return {
    id: buildWrongQuestionRecordId(input.profileId, input.questionId),
    profileId: input.profileId,
    questionId: input.questionId,
    knowledgePointIds: [],
    firstWrongAt: input.wrongAt,
    lastWrongAt: input.wrongAt,
    wrongCount: 1,
    status: 'active',
    source: { questionSessionIds: [] },
    provenance: { isSampleDerived: input.isSampleDerived },
    ...(input.textbookId ? { textbookId: input.textbookId } : {}),
  }
}

export function createWrongBookRepository(
  storage: WrongBookStorage = wrongBookStorage,
): WrongBookRepository {
  function payload() {
    return storage.load()
  }

  return {
    listByProfile(profileId, options = {}) {
      return payload()
        .records.filter((record) => record.profileId === profileId && matches(record, options))
        .sort(sortWrongBook)
        .map(clone)
    },
    listByTextbook(profileId, textbookId, options = {}) {
      return this.listByProfile(profileId, { ...options, textbookId })
    },
    get(profileId, questionId) {
      const record = payload().records.find(
        (candidate) => candidate.profileId === profileId && candidate.questionId === questionId,
      )
      return record ? clone(record) : null
    },
    upsertWrong(input) {
      const nextPayload = payload()
      const recordId = buildWrongQuestionRecordId(input.profileId, input.questionId)
      const existingIndex = nextPayload.records.findIndex((record) => record.id === recordId)
      const existing = existingIndex >= 0 ? nextPayload.records[existingIndex] : undefined
      const base = existing ?? placeholder(input)
      const knowledgePointIds = [
        ...new Set([...(existing?.knowledgePointIds ?? []), ...input.knowledgePointIds]),
      ].sort()
      const firstWrongAt = existing
        ? existing.firstWrongAt.localeCompare(input.wrongAt) <= 0
          ? existing.firstWrongAt
          : input.wrongAt
        : input.wrongAt
      const lastWrongAt = existing
        ? existing.lastWrongAt.localeCompare(input.wrongAt) >= 0
          ? existing.lastWrongAt
          : input.wrongAt
        : input.wrongAt
      const next: WrongQuestionRecord = {
        ...base,
        id: recordId,
        profileId: input.profileId,
        questionId: input.questionId,
        knowledgePointIds,
        firstWrongAt,
        lastWrongAt,
        wrongCount: (existing?.wrongCount ?? 0) + 1,
        status: 'active',
        source: {
          questionSessionIds: [
            ...new Set([...(existing?.source.questionSessionIds ?? []), input.questionSessionId]),
          ].sort(),
        },
        provenance: {
          isSampleDerived: Boolean(existing?.provenance.isSampleDerived || input.isSampleDerived),
          ...(input.verificationStatus
            ? { verificationStatus: input.verificationStatus }
            : existing?.provenance.verificationStatus
              ? { verificationStatus: existing.provenance.verificationStatus }
              : {}),
        },
        textbookIds: mergedTextbookIds(base, input.textbookId),
        ...(input.textbookId
          ? { textbookId: input.textbookId }
          : existing?.textbookId
            ? { textbookId: existing.textbookId }
            : {}),
        ...(input.unitId
          ? { unitId: input.unitId }
          : existing?.unitId
            ? { unitId: existing.unitId }
            : {}),
        ...(input.lessonId
          ? { lessonId: input.lessonId }
          : existing?.lessonId
            ? { lessonId: existing.lessonId }
            : {}),
      }
      delete next.resolvedAt
      if (existingIndex >= 0) nextPayload.records[existingIndex] = next
      else nextPayload.records.push(next)
      storage.save(nextPayload)
      return clone(next)
    },
    markResolved(profileId, questionId, resolvedAt) {
      const nextPayload = payload()
      const index = nextPayload.records.findIndex(
        (record) => record.profileId === profileId && record.questionId === questionId,
      )
      if (index < 0) return null
      const next = {
        ...nextPayload.records[index],
        status: 'resolved' as const,
        resolvedAt,
      }
      nextPayload.records[index] = next
      storage.save(nextPayload)
      return clone(next)
    },
    markActive(profileId, questionId) {
      const nextPayload = payload()
      const index = nextPayload.records.findIndex(
        (record) => record.profileId === profileId && record.questionId === questionId,
      )
      if (index < 0) return null
      const next = { ...nextPayload.records[index], status: 'active' as const }
      delete next.resolvedAt
      nextPayload.records[index] = next
      storage.save(nextPayload)
      return clone(next)
    },
    hasProcessedAttempt(processedAttemptId) {
      return payload().processedAttemptIds.includes(processedAttemptId)
    },
    markAttemptProcessed(processedAttemptId) {
      const nextPayload = payload()
      if (nextPayload.processedAttemptIds.includes(processedAttemptId)) return
      nextPayload.processedAttemptIds.push(processedAttemptId)
      nextPayload.processedAttemptIds.sort()
      storage.save(nextPayload)
    },
    clearDemoWrongBook(profileId) {
      const nextPayload = payload()
      const demoRecords = nextPayload.records.filter(
        (record) =>
          record.provenance.isSampleDerived && (!profileId || record.profileId === profileId),
      )
      const demoSessionIds = new Set(
        demoRecords.flatMap((record) => record.source.questionSessionIds),
      )
      nextPayload.records = nextPayload.records.filter(
        (record) =>
          !record.provenance.isSampleDerived ||
          (profileId !== undefined && record.profileId !== profileId),
      )
      if (demoSessionIds.size > 0) {
        nextPayload.processedAttemptIds = nextPayload.processedAttemptIds.filter(
          (attemptId) =>
            ![...demoSessionIds].some((sessionId) => attemptId.includes(`:${sessionId}:`)),
        )
      }
      storage.save(nextPayload)
    },
    getLastWarning() {
      return storage.getLastWarning()
    },
  }
}

export const wrongBookRepository = createWrongBookRepository()
