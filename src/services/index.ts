import { MockContentService } from './adapters/mock/contentMockAdapter'
import { MockCurriculumService } from './adapters/mock/curriculumMockAdapter'
import { MockStudentService } from './adapters/mock/studentMockAdapter'
import { curriculumProfileRepository } from './storage/curriculumProfileRepository'

export const curriculumService = new MockCurriculumService({
  profileRepository: curriculumProfileRepository,
})
export const studentService = new MockStudentService(curriculumProfileRepository)
export const contentService = new MockContentService()

export * from './contracts'
export * from './curriculum'
export * from './learning-map'
export * from './lesson-player'
export * from './storage/curriculumProfileRepository'
export * from './validation'
