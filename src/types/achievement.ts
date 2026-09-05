import type { Id, VerificationStatus } from './domain'
import type { RewardDataset, RewardEventProvenance } from './reward'

export const ACHIEVEMENT_VERSION = 'ACHIEVEMENT_V1' as const

export type AchievementCategory = 'learning' | 'practice' | 'mastery' | 'review' | 'growth'

export type AchievementCondition =
  | { type: 'lesson_completed_count'; target: number }
  | { type: 'assessment_completed_count'; target: number }
  | { type: 'knowledge_mastered_count'; target: number }
  | { type: 'wrong_question_resolved_count'; target: number }
  | { type: 'review_completed_count'; target: number }
  | { type: 'knowledge_energy'; target: number }

export interface AchievementDefinition {
  id: Id
  code: string
  title: string
  description: string
  category: AchievementCategory
  condition: AchievementCondition
  iconKey: 'star' | 'book-open' | 'sparkles' | 'check-circle'
  sort: number
  version: string
}

export type AchievementProgressStatus = 'locked' | 'unlocked'

export interface AchievementProgress {
  definition: AchievementDefinition
  profileId: Id
  current: number
  target: number
  percentage: number
  status: AchievementProgressStatus
  unlockedAt?: string
  provenance: RewardEventProvenance
}

export interface AchievementUnlock {
  id: Id
  profileId: Id
  achievementId: Id
  unlockedAt: string
  provenance: RewardEventProvenance
}

export interface AchievementStoragePayload {
  schemaVersion: 1
  unlocks: AchievementUnlock[]
}

export interface AchievementListOptions {
  includeSample?: boolean
}

export interface AchievementRepository {
  listUnlocks(profileId: Id, options?: AchievementListOptions): AchievementUnlock[]
  getUnlock(
    profileId: Id,
    achievementId: Id,
    options?: AchievementListOptions,
  ): AchievementUnlock | null
  recordUnlock(unlock: AchievementUnlock): AchievementUnlock
  clearDemoAchievements(profileId?: Id): void
  getLastWarning(): string | null
}

export interface AchievementFacts {
  lessonCompletedCount: number
  assessmentCompletedCount: number
  knowledgeMasteredCount: number
  wrongQuestionResolvedCount: number
  reviewCompletedCount: number
  knowledgeEnergy: number
  lastOccurredAt?: string
  provenance: RewardEventProvenance
}

export interface AchievementEvaluationOptions {
  dataset?: RewardDataset
  includeSample?: boolean
  now?: string
  verificationStatus?: VerificationStatus
}

export interface AchievementEvaluationResult {
  facts: AchievementFacts
  progress: AchievementProgress[]
  unlocks: AchievementUnlock[]
  diagnostics: string[]
}
