import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { growthService, type GrowthService } from '@/services/growth'
import type {
  GrowthOptions,
  GrowthRecord,
  GrowthSummary,
  Id,
  KnowledgeEnergyBalance,
} from '@/types'

export type GrowthStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface GrowthStoreDependencies {
  service: GrowthService
}

const defaultDependencies: GrowthStoreDependencies = { service: growthService }
let dependencies: GrowthStoreDependencies = defaultDependencies

export function configureGrowthStore(overrides: Partial<GrowthStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetGrowthStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useGrowthStore = defineStore('growth', () => {
  const profileId = ref<Id>('local-profile')
  const energy = ref<KnowledgeEnergyBalance | null>(null)
  const growth = ref<GrowthRecord | null>(null)
  const summary = ref<GrowthSummary | null>(null)
  const status = ref<GrowthStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const options = ref<GrowthOptions>({ includeSample: false })

  const knowledgeEnergy = computed(() => energy.value?.current ?? 0)
  const growthLevel = computed(() => growth.value?.growthLevel ?? 1)

  function load(
    nextProfileId = profileId.value,
    nextOptions: GrowthOptions = { includeSample: false },
  ): GrowthSummary | null {
    profileId.value = nextProfileId
    options.value = { ...nextOptions }
    status.value = 'loading'
    loading.value = true
    error.value = null
    try {
      const nextSummary = dependencies.service.getSummary(nextProfileId, nextOptions)
      summary.value = nextSummary
      energy.value = nextSummary.energy
      growth.value = nextSummary.growth
      warning.value = dependencies.service.getLastWarning()
      status.value = 'ready'
      return nextSummary
    } catch (caught) {
      summary.value = null
      energy.value = null
      growth.value = null
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '成长进度暂时无法读取。'
      return null
    } finally {
      loading.value = false
    }
  }

  function rebuild(): GrowthSummary | null {
    return load(profileId.value, options.value)
  }

  function clearDemoGrowth(): void {
    dependencies.service.clearDemoGrowth(profileId.value)
    warning.value = dependencies.service.getLastWarning()
    rebuild()
  }

  function clear(): void {
    profileId.value = 'local-profile'
    energy.value = null
    growth.value = null
    summary.value = null
    status.value = 'idle'
    loading.value = false
    error.value = null
    warning.value = null
    options.value = { includeSample: false }
  }

  return {
    profileId,
    energy,
    growth,
    summary,
    knowledgeEnergy,
    growthLevel,
    status,
    loading,
    error,
    warning,
    options,
    load,
    rebuild,
    clearDemoGrowth,
    clear,
  }
})
