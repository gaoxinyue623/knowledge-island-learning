import { describe, expect, it } from 'vitest'

import { getAchievementDefinitions } from '@/data/achievement/achievementDefinitions'
import { createAchievementRepository, createAchievementStorage } from '@/services/achievement'
import { AchievementService } from '@/services/achievement/achievementService'
import {
  createGrowthService,
  createGrowthStorage,
  createKnowledgeEnergyStorage,
  growthLevelForEnergy,
} from '@/services/growth'
import {
  createLearningHistoryRepository,
  createLearningHistoryStorage,
} from '@/services/learning-history'
import {
  buildRewardEventId,
  buildMasteryRewardSourceId,
  createRewardEventRepository,
  createRewardEventStorage,
  RewardProjectionService,
  RewardService,
} from '@/services/reward'
import {
  createReviewQueueRepository,
  createReviewQueueStorage,
  ReviewQueueService,
} from '@/services/review-queue'
import {
  createWrongBookRepository,
  createWrongBookStorage,
  WrongBookService,
} from '@/services/wrong-book'
import type {
  LessonSession,
  MasteryRecord,
  QuestionSession,
  ReviewQueueItem,
  RewardEvent,
  WrongQuestionRecord,
} from '@/types'
import { LearningHistoryService } from '@/services/learning-history'
import type { MasteryRepository } from '@/services/mastery/masteryRepository'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

const lessonSession: LessonSession = {
  id: 'reward-lesson-session',
  textbookId: 'TEXTBOOK_A',
  unitId: 'UNIT_A',
  lessonId: 'LESSON_A',
  knowledgePointId: 'KP_A',
  status: 'completed',
  currentStepIndex: 1,
  completedStepIds: ['STEP_1', 'STEP_2'],
  startedAt: '2026-09-01T09:00:00.000Z',
  updatedAt: '2026-09-01T09:10:00.000Z',
  completedAt: '2026-09-01T09:10:00.000Z',
}

const questionSession: QuestionSession = {
  id: 'reward-question-session',
  assessmentId: 'ASSESSMENT_A',
  textbookId: 'TEXTBOOK_A',
  unitId: 'UNIT_A',
  lessonId: 'LESSON_A',
  knowledgePointId: 'KP_A',
  questionIds: ['QUESTION_A'],
  currentQuestionIndex: 0,
  status: 'completed',
  attempts: [
    {
      questionId: 'QUESTION_A',
      answer: { type: 'calculation', value: '1' },
      submitted: true,
      result: { status: 'incorrect', score: 0, maxScore: 1 },
      submittedAt: '2026-09-01T09:12:00.000Z',
    },
  ],
  startedAt: '2026-09-01T09:11:00.000Z',
  updatedAt: '2026-09-01T09:12:00.000Z',
  completedAt: '2026-09-01T09:12:00.000Z',
}

const reviewItem: ReviewQueueItem = {
  id: 'review-item-a',
  profileId: 'PROFILE_A',
  textbookId: 'TEXTBOOK_A',
  knowledgePointId: 'KP_A',
  recommendationType: 'REINFORCE',
  priority: 1,
  reason: {
    code: 'WEAK_MASTERY',
    masteryScore: 20,
    confidence: 0.5,
    evidenceCount: 2,
    title: '需要巩固',
    description: '再练一次',
  },
  reasonCode: 'WEAK_MASTERY',
  status: 'completed',
  sourceStrategyVersion: 'STRATEGY_V1',
  sourceRecommendationId: 'recommendation-a',
  provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
  completedAt: '2026-09-01T09:30:00.000Z',
}

const wrongRecord: WrongQuestionRecord = {
  id: 'wrong-question:PROFILE_A:QUESTION_A',
  profileId: 'PROFILE_A',
  questionId: 'QUESTION_A',
  knowledgePointIds: ['KP_A'],
  firstWrongAt: '2026-09-01T09:12:00.000Z',
  lastWrongAt: '2026-09-01T09:12:00.000Z',
  wrongCount: 1,
  status: 'resolved',
  resolvedAt: '2026-09-01T09:31:00.000Z',
  source: { questionSessionIds: [questionSession.id] },
  provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
  textbookId: 'TEXTBOOK_A',
  unitId: 'UNIT_A',
  lessonId: 'LESSON_A',
}

const masteredRecord: MasteryRecord = {
  studentProfileId: 'PROFILE_A',
  knowledgePointId: 'KP_A',
  masteryScore: 90,
  confidence: 0.8,
  state: 'mastered',
  evidenceCount: 3,
  correctEvidenceCount: 3,
  incorrectEvidenceCount: 0,
  lastEvidenceAt: '2026-09-01T09:20:00.000Z',
  updatedAt: '2026-09-01T09:20:00.000Z',
  version: 3,
  algorithmVersion: 'MASTERY_V1',
  isSampleDerived: false,
  evidenceSourceStatus: 'VERIFIED',
}

