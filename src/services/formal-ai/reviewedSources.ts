import type { Question } from '@/types'
import { productionCurriculumIndex as catalog } from '@/data/curriculum/production'
import { validateQuestion } from '@/services/validation/questionValidation'
import {
  correctAnswerDraft,
  isScorableQuestionType,
} from '@/services/question-engine/answerValidator'
import { arithmeticScope } from './contract'
export const plainText = (blocks: Question['stem']) =>
  blocks
    .map((b) => b.text ?? '')
    .filter(Boolean)
    .join('\n')
export function reviewedAiSources(textbookId: string, knowledgePointId: string) {
  const ids = new Set(
    catalog.questionKnowledgePoints
      .filter(
        (m) =>
          m.knowledgePointId === knowledgePointId &&
          m.verificationStatus === 'REVIEWED' &&
          !m.needsVerification &&
          !m.isSample,
      )
      .map((m) => m.questionId),
  )
  return catalog.questions.filter(
    (q) =>
      q.textbookVersionId === textbookId &&
      ids.has(q.id) &&
      q.status === 'PUBLISHED' &&
      !q.tags.includes('unit-sync-only') &&
      !q.tags.includes('comprehensive-only') &&
      q.verificationStatus === 'REVIEWED' &&
      !q.needsVerification &&
      !q.isSample &&
      isScorableQuestionType(q.questionType) &&
      validateQuestion(q).valid &&
      plainText(q.stem) &&
      correctAnswerDraft(q),
  )
}
export function supportsAiPractice(textbookId: string, knowledgePointId: string) {
  return (
    Boolean(arithmeticScope(knowledgePointId)) ||
    reviewedAiSources(textbookId, knowledgePointId).length > 0
  )
}
