import type {
  Id,
  KnowledgeMasteryViewModel,
  LearningEvidence,
  MasteryEngineInput,
  MasteryEngineResult,
  MasteryEvidenceSourceStatus,
  MasteryPolicy,
  MasteryRecord,
} from '@/types'

import { DEFAULT_MASTERY_POLICY } from './masteryPolicy'

const EPSILON = 0.000001
const DEFAULT_UPDATED_AT = '1970-01-01T00:00:00.000Z'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function difficultyWeight(evidence: LearningEvidence, policy: MasteryPolicy): number {
  return policy.difficultyWeights[evidence.questionDifficulty] ?? Number.NaN
}

function validEvidence(
  evidence: LearningEvidence,
  knowledgePointId: Id,
  policy: MasteryPolicy,
  diagnostics: string[],
): LearningEvidence | null {
  if (evidence.knowledgePointId !== knowledgePointId) {
    diagnostics.push(`MASTERY_EVIDENCE_KNOWLEDGE_POINT_MISMATCH: ${evidence.id}`)
    return null
  }
  if (evidence.outcome !== 'correct' && evidence.outcome !== 'incorrect') {
    diagnostics.push(`MASTERY_EVIDENCE_OUTCOME_INVALID: ${evidence.id}`)
    return null
  }
  if (
    !Number.isInteger(evidence.questionDifficulty) ||
    evidence.questionDifficulty < 1 ||
    evidence.questionDifficulty > 5
  ) {
    diagnostics.push(`MASTERY_EVIDENCE_DIFFICULTY_INVALID: ${evidence.id}`)
    return null
  }
  if (
    !Number.isFinite(evidence.knowledgeWeight) ||
    evidence.knowledgeWeight <= 0 ||
    evidence.knowledgeWeight > 1
  ) {
    diagnostics.push(`MASTERY_EVIDENCE_KNOWLEDGE_WEIGHT_INVALID: ${evidence.id}`)
    return null
  }
  const configuredDifficultyWeight = difficultyWeight(evidence, policy)
  if (!Number.isFinite(configuredDifficultyWeight) || configuredDifficultyWeight <= 0) {
    diagnostics.push(`MASTERY_EVIDENCE_DIFFICULTY_WEIGHT_INVALID: ${evidence.id}`)
    return null
  }
  if (!Number.isFinite(evidence.evidenceWeight) || evidence.evidenceWeight <= 0) {
    diagnostics.push(`MASTERY_EVIDENCE_WEIGHT_INVALID: ${evidence.id}`)
    return null
  }

  const expectedEvidenceWeight = evidence.knowledgeWeight * configuredDifficultyWeight
  if (Math.abs(expectedEvidenceWeight - evidence.evidenceWeight) > EPSILON) {
    diagnostics.push(`MASTERY_EVIDENCE_WEIGHT_RECALCULATED: ${evidence.id}`)
  }
  return evidence
}

export function resolveKnowledgeLearningState(
  evidenceCount: number,
  masteryScore: number,
  confidence: number,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
): MasteryRecord['state'] {
  if (evidenceCount <= 0) return 'not_started'
  if (masteryScore < policy.weakThreshold) return 'weak'
  if (
    masteryScore >= policy.masteredThreshold &&
    evidenceCount >= policy.minimumEvidenceForMastery &&
    confidence >= policy.minimumConfidenceForMastery
  ) {
    return 'mastered'
  }
  return 'learning'
}

/**
 * Pure weighted aggregation. It intentionally does not read the clock,
 * previous score, streaks, review dates, or any reward state.
 */
export function calculateMastery(input: MasteryEngineInput): MasteryEngineResult {
  const diagnostics: string[] = []
  const usableEvidence = input.evidence
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .filter((evidence) =>
      validEvidence(evidence, input.knowledgePointId, input.policy, diagnostics),
    )

  let effectiveEvidenceWeight = 0
  let weightedCorrect = 0
  let correctCount = 0
  let incorrectCount = 0

  for (const evidence of usableEvidence) {
    const weight = evidence.knowledgeWeight * difficultyWeight(evidence, input.policy)
    effectiveEvidenceWeight += weight
    if (evidence.outcome === 'correct') {
      correctCount += 1
      weightedCorrect += weight
    } else {
      incorrectCount += 1
    }
  }

  const masteryScore =
    effectiveEvidenceWeight > 0
      ? clamp((weightedCorrect / effectiveEvidenceWeight) * 100, 0, 100)
      : 0
  const confidence = clamp(effectiveEvidenceWeight / input.policy.confidenceEvidenceTarget, 0, 1)
  const state = resolveKnowledgeLearningState(
    usableEvidence.length,
    masteryScore,
    confidence,
    input.policy,
  )

  return {
    masteryScore,
    confidence,
    state,
    statistics: {
      evidenceCount: usableEvidence.length,
      correctCount,
      incorrectCount,
      effectiveEvidenceWeight,
    },
    diagnostics,
  }
}

