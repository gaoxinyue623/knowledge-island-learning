import type {
  ContentSource,
  CourseContent,
  Grade,
  KnowledgePoint,
  KnowledgePrerequisite,
  Lesson,
  LessonKnowledgePointRelation,
  MediaAsset,
  Publisher,
  Question,
  QuestionKnowledgePoint,
  Region,
  RegionTextbookRelation,
  Semester,
  Subject,
  TextbookVersion,
  Unit,
} from '@/types'
import type { ProductionReadinessDataset } from '@/types'
import { buildProductionIndex } from '../../../services/production-readiness/productionIndex'

import { mvpCurriculumScope } from './mvp-scope'
import { curriculumSourceManifest } from './source-manifest'

/**
 * Production data is a separate allow-list. It is empty until a package has
 * passed scope, source, structure, copyright and manual review gates.
 */
export const productionCurriculumData: ProductionReadinessDataset = {
  grades: [] as Grade[],
  semesters: [] as Semester[],
  subjects: [] as Subject[],
  regions: [] as Region[],
  publishers: [] as Publisher[],
  textbooks: [] as TextbookVersion[],
  regionTextbookRelations: [] as RegionTextbookRelation[],
  units: [] as Unit[],
  lessons: [] as Lesson[],
  knowledgePoints: [] as KnowledgePoint[],
  lessonKnowledgePointRelations: [] as LessonKnowledgePointRelation[],
  knowledgePrerequisites: [] as KnowledgePrerequisite[],
  sourceReferences: curriculumSourceManifest,
  contents: [] as CourseContent[],
  questions: [] as Question[],
  questionKnowledgePoints: [] as QuestionKnowledgePoint[],
  contentSources: [] as ContentSource[],
  mediaAssets: [] as MediaAsset[],
}

/**
 * The runtime-facing production index is derived from the explicit release
 * allow-list. It can only contain records that are already RELEASED and
 * REVIEWED; it never promotes the candidate scope below.
 */
export const productionCurriculumIndex = buildProductionIndex(
  productionCurriculumData,
  mvpCurriculumScope,
)

export { mvpCurriculumScope, curriculumSourceManifest }
