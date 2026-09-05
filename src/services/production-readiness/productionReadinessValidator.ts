import type {
  MvpCurriculumScope,
  ProductionReadinessDataset,
  ProductionReadinessIssue,
  ProductionReadinessReport,
} from '@/types'

import { buildContentCoverageReport, buildQuestionCoverageReport } from './coverage'
import { validateRegionMappings } from './regionMapping'
import { buildProductionIndex } from './productionIndex'
import {
  isProductionContentRecord,
  isProductionContentSource,
  isProductionCurriculumRecord,
  isProductionQuestionMapping,
  isProductionQuestionRecord,
  isProductionSourceReference,
  scanProductionSampleLeaks,
} from './productionGuard'

function issue(
  code: string,
  message: string,
  entityId?: string,
  severity: ProductionReadinessIssue['severity'] = 'blocking',
): ProductionReadinessIssue {
  return { code, message, ...(entityId ? { entityId } : {}), severity }
}

function releaseEntries(scope: MvpCurriculumScope) {
  return scope.entries.filter(
    (entry) => entry.status === 'RELEASED' && Boolean(entry.textbookVersionId),
  )
}

function validateSourceReferences(dataset: ProductionReadinessDataset, scope: MvpCurriculumScope) {
  const sourcesById = new Map(dataset.sourceReferences.map((source) => [source.id, source]))
  const issues: ProductionReadinessIssue[] = []
  for (const sourceId of scope.sourceReferenceIds) {
    const source = sourcesById.get(sourceId)
    if (!source)
      issues.push(
        issue('SOURCE_REFERENCE_NOT_FOUND', `缺少 SourceReference：${sourceId}`, sourceId),
      )
    else if (!isProductionSourceReference(source)) {
      issues.push(
        issue(
          'SOURCE_REFERENCE_NOT_RELEASE_READY',
          `SourceReference 尚未具备可发布的 URL 与人工核验记录：${sourceId}`,
          sourceId,
        ),
      )
    }
  }
  return issues
}

function validateReleaseScope(
  dataset: ProductionReadinessDataset,
  scope: MvpCurriculumScope,
): ProductionReadinessIssue[] {
  const issues: ProductionReadinessIssue[] = []
  const entries = releaseEntries(scope)
  if (entries.length === 0) {
    issues.push(issue('RELEASE_SCOPE_EMPTY', 'MVP Curriculum Scope 没有任何 RELEASED 条目。'))
    return issues
  }
  const textbooksById = new Map(dataset.textbooks.map((textbook) => [textbook.id, textbook]))
  for (const entry of entries) {
    const textbook = textbooksById.get(entry.textbookVersionId as string)
    if (!textbook) {
      issues.push(
        issue(
          'RELEASE_TEXTBOOK_NOT_FOUND',
          `Scope 教材不存在：${entry.textbookVersionId}`,
          entry.id,
        ),
      )
      continue
    }
    if (!isProductionCurriculumRecord(textbook)) {
      issues.push(
        issue(
          'RELEASE_TEXTBOOK_NOT_READY',
          `Scope 教材未达到 REVIEWED/ACTIVE：${textbook.id}`,
          textbook.id,
        ),
      )
    }
  }
  return issues
}

