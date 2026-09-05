import { productionConfig } from '@/config/production'
import { curriculumData } from '@/data/curriculum'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { MockContentService } from './adapters/mock/contentMockAdapter'
import { MockCurriculumService } from './adapters/mock/curriculumMockAdapter'
import { MockStudentService } from './adapters/mock/studentMockAdapter'
import { curriculumProfileRepository } from './storage/curriculumProfileRepository'

const runtimeCurriculumData = productionConfig.isProduction
  ? {
      regions: [...productionCurriculumIndex.regions],
      grades: [...productionCurriculumIndex.grades],
      semesters: [...productionCurriculumIndex.semesters],
      subjects: [...productionCurriculumIndex.subjects],
      publishers: [...productionCurriculumIndex.publishers],
      textbooks: [...productionCurriculumIndex.textbooks],
      regionTextbookRelations: [...productionCurriculumIndex.regionTextbookRelations],
      units: [...productionCurriculumIndex.units],
      lessons: [...productionCurriculumIndex.lessons],
      knowledgePoints: [...productionCurriculumIndex.knowledgePoints],
      lessonKnowledgePointRelations: [...productionCurriculumIndex.lessonKnowledgePointRelations],
      knowledgePrerequisites: [...productionCurriculumIndex.knowledgePrerequisites],
    }
  : curriculumData

/**
 * Runtime service singletons live in their own module so feature services can
 * depend on them without importing the barrel export and creating a cycle.
 */
export const curriculumService = new MockCurriculumService({
  profileRepository: curriculumProfileRepository,
  data: runtimeCurriculumData,
})
export const studentService = new MockStudentService(curriculumProfileRepository)
export const contentService = new MockContentService({
  knowledgePoints: productionConfig.isProduction
    ? productionCurriculumIndex.knowledgePoints
    : undefined,
  mediaAssets: productionConfig.isProduction ? productionCurriculumIndex.mediaAssets : undefined,
})
