import { defineStore } from 'pinia'
import { ref } from 'vue'

import { phase14DemoProfile } from '@/data/home'
import { homeService, type HomeService } from '@/services/home'
import type { HomeLoadOptions, HomeViewModel, Id, StudentCurriculumProfile } from '@/types'

export type HomeStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface HomeStoreDependencies {
  service: HomeService
}

const defaultDependencies: HomeStoreDependencies = { service: homeService }
let dependencies: HomeStoreDependencies = defaultDependencies

export function configureHomeStore(overrides: Partial<HomeStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetHomeStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useHomeStore = defineStore('home', () => {
  const profileId = ref<Id>('local-profile')
  const profile = ref<StudentCurriculumProfile | null>(null)
  const viewModel = ref<HomeViewModel | null>(null)
  const status = ref<HomeStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const options = ref<HomeLoadOptions>({})

  async function load(
    nextProfile?: StudentCurriculumProfile,
    nextOptions: HomeLoadOptions = options.value,
  ): Promise<HomeViewModel | null> {
    const dataset = nextOptions.dataset ?? 'profile'
    const resolvedProfile = nextProfile ?? (dataset === 'demo' ? phase14DemoProfile : profile.value)
    profile.value = resolvedProfile ?? null
    profileId.value = resolvedProfile?.studentId ?? 'local-profile'
    options.value = { ...nextOptions }
    status.value = 'loading'
    loading.value = true
    error.value = null
    warning.value = null
    if (!resolvedProfile) {
      status.value = 'error'
      error.value = '还没有完成学习配置，请先完成地区、年级和教材选择。'
      loading.value = false
      return null
    }
    try {
      if (dataset === 'demo' && nextOptions.seedDemo !== false) {
        dependencies.service.seedDemoData(resolvedProfile.studentId)
      }
      const nextViewModel = await dependencies.service.load(resolvedProfile, nextOptions)
      viewModel.value = nextViewModel
      warning.value = nextViewModel.warnings[0] ?? null
      status.value = 'ready'
      return nextViewModel
    } catch (caught) {
      viewModel.value = null
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '首页暂时无法读取学习内容。'
      return null
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<HomeViewModel | null> {
    return load(profile.value ?? undefined, options.value)
  }

  function clearDemoPlans(): void {
    dependencies.service.clearDemoPlans(profileId.value)
    warning.value = null
    void refresh()
  }

  function clear(): void {
    profileId.value = 'local-profile'
    profile.value = null
    viewModel.value = null
    status.value = 'idle'
    loading.value = false
    error.value = null
    warning.value = null
    options.value = {}
  }

  return {
    profileId,
    profile,
    viewModel,
    status,
    loading,
    error,
    warning,
    options,
    load,
    refresh,
    clearDemoPlans,
    clear,
  }
})
