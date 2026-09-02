import { afterEach, describe, expect, it } from 'vitest'

import {
  demoAssessmentContext,
  demoAssessmentDefinition,
  demoQuestions,
  demoQuestionKnowledgePoints,
} from '@/data/question-engine'
import { curriculumService } from '@/services/runtime'
import {
  buildMasteryRecord,
  calculateMastery,
  extractLearningEvidenceFromAttempt,
  extractLearningEvidenceFromQuestionSession,
  MasteryProcessingService,
  QUESTION_DIFFICULTY_RANK,
  rebuildMasteryFromEvidence,
  resolveKnowledgeLearningState,
} from '@/services/mastery'
import { createMasteryRepository } from '@/services/mastery/masteryRepository'
import {
  createMasteryStorage,
  learningEvidenceStoragePayloadSchema,
} from '@/services/mastery/masteryStorage'
import { validateQuestionKnowledgePointWeights } from '@/services/validation'
import {
  correctAnswerDraft,
  createQuestionSession,
  MockQuestionRepository,
  validateQuestionAnswer,
} from '@/services/question-engine'
import type {
  LearningEvidence,
  MasteryPolicy,
  QuestionAttempt,
  QuestionKnowledgePoint,
} from '@/types'
import { QUESTION_DIFFICULTY_RANK } from '@/types'

function createMemoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

const policy: MasteryPolicy = {
  weakThreshold: 40,
  masteredThreshold: 80,
  minimumEvidenceForMastery: 3,
  minimumConfidenceForMastery: 0.5,
  confidenceEvidenceTarget: 5,
  difficultyWeights: { 1: 0.8, 2: 0.9, 3: 1, 4: 1.1, 5: 1.2 },
  algorithmVersion: 'TEST_MASTERY_V1',
}

function evidence(overrides: Partial<LearningEvidence> = {}): LearningEvidence {
  const questionDifficulty = overrides.questionDifficulty ?? 3
  const knowledgeWeight = overrides.knowledgeWeight ?? 1
  return {
    id: overrides.id ?? `evidence-${Math.random()}`,
    type: 'question_attempt',
    studentProfileId: overrides.studentProfileId ?? 'student-a',
    knowledgePointId: overrides.knowledgePointId ?? 'KP_A',
    source: overrides.source ?? { questionId: 'QUESTION_A' },
    outcome: overrides.outcome ?? 'correct',
    questionDifficulty,
    knowledgeWeight,
    evidenceWeight:
      overrides.evidenceWeight ??
      knowledgeWeight * (policy.difficultyWeights[questionDifficulty] ?? 1),
    occurredAt: overrides.occurredAt ?? '2026-09-01T00:00:00.000Z',
    ...(overrides.metadata ? { metadata: overrides.metadata } : {}),
  }
}

function completedDemoSession(studentId = 'student-a') {
  const session = createQuestionSession(demoAssessmentContext, demoAssessmentDefinition, studentId)
  const attempts: QuestionAttempt[] = demoQuestions.map((question) => {
    const answer = correctAnswerDraft(question)
    return {
      questionId: question.id,
      answer,
      submitted: true,
      result: validateQuestionAnswer(question, answer),
      submittedAt: '2026-09-01T00:00:00.000Z',
      ...(question.questionVersion !== undefined
        ? { questionVersion: question.questionVersion }
        : {}),
    }
  })
  return {
    ...session,
    attempts,
    status: 'completed' as const,
    completedAt: '2026-09-01T00:01:00.000Z',
    updatedAt: '2026-09-01T00:01:00.000Z',
  }
}

afterEach(() => {
  // Keep the test process independent from the browser singleton storage.
  if (typeof localStorage !== 'undefined') localStorage.clear()
})

describe('QuestionKnowledgePoint weight contract', () => {
  it('accepts normalized mappings and rejects invalid or non-normalized weights', () => {
    expect(validateQuestionKnowledgePointWeights(demoQuestionKnowledgePoints).valid).toBe(true)

    const invalid: QuestionKnowledgePoint[] = [
      { ...demoQuestionKnowledgePoints[0], weight: 0 },
      { ...demoQuestionKnowledgePoints[1], weight: 1 },
    ]
    const report = validateQuestionKnowledgePointWeights(invalid)
    expect(report.valid).toBe(false)
    expect(report.issues.some((issue) => issue.includes('weight'))).toBe(true)
  })
})

