import type { Question, QuestionAnswerDraft } from '@/types'
import type { AnswerAnalysisRequest, LearningErrorPattern } from '@/types/learning-agent'
import { parseArithmetic, questionText } from './deterministicAnswerValidator'
import { normalizeCalculationInput } from '@/services/question-engine/answerValidator'

type Working = AnswerAnalysisRequest['attemptContext']['working']
type Calculation = NonNullable<ReturnType<typeof parseArithmetic>>
export class CarryingErrorDetector {
  detect(c: Calculation, answer: number, working?: Working): boolean {
    return (
      c.operator === '+' &&
      (c.left % 10) + (c.right % 10) >= 10 &&
      answer === c.result - 10 &&
      working?.tensResult === Math.floor(c.left / 10) + Math.floor(c.right / 10) &&
      working.onesResult === (c.left + c.right) % 10
    )
  }
}
export class BorrowingErrorDetector {
  detect(c: Calculation, answer: number, working?: Working): boolean {
    return (
      c.operator === '-' &&
      c.left % 10 < c.right % 10 &&
      answer === c.result + 10 &&
      working?.tensResult === Math.floor(c.left / 10) - Math.floor(c.right / 10) &&
      working.onesResult === (c.left % 10) + 10 - (c.right % 10)
    )
  }
}
export class PlaceValueErrorDetector {
  detect(c: Calculation, answer: number, working?: Working): boolean {
    return Boolean(
      working &&
      working.tensResult === Math.floor(c.result / 10) &&
      working.onesResult === c.result % 10 &&
      answer === working.tensResult + working.onesResult &&
      answer !== c.result,
    )
  }
}
export class CalculationErrorDetector {
  detect(c: Calculation, answer: number, working?: Working): boolean {
    if (!working || answer !== working.tensResult * 10 + working.onesResult) return false
    // Only a plainly wrong single-digit operation supports this classification.
    return c.left < 10 && c.right < 10 && c.result < 10 && answer !== c.result
  }
}
export function detectLearningErrors(
  question: Question,
  answer: QuestionAnswerDraft,
  subject: string,
  working?: Working,
): LearningErrorPattern[] {
  const unknown: LearningErrorPattern = {
    domain: 'GENERAL',
    category: 'UNCLASSIFIED',
    code: 'UNKNOWN',
    confidence: 0,
  }
  if (subject !== 'MATH' || answer.type !== 'calculation') return [unknown]
  const c = parseArithmetic(questionText(question)),
    actual = Number(normalizeCalculationInput(answer.value))
  if (
    !c ||
    !Number.isFinite(actual) ||
    !Number.isFinite(c.result) ||
    c.left < 0 ||
    c.right < 0 ||
    c.left > 99 ||
    c.right > 99 ||
    !Number.isInteger(c.left) ||
    !Number.isInteger(c.right)
  )
    return [unknown]
  if (actual === c.result) return []
  const detectors = [
    ['CARRYING_ERROR', new CarryingErrorDetector()],
    ['BORROWING_ERROR', new BorrowingErrorDetector()],
    ['PLACE_VALUE_ERROR', new PlaceValueErrorDetector()],
    ['CALCULATION_ERROR', new CalculationErrorDetector()],
  ] as const
  const matched = detectors.filter(([, detector]) => detector.detect(c, actual, working))
  return matched.length === 1
    ? [{ domain: subject, category: 'ARITHMETIC', code: matched[0][0], confidence: 0.8 }]
    : [unknown]
}
