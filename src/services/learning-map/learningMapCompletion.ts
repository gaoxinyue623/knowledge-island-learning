import type {
  Id,
  LessonCompletionMapOptions,
  LessonLaunchContext,
  LearningMapDataset,
} from '@/types'

import type { LearningMapRepository } from './learningMapRepository'
import { learningMapRepository } from './learningMapRepository'
import type { LearningMapProgressStorage } from './learningMapStorage'
import { createLearningMapProgressStorage } from './learningMapStorage'

function mapNodeId(textbookId: Id, mappingId: Id): Id {
  return `learning-map:${textbookId}:knowledge:${mappingId}`
}

export interface LearningMapCompletionService {
  markKnowledgePointCompleted(
    context: LessonLaunchContext,
    options?: LessonCompletionMapOptions,
  ): Promise<boolean>
}

export class MockLearningMapCompletionService implements LearningMapCompletionService {
  constructor(
    private readonly repository: LearningMapRepository = learningMapRepository,
    private readonly progressStorage: LearningMapProgressStorage = createLearningMapProgressStorage(),
  ) {}

  async markKnowledgePointCompleted(
    context: LessonLaunchContext,
    options: LessonCompletionMapOptions = {},
  ): Promise<boolean> {
    const dataset: LearningMapDataset = options.dataset ?? 'profile'
    const source = await this.repository.getMapSource({
      dataset,
      textbookId: context.textbookId,
    })
    if (!source) return false
    const mapping = source.lessonKnowledgePoints.find(
      (candidate) =>
        candidate.lessonId === context.lessonId &&
        candidate.knowledgePointId === context.knowledgePointId,
    )
    if (!mapping) return false
    const nodeId = mapNodeId(context.textbookId, mapping.id)
    const existing = this.progressStorage.load(context.textbookId, options)
    const existingRecord = existing.find((record) => record.nodeId === nodeId)
    const completedAt = existingRecord?.completedAt ?? new Date().toISOString()
    const next = existing.filter((record) => record.nodeId !== nodeId)
    next.push({
      nodeId,
      status: 'completed',
      progress: 100,
      startedAt: existingRecord?.startedAt ?? completedAt,
      completedAt,
    })
    this.progressStorage.save(context.textbookId, next, options)
    return true
  }
}

export const learningMapCompletionService = new MockLearningMapCompletionService()
