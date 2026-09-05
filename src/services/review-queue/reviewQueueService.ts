import type {
  Id,
  LearningRecommendation,
  ReviewQueueItem,
  ReviewQueueListOptions,
  ReviewQueueProjectionOptions,
  ReviewQueueProjectionResult,
  ReviewQueueRepository,
} from '@/types'

import { reviewQueueProjectionService, ReviewQueueProjectionService } from './reviewQueueProjection'
import { reviewQueueRepository } from './reviewQueueRepository'

export class ReviewQueueService {
  constructor(
    private readonly repository: ReviewQueueRepository = reviewQueueRepository,
    private readonly projection: ReviewQueueProjectionService = reviewQueueProjectionService,
  ) {}

  projectStrategy(
    recommendation: LearningRecommendation,
    options: ReviewQueueProjectionOptions,
  ): ReviewQueueProjectionResult {
    return this.projection.projectStrategy(recommendation, options)
  }

  listByProfile(profileId: Id, options: ReviewQueueListOptions = {}): ReviewQueueItem[] {
    return this.repository.listByProfile(profileId, options)
  }

  listByTextbook(
    profileId: Id,
    textbookId: Id,
    options: Omit<ReviewQueueListOptions, 'textbookId'> = {},
  ): ReviewQueueItem[] {
    return this.repository.listByTextbook(profileId, textbookId, options)
  }

  get(profileId: Id, itemId: Id): ReviewQueueItem | null {
    return this.repository.get(profileId, itemId)
  }

  complete(profileId: Id, itemId: Id, completedAt: string): ReviewQueueItem | null {
    return this.repository.complete(profileId, itemId, completedAt)
  }

  reopen(profileId: Id, itemId: Id): ReviewQueueItem | null {
    return this.repository.reopen(profileId, itemId)
  }

  getLastWarning(): string | null {
    return this.repository.getLastWarning()
  }

  clearDemoQueue(profileId?: Id): void {
    this.repository.clearDemoQueue(profileId)
  }
}

export const reviewQueueService = new ReviewQueueService()
