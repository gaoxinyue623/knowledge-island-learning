import type { Id } from './domain'
import type {
  RewardDataset,
  RewardEvent,
  RewardEventRepository,
  RewardEventProvenance,
} from './reward'

export const GROWTH_ALGORITHM_VERSION = 'GROWTH_V1' as const

export interface GrowthPolicy {
  thresholds: readonly number[]
  algorithmVersion: string
}

export const DEFAULT_GROWTH_POLICY: GrowthPolicy = {
  thresholds: [0, 50, 120, 220, 350],
  algorithmVersion: GROWTH_ALGORITHM_VERSION,
}

export interface KnowledgeEnergyBalance {
  profileId: Id
  totalEarned: number
  current: number
  updatedAt: string
  algorithmVersion: string
  provenance: RewardEventProvenance
}

export interface GrowthRecord {
  profileId: Id
  knowledgeEnergy: number
  growthLevel: number
  progressToNextLevel: number
  updatedAt: string
  algorithmVersion: string
  provenance: RewardEventProvenance
}

export interface GrowthSummary {
  profileId: Id
  energy: KnowledgeEnergyBalance
  growth: GrowthRecord
  currentLevelThreshold: number
  nextLevelThreshold?: number
}

export interface KnowledgeEnergyStoragePayload {
  schemaVersion: 1
  balances: KnowledgeEnergyBalance[]
}

export interface GrowthStoragePayload {
  schemaVersion: 1
  records: GrowthRecord[]
}

export interface GrowthOptions {
  dataset?: RewardDataset
  includeSample?: boolean
  now?: string
  policy?: GrowthPolicy
}

export interface GrowthServiceDependencies {
  rewardRepository: RewardEventRepository
  energyStorage: KnowledgeEnergyStorage
  growthStorage: GrowthStorage
}

export interface KnowledgeEnergyStorage {
  loadAll(): KnowledgeEnergyBalance[]
  saveAll(balances: readonly KnowledgeEnergyBalance[]): void
  clear(): void
  getLastWarning(): string | null
}

export interface GrowthStorage {
  loadAll(): GrowthRecord[]
  saveAll(records: readonly GrowthRecord[]): void
  clear(): void
  getLastWarning(): string | null
}

export interface GrowthRebuildResult {
  summary: GrowthSummary
  events: RewardEvent[]
  diagnostics: string[]
}

export interface GrowthServiceContract {
  rebuildKnowledgeEnergy(profileId: Id, options?: GrowthOptions): KnowledgeEnergyBalance
  rebuildGrowth(profileId: Id, options?: GrowthOptions): GrowthRecord
  getSummary(profileId: Id, options?: GrowthOptions): GrowthSummary
  listRewardEvents(profileId: Id, options?: GrowthOptions): RewardEvent[]
  clearDemoGrowth(profileId?: Id): void
  getLastWarning(): string | null
}
