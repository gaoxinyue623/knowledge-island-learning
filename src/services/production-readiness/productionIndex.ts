import type { MvpCurriculumScope, ProductionIndex, ProductionReadinessDataset } from '@/types'

import {
  isProductionContentRecord,
  isProductionContentSource,
  isProductionCurriculumRecord,
  isProductionMediaAsset,
  isProductionQuestionMapping,
  isProductionQuestionRecord,
  isProductionRelationRecord,
  isProductionSourceReference,
} from './productionGuard'

function isProductionCatalogReference(record: {
  id: string
  status: string
  isSample?: boolean
  needsVerification?: boolean
  verificationStatus?: string
}): boolean {
  return (
    record.status === 'ACTIVE' &&
    !record.id.startsWith('SAMPLE_') &&
    record.isSample !== true &&
    record.needsVerification !== true &&
    (!record.verificationStatus || record.verificationStatus === 'REVIEWED')
  )
}

function releasedEntries(scope: MvpCurriculumScope) {
  return scope.entries.filter(
    (entry) => entry.status === 'RELEASED' && Boolean(entry.textbookVersionId),
  )
}

function collectQuestionMediaIds(questions: ProductionReadinessDataset['questions']): Set<string> {
  const ids = new Set<string>()
  for (const question of questions) {
    for (const media of question.media) ids.add(media.mediaAssetId)
    for (const option of question.options ?? []) {
      for (const media of option.media ?? []) ids.add(media.mediaAssetId)
      for (const block of option.content) if (block.mediaAssetId) ids.add(block.mediaAssetId)
    }
    for (const block of question.stem) if (block.mediaAssetId) ids.add(block.mediaAssetId)
    for (const hint of question.hints) {
      for (const block of hint.content) if (block.mediaAssetId) ids.add(block.mediaAssetId)
    }
    for (const block of question.explanation.summary) {
      if (block.mediaAssetId) ids.add(block.mediaAssetId)
    }
    for (const step of question.explanation.steps) {
      for (const block of step) if (block.mediaAssetId) ids.add(block.mediaAssetId)
    }
  }
  return ids
}

function collectContentMediaIds(contents: ProductionReadinessDataset['contents']): Set<string> {
  const ids = new Set<string>()
  for (const content of contents) {
    for (const media of content.media ?? []) ids.add(media.mediaAssetId)
    const blocks = content.body['blocks']
    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        if (block && typeof block === 'object' && 'mediaAssetId' in block) {
          const mediaAssetId = (block as { mediaAssetId?: unknown }).mediaAssetId
          if (typeof mediaAssetId === 'string') ids.add(mediaAssetId)
        }
      }
    }
  }
  return ids
}

/**
 * Build the allow-list consumed by a production adapter. The function never
 * promotes a record: only records already in REVIEWED/PUBLISHED state enter.
 */
