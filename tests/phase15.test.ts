import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { createDailyPlanStorage } from '@/services/home/dailyPlanStorage'
import { createParentReportDemoFacts } from '@/data/parent-report'
import { createParentReportPreferencesStorage } from '@/services/parent-report/parentReportPreferencesStorage'
import {
  buildParentReportId,
  createParentReportService,
} from '@/services/parent-report/parentReportService'
import type {
  AchievementDefinition,
  AchievementUnlock,
  DailyLearningPlan,
  LearningEvidence,
  LearningHistoryRecord,
  LearningMapCurriculumSource,
  LearningMapProgressStorage,
  LearningRecommendation,
  MasteryRecord,
  ParentReportOptions,
  ParentReportServiceDependencies,
  ParentReport,
  RewardEvent,
  ReviewQueueItem,
  StudentCurriculumProfile,
  WrongQuestionRecord,
} from '@/types'
import type { MasteryRepository } from '@/services/mastery/masteryRepository'
import {
  configureParentReportStore,
  resetParentReportStoreDependencies,
  useParentReportStore,
} from '@/stores/parentReportStore'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

const profile: StudentCurriculumProfile = {
  studentId: 'PROFILE_A',
  regionId: 'REGION_A',
  gradeId: 'GRADE_3',
  semesterId: 'SEMESTER_UPPER',
  chineseTextbookVersionId: null,
  mathTextbookVersionId: 'TEXTBOOK_MATH',
  englishTextbookVersionId: null,
  confirmedAt: '2026-08-01T08:00:00.000Z',
  source: 'USER_CONFIRMED',
}

const source: LearningMapCurriculumSource = {
  textbook: {
    id: 'TEXTBOOK_MATH',
    title: '数学教材',
    grade: 3,
    semester: 1,
    subject: 'MATH',
    isSample: false,
    verificationStatus: 'VERIFIED',
  },
  units: [
    {
      id: 'UNIT_MATH',
      textbookId: 'TEXTBOOK_MATH',
      title: '数字岛',
      sort: 1,
      isSample: false,
      verificationStatus: 'VERIFIED',
    },
  ],
  lessons: [
    {
      id: 'LESSON_MATH',
      unitId: 'UNIT_MATH',
      title: '加法探险',
      sort: 1,
      isSample: false,
      verificationStatus: 'VERIFIED',
    },
  ],
  knowledgePoints: [
    { id: 'KP_WEAK', name: '两位数加法', isSample: false, verificationStatus: 'VERIFIED' },
    { id: 'KP_MASTERED', name: '认识乘法', isSample: false, verificationStatus: 'VERIFIED' },
    { id: 'KP_LEARNING', name: '估算', isSample: false, verificationStatus: 'VERIFIED' },
  ],
  lessonKnowledgePoints: [
    {
      id: 'MAP_WEAK',
      lessonId: 'LESSON_MATH',
      knowledgePointId: 'KP_WEAK',
      role: 'core',
      weight: 1,
      sort: 1,
      isSample: false,
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'MAP_MASTERED',
      lessonId: 'LESSON_MATH',
      knowledgePointId: 'KP_MASTERED',
      role: 'secondary',
      weight: 1,
      sort: 2,
      isSample: false,
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'MAP_LEARNING',
      lessonId: 'LESSON_MATH',
      knowledgePointId: 'KP_LEARNING',
      role: 'extended',
      weight: 1,
      sort: 3,
      isSample: false,
      verificationStatus: 'VERIFIED',
    },
  ],
  knowledgeRelations: [],
  isSample: false,
  verificationStatus: 'VERIFIED',
}

const provenance = { isSampleDerived: false, verificationStatus: 'VERIFIED' as const }

