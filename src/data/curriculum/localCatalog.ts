import { gradeOneChineseLowerCurriculum, gradeOneChineseUpperCurriculum } from './grade-1'
import { gradeOneShenzhenEnglishLowerCurriculum } from './grade-1/english-shanghai-lower'
import { gradeOneShenzhenEnglishUpperCurriculum } from './grade-1/english-shanghai-upper'
import { gradeTwoShenzhenEnglishUpperCurriculum } from './grade-2/english-shanghai-upper'
import { gradeTwoShenzhenMathUpperCurriculum } from './grade-2/math-bnu-upper'
import { gradeOneShenzhenMathUpperCurriculum } from './grade-1/math-bnu-upper'
import { gradeOneShenzhenMathLowerCurriculum } from './grade-1/math-bnu-lower'
import {
  gradeTwoChineseLowerCurriculum,
  gradeTwoChineseUpperCurriculum,
  revisedChineseLowerCurriculum,
} from './grade-2'
import type { CurriculumData } from './types'

/**
 * Original local import records, retained as source evidence.
 *
 * The application consumes the owner-approved release projection in production/localRelease.ts.
 * Original verification and source metadata remain unchanged in this catalogue.
 */
export const localCurriculumData: CurriculumData = {
  grades: [gradeOneChineseUpperCurriculum.grade, gradeTwoChineseUpperCurriculum.grade],
  semesters: [gradeOneChineseUpperCurriculum.semester, gradeOneChineseLowerCurriculum.semester],
  subjects: [
    gradeOneChineseUpperCurriculum.subject,
    gradeTwoShenzhenMathUpperCurriculum.subject,
    gradeOneShenzhenEnglishUpperCurriculum.subject,
  ],
  regions: [
    ...gradeOneChineseUpperCurriculum.regions,
    ...gradeOneShenzhenEnglishUpperCurriculum.regions,
  ],
  publishers: [
    ...gradeTwoShenzhenMathUpperCurriculum.publishers,
    ...gradeOneChineseUpperCurriculum.publishers,
    ...gradeOneShenzhenEnglishUpperCurriculum.publishers,
  ],
  textbooks: [
    ...gradeOneChineseUpperCurriculum.textbooks,
    ...gradeOneChineseLowerCurriculum.textbooks,
    ...gradeTwoChineseUpperCurriculum.textbooks,
    ...gradeTwoChineseLowerCurriculum.textbooks,
    ...revisedChineseLowerCurriculum.textbooks,
    ...gradeOneShenzhenEnglishUpperCurriculum.textbooks,
    ...gradeOneShenzhenEnglishLowerCurriculum.textbooks,
    ...gradeTwoShenzhenEnglishUpperCurriculum.textbooks,
    ...gradeTwoShenzhenMathUpperCurriculum.textbooks,
    ...gradeOneShenzhenMathUpperCurriculum.textbooks,
    ...gradeOneShenzhenMathLowerCurriculum.textbooks,
  ],
  regionTextbookRelations: [
    ...gradeOneChineseUpperCurriculum.regionTextbookRelations,
    ...gradeOneChineseLowerCurriculum.regionTextbookRelations,
    ...gradeTwoChineseUpperCurriculum.regionTextbookRelations,
    ...gradeTwoChineseLowerCurriculum.regionTextbookRelations,
    ...gradeOneShenzhenEnglishUpperCurriculum.regionTextbookRelations,
    ...gradeOneShenzhenEnglishLowerCurriculum.regionTextbookRelations,
    ...gradeTwoShenzhenEnglishUpperCurriculum.regionTextbookRelations,
    ...gradeTwoShenzhenMathUpperCurriculum.regionTextbookRelations,
    ...gradeOneShenzhenMathUpperCurriculum.regionTextbookRelations,
    ...gradeOneShenzhenMathLowerCurriculum.regionTextbookRelations,
  ],
  units: [
    ...gradeOneChineseUpperCurriculum.units,
    ...gradeOneChineseLowerCurriculum.units,
    ...gradeTwoChineseUpperCurriculum.units,
    ...gradeTwoChineseLowerCurriculum.units,
    ...revisedChineseLowerCurriculum.units,
    ...gradeOneShenzhenEnglishUpperCurriculum.units,
    ...gradeOneShenzhenEnglishLowerCurriculum.units,
    ...gradeTwoShenzhenEnglishUpperCurriculum.units,
    ...gradeTwoShenzhenMathUpperCurriculum.units,
    ...gradeOneShenzhenMathUpperCurriculum.units,
    ...gradeOneShenzhenMathLowerCurriculum.units,
  ],
  lessons: [
    ...gradeOneChineseUpperCurriculum.lessons,
    ...gradeOneChineseLowerCurriculum.lessons,
    ...gradeTwoChineseUpperCurriculum.lessons,
    ...gradeTwoChineseLowerCurriculum.lessons,
    ...revisedChineseLowerCurriculum.lessons,
    ...gradeOneShenzhenEnglishUpperCurriculum.lessons,
    ...gradeOneShenzhenEnglishLowerCurriculum.lessons,
    ...gradeTwoShenzhenEnglishUpperCurriculum.lessons,
    ...gradeTwoShenzhenMathUpperCurriculum.lessons,
    ...gradeOneShenzhenMathUpperCurriculum.lessons,
    ...gradeOneShenzhenMathLowerCurriculum.lessons,
  ],
  knowledgePoints: [
    ...gradeOneChineseUpperCurriculum.knowledgePoints,
    ...gradeOneChineseLowerCurriculum.knowledgePoints,
    ...gradeTwoChineseUpperCurriculum.knowledgePoints,
    ...gradeTwoChineseLowerCurriculum.knowledgePoints,
    ...revisedChineseLowerCurriculum.knowledgePoints,
    ...gradeOneShenzhenEnglishUpperCurriculum.knowledgePoints,
    ...gradeOneShenzhenEnglishLowerCurriculum.knowledgePoints,
    ...gradeTwoShenzhenEnglishUpperCurriculum.knowledgePoints,
    ...gradeTwoShenzhenMathUpperCurriculum.knowledgePoints,
    ...gradeOneShenzhenMathUpperCurriculum.knowledgePoints,
    ...gradeOneShenzhenMathLowerCurriculum.knowledgePoints,
  ],
  lessonKnowledgePointRelations: [
    ...gradeOneChineseUpperCurriculum.lessonKnowledgePointRelations,
    ...gradeOneChineseLowerCurriculum.lessonKnowledgePointRelations,
    ...gradeTwoChineseUpperCurriculum.lessonKnowledgePointRelations,
    ...gradeTwoChineseLowerCurriculum.lessonKnowledgePointRelations,
    ...revisedChineseLowerCurriculum.lessonKnowledgePointRelations,
    ...gradeOneShenzhenEnglishUpperCurriculum.lessonKnowledgePointRelations,
    ...gradeOneShenzhenEnglishLowerCurriculum.lessonKnowledgePointRelations,
    ...gradeTwoShenzhenEnglishUpperCurriculum.lessonKnowledgePointRelations,
    ...gradeTwoShenzhenMathUpperCurriculum.lessonKnowledgePointRelations,
    ...gradeOneShenzhenMathUpperCurriculum.lessonKnowledgePointRelations,
    ...gradeOneShenzhenMathLowerCurriculum.lessonKnowledgePointRelations,
  ],
  knowledgePrerequisites: [
    ...gradeOneChineseUpperCurriculum.knowledgePrerequisites,
    ...gradeOneChineseLowerCurriculum.knowledgePrerequisites,
    ...gradeTwoChineseUpperCurriculum.knowledgePrerequisites,
    ...gradeTwoChineseLowerCurriculum.knowledgePrerequisites,
    ...revisedChineseLowerCurriculum.knowledgePrerequisites,
    ...gradeOneShenzhenEnglishUpperCurriculum.knowledgePrerequisites,
    ...gradeOneShenzhenEnglishLowerCurriculum.knowledgePrerequisites,
    ...gradeTwoShenzhenEnglishUpperCurriculum.knowledgePrerequisites,
    ...gradeTwoShenzhenMathUpperCurriculum.knowledgePrerequisites,
    ...gradeOneShenzhenMathUpperCurriculum.knowledgePrerequisites,
    ...gradeOneShenzhenMathLowerCurriculum.knowledgePrerequisites,
  ],
  courseContents: [
    ...gradeOneChineseUpperCurriculum.courseContents,
    ...gradeOneChineseLowerCurriculum.courseContents,
    ...gradeTwoChineseUpperCurriculum.courseContents,
    ...gradeTwoChineseLowerCurriculum.courseContents,
    ...revisedChineseLowerCurriculum.courseContents,
    ...gradeOneShenzhenEnglishUpperCurriculum.courseContents,
    ...gradeOneShenzhenEnglishLowerCurriculum.courseContents,
    ...gradeTwoShenzhenEnglishUpperCurriculum.courseContents,
    ...gradeTwoShenzhenMathUpperCurriculum.courseContents,
    ...gradeOneShenzhenMathUpperCurriculum.courseContents,
    ...gradeOneShenzhenMathLowerCurriculum.courseContents,
  ],
  questions: [],
  questionKnowledgePoints: [],
  mediaAssets: [],
  learningMaps: [],
  mapNodes: [],
  sources: [
    ...gradeOneChineseUpperCurriculum.sources,
    ...gradeOneChineseLowerCurriculum.sources,
    ...gradeTwoChineseUpperCurriculum.sources,
    ...gradeTwoChineseLowerCurriculum.sources,
    ...revisedChineseLowerCurriculum.sources,
    ...gradeOneShenzhenEnglishUpperCurriculum.sources,
    ...gradeOneShenzhenEnglishLowerCurriculum.sources,
    ...gradeTwoShenzhenEnglishUpperCurriculum.sources,
    ...gradeTwoShenzhenMathUpperCurriculum.sources,
    ...gradeOneShenzhenMathUpperCurriculum.sources,
    ...gradeOneShenzhenMathLowerCurriculum.sources,
  ],
}
