export {
  phase14DemoProfile as phase15DemoProfile,
  phase14DemoProfileId as phase15DemoProfileId,
  phase14DemoTextbookId as phase15DemoTextbookId,
} from '@/data/home'

import {
  phase14DemoLessonSession,
  phase14DemoProfile,
  phase14DemoQuestionSession,
  phase14DemoTextbookId,
} from '@/data/home/demo'
import { phase12DemoReviewQueueRecommendation } from '@/data/review-queue'
import { createPhase13DemoRewardFacts } from '@/data/reward/demo'
import {
  projectLessonSessionToHistory,
  projectQuestionSessionToHistory,
} from '@/services/learning-history'
import type {
  AchievementUnlock,
  DailyLearningPlan,
  LearningEvidence,
  LearningHistoryRecord,
  MasteryRecord,
  ParentReportDemoFacts,
  RewardEvent,
  RewardLearningFact,
  ReviewQueueItem,
  WrongQuestionRecord,
} from '@/types'

const SAMPLE_PROVENANCE = { isSampleDerived: true, verificationStatus: 'SAMPLE' as const }

function completedLessonSession() {
  return {
    ...phase14DemoLessonSession,
    id: 'parent-report-demo-completed-lesson',
    status: 'completed' as const,
    completedStepIds: ['DEMO_STEP_01', 'DEMO_STEP_02', 'DEMO_STEP_03'],
    startedAt: '2026-09-02T09:00:00.000Z',
    updatedAt: '2026-09-02T09:08:00.000Z',
    completedAt: '2026-09-02T09:08:00.000Z',
  }
}

function factSourceId(fact: RewardLearningFact): string {
  switch (fact.type) {
    case 'lesson_completed':
    case 'assessment_completed':
      return fact.session.id
    case 'knowledge_mastered':
      return `mastery-transition:${fact.transition.next.knowledgePointId}:${fact.transition.next.algorithmVersion}`
    case 'review_completed':
      return fact.item.id
    case 'wrong_question_resolved':
      return fact.record.id
  }
}

function factTime(fact: RewardLearningFact): string {
  switch (fact.type) {
    case 'lesson_completed':
    case 'assessment_completed':
      return (
        fact.session.completedAt ??
        fact.session.updatedAt ??
        fact.session.startedAt ??
        '1970-01-01T00:00:00.000Z'
      )
    case 'knowledge_mastered':
      return (
        fact.transition.next.updatedAt ??
        fact.transition.next.lastEvidenceAt ??
        '1970-01-01T00:00:00.000Z'
      )
    case 'review_completed':
      return fact.item.completedAt ?? '1970-01-01T00:00:00.000Z'
    case 'wrong_question_resolved':
      return fact.record.resolvedAt ?? fact.record.lastWrongAt
  }
}

function energyForFact(fact: RewardLearningFact): number {
  switch (fact.type) {
    case 'lesson_completed':
      return 10
    case 'assessment_completed':
      return 5
    case 'knowledge_mastered':
      return 15
    case 'review_completed':
      return 8
    case 'wrong_question_resolved':
      return 6
  }
}

function rewardEvents(profileId: string, facts: readonly RewardLearningFact[]): RewardEvent[] {
  return facts.map((fact) => {
    const sourceId = factSourceId(fact)
    const textbookId =
      fact.type === 'lesson_completed' || fact.type === 'assessment_completed'
        ? fact.session.textbookId
        : fact.type === 'review_completed'
          ? fact.item.textbookId
          : fact.type === 'wrong_question_resolved'
            ? fact.record.textbookId
            : undefined
    const knowledgePointId =
      fact.type === 'knowledge_mastered'
        ? fact.transition.next.knowledgePointId
        : fact.type === 'lesson_completed' || fact.type === 'assessment_completed'
          ? fact.session.knowledgePointId
          : fact.type === 'review_completed'
            ? fact.item.knowledgePointId
            : fact.type === 'wrong_question_resolved'
              ? fact.record.knowledgePointIds[0]
              : undefined
    return {
      id: `reward:${profileId}:${fact.type}:${sourceId}`,
      profileId,
      type: fact.type,
      sourceId,
      ...(textbookId ? { textbookId } : {}),
      ...(knowledgePointId ? { knowledgePointId } : {}),
      occurredAt: factTime(fact),
      reward: { knowledgeEnergy: energyForFact(fact) },
      provenance: SAMPLE_PROVENANCE,
    }
  })
}

