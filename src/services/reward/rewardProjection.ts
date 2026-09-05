import type {
  Id,
  MasteryRecord,
  RewardDataset,
  RewardEvent,
  RewardEventProvenance,
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

const EPOCH = '1970-01-01T00:00:00.000Z'

function eventId(profileId: Id, type: RewardEventType, sourceId: Id): Id {
  return `reward:${profileId}:${type}:${sourceId}`
}

export function buildRewardEventId(profileId: Id, type: RewardEventType, sourceId: Id): Id {
  return eventId(profileId, type, sourceId)
}

export function buildMasteryRewardSourceId(record: MasteryRecord): Id {
  return `mastery-transition:${record.knowledgePointId}:${record.algorithmVersion}`
}

function factProfileId(fact: RewardLearningFact, fallback: Id): Id {
  if (fact.type === 'knowledge_mastered') return fact.transition.next.studentProfileId
  if (fact.type === 'review_completed') return fact.item.profileId
  if (fact.type === 'wrong_question_resolved') return fact.record.profileId
  return fallback
}

function sourceProvenance(
  fact: RewardLearningFact,
  options: RewardProjectionOptions,
): { isSampleDerived: boolean; verificationStatus?: RewardEventProvenance['verificationStatus'] } {
  const source =
    fact.type === 'review_completed'
      ? fact.item.provenance
      : fact.type === 'wrong_question_resolved'
        ? fact.record.provenance
        : undefined
  const masterySample =
    fact.type === 'knowledge_mastered' &&
    (fact.transition.next.isSampleDerived || fact.transition.next.evidenceSourceStatus === 'SAMPLE')
  const masteryVerification =
    fact.type === 'knowledge_mastered'
      ? fact.transition.next.evidenceSourceStatus === 'UNVERIFIED'
        ? 'UNVERIFIED'
        : fact.transition.next.evidenceSourceStatus === 'REVIEWED'
          ? 'REVIEWED'
          : fact.transition.next.evidenceSourceStatus === 'VERIFIED'
            ? 'VERIFIED'
            : undefined
      : undefined
  const sourceVerification = source?.verificationStatus
  const isSampleDerived =
    options.dataset === 'demo' ||
    options.isSampleDerived === true ||
    source?.isSampleDerived === true ||
    sourceVerification === 'SAMPLE' ||
    masterySample ||
    options.verificationStatus === 'SAMPLE'
  const verificationStatus = options.verificationStatus ?? sourceVerification ?? masteryVerification
  return {
    isSampleDerived,
    ...(verificationStatus
      ? { verificationStatus }
      : isSampleDerived
        ? { verificationStatus: 'SAMPLE' as const }
        : {}),
  }
}

function isBlockedProfileSource(
  dataset: RewardDataset,
  provenance: RewardEventProvenance,
): boolean {
  if (dataset !== 'profile') return false
  return (
    provenance.isSampleDerived ||
    provenance.verificationStatus === 'SAMPLE' ||
    provenance.verificationStatus === 'UNVERIFIED' ||
    provenance.verificationStatus === 'REJECTED'
  )
}

function eventTime(
  value: string | undefined,
  fallback: string | undefined,
  type: RewardEventType,
  sourceId: Id,
  diagnostics: string[],
): string {
  if (value) return value
  if (fallback) {
    diagnostics.push(`REWARD_EVENT_TIME_FALLBACK: ${type}:${sourceId}`)
    return fallback
  }
  diagnostics.push(`REWARD_EVENT_TIME_MISSING: ${type}:${sourceId}`)
  return EPOCH
}

function sourceIdForFact(fact: RewardLearningFact): Id {
  switch (fact.type) {
    case 'lesson_completed':
      return fact.session.id
    case 'assessment_completed':
      return fact.session.id
    case 'knowledge_mastered':
      return buildMasteryRewardSourceId(fact.transition.next)
    case 'review_completed':
      return fact.item.id
    case 'wrong_question_resolved':
      return fact.record.id
  }
}

function eventTypeForFact(fact: RewardLearningFact): RewardEventType {
  return fact.type
}

function rewardForFact(fact: RewardLearningFact, policy: RewardPolicy): number {
  switch (fact.type) {
    case 'lesson_completed':
      return policy.lessonCompletedEnergy
    case 'assessment_completed':
      return policy.assessmentCompletedEnergy
    case 'knowledge_mastered':
      return policy.knowledgeMasteredEnergy
    case 'review_completed':
      return policy.reviewCompletedEnergy
    case 'wrong_question_resolved':
      return policy.wrongQuestionResolvedEnergy
  }
}

function metadataForFact(fact: RewardLearningFact): {
  textbookId?: Id
  knowledgePointId?: Id
  occurredAt?: string
  fallbackAt?: string
} {
  switch (fact.type) {
    case 'lesson_completed':
      return {
        textbookId: fact.session.textbookId,
        knowledgePointId: fact.session.knowledgePointId,
        occurredAt: fact.session.completedAt,
        fallbackAt: fact.session.updatedAt ?? fact.session.startedAt,
      }
    case 'assessment_completed':
      return {
        textbookId: fact.session.textbookId,
        knowledgePointId: fact.session.knowledgePointId,
        occurredAt: fact.session.completedAt,
        fallbackAt: fact.session.updatedAt ?? fact.session.startedAt,
      }
    case 'knowledge_mastered':
      return {
        knowledgePointId: fact.transition.next.knowledgePointId,
        occurredAt: fact.transition.next.updatedAt ?? fact.transition.next.lastEvidenceAt,
        fallbackAt: fact.transition.next.lastEvidenceAt,
      }
    case 'review_completed':
      return {
        textbookId: fact.item.textbookId,
        knowledgePointId: fact.item.knowledgePointId,
        occurredAt: fact.item.completedAt,
      }
    case 'wrong_question_resolved':
      return {
        textbookId: fact.record.textbookId,
        knowledgePointId: fact.record.knowledgePointIds[0],
        occurredAt: fact.record.resolvedAt,
        fallbackAt: fact.record.lastWrongAt,
      }
  }
}

function factIsEligible(fact: RewardLearningFact): boolean {
  switch (fact.type) {
    case 'lesson_completed':
      return fact.session.status === 'completed'
    case 'assessment_completed':
      return fact.session.status === 'completed'
    case 'knowledge_mastered':
      return (
        fact.transition.next.state === 'mastered' && fact.transition.previous?.state !== 'mastered'
      )
    case 'review_completed':
      return fact.item.status === 'completed'
    case 'wrong_question_resolved':
      return fact.record.status === 'resolved'
  }
}

function emptyResult(diagnostics: string[]): RewardProjectionResult {
  return { event: null, created: false, diagnostics }
}

export interface RewardProjectionServiceContract {
  projectLearningFact(
    profileId: Id,
    fact: RewardLearningFact,
    options?: RewardProjectionOptions,
  ): RewardProjectionResult
  projectLearningFacts(
    profileId: Id,
    facts: readonly RewardLearningFact[],
    options?: RewardProjectionOptions,
  ): RewardProjectionBatchResult
}

export class RewardProjectionService implements RewardProjectionServiceContract {
  constructor(
    private readonly repository: RewardEventRepository,
    private readonly policy: RewardPolicy = DEFAULT_REWARD_POLICY,
  ) {}

  projectLearningFact(
    profileId: Id,
    fact: RewardLearningFact,
    options: RewardProjectionOptions = {},
  ): RewardProjectionResult {
    const diagnostics: string[] = []
    const dataset = options.dataset ?? 'profile'
    const factProfile = factProfileId(fact, profileId)
    if (factProfile !== profileId) {
      diagnostics.push(`REWARD_PROFILE_MISMATCH: ${factProfile}`)
      return emptyResult(diagnostics)
    }
    if (!factIsEligible(fact)) {
      diagnostics.push(`REWARD_SOURCE_NOT_COMPLETED: ${fact.type}`)
      return emptyResult(diagnostics)
    }

    const provenance = sourceProvenance(fact, options)
    if (isBlockedProfileSource(dataset, provenance)) {
      diagnostics.push(`REWARD_SOURCE_NOT_ALLOWED: ${fact.type}`)
      return emptyResult(diagnostics)
    }

    const type = eventTypeForFact(fact)
    const sourceId = sourceIdForFact(fact)
    const metadata = metadataForFact(fact)
    const occurredAt = eventTime(
      metadata.occurredAt,
      metadata.fallbackAt,
      type,
      sourceId,
      diagnostics,
    )
    const amount = rewardForFact(fact, this.policy)
    if (!Number.isInteger(amount) || amount < 0) {
      diagnostics.push(`REWARD_POLICY_INVALID: ${type}`)
      return emptyResult(diagnostics)
    }
    const event: RewardEvent = {
      id: eventId(profileId, type, sourceId),
      profileId,
      type,
      sourceId,
      ...(metadata.textbookId ? { textbookId: metadata.textbookId } : {}),
      ...(metadata.knowledgePointId ? { knowledgePointId: metadata.knowledgePointId } : {}),
      occurredAt,
      reward: { knowledgeEnergy: amount },
      provenance,
    }
    const existing = this.repository.getBySource(profileId, type, sourceId)
    const stored = this.repository.append(event)
    if (existing) {
      diagnostics.push(`REWARD_EVENT_ALREADY_PROCESSED: ${type}:${sourceId}`)
      return { event: stored, created: false, diagnostics }
    }
    return { event: stored, created: true, diagnostics }
  }

  projectLearningFacts(
    profileId: Id,
    facts: readonly RewardLearningFact[],
    options: RewardProjectionOptions = {},
  ): RewardProjectionBatchResult {
    const events: RewardEvent[] = []
    const diagnostics: string[] = []
    for (const fact of facts) {
      const result = this.projectLearningFact(profileId, fact, options)
      if (result.event) events.push(result.event)
      diagnostics.push(...result.diagnostics)
    }
    return { events, diagnostics }
  }
}

export function createRewardProjectionService(
  repository: RewardEventRepository,
  policy: RewardPolicy = DEFAULT_REWARD_POLICY,
): RewardProjectionService {
  return new RewardProjectionService(repository, policy)
}

export const rewardProjectionService = new RewardProjectionService(rewardEventRepository)
