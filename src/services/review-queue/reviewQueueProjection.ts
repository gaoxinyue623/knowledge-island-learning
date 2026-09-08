import type {
  Id,
  LearningRecommendation,
  ReviewQueueItem,
  ReviewQueueProjectionOptions,
  ReviewQueueProjectionResult,
  ReviewQueueRepository,
} from '@/types'

import { buildReviewQueueItemId } from './reviewQueueRepository'
import { reviewQueueRepository } from './reviewQueueRepository'

const UNSAFE_PROVENANCE = new Set(['SAMPLE', 'UNVERIFIED', 'REJECTED'])
const KNOWN_VERIFICATION_STATUSES = new Set([
  'SAMPLE',
  'UNVERIFIED',
  'VERIFIED',
  'REVIEWED',
  'REJECTED',
])

function isQueueType(type: string): type is ReviewQueueItem['recommendationType'] {
  return type === 'REINFORCE' || type === 'GATHER_MORE_EVIDENCE'
}

function sampleDerived(
  recommendation: LearningRecommendation,
  options: ReviewQueueProjectionOptions,
  review?: LearningRecommendation['reviewRecommendations'][number],
): boolean {
  return (
    recommendation.isSampleDerived ||
    review?.isSampleDerived === true ||
    review?.evidenceSourceStatus === 'SAMPLE' ||
    options.isSampleDerived === true ||
    options.dataset === 'demo'
  )
}

function isUnsafe(
  recommendation: LearningRecommendation,
  options: ReviewQueueProjectionOptions,
): boolean {
  return (
    sampleDerived(recommendation, options) ||
    UNSAFE_PROVENANCE.has(options.verificationStatus ?? '') ||
    Boolean(recommendation.warning) ||
    candidates(recommendation).some(
      (review) =>
        sampleDerived(recommendation, options, review) ||
        UNSAFE_PROVENANCE.has(review.evidenceSourceStatus),
    )
  )
}

function verificationStatus(
  recommendation: LearningRecommendation,
  review: LearningRecommendation['reviewRecommendations'][number],
  options: ReviewQueueProjectionOptions,
): ReviewQueueItem['provenance']['verificationStatus'] {
  if (options.verificationStatus) return options.verificationStatus
  if (KNOWN_VERIFICATION_STATUSES.has(review.evidenceSourceStatus)) {
    return review.evidenceSourceStatus as NonNullable<
      ReviewQueueItem['provenance']['verificationStatus']
    >
  }
  if (sampleDerived(recommendation, options, review)) return 'SAMPLE'
  return undefined
}

function recommendationId(
  strategyVersion: string,
  type: ReviewQueueItem['recommendationType'],
  knowledgePointId: Id,
  mapNodeId?: Id,
): Id {
  return `strategy:${strategyVersion}:${type}:${knowledgePointId}:${mapNodeId ?? knowledgePointId}`
}

function candidates(
  recommendation: LearningRecommendation,
): LearningRecommendation['reviewRecommendations'] {
  if (recommendation.reviewRecommendations.length) return recommendation.reviewRecommendations
  if (
    recommendation.reason &&
    recommendation.nextKnowledgePoint &&
    isQueueType(recommendation.type)
  ) {
    return [
      {
        strategyVersion: recommendation.strategyVersion,
        studentProfileId: recommendation.studentProfileId,
        knowledgePointId: recommendation.nextKnowledgePoint.knowledgePointId,
        ...(recommendation.nextKnowledgePoint.mapNodeId
          ? { mapNodeId: recommendation.nextKnowledgePoint.mapNodeId }
          : {}),
        type: recommendation.type,
        priority: 1,
        reason: recommendation.reason,
        isSampleDerived: recommendation.isSampleDerived,
        evidenceSourceStatus: 'NONE',
      },
    ]
  }
  return []
}

export class ReviewQueueProjectionService {
  constructor(private readonly repository: ReviewQueueRepository = reviewQueueRepository) {}

  projectStrategy(
    recommendation: LearningRecommendation,
    options: ReviewQueueProjectionOptions,
  ): ReviewQueueProjectionResult {
    const diagnostics: string[] = []
    const items: ReviewQueueItem[] = []
    if (options.dataset === 'profile' && isUnsafe(recommendation, options)) {
      diagnostics.push(`REVIEW_QUEUE_SOURCE_NOT_ALLOWED: ${recommendation.strategyVersion}`)
      return { items, diagnostics }
    }
    for (const review of candidates(recommendation)) {
      if (!isQueueType(review.type)) continue
      const itemId = buildReviewQueueItemId(
        options.profileId,
        options.textbookId,
        review.knowledgePointId,
        review.type,
        review.mapNodeId,
      )
      items.push(
        this.repository.upsert({
          id: itemId,
          profileId: options.profileId,
          textbookId: options.textbookId,
          knowledgePointId: review.knowledgePointId,
          ...(review.mapNodeId ? { mapNodeId: review.mapNodeId } : {}),
          recommendationType: review.type,
          priority: review.priority,
          reason: { ...review.reason },
          reasonCode: review.reason.code,
          status: 'active',
          sourceStrategyVersion: review.strategyVersion,
          evidenceId: options.evidenceId,
          sourceRecommendationId: recommendationId(
            review.strategyVersion,
            review.type,
            review.knowledgePointId,
            review.mapNodeId,
          ),
          provenance: {
            isSampleDerived: sampleDerived(recommendation, options, review),
            ...(verificationStatus(recommendation, review, options)
              ? { verificationStatus: verificationStatus(recommendation, review, options) }
              : {}),
          },
        }),
      )
    }
    return { items, diagnostics }
  }
}

export const reviewQueueProjectionService = new ReviewQueueProjectionService()
