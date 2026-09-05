import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { rewardService, type RewardServiceContract } from '@/services/reward'
import type {
  Id,
  RewardEvent,
  RewardEventListOptions,
  RewardLearningFact,
  RewardProjectionBatchResult,
  RewardProjectionOptions,
  RewardProjectionResult,
} from '@/types'

export type RewardStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface RewardStoreDependencies {
  service: RewardServiceContract
}

const defaultDependencies: RewardStoreDependencies = { service: rewardService }
let dependencies: RewardStoreDependencies = defaultDependencies

export function configureRewardStore(overrides: Partial<RewardStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetRewardStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useRewardStore = defineStore('reward', () => {
  const profileId = ref<Id>('local-profile')
  const events = ref<RewardEvent[]>([])
  const status = ref<RewardStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const listOptions = ref<RewardEventListOptions>({ includeSample: false })
  const lastProjection = ref<RewardProjectionResult | RewardProjectionBatchResult | null>(null)

  const totalEarned = computed(() =>
    events.value.reduce((total, event) => total + event.reward.knowledgeEnergy, 0),
  )

  function load(
    nextProfileId = profileId.value,
    options: RewardEventListOptions = { includeSample: false },
  ): RewardEvent[] {
    profileId.value = nextProfileId
    listOptions.value = { ...options }
    status.value = 'loading'
    loading.value = true
    error.value = null
    try {
      events.value = dependencies.service.listByProfile(nextProfileId, options)
      warning.value = dependencies.service.getLastWarning()
      status.value = 'ready'
      return events.value
    } catch (caught) {
      events.value = []
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '成长记录暂时无法读取。'
      return []
    } finally {
      loading.value = false
    }
  }

  function processLearningFact(
    fact: RewardLearningFact,
    options: RewardProjectionOptions = {},
  ): RewardProjectionResult {
    const result = dependencies.service.processLearningFact(profileId.value, fact, options)
    lastProjection.value = result
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function processLearningFacts(
    facts: readonly RewardLearningFact[],
    options: RewardProjectionOptions = {},
  ): RewardProjectionBatchResult {
    const result = dependencies.service.processLearningFacts(profileId.value, facts, options)
    lastProjection.value = result
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
    return result
  }

  function resetDemoRewards(): void {
    dependencies.service.clearDemoRewards(profileId.value)
    lastProjection.value = null
    warning.value = dependencies.service.getLastWarning()
    load(profileId.value, listOptions.value)
  }

  function clear(): void {
    profileId.value = 'local-profile'
    events.value = []
    status.value = 'idle'
    loading.value = false
    error.value = null
    warning.value = null
    listOptions.value = { includeSample: false }
    lastProjection.value = null
  }

  return {
    profileId,
    events,
    totalEarned,
    status,
    loading,
    error,
    warning,
    listOptions,
    lastProjection,
    load,
    processLearningFact,
    processLearningFacts,
    resetDemoRewards,
    clear,
  }
})