function rewardEvent(
  id: string,
  profileId: string,
  energy: number,
  occurredAt: string,
  isSampleDerived = false,
): RewardEvent {
  return {
    id,
    profileId,
    type: 'lesson_completed',
    sourceId: id,
    occurredAt,
    reward: { knowledgeEnergy: energy },
    provenance: {
      isSampleDerived,
      ...(isSampleDerived
        ? { verificationStatus: 'SAMPLE' as const }
        : { verificationStatus: 'VERIFIED' as const }),
    },
  }
}

describe('PHASE 13.1 Reward Event Domain', () => {
  it('projects every completed learning source with fixed grants and stable IDs', () => {
    const repository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    const projection = new RewardProjectionService(repository)
    const service = new RewardService(repository, projection)

    expect(
      service.processLearningFact(
        'PROFILE_A',
        { type: 'lesson_completed', session: lessonSession },
        { verificationStatus: 'VERIFIED' },
      ),
    ).toEqual(
      expect.objectContaining({
        created: true,
        event: expect.objectContaining({
          id: buildRewardEventId('PROFILE_A', 'lesson_completed', lessonSession.id),
          reward: { knowledgeEnergy: 10 },
        }),
      }),
    )
    expect(
      service.processLearningFact(
        'PROFILE_A',
        { type: 'assessment_completed', session: questionSession },
        { verificationStatus: 'VERIFIED' },
      ).event?.reward,
    ).toEqual({ knowledgeEnergy: 5 })
    expect(
      service.processLearningFact(
        'PROFILE_A',
        {
          type: 'knowledge_mastered',
          transition: { next: masteredRecord, previous: { ...masteredRecord, state: 'learning' } },
        },
        { verificationStatus: 'VERIFIED' },
      ).event?.sourceId,
    ).toBe(buildMasteryRewardSourceId(masteredRecord))
    expect(
      service.processLearningFact('PROFILE_A', { type: 'review_completed', item: reviewItem }).event
        ?.reward,
    ).toEqual({ knowledgeEnergy: 8 })
    expect(
      service.processLearningFact('PROFILE_A', {
        type: 'wrong_question_resolved',
        record: wrongRecord,
      }).event?.reward,
    ).toEqual({ knowledgeEnergy: 6 })
    expect(repository.listByProfile('PROFILE_A')).toHaveLength(5)
  })

  it('does not reward unfinished sources or a mastered-to-mastered rebuild', () => {
    const repository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    const projection = new RewardProjectionService(repository)
    const incomplete = projection.projectLearningFact('PROFILE_A', {
      type: 'lesson_completed',
      session: { ...lessonSession, status: 'in_progress' },
    })
    expect(incomplete.event).toBeNull()
    const rebuilt = projection.projectLearningFact('PROFILE_A', {
      type: 'knowledge_mastered',
      transition: { next: masteredRecord, previous: masteredRecord },
    })
    expect(rebuilt.event).toBeNull()
  })

  it('is idempotent, profile-isolated, sample-aware, and guarded in profile mode', () => {
    const repository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    const projection = new RewardProjectionService(repository)
    const first = projection.projectLearningFact(
      'PROFILE_A',
      { type: 'lesson_completed', session: lessonSession },
      { dataset: 'profile', verificationStatus: 'VERIFIED' },
    )
    const second = projection.projectLearningFact(
      'PROFILE_A',
      { type: 'lesson_completed', session: lessonSession },
      { dataset: 'profile', verificationStatus: 'VERIFIED' },
    )
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(repository.listByProfile('PROFILE_A')).toHaveLength(1)

    const blocked = projection.projectLearningFact(
      'PROFILE_B',
      { type: 'lesson_completed', session: lessonSession },
      { dataset: 'profile', isSampleDerived: true, verificationStatus: 'SAMPLE' },
    )
    expect(blocked.event).toBeNull()
    expect(blocked.diagnostics[0]).toContain('SOURCE_NOT_ALLOWED')
    const sample = projection.projectLearningFact(
      'PROFILE_B',
      { type: 'lesson_completed', session: lessonSession },
      { dataset: 'demo', isSampleDerived: true, verificationStatus: 'SAMPLE' },
    )
    expect(sample.event?.provenance).toEqual({
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    expect(repository.listByProfile('PROFILE_A')).toHaveLength(1)
    expect(repository.listByProfile('PROFILE_B', { includeSample: false })).toHaveLength(0)
    expect(repository.listByProfile('PROFILE_B', { includeSample: true })).toHaveLength(1)
  })

  it('preserves malformed versioned reward storage without throwing or overwriting', () => {
    const raw = memoryStorage()
    const storage = createRewardEventStorage(raw)
    raw.setItem('knowledge-island.reward-events', '{broken')
    expect(storage.load()).toEqual({ schemaVersion: 1, events: [] })
    expect(storage.getLastWarning()).toContain('损坏')
    expect(raw.getItem('knowledge-island.reward-events')).toBe('{broken')
    storage.save({ schemaVersion: 1, events: [] })
    expect(raw.getItem('knowledge-island.reward-events')).toBe('{broken')
  })
})

describe('PHASE 13.2 KnowledgeEnergy and Growth', () => {
  it('rebuilds energy from RewardEvents and computes deterministic level progress', () => {
    const rewardRepository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    rewardRepository.append(rewardEvent('event-a', 'PROFILE_A', 50, '2026-09-01T10:00:00.000Z'))
    rewardRepository.append(rewardEvent('event-b', 'PROFILE_A', 30, '2026-09-01T11:00:00.000Z'))
    rewardRepository.append(
      rewardEvent('event-other', 'PROFILE_B', 500, '2026-09-01T12:00:00.000Z'),
    )
    const service = createGrowthService({
      rewardRepository,
      energyStorage: createKnowledgeEnergyStorage(memoryStorage()),
      growthStorage: createGrowthStorage(memoryStorage()),
    })
    const summary = service.getSummary('PROFILE_A')
    expect(summary.energy.totalEarned).toBe(80)
    expect(summary.energy.current).toBe(80)
    expect(summary.growth.growthLevel).toBe(2)
    expect(summary.growth.progressToNextLevel).toBe(42.86)
    expect(summary.energy.updatedAt).toBe('2026-09-01T11:00:00.000Z')
    expect(service.getSummary('PROFILE_B').energy.totalEarned).toBe(500)
    expect(service.getSummary('PROFILE_A').energy.totalEarned).toBe(80)
  })

  it('deduplicates events, isolates sample energy, and handles threshold boundaries', () => {
    const rewardRepository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    const sample = rewardEvent('sample', 'PROFILE_A', 50, '2026-09-01T10:00:00.000Z', true)
    rewardRepository.append(sample)
    rewardRepository.append(sample)
    const formal = rewardEvent('formal', 'PROFILE_A', 50, '2026-09-01T11:00:00.000Z')
    rewardRepository.append(formal)
    const service = createGrowthService({
      rewardRepository,
      energyStorage: createKnowledgeEnergyStorage(memoryStorage()),
      growthStorage: createGrowthStorage(memoryStorage()),
    })
    expect(service.getSummary('PROFILE_A').energy.totalEarned).toBe(50)
    const demo = service.getSummary('PROFILE_A', { dataset: 'demo' })
    expect(demo.energy.totalEarned).toBe(100)
    expect(demo.energy.provenance.isSampleDerived).toBe(true)
    expect(growthLevelForEnergy(0).level).toBe(1)
    expect(growthLevelForEnergy(50).level).toBe(2)
    expect(growthLevelForEnergy(120).level).toBe(3)
    expect(growthLevelForEnergy(999).progress).toBe(100)
  })

  it('keeps snapshot corruption recoverable because RewardEvents remain authoritative', () => {
    const rewardRepository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    rewardRepository.append(rewardEvent('event-a', 'PROFILE_A', 10, '2026-09-01T10:00:00.000Z'))
    const energyRaw = memoryStorage()
    energyRaw.setItem('knowledge-island.knowledge-energy', '{broken')
    const service = createGrowthService({
      rewardRepository,
      energyStorage: createKnowledgeEnergyStorage(energyRaw),
      growthStorage: createGrowthStorage(memoryStorage()),
    })
    expect(service.rebuildKnowledgeEnergy('PROFILE_A').current).toBe(10)
    expect(service.getLastWarning()).toContain('损坏')
  })
})

describe('PHASE 13.3 Achievement and Milestones', () => {
  function createAchievementFixture() {
    const historyRepository = createLearningHistoryRepository(
      createLearningHistoryStorage(memoryStorage()),
    )
    const wrongRepository = createWrongBookRepository(createWrongBookStorage(memoryStorage()))
    const reviewRepository = createReviewQueueRepository(createReviewQueueStorage(memoryStorage()))
    const rewardRepository = createRewardEventRepository(createRewardEventStorage(memoryStorage()))
    const growth = createGrowthService({
      rewardRepository,
      energyStorage: createKnowledgeEnergyStorage(memoryStorage()),
      growthStorage: createGrowthStorage(memoryStorage()),
    })
    const mastery = {
      getMasteryRecords: () => [masteredRecord],
    } as unknown as MasteryRepository
    const service = new AchievementService({
      repository: createAchievementRepository(createAchievementStorage(memoryStorage())),
      historyService: new LearningHistoryService(historyRepository),
      masteryRepository: mastery,
      reviewQueueService: new ReviewQueueService(reviewRepository),
      wrongBookService: new WrongBookService(wrongRepository),
      growthService: growth,
      definitions: getAchievementDefinitions(),
    })
    return { historyRepository, wrongRepository, reviewRepository, rewardRepository, service }
  }

  it('evaluates completed facts, unlocks deterministically, and persists idempotently', () => {
    const fixture = createAchievementFixture()
    fixture.historyRepository.append({
      id: 'history:lesson',
      profileId: 'PROFILE_A',
      type: 'lesson_completed',
      textbookId: 'TEXTBOOK_A',
      unitId: 'UNIT_A',
      lessonId: 'LESSON_A',
      knowledgePointId: 'KP_A',
      sourceId: 'LESSON_SESSION_A',
      occurredAt: '2026-09-01T09:10:00.000Z',
      provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
    })
    fixture.historyRepository.append({
      id: 'history:assessment',
      profileId: 'PROFILE_A',
      type: 'assessment_completed',
      textbookId: 'TEXTBOOK_A',
      unitId: 'UNIT_A',
      lessonId: 'LESSON_A',
      knowledgePointId: 'KP_A',
      sourceId: 'ASSESSMENT_SESSION_A',
      occurredAt: '2026-09-01T09:12:00.000Z',
      summary: {
        questionCount: 1,
        correctCount: 0,
        incorrectCount: 1,
        manualReviewCount: 0,
        assessmentPercentage: 0,
      },
      provenance: { isSampleDerived: false, verificationStatus: 'VERIFIED' },
    })
    fixture.wrongRepository.upsertWrong({
      profileId: 'PROFILE_A',
      questionId: 'QUESTION_A',
      knowledgePointIds: ['KP_A'],
      wrongAt: '2026-09-01T09:12:00.000Z',
      questionSessionId: 'ASSESSMENT_SESSION_A',
      isSampleDerived: false,
      verificationStatus: 'VERIFIED',
      textbookId: 'TEXTBOOK_A',
    })
    fixture.wrongRepository.markResolved('PROFILE_A', 'QUESTION_A', '2026-09-01T09:31:00.000Z')
    fixture.reviewRepository.upsert(reviewItem)
    fixture.rewardRepository.append(
      rewardEvent('energy-a', 'PROFILE_A', 50, '2026-09-01T09:40:00.000Z'),
    )

    const first = fixture.service.evaluate('PROFILE_A', { now: '2026-09-01T10:00:00.000Z' })
    expect(first.facts).toEqual(
      expect.objectContaining({
        lessonCompletedCount: 1,
        assessmentCompletedCount: 1,
        knowledgeMasteredCount: 1,
        wrongQuestionResolvedCount: 1,
        reviewCompletedCount: 1,
        knowledgeEnergy: 50,
      }),
    )
    expect(first.progress.filter((item) => item.status === 'unlocked')).toHaveLength(6)
    const second = fixture.service.evaluate('PROFILE_A', { now: '2026-09-01T11:00:00.000Z' })
    expect(second.unlocks).toHaveLength(0)
    expect(fixture.service.listUnlocks('PROFILE_A')).toHaveLength(6)
  })

  it('does not let SAMPLE facts unlock formal progress', () => {
    const fixture = createAchievementFixture()
    fixture.historyRepository.append({
      id: 'sample-history:lesson',
      profileId: 'PROFILE_A',
      type: 'lesson_completed',
      textbookId: 'TEXTBOOK_A',
      unitId: 'UNIT_A',
      lessonId: 'LESSON_A',
      knowledgePointId: 'KP_A',
      sourceId: 'SAMPLE_SESSION',
      occurredAt: '2026-09-01T09:10:00.000Z',
      provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
    })
    fixture.rewardRepository.append(
      rewardEvent('sample-energy', 'PROFILE_A', 50, '2026-09-01T09:20:00.000Z', true),
    )
    expect(fixture.service.evaluate('PROFILE_A').facts.lessonCompletedCount).toBe(0)
    expect(fixture.service.evaluate('PROFILE_A').facts.knowledgeEnergy).toBe(0)
    const demo = fixture.service.evaluate('PROFILE_A', { dataset: 'demo' })
    expect(demo.facts.lessonCompletedCount).toBe(1)
    expect(demo.facts.knowledgeEnergy).toBe(50)
    expect(demo.facts.provenance.isSampleDerived).toBe(true)
  })

  it('uses a small fixed deterministic definition set without forbidden economy concepts', () => {
    const serialized = JSON.stringify(getAchievementDefinitions()).toLowerCase()
    expect(getAchievementDefinitions()).toHaveLength(7)
    for (const forbidden of [
      'coin',
      'diamond',
      'gem',
      'ticket',
      'item',
      'loot',
      'streak',
      'leaderboard',
      'nextreviewat',
      'decaystage',
    ]) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})
