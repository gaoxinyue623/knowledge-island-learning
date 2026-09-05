import type { Id, VerificationStatus } from './domain'
import type {
  LearningRecommendation,
  RecommendationReasonCode,
  ReinforcementReason,
  StrategyRecommendationType,
} from './learning-strategy'

export type ReviewQueueRecommendationType = 'REINFORCE' | 'GATHER_MORE_EVIDENCE'
export type ReviewQueueItemStatus = 'active' | 'completed'

export interface ReviewQueueItem {
  id: Id
  profileId: Id
  textbookId: Id
  knowledgePointId: Id
  mapNodeId?: Id
  recommendationType: ReviewQueueRecommendationType
  priority: number
  reason: ReinforcementReason
  reasonCode: RecommendationReasonCode
  status: ReviewQueueItemStatus
  sourceStrategyVersion: string
  sourceRecommendationId: Id
  provenance: {
    isSampleDerived: boolean
    verificationStatus?: VerificationStatus
  }
  completedAt?: string
}

export interface ReviewQueueStoragePayload {
  schemaVersion: 1
  items: ReviewQueueItem[]
}

export interface ReviewQueueListOptions {
  includeCompleted?: boolean
  includeSample?: boolean
  textbookId?: Id
}

export interface ReviewQueueRepository {
  listByProfile(profileId: Id, options?: ReviewQueueListOptions): ReviewQueueItem[]
  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options?: Omit<ReviewQueueListOptions, 'textbookId'>,
  ): ReviewQueueItem[]
  get(profileId: Id, itemId: Id): ReviewQueueItem | null
  upsert(item: ReviewQueueItem): ReviewQueueItem
  complete(profileId: Id, itemId: Id, completedAt: string): ReviewQueueItem | null
  reopen(profileId: Id, itemId: Id): ReviewQueueItem | null
  clearDemoQueue(profileId?: Id): void
  getLastWarning(): string | null
}

export interface ReviewQueueProjectionOptions {
  profileId: Id
  textbookId: Id
  dataset?: 'profile' | 'golden' | 'demo'
  isSampleDerived?: boolean
  verificationStatus?: VerificationStatus
}

export interface ReviewQueueProjectionResult {
  items: ReviewQueueItem[]
  diagnostics: string[]
}

export type ReviewQueueSourceRecommendation = Pick<
  LearningRecommendation,
  'strategyVersion' | 'reviewRecommendations'
> & {
  type?: StrategyRecommendationType
}
