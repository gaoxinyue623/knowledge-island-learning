import type {
  GrowthOptions,
  GrowthPolicy,
  GrowthRecord,
  GrowthServiceContract,
  GrowthSummary,
  Id,
  KnowledgeEnergyBalance,
  RewardEvent,
  RewardEventRepository,
  RewardEventProvenance,
} from '@/types'

import { DEFAULT_GROWTH_POLICY, GROWTH_ALGORITHM_VERSION } from '@/types'
import { growthStorage, knowledgeEnergyStorage } from './growthStorage'
import type { GrowthStorage, KnowledgeEnergyStorage } from './growthStorage'
import { rewardEventRepository } from '@/services/reward/rewardEventRepository'

const EPOCH = '1970-01-01T00:00:00.000Z'

export interface GrowthServiceDependencies {
  rewardRepository: RewardEventRepository
  energyStorage: KnowledgeEnergyStorage
  growthStorage: GrowthStorage
}

const defaultDependencies: GrowthServiceDependencies = {
  rewardRepository: rewardEventRepository,
  energyStorage: knowledgeEnergyStorage,
  growthStorage,
}

function includeSampleFor(options: GrowthOptions): boolean {
  return options.includeSample ?? options.dataset === 'demo'
}

function provenanceFor(
  events: readonly RewardEvent[],
  includeSample: boolean,
): RewardEventProvenance {
  const isSampleDerived = includeSample && events.some((event) => event.provenance.isSampleDerived)
  const statuses = new Set(
    events
      .map((event) => event.provenance.verificationStatus)
      .filter((status): status is NonNullable<typeof status> => Boolean(status)),
  )
  const verificationStatus = isSampleDerived
    ? 'SAMPLE'
    : statuses.size === 1
      ? [...statuses][0]
      : undefined
  return {
    isSampleDerived,
    ...(verificationStatus ? { verificationStatus } : {}),
  }
}

function latestOccurredAt(events: readonly RewardEvent[]): string {
  return (
    events.map((event) => event.occurredAt).sort((left, right) => right.localeCompare(left))[0] ??
    EPOCH
  )
}

function normalizedThresholds(policy: GrowthPolicy): number[] {
  const thresholds = [...policy.thresholds]
    .filter((threshold) => Number.isFinite(threshold) && threshold >= 0)
    .sort((left, right) => left - right)
    .filter((threshold, index, values) => index === 0 || threshold !== values[index - 1])
  if (!thresholds.length || thresholds[0] !== 0) thresholds.unshift(0)
  return thresholds
}

export function growthLevelForEnergy(
  knowledgeEnergy: number,
  policy: GrowthPolicy = DEFAULT_GROWTH_POLICY,
): { level: number; currentThreshold: number; nextThreshold?: number; progress: number } {
  const thresholds = normalizedThresholds(policy)
  const energy = Math.max(0, knowledgeEnergy)
  let levelIndex = 0
  for (let index = 0; index < thresholds.length; index += 1) {
    if (energy >= thresholds[index]) levelIndex = index
    else break
  }
  const currentThreshold = thresholds[levelIndex] ?? 0
  const nextThreshold = thresholds[levelIndex + 1]
  if (nextThreshold === undefined || nextThreshold <= currentThreshold) {
    return { level: levelIndex + 1, currentThreshold, progress: 100 }
  }
  const progress = Math.min(
    100,
    Math.max(
      0,
      Math.round(((energy - currentThreshold) / (nextThreshold - currentThreshold)) * 10000) / 100,
    ),
  )
  return {
    level: levelIndex + 1,
    currentThreshold,
    nextThreshold,
    progress,
  }
}

export class GrowthService implements GrowthServiceContract {
  private lastWarning: string | null = null

  constructor(private readonly dependencies: GrowthServiceDependencies = defaultDependencies) {}

  private eventsFor(profileId: Id, options: GrowthOptions): RewardEvent[] {
    return this.dependencies.rewardRepository.listByProfile(profileId, {
      includeSample: includeSampleFor(options),
    })
  }

  private captureWarnings(...warnings: Array<string | null>): void {
    this.lastWarning = warnings.find((warning): warning is string => Boolean(warning)) ?? null
  }

