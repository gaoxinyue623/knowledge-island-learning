import type { Question, QuestionAnswerDraft, QuestionAttemptResult, QuestionType } from '@/types'

const SCORABLE_TYPES = new Set<QuestionType>([
  'singleChoice',
  'multipleChoice',
  'trueFalse',
  'fillBlank',
  'calculation',
])

function result(
  status: QuestionAttemptResult['status'],
  score: number,
  maxScore: number,
): QuestionAttemptResult {
  return {
    status,
    score,
    maxScore,
    feedback:
      status === 'correct'
        ? '回答正确'
        : status === 'incorrect'
          ? '再看看解析'
          : '此题当前不支持自动评分',
  }
}

function optionKeyForId(question: Question, optionId: string | undefined): string | undefined {
  return question.options?.find((option) => option.id === optionId)?.optionKey
}

function optionKeysForIds(question: Question, optionIds: readonly string[]): string[] {
  return optionIds
    .map((optionId) => optionKeyForId(question, optionId))
    .filter((optionKey): optionKey is string => Boolean(optionKey))
}

function normalizeText(
  value: string,
  policy: 'NONE' | 'TRIM' | 'CASE_INSENSITIVE' | 'SIMPLIFIED_CHINESE' = 'TRIM',
): string {
  if (policy === 'NONE') return value
  const trimmed = value.trim()
  return policy === 'CASE_INSENSITIVE' ? trimmed.toLocaleLowerCase() : trimmed
}

export function normalizeCalculationInput(value: string): string {
  return value
    .trim()
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, '.')
    .replace(/[－﹣−]/g, '-')
}

