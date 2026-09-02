import type {
  Id,
  LearningEvidence,
  LearningEvidenceExtractionInput,
  LearningEvidenceExtractionResult,
  MasteryPolicy,
  Question,
  QuestionKnowledgePoint,
  QuestionAttempt,
  QuestionDifficultyRank,
} from '@/types'

import {
  getRecordVerificationStatus,
  isQuestionRecordReadable,
  type CurriculumAccessPolicy,
} from '@/services/curriculum'
import { QUESTION_DIFFICULTY_RANK } from '@/types'

function questionDifficultyRank(question: Question): QuestionDifficultyRank {
  return QUESTION_DIFFICULTY_RANK[question.difficulty]
}

function sourceVerificationStatus(
  question: Question,
  mapping: QuestionKnowledgePoint,
): NonNullable<LearningEvidence['metadata']>['sourceVerificationStatus'] {
  const statuses = [
    getRecordVerificationStatus(question),
    getRecordVerificationStatus(mapping),
  ].filter((status): status is NonNullable<ReturnType<typeof getRecordVerificationStatus>> =>
    Boolean(status),
  )
  const precedence = ['SAMPLE', 'UNVERIFIED', 'REJECTED', 'VERIFIED', 'REVIEWED'] as const
  return precedence.find((status) => statuses.includes(status))
}

function evidenceId(studentProfileId: Id, sessionId: Id, questionId: Id, knowledgePointId: Id): Id {
  return `learning-evidence:${studentProfileId}:${sessionId}:${questionId}:${knowledgePointId}`
}

function attemptId(sessionId: Id, questionId: Id): Id {
  return `question-attempt:${sessionId}:${questionId}`
}

function mappingIsReadable(
  mapping: QuestionKnowledgePoint,
  question: Question,
  accessPolicy: CurriculumAccessPolicy,
): boolean {
  return (
    isQuestionRecordReadable(question, accessPolicy) &&
    isQuestionRecordReadable(mapping, accessPolicy)
  )
}

export interface ExtractLearningEvidenceOptions {
  accessPolicy?: CurriculumAccessPolicy
  difficultyWeights?: Readonly<Record<number, number>>
}

export function extractLearningEvidenceFromAttempt(
  input: {
    studentProfileId: Id
    session: LearningEvidenceExtractionInput['session']
    attempt: QuestionAttempt
    question: Question | undefined
    mappings: readonly QuestionKnowledgePoint[]
    policy: MasteryPolicy
  },
  options: ExtractLearningEvidenceOptions = {},
): LearningEvidenceExtractionResult {
  const diagnostics: string[] = []
  const accessPolicy = options.accessPolicy
  if (!input.attempt.submitted) {
    diagnostics.push(`MASTERY_ATTEMPT_NOT_SUBMITTED: ${input.attempt.questionId}`)
    return { evidence: [], diagnostics }
  }
  if (!input.attempt.result) {
    diagnostics.push(`MASTERY_ATTEMPT_RESULT_MISSING: ${input.attempt.questionId}`)
    return { evidence: [], diagnostics }
  }
  if (input.attempt.result.status === 'manual_review_required') {
    diagnostics.push(`MASTERY_MANUAL_REVIEW_IGNORED: ${input.attempt.questionId}`)
    return { evidence: [], diagnostics }
  }
  if (input.attempt.result.status !== 'correct' && input.attempt.result.status !== 'incorrect') {
    diagnostics.push(`MASTERY_ATTEMPT_STATUS_INVALID: ${input.attempt.questionId}`)
    return { evidence: [], diagnostics }
  }
  if (!input.question) {
    diagnostics.push(`MASTERY_QUESTION_ORPHAN: ${input.attempt.questionId}`)
    return { evidence: [], diagnostics }
  }
  if (!input.mappings.length) {
    diagnostics.push(`MASTERY_MAPPING_MISSING: ${input.attempt.questionId}`)
    return { evidence: [], diagnostics }
  }

  const questionDifficulty = questionDifficultyRank(input.question)
  const difficultyWeight =
    options.difficultyWeights?.[questionDifficulty] ??
    input.policy.difficultyWeights[questionDifficulty]
  if (!Number.isFinite(difficultyWeight) || difficultyWeight <= 0) {
    diagnostics.push(`MASTERY_DIFFICULTY_WEIGHT_INVALID: ${input.question.id}`)
    return { evidence: [], diagnostics }
  }

  const evidence: LearningEvidence[] = []
  for (const mapping of input.mappings) {
    if (!Number.isFinite(mapping.weight) || mapping.weight <= 0 || mapping.weight > 1) {
      diagnostics.push(`MASTERY_KNOWLEDGE_WEIGHT_INVALID: ${mapping.id}`)
      continue
    }
    if (accessPolicy && !mappingIsReadable(mapping, input.question, accessPolicy)) {
      diagnostics.push(`MASTERY_SOURCE_NOT_ALLOWED: ${input.question.id}:${mapping.id}`)
      continue
    }
    const verificationStatus = sourceVerificationStatus(input.question, mapping)
    const sampleDerived =
      input.question.isSample || mapping.isSample || verificationStatus === 'SAMPLE'
    const nextEvidence: LearningEvidence = {
      id: evidenceId(
        input.studentProfileId,
        input.session.id,
        input.question.id,
        mapping.knowledgePointId,
      ),
      type: 'question_attempt',
      studentProfileId: input.studentProfileId,
      knowledgePointId: mapping.knowledgePointId,
      source: {
        questionId: input.question.id,
        questionAttemptId: attemptId(input.session.id, input.question.id),
        assessmentId: input.session.assessmentId,
        questionSessionId: input.session.id,
      },
      outcome: input.attempt.result.status,
      questionDifficulty,
      knowledgeWeight: mapping.weight,
      evidenceWeight: mapping.weight * difficultyWeight,
      occurredAt:
        input.attempt.submittedAt ?? input.session.updatedAt ?? '1970-01-01T00:00:00.000Z',
      metadata: {
        ...(verificationStatus ? { sourceVerificationStatus: verificationStatus } : {}),
        ...(sampleDerived ? { isSample: true } : {}),
        ...(input.attempt.questionVersion !== undefined
          ? { questionVersion: input.attempt.questionVersion }
          : {}),
      },
    }
    evidence.push(nextEvidence)
  }
  if (!evidence.length && !diagnostics.length) {
    diagnostics.push(`MASTERY_EVIDENCE_NOT_CREATED: ${input.attempt.questionId}`)
  }
  return { evidence, diagnostics }
}

