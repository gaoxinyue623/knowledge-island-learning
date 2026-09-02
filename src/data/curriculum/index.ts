import { courseContentById, sampleCourseContents } from './contents'
import { gradeById, sampleGrades } from './grades'
import { knowledgePointById, sampleKnowledgePoints } from './knowledge-points'
import { lessonById, sampleLessons } from './lessons'
import { sampleLearningMaps, sampleMapNodes } from './maps'
import { mediaAssetById, sampleMediaAssets } from './media'
import { publisherById, samplePublishers } from './publishers'
import {
  regionTextbookRelationsByRegionId,
  sampleRegionTextbookRelations,
} from './region-textbooks'
import { regionById, sampleRegions } from './regions'
import { sampleKnowledgePrerequisites, sampleLessonKnowledgePointRelations } from './relations'
import { sampleSemesters, semesterById } from './semesters'
import { sampleQuestions } from './questions'
import { sampleSource, sampleSources, sourceById } from './sources'
import { sampleSubjects, subjectByCode, subjectById } from './subjects'
import { sampleTextbooks, textbookById } from './textbooks'
import { unitById, sampleUnits } from './units'

export const curriculumData = {
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
  mediaAssets: sampleMediaAssets,
  learningMaps: sampleLearningMaps,
  mapNodes: sampleMapNodes,
  sources: sampleSources,
}

export const curriculumIndexes = {
  gradeById,
  semesterById,
  subjectById,
  subjectByCode,
  regionById,
  publisherById,
  textbookById,
  unitById,
  lessonById,
  knowledgePointById,
  courseContentById,
  mediaAssetById,
  sourceById,
  regionTextbookRelationsByRegionId,
}

export { sampleSource }
export { goldenMathPepG3S1Package } from './verified'
export * from './types'