export function validateProductionReadiness(
  dataset: ProductionReadinessDataset,
  scope: MvpCurriculumScope,
): ProductionReadinessReport {
  const issues: ProductionReadinessIssue[] = [
    ...validateSourceReferences(dataset, scope),
    ...validateReleaseScope(dataset, scope),
  ]
  const index = buildProductionIndex(dataset, scope)
  const curriculum = {
    candidateCount: scope.entries.filter((entry) => entry.status === 'CANDIDATE').length,
    releasedCount: scope.entries.filter((entry) => entry.status === 'RELEASED').length,
    reviewedTextbookCount: index.textbooks.length,
    reviewedUnitCount: index.units.length,
    reviewedLessonCount: index.lessons.length,
    reviewedKnowledgePointCount: index.knowledgePoints.length,
    sourceReferenceCount: dataset.sourceReferences.length,
    regionMapping: validateRegionMappings(dataset, scope),
  }
  if (!curriculum.regionMapping.valid) {
    issues.push(
      ...curriculum.regionMapping.issues.map((message) => issue('REGION_MAPPING_INVALID', message)),
    )
  }

  const contentCoverage = buildContentCoverageReport({
    curriculum: {
      textbookIds: index.textbookIds,
      units: dataset.units,
      lessons: dataset.lessons,
      knowledgePoints: dataset.knowledgePoints,
      lessonKnowledgePointRelations: dataset.lessonKnowledgePointRelations,
    },
    contents: dataset.contents,
    contentSources: dataset.contentSources,
    mediaAssets: dataset.mediaAssets,
  })
  const content =
    index.textbookIds.size > 0 ? contentCoverage : { ...contentCoverage, passed: false }
  if (!content.passed) {
    issues.push(issue('CONTENT_COVERAGE_INCOMPLETE', '正式 Lesson Content 覆盖或来源校验未通过。'))
  }

  const questionCoverage = buildQuestionCoverageReport({
    knowledgePoints: dataset.knowledgePoints.filter((point) =>
      index.knowledgePointIds.has(point.id),
    ),
    questions: dataset.questions,
    questionKnowledgePoints: dataset.questionKnowledgePoints,
    contentSources: dataset.contentSources,
    mediaAssets: dataset.mediaAssets,
  })
  const questions =
    index.textbookIds.size > 0 ? questionCoverage : { ...questionCoverage, passed: false }
  if (!questions.passed) {
    issues.push(issue('QUESTION_COVERAGE_INCOMPLETE', '正式题目覆盖、来源或答案结构校验未通过。'))
  }

  const sampleLeak = scanProductionSampleLeaks([
    {
      dataset: 'production curriculum index',
      records: [
        ...index.regions,
        ...index.publishers,
        ...index.textbooks,
        ...index.regionTextbookRelations,
        ...index.units,
        ...index.lessons,
        ...index.knowledgePoints,
        ...index.lessonKnowledgePointRelations,
        ...index.knowledgePrerequisites,
      ],
    },
    { dataset: 'production content index', records: index.contents },
    {
      dataset: 'production question index',
      records: [...index.questions, ...index.questionKnowledgePoints],
    },
  ])
  if (!sampleLeak.passed) issues.push(issue('SAMPLE_LEAK', '生产索引发现 SAMPLE 数据泄漏。'))

  // The comparisons below protect the report from claiming readiness when a
  // raw array contains a blocked record that the allow-list intentionally
  // omitted.
  const releasedTextbookIds = index.textbookIds
  for (const contentRecord of dataset.contents) {
    if (
      contentRecord.verificationStatus === 'REVIEWED' &&
      releasedTextbookIds.size === 0 &&
      isProductionContentRecord(contentRecord)
    ) {
      issues.push(
        issue(
          'CONTENT_OUTSIDE_RELEASE_SCOPE',
          `正式内容没有对应的 RELEASED 教材：${contentRecord.id}`,
          contentRecord.id,
        ),
      )
    }
  }
  for (const questionRecord of dataset.questions) {
    if (
      questionRecord.verificationStatus === 'REVIEWED' &&
      releasedTextbookIds.size === 0 &&
      isProductionQuestionRecord(questionRecord)
    ) {
      issues.push(
        issue(
          'QUESTION_OUTSIDE_RELEASE_SCOPE',
          `正式题目没有对应的 RELEASED 教材：${questionRecord.id}`,
          questionRecord.id,
        ),
      )
    }
  }
  for (const mapping of dataset.questionKnowledgePoints) {
    if (mapping.verificationStatus === 'REVIEWED' && !isProductionQuestionMapping(mapping)) {
      issues.push(
        issue(
          'QUESTION_MAPPING_NOT_RELEASE_READY',
          `题目关系未达到 REVIEWED/ACTIVE：${mapping.id}`,
          mapping.id,
        ),
      )
    }
  }
  for (const source of dataset.contentSources) {
    if (source.verificationStatus === 'REVIEWED' && !isProductionContentSource(source)) {
      issues.push(
        issue(
          'CONTENT_SOURCE_NOT_RELEASE_READY',
          `内容来源未通过版权或来源门禁：${source.id}`,
          source.id,
        ),
      )
    }
  }

  const uniqueIssues = issues.filter(
    (current, indexPosition, all) =>
      all.findIndex(
        (candidate) =>
          candidate.code === current.code &&
          candidate.entityId === current.entityId &&
          candidate.message === current.message,
      ) === indexPosition,
  )
  return {
    version: 'PRODUCTION_READINESS_V1',
    scopeId: scope.id,
    status: uniqueIssues.some((current) => current.severity === 'blocking') ? 'FAIL' : 'PASS',
    issues: uniqueIssues,
    curriculum,
    content,
    questions,
    sampleLeak,
    index,
  }
}
