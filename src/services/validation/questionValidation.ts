import type { Id, QuestionKnowledgePoint, QuestionType } from '@/types'

import { questionSchema } from './schemas'

export interface QuestionValidationReferences {
  knowledgePointIds?: ReadonlySet<Id>
  questionIds?: ReadonlySet<Id>
  questionKnowledgePoints?: readonly QuestionKnowledgePoint[]
  sourceIds?: ReadonlySet<Id>
  mediaAssetIds?: ReadonlySet<Id>
}

export interface QuestionValidationReport {
  valid: boolean
  issues: string[]
}

const expectedAnswerRule: Record<QuestionType, string> = {
  singleChoice: 'SINGLE_OPTION',
  multipleChoice: 'MULTIPLE_OPTIONS',
  fillBlank: 'TEXT_BLANKS',
  trueFalse: 'BOOLEAN',
  dragDrop: 'PLACEMENT',
  matching: 'PAIRS',
  sorting: 'ORDERED_KEYS',
  typing: 'ACCEPTED_TEXT',
  listening: 'LISTENING_RESPONSE',
  calculation: 'NUMERIC',
  shortAnswer: 'MANUAL_REVIEW',
  reading: 'READING_SUB_QUESTIONS',
  sentenceOrdering: 'ORDERED_TOKENS',
  speaking: 'SPEAKING_RUBRIC',
}