function historyFromFacts(
  profileId: string,
  facts: readonly RewardLearningFact[],
): LearningHistoryRecord[] {
  return facts.flatMap((fact) => {
    if (fact.type === 'lesson_completed') {
      return projectLessonSessionToHistory(profileId, fact.session, SAMPLE_PROVENANCE).records
    }
    if (fact.type === 'assessment_completed') {
      return projectQuestionSessionToHistory(profileId, fact.session, SAMPLE_PROVENANCE).records
    }
    return []
  })
}

function reviewItem(profileId: string): ReviewQueueItem {
  const recommendation = phase12DemoReviewQueueRecommendation.reviewRecommendations.find(
    (candidate) => candidate.type === 'REINFORCE' || candidate.type === 'GATHER_MORE_EVIDENCE',
  )
  return {
    id: `parent-report-demo-review:${profileId}`,
    profileId,
    textbookId: phase14DemoTextbookId,
    knowledgePointId: 'DEMO_KP_02',
    ...(recommendation?.mapNodeId ? { mapNodeId: recommendation.mapNodeId } : {}),
    recommendationType:
      recommendation?.type === 'GATHER_MORE_EVIDENCE' ? 'GATHER_MORE_EVIDENCE' : 'REINFORCE',
    priority: recommendation?.priority ?? 1,
    reason: recommendation?.reason ?? {
      code: 'WEAK_MASTERY',
      masteryScore: 35,
      confidence: 0.5,
      evidenceCount: 2,
      title: '需要巩固',
      description: '把关键步骤再走一遍。',
    },
    reasonCode: recommendation?.reason.code ?? 'WEAK_MASTERY',
    status: 'active',
    sourceStrategyVersion: recommendation?.strategyVersion ?? 'STRATEGY_V1',
    sourceRecommendationId: recommendation?.knowledgePointId ?? 'parent-report-demo-recommendation',
    provenance: SAMPLE_PROVENANCE,
  }
}

function masteryRecords(profileId: string): MasteryRecord[] {
  return [
    {
      studentProfileId: profileId,
      knowledgePointId: 'DEMO_KP_01',
      masteryScore: 90,
      confidence: 0.8,
      state: 'mastered',
      evidenceCount: 3,
      correctEvidenceCount: 3,
      incorrectEvidenceCount: 0,
      lastEvidenceAt: '2026-09-01T09:05:00.000Z',
      updatedAt: '2026-09-01T09:05:00.000Z',
      version: 3,
      algorithmVersion: 'MASTERY_V1',
      isSampleDerived: true,
      evidenceSourceStatus: 'SAMPLE',
    },
    {
      studentProfileId: profileId,
      knowledgePointId: 'DEMO_KP_02',
      masteryScore: 35,
      confidence: 0.5,
      state: 'weak',
      evidenceCount: 2,
      correctEvidenceCount: 0,
      incorrectEvidenceCount: 2,
      lastEvidenceAt: '2026-09-01T09:10:00.000Z',
      updatedAt: '2026-09-01T09:10:00.000Z',
      version: 2,
      algorithmVersion: 'MASTERY_V1',
      isSampleDerived: true,
      evidenceSourceStatus: 'SAMPLE',
    },
  ]
}

function wrongBookRecords(profileId: string): WrongQuestionRecord[] {
  return [
    {
      id: `parent-report-demo-wrong-active:${profileId}`,
      profileId,
      questionId: 'DEMO_QUESTION_CALCULATION',
      knowledgePointIds: ['DEMO_KP_02'],
      firstWrongAt: '2026-08-20T09:12:00.000Z',
      lastWrongAt: '2026-09-02T09:12:00.000Z',
      wrongCount: 2,
      status: 'active',
      source: { questionSessionIds: [phase14DemoQuestionSession.id] },
      provenance: SAMPLE_PROVENANCE,
      textbookId: phase14DemoTextbookId,
      textbookIds: [phase14DemoTextbookId],
      unitId: phase14DemoLessonSession.unitId,
      lessonId: phase14DemoLessonSession.lessonId,
    },
    {
      id: `parent-report-demo-wrong-resolved:${profileId}`,
      profileId,
      questionId: 'DEMO_QUESTION_SHORT_ANSWER',
      knowledgePointIds: ['DEMO_KP_01'],
      firstWrongAt: '2026-08-21T09:12:00.000Z',
      lastWrongAt: '2026-08-21T09:12:00.000Z',
      wrongCount: 1,
      status: 'resolved',
      resolvedAt: '2026-09-02T09:20:00.000Z',
      source: { questionSessionIds: [phase14DemoQuestionSession.id] },
      provenance: SAMPLE_PROVENANCE,
      textbookId: phase14DemoTextbookId,
      textbookIds: [phase14DemoTextbookId],
      unitId: phase14DemoLessonSession.unitId,
      lessonId: phase14DemoLessonSession.lessonId,
    },
  ]
}

