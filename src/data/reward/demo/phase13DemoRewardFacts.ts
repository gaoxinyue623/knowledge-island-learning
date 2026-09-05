import type {
  MasteryRecord,
  RewardLearningFact,
  ReviewQueueItem,
  WrongQuestionRecord,
} from '@/types'

const TEXTBOOK_ID = 'DEMO_TEXTBOOK_MATH_G3_S1'
const UNIT_ID = 'DEMO_UNIT_01'
const LESSON_ID = 'DEMO_LESSON_1_1'
const KNOWLEDGE_POINT_ID = 'DEMO_KP_01'

const completedLessonFacts = [1, 2, 3, 4, 5].map((number) => ({
  type: 'lesson_completed' as const,
  session: {
    id: `PHASE13_DEMO_LESSON_SESSION_${number}`,
    textbookId: TEXTBOOK_ID,
    unitId: UNIT_ID,
    lessonId: LESSON_ID,
    knowledgePointId: KNOWLEDGE_POINT_ID,
    status: 'completed' as const,
    currentStepIndex: 7,
    completedStepIds: [`DEMO_STEP_${number}`],
    startedAt: `2026-08-${10 + number}T09:00:00.000Z`,
    updatedAt: `2026-08-${10 + number}T09:10:00.000Z`,
    completedAt: `2026-08-${10 + number}T09:10:00.000Z`,
  },
}))

const assessmentFact = {
  type: 'assessment_completed' as const,
  session: {
    id: 'PHASE13_DEMO_ASSESSMENT_SESSION',
    assessmentId: 'PHASE13_DEMO_ASSESSMENT',
    textbookId: TEXTBOOK_ID,
    unitId: UNIT_ID,
    lessonId: LESSON_ID,
    knowledgePointId: KNOWLEDGE_POINT_ID,
    questionIds: ['PHASE13_DEMO_QUESTION'],
    currentQuestionIndex: 0,
    status: 'completed' as const,
    attempts: [],
    startedAt: '2026-08-16T09:00:00.000Z',
    updatedAt: '2026-08-16T09:05:00.000Z',
    completedAt: '2026-08-16T09:05:00.000Z',
  },
}

function masteryFact(profileId: string): RewardLearningFact {
  const next: MasteryRecord = {
    studentProfileId: profileId,
    knowledgePointId: KNOWLEDGE_POINT_ID,
    masteryScore: 90,
    confidence: 0.8,
    state: 'mastered',
    evidenceCount: 3,
    correctEvidenceCount: 3,
    incorrectEvidenceCount: 0,
    lastEvidenceAt: '2026-08-17T09:05:00.000Z',
    updatedAt: '2026-08-17T09:05:00.000Z',
    version: 3,
    algorithmVersion: 'MASTERY_V1',
    isSampleDerived: true,
    evidenceSourceStatus: 'SAMPLE',
  }
  return {
    type: 'knowledge_mastered',
    transition: {
      previous: { ...next, state: 'learning', version: 2 },
      next,
    },
  }
}

function reviewFact(profileId: string): RewardLearningFact {
  const item: ReviewQueueItem = {
    id: 'phase13-demo-review-item',
    profileId,
    textbookId: TEXTBOOK_ID,
    knowledgePointId: KNOWLEDGE_POINT_ID,
    recommendationType: 'REINFORCE',
    priority: 1,
    reason: {
      code: 'WEAK_MASTERY',
      masteryScore: 35,
      confidence: 0.5,
      evidenceCount: 2,
      title: '再练一次',
      description: '把关键步骤再走一遍。',
    },
    reasonCode: 'WEAK_MASTERY',
    status: 'completed',
    sourceStrategyVersion: 'STRATEGY_V1',
    sourceRecommendationId: 'phase13-demo-recommendation',
    provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
    completedAt: '2026-08-18T09:05:00.000Z',
  }
  return { type: 'review_completed', item }
}

function wrongQuestionFact(profileId: string): RewardLearningFact {
  const record: WrongQuestionRecord = {
    id: `wrong-question:${profileId}:phase13-demo-question`,
    profileId,
    questionId: 'phase13-demo-question',
    knowledgePointIds: [KNOWLEDGE_POINT_ID],
    firstWrongAt: '2026-08-18T09:10:00.000Z',
    lastWrongAt: '2026-08-18T09:10:00.000Z',
    wrongCount: 1,
    status: 'resolved',
    resolvedAt: '2026-08-19T09:05:00.000Z',
    source: { questionSessionIds: ['phase13-demo-wrong-session'] },
    provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
    textbookId: TEXTBOOK_ID,
    unitId: UNIT_ID,
    lessonId: LESSON_ID,
  }
  return { type: 'wrong_question_resolved', record }
}

export function createPhase13DemoRewardFacts(profileId: string): RewardLearningFact[] {
  return [
    ...completedLessonFacts,
    assessmentFact,
    masteryFact(profileId),
    reviewFact(profileId),
    wrongQuestionFact(profileId),
  ]
}
