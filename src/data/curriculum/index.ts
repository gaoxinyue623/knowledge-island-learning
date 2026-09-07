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
 * Current user-facing curriculum dataset.
 *
 * Only the curriculum packages explicitly entered for the current local
 * rollout are exposed here. Unreviewed records remain subject to the access
 * policy; this dataset does not promote them to reviewed or production data.
 */
export const curriculumData: CurriculumData = {
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

function indexById<T extends { id: string }>(records: readonly T[]): ReadonlyMap<string, T> {
  return new Map(records.map((record) => [record.id, record]))
}

export function buildCurriculumIndexes(data: CurriculumData) {
  const regionTextbookRelationsByRegionId = new Map<
    string,
    CurriculumData['regionTextbookRelations']
  >()
  for (const relation of data.regionTextbookRelations) {
    const relations = regionTextbookRelationsByRegionId.get(relation.regionId) ?? []
    relations.push(relation)
    regionTextbookRelationsByRegionId.set(relation.regionId, relations)
  }

  const questionKnowledgePointsByQuestionId = new Map<
    string,
    CurriculumData['questionKnowledgePoints']
  >()
  for (const mapping of data.questionKnowledgePoints) {
    const mappings = questionKnowledgePointsByQuestionId.get(mapping.questionId) ?? []
    mappings.push(mapping)
    questionKnowledgePointsByQuestionId.set(mapping.questionId, mappings)
  }

  return {
    gradeById: indexById(data.grades),
    semesterById: indexById(data.semesters),
    subjectById: indexById(data.subjects),
    subjectByCode: new Map(data.subjects.map((subject) => [subject.code, subject])),
    regionById: indexById(data.regions),
    publisherById: indexById(data.publishers),
    textbookById: indexById(data.textbooks),
    unitById: indexById(data.units),
    lessonById: indexById(data.lessons),
    knowledgePointById: indexById(data.knowledgePoints),
    courseContentById: indexById(data.courseContents),
    questionById: indexById(data.questions),
    questionKnowledgePointsByQuestionId,
    mediaAssetById: indexById(data.mediaAssets),
    sourceById: indexById(data.sources),
    regionTextbookRelationsByRegionId,
  }
}

export const curriculumIndexes = buildCurriculumIndexes(curriculumData)

export { goldenMathPepG3S1Package } from './verified'
export {
  curriculumSourceManifest,
  mvpCurriculumScope,
  productionCurriculumData,
  productionCurriculumIndex,
} from './production'
export { batch01SourceManifest, batch01SourceReferences } from './batch-01/source-manifest'
export * from './grade-1'
export * from './grade-2'
export * from './pilot'
export {
  batch01KnowledgePointById,
  batch01KnowledgePointRegistry,
  batch01Manifest,
  batch01MathG1S1Package,
  batch01MathG1S2Package,
  batch01PackageDescriptors,
} from './batch-01'
export * from './types'
