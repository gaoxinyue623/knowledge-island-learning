import type { WrongQuestionRecord } from '@/types'

import {
  phase12DemoProfileId,
  phase12DemoQuestionSession,
  phase12DemoTextbookId,
} from '@/data/learning-history'

export const phase12DemoWrongQuestionRecord: WrongQuestionRecord = {
  id: `wrong-question:${phase12DemoProfileId}:DEMO_QUESTION_CALCULATION`,
  profileId: phase12DemoProfileId,
  questionId: 'DEMO_QUESTION_CALCULATION',
  knowledgePointIds: ['DEMO_KP_01'],
  firstWrongAt: '2026-08-20T09:12:00.000Z',
  lastWrongAt: '2026-08-20T09:12:00.000Z',
  wrongCount: 1,
  status: 'active',
  source: { questionSessionIds: [phase12DemoQuestionSession.id] },
  provenance: { isSampleDerived: true, verificationStatus: 'SAMPLE' },
  textbookId: phase12DemoTextbookId,
  textbookIds: [phase12DemoTextbookId],
  unitId: 'DEMO_UNIT_01',
  lessonId: 'DEMO_LESSON_1_1',
}

export const phase12DemoWrongBookRecords: WrongQuestionRecord[] = [phase12DemoWrongQuestionRecord]