export function validateQuestion(
  question: unknown,
  references: QuestionValidationReferences = {},
): QuestionValidationReport {
  const result = questionSchema.safeParse(question)
  if (!result.success) {
    return {
      valid: false,
      issues: result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'question'
        return `${path}: ${issue.message}`
      }),
    }
  }

  const parsed = result.data
  const issues: string[] = []
  if (expectedAnswerRule[parsed.questionType] !== parsed.answerRule.ruleType) {
    issues.push(
      `answerRule.ruleType: ${parsed.questionType} 应使用 ${expectedAnswerRule[parsed.questionType]}`,
    )
  }

  if (
    references.knowledgePointIds &&
    parsed.knowledgePointId &&
    !references.knowledgePointIds.has(parsed.knowledgePointId)
  ) {
    issues.push(`knowledgePointId: 未找到 ${parsed.knowledgePointId}`)
  }
  if (references.questionIds && !references.questionIds.has(parsed.id)) {
    issues.push(`questionId: 未找到 ${parsed.id}`)
  }
  if (references.sourceIds && !references.sourceIds.has(parsed.sourceId)) {
    issues.push(`sourceId: 未找到 ${parsed.sourceId}`)
  }

  const mediaIds = [
    ...parsed.media.map((media) => media.mediaAssetId),
    ...(parsed.options ?? []).flatMap((option) =>
      (option.media ?? []).map((media) => media.mediaAssetId),
    ),
    ...parsed.stem.flatMap((block) => (block.mediaAssetId ? [block.mediaAssetId] : [])),
    ...parsed.hints.flatMap((hint) =>
      hint.content.flatMap((block) => (block.mediaAssetId ? [block.mediaAssetId] : [])),
    ),
    ...parsed.explanation.summary.flatMap((block) =>
      block.mediaAssetId ? [block.mediaAssetId] : [],
    ),
    ...parsed.explanation.steps.flatMap((step) =>
      step.flatMap((block) => (block.mediaAssetId ? [block.mediaAssetId] : [])),
    ),
  ]
  if (references.mediaAssetIds) {
    for (const mediaId of mediaIds) {
      if (!references.mediaAssetIds.has(mediaId)) {
        issues.push(`mediaAssetId: 未找到 ${mediaId}`)
      }
    }
  }

  for (const option of parsed.options ?? []) {
    if (option.questionId !== parsed.id) {
      issues.push(`options.${option.optionKey}.questionId: 必须等于 ${parsed.id}`)
    }
  }

  const options = parsed.options ?? []
  const optionIds = new Set(options.map((option) => option.id))
  const optionKeys = new Set(options.map((option) => option.optionKey))
  if (optionIds.size !== options.length) issues.push('options.id: 不能重复')
  if (optionKeys.size !== options.length) issues.push('options.optionKey: 不能重复')

  if (['singleChoice', 'multipleChoice'].includes(parsed.questionType) && options.length < 2) {
    issues.push(`${parsed.questionType}: 至少需要两个选项`)
  }

  if (parsed.questionType === 'singleChoice') {
    if (
      parsed.answerRule.ruleType === 'SINGLE_OPTION' &&
      !optionKeys.has(parsed.answerRule.correctOptionKey)
    ) {
      issues.push('answerRule.correctOptionKey: 必须引用已有选项')
    }
  }

  if (parsed.questionType === 'multipleChoice') {
    if (parsed.answerRule.ruleType === 'MULTIPLE_OPTIONS') {
      const answerKeys = new Set(parsed.answerRule.correctOptionKeys)
      if (answerKeys.size !== parsed.answerRule.correctOptionKeys.length) {
        issues.push('answerRule.correctOptionKeys: 不能重复')
      }
      if (answerKeys.size === 0 || [...answerKeys].some((key) => !optionKeys.has(key))) {
        issues.push('answerRule.correctOptionKeys: 必须引用已有选项')
      }
    }
  }

  if (parsed.questionType === 'fillBlank' && parsed.answerRule.ruleType === 'TEXT_BLANKS') {
    if (parsed.answerRule.blanks.length === 0) {
      issues.push('answerRule.blanks: 至少需要一个空')
    }
    const blankIds = new Set(parsed.answerRule.blanks.map((blank) => blank.blankId))
    if (blankIds.size !== parsed.answerRule.blanks.length) {
      issues.push('answerRule.blanks.blankId: 不能重复')
    }
    parsed.answerRule.blanks.forEach((blank) => {
      if (blank.acceptedAnswers.every((answer) => answer.trim() === '')) {
        issues.push(`answerRule.blanks.${blank.blankId}: 至少需要一个非空答案`)
      }
    })
  }

  if (parsed.questionType === 'calculation' && parsed.answerRule.ruleType === 'NUMERIC') {
    const numericValue = Number(parsed.answerRule.value)
    if (!Number.isFinite(numericValue)) issues.push('answerRule.value: 必须是有效数字')
    if (
      parsed.answerRule.tolerance !== undefined &&
      !Number.isFinite(parsed.answerRule.tolerance)
    ) {
      issues.push('answerRule.tolerance: 必须是有效数字')
    }
  }

  if (references.questionKnowledgePoints) {
    const mappings = references.questionKnowledgePoints.filter(
      (mapping) => mapping.questionId === parsed.id,
    )
    if (mappings.length === 0) {
      issues.push('QuestionKnowledgePoint: 至少需要一条知识点关系')
    }
  }

  if (parsed.questionType === 'dragDrop') {
    const itemKeys = new Set((parsed.draggableItems ?? []).map((item) => item.itemKey))
    const targetKeys = new Set((parsed.targets ?? []).map((target) => target.targetKey))
    if (itemKeys.size === 0 || targetKeys.size === 0) {
      issues.push('dragDrop: 必须提供 draggableItems 和 targets')
    }
    if (parsed.answerRule.ruleType === 'PLACEMENT') {
      for (const placement of parsed.answerRule.placements) {
        if (!itemKeys.has(placement.itemKey)) {
          issues.push(`answerRule.placements: 未找到拖拽项 ${placement.itemKey}`)
        }
        if (!targetKeys.has(placement.targetKey)) {
          issues.push(`answerRule.placements: 未找到目标 ${placement.targetKey}`)
        }
      }
    }
  }

  if (parsed.questionType === 'reading' && !parsed.subQuestionIds?.length) {
    issues.push('reading: 必须提供 subQuestionIds')
  }

  return { valid: issues.length === 0, issues }
}
