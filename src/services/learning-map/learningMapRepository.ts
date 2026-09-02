import { demoLearningMapSource } from '@/data/learning-map/demo'
import { goldenMathPepG3S1Package } from '@/data/curriculum/verified/math/pep/g3-s1'
import { curriculumService } from '@/services/runtime'
import type { CurriculumService } from '@/services/contracts'
import type { Id, LearningMapCurriculumSource, LearningMapDataset } from '@/types'

import { buildLearningMapSourceFromImportPackage } from './curriculumSource'

export interface LearningMapRepositoryQuery {
  dataset: LearningMapDataset
  textbookId?: Id
}

export interface LearningMapRepository {
  getMapSource(query: LearningMapRepositoryQuery): Promise<LearningMapCurriculumSource | null>
}

export class MockLearningMapRepository implements LearningMapRepository {
  constructor(private readonly curriculum?: CurriculumService) {}

  async getMapSource({ dataset, textbookId }: LearningMapRepositoryQuery) {
    if (dataset === 'demo') return demoLearningMapSource
    if (dataset === 'golden') {
      return buildLearningMapSourceFromImportPackage(goldenMathPepG3S1Package)
    }
    if (!textbookId) return null
    return (this.curriculum ?? curriculumService).getLearningMapCurriculum(textbookId)
  }
}

export const learningMapRepository = new MockLearningMapRepository()

export function isLearningMapSourceUnverified(source: LearningMapCurriculumSource): boolean {
  return source.verificationStatus === 'UNVERIFIED'
}
