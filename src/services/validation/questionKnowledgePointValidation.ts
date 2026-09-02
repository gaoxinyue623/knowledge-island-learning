import type { QuestionKnowledgePoint } from '@/types'

export interface QuestionKnowledgePointValidationResult {
  valid: boolean
  issues: string[]
}

/**
 * QuestionKnowledgePoint weights are normalized contributions, not arbitrary
 * percentages. Keeping this check separate makes ingestion and extraction
 * share the same contract.
 */
export function validateQuestionKnowledgePointWeights(
  mappings: readonly QuestionKnowledgePoint[],
): QuestionKnowledgePointValidationResult {
  const issues: string[] = []
  const totals = new Map<string, number>()
  const pairs = new Set<string>()

  for (const mapping of mappings) {
    if (!Number.isFinite(mapping.weight) || mapping.weight <= 0 || mapping.weight > 1) {
      issues.push(`${mapping.id}: weight 必须满足 0 < weight <= 1`)
    }
    const pair = `${mapping.questionId}::${mapping.knowledgePointId}`
    if (pairs.has(pair)) issues.push(`${mapping.id}: 题目与知识点关系不能重复`)
    pairs.add(pair)
    totals.set(mapping.questionId, (totals.get(mapping.questionId) ?? 0) + mapping.weight)
  }

  for (const [questionId, total] of totals) {
    if (Math.abs(total - 1) > 0.001) {
      issues.push(`${questionId}: 同题关系 weight 总和必须约等于 1`)
    }
  }
  return { valid: issues.length === 0, issues }
}
