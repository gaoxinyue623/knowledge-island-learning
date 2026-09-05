import { defineStore } from 'pinia'
import { ref } from 'vue'

import { reviewQueueService, type ReviewQueueService } from '@/services/review-queue'
import { rewardService, type RewardServiceContract } from '@/services/reward'
import type {
  Id,
  LearningRecommendation,
  ReviewQueueItem,
  ReviewQueueListOptions,
  ReviewQueueProjectionOptions,
  ReviewQueueProjectionResult,
  RewardEvent,
} from '@/types'

export type ReviewQueueStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ReviewQueueStoreDependencies {
  service: ReviewQueueService
  rewardService: RewardServiceContract
}

const defaultDependencies: ReviewQueueStoreDependencies = {
  service: reviewQueueService,
  rewardService,
}
let dependencies: ReviewQueueStoreDependencies = defaultDependencies

export function configureReviewQueueStore(overrides: Partial<ReviewQueueStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetReviewQueueStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useReviewQueueStore = defineStore('reviewQueue', () => {
  const profileId = ref<Id>('local-profile')
  const items = ref<ReviewQueueItem[]>([])
  const status = ref<ReviewQueueStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const listOptions = ref<ReviewQueueListOptions>({})
  const lastRewardEvent = ref<RewardEvent | null>(null)

  function load(
    nextProfileId = profileId.value,
    options: ReviewQueueListOptions = {},
  ): ReviewQueueItem[] {
    profileId.value = nextProfileId
    listOptions.value = { ...options }
    status.value = 'loading'
    loading.value = true
    error.value = null
    try {
      items.value = dependencies.service.listByProfile(nextProfileId, options)
      warning.value = dependencies.service.getLastWarning()
      status.value = 'ready'
      return items.value
    } catch (caught) {
      items.value = []
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '待巩固列表暂时无法读取。'
      return []
    } finally {
      loading.value = false
    }
  }

  function project(
    recommendation: LearningRecommendation,
    options: Omit<ReviewQueueProjectionOptions, 'profileId'> & { profileId?: Id },
  ): ReviewQueueProjectionResult {
    const result = dependencies.service.projectStrategy(recommendation, {
      ...options,
      profileId: options.profileId ?? profileId.value,
    })
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function complete(itemId: Id, completedAt: string): ReviewQueueItem | null {
    const before = dependencies.service.get(profileId.value, itemId)
    const result = dependencies.service.complete(profileId.value, itemId, completedAt)
    if (before?.status === 'active' && result?.status === 'completed') {
      try {
        const reward = dependencies.rewardService.processLearningFact(
          profileId.value,
          { type: 'review_completed', item: result },
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
        warning.value = '成长反馈暂时未能保存，这项巩固仍已完成。'
      }
    }
    warning.value =
      dependencies.service.getLastWarning() ?? dependencies.rewardService.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function reopen(itemId: Id): ReviewQueueItem | null {
    const result = dependencies.service.reopen(profileId.value, itemId)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function clearDemoQueue(): void {
    dependencies.service.clearDemoQueue(profileId.value)
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
  }

  function clear(): void {
    items.value = []
    status.value = 'idle'
    error.value = null
    warning.value = null
    listOptions.value = {}
  }

  return {
    profileId,
    items,
    status,
    loading,
    error,
    warning,
    listOptions,
    lastRewardEvent,
    load,
    project,
    complete,
    reopen,
    clearDemoQueue,
    clear,
  }
})