export function extractLearningEvidenceFromQuestionSession(
  input: LearningEvidenceExtractionInput,
  options: ExtractLearningEvidenceOptions = {},
): LearningEvidenceExtractionResult {
  if (input.session.status !== 'completed') {
    return {
      evidence: [],
      diagnostics: [`MASTERY_SESSION_NOT_COMPLETED: ${input.session.id}`],
    }
  }
  const questionsById = new Map(input.questions.map((question) => [question.id, question]))
  const mappingsByQuestionId = new Map<string, QuestionKnowledgePoint[]>()
  for (const mapping of input.mappings) {
    const current = mappingsByQuestionId.get(mapping.questionId) ?? []
    current.push(mapping)
    mappingsByQuestionId.set(mapping.questionId, current)
  }
  const evidence: LearningEvidence[] = []
  const diagnostics: string[] = []
  const attempts = input.attempts.length ? input.attempts : input.session.attempts
  const sessionQuestionIds = new Set(input.session.questionIds)
  const attemptedQuestionIds = new Set<string>()
  for (const attempt of attempts) {
    if (!sessionQuestionIds.has(attempt.questionId)) {
      diagnostics.push(`MASTERY_ATTEMPT_ORPHAN: ${attempt.questionId}`)
      continue
    }
    if (attemptedQuestionIds.has(attempt.questionId)) {
      diagnostics.push(`MASTERY_ATTEMPT_DUPLICATE: ${attempt.questionId}`)
    }
    attemptedQuestionIds.add(attempt.questionId)
    const extracted = extractLearningEvidenceFromAttempt(
      {
        studentProfileId: input.studentProfileId,
        session: input.session,
        attempt,
        question: questionsById.get(attempt.questionId),
        mappings: mappingsByQuestionId.get(attempt.questionId) ?? [],
        policy: input.policy,
      },
      options,
    )
    evidence.push(...extracted.evidence)
    diagnostics.push(...extracted.diagnostics)
  }
  for (const questionId of input.session.questionIds) {
    if (!attemptedQuestionIds.has(questionId)) {
      diagnostics.push(`MASTERY_ATTEMPT_MISSING: ${questionId}`)
    }
  }
  const uniqueEvidence = new Map(evidence.map((item) => [item.id, item]))
  return { evidence: [...uniqueEvidence.values()], diagnostics }
}

export { attemptId, evidenceId, questionDifficultyRank }