function dailyPlan(profileId: string, activeReview: ReviewQueueItem): DailyLearningPlan {
  return {
    id: `parent-report-demo-plan:${profileId}`,
    profileId,
    dateKey: '2026-09-03',
    textbookContextKey: `MATH=${phase14DemoTextbookId}`,
    textbookIds: { CHINESE: null, MATH: phase14DemoTextbookId, ENGLISH: null },
    dataset: 'demo',
    tasks: [
      {
        id: `parent-report-demo-task:lesson:${profileId}`,
        profileId,
        type: 'continue_learning',
        subject: 'MATH',
        textbookId: phase14DemoTextbookId,
        lessonId: phase14DemoLessonSession.lessonId,
        knowledgePointId: 'DEMO_KP_01',
        sourceId: phase14DemoLessonSession.id,
        title: '继续探索数字世界',
        status: 'completed',
        priority: 1,
        action: { type: 'learning_map', knowledgePointId: 'DEMO_KP_01' },
      },
      {
        id: `parent-report-demo-task:review:${profileId}`,
        profileId,
        type: 'review',
        subject: 'MATH',
        textbookId: phase14DemoTextbookId,
        knowledgePointId: activeReview.knowledgePointId,
        sourceId: activeReview.id,
        title: '回看一个需要巩固的知识点',
        status: 'pending',
        priority: 2,
        action: { type: 'review_queue', reviewQueueItemId: activeReview.id },
      },
      {
        id: `parent-report-demo-task:wrong:${profileId}`,
        profileId,
        type: 'wrong_question',
        subject: 'MATH',
        textbookId: phase14DemoTextbookId,
        knowledgePointId: 'DEMO_KP_02',
        sourceId: `parent-report-demo-wrong-active:${profileId}`,
        title: '再挑战一道错题',
        status: 'pending',
        priority: 3,
        action: { type: 'wrong_question', wrongQuestionId: 'DEMO_QUESTION_CALCULATION' },
      },
    ],
    progress: { completed: 1, total: 3, percentage: 33.33 },
    status: 'in_progress',
    generatedAt: '2026-09-03T08:00:00.000Z',
    policyVersion: 'DAILY_PLAN_V1',
  }
}

export function createParentReportDemoFacts(
  profileId = phase14DemoProfile.studentId,
): ParentReportDemoFacts {
  const lesson = completedLessonSession()
  const rewardFacts = createPhase13DemoRewardFacts(profileId)
  const recentFacts: RewardLearningFact[] = [
    { type: 'lesson_completed', session: lesson },
    { type: 'assessment_completed', session: phase14DemoQuestionSession },
  ]
  const allFacts = [...rewardFacts, ...recentFacts]
  const activeReview = reviewItem(profileId)
  const completedReview = rewardFacts.find(
    (fact): fact is Extract<RewardLearningFact, { type: 'review_completed' }> =>
      fact.type === 'review_completed',
  )
  const completedReviewItem = completedReview
    ? { ...completedReview.item, profileId }
    : { ...activeReview, status: 'completed' as const, completedAt: '2026-09-01T09:05:00.000Z' }
  const unlocks: AchievementUnlock[] = [
    {
      id: `parent-report-demo-unlock:lesson:${profileId}`,
      profileId,
      achievementId: 'achievement:first-lesson',
      unlockedAt: '2026-09-02T09:08:00.000Z',
      provenance: SAMPLE_PROVENANCE,
    },
    {
      id: `parent-report-demo-unlock:assessment:${profileId}`,
      profileId,
      achievementId: 'achievement:first-assessment',
      unlockedAt: '2026-09-03T09:13:00.000Z',
      provenance: SAMPLE_PROVENANCE,
    },
  ]

  const history = historyFromFacts(profileId, allFacts)
  return {
    history,
    wrongBook: wrongBookRecords(profileId),
    reviewQueue: [activeReview, completedReviewItem],
    mastery: masteryRecords(profileId),
    evidence: [] as LearningEvidence[],
    rewards: rewardEvents(profileId, allFacts),
    unlocks,
    dailyPlans: [dailyPlan(profileId, activeReview)],
  }
}