const history: LearningHistoryRecord[] = [
  {
    id: 'history-lesson-completed',
    profileId: 'PROFILE_A',
    type: 'lesson_completed',
    textbookId: 'TEXTBOOK_MATH',
    unitId: 'UNIT_MATH',
    lessonId: 'LESSON_MATH',
    knowledgePointId: 'KP_WEAK',
    sourceId: 'lesson-session-a',
    occurredAt: '2026-09-09T10:00:00.000+08:00',
    provenance,
  },
  {
    id: 'history-assessment-completed',
    profileId: 'PROFILE_A',
    type: 'assessment_completed',
    textbookId: 'TEXTBOOK_MATH',
    unitId: 'UNIT_MATH',
    lessonId: 'LESSON_MATH',
    knowledgePointId: 'KP_WEAK',
    sourceId: 'question-session-a',
    occurredAt: '2026-09-08T10:00:00.000+08:00',
    summary: {
      questionCount: 4,
      correctCount: 2,
      incorrectCount: 1,
      manualReviewCount: 1,
      assessmentPercentage: 66.67,
    },
    provenance,
  },
  {
    id: 'history-sample',
    profileId: 'PROFILE_A',
    type: 'lesson_completed',
    textbookId: 'TEXTBOOK_MATH',
    unitId: 'UNIT_MATH',
    lessonId: 'LESSON_MATH',
    knowledgePointId: 'KP_WEAK',
    sourceId: 'sample-session',
    occurredAt: '2026-09-09T12:00:00.000+08:00',
    provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
  },
]

function masteryRecord(
  knowledgePointId: string,
  state: MasteryRecord['state'],
  masteryScore: number,
): MasteryRecord {
  return {
    studentProfileId: 'PROFILE_A',
    knowledgePointId,
    masteryScore,
    confidence: 0.7,
    state,
    evidenceCount: 2,
    correctEvidenceCount: state === 'mastered' ? 2 : 0,
    incorrectEvidenceCount: state === 'mastered' ? 0 : 2,
    lastEvidenceAt: '2026-09-09T10:00:00.000+08:00',
    updatedAt: '2026-09-09T10:00:00.000+08:00',
    version: 1,
    algorithmVersion: 'MASTERY_V1',
    isSampleDerived: false,
    evidenceSourceStatus: 'VERIFIED',
  }
}

const mastery = [
  masteryRecord('KP_WEAK', 'weak', 99),
  masteryRecord('KP_MASTERED', 'mastered', 90),
  masteryRecord('KP_LEARNING', 'learning', 45),
]

const wrongBook: WrongQuestionRecord[] = [
  {
    id: 'wrong-a',
    profileId: 'PROFILE_A',
    questionId: 'QUESTION_ACTIVE',
    knowledgePointIds: ['KP_WEAK'],
    firstWrongAt: '2026-09-07T10:00:00.000+08:00',
    lastWrongAt: '2026-09-09T10:00:00.000+08:00',
    wrongCount: 2,
    status: 'active',
    source: { questionSessionIds: ['question-session-a'] },
    provenance,
    textbookId: 'TEXTBOOK_MATH',
  },
  {
    id: 'wrong-resolved',
    profileId: 'PROFILE_A',
    questionId: 'QUESTION_RESOLVED',
    knowledgePointIds: ['KP_MASTERED'],
    firstWrongAt: '2026-09-07T10:00:00.000+08:00',
    lastWrongAt: '2026-09-07T10:00:00.000+08:00',
    wrongCount: 1,
    status: 'resolved',
    resolvedAt: '2026-09-08T11:00:00.000+08:00',
    source: { questionSessionIds: ['question-session-b'] },
    provenance,
    textbookId: 'TEXTBOOK_MATH',
  },
]

const reviewQueue: ReviewQueueItem[] = [
  {
    id: 'review-active',
    profileId: 'PROFILE_A',
    textbookId: 'TEXTBOOK_MATH',
    knowledgePointId: 'KP_WEAK',
    recommendationType: 'REINFORCE',
    priority: 1,
    reason: {
      code: 'WEAK_MASTERY',
      masteryScore: 99,
      confidence: 0.7,
      evidenceCount: 2,
      title: '需要巩固',
      description: '再练一次',
    },
    reasonCode: 'WEAK_MASTERY',
    status: 'active',
    sourceStrategyVersion: 'STRATEGY_V1',
    sourceRecommendationId: 'recommendation-a',
    provenance,
  },
  {
    id: 'review-completed',
    profileId: 'PROFILE_A',
    textbookId: 'TEXTBOOK_MATH',
    knowledgePointId: 'KP_MASTERED',
    recommendationType: 'REINFORCE',
    priority: 2,
    reason: {
      code: 'LOW_CONFIDENCE',
      masteryScore: 70,
      confidence: 0.4,
      evidenceCount: 1,
      title: '再看一次',
      description: '再练一次',
    },
    reasonCode: 'LOW_CONFIDENCE',
    status: 'completed',
    completedAt: '2026-09-08T12:00:00.000+08:00',
    sourceStrategyVersion: 'STRATEGY_V1',
    sourceRecommendationId: 'recommendation-b',
    provenance,
  },
]