  rebuildKnowledgeEnergy(profileId: Id, options: GrowthOptions = {}): KnowledgeEnergyBalance {
    // Loading the old snapshot is intentional: it lets the storage boundary
    // detect and remove corruption before the value is rebuilt from events.
    this.dependencies.energyStorage.loadAll()
    const snapshotWarning = this.dependencies.energyStorage.getLastWarning()
    const events = this.eventsFor(profileId, options)
    const totalEarned = events.reduce((total, event) => total + event.reward.knowledgeEnergy, 0)
    const balance: KnowledgeEnergyBalance = {
      profileId,
      totalEarned,
      current: totalEarned,
      updatedAt: options.now ?? latestOccurredAt(events),
      algorithmVersion: GROWTH_ALGORITHM_VERSION,
      provenance: provenanceFor(events, includeSampleFor(options)),
    }
    const existing = this.dependencies.energyStorage
      .loadAll()
      .filter((candidate) => candidate.profileId !== profileId)
    this.dependencies.energyStorage.saveAll([...existing, balance])
    this.captureWarnings(snapshotWarning, this.dependencies.energyStorage.getLastWarning())
    return { ...balance, provenance: { ...balance.provenance } }
  }

  rebuildGrowth(profileId: Id, options: GrowthOptions = {}): GrowthRecord {
    const energy = this.rebuildKnowledgeEnergy(profileId, options)
    this.dependencies.growthStorage.loadAll()
    const snapshotWarning = this.dependencies.growthStorage.getLastWarning()
    const result = growthLevelForEnergy(energy.current, options.policy ?? DEFAULT_GROWTH_POLICY)
    const record: GrowthRecord = {
      profileId,
      knowledgeEnergy: energy.current,
      growthLevel: result.level,
      progressToNextLevel: result.progress,
      updatedAt: energy.updatedAt,
      algorithmVersion: options.policy?.algorithmVersion ?? GROWTH_ALGORITHM_VERSION,
      provenance: { ...energy.provenance },
    }
    const existing = this.dependencies.growthStorage
      .loadAll()
      .filter((candidate) => candidate.profileId !== profileId)
    this.dependencies.growthStorage.saveAll([...existing, record])
    this.captureWarnings(
      this.lastWarning,
      snapshotWarning,
      this.dependencies.growthStorage.getLastWarning(),
    )
    return { ...record, provenance: { ...record.provenance } }
  }

  getSummary(profileId: Id, options: GrowthOptions = {}): GrowthSummary {
    const energy = this.rebuildKnowledgeEnergy(profileId, options)
    const energyWarning = this.lastWarning
    const policy = options.policy ?? DEFAULT_GROWTH_POLICY
    const result = growthLevelForEnergy(energy.current, policy)
    const growth = this.rebuildGrowth(profileId, options)
    this.lastWarning = energyWarning ?? this.lastWarning
    return {
      profileId,
      energy,
      growth,
      currentLevelThreshold: result.currentThreshold,
      ...(result.nextThreshold !== undefined ? { nextLevelThreshold: result.nextThreshold } : {}),
    }
  }

  listRewardEvents(profileId: Id, options: GrowthOptions = {}): RewardEvent[] {
    return this.eventsFor(profileId, options)
  }

  clearDemoGrowth(profileId?: Id): void {
    this.dependencies.energyStorage.saveAll(
      this.dependencies.energyStorage
        .loadAll()
        .filter(
          (balance) =>
            !balance.provenance.isSampleDerived ||
            (profileId !== undefined && balance.profileId !== profileId),
        ),
    )
    this.dependencies.growthStorage.saveAll(
      this.dependencies.growthStorage
        .loadAll()
        .filter(
          (record) =>
            !record.provenance.isSampleDerived ||
            (profileId !== undefined && record.profileId !== profileId),
        ),
    )
    this.lastWarning =
      this.dependencies.energyStorage.getLastWarning() ??
      this.dependencies.growthStorage.getLastWarning()
  }

  getLastWarning(): string | null {
    return this.lastWarning
  }
}

export const growthService = new GrowthService()

export function createGrowthService(
  overrides: Partial<GrowthServiceDependencies> = {},
): GrowthService {
  return new GrowthService({
    ...defaultDependencies,
    ...overrides,
    energyStorage: overrides.energyStorage ?? defaultDependencies.energyStorage,
    growthStorage: overrides.growthStorage ?? defaultDependencies.growthStorage,
  })
}
