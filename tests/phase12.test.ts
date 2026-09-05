import { beforeEach, describe, expect, it } from 'vitest'

import {
  buildLearningHistoryId,
  createLearningHistoryRepository,
  createLearningHistoryStorage,
  projectLessonSessionToHistory,
  projectQuestionSessionToHistory,
} from '@/services/learning-history'
import {
  buildQuestionAttemptProjectionId,
  createWrongBookRepository,
  createWrongBookStorage,
  WrongBookProjectionService,
} from '@/services/wrong-book'
import {
  buildReviewQueueItemId,
  createReviewQueueRepository,
  createReviewQueueStorage,
  ReviewQueueProjectionService,
} from '@/services/review-queue'
import { createQuestionSession } from '@/services/question-engine'
import { strategyShowcaseFixtures } from '@/data/learning-strategy'
import type { LessonSession, QuestionSession, ReviewQueueItem } from '@/types'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

const lessonSession: LessonSession = {
  id: 'history-lesson-session',
  textbookId: 'TEXTBOOK_A',
  unitId: 'UNIT_A',
  lessonId: 'LESSON_A',
  knowledgePointId: 'KP_A',
  status: 'completed',
  currentStepIndex: 1,
  completedStepIds: ['STEP_1', 'STEP_2'],
  startedAt: '2026-08-20T09:00:00.000Z',
  updatedAt: '2026-08-20T09:10:00.000Z',
  completedAt: '2026-08-20T09:10:00.000Z',
}

const questionSession: QuestionSession = {
  id: 'history-question-session',
  assessmentId: 'ASSESSMENT_A',
  textbookId: 'TEXTBOOK_A',
  unitId: 'UNIT_A',
  lessonId: 'LESSON_A',
  knowledgePointId: 'KP_A',
  questionIds: ['QUESTION_1', 'QUESTION_2', 'QUESTION_3'],
  currentQuestionIndex: 2,
  status: 'completed',
  attempts: [
    {
      questionId: 'QUESTION_1',
      answer: { type: 'calculation', value: '1' },
      submitted: true,
      result: { status: 'correct', score: 1, maxScore: 1 },
      submittedAt: '2026-08-20T09:12:00.000Z',
    },
    {
      questionId: 'QUESTION_2',
      answer: { type: 'calculation', value: '0' },
      submitted: true,
      result: { status: 'incorrect', score: 0, maxScore: 1 },
      submittedAt: '2026-08-20T09:13:00.000Z',
    },
    {
      questionId: 'QUESTION_3',
      answer: { type: 'shortAnswer', value: '我再检查一次。' },
      submitted: true,
      result: { status: 'manual_review_required', score: 0, maxScore: 0 },
      submittedAt: '2026-08-20T09:14:00.000Z',
    },
  ],
  startedAt: '2026-08-20T09:11:00.000Z',
  updatedAt: '2026-08-20T09:14:00.000Z',
  completedAt: '2026-08-20T09:14:00.000Z',
}

const provenance = { isSampleDerived: false, verificationStatus: 'VERIFIED' as const }