describe('Learning evidence extraction', () => {
  it('extracts one weighted evidence item per question-to-knowledge mapping', () => {
    const result = extractLearningEvidenceFromQuestionSession({
      studentProfileId: 'student-a',
      session: completedDemoSession(),
      attempts: completedDemoSession().attempts,
      questions: demoQuestions,
      mappings: demoQuestionKnowledgePoints,
      policy,
    })

    expect(result.evidence).toHaveLength(6)
    expect(result.evidence.filter((item) => item.knowledgePointId === 'DEMO_KP_01')).toHaveLength(5)
    expect(result.evidence.filter((item) => item.knowledgePointId === 'DEMO_KP_02')).toHaveLength(1)
    expect(
      result.evidence.find((item) => item.knowledgePointId === 'DEMO_KP_02')?.knowledgeWeight,
    ).toBe(0.3)
    expect(result.diagnostics).toContain(
      'MASTERY_MANUAL_REVIEW_IGNORED: DEMO_QUESTION_SHORT_ANSWER',
    )
  })

  it('does not create evidence for incomplete sessions, missing attempts, or manual review', () => {
    const session = completedDemoSession()
    const incomplete = extractLearningEvidenceFromQuestionSession({
      studentProfileId: 'student-a',
      session: { ...session, status: 'in_progress' },
      attempts: session.attempts,
      questions: demoQuestions,
      mappings: demoQuestionKnowledgePoints,
      policy,
    })
    expect(incomplete.evidence).toEqual([])

    const missing = extractLearningEvidenceFromQuestionSession({
      studentProfileId: 'student-a',
      session: { ...session, attempts: session.attempts.slice(0, 1) },
      attempts: session.attempts.slice(0, 1),
      questions: demoQuestions,
      mappings: demoQuestionKnowledgePoints,
      policy,
    })
    expect(missing.evidence).toHaveLength(1)
    expect(missing.diagnostics).toContain('MASTERY_ATTEMPT_MISSING: DEMO_QUESTION_MULTIPLE_CHOICE')

    const manualAttempt = session.attempts[5]
    const manual = extractLearningEvidenceFromAttempt({
      studentProfileId: 'student-a',
      session,
      attempt: manualAttempt,
      question: demoQuestions[5],
      mappings: [demoQuestionKnowledgePoints[6]],
      policy,
    })
    expect(manual.evidence).toEqual([])
    expect(manual.diagnostics[0]).toContain('MANUAL_REVIEW_IGNORED')
  })

  it('uses stable evidence IDs and blocks sample sources when the policy is closed', () => {
    const session = completedDemoSession()
    const input = {
      studentProfileId: 'student-a',
      session,
      attempt: session.attempts[0],
      question: demoQuestions[0],
      mappings: [demoQuestionKnowledgePoints[0]],
      policy,
    }
    const first = extractLearningEvidenceFromAttempt(input)
    const second = extractLearningEvidenceFromAttempt(input)
    expect(first.evidence[0]?.id).toBe(second.evidence[0]?.id)
    expect(first.evidence[0]?.id).toContain('student-a')

    const blocked = extractLearningEvidenceFromAttempt(input, {
      accessPolicy: {
        allowSampleCurriculum: false,
        allowUnreviewedCurriculum: false,
        allowSampleQuestions: false,
        allowUnreviewedQuestions: false,
      },
    })
    expect(blocked.evidence).toEqual([])
    expect(blocked.diagnostics[0]).toContain('SOURCE_NOT_ALLOWED')
  })
})

describe('Deterministic Mastery Engine', () => {
  it('calculates weighted score and confidence without time decay or previous-score carryover', () => {
    const inputs = [
      evidence({ id: 'correct', outcome: 'correct', knowledgeWeight: 0.7, questionDifficulty: 3 }),
      evidence({ id: 'wrong', outcome: 'incorrect', knowledgeWeight: 0.3, questionDifficulty: 5 }),
    ]
    const result = calculateMastery({ knowledgePointId: 'KP_A', evidence: inputs, policy })
    expect(result.statistics.effectiveEvidenceWeight).toBeCloseTo(1.06)
    expect(result.masteryScore).toBeCloseTo((0.7 / 1.06) * 100)
    expect(result.confidence).toBeCloseTo(1.06 / 5)
    expect(result.state).toBe('learning')

    const reversed = calculateMastery({
      knowledgePointId: 'KP_A',
      evidence: inputs
        .map((item) => ({ ...item, occurredAt: '2036-01-01T00:00:00.000Z' }))
        .reverse(),
      previousRecord: buildMasteryRecord({
        studentProfileId: 'student-a',
        knowledgePointId: 'KP_A',
        evidence: [evidence({ id: 'old', outcome: 'incorrect' })],
        policy,
      }),
      policy,
    })
    expect(reversed.masteryScore).toBeCloseTo(result.masteryScore)
  })

  it('requires evidence and confidence before calling a knowledge point mastered', () => {
    expect(resolveKnowledgeLearningState(0, 100, 1, policy)).toBe('not_started')
    expect(resolveKnowledgeLearningState(1, 100, 1, policy)).toBe('learning')
    expect(resolveKnowledgeLearningState(3, 100, 0.4, policy)).toBe('learning')
    expect(resolveKnowledgeLearningState(3, 100, 0.6, policy)).toBe('mastered')
    expect(resolveKnowledgeLearningState(3, 39, 1, policy)).toBe('weak')
  })

  it('builds a versioned record with provenance flags and deterministic rebuild output', () => {
    const sourceEvidence = [
      evidence({ id: 'sample', metadata: { isSample: true, sourceVerificationStatus: 'SAMPLE' } }),
      evidence({ id: 'reviewed', metadata: { sourceVerificationStatus: 'REVIEWED' } }),
    ]
    const previous = buildMasteryRecord({
      studentProfileId: 'student-a',
      knowledgePointId: 'KP_A',
      evidence: [sourceEvidence[0]],
      policy,
    })
    const record = rebuildMasteryFromEvidence(
      'student-a',
      'KP_A',
      sourceEvidence,
      previous,
      policy,
      '2026-09-02T00:00:00.000Z',
    )
    expect(record.version).toBe(2)
    expect(record.algorithmVersion).toBe('TEST_MASTERY_V1')
    expect(record.isSampleDerived).toBe(true)
    expect(record.evidenceSourceStatus).toBe('MIXED')
    expect(record.lastEvidenceAt).toBe('2026-09-01T00:00:00.000Z')
  })

  it('normalizes existing FOUNDATION/STANDARD/ADVANCED difficulty to 1/3/5', () => {
    expect(QUESTION_DIFFICULTY_RANK.FOUNDATION).toBe(1)
    expect(QUESTION_DIFFICULTY_RANK.STANDARD).toBe(3)
    expect(QUESTION_DIFFICULTY_RANK.ADVANCED).toBe(5)
  })
})

