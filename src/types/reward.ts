import type { Id, VerificationStatus } from './domain'
import type { LessonSession } from './lesson-player'
import type { MasteryRecord } from './mastery'
import type { QuestionSession } from './question-engine'
import type { ReviewQueueItem } from './review-queue'
import type { WrongQuestionRecord } from './wrong-book'

export const REWARD_POLICY_VERSION = 'REWARD_V1' as const

export type RewardDataset = 'profile' | 'golden' | 'demo'

export type RewardEventType =
  | 'lesson_completed'
  | 'assessment_completed'
  | 'knowledge_mastered'
  | 'review_completed'
  | 'wrong_question_resolved'

export interface RewardGrant {
  knowledgeEnergy: number
}

export interface RewardEventProvenance {
  isSampleDerived: boolean
  verificationStatus?: VerificationStatus
}

export interface RewardEvent {
  id: Id
  profileId: Id
  type: RewardEventType
  sourceId: Id
  textbookId?: Id
  knowledgePointId?: Id
  occurredAt: string
  reward: RewardGrant
  provenance: RewardEventProvenance
}

export interface RewardEventStoragePayload {
  schemaVersion: 1
  events: RewardEvent[]
}

export interface RewardEventListOptions {
  includeSample?: boolean
  textbookId?: Id
}

export interface RewardPolicy {
  lessonCompletedEnergy: number
  assessmentCompletedEnergy: number
  knowledgeMasteredEnergy: number
  reviewCompletedEnergy: number
  wrongQuestionResolvedEnergy: number
  version: string
}

export const DEFAULT_REWARD_POLICY: RewardPolicy = {
  lessonCompletedEnergy: 10,
  assessmentCompletedEnergy: 5,
  knowledgeMasteredEnergy: 15,
  reviewCompletedEnergy: 8,
  wrongQuestionResolvedEnergy: 6,
  version: REWARD_POLICY_VERSION,
}

export interface RewardProjectionOptions {
  dataset?: RewardDataset
  isSampleDerived?: boolean
  verificationStatus?: VerificationStatus
}

export interface RewardProjectionResult {
  event: RewardEvent | null
  created: boolean
  diagnostics: string[]
}

export interface RewardProjectionBatchResult {
  events: RewardEvent[]
  diagnostics: string[]
}

export interface RewardMasteryTransition {
  previous?: MasteryRecord
  next: MasteryRecord
}

export type RewardLearningFact =
  | { type: 'lesson_completed'; session: LessonSession }
  | { type: 'assessment_completed'; session: QuestionSession }
  | { type: 'knowledge_mastered'; transition: RewardMasteryTransition }
  | { type: 'review_completed'; item: ReviewQueueItem }
  | { type: 'wrong_question_resolved'; record: WrongQuestionRecord }

export interface RewardEventRepository {
  append(event: RewardEvent): RewardEvent
  appendMany(events: readonly RewardEvent[]): RewardEvent[]
  listByProfile(profileId: Id, options?: RewardEventListOptions): RewardEvent[]
  listByType(profileId: Id, type: RewardEventType, options?: RewardEventListOptions): RewardEvent[]
  listByKnowledgePoint(
    profileId: Id,
    knowledgePointId: Id,
    options?: RewardEventListOptions,
  ): RewardEvent[]
  hasRewardForSource(profileId: Id, type: RewardEventType, sourceId: Id): boolean
  getBySource(profileId: Id, type: RewardEventType, sourceId: Id): RewardEvent | null
  clearDemoRewards(profileId?: Id): void
  getLastWarning(): string | null
}
