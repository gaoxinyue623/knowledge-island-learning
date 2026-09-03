import type {
  Id,
  LearningEvidence,
  LearningStrategyInput,
  MasteryRecord,
  StrategyMapNode,
} from '@/types'

const studentProfileId = 'sample-strategy-profile'
const textbookId = 'SAMPLE_STRATEGY_TEXTBOOK'

export interface StrategyShowcaseFixture {
  id:
    | 'SAMPLE_STRATEGY_WEAK'
    | 'SAMPLE_STRATEGY_MASTERED'
    | 'SAMPLE_STRATEGY_LOW_CONFIDENCE'
    | 'SAMPLE_STRATEGY_IN_PROGRESS'
    | 'SAMPLE_STRATEGY_LOCKED'
    | 'SAMPLE_STRATEGY_NO_AVAILABLE'
  label: string
  description: string
  isSample: true
  needsVerification: true
  verificationStatus: 'SAMPLE'
  input: LearningStrategyInput
}

const sampleStatus = {
  isSample: true,
  needsVerification: true,
  verificationStatus: 'SAMPLE' as const,
}

function mapNode(
  id: string,
  knowledgePointId: string,
  status: StrategyMapNode['status'],
  sort: number,
  title: string,
): StrategyMapNode {
  return {
    id,
    knowledgePointId,
    status,
    textbookId,
    title,
    sort,
    ...sampleStatus,
  }
}

const chainNodes: StrategyMapNode[] = [
  mapNode('SAMPLE_STRATEGY_NODE_A', 'SAMPLE_STRATEGY_KP_A', 'learning', 1, '认识数量关系'),
  mapNode('SAMPLE_STRATEGY_NODE_B', 'SAMPLE_STRATEGY_KP_B', 'available', 2, '练习加法方法'),
  mapNode('SAMPLE_STRATEGY_NODE_C', 'SAMPLE_STRATEGY_KP_C', 'locked', 3, '探索乘法联系'),
]

const chainRelations = [
  {
    id: 'SAMPLE_STRATEGY_RELATION_A_B',
    sourceKnowledgePointId: 'SAMPLE_STRATEGY_KP_A',
    targetKnowledgePointId: 'SAMPLE_STRATEGY_KP_B',
    relationType: 'prerequisite' as const,
    textbookId,
    ...sampleStatus,
  },
  {
    id: 'SAMPLE_STRATEGY_RELATION_B_C',
    sourceKnowledgePointId: 'SAMPLE_STRATEGY_KP_B',
    targetKnowledgePointId: 'SAMPLE_STRATEGY_KP_C',
    relationType: 'prerequisite' as const,
    textbookId,
    ...sampleStatus,
  },
]

function makeEvidence(
  knowledgePointId: Id,
  index: number,
  outcome: LearningEvidence['outcome'],
): LearningEvidence {
  return {
    id: `SAMPLE_STRATEGY_EVIDENCE_${knowledgePointId}_${index}`,
    type: 'question_attempt',
    studentProfileId,
    knowledgePointId,
    source: { questionId: `SAMPLE_STRATEGY_QUESTION_${knowledgePointId}_${index}` },
    outcome,
    questionDifficulty: 3,
    knowledgeWeight: 1,
    evidenceWeight: 1,
    occurredAt: `2026-08-${String(index).padStart(2, '0')}T00:00:00.000Z`,
    metadata: { isSample: true, sourceVerificationStatus: 'SAMPLE' },
  }
}

function makeRecord(
  knowledgePointId: Id,
  masteryScore: number,
  confidence: number,
  state: MasteryRecord['state'],
  evidenceCount: number,
): MasteryRecord {
  return {
    studentProfileId,
    knowledgePointId,
    masteryScore,
    confidence,
    state,
    evidenceCount,
    correctEvidenceCount: Math.round((masteryScore / 100) * evidenceCount),
    incorrectEvidenceCount: evidenceCount - Math.round((masteryScore / 100) * evidenceCount),
    updatedAt: '2026-08-31T00:00:00.000Z',
    version: 1,
    algorithmVersion: 'MASTERY_V1',
    isSampleDerived: true,
    evidenceSourceStatus: 'SAMPLE',
  }
}

function input(
  nodes: readonly StrategyMapNode[],
  records: readonly MasteryRecord[],
  currentMapNodeId: Id,
  evidence: readonly LearningEvidence[] = [],
): LearningStrategyInput {
  return {
    studentProfileId,
    currentTextbookId: textbookId,
    currentMapNodeId,
    masteryRecords: records,
    mapNodes: nodes,
    knowledgeRelations: chainRelations,
    learningEvidence: evidence,
    dataset: 'demo',
  }
}

const weakRecord = makeRecord('SAMPLE_STRATEGY_KP_A', 32, 0.8, 'weak', 3)
const masteredRecord = makeRecord('SAMPLE_STRATEGY_KP_A', 86, 0.9, 'mastered', 3)
const lowConfidenceRecord = makeRecord('SAMPLE_STRATEGY_KP_A', 55, 0.35, 'learning', 1)
const inProgressRecord = makeRecord('SAMPLE_STRATEGY_KP_A', 55, 0.8, 'learning', 2)

