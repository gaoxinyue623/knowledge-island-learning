import { localCurriculumData } from './localCatalog'
import type { CurriculumData } from './types'

export const curriculumData: CurriculumData = localCurriculumData

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