function rewardEvent(id: string, occurredAt: string, energy: number): RewardEvent {
  return {
    id,
    profileId: 'PROFILE_A',
    type: 'lesson_completed',
    sourceId: id,
    textbookId: 'TEXTBOOK_MATH',
    occurredAt,
    reward: { knowledgeEnergy: energy },
    provenance,
  }
}

const rewards = [
  rewardEvent('reward-old', '2026-08-01T10:00:00.000+08:00', 40),
  rewardEvent('reward-new', '2026-09-08T10:00:00.000+08:00', 10),
]

const definitions: AchievementDefinition[] = [
  {
    id: 'achievement:first-lesson',
    code: 'FIRST_LESSON',
    title: '第一次完成学习',
    description: '完成第一节课程。',
    category: 'learning',
    condition: { type: 'lesson_completed_count', target: 1 },
    iconKey: 'book-open',
    sort: 1,
    version: 'ACHIEVEMENT_V1',
  },
]

const unlocks: AchievementUnlock[] = [
  {
    id: 'unlock-a',
    profileId: 'PROFILE_A',
    achievementId: 'achievement:first-lesson',
    unlockedAt: '2026-09-09T12:00:00.000+08:00',
    provenance,
  },
]

const dailyPlan: DailyLearningPlan = {
  id: 'daily-plan-a',
  profileId: 'PROFILE_A',
  dateKey: '2026-09-09',
  textbookContextKey: 'MATH=TEXTBOOK_MATH',
  textbookIds: { CHINESE: null, MATH: 'TEXTBOOK_MATH', ENGLISH: null },
  dataset: 'profile',
  tasks: [
    {
      id: 'daily-task-a',
      profileId: 'PROFILE_A',
      type: 'review',
      subject: 'MATH',
      textbookId: 'TEXTBOOK_MATH',
      knowledgePointId: 'KP_WEAK',
      sourceId: 'review-active',
      title: '巩固两位数加法',
      status: 'completed',
      priority: 1,
      action: { type: 'learning_map', knowledgePointId: 'KP_WEAK' },
    },
    {
      id: 'daily-task-b',
      profileId: 'PROFILE_A',
      type: 'wrong_question',
      subject: 'MATH',
      textbookId: 'TEXTBOOK_MATH',
      sourceId: 'wrong-a',
      title: '再挑战一道错题',
      status: 'pending',
      priority: 2,
      action: { type: 'wrong_question', wrongQuestionId: 'QUESTION_ACTIVE' },
    },
  ],
  progress: { completed: 1, total: 2, percentage: 50 },
  status: 'in_progress',
  generatedAt: '2026-09-09T08:00:00.000+08:00',
  policyVersion: 'DAILY_PLAN_V1',
}

function recommendation(): LearningRecommendation {
  return {
    strategyVersion: 'STRATEGY_V1',
    studentProfileId: 'PROFILE_A',
    type: 'REINFORCE',
    reviewRecommendations: [
      {
        strategyVersion: 'STRATEGY_V1',
        studentProfileId: 'PROFILE_A',
        knowledgePointId: 'KP_WEAK',
        type: 'REINFORCE',
        priority: 1,
        reason: reviewQueue[0].reason,
        isSampleDerived: false,
        evidenceSourceStatus: 'VERIFIED',
      },
      {
        strategyVersion: 'STRATEGY_V1',
        studentProfileId: 'PROFILE_A',
        knowledgePointId: 'KP_LEARNING',
        type: 'GATHER_MORE_EVIDENCE',
        priority: 2,
        reason: reviewQueue[0].reason,
        isSampleDerived: false,
        evidenceSourceStatus: 'VERIFIED',
      },
    ],
    diagnostics: [],
    isSampleDerived: false,
  }
}

