import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  learningStrategyService,
  toStrategyKnowledgeRelations,
  toStrategyMapNodes,
  type LearningStrategyServiceContract,
} from '@/services/learning-strategy'
import type {
  Id,
  LearningEvidence,
  LearningMapProgressRecord,
  LearningMapViewModel,
  LearningRecommendation,
  LearningStrategyInput,
  LearningStrategyOptions,
  MasteryRecord,
  QuestionAttempt,
} from '@/types'

export type LearningStrategyStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface LearningStrategyStoreDependencies {
  service: LearningStrategyServiceContract
}

const defaultDependencies: LearningStrategyStoreDependencies = {
  service: learningStrategyService,
}
let dependencies: LearningStrategyStoreDependencies = defaultDependencies

export function configureLearningStrategyStore(
  overrides: Partial<LearningStrategyStoreDependencies>,
): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetLearningStrategyStoreDependencies(): void {
  dependencies = defaultDependencies
}

export interface ResolveLearningStrategyForMapOptions {
  studentProfileId: Id
  masteryRecords: readonly MasteryRecord[]
  learningMapProgress?: readonly LearningMapProgressRecord[]
  learningEvidence?: readonly LearningEvidence[]
  questionHistory?: readonly QuestionAttempt[]
  currentMapNodeId?: Id
  currentKnowledgePointId?: Id
  dataset?: LearningStrategyInput['dataset']
  strategyVersion?: string
}

export const useLearningStrategyStore = defineStore('learningStrategy', () => {
  const recommendation = ref<LearningRecommendation | null>(null)
  const status = ref<LearningStrategyStoreStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function resolve(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): Promise<LearningRecommendation | null> {
    loading.value = true
    status.value = 'loading'
    error.value = null
    try {
      recommendation.value = dependencies.service.resolve(input, options)
      status.value = 'ready'
      return recommendation.value
    } catch (caught) {
      recommendation.value = null
      status.value = 'error'
      error.value = caught instanceof Error ? caught.message : '学习建议暂时无法读取'
      return null
    } finally {
      loading.value = false
    }
  }

  async function resolveForMap(
    viewModel: LearningMapViewModel,
    options: ResolveLearningStrategyForMapOptions,
    strategyOptions: LearningStrategyOptions = {},
  ): Promise<LearningRecommendation | null> {
    const mapNodes = toStrategyMapNodes(viewModel)
    const currentNode = options.currentMapNodeId
      ? mapNodes.find((node) => node.id === options.currentMapNodeId)
      : viewModel.currentNodeId
        ? mapNodes.find((node) => node.id === viewModel.currentNodeId)
        : undefined
    return resolve(
      {
        studentProfileId: options.studentProfileId,
        currentTextbookId: viewModel.textbook.id,
        ...(currentNode?.id || options.currentMapNodeId
          ? { currentMapNodeId: currentNode?.id ?? options.currentMapNodeId }
          : {}),
        ...(options.currentKnowledgePointId || currentNode?.knowledgePointId
          ? {
              currentKnowledgePointId:
                options.currentKnowledgePointId ?? currentNode?.knowledgePointId,
            }
          : {}),
        masteryRecords: options.masteryRecords,
        mapNodes,
        knowledgeRelations: toStrategyKnowledgeRelations(viewModel),
        ...(options.learningMapProgress
          ? { learningMapProgress: options.learningMapProgress }
          : {}),
        ...(options.learningEvidence ? { learningEvidence: options.learningEvidence } : {}),
        ...(options.questionHistory ? { questionHistory: options.questionHistory } : {}),
        dataset: options.dataset ?? viewModel.dataset,
        ...(options.strategyVersion ? { strategyVersion: options.strategyVersion } : {}),
      },
      strategyOptions,
    )
  }

  function clear(): void {
    recommendation.value = null
    status.value = 'idle'
    loading.value = false
    error.value = null
  }

  return {
    recommendation,
    status,
    loading,
    error,
    resolve,
    resolveForMap,
    clear,
  }
})