function sourceStatusForEvidence(
  evidence: readonly LearningEvidence[],
): MasteryEvidenceSourceStatus {
  if (!evidence.length) return 'NONE'
  const statuses = new Set<MasteryEvidenceSourceStatus>()
  for (const item of evidence) {
    if (item.metadata?.isSample || item.metadata?.sourceVerificationStatus === 'SAMPLE') {
      statuses.add('SAMPLE')
      continue
    }
    const status = item.metadata?.sourceVerificationStatus
    if (status === 'REVIEWED') statuses.add('REVIEWED')
    else if (status === 'VERIFIED') statuses.add('VERIFIED')
    else statuses.add('UNVERIFIED')
  }
  if (statuses.size === 1) return [...statuses][0]
  return 'MIXED'
}

function latestEvidenceAt(evidence: readonly LearningEvidence[]): string | undefined {
  return evidence
    .slice()
    .sort(
      (left, right) =>
        right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id),
    )[0]?.occurredAt
}

export interface BuildMasteryRecordInput {
  studentProfileId: Id
  knowledgePointId: Id
  evidence: LearningEvidence[]
  policy?: MasteryPolicy
  previousRecord?: MasteryRecord
  updatedAt?: string
}

export function buildMasteryRecord(input: BuildMasteryRecordInput): MasteryRecord {
  const policy = input.policy ?? DEFAULT_MASTERY_POLICY
  const result = calculateMastery({
    knowledgePointId: input.knowledgePointId,
    evidence: input.evidence,
    previousRecord: input.previousRecord,
    policy,
  })
  const isSampleDerived = input.evidence.some(
    (evidence) =>
      evidence.metadata?.isSample === true ||
      evidence.metadata?.sourceVerificationStatus === 'SAMPLE',
  )
  return {
    studentProfileId: input.studentProfileId,
    knowledgePointId: input.knowledgePointId,
    masteryScore: result.masteryScore,
    confidence: result.confidence,
    state: result.state,
    evidenceCount: result.statistics.evidenceCount,
    correctEvidenceCount: result.statistics.correctCount,
    incorrectEvidenceCount: result.statistics.incorrectCount,
    ...(latestEvidenceAt(input.evidence)
      ? { lastEvidenceAt: latestEvidenceAt(input.evidence) }
      : {}),
    updatedAt: input.updatedAt ?? DEFAULT_UPDATED_AT,
    version: (input.previousRecord?.version ?? 0) + 1,
    algorithmVersion: policy.algorithmVersion,
    isSampleDerived,
    evidenceSourceStatus: sourceStatusForEvidence(input.evidence),
  }
}

export function toKnowledgeMasteryViewModel(
  knowledgePointId: Id,
  record: MasteryRecord | null | undefined,
): KnowledgeMasteryViewModel {
  return {
    knowledgePointId,
    score: record?.masteryScore ?? 0,
    confidence: record?.confidence ?? 0,
    state: record?.state ?? 'not_started',
    evidenceCount: record?.evidenceCount ?? 0,
    isSampleDerived: record?.isSampleDerived ?? false,
    evidenceSourceStatus: record?.evidenceSourceStatus ?? 'NONE',
  }
}

export function rebuildMasteryFromEvidence(
  studentProfileId: Id,
  knowledgePointId: Id,
  evidence: LearningEvidence[],
  previousRecord?: MasteryRecord,
  policy: MasteryPolicy = DEFAULT_MASTERY_POLICY,
  updatedAt = DEFAULT_UPDATED_AT,
): MasteryRecord {
  return buildMasteryRecord({
    studentProfileId,
    knowledgePointId,
    evidence,
    previousRecord,
    policy,
    updatedAt,
  })
}
