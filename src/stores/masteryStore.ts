import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { masteryRepository, type MasteryRepository } from '@/services/mastery/masteryRepository'
import type { Id, LearningEvidence, MasteryRecord } from '@/types'

export type MasteryStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface MasteryStoreDependencies {
  repository: MasteryRepository
}

const defaultDependencies: MasteryStoreDependencies = { repository: masteryRepository }
let dependencies: MasteryStoreDependencies = defaultDependencies

export function configureMasteryStore(overrides: Partial<MasteryStoreDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetMasteryStoreDependencies(): void {
  dependencies = defaultDependencies
}

export const useMasteryStore = defineStore('mastery', () => {
  const studentProfileId = ref<Id>('local-profile')
  const records = ref<MasteryRecord[]>([])
  const evidence = ref<LearningEvidence[]>([])
  const status = ref<MasteryStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)

  const recordByKnowledgePoint = computed(() => {
    const index = new Map<Id, MasteryRecord>()
    for (const record of records.value) index.set(record.knowledgePointId, record)
    return index
  })

  async function load(nextStudentProfileId = studentProfileId.value): Promise<MasteryRecord[]> {
    studentProfileId.value = nextStudentProfileId
    status.value = 'loading'
    loading.value = true
    error.value = null
    try {
      const loadedRecords = dependencies.repository.getMasteryRecords(nextStudentProfileId)
      const recordsWarning = dependencies.repository.getLastWarning()
      const loadedEvidence = dependencies.repository.getEvidence(nextStudentProfileId)
      const evidenceWarning = dependencies.repository.getLastWarning()
      records.value = loadedRecords
      evidence.value = loadedEvidence
      warning.value = recordsWarning ?? evidenceWarning
      status.value = 'ready'
      return records.value
    } catch (caught) {
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '掌握度记录暂时无法加载。'
      return []
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<MasteryRecord[]> {
    return load(studentProfileId.value)
  }

  function getByKnowledgePoint(knowledgePointId: Id): MasteryRecord | null {
    return recordByKnowledgePoint.value.get(knowledgePointId) ?? null
  }

  function resetDemoMastery(): boolean {
    const currentStudent = studentProfileId.value
    const currentEvidence = dependencies.repository.getEvidence(currentStudent)
    dependencies.repository.replaceEvidenceForStudent(
      currentStudent,
      currentEvidence.filter((item) => item.metadata?.isSample !== true),
    )
    dependencies.repository.removeRecordsWhere(currentStudent, (record) => record.isSampleDerived)
    void load(currentStudent)
    return true
  }

  function clearStudentMastery(): boolean {
    dependencies.repository.clearStudent(studentProfileId.value)
    records.value = []
    evidence.value = []
    warning.value = dependencies.repository.getLastWarning()
    return true
  }

  return {
    studentProfileId,
    records,
    evidence,
    status,
    loading,
    error,
    warning,
    load,
    refresh,
    getByKnowledgePoint,
    resetDemoMastery,
    clearStudentMastery,
  }
})