describe('Mastery storage, repository, and processing service', () => {
  it('persists independently and safely falls back after corruption', () => {
    const storageLike = createMemoryStorage()
    const storage = createMasteryStorage(storageLike)
    const item = evidence({ id: 'persisted' })
    storage.saveEvidence([item])
    expect(storage.loadEvidence()).toEqual([item])
    expect(
      learningEvidenceStoragePayloadSchema.safeParse({ schemaVersion: 1, evidence: [item] })
        .success,
    ).toBe(true)

    storageLike.setItem('knowledge-island.learning-evidence', '{broken')
    expect(storage.loadEvidence()).toEqual([])
    expect(storage.getLastWarning()).toContain('损坏')
    expect(storageLike.getItem('knowledge-island.learning-evidence')).toBeNull()
  })

  it('deduplicates evidence by stable ID and isolates student records', () => {
    const repository = createMasteryRepository(createMasteryStorage(createMemoryStorage()))
    const item = evidence({ id: 'same-id', studentProfileId: 'student-a' })
    expect(repository.appendEvidence([item, item])).toHaveLength(1)
    expect(repository.appendEvidence([item])).toHaveLength(0)
    expect(repository.getEvidence('student-b')).toEqual([])
    expect(repository.getEvidence('student-a')).toHaveLength(1)
  })

  it('processes only completed sessions and remains idempotent on replay', async () => {
    const repository = createMasteryRepository(createMasteryStorage(createMemoryStorage()))
    const service = new MasteryProcessingService({
      repository,
      questionRepository: new MockQuestionRepository(),
      curriculum: curriculumService,
    })
    const session = completedDemoSession()
    const first = await service.processCompletedQuestionSession('student-a', session, {
      dataset: 'demo',
      policy,
      now: '2026-09-02T00:00:00.000Z',
    })
    expect(first.processed).toBe(true)
    expect(first.appendedEvidence).toHaveLength(6)
    expect(first.records).toHaveLength(2)
    expect(repository.getEvidence('student-a')).toHaveLength(6)

    const second = await service.processCompletedQuestionSession('student-a', session, {
      dataset: 'demo',
      policy,
      now: '2036-09-02T00:00:00.000Z',
    })
    expect(second.appendedEvidence).toEqual([])
    expect(second.records[0]?.version).toBe(first.records[0]?.version)

    repository.removeRecordsWhere('student-a', () => true)
    const repaired = await service.processCompletedQuestionSession('student-a', session, {
      dataset: 'demo',
      policy,
      now: '2036-09-02T00:00:00.000Z',
    })
    expect(repaired.appendedEvidence).toEqual([])
    expect(repaired.records).toHaveLength(2)
    expect(repaired.records[0]?.version).toBe(1)
    expect(repository.getMasteryRecords('student-a')).toHaveLength(2)

    const incomplete = await service.processCompletedQuestionSession(
      'student-a',
      {
        ...session,
        status: 'in_progress',
      },
      { dataset: 'demo', policy },
    )
    expect(incomplete.processed).toBe(false)
    expect(incomplete.appendedEvidence).toEqual([])
  })
})