describe('PHASE 12.1 Learning History', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('projects lesson and assessment facts with stable IDs and summaries', () => {
    const lessonProjection = projectLessonSessionToHistory('PROFILE_A', lessonSession, provenance)
    const assessmentProjection = projectQuestionSessionToHistory(
      'PROFILE_A',
      questionSession,
      provenance,
    )

    expect(lessonProjection.records.map((record) => record.type)).toEqual([
      'lesson_started',
      'lesson_completed',
    ])
    expect(assessmentProjection.records.map((record) => record.type)).toEqual([
      'assessment_started',
      'assessment_completed',
    ])
    expect(assessmentProjection.records[1].summary).toEqual({
      questionCount: 3,
      correctCount: 1,
      incorrectCount: 1,
      manualReviewCount: 1,
      assessmentPercentage: 50,
    })
    expect(assessmentProjection.records[1].summary?.assessmentPercentage).not.toBe(
      questionSession.attempts[0].result?.score,
    )
    expect(assessmentProjection.records[1].id).toBe(
      buildLearningHistoryId('PROFILE_A', 'assessment_completed', questionSession.id),
    )
  })

  it('is append-idempotent, profile-isolated, textbook-filterable, and stably sorted', () => {
    const storage = createLearningHistoryStorage(memoryStorage())
    const repository = createLearningHistoryRepository(storage)
    const profileA = projectLessonSessionToHistory('PROFILE_A', lessonSession, provenance).records
    const profileB = profileA.map((record) => ({
      ...record,
      id: buildLearningHistoryId('PROFILE_B', record.type, record.sourceId),
      profileId: 'PROFILE_B',
    }))
    repository.appendMany([...profileA, ...profileB])
    repository.appendMany(profileA)

    expect(repository.listByProfile('PROFILE_A')).toHaveLength(2)
    expect(repository.listByProfile('PROFILE_B')).toHaveLength(2)
    expect(repository.listByTextbook('PROFILE_A', 'TEXTBOOK_A')).toHaveLength(2)
    expect(repository.listByTextbook('PROFILE_A', 'TEXTBOOK_B')).toHaveLength(0)
    expect(repository.listByProfile('PROFILE_A').map((record) => record.type)).toEqual([
      'lesson_completed',
      'lesson_started',
    ])
    expect(repository.listByProfile('PROFILE_A', { includeSample: false })).toHaveLength(2)
  })

  it('recovers from malformed storage without throwing', () => {
    const storageLike = memoryStorage()
    const storage = createLearningHistoryStorage(storageLike)
    storageLike.setItem('knowledge-island.learning-history', '{broken')

    expect(storage.loadAll()).toEqual([])
    expect(storage.getLastWarning()).toContain('损坏')
    expect(storageLike.getItem('knowledge-island.learning-history')).toBeNull()
  })

  it('removes only sample history when clearing a profile', () => {
    const repository = createLearningHistoryRepository(
      createLearningHistoryStorage(memoryStorage()),
    )
    const formal = projectLessonSessionToHistory('PROFILE_A', lessonSession, provenance).records
    const sample = projectLessonSessionToHistory('PROFILE_A', lessonSession, {
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    }).records.map((record) => ({ ...record, id: `${record.id}:sample` }))
    repository.appendMany([...formal, ...sample])
    repository.clearDemoHistory('PROFILE_A')
    expect(repository.listByProfile('PROFILE_A')).toEqual(
      [...formal].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    )
  })
})

function incorrectSession(
  id: string,
  questionId = 'QUESTION_WRONG',
  submittedAt = '2026-08-20T10:00:00.000Z',
): QuestionSession {
  return {
    ...questionSession,
    id,
    questionIds: [questionId],
    attempts: [
      {
        questionId,
        answer: { type: 'calculation', value: '0' },
        submitted: true,
        result: { status: 'incorrect', score: 0, maxScore: 1 },
        submittedAt,
      },
    ],
  }
}

