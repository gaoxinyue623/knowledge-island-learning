import type {
  Id,
  RewardEvent,
  RewardEventListOptions,
  RewardEventRepository,
  RewardEventType,
  RewardLearningFact,
  RewardPolicy,
  RewardProjectionBatchResult,
  RewardProjectionOptions,
  RewardProjectionResult,
} from '@/types'

import { DEFAULT_REWARD_POLICY } from '@/types'
import { rewardEventRepository } from './rewardEventRepository'
import { RewardProjectionService, rewardProjectionService } from './rewardProjection'

export interface RewardServiceContract {
  processLearningFact(
    profileId: Id,
    fact: RewardLearningFact,
    options?: RewardProjectionOptions,
  ): RewardProjectionResult
  processLearningFacts(
    profileId: Id,
    facts: readonly RewardLearningFact[],
    options?: RewardProjectionOptions,
  ): RewardProjectionBatchResult
  listByProfile(profileId: Id, options?: RewardEventListOptions): RewardEvent[]
  listByType(profileId: Id, type: RewardEventType, options?: RewardEventListOptions): RewardEvent[]
  listByKnowledgePoint(
    profileId: Id,
    knowledgePointId: Id,
    options?: RewardEventListOptions,
  ): RewardEvent[]
  clearDemoRewards(profileId?: Id): void
  getLastWarning(): string | null
}

export interface RewardServiceDependencies {
  repository: RewardEventRepository
  projection: RewardProjectionService
}

const defaultDependencies: RewardServiceDependencies = {
  repository: rewardEventRepository,
  projection: rewardProjectionService,
}

export class RewardService implements RewardServiceContract {
  constructor(
    private readonly repository: RewardEventRepository = defaultDependencies.repository,
    private readonly projection: RewardProjectionService = defaultDependencies.projection,
  ) {}

  processLearningFact(
    profileId: Id,
    fact: RewardLearningFact,
    options: RewardProjectionOptions = {},
  ): RewardProjectionResult {
    return this.projection.projectLearningFact(profileId, fact, options)
  }

  processLearningFacts(
    profileId: Id,
    facts: readonly RewardLearningFact[],
    options: RewardProjectionOptions = {},
  ): RewardProjectionBatchResult {
    return this.projection.projectLearningFacts(profileId, facts, options)
  }

  listByProfile(profileId: Id, options: RewardEventListOptions = {}): RewardEvent[] {
    return this.repository.listByProfile(profileId, options)
  }

  listByType(
    profileId: Id,
    type: RewardEventType,
    options: RewardEventListOptions = {},
  ): RewardEvent[] {
    return this.repository.listByType(profileId, type, options)
  }

  listByKnowledgePoint(
    profileId: Id,
    knowledgePointId: Id,
    options: RewardEventListOptions = {},
  ): RewardEvent[] {
    return this.repository.listByKnowledgePoint(profileId, knowledgePointId, options)
  }

  clearDemoRewards(profileId?: Id): void {
    this.repository.clearDemoRewards(profileId)
  }

  getLastWarning(): string | null {
    return this.repository.getLastWarning()
  }
}

export const rewardService = new RewardService()

export function createRewardService(
  repository: RewardEventRepository,
  policy: RewardPolicy = DEFAULT_REWARD_POLICY,
): RewardService {
  return new RewardService(repository, new RewardProjectionService(repository, policy))
}
