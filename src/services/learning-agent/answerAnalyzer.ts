import type {
  AnswerAnalysisRequest,
  AnswerAnalysisResult,
  AnswerAnalyzerProvider,
} from '@/types/learning-agent'
import {
  validateQuestionAnswer,
  isQuestionAnswerComplete,
} from '@/services/question-engine/answerValidator'
import { extractLearningEvidenceFromQuestionSession } from '@/services/mastery/evidenceExtractor'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery/masteryPolicy'
import { validateQuestion } from '@/services/validation/questionValidation'
import { detectLearningErrors } from './errorDetectors'
import { productionConfig } from '@/config/production'
import { DeterministicAnswerValidator } from './deterministicAnswerValidator'

export class AnswerAnalyzer implements AnswerAnalyzerProvider {
  async analyze(request: AnswerAnalysisRequest): Promise<AnswerAnalysisResult> {
    const { question, studentAnswer, attemptContext: ctx } = request
    const manual = (explanation: string): AnswerAnalysisResult => ({
      correct: null,
      score: null,
      status: 'manual_review_required',
      errorPatterns: [],
      affectedKnowledgePoints: [],
      confidence: 0,
      explanation,
      evidence: [],
    })
    if (
      !validateQuestion(question).valid ||
      (ctx.dataset === 'demo' && !productionConfig.devRoutes) ||
      !ctx.session.id.startsWith(`question-session:${ctx.profileId}:`) ||
      (question.textbookVersionId !== undefined &&
        question.textbookVersionId !== ctx.session.textbookId) ||
      new Set(request.knowledgePoints.map((m) => m.knowledgePointId)).size !==
        request.knowledgePoints.length ||
      JSON.stringify(question.answerRule) !== JSON.stringify(request.expectedAnswer) ||
      !isQuestionAnswerComplete(question, studentAnswer) ||
      !ctx.session.questionIds.includes(question.id) ||
      !request.knowledgePoints.length ||
      request.knowledgePoints.some(
        (m) => m.questionId !== question.id || !Number.isFinite(m.weight) || m.weight <= 0,
      ) ||
      Math.abs(request.knowledgePoints.reduce((n, m) => n + m.weight, 0) - 1) > 1e-8
    )
      return manual('题目、作答或知识点关系无效，未生成证据。')
    if (
      ctx.subject === 'MATH' &&
      new DeterministicAnswerValidator().validate(question) === 'INVALID'
    )
      return manual('题目答案与确定性计算不一致。')
    if (
      question.status === 'AI_GENERATED' &&
      new DeterministicAnswerValidator().validate(question) !== 'VALID'
    )
      return manual('生成题目的答案无法独立验证，需要审核。')
    const result = validateQuestionAnswer(question, studentAnswer)
    if (result.status === 'manual_review_required') return manual('开放题需要人工或后续审核流程。')
    const stored = ctx.session.attempts.find((a) => a.questionId === question.id)
    // Only a committed, completed session can yield evidence. Recompute this attempt's result.
    const attempt = {
      questionId: question.id,
      answer: studentAnswer,
      submitted: true,
      result,
      submittedAt: stored?.submittedAt,
      questionVersion: question.questionVersion,
    }
    const committed =
      ctx.session.questionIds.every((id) =>
        ctx.session.attempts.some((a) => a.questionId === id && a.submitted),
      ) &&
      stored?.submitted &&
      stored.submittedAt &&
      JSON.stringify(stored.answer) === JSON.stringify(studentAnswer)
    const extraction = committed
      ? extractLearningEvidenceFromQuestionSession(
          {
            studentProfileId: ctx.profileId,
            session: ctx.session,
            attempts: [attempt],
            questions: [question],
            mappings: request.knowledgePoints,
            policy: DEFAULT_MASTERY_POLICY,
          },
          {
            accessPolicy: {
              allowSampleCurriculum: ctx.dataset === 'demo',
              allowUnreviewedCurriculum: ctx.dataset === 'demo',
              allowSampleQuestions: ctx.dataset === 'demo',
              allowUnreviewedQuestions: ctx.dataset === 'demo',
            },
          },
        )
      : { evidence: [] }
    return {
      correct: result.status === 'correct',
      score: result.score,
      status: result.status,
      errorPatterns:
        result.status === 'incorrect'
          ? detectLearningErrors(question, studentAnswer, ctx.subject, ctx.working)
          : [],
      affectedKnowledgePoints: request.knowledgePoints.map((m) => m.knowledgePointId),
      confidence: 1,
      explanation:
        result.status === 'correct'
          ? '作答与确定性答案一致。'
          : '作答与确定性答案不一致；错误原因只在有中间步骤支持时分类。',
      evidence: extraction.evidence,
    }
  }
}
