import type { ContentService, CurriculumService } from './contracts'
import { MockStudentService } from './adapters/mock/studentMockAdapter'
import { curriculumProfileRepository } from './storage/curriculumProfileRepository'

// Profile reads and standalone activities do not need the textbook dataset.
// All concurrent requests wait for the same catalog initialization.
let catalog: Promise<typeof import('./runtimeCatalog')> | undefined
function loadCatalog() {
  return (catalog ??= import('./runtimeCatalog').catch((error: unknown) => {
    catalog = undefined
    throw error
  }))
}
export const studentService = new MockStudentService(curriculumProfileRepository)

export const curriculumService: CurriculumService = {
  getCurriculumProfile: (id) => studentService.getCurriculumProfile(id),
  async saveCurriculumProfile(profile) {
    return (await loadCatalog()).curriculumService.saveCurriculumProfile(profile)
  },
  async getRegions() {
    return (await loadCatalog()).curriculumService.getRegions()
  },
  async getGrades() {
    return (await loadCatalog()).curriculumService.getGrades()
  },
  async getSemesters() {
    return (await loadCatalog()).curriculumService.getSemesters()
  },
  async getSubjects() {
    return (await loadCatalog()).curriculumService.getSubjects()
  },
  async getPublishers() {
    return (await loadCatalog()).curriculumService.getPublishers()
  },
  async getPublisher(id) {
    return (await loadCatalog()).curriculumService.getPublisher(id)
  },
  async getTextbookVersions(input) {
    return (await loadCatalog()).curriculumService.getTextbookVersions(input)
  },
  async getTextbookDisplay(id) {
    return (await loadCatalog()).curriculumService.getTextbookDisplay(id)
  },
  async resolveAvailableTextbooks(input) {
    return (await loadCatalog()).curriculumService.resolveAvailableTextbooks(input)
  },
  async getUnitsByTextbookVersion(id) {
    return (await loadCatalog()).curriculumService.getUnitsByTextbookVersion(id)
  },
  async getLessonsByUnit(id) {
    return (await loadCatalog()).curriculumService.getLessonsByUnit(id)
  },
  async getKnowledgePointsByLesson(id) {
    return (await loadCatalog()).curriculumService.getKnowledgePointsByLesson(id)
  },
  async getLessonKnowledgePointRelation(lessonId, pointId) {
    return (await loadCatalog()).curriculumService.getLessonKnowledgePointRelation(
      lessonId,
      pointId,
    )
  },
  async getKnowledgePointById(id) {
    return (await loadCatalog()).curriculumService.getKnowledgePointById(id)
  },
  async getLearningMapCurriculum(id) {
    return (await loadCatalog()).curriculumService.getLearningMapCurriculum(id)
  },
  async getTextbook(id) {
    return (await loadCatalog()).curriculumService.getTextbook(id)
  },
  async listRegions() {
    return (await loadCatalog()).curriculumService.listRegions()
  },
  async listGrades() {
    return (await loadCatalog()).curriculumService.listGrades()
  },
  async listSemesters() {
    return (await loadCatalog()).curriculumService.listSemesters()
  },
}

export const contentService: ContentService = {
  async getKnowledgePoint(id) {
    return (await loadCatalog()).contentService.getKnowledgePoint(id)
  },
  async getMediaAsset(id) {
    return (await loadCatalog()).contentService.getMediaAsset(id)
  },
}