function fixture(
  id: StrategyShowcaseFixture['id'],
  label: string,
  description: string,
  fixtureInput: LearningStrategyInput,
): StrategyShowcaseFixture {
  return {
    id,
    label,
    description,
    isSample: true,
    needsVerification: true,
    verificationStatus: 'SAMPLE',
    input: fixtureInput,
  }
}

export const strategyShowcaseFixtures: StrategyShowcaseFixture[] = [
  fixture(
    'SAMPLE_STRATEGY_WEAK',
    '弱掌握',
    '32 分的知识点进入巩固建议。',
    input(
      chainNodes,
      [weakRecord],
      'SAMPLE_STRATEGY_NODE_A',
      [1, 2, 3].map((index) => makeEvidence('SAMPLE_STRATEGY_KP_A', index, 'incorrect')),
    ),
  ),
  fixture(
    'SAMPLE_STRATEGY_MASTERED',
    '已经掌握',
    '86 分、置信度 0.9 且有足够证据，不进入优先巩固列表。',
    input(
      chainNodes.map((node) =>
        node.id === 'SAMPLE_STRATEGY_NODE_A' ? { ...node, status: 'completed' as const } : node,
      ),
      [masteredRecord],
      'SAMPLE_STRATEGY_NODE_A',
      [1, 2, 3].map((index) => makeEvidence('SAMPLE_STRATEGY_KP_A', index, 'correct')),
    ),
  ),
  fixture(
    'SAMPLE_STRATEGY_LOW_CONFIDENCE',
    '高分低置信度',
    '55 分但置信度 0.35，建议补充作答证据。',
    input(
      chainNodes,
      [lowConfidenceRecord],
      'SAMPLE_STRATEGY_NODE_A',
      [1].map((index) => makeEvidence('SAMPLE_STRATEGY_KP_A', index, 'correct')),
    ),
  ),
  fixture(
    'SAMPLE_STRATEGY_IN_PROGRESS',
    '正在掌握',
    '分数处于学习区间，当前节点可以继续。',
    input(
      chainNodes,
      [inProgressRecord],
      'SAMPLE_STRATEGY_NODE_A',
      [1, 2].map((index) => makeEvidence('SAMPLE_STRATEGY_KP_A', index, 'correct')),
    ),
  ),
  fixture(
    'SAMPLE_STRATEGY_LOCKED',
    '前置条件锁定',
    '锁定节点不会因为掌握度或页面选择而自动解锁。',
    input(
      chainNodes.map((node) =>
        node.id === 'SAMPLE_STRATEGY_NODE_A'
          ? { ...node, status: 'completed' as const }
          : node.id === 'SAMPLE_STRATEGY_NODE_B'
            ? { ...node, status: 'locked' as const }
            : node,
      ),
      [makeRecord('SAMPLE_STRATEGY_KP_A', 86, 0.9, 'mastered', 3)],
      'SAMPLE_STRATEGY_NODE_B',
    ),
  ),
  fixture(
    'SAMPLE_STRATEGY_NO_AVAILABLE',
    '没有可推荐节点',
    '所有可用节点都已完成当前掌握条件时返回安全空状态。',
    input(
      chainNodes.map((node) => ({ ...node, status: 'completed' as const })),
      [
        makeRecord('SAMPLE_STRATEGY_KP_A', 86, 0.9, 'mastered', 3),
        makeRecord('SAMPLE_STRATEGY_KP_B', 86, 0.9, 'mastered', 3),
        makeRecord('SAMPLE_STRATEGY_KP_C', 86, 0.9, 'mastered', 3),
      ],
      'SAMPLE_STRATEGY_NODE_A',
    ),
  ),
]

export const strategyShowcaseUnverifiedInput: LearningStrategyInput = {
  ...strategyShowcaseFixtures[0].input,
  dataset: 'golden',
  masteryRecords: strategyShowcaseFixtures[0].input.masteryRecords.map((record) => ({
    ...record,
    isSampleDerived: false,
    evidenceSourceStatus: 'UNVERIFIED' as const,
  })),
  learningEvidence: (strategyShowcaseFixtures[0].input.learningEvidence ?? []).map((item) => ({
    ...item,
    metadata: { sourceVerificationStatus: 'UNVERIFIED' as const },
  })),
  mapNodes: strategyShowcaseFixtures[0].input.mapNodes.map((node) => ({
    ...node,
    isSample: false,
    needsVerification: true,
    verificationStatus: 'UNVERIFIED' as const,
  })),
  knowledgeRelations: chainRelations.map((relation) => ({
    ...relation,
    isSample: false,
    needsVerification: true,
    verificationStatus: 'UNVERIFIED' as const,
  })),
}
