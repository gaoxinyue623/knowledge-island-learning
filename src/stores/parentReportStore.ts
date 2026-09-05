import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  parentReportPreferencesStorage,
  parentReportService,
  type ParentReportService,
} from '@/services/parent-report'
import type {
  Id,
  ParentReport,
  ParentReportOptions,
  ParentReportPreferencesStorage,
  ParentReportRangePreset,
  ParentReportStoreLoadOptions,
  ParentReportSubjectFilter,
  ParentReportPreferencesPayload,
  ParentReportStoreStatus,
  StudentCurriculumProfile,
} from '@/types'

export interface ParentReportStoreDependencies {
  service: Pick<ParentReportService, 'loadReport'>
  preferencesStorage: ParentReportPreferencesStorage
}

const defaultDependencies: ParentReportStoreDependencies = {
  service: parentReportService,
  preferencesStorage: parentReportPreferencesStorage,
}

let dependencies: ParentReportStoreDependencies = defaultDependencies

export function configureParentReportStore(
  overrides: Partial<ParentReportStoreDependencies>,
): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetParentReportStoreDependencies(): void {
  dependencies = defaultDependencies
}

function readPreferences(storage: ParentReportPreferencesStorage): {
  payload: ParentReportPreferencesPayload | null
  warning: string | null
} {
  try {
    const payload = storage.load()
    return { payload, warning: storage.getLastWarning() }
  } catch {
    return { payload: null, warning: '报告筛选偏好暂时无法读取，将使用默认设置。' }
  }
}

export const useParentReportStore = defineStore('parentReport', () => {
  const initialPreferences = readPreferences(dependencies.preferencesStorage)
  const selectedProfileId = ref<Id>('local-profile')
  const selectedRange = ref<ParentReportRangePreset>(
    initialPreferences.payload?.selectedRange ?? '7d',
  )
  const selectedSubject = ref<ParentReportSubjectFilter>(
    initialPreferences.payload?.selectedSubject ?? 'ALL',
  )
  const profile = ref<StudentCurriculumProfile | null>(null)
  const report = ref<ParentReport | null>(null)
  const status = ref<ParentReportStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(initialPreferences.warning)
  const loadOptions = ref<ParentReportOptions>({})

  function savePreferences(): void {
    const payload: ParentReportPreferencesPayload = {
      schemaVersion: 1,
      selectedRange: selectedRange.value,
      selectedSubject: selectedSubject.value,
    }
    try {
      dependencies.preferencesStorage.save(payload)
      warning.value = dependencies.preferencesStorage.getLastWarning()
    } catch {
      warning.value = '报告筛选偏好暂时无法保存，本次查看仍可继续。'
    }
  }

  async function loadReport(
    nextProfileId = selectedProfileId.value,
    nextOptions: ParentReportStoreLoadOptions = loadOptions.value,
  ): Promise<ParentReport | null> {
    selectedProfileId.value = nextProfileId
    profile.value = nextOptions.profile ?? profile.value
    loadOptions.value = {
      dataset: nextOptions.dataset,
      range: nextOptions.range,
      subject: nextOptions.subject,
      now: nextOptions.now,
      profile: nextOptions.profile,
      demoScenario: nextOptions.demoScenario,
      demoFacts: nextOptions.demoFacts,
    }
    status.value = 'loading'
    loading.value = true
    error.value = null
    warning.value = null
    try {
      const nextReport = await dependencies.service.loadReport(nextProfileId, {
        ...nextOptions,
        range: nextOptions.range ?? selectedRange.value,
        subject: nextOptions.subject ?? selectedSubject.value,
      })
      report.value = nextReport
      warning.value = nextReport.diagnostics[0] ?? null
      status.value = 'ready'
      return nextReport
    } catch (caught) {
      report.value = null
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '学习报告暂时无法读取。'
      return null
    } finally {
      loading.value = false
    }
  }

  async function changeRange(nextRange: ParentReportRangePreset): Promise<ParentReport | null> {
    selectedRange.value = nextRange
    savePreferences()
    return loadReport(selectedProfileId.value, { ...loadOptions.value, range: nextRange })
  }

  async function changeSubject(
    nextSubject: ParentReportSubjectFilter,
  ): Promise<ParentReport | null> {
    selectedSubject.value = nextSubject
    savePreferences()
    return loadReport(selectedProfileId.value, { ...loadOptions.value, subject: nextSubject })
  }

  async function refresh(): Promise<ParentReport | null> {
    return loadReport(selectedProfileId.value, loadOptions.value)
  }

  function resetDevReport(): void {
    try {
      dependencies.preferencesStorage.clear()
    } catch {
      warning.value = '报告筛选偏好暂时无法重置。'
    }
    selectedRange.value = '7d'
    selectedSubject.value = 'ALL'
    report.value = null
    status.value = 'idle'
    loading.value = false
    error.value = null
    warning.value = dependencies.preferencesStorage.getLastWarning()
  }

  function clear(): void {
    selectedProfileId.value = 'local-profile'
    selectedRange.value = '7d'
    selectedSubject.value = 'ALL'
    profile.value = null
    report.value = null
    status.value = 'idle'
    loading.value = false
    error.value = null
    warning.value = null
    loadOptions.value = {}
  }

  return {
    selectedProfileId,
    selectedRange,
    selectedSubject,
    profile,
    report,
    status,
    loading,
    error,
    warning,
    loadOptions,
    loadReport,
    changeRange,
    changeSubject,
    refresh,
    resetDevReport,
    clear,
  }
})