function createFixture(overrides: Partial<ParentReportServiceDependencies> = {}) {
  const emptyEvidence: LearningEvidence[] = []
  const masteryReader = {
    getMasteryRecords: () => mastery,
    getEvidence: () => emptyEvidence,
    getLastWarning: () => null,
  } as unknown as MasteryRepository
  const preferences = createDailyPlanStorage(memoryStorage())
  const base: ParentReportServiceDependencies = {
    historyService: {
      listByProfile: (profileId) => history.filter((item) => item.profileId === profileId),
      getLastWarning: () => null,
    } as never,
    masteryRepository: masteryReader,
    wrongBookService: {
      listByProfile: (profileId) => wrongBook.filter((item) => item.profileId === profileId),
      getLastWarning: () => null,
    },
    reviewQueueService: {
      listByProfile: (profileId) => reviewQueue.filter((item) => item.profileId === profileId),
      getLastWarning: () => null,
    },
    rewardService: {
      listByProfile: (profileId) => rewards.filter((item) => item.profileId === profileId),
      getLastWarning: () => null,
    },
    achievementService: {
      listDefinitions: () => definitions,
      listUnlocks: (profileId) => unlocks.filter((item) => item.profileId === profileId),
      getLastWarning: () => null,
    },
    dailyPlanStorage: {
      ...preferences,
      loadAll: () => [dailyPlan],
    },
    mapRepository: {
      getMapSource: async () => source,
    },
    progressStorage: {
      load: () => [],
      save: () => undefined,
      clear: () => undefined,
    } satisfies LearningMapProgressStorage,
    strategyService: {
      resolve: () => recommendation(),
      resolveReviews: () => recommendation().reviewRecommendations,
    },
  }
  return createParentReportService({ ...base, ...overrides })
}

