import type { Id, QuestionType } from '@/types'

import { questionSchema } from './schemas'

export interface QuestionValidationReferences {
  knowledgePointIds?: ReadonlySet<Id>
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

  if (references.knowledgePointIds && !references.knowledgePointIds.has(parsed.knowledgePointId)) {
    issues.push(`knowledgePointId: 未找到 ${parsed.knowledgePointId}`)
  }
  if (references.sourceIds && !references.sourceIds.has(parsed.sourceId)) {
    issues.push(`sourceId: 未找到 ${parsed.sourceId}`)
  }

  const mediaIds = [
    ...parsed.media.map((media) => media.mediaAssetId),
    ...(parsed.options ?? []).flatMap((option) =>
      (option.media ?? []).map((media) => media.mediaAssetId),
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

  if (parsed.questionType === 'singleChoice') {
    const optionKeys = new Set((parsed.options ?? []).map((option) => option.optionKey))
    if (
      parsed.answerRule.ruleType === 'SINGLE_OPTION' &&
      !optionKeys.has(parsed.answerRule.correctOptionKey)
    ) {
      issues.push('answerRule.correctOptionKey: 必须引用已有选项')
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
