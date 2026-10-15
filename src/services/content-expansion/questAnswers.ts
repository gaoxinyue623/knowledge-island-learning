import {
  isQuestionAnswerComplete,
  validateQuestionAnswer,
} from '@/services/question-engine/answerValidator'
import type { Question, QuestionAnswerDraft } from '@/types'

export function emptyQuestDraft(question: Question): QuestionAnswerDraft {
  if (question.questionType === 'calculation') return { type: 'calculation', value: '' }
  if (question.questionType === 'multipleChoice') return { type: 'multipleChoice', optionIds: [] }
  if (question.questionType === 'trueFalse') return { type: 'trueFalse' }
  if (question.questionType === 'fillBlank') return { type: 'fillBlank', values: [''] }
  return { type: 'singleChoice' }
}

export function checkQuestAnswer(
  question: Question,
  draft: QuestionAnswerDraft,
): 'incomplete' | 'correct' | 'incorrect' | 'manual_review_required' {
  if (!isQuestionAnswerComplete(question, draft)) return 'incomplete'
  const ids =
    draft.type === 'multipleChoice'
      ? draft.optionIds
      : draft.type === 'singleChoice'
        ? [draft.optionId]
        : []
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !question.options?.some((option) => option.id === id))
  )
    return 'incorrect'
  return validateQuestionAnswer(question, draft).status
}
