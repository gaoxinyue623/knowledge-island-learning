import {
  lessonSessionStorage,
  buildLessonSessionId,
} from '@/services/lesson-player/lessonSessionStorage'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  buildLearningMapViewModel,
  learningMapRepository,
  createLearningMapProgressStorage,
  type LearningMapRepository,
  type LearningMapProgressStorage,
} from '@/services/learning-map'
import type {
  Id,
  KnowledgeMapNode,
  LearningMapCurriculumSource,
  LearningMapDataset,
  LearningMapLoadState,
  LearningMapProgressRecord,
  LearningMapViewModel,
  MasteryRecord,
} from '@/types'

export interface LearningMapStoreOptions {
  repository?: LearningMapRepository
  progressStorage?: LearningMapProgressStorage
}

export interface LearningMapLoadOptions {
  dataset?: LearningMapDataset
  profileId?: Id
  textbookId?: Id
  isReadOnly?: boolean
  masteryRecords?: readonly MasteryRecord[]
}

export const useLearningMapStore = defineStore('learningMap', () => {
  const repository = learningMapRepository
  const progressStorage = createLearningMapProgressStorage()
  const viewModel = ref<LearningMapViewModel | null>(null)
  const activeSource = ref<LearningMapCurriculumSource | null>(null)
  const activeTextbookId = ref<Id | null>(null)
  const activeUnitId = ref<Id | null>(null)
  const selectedNodeId = ref<Id | null>(null)
  const focusedNodeId = ref<Id | null>(null)
  const mapProgress = ref<LearningMapProgressRecord[]>([])
  const masteryRecords = ref<readonly MasteryRecord[] | undefined>(undefined)
  const status = ref<LearningMapLoadState>('loading')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dataset = ref<LearningMapDataset>('profile')
  const readOnly = ref(false)
  const profileId = ref('local-profile')
  let loadGeneration = 0

  const selectedNode = computed(() => {
    if (!viewModel.value || !selectedNodeId.value) return null
    return findNode(viewModel.value, selectedNodeId.value)
  })
  const focusedNode = computed(() => {
    if (!viewModel.value || !focusedNodeId.value) return null
    return findNode(viewModel.value, focusedNodeId.value)
  })
  const currentNode = computed(() => {
    if (!viewModel.value || !viewModel.value.currentNodeId) return null
    return findNode(viewModel.value, viewModel.value.currentNodeId)
  })

  function refreshViewModel() {
    const source = activeSource.value
    if (!source) return
    viewModel.value = buildLearningMapViewModel(source, mapProgress.value, {
      dataset: dataset.value,
      isReadOnly: readOnly.value,
      ...(masteryRecords.value ? { masteryRecords: masteryRecords.value } : {}),
    })
    if (!selectedNodeId.value || !findNode(viewModel.value, selectedNodeId.value)) {
      selectedNodeId.value = null
    }
    const nextCurrentNodeId = viewModel.value.currentNodeId
    if (!focusedNodeId.value || !findNode(viewModel.value, focusedNodeId.value)) {
      focusedNodeId.value = nextCurrentNodeId ?? null
    }
  }

  function selectFirstUnit() {
    activeUnitId.value = viewModel.value?.islands[0]?.unitId ?? null
  }

  async function loadMap(
    loadOptions: LearningMapLoadOptions = {},
  ): Promise<LearningMapViewModel | null> {
    const generation = ++loadGeneration
    profileId.value = loadOptions.profileId ?? 'local-profile'
    loading.value = true
    status.value = 'loading'
    error.value = null
    dataset.value = loadOptions.dataset ?? 'profile'
    readOnly.value = loadOptions.isReadOnly ?? false
    masteryRecords.value = loadOptions.masteryRecords
    try {
      const source = await repository.getMapSource({
        dataset: dataset.value,
        textbookId: loadOptions.textbookId,
      })
      if (generation !== loadGeneration) return null
      activeSource.value = source
      activeTextbookId.value = source?.textbook.id ?? loadOptions.textbookId ?? null
      if (!source) {
        viewModel.value = null
        mapProgress.value = []
        status.value = 'not_available'
        return null
      }
      mapProgress.value = progressStorage.load(source.textbook.id, {
        profileId: profileId.value,
        dataset: dataset.value,
      })
      if (dataset.value === 'profile') {
        const sessions = lessonSessionStorage.loadAll()
        let recovered = false
        for (const mapping of source.lessonKnowledgePoints) {
          const lesson = source.lessons.find((lesson) => lesson.id === mapping.lessonId)
          if (!lesson) continue
          const context = {
            textbookId: source.textbook.id,
            unitId: lesson.unitId,
            lessonId: lesson.id,
            knowledgePointId: mapping.knowledgePointId,
          }
          const baseId = buildLessonSessionId(context, profileId.value)
          const completed = sessions.find(
            (session) =>
              session.status === 'completed' &&
              (session.id === baseId || session.id.startsWith(baseId + ':attempt:')),
          )
          const nodeId = `learning-map:${source.textbook.id}:knowledge:${mapping.id}`
          if (
            completed &&
            !mapProgress.value.some(
              (record) =>
                record.nodeId === nodeId &&
                ['completed', 'mastered', 'perfect'].includes(record.status),
            )
          ) {
            mapProgress.value = mapProgress.value.filter((record) => record.nodeId !== nodeId)
            mapProgress.value.push({
              nodeId,
              status: 'completed',
              progress: 100,
              completedAt: completed.completedAt,
              startedAt: completed.startedAt,
            })
            recovered = true
          }
        }
        if (recovered) persistProgress()
      }
      refreshViewModel()
      selectFirstUnit()
      focusedNodeId.value = viewModel.value?.currentNodeId ?? null
      status.value = viewModel.value?.islands.length ? 'ready' : 'empty'
      return viewModel.value
    } catch (caught) {
      if (generation !== loadGeneration) return null
      activeSource.value = null
      viewModel.value = null
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '学习地图暂时无法加载'
      return null
    } finally {
      if (generation === loadGeneration) loading.value = false
    }
  }

  function selectUnit(unitId: Id) {
    if (!viewModel.value?.islands.some((island) => island.unitId === unitId)) return
    activeUnitId.value = unitId
  }

  function selectNode(nodeId: Id) {
    const node = viewModel.value ? findNode(viewModel.value, nodeId) : null
    if (!node) return false
    selectedNodeId.value = nodeId
    focusedNodeId.value = nodeId
    activeUnitId.value = node.unitId
    return true
  }

  function focusNode(nodeId: Id) {
    return selectNode(nodeId)
  }

  function persistProgress() {
    if (!activeTextbookId.value || readOnly.value) return
    try {
      progressStorage.save(activeTextbookId.value, mapProgress.value, {
        profileId: profileId.value,
        dataset: dataset.value,
      })
    } catch {
      error.value = '地图进度暂未保存，请不要关闭页面，稍后重试。'
    }
  }

  function updateProgress(node: KnowledgeMapNode, next: LearningMapProgressRecord): boolean {
    if (readOnly.value) return false
    const existingIndex = mapProgress.value.findIndex((record) => record.nodeId === node.id)
    if (existingIndex >= 0) {
      mapProgress.value = mapProgress.value.map((record, index) =>
        index === existingIndex ? next : record,
      )
    } else {
      mapProgress.value = [...mapProgress.value, next]
    }
    persistProgress()
    refreshViewModel()
    focusedNodeId.value = node.id
    return true
  }

  function markNodeStarted(nodeId: Id): boolean {
    const node = viewModel.value ? findNode(viewModel.value, nodeId) : null
    if (!node || (node.status !== 'available' && node.status !== 'learning')) return false
    const existing = mapProgress.value.find((record) => record.nodeId === nodeId)
    return updateProgress(node, {
      nodeId,
      status: 'learning',
      progress: Math.max(existing?.progress ?? 0, 1),
      ...(existing?.startedAt
        ? { startedAt: existing.startedAt }
        : { startedAt: new Date().toISOString() }),
      ...(existing?.completedAt ? { completedAt: existing.completedAt } : {}),
    })
  }

  function markNodeCompleted(nodeId: Id): boolean {
    const node = viewModel.value ? findNode(viewModel.value, nodeId) : null
    if (!node || (node.status !== 'available' && node.status !== 'learning')) return false
    const existing = mapProgress.value.find((record) => record.nodeId === nodeId)
    const now = new Date().toISOString()
    return updateProgress(node, {
      nodeId,
      status: 'completed',
      progress: 100,
      ...(existing?.startedAt ? { startedAt: existing.startedAt } : { startedAt: now }),
      completedAt: now,
    })
  }

  function resetDemoProgress() {
    if (!activeTextbookId.value || readOnly.value) return false
    if (dataset.value === 'profile') return false
    try {
      progressStorage.clear(activeTextbookId.value, {
        profileId: profileId.value,
        dataset: dataset.value,
      })
    } catch {
      error.value = '地图进度暂未保存。'
    }
    mapProgress.value = []
    refreshViewModel()
    focusedNodeId.value = viewModel.value?.currentNodeId ?? null
    return true
  }

  return {
    viewModel,
    activeTextbookId,
    activeUnitId,
    selectedNodeId,
    focusedNodeId,
    mapProgress,
    masteryRecords,
    status,
    loading,
    error,
    dataset,
    readOnly,
    selectedNode,
    focusedNode,
    currentNode,
    loadMap,
    selectUnit,
    selectNode,
    focusNode,
    markNodeStarted,
    markNodeCompleted,
    resetDemoProgress,
  }
})

function findNode(viewModel: LearningMapViewModel, nodeId: Id): KnowledgeMapNode | null {
  for (const island of viewModel.islands) {
    for (const lesson of island.lessons) {
      const node = lesson.nodes.find((candidate) => candidate.id === nodeId)
      if (node) return node
    }
  }
  return null
}

export function findLearningMapNode(viewModel: LearningMapViewModel, nodeId: Id) {
  return findNode(viewModel, nodeId)
}
