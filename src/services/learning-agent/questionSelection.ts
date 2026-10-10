import type { Question } from '@/types'
import type { LearningDecision, LearningAgentSnapshot } from '@/types/learning-agent'
import { validateQuestion } from '@/services/validation/questionValidation'
import { isScorableQuestionType } from '@/services/question-engine/answerValidator'

export const questionDifficulty = (value: Question['difficulty']) =>
  ({ FOUNDATION: 1, STANDARD: 3, ADVANCED: 5 })[value]
export const difficultyLevel = (value: number) => Math.max(1, Math.min(5, 1 + value * 4))

/** The selected IDs are frozen into the launch, so resuming never silently changes its questions. */
export function selectAgentQuestions(snapshot: LearningAgentSnapshot, decision: LearningDecision) {
  const target = difficultyLevel(decision.difficulty)
  const wanted = decision.recommendedActivity.estimatedQuestionCount
  const ids = new Set(
    snapshot.mappings
      .filter(
        (m) =>
          m.knowledgePointId === decision.targetKnowledgePointId &&
          !m.needsVerification &&
          !m.isSample &&
          m.verificationStatus === 'REVIEWED',
      )
      .map((m) => m.questionId),
  )
  const recent = new Set(
    snapshot.sessions.flatMap((s) =>
      s.attempts.filter((a) => a.submitted).map((a) => a.questionId),
    ),
  )
  const questions = snapshot.questions
    .filter(
      (q) =>
        ids.has(q.id) &&
        q.textbookVersionId === decision.textbookId &&
        !q.isSample &&
        !q.needsVerification &&
        q.verificationStatus === 'REVIEWED' &&
        q.status === 'PUBLISHED' &&
        !q.tags.includes('unit-sync-only') &&
        !q.tags.includes('comprehensive-only') &&
        isScorableQuestionType(q.questionType) &&
        validateQuestion(q).valid,
    )
    .sort(
      (a, b) =>
        Math.abs(questionDifficulty(a.difficulty) - target) -
          Math.abs(questionDifficulty(b.difficulty) - target) ||
        Number(recent.has(a.id)) - Number(recent.has(b.id)) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, Math.min(wanted, 50))
  return {
    selectedQuestionIds: questions.map((q) => q.id),
    estimatedQuestionCount: questions.length,
    actualDifficulty: questions.length
      ? questions.reduce((n, q) => n + questionDifficulty(q.difficulty), 0) / questions.length
      : target,
    selectionNote:
      questions.length < wanted
        ? `当前可用题库有 ${questions.length} 道合适的题，本次按实际题量安排。`
        : questions.every((q) => questionDifficulty(q.difficulty) !== target)
          ? '已选择题库中最接近目标难度的题目。'
          : '',
  }
}
