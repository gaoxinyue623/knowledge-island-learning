import type {
  ContentCoverageReport,
  CourseContent,
  Lesson,
  MediaAsset,
  Question,
  QuestionCoverageReport,
  QuestionKnowledgePoint,
  KnowledgePoint,
  ContentSource,
  Unit,
} from '@/types'

import {
  isProductionContentRecord,
  isProductionContentSource,
  isProductionMediaAsset,
  isProductionQuestionMapping,
  isProductionQuestionRecord,
} from './productionGuard'
import { validateContentBlocks } from '../validation/contentBlockValidation'
import { validateQuestion } from '../validation/questionValidation'
import { validateQuestionKnowledgePointWeights } from '../validation/questionKnowledgePointValidation'

interface ScopeCurriculumInput {
  textbookIds: ReadonlySet<string>
  units: readonly Unit[]
  lessons: readonly Lesson[]
  knowledgePoints: readonly KnowledgePoint[]
  lessonKnowledgePointRelations: readonly {
    lessonId: string
    knowledgePointId: string
  }[]
}

function mediaIdsFromContent(content: CourseContent): string[] {
  const ids = (content.media ?? []).map((media) => media.mediaAssetId)
  const blocks = content.body['blocks']
  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (block && typeof block === 'object' && 'mediaAssetId' in block) {
        const mediaAssetId = (block as { mediaAssetId?: unknown }).mediaAssetId
        if (typeof mediaAssetId === 'string') ids.push(mediaAssetId)
      }
    }
  }
  return ids
}

function mediaIdsFromQuestion(question: Question): string[] {
  const ids = question.media.map((media) => media.mediaAssetId)
  for (const block of question.stem) if (block.mediaAssetId) ids.push(block.mediaAssetId)
  for (const option of question.options ?? []) {
    for (const media of option.media ?? []) ids.push(media.mediaAssetId)
    for (const block of option.content) if (block.mediaAssetId) ids.push(block.mediaAssetId)
  }
  for (const hint of question.hints) {
    for (const block of hint.content) if (block.mediaAssetId) ids.push(block.mediaAssetId)
  }
  for (const block of question.explanation.summary)
    if (block.mediaAssetId) ids.push(block.mediaAssetId)
  for (const step of question.explanation.steps) {
    for (const block of step) if (block.mediaAssetId) ids.push(block.mediaAssetId)
  }
  return ids
}

export function buildContentCoverageReport(input: {
  curriculum: ScopeCurriculumInput
  contents: readonly CourseContent[]
  contentSources: readonly ContentSource[]
  mediaAssets: readonly MediaAsset[]
}): ContentCoverageReport {
  const unitIds = new Set(
    input.curriculum.units
      .filter((unit) => input.curriculum.textbookIds.has(unit.textbookVersionId))
      .map((unit) => unit.id),
  )
  const lessons = input.curriculum.lessons.filter((lesson) => unitIds.has(lesson.unitId))
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const knowledgePointIds = new Set(
    input.curriculum.lessonKnowledgePointRelations
      .filter((mapping) => lessonIds.has(mapping.lessonId))
      .map((mapping) => mapping.knowledgePointId),
  )
  const knowledgePoints = input.curriculum.knowledgePoints.filter((point) =>
    knowledgePointIds.has(point.id),
  )
  const mediaById = new Map(input.mediaAssets.map((asset) => [asset.id, asset]))
  const sourcesById = new Map(input.contentSources.map((source) => [source.id, source]))
  const scopedContents = input.contents.filter((content) =>
    knowledgePointIds.has(content.knowledgePointId),
  )
  const invalidContentIds: string[] = []
  const contentByKnowledgePoint = new Map<string, CourseContent>()
  let contentBlockCount = 0
  let unsupportedMediaCount = 0
  let sourceIssueCount = 0
  for (const content of scopedContents) {
    const rawBlocks = content.body['blocks']
    const blocks = Array.isArray(rawBlocks) ? rawBlocks : null
    const blockReport = blocks
      ? validateContentBlocks(blocks)
      : { valid: false, issues: [] as string[] }
    const source = sourcesById.get(content.sourceId)
    if (!source || !isProductionContentSource(source)) sourceIssueCount += 1
    for (const mediaId of mediaIdsFromContent(content)) {
      const asset = mediaById.get(mediaId)
      if (!asset || !isProductionMediaAsset(asset)) unsupportedMediaCount += 1
    }
    if (
      !isProductionContentRecord(content) ||
      !blockReport.valid ||
      !source ||
      !isProductionContentSource(source)
    ) {
      invalidContentIds.push(content.id)
      continue
    }
    contentBlockCount += blocks?.length ?? 0
    const existing = contentByKnowledgePoint.get(content.knowledgePointId)
    if (!existing || content.currentVersion > existing.currentVersion) {
      contentByKnowledgePoint.set(content.knowledgePointId, content)
    }
  }
  const missingKnowledgePointIds = knowledgePoints
    .filter((point) => !contentByKnowledgePoint.has(point.id))
    .map((point) => point.id)
    .sort()
  const missingLessonIds = lessons
    .filter((lesson) => {
      const mappings = input.curriculum.lessonKnowledgePointRelations.filter(
        (mapping) => mapping.lessonId === lesson.id,
      )
      return (
        mappings.length === 0 ||
        mappings.every((mapping) => !contentByKnowledgePoint.has(mapping.knowledgePointId))
      )
    })
    .map((lesson) => lesson.id)
    .sort()
  const reviewedContentCount = contentByKnowledgePoint.size
  return {
    lessonTotal: lessons.length,
    knowledgePointTotal: knowledgePoints.length,
    contentBlockCount,
    reviewedContentCount,
    missingLessonIds,
    missingKnowledgePointIds,
    invalidContentIds: [...new Set(invalidContentIds)].sort(),
    unsupportedMediaCount,
    sourceIssueCount,
    passed:
      missingLessonIds.length === 0 &&
      missingKnowledgePointIds.length === 0 &&
      invalidContentIds.length === 0 &&
      unsupportedMediaCount === 0 &&
      sourceIssueCount === 0,
  }
}

