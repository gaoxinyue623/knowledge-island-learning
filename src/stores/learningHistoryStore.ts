import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  learningHistoryService,
  type LearningHistoryServiceContract,
} from '@/services/learning-history'
import type {
  Id,
  LearningHistoryListOptions,
  LearningHistoryRecord,
  LearningHistoryProjectionOptions,
  LessonSession,
  QuestionSession,
} from '@/types'

export type LearningHistoryStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface LearningHistoryStoreDependencies {
  service: LearningHistoryServiceContract
}

const defaultDependencies: LearningHistoryStoreDependencies = { service: learningHistoryService }
let dependencies: LearningHistoryStoreDependencies = defaultDependencies

export function configureLearningHistoryStore(
  overrides: Partial<LearningHistoryStoreDependencies>,
): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetLearningHistoryStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useLearningHistoryStore = defineStore('learningHistory', () => {
  const profileId = ref<Id>('local-profile')
  const records = ref<LearningHistoryRecord[]>([])
  const status = ref<LearningHistoryStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const listOptions = ref<LearningHistoryListOptions>({})

  function load(
    nextProfileId = profileId.value,
    options: LearningHistoryListOptions = {},
  ): LearningHistoryRecord[] {
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
      error.value = caught instanceof Error ? caught.message : '学习记录暂时无法读取。'
      return []
    } finally {
      loading.value = false
    }
  }

  function recordLessonSession(
    session: LessonSession,
    options: LearningHistoryProjectionOptions = {},
  ) {
    const result = dependencies.service.recordLessonSession(profileId.value, session, options)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function recordQuestionSession(
    session: QuestionSession,
    options: LearningHistoryProjectionOptions = {},
  ) {
    const result = dependencies.service.recordQuestionSession(profileId.value, session, options)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function clearDemoHistory(): void {
    dependencies.service.clearDemoHistory(profileId.value)
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
    load,
    recordLessonSession,
    recordQuestionSession,
    clearDemoHistory,
    clear,
  }
})
