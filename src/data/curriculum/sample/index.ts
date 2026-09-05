import { sampleCourseContents } from '../contents'
import { sampleGrades } from '../grades'
import { sampleKnowledgePoints } from '../knowledge-points'
import { sampleLessons } from '../lessons'
import { sampleLearningMaps, sampleMapNodes } from '../maps'
import { sampleMediaAssets } from '../media'
import { samplePublishers } from '../publishers'
import { sampleRegionTextbookRelations } from '../region-textbooks'
import { sampleRegions } from '../regions'
import { sampleKnowledgePrerequisites, sampleLessonKnowledgePointRelations } from '../relations'
import { sampleSemesters } from '../semesters'
import { sampleQuestionKnowledgePoints, sampleQuestions } from '../questions'
import { sampleSources } from '../sources'
import { sampleSubjects } from '../subjects'
import { sampleTextbooks } from '../textbooks'
import { sampleUnits } from '../units'
import { buildCurriculumIndexes } from '../index'
import type { CurriculumData } from '../types'

/** Explicit SAMPLE namespace for development and test fixtures only. */
export const sampleCurriculumData: CurriculumData = {
  grades: sampleGrades,
  semesters: sampleSemesters,
  subjects: sampleSubjects,
  regions: sampleRegions,
  publishers: samplePublishers,
  textbooks: sampleTextbooks,
  regionTextbookRelations: sampleRegionTextbookRelations,
  units: sampleUnits,
  lessons: sampleLessons,
  knowledgePoints: sampleKnowledgePoints,
  lessonKnowledgePointRelations: sampleLessonKnowledgePointRelations,
  knowledgePrerequisites: sampleKnowledgePrerequisites,
  courseContents: sampleCourseContents,
  questions: sampleQuestions,
  questionKnowledgePoints: sampleQuestionKnowledgePoints,
  mediaAssets: sampleMediaAssets,
  learningMaps: sampleLearningMaps,
  mapNodes: sampleMapNodes,
  sources: sampleSources,
}

export const sampleCurriculumIndexes = buildCurriculumIndexes(sampleCurriculumData)

export { sampleSource, sampleSources } from '../sources'
export { sampleRegions } from '../regions'
export { samplePublishers } from '../publishers'
export { sampleTextbooks } from '../textbooks'
export { sampleRegionTextbookRelations } from '../region-textbooks'
export { sampleUnits } from '../units'
export { sampleLessons } from '../lessons'
export { sampleKnowledgePoints } from '../knowledge-points'
export { sampleKnowledgePrerequisites, sampleLessonKnowledgePointRelations } from '../relations'
export { sampleCourseContents } from '../contents'
export { sampleQuestionKnowledgePoints, sampleQuestions } from '../questions'
export { sampleMediaAssets } from '../media'
export { sampleLearningMaps, sampleMapNodes } from '../maps'
