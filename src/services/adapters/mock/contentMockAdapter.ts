import { productionConfig } from '@/config/production'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import type { ContentService } from '@/services/contracts'
import { curriculumIndexes } from '@/data/curriculum'
import type { Id, KnowledgePoint, MediaAsset } from '@/types'

export interface MockContentServiceOptions {
  knowledgePoints?: readonly KnowledgePoint[]
  mediaAssets?: readonly MediaAsset[]
}

export class MockContentService implements ContentService {
  private readonly knowledgePoints: ReadonlyMap<Id, KnowledgePoint>
  private readonly mediaAssets: ReadonlyMap<Id, MediaAsset>

  constructor(options: MockContentServiceOptions = {}) {
    const knowledgePoints =
      options.knowledgePoints ??
      (productionConfig.isProduction
        ? productionCurriculumIndex.knowledgePoints
        : [...curriculumIndexes.knowledgePointById.values()])
    const mediaAssets =
      options.mediaAssets ??
      (productionConfig.isProduction
        ? productionCurriculumIndex.mediaAssets
        : [...curriculumIndexes.mediaAssetById.values()])
    this.knowledgePoints = new Map(knowledgePoints.map((record) => [record.id, record]))
    this.mediaAssets = new Map(mediaAssets.map((record) => [record.id, record]))
  }

  async getKnowledgePoint(knowledgePointId: Id): Promise<KnowledgePoint | null> {
    return this.knowledgePoints.get(knowledgePointId) ?? null
  }

  async getMediaAsset(mediaAssetId: Id): Promise<MediaAsset | null> {
    return this.mediaAssets.get(mediaAssetId) ?? null
  }
}
