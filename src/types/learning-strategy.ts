import type { Id, VerificationStatus } from './domain'
import type {
  LearningEvidence,
  KnowledgeLearningState,
  MasteryEvidenceSourceStatus,
  MasteryPolicy,
  MasteryRecord,
} from './mastery'
import type { LearningMapProgressRecord, LearningNodeStatus } from './learning-map'
import type { QuestionAttempt } from './question-engine'

/** Strategy rules have their own version namespace and never replace MASTERY_V1. */
export const STRATEGY_VERSION = 'STRATEGY_V1' as const

export type StrategyRecommendationType =
  | 'CONTINUE_CURRENT'
  | 'REINFORCE'
  | 'GATHER_MORE_EVIDENCE'
  | 'PROCEED_TO_NEXT'
  | 'NO_RECOMMENDATION'

export type RecommendationReasonCode =
  | 'WEAK_MASTERY'
  | 'LOW_CONFIDENCE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'MASTERED'
  | 'CURRENT_KNOWLEDGE_POINT'
  | 'NEXT_AVAILABLE_KNOWLEDGE_POINT'
  | 'PREREQUISITE_LOCKED'
  | 'NO_AVAILABLE_KNOWLEDGE_POINT'
  | 'SOURCE_NOT_ALLOWED'
  | 'KNOWLEDGE_POINT_NOT_FOUND'
  | 'MASTERY_RECORD_NOT_FOUND'

/**
 * A presentation-safe map node used by the strategy layer. It is deliberately
 * smaller than KnowledgeMapNode so strategy code cannot write layout fields.
 */
export interface StrategyMapNode {
  id: Id
  knowledgePointId: Id
  status: LearningNodeStatus
  progress?: number
  textbookId?: Id
  title?: string
  unitId?: Id
  lessonId?: Id
  mapNodeId?: Id
  sort?: number
  order?: number
  prerequisites?: readonly Id[]
  prerequisiteKnowledgePointIds?: readonly Id[]
  prerequisiteNodeIds?: readonly Id[]
  isSample?: boolean
  needsVerification?: boolean
  verificationStatus?: VerificationStatus
}

/**
 * Strategy reads either the curriculum relation shape or its map projection.
 * The aliases keep the adapter boundary explicit without creating a second
 * prerequisite model.
 */
export interface KnowledgeRelation {
  id: Id
  sourceKnowledgePointId?: Id
  targetKnowledgePointId?: Id
  source?: Id
  target?: Id
  prerequisiteKnowledgePointId?: Id
  dependentKnowledgePointId?: Id
  relationType: 'prerequisite' | 'related' | 'advanced' | 'REQUIRED' | 'RECOMMENDED'
  textbookId?: Id
  isSample?: boolean
  needsVerification?: boolean
  verificationStatus?: VerificationStatus
}

export interface ReinforcementReason {
  code: RecommendationReasonCode
  masteryScore: number
  confidence: number
  evidenceCount: number
  title: string
  description: string
}

export interface ReviewRecommendation {
  strategyVersion: string
  studentProfileId: Id
  knowledgePointId: Id
  mapNodeId?: Id
  type: 'REINFORCE' | 'GATHER_MORE_EVIDENCE'
  priority: number
  reason: ReinforcementReason
  isSampleDerived: boolean
  evidenceSourceStatus: MasteryEvidenceSourceStatus
}

export interface NextKnowledgePoint {
  knowledgePointId: Id
  mapNodeId?: Id
  title?: string
  currentStatus: LearningNodeStatus
  masteryState: KnowledgeLearningState
  reason: ReinforcementReason
}

export interface LearningRecommendation {
  strategyVersion: string
  studentProfileId: Id
  type: StrategyRecommendationType
  nextKnowledgePoint?: NextKnowledgePoint
  reviewRecommendations: ReviewRecommendation[]
  diagnostics: string[]
  isSampleDerived: boolean
  warning?: string
  /** The reason is useful for an empty state and remains optional for compatibility. */
  reason?: ReinforcementReason
}

export interface LearningStrategyInput {
  studentProfileId: Id
  currentTextbookId?: Id
  currentMapNodeId?: Id
  currentKnowledgePointId?: Id
  masteryRecords: readonly MasteryRecord[]
  mapNodes: readonly StrategyMapNode[]
  knowledgeRelations: readonly KnowledgeRelation[]
  learningMapProgress?: readonly LearningMapProgressRecord[]
  learningEvidence?: readonly LearningEvidence[]
  questionHistory?: readonly QuestionAttempt[]
  dataset: 'profile' | 'golden' | 'demo'
  strategyVersion?: string
}

export interface LearningStrategyOptions {
  limit?: number
  reviewLimit?: number
  policy?: MasteryPolicy
}
