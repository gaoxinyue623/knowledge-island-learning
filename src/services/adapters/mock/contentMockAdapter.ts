import type { ContentService } from '@/services/contracts'
import { curriculumIndexes } from '@/data/curriculum'
import type { Id, KnowledgePoint, MediaAsset } from '@/types'

export class MockContentService implements ContentService {
  async getKnowledgePoint(knowledgePointId: Id): Promise<KnowledgePoint | null> {
    return curriculumIndexes.knowledgePointById.get(knowledgePointId) ?? null
  }

  async getMediaAsset(mediaAssetId: Id): Promise<MediaAsset | null> {
    return curriculumIndexes.mediaAssetById.get(mediaAssetId) ?? null
  }
}
