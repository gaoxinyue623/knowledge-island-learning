import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  questionSessionStorage,
  type QuestionSessionStorage,
} from '@/services/question-engine/questionSessionStorage'
import { wrongBookService, type WrongBookService } from '@/services/wrong-book'
import { rewardService, type RewardServiceContract } from '@/services/reward'
import type {
  Id,
  QuestionSession,
  WrongBookListOptions,
  WrongBookProjectionOptions,
  WrongBookProjectionResult,
  WrongBookRetryLaunch,
  WrongQuestionRecord,
  RewardEvent,
} from '@/types'

export type WrongBookStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface WrongBookStoreDependencies {
  service: WrongBookService
  questionSessionStorage: QuestionSessionStorage
  rewardService: RewardServiceContract
}

const defaultDependencies: WrongBookStoreDependencies = {
  service: wrongBookService,
  questionSessionStorage,
  rewardService,
}
let dependencies: WrongBookStoreDependencies = defaultDependencies

export function configureWrongBookStore(overrides: Partial<WrongBookStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetWrongBookStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useWrongBookStore = defineStore('wrongBook', () => {
  const profileId = ref<Id>('local-profile')
  const records = ref<WrongQuestionRecord[]>([])
  const status = ref<WrongBookStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const listOptions = ref<WrongBookListOptions>({})
  const lastRewardEvent = ref<RewardEvent | null>(null)

  function load(
    nextProfileId = profileId.value,
    options: WrongBookListOptions = {},
  ): WrongQuestionRecord[] {
    profileId.value = nextProfileId
    listOptions.value = { ...options }
    status.value = 'loading'
    loading.value = true
    error.value = null
    try {
      records.value = dependencies.service.listByProfile(nextProfileId, options)
      warning.value = dependencies.service.getLastWarning()
      status.value = 'ready'
      return records.value
    } catch (caught) {
      records.value = []
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '错题本暂时无法读取。'
      return []
    } finally {
      loading.value = false
    }
  }

  function processSession(
    session: QuestionSession,
    options: WrongBookProjectionOptions = {},
  ): WrongBookProjectionResult {
    const result = dependencies.service.projectQuestionSession(profileId.value, session, options)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function resolveRetry(
    session: QuestionSession,
    questionId: Id,
    resolvedAt: string,
    options: WrongBookProjectionOptions = {},
  ): WrongBookProjectionResult {
    const before = dependencies.service.get(profileId.value, questionId)
    const result = dependencies.service.resolveRetry(
      profileId.value,
      session,
      questionId,
      resolvedAt,
      options,
    )
    const resolved = result.records.find(
      (record) => record.questionId === questionId && record.status === 'resolved',
    )
    if (before?.status === 'active' && resolved) {
      try {
        const reward = dependencies.rewardService.processLearningFact(
          profileId.value,
          { type: 'wrong_question_resolved', record: resolved },
          {
            dataset: resolved.provenance.isSampleDerived ? 'demo' : 'profile',
            isSampleDerived: resolved.provenance.isSampleDerived,
            ...(resolved.provenance.verificationStatus
              ? { verificationStatus: resolved.provenance.verificationStatus }
              : {}),
          },
        )
        lastRewardEvent.value = reward.event
      } catch {
        warning.value = '成长反馈暂时未能保存，这道错题仍已解决。'
      }
    }
    warning.value =
      dependencies.service.getLastWarning() ?? dependencies.rewardService.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function getRetryLaunch(record: WrongQuestionRecord): WrongBookRetryLaunch | null {
    if (record.profileId !== profileId.value) return null
    const textbookIds = new Set([
      ...(record.textbookId ? [record.textbookId] : []),
      ...(record.textbookIds ?? []),
    ])
    const sourceSessions = record.source.questionSessionIds
      .map((sessionId) => dependencies.questionSessionStorage.get(sessionId))
      .filter((session): session is QuestionSession =>
        Boolean(session?.attempts.some((attempt) => attempt.questionId === record.questionId)),
      )
    const sourceSession = [...sourceSessions].sort((left, right) => {
      const leftMatches = textbookIds.size === 0 || textbookIds.has(left.textbookId)
      const rightMatches = textbookIds.size === 0 || textbookIds.has(right.textbookId)
      return (
        Number(rightMatches) - Number(leftMatches) ||
        (right.updatedAt ?? right.completedAt ?? right.startedAt ?? '').localeCompare(
          left.updatedAt ?? left.completedAt ?? left.startedAt ?? '',
        ) ||
        right.id.localeCompare(left.id)
      )
    })[0]
    if (!sourceSession) return null
    return {
      record,
      session: sourceSession,
      questionAttempt: sourceSession.attempts.find(
        (attempt) => attempt.questionId === record.questionId,
      ),
      context: {
        textbookId: sourceSession.textbookId,
        unitId: sourceSession.unitId,
        lessonId: sourceSession.lessonId,
        knowledgePointId: sourceSession.knowledgePointId,
        source: 'wrong_book',
      },
      sessionScope: `wrong-book:${record.id}:${sourceSession.id}`,
    }
  }

  function markResolved(questionId: Id, resolvedAt: string): WrongQuestionRecord | null {
    const before = dependencies.service.get(profileId.value, questionId)
    const result = dependencies.service.markResolved(profileId.value, questionId, resolvedAt)
    if (before?.status === 'active' && result?.status === 'resolved') {
      try {
        const reward = dependencies.rewardService.processLearningFact(
          profileId.value,
          { type: 'wrong_question_resolved', record: result },
          {
            dataset: result.provenance.isSampleDerived ? 'demo' : 'profile',
            isSampleDerived: result.provenance.isSampleDerived,
            ...(result.provenance.verificationStatus
              ? { verificationStatus: result.provenance.verificationStatus }
              : {}),
          },
        )
        lastRewardEvent.value = reward.event
      } catch {
        warning.value = '成长反馈暂时未能保存，这道错题仍已解决。'
      }
    }
    warning.value =
      dependencies.service.getLastWarning() ?? dependencies.rewardService.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function markActive(questionId: Id): WrongQuestionRecord | null {
    const result = dependencies.service.markActive(profileId.value, questionId)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function clearDemoWrongBook(): void {
    dependencies.service.clearDemoWrongBook(profileId.value)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
  }

  function clear(): void {
    records.value = []
    status.value = 'idle'
    error.value = null
    warning.value = null
    listOptions.value = {}
  }

  return {
    profileId,
    records,
    status,
    loading,
    error,
    warning,
    listOptions,
    lastRewardEvent,
    load,
    processSession,
    resolveRetry,
    getRetryLaunch,
    markResolved,
    markActive,
    clearDemoWrongBook,
    clear,
  }
})
