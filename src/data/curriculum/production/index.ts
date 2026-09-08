import type { ProductionReadinessDataset } from '@/types'
import { buildProductionIndex } from '../../../services/production-readiness/productionIndex'
import {
  approvedCurriculum,
  localReleaseQuestions,
  localReleaseMappings,
  localReleaseSources,
  localReleaseReferences,
  localReleaseScope,
} from './localRelease'

export const mvpCurriculumScope = localReleaseScope
export { curriculumSourceManifest } from './source-manifest'
export const productionCurriculumData: ProductionReadinessDataset = {
  ...approvedCurriculum,
  contents: approvedCurriculum.courseContents,
  questions: localReleaseQuestions,
  questionKnowledgePoints: localReleaseMappings,
  contentSources: localReleaseSources,
  sourceReferences: localReleaseReferences,
}
export const productionCurriculumIndex = buildProductionIndex(
  productionCurriculumData,
  mvpCurriculumScope,
)
