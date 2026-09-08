import { describe, expect, it } from 'vitest'

import {
  buildDailyLearningTaskId,
  buildDailyPlanId,
  buildTextbookContextKey,
  getLocalDateKey,
  projectDailyPlan,
} from '@/services/home/dailyPlanProjection'
import { DAILY_PLAN_STORAGE_KEY, createDailyPlanStorage } from '@/services/home/dailyPlanStorage'
import { phase14DemoProfile } from '@/data/home'
import { createHomeService } from '@/services/home/homeService'
import {
  createHomeLessonSessionReader,
  createHomeQuestionSessionReader,
} from '@/services/home/homeSessionReaders'
import { createLessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import { createQuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import type {
  DailyPlanProjectionInput,
  LearningRecommendation,
  LessonSession,
  ReviewQueueItem,
  WrongQuestionRecord,
} from '@/types'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

const reason = {
  code: 'WEAK_MASTERY' as const,
  masteryScore: 32,
  confidence: 0.6,
  evidenceCount: 2,
  title: '需要再练一练',
  description: '把这个知识点再巩固一次。',
}

function lessonSession(overrides: Partial<LessonSession> = {}): LessonSession {
  return {
    id: 'lesson-session:PROFILE_A:TEXTBOOK_A:UNIT_A:LESSON_A:KP_A',
    textbookId: 'TEXTBOOK_A',
    unitId: 'UNIT_A',
    lessonId: 'LESSON_A',
    knowledgePointId: 'KP_A',
    status: 'in_progress',
    currentStepIndex: 1,
    completedStepIds: ['STEP_A'],
    startedAt: '2026-09-03T09:00:00.000Z',
    updatedAt: '2026-09-03T09:10:00.000Z',
    ...overrides,
  }
}

function reviewItem(overrides: Partial<ReviewQueueItem> = {}): ReviewQueueItem {
  return {
    id: 'review-item-a',
    profileId: 'PROFILE_A',
    textbookId: 'TEXTBOOK_A',
    knowledgePointId: 'KP_A',
    recommendationType: 'REINFORCE',
    priority: 1,
    reason,
    reasonCode: 'WEAK_MASTERY',
    status: 'active',
    sourceStrategyVersion: 'STRATEGY_V1',
    sourceRecommendationId: 'recommendation-a',
    provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
    ...overrides,
  }
}

function wrongRecord(overrides: Partial<WrongQuestionRecord> = {}): WrongQuestionRecord {
  return {
    id: 'wrong-question:PROFILE_A:QUESTION_A',
    profileId: 'PROFILE_A',
    questionId: 'QUESTION_A',
    knowledgePointIds: ['KP_A'],
    firstWrongAt: '2026-09-03T09:20:00.000Z',
    lastWrongAt: '2026-09-03T09:20:00.000Z',
    wrongCount: 1,
    status: 'active',
    source: { questionSessionIds: ['question-session-a'] },
    provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
    textbookId: 'TEXTBOOK_A',
    unitId: 'UNIT_A',
    lessonId: 'LESSON_A',
    ...overrides,
  }
}

function strategy(overrides: Partial<LearningRecommendation> = {}): LearningRecommendation {
  return {
    strategyVersion: 'STRATEGY_V1',
    studentProfileId: 'PROFILE_A',
    type: 'PROCEED_TO_NEXT',
    reviewRecommendations: [
      {
        strategyVersion: 'STRATEGY_V1',
        studentProfileId: 'PROFILE_A',
        knowledgePointId: 'KP_A',
        type: 'REINFORCE',
        priority: 1,
        reason,
        isSampleDerived: false,
        evidenceSourceStatus: 'VERIFIED',
      },
    ],
    nextKnowledgePoint: {
      knowledgePointId: 'KP_B',
      title: '下一步知识',
      currentStatus: 'available',
      masteryState: 'not_started',
      reason: {
        ...reason,
        code: 'NEXT_AVAILABLE_KNOWLEDGE_POINT',
        title: '可以开始下一步',
      },
    },
    diagnostics: [],
    isSampleDerived: false,
    ...overrides,
  }
}

function baseInput(overrides: Partial<DailyPlanProjectionInput> = {}): DailyPlanProjectionInput {
  return {
    profileId: 'PROFILE_A',
    dateKey: '2026-09-03',
    generatedAt: '2026-09-03T08:00:00.000Z',
    dataset: 'profile',
    textbookIds: { CHINESE: null, MATH: 'TEXTBOOK_A', ENGLISH: null },
    lessonSessions: [],
    strategies: [],
    reviewQueue: [],
    wrongBook: [],
    maps: [],
    history: [],
    ...overrides,
  }
}

describe('PHASE 14.1 Home Domain and Daily Plan', () => {
  it('fills an empty daily snapshot when a current learning recommendation becomes available', () => {
    const empty = projectDailyPlan(baseInput())
    expect(empty.tasks).toHaveLength(0)
    const recommendation = { ...strategy(), type: 'CONTINUE_CURRENT' as const }
    const input = baseInput({
      strategies: [{ subject: 'MATH', textbookId: 'TEXTBOOK_A', recommendation }],
    })
    const filled = projectDailyPlan(input, {}, empty)
    expect(filled.tasks.some((task) => task.type === 'next_learning')).toBe(true)
    expect(projectDailyPlan(input, {}, filled).tasks).toEqual(filled.tasks)
  })

  it('uses local dates and deterministic plan/task identities', () => {
    expect(getLocalDateKey(new Date(2026, 8, 3, 23, 59))).toBe('2026-09-03')
    const context = buildTextbookContextKey({ MATH: 'TEXTBOOK_A' })
    expect(buildDailyPlanId('PROFILE_A', '2026-09-03', context)).toBe(
      'daily-plan:PROFILE_A:2026-09-03:profile:CHINESE=-|MATH=TEXTBOOK_A|ENGLISH=-',
    )
    expect(buildDailyLearningTaskId('PROFILE_A', '2026-09-03', 'review', 'review-item-a')).toBe(
      'daily-task:PROFILE_A:2026-09-03:review:review-item-a',
    )
  })

  it('composes only legal domain tasks in deterministic priority order', () => {
    const plan = projectDailyPlan(
      baseInput({
        lessonSessions: [lessonSession()],
        strategies: [{ subject: 'MATH', textbookId: 'TEXTBOOK_A', recommendation: strategy() }],
        reviewQueue: [reviewItem()],
        wrongBook: [wrongRecord()],
      }),
    )

    expect(plan.tasks.map((task) => task.type)).toEqual([
      'continue_learning',
      'review',
      'wrong_question',
    ])
    expect(plan.tasks.every((task) => task.profileId === 'PROFILE_A')).toBe(true)
    expect(plan.tasks.some((task) => task.type === 'reinforce')).toBe(false)
    expect(plan.tasks.some((task) => task.type === 'next_learning')).toBe(false)
  })

  it('deduplicates review, reinforce, and next at textbook plus knowledge-point level', () => {
    const plan = projectDailyPlan(
      baseInput({
        strategies: [
          {
            subject: 'MATH',
            textbookId: 'TEXTBOOK_A',
            recommendation: strategy({
              type: 'REINFORCE',
              nextKnowledgePoint: undefined,
            }),
          },
          {
            subject: 'CHINESE',
            textbookId: 'TEXTBOOK_B',
            recommendation: strategy({
              type: 'REINFORCE',
              nextKnowledgePoint: undefined,
            }),
          },
        ],
        reviewQueue: [reviewItem()],
        textbookIds: { CHINESE: 'TEXTBOOK_B', MATH: 'TEXTBOOK_A', ENGLISH: null },
      }),
      { maxTasks: 3, maxReviewTasks: 2, maxReinforceTasks: 2 },
    )

    expect(
      plan.tasks.map((task) => `${task.type}:${task.textbookId}:${task.knowledgePointId}`),
    ).toEqual(['review:TEXTBOOK_A:KP_A', 'reinforce:TEXTBOOK_B:KP_A'])
  })

  it('freezes task identity while refreshing completion from domain facts', () => {
    const initial = projectDailyPlan(
      baseInput({ lessonSessions: [lessonSession()], reviewQueue: [reviewItem()] }),
    )
    const initialIds = initial.tasks.map((task) => task.id)
    const refreshed = projectDailyPlan(
      baseInput({
        lessonSessions: [
          lessonSession({ status: 'completed', completedAt: '2026-09-03T10:00:00.000Z' }),
        ],
        reviewQueue: [],
        wrongBook: [
          wrongRecord({ id: 'wrong-question:PROFILE_A:NEW', questionId: 'QUESTION_NEW' }),
        ],
        generatedAt: '2026-09-03T12:00:00.000Z',
      }),
      undefined,
      initial,
    )

    expect(refreshed.tasks.map((task) => task.id)).toEqual(initialIds)
    expect(refreshed.tasks.find((task) => task.type === 'continue_learning')?.status).toBe(
      'completed',
    )
    expect(refreshed.tasks.find((task) => task.type === 'review')?.status).toBe('unavailable')
    expect(refreshed.tasks.some((task) => task.sourceId === 'wrong-question:PROFILE_A:NEW')).toBe(
      false,
    )
    expect(refreshed.progress).toEqual({ completed: 1, total: 1, percentage: 100 })
  })

  it('keeps sample tasks out of formal plans but allows explicit demo plans', () => {
    const sampleReview = reviewItem({
      provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
    })
    expect(projectDailyPlan(baseInput({ reviewQueue: [sampleReview] })).tasks).toHaveLength(0)
    expect(
      projectDailyPlan(baseInput({ dataset: 'demo', reviewQueue: [sampleReview] })).tasks,
    ).toHaveLength(1)
  })

  it('isolates profiles and recovers malformed daily-plan storage', () => {
    const raw = memoryStorage()
    const storage = createDailyPlanStorage(raw)
    raw.setItem(DAILY_PLAN_STORAGE_KEY, '{broken')
    expect(storage.loadAll()).toEqual([])
    expect(storage.getLastWarning()).toContain('损坏')
    expect(raw.getItem(DAILY_PLAN_STORAGE_KEY)).toBeNull()

    const planA = projectDailyPlan(baseInput())
    const planB = projectDailyPlan(baseInput({ profileId: 'PROFILE_B' }))
    storage.saveAll([planA, planB])
    expect(
      storage.get('PROFILE_A', planA.dateKey, planA.textbookContextKey, 'profile')?.profileId,
    ).toBe('PROFILE_A')
    expect(
      storage.get('PROFILE_B', planB.dateKey, planB.textbookContextKey, 'profile')?.profileId,
    ).toBe('PROFILE_B')
  })

  it('builds a demo Home view through service boundaries with a continue task', async () => {
    const lessonStorage = createLessonSessionStorage(memoryStorage())
    const questionStorage = createQuestionSessionStorage(memoryStorage())
    const service = createHomeService({
      lessonSessionStorage: lessonStorage,
      questionSessionStorage: questionStorage,
      lessonSessionReader: createHomeLessonSessionReader(lessonStorage),
      questionSessionReader: createHomeQuestionSessionReader(questionStorage),
    })
    const profile = { ...phase14DemoProfile, studentId: 'HOME_PROFILE' }
    service.seedDemoData(profile.studentId)
    const viewModel = await service.load(profile, {
      dataset: 'demo',
      seedDemo: false,
      now: '2026-09-03T10:00:00.000Z',
    })

    expect(viewModel.today.tasks.map((task) => task.type)).toContain('continue_learning')
    expect(viewModel.today.tasks.length).toBeLessThanOrEqual(3)
    expect(viewModel.flags.isSample).toBe(true)
    expect(viewModel.growth.knowledgeEnergy).toBeGreaterThanOrEqual(0)
  })
})