function textFromBlocks(blocks: Question['stem']): string {
  return blocks
    .map((block) => block.text?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
}

function optionText(option: NonNullable<Question['options']>[number]): string {
  return textFromBlocks(option.content) || option.optionKey
}

export function isScorableQuestionType(questionType: QuestionType): boolean {
  return SCORABLE_TYPES.has(questionType)
}

export function isQuestionAnswerComplete(question: Question, draft: QuestionAnswerDraft): boolean {
  if (draft.type !== question.questionType) return false
  switch (draft.type) {
    case 'singleChoice':
      return Boolean(draft.optionId)
    case 'multipleChoice':
      return draft.optionIds.length > 0
    case 'trueFalse':
      return draft.value !== undefined
    case 'fillBlank':
      return (
        question.answerRule.ruleType === 'TEXT_BLANKS' &&
        draft.values.length === question.answerRule.blanks.length &&
        draft.values.every((value) => value.trim().length > 0)
      )
    case 'calculation':
      return draft.value.trim().length > 0
    case 'shortAnswer':
      return draft.value.trim().length > 0
  }
}

export function correctAnswerDraft(question: Question): QuestionAnswerDraft {
  switch (question.questionType) {
    case 'singleChoice': {
      const correctKey =
        question.answerRule.ruleType === 'SINGLE_OPTION'
          ? question.answerRule.correctOptionKey
          : undefined
      const option = correctKey
        ? question.options?.find((candidate) => candidate.optionKey === correctKey)
        : undefined
      return { type: 'singleChoice', ...(option ? { optionId: option.id } : {}) }
    }
    case 'multipleChoice': {
      const correctKeys =
        question.answerRule.ruleType === 'MULTIPLE_OPTIONS'
          ? question.answerRule.correctOptionKeys
          : []
      const optionIds = (question.options ?? [])
        .filter((option) => correctKeys.includes(option.optionKey))
        .map((option) => option.id)
      return { type: 'multipleChoice', optionIds }
    }
    case 'trueFalse':
      return {
        type: 'trueFalse',
        ...(question.answerRule.ruleType === 'BOOLEAN'
          ? { value: question.answerRule.correctValue }
          : {}),
      }
    case 'fillBlank':
      return {
        type: 'fillBlank',
        values:
          question.answerRule.ruleType === 'TEXT_BLANKS'
            ? question.answerRule.blanks.map((blank) => blank.acceptedAnswers[0] ?? '')
            : [],
      }
    case 'calculation':
      return {
        type: 'calculation',
        value: question.answerRule.ruleType === 'NUMERIC' ? String(question.answerRule.value) : '',
      }
    case 'shortAnswer':
      return { type: 'shortAnswer', value: '我会重新计算并检查结果。' }
    default:
      return { type: 'shortAnswer', value: '' }
  }
}

export function validateQuestionAnswer(
  question: Question,
  draft: QuestionAnswerDraft,
): QuestionAttemptResult {
  if (draft.type !== question.questionType) return result('incorrect', 0, 1)

  switch (draft.type) {
    case 'singleChoice': {
      if (question.answerRule.ruleType !== 'SINGLE_OPTION') return result('incorrect', 0, 1)
      const selectedKey = optionKeyForId(question, draft.optionId)
      return selectedKey === question.answerRule.correctOptionKey
        ? result('correct', 1, 1)
        : result('incorrect', 0, 1)
    }
    case 'multipleChoice': {
      if (question.answerRule.ruleType !== 'MULTIPLE_OPTIONS') return result('incorrect', 0, 1)
      const selected = new Set(optionKeysForIds(question, draft.optionIds))
      const expected = new Set(question.answerRule.correctOptionKeys)
      const exact =
        selected.size === expected.size && [...selected].every((key) => expected.has(key))
      return exact ? result('correct', 1, 1) : result('incorrect', 0, 1)
    }
    case 'trueFalse': {
      if (question.answerRule.ruleType !== 'BOOLEAN') return result('incorrect', 0, 1)
      return draft.value === question.answerRule.correctValue
        ? result('correct', 1, 1)
        : result('incorrect', 0, 1)
    }
    case 'fillBlank': {
      if (question.answerRule.ruleType !== 'TEXT_BLANKS') return result('incorrect', 0, 1)
      const correct =
        draft.values.length === question.answerRule.blanks.length &&
        question.answerRule.blanks.every((blank, index) => {
          const answer = draft.values[index]
          if (answer === undefined) return false
          const policy = blank.normalization ?? 'TRIM'
          const normalized = normalizeText(answer, policy)
          return blank.acceptedAnswers.some(
            (acceptedAnswer) => normalizeText(acceptedAnswer, policy) === normalized,
          )
        })
      return correct ? result('correct', 1, 1) : result('incorrect', 0, 1)
    }
    case 'calculation': {
      if (question.answerRule.ruleType !== 'NUMERIC') return result('incorrect', 0, 1)
      const actualText = normalizeCalculationInput(draft.value)
      const expectedText = normalizeCalculationInput(String(question.answerRule.value))
      const actual = Number(actualText)
      const expected = Number(expectedText)
      const numericMatch = Number.isFinite(actual) && Number.isFinite(expected)
      const correct = numericMatch
        ? question.answerRule.tolerance !== undefined
          ? Math.abs(actual - expected) <= question.answerRule.tolerance
          : actual === expected
        : actualText === expectedText
      return correct ? result('correct', 1, 1) : result('incorrect', 0, 1)
    }
    case 'shortAnswer':
      return result('manual_review_required', 0, 0)
  }
}

export function correctAnswerText(question: Question): string | undefined {
  switch (question.questionType) {
    case 'singleChoice': {
      if (question.answerRule.ruleType !== 'SINGLE_OPTION') return undefined
      const correctKey = question.answerRule.correctOptionKey
      const option = question.options?.find((candidate) => candidate.optionKey === correctKey)
      return option ? `${option.optionKey}：${optionText(option)}` : correctKey
    }
    case 'multipleChoice': {
      if (question.answerRule.ruleType !== 'MULTIPLE_OPTIONS') return undefined
      return question.answerRule.correctOptionKeys
        .map((key) => {
          const option = question.options?.find((candidate) => candidate.optionKey === key)
          return option ? `${option.optionKey}：${optionText(option)}` : key
        })
        .join('；')
    }
    case 'trueFalse':
      return question.answerRule.ruleType === 'BOOLEAN'
        ? question.answerRule.correctValue
          ? '正确'
          : '错误'
        : undefined
    case 'fillBlank':
      return question.answerRule.ruleType === 'TEXT_BLANKS'
        ? question.answerRule.blanks.map((blank) => blank.acceptedAnswers[0] ?? '').join('；')
        : undefined
    case 'calculation':
      return question.answerRule.ruleType === 'NUMERIC'
        ? String(question.answerRule.value)
        : undefined
    case 'shortAnswer':
      return '提交后由人工判断'
    default:
      return undefined
  }
}
