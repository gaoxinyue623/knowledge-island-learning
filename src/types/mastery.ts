import type {
  DifficultyLevel,
  Id,
  VerificationStatus,
  Question,
  QuestionKnowledgePoint,
} from './domain'
import type { QuestionAttempt, QuestionSession } from './question-engine'

export type LearningEvidenceType = 'question_attempt'
export type LearningEvidenceOutcome = 'correct' | 'incorrect'

export interface LearningEvidenceSource {
  questionId: Id
  questionAttemptId?: Id
  assessmentId?: Id
  questionSessionId?: Id
}

export interface LearningEvidenceMetadata {
  sourceVerificationStatus?: VerificationStatus
  isSample?: boolean
  questionVersion?: number
}

export interface LearningEvidence {
  id: Id
  type: LearningEvidenceType
  studentProfileId: Id
  knowledgePointId: Id
  source: LearningEvidenceSource
  outcome: LearningEvidenceOutcome
  /** Normalized difficulty rank: FOUNDATION=1, STANDARD=3, ADVANCED=5. */
  questionDifficulty: number
  knowledgeWeight: number
  evidenceWeight: number
  occurredAt: string
  metadata?: LearningEvidenceMetadata
}

export type KnowledgeLearningState = 'not_started' | 'learning' | 'weak' | 'mastered'

export type MasteryEvidenceSourceStatus =
  'NONE' | 'SAMPLE' | 'UNVERIFIED' | 'VERIFIED' | 'REVIEWED' | 'MIXED'

export interface MasteryRecord {
  studentProfileId: Id
  knowledgePointId: Id
  masteryScore: number
  confidence: number
  state: KnowledgeLearningState
  evidenceCount: number
  correctEvidenceCount: number
  incorrectEvidenceCount: number
  lastEvidenceAt?: string
  updatedAt: string
  version: number
  algorithmVersion: string
  isSampleDerived: boolean
  evidenceSourceStatus: MasteryEvidenceSourceStatus
}

export interface MasteryPolicy {
  weakThreshold: number
  masteredThreshold: number
  minimumEvidenceForMastery: number
  minimumConfidenceForMastery: number
  confidenceEvidenceTarget: number
  difficultyWeights: Readonly<Record<number, number>>
  algorithmVersion: string
}

export interface MasteryEngineInput {
  knowledgePointId: Id
  evidence: LearningEvidence[]
  previousRecord?: MasteryRecord
  policy: MasteryPolicy
}

export interface MasteryEngineStatistics {
  evidenceCount: number
  correctCount: number
  incorrectCount: number
  effectiveEvidenceWeight: number
}

export interface MasteryEngineResult {
  masteryScore: number
  confidence: number
  state: KnowledgeLearningState
  statistics: MasteryEngineStatistics
  diagnostics: string[]
}

export interface KnowledgeMasteryViewModel {
  knowledgePointId: Id
  score: number
  confidence: number
  state: KnowledgeLearningState
  evidenceCount: number
  isSampleDerived: boolean
  evidenceSourceStatus: MasteryEvidenceSourceStatus
}

export interface LearningEvidenceExtractionResult {
  evidence: LearningEvidence[]
  diagnostics: string[]
}

export interface LearningEvidenceExtractionInput {
  studentProfileId: Id
  session: QuestionSession
  attempts: QuestionAttempt[]
  questions: Question[]
  mappings: QuestionKnowledgePoint[]
  policy: MasteryPolicy
}

export type QuestionDifficultyRank = 1 | 3 | 5

export const QUESTION_DIFFICULTY_RANK: Record<DifficultyLevel, QuestionDifficultyRank> = {
  FOUNDATION: 1,
  STANDARD: 3,
  ADVANCED: 5,
}