describe('PHASE 15 Parent Report', () => {
  it('uses a deterministic ID and local-calendar 7-day range', async () => {
    const service = createFixture()
    const first = await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T00:30:00.000+08:00',
      range: '7d',
    })
    const second = await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T00:30:00.000+08:00',
      range: '7d',
    })

    expect(first.range).toEqual({ preset: '7d', startDate: '2026-09-04', endDate: '2026-09-10' })
    expect(first.id).toBe(buildParentReportId('PROFILE_A', '2026-09-04', '2026-09-10'))
    expect(second).toEqual(first)
    expect(first.id).not.toContain('Math.random')
  })

  it('aggregates completed history, assessment summary, wrong book, review, and mastery separately', async () => {
    const report = await createFixture().buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })

    expect(report.overview).toMatchObject({
      learningDays: 2,
      completedLessons: 1,
      completedAssessments: 1,
      activeWrongQuestions: 1,
      resolvedWrongQuestions: 1,
      completedReviews: 1,
      masteredKnowledgePoints: 1,
    })
    expect(
      report.activity.recentItems.find((item) => item.type === 'assessment_completed')?.summary,
    ).toEqual(history[1].summary)
    expect(report.wrongBook).toMatchObject({
      activeCount: 1,
      resolvedCount: 1,
      repeatedWrongCount: 1,
    })
    expect(report.review).toEqual({ pendingCount: 1, completedCount: 1, recentCompletedCount: 1 })
    expect(report.mastery).toEqual({
      totalKnowledgePoints: 3,
      notStarted: 0,
      weak: 1,
      learning: 1,
      mastered: 1,
    })
  })

  it('uses existing weak state and strategy priority without adding a score threshold', async () => {
    const report = await createFixture().buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: 'all',
    })

    expect(report.weakKnowledge.totalCount).toBe(2)
    expect(report.weakKnowledge.items.map((item) => item.knowledgePointId)).toEqual([
      'KP_WEAK',
      'KP_LEARNING',
    ])
    expect(report.weakKnowledge.items[0]).toMatchObject({
      name: '两位数加法',
      state: 'weak',
      masteryScore: 99,
      strategyPriority: 1,
    })
  })

  it('filters subject summaries and keeps empty subjects explicit', async () => {
    const report = await createFixture().buildReport('PROFILE_A', {
      profile,
      subject: 'MATH',
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })

    expect(report.subjectFilter).toBe('MATH')
    expect(report.subjects.find((item) => item.subject === 'MATH')).toMatchObject({
      hasData: true,
      completedLessons: 1,
    })
    expect(report.subjects.find((item) => item.subject === 'CHINESE')).toMatchObject({
      hasData: false,
      completedLessons: 0,
    })
  })

  it('reads daily plans and creates only real trend dates', async () => {
    const report = await createFixture().buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: '30d',
    })

    expect(report.dailyPlan).toEqual({
      completedTasks: 1,
      totalTasks: 2,
      days: [{ dateKey: '2026-09-09', completed: 1, total: 2, percentage: 50 }],
    })
    expect(report.trend.points.map((point) => point.dateKey)).toEqual(['2026-09-08', '2026-09-09'])
    expect(report.trend.points.find((point) => point.dateKey === '2026-09-10')).toBeUndefined()
  })

  it('keeps formal reports free of sample facts and marks demo reports', async () => {
    const service = createFixture()
    const formal = await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: 'all',
    })
    const demo = await service.buildReport('PROFILE_A', {
      profile,
      dataset: 'demo',
      now: '2026-09-10T12:00:00.000+08:00',
      range: 'all',
    })

    expect(formal.flags.isSampleDerived).toBe(false)
    expect(formal.overview.completedLessons).toBe(1)
    expect(formal.participation.completedLessons).toBe(1)
    expect(formal.participation.recentItems.some((item) => item.id === 'history-sample')).toBe(
      false,
    )
    expect(demo.flags.isSampleDerived).toBe(true)
    expect(demo.overview.completedLessons).toBe(2)
  })

  it('isolates profiles even when a faulty reader returns mixed records', async () => {
    const service = createFixture({
      historyService: {
        listByProfile: () =>
          history.concat({ ...history[0], id: 'other-history', profileId: 'PROFILE_B' }),
        getLastWarning: () => null,
      } as never,
      masteryRepository: {
        getMasteryRecords: () => mastery.concat({ ...mastery[0], studentProfileId: 'PROFILE_B' }),
        getEvidence: () => [],
        getLastWarning: () => null,
      } as unknown as MasteryRepository,
    })
    const report = await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: 'all',
    })

    expect(report.overview.completedLessons).toBe(1)
    expect(report.mastery.totalKnowledgePoints).toBe(3)
  })

  it('does not write child facts while loading a report', async () => {
    const writes = { history: 0, mastery: 0, reward: 0, achievement: 0, queue: 0, wrong: 0 }
    const service = createFixture({
      historyService: {
        listByProfile: () => history,
        getLastWarning: () => null,
        recordLessonSession: () => {
          writes.history += 1
          throw new Error('must not write')
        },
        recordQuestionSession: () => {
          writes.history += 1
          throw new Error('must not write')
        },
      } as never,
      masteryRepository: {
        getMasteryRecords: () => mastery,
        getEvidence: () => [],
        getLastWarning: () => null,
        saveMasteryRecord: () => {
          writes.mastery += 1
        },
      } as unknown as MasteryRepository,
      rewardService: {
        listByProfile: () => rewards,
        getLastWarning: () => null,
        processLearningFact: () => {
          writes.reward += 1
          throw new Error('must not write')
        },
      } as never,
      achievementService: {
        listDefinitions: () => definitions,
        listUnlocks: () => unlocks,
        getLastWarning: () => null,
        evaluate: () => {
          writes.achievement += 1
          throw new Error('must not evaluate')
        },
      } as never,
      reviewQueueService: {
        listByProfile: () => reviewQueue,
        getLastWarning: () => null,
        complete: () => {
          writes.queue += 1
          throw new Error('must not write')
        },
      } as never,
      wrongBookService: {
        listByProfile: () => wrongBook,
        getLastWarning: () => null,
        markResolved: () => {
          writes.wrong += 1
          throw new Error('must not write')
        },
      } as never,
    })
    await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })
    expect(writes).toEqual({
      history: 0,
      mastery: 0,
      reward: 0,
      achievement: 0,
      queue: 0,
      wrong: 0,
    })
  })

  it('returns a usable partial report with diagnostics when a source fails', async () => {
    const service = createFixture({
      historyService: {
        listByProfile: () => {
          throw new Error('history unavailable')
        },
        getLastWarning: () => null,
      } as never,
      mapRepository: {
        getMapSource: async () => {
          throw new Error('map unavailable')
        },
      },
    })
    const report = await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })

    expect(report).toBeTruthy()
    expect(report.diagnostics.join(' ')).toContain('history unavailable')
    expect(report.mastery.totalKnowledgePoints).toBe(3)
  })

  it('propagates unverified status and safely excludes it from formal counts', async () => {
    const unverifiedHistory = {
      ...history[0],
      id: 'history-unverified',
      provenance: { isSampleDerived: false, verificationStatus: 'UNVERIFIED' as const },
    }
    const service = createFixture({
      historyService: {
        listByProfile: () => [unverifiedHistory],
        getLastWarning: () => null,
      } as never,
    })
    const report = await service.buildReport('PROFILE_A', {
      profile,
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })
    expect(report.overview.completedLessons).toBe(0)
    expect(report.flags.containsUnverifiedContent).toBe(false)
    expect(report.participation.completedLessons).toBe(1)
    expect(report.participation.unverifiedCount).toBe(1)
    expect(report.participation.recentItems[0]?.title).toContain('加法探险')
    expect(unverifiedHistory.provenance.verificationStatus).toBe('UNVERIFIED')
  })

  it('keeps participation scoped by profile, subject and time, and retains old textbook titles without admitting unsafe mastery', async () => {
    const old = {
      ...history[0]!,
      id: 'old-unverified',
      textbookId: 'OLD_CHINESE',
      occurredAt: '2026-08-01T10:00:00+08:00',
      provenance: { isSampleDerived: false, verificationStatus: 'UNVERIFIED' as const },
    }
    const rows = [
      old,
      old,
      { ...old, id: 'other-child', profileId: 'PROFILE_B' },
      {
        ...old,
        id: 'rejected',
        provenance: { isSampleDerived: false, verificationStatus: 'REJECTED' as const },
      },
    ]
    const oldSource = {
      ...source,
      textbook: {
        ...source.textbook,
        id: 'OLD_CHINESE',
        subject: 'CHINESE' as const,
        verificationStatus: 'UNVERIFIED' as const,
      },
      verificationStatus: 'UNVERIFIED' as const,
    }
    const service = createFixture({
      historyService: { listByProfile: () => rows, getLastWarning: () => null } as never,
      mapRepository: {
        getMapSource: async (request) =>
          request.textbookId === 'OLD_CHINESE' ? oldSource : source,
      },
    })
    const options = {
      profile,
      now: '2026-09-10T12:00:00+08:00',
      range: 'all' as const,
      subject: 'CHINESE' as const,
    }
    const report = await service.buildReport('PROFILE_A', options)
    expect(report.range.startDate).toBe('2026-08-01')
    expect(report.participation.completedLessons).toBe(1)
    expect(report.participation.recentItems.map((r) => r.id)).toEqual(['old-unverified'])
    expect(report.overview.completedLessons).toBe(0)
    expect(
      (await service.buildReport('PROFILE_A', { ...options, range: '7d' })).participation
        .completedLessons,
    ).toBe(0)
    expect(
      (await service.buildReport('PROFILE_A', { ...options, subject: 'MATH' })).participation
        .completedLessons,
    ).toBe(0)
    expect(oldSource.verificationStatus).toBe('UNVERIFIED')
  })

  it('handles empty and explicit development fixture variants without changing domain storage', async () => {
    const service = createFixture()
    const empty = await service.buildReport('PROFILE_A', {
      profile,
      dataset: 'demo',
      demoScenario: 'empty',
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })
    const noWrong = await service.buildReport('PROFILE_A', {
      profile,
      dataset: 'demo',
      demoScenario: 'no-wrong-book',
      now: '2026-09-10T12:00:00.000+08:00',
      range: '7d',
    })

    expect(empty.overview.completedLessons).toBe(0)
    expect(empty.wrongBook.activeCount).toBe(0)
    expect(noWrong.wrongBook.activeCount).toBe(0)
    expect(wrongBook).toHaveLength(2)
  })

  it('supports a read-only in-memory development fixture and an explicit error state', async () => {
    const demoFacts = createParentReportDemoFacts('PROFILE_A')
    const shouldNotReadPersistedFacts = () => {
      throw new Error('persisted demo facts must not be read')
    }
    const service = createFixture({
      historyService: {
        listByProfile: shouldNotReadPersistedFacts,
        getLastWarning: () => null,
      } as never,
      wrongBookService: {
        listByProfile: shouldNotReadPersistedFacts,
        getLastWarning: () => null,
      } as never,
      reviewQueueService: {
        listByProfile: shouldNotReadPersistedFacts,
        getLastWarning: () => null,
      } as never,
      masteryRepository: {
        getMasteryRecords: shouldNotReadPersistedFacts,
        getEvidence: shouldNotReadPersistedFacts,
        getLastWarning: () => null,
      } as unknown as MasteryRepository,
      rewardService: {
        listByProfile: shouldNotReadPersistedFacts,
        getLastWarning: () => null,
      } as never,
      achievementService: {
        listDefinitions: () => definitions,
        listUnlocks: shouldNotReadPersistedFacts,
        getLastWarning: () => null,
      } as never,
      dailyPlanStorage: {
        ...createDailyPlanStorage(memoryStorage()),
        loadAll: shouldNotReadPersistedFacts,
      },
    })
    const report = await service.buildReport('PROFILE_A', {
      profile,
      dataset: 'demo',
      demoFacts,
      now: '2026-09-03T12:00:00.000+08:00',
      range: '7d',
    })

    expect(report.flags.isSampleDerived).toBe(true)
    expect(report.overview.completedLessons).toBe(1)
    await expect(
      service.buildReport('PROFILE_A', {
        profile,
        dataset: 'demo',
        demoFacts,
        demoScenario: 'error',
        now: '2026-09-03T12:00:00.000+08:00',
        range: '7d',
      }),
    ).rejects.toThrow('模拟报告读取失败')
  })
})

