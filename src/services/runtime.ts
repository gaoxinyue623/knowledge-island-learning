import { MockContentService } from './adapters/mock/contentMockAdapter'
import { MockCurriculumService } from './adapters/mock/curriculumMockAdapter'
import { MockStudentService } from './adapters/mock/studentMockAdapter'
import { curriculumProfileRepository } from './storage/curriculumProfileRepository'

/**
 * Runtime service singletons live in their own module so feature services can
 * depend on them without importing the barrel export and creating a cycle.
 */
export const curriculumService = new MockCurriculumService({
  profileRepository: curriculumProfileRepository,
})
export const studentService = new MockStudentService(curriculumProfileRepository)
export const contentService = new MockContentService()
