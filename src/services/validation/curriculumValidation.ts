import type { KnowledgePrerequisite } from '@/types'

import { curriculumData } from '@/data/curriculum'
import { validateContentBlock } from './contentBlockValidation'
import { validateQuestion } from './questionValidation'

export interface CurriculumValidationReport {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface PrerequisiteGraphReport {
  valid: boolean
  errors: string[]
}

export function validateKnowledgePrerequisiteGraph(
  relations: KnowledgePrerequisite[],
  knowledgePointIds: ReadonlySet<string>,
): PrerequisiteGraphReport {
  const errors: string[] = []
  const adjacency = new Map<string, string[]>()

  for (const relation of relations) {
    const { prerequisiteKnowledgePointId: from, dependentKnowledgePointId: to } = relation
    if (!knowledgePointIds.has(from)) {
      errors.push(`${relation.id}: invalid prerequisiteKnowledgePointId ${from}`)
    }
    if (!knowledgePointIds.has(to)) {
      errors.push(`${relation.id}: invalid dependentKnowledgePointId ${to}`)
    }
    if (from === to) {
      errors.push(`${relation.id}: self-reference ${from}`)
    }
    if (knowledgePointIds.has(from) && knowledgePointIds.has(to) && from !== to) {
      const next = adjacency.get(from) ?? []
      next.push(to)
      adjacency.set(from, next)
    }
  }

  const state = new Map<string, 'VISITING' | 'VISITED'>()
  const path: string[] = []
  const visit = (node: string) => {
    const currentState = state.get(node)
    if (currentState === 'VISITED') return
    if (currentState === 'VISITING') {
      const cycleStart = path.indexOf(node)
      const cycle = [...path.slice(cycleStart), node].join(' -> ')
      errors.push(`cycle detected: ${cycle}`)
      return
    }

    state.set(node, 'VISITING')
    path.push(node)
    for (const next of adjacency.get(node) ?? []) visit(next)
    path.pop()
    state.set(node, 'VISITED')
  }

  for (const knowledgePointId of knowledgePointIds) visit(knowledgePointId)
  return { valid: errors.length === 0, errors }
}

export function validateSamplePublishGuard(record: {
  isSample?: boolean
  verificationStatus?: string
  status: string
}): string[] {
  const errors: string[] = []
  if (record.isSample === true && record.status === 'PUBLISHED') {
    errors.push('isSample=true 的记录不能进入 PUBLISHED')
  }
  if (
    record.isSample === true &&
    (record.verificationStatus === 'VERIFIED' || record.verificationStatus === 'REVIEWED')
  ) {
    errors.push('isSample=true 的记录不能进入 VERIFIED 或 REVIEWED')
  }
  if (
    record.isSample === true &&
    record.verificationStatus &&
    record.verificationStatus !== 'SAMPLE'
  ) {
    errors.push('isSample=true 的记录 verificationStatus 必须是 SAMPLE')
  }
  return errors
}

function collectSampleGuard(
  errors: string[],
  label: string,
  record: {
    isSample?: boolean
    needsVerification?: boolean
    verificationStatus?: string
    status: string
  },
) {
  errors.push(...validateSamplePublishGuard(record).map((error) => `${label}: ${error}`))
  if (record.isSample === true && record.needsVerification !== true) {
    errors.push(`${label}: SAMPLE 记录必须 needsVerification=true`)
  }
  if (record.isSample === true && record.verificationStatus !== 'SAMPLE') {
    errors.push(`${label}: SAMPLE 记录必须 verificationStatus=SAMPLE`)
  }
}

export function validateCurriculumData(
  data: typeof curriculumData = curriculumData,
): CurriculumValidationReport {
  const errors: string[] = []
  const warnings: string[] = []
  const indexes = {
    gradeById: new Map(data.grades.map((grade) => [grade.id, grade])),
    semesterById: new Map(data.semesters.map((semester) => [semester.id, semester])),
    subjectById: new Map(data.subjects.map((subject) => [subject.id, subject])),
    regionById: new Map(data.regions.map((region) => [region.id, region])),
    publisherById: new Map(data.publishers.map((publisher) => [publisher.id, publisher])),
    textbookById: new Map(data.textbooks.map((textbook) => [textbook.id, textbook])),
    unitById: new Map(data.units.map((unit) => [unit.id, unit])),
    lessonById: new Map(data.lessons.map((lesson) => [lesson.id, lesson])),
  }
  const knowledgePointIds = new Set(data.knowledgePoints.map((knowledgePoint) => knowledgePoint.id))
  const questionIds = new Set(data.questions.map((question) => question.id))
  const sourceIds = new Set(data.sources.map((source) => source.id))
  const mediaAssetIds = new Set(data.mediaAssets.map((asset) => asset.id))

  for (const publisher of data.publishers) {
    collectSampleGuard(errors, `Publisher ${publisher.id}`, publisher)
    if (!sourceIds.has(publisher.sourceId))
      errors.push(`Publisher ${publisher.id}: sourceId 不存在`)
  }

  for (const region of data.regions) {
    collectSampleGuard(
      errors,
      `Region ${region.id}`,
      region as typeof region & { isSample?: boolean; needsVerification?: boolean },
    )
  }

  for (const textbook of data.textbooks) {
    collectSampleGuard(errors, `TextbookVersion ${textbook.id}`, textbook)
    if (!indexes.publisherById.has(textbook.publisherId)) {
      errors.push(`TextbookVersion ${textbook.id}: publisherId 不存在`)
    }
    if (!indexes.gradeById.has(textbook.gradeId))
      errors.push(`TextbookVersion ${textbook.id}: gradeId 不存在`)
    if (!indexes.semesterById.has(textbook.semesterId)) {
      errors.push(`TextbookVersion ${textbook.id}: semesterId 不存在`)
    }
    if (!indexes.subjectById.has(textbook.subjectId)) {
      errors.push(`TextbookVersion ${textbook.id}: subjectId 不存在`)
    }
    if (!sourceIds.has(textbook.sourceId))
      errors.push(`TextbookVersion ${textbook.id}: sourceId 不存在`)
  }

  for (const regionRelation of data.regionTextbookRelations) {
    collectSampleGuard(errors, `RegionTextbookRelation ${regionRelation.id}`, regionRelation)
    if (!indexes.regionById.has(regionRelation.regionId)) {
      errors.push(`RegionTextbookRelation ${regionRelation.id}: regionId 不存在`)
    }
    if (!indexes.textbookById.has(regionRelation.textbookVersionId)) {
      errors.push(`RegionTextbookRelation ${regionRelation.id}: textbookVersionId 不存在`)
    }
    if (!sourceIds.has(regionRelation.sourceId)) {
      errors.push(`RegionTextbookRelation ${regionRelation.id}: sourceId 不存在`)
    }
  }

  for (const unit of data.units) {
    collectSampleGuard(errors, `Unit ${unit.id}`, unit)
    if (!indexes.textbookById.has(unit.textbookVersionId)) {
      errors.push(`Unit ${unit.id}: textbookVersionId 不存在`)
    }
  }

  for (const lesson of data.lessons) {
    collectSampleGuard(errors, `Lesson ${lesson.id}`, lesson)
    if (!indexes.unitById.has(lesson.unitId)) errors.push(`Lesson ${lesson.id}: unitId 不存在`)
  }

  for (const knowledgePoint of data.knowledgePoints) {
    collectSampleGuard(errors, `KnowledgePoint ${knowledgePoint.id}`, knowledgePoint)
    if (!indexes.subjectById.has(knowledgePoint.subjectId)) {
      errors.push(`KnowledgePoint ${knowledgePoint.id}: subjectId 不存在`)
    }
    if (!sourceIds.has(knowledgePoint.sourceId)) {
      errors.push(`KnowledgePoint ${knowledgePoint.id}: sourceId 不存在`)
    }
    if (
      knowledgePoint.gradeScope.minGrade < 1 ||
      knowledgePoint.gradeScope.maxGrade > 6 ||
      knowledgePoint.gradeScope.minGrade > knowledgePoint.gradeScope.maxGrade
    ) {
      errors.push(`KnowledgePoint ${knowledgePoint.id}: gradeScope 无效`)
    }
  }

  for (const relation of data.lessonKnowledgePointRelations) {
    collectSampleGuard(errors, `LessonKnowledgePointRelation ${relation.id}`, relation)
    if (!indexes.lessonById.has(relation.lessonId)) errors.push(`${relation.id}: lessonId 不存在`)
    if (!knowledgePointIds.has(relation.knowledgePointId)) {
      errors.push(`${relation.id}: knowledgePointId 不存在`)
    }
    if (!sourceIds.has(relation.sourceId)) errors.push(`${relation.id}: sourceId 不存在`)
  }

  const graphReport = validateKnowledgePrerequisiteGraph(
    data.knowledgePrerequisites,
    knowledgePointIds,
  )
  errors.push(...graphReport.errors.map((error) => `KnowledgePrerequisite: ${error}`))

  const questionKnowledgePointPairs = new Set<string>()
  const primaryQuestionIds = new Set<string>()
  for (const mapping of data.questionKnowledgePoints) {
    collectSampleGuard(errors, `QuestionKnowledgePoint ${mapping.id}`, mapping)
    if (!questionIds.has(mapping.questionId)) {
      errors.push(`QuestionKnowledgePoint ${mapping.id}: questionId 不存在`)
    }
    if (!knowledgePointIds.has(mapping.knowledgePointId)) {
      errors.push(`QuestionKnowledgePoint ${mapping.id}: knowledgePointId 不存在`)
    }
    if (!sourceIds.has(mapping.sourceId)) {
      errors.push(`QuestionKnowledgePoint ${mapping.id}: sourceId 不存在`)
    }
    const pair = `${mapping.questionId}::${mapping.knowledgePointId}`
    if (questionKnowledgePointPairs.has(pair)) {
      errors.push(`QuestionKnowledgePoint ${mapping.id}: 题目与知识点关系重复`)
    }
    questionKnowledgePointPairs.add(pair)
    if (mapping.isPrimary) {
      if (primaryQuestionIds.has(mapping.questionId)) {
        errors.push(`QuestionKnowledgePoint ${mapping.questionId}: PRIMARY 关系不能重复`)
      }
      primaryQuestionIds.add(mapping.questionId)
    }
  }

  for (const content of data.courseContents) {
    collectSampleGuard(errors, `CourseContent ${content.id}`, content)
    if (!knowledgePointIds.has(content.knowledgePointId)) {
      errors.push(`CourseContent ${content.id}: knowledgePointId 不存在`)
    }
    if (!sourceIds.has(content.sourceId))
      errors.push(`CourseContent ${content.id}: sourceId 不存在`)
    for (const media of content.media ?? []) {
      if (!mediaAssetIds.has(media.mediaAssetId)) {
        errors.push(`CourseContent ${content.id}: mediaAssetId ${media.mediaAssetId} 不存在`)
      }
    }
    const blocks = content.body['blocks']
    if (!Array.isArray(blocks)) {
      errors.push(`CourseContent ${content.id}: body.blocks 必须是 ContentBlock[]`)
    } else {
      blocks.forEach((block: unknown, index: number) => {
        const blockReport = validateContentBlock(block)
        errors.push(
          ...blockReport.issues.map(
            (issue) => `CourseContent ${content.id}.body.blocks[${index}]: ${issue}`,
          ),
        )
      })
    }
  }

  for (const question of data.questions) {
    collectSampleGuard(errors, `Question ${question.id}`, question)
    if (!data.questionKnowledgePoints.some((mapping) => mapping.questionId === question.id)) {
      errors.push(
        `Question ${question.id}: 必须通过 QuestionKnowledgePoint 关系关联 KnowledgePoint`,
      )
    }
    if (!primaryQuestionIds.has(question.id)) {
      errors.push(`Question ${question.id}: 必须有一条 PRIMARY QuestionKnowledgePoint 关系`)
    }
    const questionReport = validateQuestion(question, {
      knowledgePointIds,
      questionIds,
      questionKnowledgePoints: data.questionKnowledgePoints,
      sourceIds,
      mediaAssetIds,
    })
    errors.push(...questionReport.issues.map((issue) => `Question ${question.id}: ${issue}`))
  }

  for (const asset of data.mediaAssets) {
    collectSampleGuard(errors, `MediaAsset ${asset.id}`, asset)
    if (!sourceIds.has(asset.sourceId)) errors.push(`MediaAsset ${asset.id}: sourceId 不存在`)
    if (asset.copyrightStatus === 'CLEARED') {
      warnings.push(`MediaAsset ${asset.id}: SAMPLE 不应使用 CLEARED 版权状态`)
    }
  }

  for (const map of data.learningMaps) {
    collectSampleGuard(errors, `LearningMap ${map.id}`, map)
    if (!indexes.unitById.has(map.unitId)) errors.push(`LearningMap ${map.id}: unitId 不存在`)
  }
  const mapIds = new Set(data.learningMaps.map((map) => map.id))
  const contentIds = new Set(data.courseContents.map((content) => content.id))
  for (const node of data.mapNodes) {
    collectSampleGuard(errors, `MapNode ${node.id}`, node)
    if (!mapIds.has(node.mapId)) errors.push(`MapNode ${node.id}: mapId 不存在`)
    for (const knowledgePointId of node.knowledgePointIds ?? []) {
      if (!knowledgePointIds.has(knowledgePointId)) {
        errors.push(`MapNode ${node.id}: knowledgePointId ${knowledgePointId} 不存在`)
      }
    }
    for (const contentId of node.contentIds ?? []) {
      if (!contentIds.has(contentId))
        errors.push(`MapNode ${node.id}: contentId ${contentId} 不存在`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