describe('PHASE 15 Parent Report preferences', () => {
  it('uses schema version 1 and recovers malformed preference storage', () => {
    const storageLike = memoryStorage()
    const storage = createParentReportPreferencesStorage(storageLike)
    storageLike.setItem('knowledge-island.parent-report-preferences', '{broken')

    expect(storage.load()).toBeNull()
    expect(storage.getLastWarning()).toContain('损坏')
    expect(storageLike.getItem('knowledge-island.parent-report-preferences')).toBeNull()

    storage.save({ schemaVersion: 1, selectedRange: '30d', selectedSubject: 'MATH' })
    expect(storage.load()).toEqual({
      schemaVersion: 1,
      selectedRange: '30d',
      selectedSubject: 'MATH',
    })
  })

  it('rejects unsupported preference values without persisting them', () => {
    const storageLike = memoryStorage()
    const storage = createParentReportPreferencesStorage(storageLike)
    storage.save({ schemaVersion: 1, selectedRange: '7d', selectedSubject: 'ALL' })
    const before = storage.load()
    storage.save({ schemaVersion: 2 as 1, selectedRange: '7d', selectedSubject: 'ALL' })
    expect(storage.load()).toEqual(before)
  })

  it('keeps store actions read-only for domain facts and persists only view preferences', async () => {
    const saved: unknown[] = []
    let cleared = 0
    const preferences = {
      load: () => null,
      save: (payload: unknown) => saved.push(payload),
      clear: () => {
        cleared += 1
      },
      getLastWarning: () => null,
    }
    const calls: ParentReportOptions[] = []
    const report = { id: 'report-a', diagnostics: [] } as unknown as ParentReport
    configureParentReportStore({
      preferencesStorage: preferences,
      service: {
        loadReport: async (_profileId, options) => {
          calls.push(options)
          return report
        },
      },
    })
    setActivePinia(createPinia())
    const store = useParentReportStore()
    await store.loadReport('PROFILE_A', { dataset: 'profile' })
    await store.changeRange('30d')
    await store.changeSubject('MATH')

    expect(store.report).toEqual(report)
    expect(calls.map((options) => options.range)).toEqual(['7d', '30d', '30d'])
    expect(calls.map((options) => options.subject)).toEqual(['ALL', 'ALL', 'MATH'])
    expect(saved).toHaveLength(2)
    expect(cleared).toBe(0)
    store.resetDevReport()
    expect(cleared).toBe(1)
    resetParentReportStoreDependencies()
  })
})