describe('PHASE 12.2 WrongBook', () => {
  it('only projects submitted deterministic incorrect attempts', () => {
    const repository = createWrongBookRepository(createWrongBookStorage(memoryStorage()))
    const projection = new WrongBookProjectionService(repository)
    const session: QuestionSession = {
      ...questionSession,
      id: 'wrong-filter-session',
      questionIds: ['CORRECT', 'MANUAL', 'DRAFT'],
      attempts: [
        {
          questionId: 'CORRECT',
          answer: { type: 'calculation', value: '1' },
          submitted: true,
          result: { status: 'correct', score: 1, maxScore: 1 },
        },
        {
          questionId: 'MANUAL',
          answer: { type: 'shortAnswer', value: '答复' },
          submitted: true,
          result: { status: 'manual_review_required', score: 0, maxScore: 0 },
        },
        {
          questionId: 'DRAFT',
          answer: { type: 'calculation', value: '0' },
          submitted: false,
        },
      ],
    }
    const result = projection.projectQuestionSession('PROFILE_A', session, {
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
      textbookId: 'TEXTBOOK_A',
      unitId: 'UNIT_A',
      lessonId: 'LESSON_A',
      supportedQuestionIds: new Set(['CORRECT', 'MANUAL']),
    })
    expect(result.records).toHaveLength(0)
    expect(repository.listByProfile('PROFILE_A')).toHaveLength(0)
  })

  it('deduplicates one attempt, increments on a new session, and keeps question content external', () => {
    const repository = createWrongBookRepository(createWrongBookStorage(memoryStorage()))
    const projection = new WrongBookProjectionService(repository)
    const first = incorrectSession('wrong-session-a')
    projection.projectQuestionSession('PROFILE_A', first, {
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
      textbookId: 'TEXTBOOK_A',
    })
    projection.projectQuestionSession('PROFILE_A', first, {
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
      textbookId: 'TEXTBOOK_A',
    })
    const second = incorrectSession('wrong-session-b', 'QUESTION_WRONG', '2026-08-21T10:00:00.000Z')
    projection.projectQuestionSession('PROFILE_A', second, {
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
      textbookId: 'TEXTBOOK_B',
    })

    const record = repository.get('PROFILE_A', 'QUESTION_WRONG')
    expect(record?.wrongCount).toBe(2)
    expect(record?.source.questionSessionIds).toEqual(['wrong-session-a', 'wrong-session-b'])
    expect(record?.textbookIds).toEqual(['TEXTBOOK_A', 'TEXTBOOK_B'])
    expect(record && 'stem' in record).toBe(false)
    expect(
      repository.hasProcessedAttempt(
        buildQuestionAttemptProjectionId('PROFILE_A', 'wrong-session-a', 'QUESTION_WRONG'),
      ),
    ).toBe(true)
  })

  it('blocks unsafe profile projection, propagates sample provenance, and resolves a correct retry', () => {
    const repository = createWrongBookRepository(createWrongBookStorage(memoryStorage()))
    const projection = new WrongBookProjectionService(repository)
    const first = incorrectSession('wrong-session-c')
    const blocked = projection.projectQuestionSession('PROFILE_A', first, {
      dataset: 'profile',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    expect(blocked.records).toEqual([])
    expect(blocked.diagnostics[0]).toContain('SOURCE_NOT_ALLOWED')

    projection.projectQuestionSession('PROFILE_A', first, {
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    expect(repository.get('PROFILE_A', 'QUESTION_WRONG')?.provenance).toEqual({
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })

    const retry: QuestionSession = {
      ...first,
      id: 'wrong-retry-session',
      attempts: [
        {
          questionId: 'QUESTION_WRONG',
          answer: { type: 'calculation', value: '1' },
          submitted: true,
          result: { status: 'correct', score: 1, maxScore: 1 },
          submittedAt: '2026-08-22T10:00:00.000Z',
        },
      ],
    }
    projection.resolveRetry('PROFILE_A', retry, 'QUESTION_WRONG', '2026-08-22T10:01:00.000Z', {
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    expect(repository.get('PROFILE_A', 'QUESTION_WRONG')?.status).toBe('resolved')
  })

  it('filters by profile and textbook while preserving active-first sorting', () => {
    const repository = createWrongBookRepository(createWrongBookStorage(memoryStorage()))
    repository.upsertWrong({
      profileId: 'PROFILE_A',
      questionId: 'Q_B',
      knowledgePointIds: ['KP_B'],
      wrongAt: '2026-08-21T00:00:00.000Z',
      questionSessionId: 'S_B',
      isSampleDerived: false,
      textbookId: 'TEXTBOOK_B',
    })
    repository.upsertWrong({
      profileId: 'PROFILE_A',
      questionId: 'Q_A',
      knowledgePointIds: ['KP_A'],
      wrongAt: '2026-08-22T00:00:00.000Z',
      questionSessionId: 'S_A',
      isSampleDerived: false,
      textbookId: 'TEXTBOOK_A',
    })
    repository.markResolved('PROFILE_A', 'Q_A', '2026-08-23T00:00:00.000Z')
    expect(repository.listByProfile('PROFILE_A').map((item) => item.questionId)).toEqual(['Q_B'])
    expect(
      repository
        .listByProfile('PROFILE_A', { includeResolved: true })
        .map((item) => item.questionId),
    ).toEqual(['Q_B', 'Q_A'])
    expect(repository.listByProfile('PROFILE_A', { textbookId: 'TEXTBOOK_A' })).toEqual([])
    expect(repository.listByProfile('PROFILE_B')).toEqual([])
  })
})

describe('PHASE 12.3 Review Queue', () => {
  it('projects Review recommendations into a stable, independently completable queue', () => {
    const repository = createReviewQueueRepository(createReviewQueueStorage(memoryStorage()))
    const projection = new ReviewQueueProjectionService(repository)
    const recommendation = {
      strategyVersion: 'STRATEGY_V1',
      studentProfileId: 'PROFILE_A',
      type: 'REINFORCE',
      reviewRecommendations: [
        {
          strategyVersion: 'STRATEGY_V1',
          studentProfileId: 'PROFILE_A',
          knowledgePointId: 'KP_A',
          mapNodeId: 'NODE_A',
          type: 'REINFORCE' as const,
          priority: 1,
          reason: {
            code: 'WEAK_MASTERY' as const,
            masteryScore: 20,
            confidence: 0.8,
            evidenceCount: 3,
            title: '再练一次',
            description: '再做几道题巩固理解。',
          },
          isSampleDerived: false,
          evidenceSourceStatus: 'VERIFIED' as const,
        },
      ],
      diagnostics: [],
      isSampleDerived: false,
    }
    const first = projection.projectStrategy(recommendation, {
      profileId: 'PROFILE_A',
      textbookId: 'TEXTBOOK_A',
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
    })
    const second = projection.projectStrategy(recommendation, {
      profileId: 'PROFILE_A',
      textbookId: 'TEXTBOOK_A',
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
    })
    expect(first.items).toHaveLength(1)
    expect(second.items[0].id).toBe(
      buildReviewQueueItemId('PROFILE_A', 'TEXTBOOK_A', 'KP_A', 'REINFORCE', 'NODE_A'),
    )
    expect(repository.listByProfile('PROFILE_A')).toHaveLength(1)
    const completed = repository.complete(
      'PROFILE_A',
      first.items[0].id,
      '2026-08-23T00:00:00.000Z',
    )
    expect(completed?.status).toBe('completed')
    projection.projectStrategy(recommendation, {
      profileId: 'PROFILE_A',
      textbookId: 'TEXTBOOK_A',
      dataset: 'profile',
      verificationStatus: 'VERIFIED',
    })
    expect(repository.get('PROFILE_A', first.items[0].id)?.status).toBe('completed')
  })

  it('does not materialize unsafe sample strategy into a production queue', () => {
    const repository = createReviewQueueRepository(createReviewQueueStorage(memoryStorage()))
    const projection = new ReviewQueueProjectionService(repository)
    const recommendation = strategyShowcaseFixtures[0]
    const result = projection.projectStrategy(
      {
        strategyVersion: 'STRATEGY_V1',
        studentProfileId: 'PROFILE_A',
        type: 'REINFORCE',
        reviewRecommendations: [
          {
            strategyVersion: 'STRATEGY_V1',
            studentProfileId: 'PROFILE_A',
            knowledgePointId: 'KP_A',
            type: 'REINFORCE',
            priority: 1,
            reason: {
              code: 'WEAK_MASTERY',
              masteryScore: 20,
              confidence: 0.8,
              evidenceCount: 3,
              title: '再练一次',
              description: '再练一练。',
            },
            isSampleDerived: true,
            evidenceSourceStatus: 'SAMPLE',
          },
        ],
        diagnostics: [],
        isSampleDerived: true,
        warning: '开发样本',
      },
      {
        profileId: 'PROFILE_A',
        textbookId: 'TEXTBOOK_A',
        dataset: 'profile',
        isSampleDerived: true,
        verificationStatus: 'SAMPLE',
      },
    )
    expect(result.items).toEqual([])
    expect(result.diagnostics[0]).toContain('SOURCE_NOT_ALLOWED')
    expect(repository.listByProfile('PROFILE_A')).toEqual([])
    expect(recommendation.isSample).toBe(true)
  })

  it('blocks unsafe provenance declared on an individual review recommendation', () => {
    const repository = createReviewQueueRepository(createReviewQueueStorage(memoryStorage()))
    const projection = new ReviewQueueProjectionService(repository)
    const result = projection.projectStrategy(
      {
        strategyVersion: 'STRATEGY_V1',
        studentProfileId: 'PROFILE_A',
        type: 'REINFORCE',
        reviewRecommendations: [
          {
            strategyVersion: 'STRATEGY_V1',
            studentProfileId: 'PROFILE_A',
            knowledgePointId: 'KP_A',
            type: 'REINFORCE',
            priority: 1,
            reason: {
              code: 'WEAK_MASTERY',
              masteryScore: 20,
              confidence: 0.8,
              evidenceCount: 3,
              title: '来源待核验',
              description: '仅用于开发闸门测试。',
            },
            isSampleDerived: false,
            evidenceSourceStatus: 'UNVERIFIED',
          },
        ],
        diagnostics: [],
        isSampleDerived: false,
      },
      {
        profileId: 'PROFILE_A',
        textbookId: 'TEXTBOOK_A',
        dataset: 'profile',
        verificationStatus: 'VERIFIED',
      },
    )
    expect(result.items).toEqual([])
    expect(result.diagnostics[0]).toContain('SOURCE_NOT_ALLOWED')
  })

  it('uses a distinct session identity for wrong-book retry without changing the original session', () => {
    const context = {
      textbookId: 'TEXTBOOK_A',
      unitId: 'UNIT_A',
      lessonId: 'LESSON_A',
      knowledgePointId: 'KP_A',
      source: 'wrong_book' as const,
    }
    const definition = {
      id: 'ASSESSMENT_A',
      knowledgePointId: 'KP_A',
      questionIds: ['Q_A'],
      mode: 'practice' as const,
    }
    const original = createQuestionSession(context, definition, 'PROFILE_A')
    const retry = createQuestionSession(context, definition, 'PROFILE_A', 'wrong-book:Q_A:SESSION')
    expect(retry.id).not.toBe(original.id)
    expect(original.attempts).toEqual([])
    expect(retry.attempts).toEqual([])
  })
})

describe('PHASE 12 output boundaries', () => {
  it('does not expose scheduler or reward fields in queue records', () => {
    const item: ReviewQueueItem = {
      id: 'review-queue:PROFILE_A:TEXTBOOK_A:KP_A:KP_A:REINFORCE',
      profileId: 'PROFILE_A',
      textbookId: 'TEXTBOOK_A',
      knowledgePointId: 'KP_A',
      recommendationType: 'REINFORCE',
      priority: 1,
      reason: {
        code: 'WEAK_MASTERY',
        masteryScore: 20,
        confidence: 0.8,
        evidenceCount: 3,
        title: '再练一次',
        description: '再练一练。',
      },
      reasonCode: 'WEAK_MASTERY',
      status: 'active',
      sourceStrategyVersion: 'STRATEGY_V1',
      sourceRecommendationId: 'strategy:STRATEGY_V1:REINFORCE:KP_A:KP_A',
      provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
    }
    const serialized = JSON.stringify(item)
    expect(serialized).not.toContain('scheduledAt')
    expect(serialized).not.toContain('reviewInterval')
    expect(serialized).not.toContain('reward')
  })
})
