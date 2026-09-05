import { demoAssessmentContext, demoAssessmentDefinition } from '@/data/question-engine'
import { phase12DemoReviewQueueRecommendation } from '@/data/review-queue'
import type {
  LearningRecommendation,
  LessonSession,
  QuestionSession,
  StudentCurriculumProfile,
} from '@/types'

export const phase14DemoProfileId = 'local-profile'
export const phase14DemoTextbookId = 'DEMO_TEXTBOOK_MATH_G3_S1'

export const phase14DemoProfile: StudentCurriculumProfile = {
  studentId: phase14DemoProfileId,
  regionId: 'SAMPLE_REGION_A',
  gradeId: 'SAMPLE_GRADE_3',
  semesterId: 'SAMPLE_SEMESTER_UPPER',
  chineseTextbookVersionId: null,
  mathTextbookVersionId: phase14DemoTextbookId,
  englishTextbookVersionId: null,
  confirmedAt: '2026-09-01T08:00:00.000Z',
  source: 'SYSTEM_RECOMMENDED',
}

export const phase14DemoLessonSession: LessonSession = {
  id: `lesson-session:${phase14DemoProfileId}:${phase14DemoTextbookId}:DEMO_UNIT_01:DEMO_LESSON_1_1:DEMO_KP_01`,
  textbookId: phase14DemoTextbookId,
  unitId: 'DEMO_UNIT_01',
  lessonId: 'DEMO_LESSON_1_1',
  knowledgePointId: 'DEMO_KP_01',
  status: 'in_progress',
  currentStepIndex: 1,
  completedStepIds: ['DEMO_STEP_01'],
  startedAt: '2026-09-03T09:00:00.000Z',
  updatedAt: '2026-09-03T09:08:00.000Z',
}

export const phase14DemoQuestionSession: QuestionSession = {
  id: `question-session:${phase14DemoProfileId}:PHASE14_DEMO_ASSESSMENT`,
  assessmentId: demoAssessmentDefinition.id,
  textbookId: demoAssessmentContext.textbookId,
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
      submittedAt: '2026-09-03T09:12:00.000Z',
    },
    {
      questionId: 'DEMO_QUESTION_SHORT_ANSWER',
      answer: { type: 'shortAnswer', value: '我先写下一个示例回答。' },
      submitted: true,
      result: { status: 'manual_review_required', score: 0, maxScore: 0 },
      submittedAt: '2026-09-03T09:13:00.000Z',
    },
  ],
  startedAt: '2026-09-03T09:10:00.000Z',
  updatedAt: '2026-09-03T09:13:00.000Z',
  completedAt: '2026-09-03T09:13:00.000Z',
}

export const phase14DemoReviewRecommendation: LearningRecommendation = {
  ...phase12DemoReviewQueueRecommendation,
  studentProfileId: phase14DemoProfileId,
  reviewRecommendations: phase12DemoReviewQueueRecommendation.reviewRecommendations.map(
    (recommendation) => ({
      ...recommendation,
      studentProfileId: phase14DemoProfileId,
      knowledgePointId: 'DEMO_KP_01',
      mapNodeId: 'learning-map:DEMO_TEXTBOOK_MATH_G3_S1:knowledge:DEMO_LKP_01',
      isSampleDerived: true,
      evidenceSourceStatus: 'SAMPLE',
    }),
  ),
}