export function buildQuestionCoverageReport(input: {
  knowledgePoints: readonly KnowledgePoint[]
  questions: readonly Question[]
  questionKnowledgePoints: readonly QuestionKnowledgePoint[]
  contentSources: readonly ContentSource[]
  mediaAssets: readonly MediaAsset[]
  minimumQuestionsPerKnowledgePoint?: number
}): QuestionCoverageReport {
  const minimum = input.minimumQuestionsPerKnowledgePoint ?? 5
  const knowledgePointIds = new Set(input.knowledgePoints.map((point) => point.id))
  const questionIds = new Set(input.questions.map((question) => question.id))
  const sourcesById = new Map(input.contentSources.map((source) => [source.id, source]))
  const mediaById = new Map(input.mediaAssets.map((asset) => [asset.id, asset]))
  const mappingReport = validateQuestionKnowledgePointWeights(input.questionKnowledgePoints)
  const invalidQuestionIds: string[] = []
  const sourceIssueQuestionIds = new Set<string>()
  const validQuestions: Question[] = []
  const typeDistribution: QuestionCoverageReport['typeDistribution'] = {}
  const difficultyDistribution = { FOUNDATION: 0, STANDARD: 0, ADVANCED: 0 }
  for (const question of input.questions) {
    const mappings = input.questionKnowledgePoints.filter(
      (mapping) => mapping.questionId === question.id,
    )
    const questionValidation = validateQuestion(question, {
      knowledgePointIds,
      questionIds,
      questionKnowledgePoints: input.questionKnowledgePoints,
      mediaAssetIds: new Set(input.mediaAssets.map((asset) => asset.id)),
    })
    const source = sourcesById.get(question.sourceId)
    const mediaValid = mediaIdsFromQuestion(question).every((mediaId) => {
      const asset = mediaById.get(mediaId)
      return Boolean(asset && isProductionMediaAsset(asset))
    })
    const mappingValid = mappings.length > 0 && mappings.every(isProductionQuestionMapping)
    const productionQuestion = isProductionQuestionRecord(question)
    if (!source || !isProductionContentSource(source)) sourceIssueQuestionIds.add(question.id)
    if (!questionValidation.valid || !mediaValid || !mappingValid || !productionQuestion) {
      invalidQuestionIds.push(question.id)
      continue
    }
    validQuestions.push(question)
    typeDistribution[question.questionType] = (typeDistribution[question.questionType] ?? 0) + 1
    difficultyDistribution[question.difficulty] += 1
  }
  if (!mappingReport.valid) {
    for (const mapping of input.questionKnowledgePoints) {
      if (questionIds.has(mapping.questionId)) invalidQuestionIds.push(mapping.questionId)
    }
  }
  const countsByKnowledgePoint = new Map<string, number>()
  for (const mapping of input.questionKnowledgePoints) {
    if (questionIds.has(mapping.questionId) && knowledgePointIds.has(mapping.knowledgePointId)) {
      countsByKnowledgePoint.set(
        mapping.knowledgePointId,
        (countsByKnowledgePoint.get(mapping.knowledgePointId) ?? 0) +
          (validQuestions.some((question) => question.id === mapping.questionId) ? 1 : 0),
      )
    }
  }
  const missingKnowledgePointIds = input.knowledgePoints
    .filter((point) => !countsByKnowledgePoint.has(point.id))
    .map((point) => point.id)
    .sort()
  const insufficientKnowledgePointIds = input.knowledgePoints
    .filter((point) => {
      const count = countsByKnowledgePoint.get(point.id) ?? 0
      return count > 0 && count < minimum
    })
    .map((point) => point.id)
    .sort()
  const uniqueInvalidQuestionIds = [...new Set(invalidQuestionIds)].sort()
  const sourceIssueCount = sourceIssueQuestionIds.size
  return {
    knowledgePointTotal: input.knowledgePoints.length,
    knowledgePointsWithQuestions: input.knowledgePoints.length - missingKnowledgePointIds.length,
    questionCount: input.questions.length,
    reviewedQuestionCount: validQuestions.length,
    typeDistribution,
    difficultyDistribution,
    missingKnowledgePointIds,
    insufficientKnowledgePointIds,
    invalidQuestionIds: uniqueInvalidQuestionIds,
    sourceIssueCount,
    minimumQuestionsPerKnowledgePoint: minimum,
    passed:
      missingKnowledgePointIds.length === 0 &&
      insufficientKnowledgePointIds.length === 0 &&
      uniqueInvalidQuestionIds.length === 0 &&
      sourceIssueCount === 0 &&
      mappingReport.valid,
  }
}
