import type { LearningAgentSnapshot, QuestionGenerationRequest } from '@/types/learning-agent'
import { parseArithmetic } from './deterministicAnswerValidator'

export interface MathQuestionConstraints {
  minNumber: number
  maxNumber: number
  allowedOperations: Array<'+' | '-'>
  requireCarrying?: boolean
  requireBorrowing?: boolean
  minLargestOperand?: number
  maxLargestOperand?: number
}
/** Scope is determined by the existing request and trusted curriculum, never by the LLM. */
export function realMathConstraints(
  request: QuestionGenerationRequest,
  snapshot: LearningAgentSnapshot,
): MathQuestionConstraints {
  const targets = snapshot.curriculum.knowledgePoints.filter((k) =>
    request.targetKnowledgePoints.includes(k.id),
  )
  const templates = snapshot.templates.filter((t) => request.constraints.templateIds.includes(t.id))
  const borrowingScope =
    targets.some((k) => /退位|借位/.test(k.name)) &&
    templates.some((t) => t.templateType === 'subtraction_range' && t.config.maxMinuend >= 10)
  const carryingScope = targets.some((k) => /进位/.test(k.name))
  return {
    minNumber: 0,
    maxNumber: 100,
    allowedOperations: ['+', '-'],
    requireBorrowing: borrowingScope,
    requireCarrying: carryingScope,
    ...request.constraints.math,
  }
}
export function mathConstraintChecks(text: string, constraints: MathQuestionConstraints) {
  const c = parseArithmetic(text)
  const values = c ? [c.left, c.right, c.result] : []
  return [
    {
      code: 'DIFFICULTY_OPERAND_FLOOR',
      pass:
        constraints.minLargestOperand === undefined ||
        (!!c && Math.max(c.left, c.right) >= constraints.minLargestOperand),
    },
    {
      code: 'DIFFICULTY_OPERAND_CEILING',
      pass:
        constraints.maxLargestOperand === undefined ||
        (!!c && Math.max(c.left, c.right) <= constraints.maxLargestOperand),
    },
    { code: 'INTEGER_ARITHMETIC', pass: !!c && values.every(Number.isSafeInteger) },
    { code: 'MIN_NUMBER', pass: !!c && values.every((n) => n >= constraints.minNumber) },
    { code: 'MAX_NUMBER', pass: !!c && values.every((n) => n <= constraints.maxNumber) },
    {
      code: 'ALLOWED_OPERATIONS',
      pass: !!c && constraints.allowedOperations.some((op) => op === c.operator),
    },
    {
      code: 'REQUIRE_CARRYING',
      pass:
        !constraints.requireCarrying ||
        (!!c && c.operator === '+' && (c.left % 10) + (c.right % 10) >= 10),
    },
    {
      code: 'REQUIRE_BORROWING',
      pass:
        !constraints.requireBorrowing || (!!c && c.operator === '-' && c.left % 10 < c.right % 10),
    },
  ]
}
