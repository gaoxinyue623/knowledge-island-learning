import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { achievementService, type AchievementService } from '@/services/achievement'
import type {
  AchievementEvaluationOptions,
  AchievementProgress,
  AchievementUnlock,
  Id,
} from '@/types'

export type AchievementStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AchievementStoreDependencies {
  service: AchievementService
}

const defaultDependencies: AchievementStoreDependencies = { service: achievementService }
let dependencies: AchievementStoreDependencies = defaultDependencies

export function configureAchievementStore(overrides: Partial<AchievementStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetAchievementStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useAchievementStore = defineStore('achievement', () => {
  const profileId = ref<Id>('local-profile')
  const progress = ref<AchievementProgress[]>([])
  const newUnlocks = ref<AchievementUnlock[]>([])
  const facts = ref<ReturnType<AchievementService['evaluate']>['facts'] | null>(null)
  const status = ref<AchievementStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const options = ref<AchievementEvaluationOptions>({ includeSample: false })

  const unlockedCount = computed(
    () => progress.value.filter((item) => item.status === 'unlocked').length,
  )

  function load(
    nextProfileId = profileId.value,
    nextOptions: AchievementEvaluationOptions = { includeSample: false },
  ): AchievementProgress[] {
    profileId.value = nextProfileId
    options.value = { ...nextOptions }
    status.value = 'loading'
    loading.value = true
    error.value = null
    try {
      const result = dependencies.service.evaluate(nextProfileId, nextOptions)
      progress.value = result.progress
      newUnlocks.value = result.unlocks
      facts.value = result.facts
      warning.value = dependencies.service.getLastWarning()
      status.value = 'ready'
      return progress.value
    } catch (caught) {
      progress.value = []
      newUnlocks.value = []
      facts.value = null
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '里程碑暂时无法读取。'
      return []
    } finally {
      loading.value = false
    }
  }

  function refresh(): AchievementProgress[] {
    return load(profileId.value, options.value)
  }

  function clearDemoAchievements(): void {
    dependencies.service.clearDemoAchievements(profileId.value)
    warning.value = dependencies.service.getLastWarning()
    refresh()
  }

  function clear(): void {
    profileId.value = 'local-profile'
    progress.value = []
    newUnlocks.value = []
    facts.value = null
    status.value = 'idle'
    loading.value = false
    error.value = null
    warning.value = null
    options.value = { includeSample: false }
  }

  return {
    profileId,
    progress,
    newUnlocks,
    facts,
    unlockedCount,
    status,
    loading,
    error,
    warning,
    options,
    load,
    refresh,
    clearDemoAchievements,
    clear,
  }
})
