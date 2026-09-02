import type { LearningEvidence, MasteryRecord } from '@/types'

import { buildMasteryRecord } from '@/services/mastery/masteryEngine'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery/masteryPolicy'

export type MasteryShowcaseScenarioKey =
  'not_started' | 'weak' | 'learning' | 'mastered' | 'high_score_low_confidence' | 'mixed_sources'

export interface MasteryShowcaseScenario {
  key: MasteryShowcaseScenarioKey
  label: string
  description: string
  evidence: LearningEvidence[]
  record: MasteryRecord
}

const studentProfileId = 'dev-mastery-profile'
const knowledgePointId = 'DEMO_KP_01'
const updatedAt = '2026-09-02T00:00:00.000Z'

function makeEvidence(
  id: string,
  outcome: LearningEvidence['outcome'],
  index: number,
  metadata: LearningEvidence['metadata'] = { isSample: true, sourceVerificationStatus: 'SAMPLE' },
): LearningEvidence {
  return {
    id,
    type: 'question_attempt',
    studentProfileId,
    knowledgePointId,
    source: {
      questionId: `DEMO_SHOWCASE_QUESTION_${index}`,
      questionAttemptId: `DEMO_SHOWCASE_ATTEMPT_${index}`,
      assessmentId: 'DEMO_SHOWCASE_ASSESSMENT',
      questionSessionId: 'DEMO_SHOWCASE_SESSION',
    },
    outcome,
    questionDifficulty: 3,
    knowledgeWeight: 1,
    evidenceWeight: 1,
    occurredAt: `2026-09-0${Math.min(index, 9)}T00:00:00.000Z`,
    ...(metadata ? { metadata } : {}),
  }
}

function createScenario(
  key: MasteryShowcaseScenarioKey,
  label: string,
  description: string,
  evidence: LearningEvidence[],
): MasteryShowcaseScenario {
  return {
    key,
    label,
    description,
    evidence,
    record: buildMasteryRecord({
      studentProfileId,
      knowledgePointId,
      evidence,
      policy: DEFAULT_MASTERY_POLICY,
      updatedAt,
    }),
  }
}

export const masteryShowcaseScenarios: MasteryShowcaseScenario[] = [
  createScenario('not_started', '还没开始', '没有作答证据，掌握度从 0 开始。', []),
  createScenario('weak', '需要巩固', '三次有效作答都答错，分数低于巩固线。', [
    makeEvidence('DEMO_WEAK_01', 'incorrect', 1),
    makeEvidence('DEMO_WEAK_02', 'incorrect', 2),
    makeEvidence('DEMO_WEAK_03', 'incorrect', 3),
  ]),
  createScenario('learning', '正在掌握', '有正确也有错误证据，仍在形成稳定理解。', [
    makeEvidence('DEMO_LEARNING_01', 'correct', 1),
    makeEvidence('DEMO_LEARNING_02', 'correct', 2),
    makeEvidence('DEMO_LEARNING_03', 'incorrect', 3),
  ]),
  createScenario('mastered', '已经掌握', '至少三条证据、分数达到掌握线且置信度足够。', [
    makeEvidence('DEMO_MASTERED_01', 'correct', 1),
    makeEvidence('DEMO_MASTERED_02', 'correct', 2),
    makeEvidence('DEMO_MASTERED_03', 'correct', 3),
    makeEvidence('DEMO_MASTERED_04', 'correct', 4),
    makeEvidence('DEMO_MASTERED_05', 'correct', 5),
  ]),
  createScenario(
    'high_score_low_confidence',
    '高分但证据少',
    '一次答对不等于已经掌握，证据数量和置信度仍不足。',
    [makeEvidence('DEMO_LOW_CONFIDENCE_01', 'correct', 1)],
  ),
  createScenario(
    'mixed_sources',
    '来源混合',
    '同时含开发样本与已审核来源，记录会显式标记 MIXED。',
    [
      makeEvidence('DEMO_MIXED_01', 'correct', 1),
      makeEvidence('DEMO_MIXED_02', 'correct', 2),
      makeEvidence('DEMO_MIXED_03', 'incorrect', 3),
      makeEvidence('DEMO_MIXED_04', 'correct', 4, { sourceVerificationStatus: 'REVIEWED' }),
    ],
  ),
]

export const masteryShowcaseKnowledgePoint = {
  id: knowledgePointId,
  name: '演示知识点 · 掌握度验证',
}
