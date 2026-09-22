import type { Question } from '@/types'

export function questionText(q: Question): string {
  return q.stem.map((b) => b.text ?? '').join(' ')
}
export function parseArithmetic(
  text: string,
): { left: number; right: number; operator: string; result: number } | null {
  const normalized = text
    .normalize('NFKC')
    .replace(/[−－]/g, '-')
    .replace(/[×x]/g, '*')
    .replace(/÷/g, '/')
  const match = normalized.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*([+*/-])\s*(-?\d+(?:\.\d+)?)\s*=\s*[?？]\s*$/,
  )
  if (!match) return null
  const left = Number(match[1]),
    right = Number(match[3]),
    operator = match[2]
  const result =
    operator === '+'
      ? left + right
      : operator === '-'
        ? left - right
        : operator === '*'
          ? left * right
          : right === 0
            ? NaN
            : left / right
  return { left, right, operator, result }
}
/** Independently evaluates the visible prompt; never trusts generator derivations. No eval. */
export class DeterministicAnswerValidator {
  validate(question: Question): 'VALID' | 'INVALID' | 'REQUIRES_REVIEW' {
    const arithmetic = parseArithmetic(questionText(question))
    if (
      arithmetic &&
      question.questionType === 'calculation' &&
      question.answerRule.ruleType === 'NUMERIC'
    ) {
      const expected = Number(question.answerRule.value)
      return Number.isFinite(arithmetic.result) &&
        Math.abs(expected - arithmetic.result) <= 1e-9 &&
        !question.answerRule.tolerance &&
        !question.answerRule.unit
        ? 'VALID'
        : 'INVALID'
    }
    const comparison = questionText(question).match(/^比较 (\d+) 和 (\d+)，选一选。$/)
    if (
      comparison &&
      question.questionType === 'singleChoice' &&
      question.answerRule.ruleType === 'SINGLE_OPTION'
    ) {
      const left = Number(comparison[1]),
        right = Number(comparison[2])
      const symbol = left < right ? '<' : left > right ? '>' : '='
      const key = question.answerRule.correctOptionKey
      const option = question.options?.find((o) => o.optionKey === key)
      return option?.content.map((b) => b.text ?? '').join('') === symbol ? 'VALID' : 'INVALID'
    }
    return 'REQUIRES_REVIEW'
  }
}
