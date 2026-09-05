import { demoAssessmentContext, demoAssessmentDefinition } from '@/data/question-engine'
import type { LearningHistoryRecord, LessonSession, QuestionSession } from '@/types'

import {
  projectLessonSessionToHistory,
  projectQuestionSessionToHistory,
} from '@/services/learning-history'

export const phase12DemoProfileId = 'phase12-demo-profile'
export const phase12DemoTextbookId = demoAssessmentContext.textbookId

export const phase12DemoLessonSession: LessonSession = {
  id: 'phase12-demo-lesson-session',
  textbookId: phase12DemoTextbookId,
  unitId: demoAssessmentContext.unitId,
  lessonId: demoAssessmentContext.lessonId,
  knowledgePointId: demoAssessmentContext.knowledgePointId,
  status: 'completed',
  currentStepIndex: 2,
  completedStepIds: ['PHASE12_DEMO_STEP_01', 'PHASE12_DEMO_STEP_02', 'PHASE12_DEMO_STEP_03'],
  startedAt: '2026-08-20T09:00:00.000Z',
  updatedAt: '2026-08-20T09:08:00.000Z',
  completedAt: '2026-08-20T09:08:00.000Z',
}

export const phase12DemoQuestionSession: QuestionSession = {
  id: 'phase12-demo-question-session',
  assessmentId: demoAssessmentDefinition.id,
  textbookId: phase12DemoTextbookId,
  unitId: demoAssessmentContext.unitId,
  lessonId: demoAssessmentContext.lessonId,
  knowledgePointId: demoAssessmentContext.knowledgePointId,
  questionIds: ['DEMO_QUESTION_CALCULATION', 'DEMO_QUESTION_SHORT_ANSWER'],
  currentQuestionIndex: 1,
  status: 'completed',
  attempts: [
    {
      questionId: 'DEMO_QUESTION_CALCULATION',
      answer: { type: 'calculation', value: '0' },
      submitted: true,
      result: { status: 'incorrect', score: 0, maxScore: 1 },
      submittedAt: '2026-08-20T09:12:00.000Z',
    },
    {
      questionId: 'DEMO_QUESTION_SHORT_ANSWER',
      answer: { type: 'shortAnswer', value: '我会再检查一遍。' },
      submitted: true,
      result: { status: 'manual_review_required', score: 0, maxScore: 0 },
      submittedAt: '2026-08-20T09:13:00.000Z',
    },
  ],
  startedAt: '2026-08-20T09:10:00.000Z',
  updatedAt: '2026-08-20T09:13:00.000Z',
  completedAt: '2026-08-20T09:13:00.000Z',
}

const sampleOptions = {
  isSampleDerived: true,
  verificationStatus: 'SAMPLE' as const,
}

export const phase12DemoLearningHistoryRecords: LearningHistoryRecord[] = [
  ...projectLessonSessionToHistory(phase12DemoProfileId, phase12DemoLessonSession, sampleOptions)
    .records,
  ...projectQuestionSessionToHistory(
    phase12DemoProfileId,
    phase12DemoQuestionSession,
    sampleOptions,
  ).records,
]