export function buildProductionIndex(
  dataset: ProductionReadinessDataset,
  scope: MvpCurriculumScope,
): ProductionIndex {
  const entries = releasedEntries(scope)
  const textbookIds = new Set(entries.map((entry) => entry.textbookVersionId as string))
  const regionCodes = new Set(entries.map((entry) => entry.regionCode))
  const regions = dataset.regions.filter(
    (region) => regionCodes.has(region.code) && isProductionCurriculumRecord(region),
  )
  const regionIds = new Set(regions.map((region) => region.id))
  const textbooks = dataset.textbooks.filter(
    (textbook) => textbookIds.has(textbook.id) && isProductionCurriculumRecord(textbook),
  )
  const publisherIds = new Set(textbooks.map((textbook) => textbook.publisherId))
  const publishers = dataset.publishers.filter(
    (publisher) => publisherIds.has(publisher.id) && isProductionCurriculumRecord(publisher),
  )
  const textbookIdSet = new Set(textbooks.map((textbook) => textbook.id))
  const regionTextbookRelations = dataset.regionTextbookRelations.filter(
    (relation) =>
      regionIds.has(relation.regionId) &&
      textbookIdSet.has(relation.textbookVersionId) &&
      isProductionRelationRecord(relation),
  )
  const unitIds = new Set(
    dataset.units
      .filter(
        (unit) => textbookIdSet.has(unit.textbookVersionId) && isProductionCurriculumRecord(unit),
      )
      .map((unit) => unit.id),
  )
  const units = dataset.units.filter((unit) => unitIds.has(unit.id))
  const lessons = dataset.lessons.filter(
    (lesson) => unitIds.has(lesson.unitId) && isProductionCurriculumRecord(lesson),
  )
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const lessonKnowledgePointRelations = dataset.lessonKnowledgePointRelations.filter(
    (relation) => lessonIds.has(relation.lessonId) && isProductionRelationRecord(relation),
  )
  const knowledgePointIds = new Set(
    lessonKnowledgePointRelations.map((relation) => relation.knowledgePointId),
  )
  const knowledgePoints = dataset.knowledgePoints.filter(
    (knowledgePoint) =>
      knowledgePointIds.has(knowledgePoint.id) && isProductionCurriculumRecord(knowledgePoint),
  )
  const finalKnowledgePointIds = new Set(knowledgePoints.map((knowledgePoint) => knowledgePoint.id))
  const knowledgePrerequisites = dataset.knowledgePrerequisites.filter(
    (relation) =>
      finalKnowledgePointIds.has(relation.prerequisiteKnowledgePointId) &&
      finalKnowledgePointIds.has(relation.dependentKnowledgePointId) &&
      isProductionRelationRecord(relation),
  )
  const grades = dataset.grades.filter(
    (grade) =>
      textbooks.some((textbook) => textbook.gradeId === grade.id) &&
      isProductionCatalogReference(grade),
  )
  const semesters = dataset.semesters.filter(
    (semester) =>
      textbooks.some((textbook) => textbook.semesterId === semester.id) &&
      isProductionCatalogReference(semester),
  )
  const subjects = dataset.subjects.filter(
    (subject) =>
      textbooks.some((textbook) => textbook.subjectId === subject.id) &&
      isProductionCatalogReference(subject),
  )
  const sourceIds = new Set([
    ...textbooks.map((textbook) => textbook.sourceId),
    ...publishers.map((publisher) => publisher.sourceId),
    ...regionTextbookRelations.map((relation) => relation.sourceId),
    ...units.map((unit) => unit.sourceId),
    ...lessons.map((lesson) => lesson.sourceId),
    ...knowledgePoints.map((knowledgePoint) => knowledgePoint.sourceId),
    ...lessonKnowledgePointRelations.map((relation) => relation.sourceId),
    ...knowledgePrerequisites.map((relation) => relation.sourceId),
  ])
  const sourceReferences = dataset.sourceReferences.filter(
    (source) => sourceIds.has(source.id) && isProductionSourceReference(source),
  )

  const contents = dataset.contents.filter(
    (content) =>
      finalKnowledgePointIds.has(content.knowledgePointId) && isProductionContentRecord(content),
  )
  const contentIds = new Set(contents.map((content) => content.id))
  const questions = dataset.questions.filter((question) => {
    const mappedToScope = dataset.questionKnowledgePoints.some(
      (mapping) =>
        mapping.questionId === question.id &&
        finalKnowledgePointIds.has(mapping.knowledgePointId) &&
        isProductionQuestionMapping(mapping),
    )
    return (
      mappedToScope &&
      (!question.textbookVersionId || textbookIdSet.has(question.textbookVersionId)) &&
      isProductionQuestionRecord(question)
    )
  })
  const questionIds = new Set(questions.map((question) => question.id))
  const questionKnowledgePoints = dataset.questionKnowledgePoints.filter(
    (mapping) =>
      questionIds.has(mapping.questionId) &&
      finalKnowledgePointIds.has(mapping.knowledgePointId) &&
      isProductionQuestionMapping(mapping),
  )
  const contentSourceIds = new Set([
    ...contents.map((content) => content.sourceId),
    ...questions.map((question) => question.sourceId),
  ])
  const contentSources = dataset.contentSources.filter(
    (source) => contentSourceIds.has(source.id) && isProductionContentSource(source),
  )
  const mediaIds = new Set([
    ...collectContentMediaIds(contents),
    ...collectQuestionMediaIds(questions),
  ])
  const mediaAssets = dataset.mediaAssets.filter(
    (asset) => mediaIds.has(asset.id) && isProductionMediaAsset(asset),
  )

  return {
    scopeId: scope.id,
    regions,
    grades,
    semesters,
    subjects,
    publishers,
    textbooks,
    regionTextbookRelations,
    units,
    lessons,
    knowledgePoints,
    lessonKnowledgePointRelations: lessonKnowledgePointRelations.filter((relation) =>
      finalKnowledgePointIds.has(relation.knowledgePointId),
    ),
    knowledgePrerequisites,
    sourceReferences,
    textbookIds: textbookIdSet,
    lessonIds,
    knowledgePointIds: finalKnowledgePointIds,
    contents,
    questions,
    questionKnowledgePoints,
    contentSources,
    mediaAssets,
    questionIds,
    contentIds,
  }
}
