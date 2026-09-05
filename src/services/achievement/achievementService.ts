import type {
  AchievementDefinition,
  AchievementEvaluationOptions,
  AchievementEvaluationResult,
  AchievementFacts,
  AchievementProgress,
  AchievementRepository,
  AchievementUnlock,
  GrowthOptions,
  GrowthSummary,
  Id,
  LearningHistoryRecord,
  MasteryRecord,
  ReviewQueueItem,
  WrongQuestionRecord,
} from '@/types'

import { getAchievementDefinitions } from '@/data/achievement/achievementDefinitions'
import {
  learningHistoryService,
  type LearningHistoryServiceContract,
} from '@/services/learning-history'
import { masteryRepository, type MasteryRepository } from '@/services/mastery/masteryRepository'
import { reviewQueueService, type ReviewQueueService } from '@/services/review-queue'
import { wrongBookService, type WrongBookService } from '@/services/wrong-book'
import { growthService, type GrowthService } from '@/services/growth'
import { achievementRepository } from './achievementRepository'

const EPOCH = '1970-01-01T00:00:00.000Z'

export interface AchievementServiceDependencies {
  repository: AchievementRepository
  historyService: LearningHistoryServiceContract
  masteryRepository: MasteryRepository
  reviewQueueService: ReviewQueueService
  wrongBookService: WrongBookService
  growthService: GrowthService
  definitions: readonly AchievementDefinition[]
}

const defaultDependencies: AchievementServiceDependencies = {
  repository: achievementRepository,
  historyService: learningHistoryService,
  masteryRepository,
  reviewQueueService,
  wrongBookService,
  growthService,
  definitions: getAchievementDefinitions(),
}

function includeSampleFor(options: AchievementEvaluationOptions): boolean {
  return options.includeSample ?? options.dataset === 'demo'
}

function historyFor(
  records: readonly LearningHistoryRecord[],
  includeSample: boolean,
): LearningHistoryRecord[] {
  return records.filter((record) => includeSample || !record.provenance.isSampleDerived)
}

function wrongBookFor(
  records: readonly WrongQuestionRecord[],
  includeSample: boolean,
): WrongQuestionRecord[] {
  return records.filter((record) => includeSample || !record.provenance.isSampleDerived)
}

function reviewQueueFor(
  items: readonly ReviewQueueItem[],
  includeSample: boolean,
): ReviewQueueItem[] {
  return items.filter((item) => includeSample || !item.provenance.isSampleDerived)
}

function masteryFor(records: readonly MasteryRecord[], includeSample: boolean): MasteryRecord[] {
  return records.filter(
    (record) =>
      record.state === 'mastered' &&
      (includeSample ||
        (!record.isSampleDerived &&
          record.evidenceSourceStatus !== 'SAMPLE' &&
          record.evidenceSourceStatus !== 'UNVERIFIED' &&
          record.evidenceSourceStatus !== 'MIXED')),
  )
}

function latestFactTime(
  history: readonly LearningHistoryRecord[],
  wrongBook: readonly WrongQuestionRecord[],
  reviewQueue: readonly ReviewQueueItem[],
  mastery: readonly MasteryRecord[],
  growth: GrowthSummary,
): string {
  const values = [
    ...history.filter((item) => item.type.endsWith('completed')).map((item) => item.occurredAt),
    ...wrongBook.flatMap((item) => (item.resolvedAt ? [item.resolvedAt] : [])),
    ...reviewQueue.flatMap((item) => (item.completedAt ? [item.completedAt] : [])),
    ...mastery.flatMap((item) => (item.updatedAt ? [item.updatedAt] : [])),
    growth.energy.updatedAt,
  ]
  return values.sort((left, right) => right.localeCompare(left))[0] ?? EPOCH
}

function provenanceFor(
  history: readonly LearningHistoryRecord[],
  wrongBook: readonly WrongQuestionRecord[],
  reviewQueue: readonly ReviewQueueItem[],
  mastery: readonly MasteryRecord[],
  growth: GrowthSummary,
  includeSample: boolean,
): AchievementFacts['provenance'] {
  const isSampleDerived =
    includeSample &&
    (history.some((item) => item.provenance.isSampleDerived) ||
      wrongBook.some((item) => item.provenance.isSampleDerived) ||
      reviewQueue.some((item) => item.provenance.isSampleDerived) ||
      mastery.some((item) => item.isSampleDerived) ||
      growth.energy.provenance.isSampleDerived)
  return {
    isSampleDerived,
    ...(isSampleDerived ? { verificationStatus: 'SAMPLE' as const } : {}),
  }
}

function factsFor(
  history: readonly LearningHistoryRecord[],
  wrongBook: readonly WrongQuestionRecord[],
  reviewQueue: readonly ReviewQueueItem[],
  mastery: readonly MasteryRecord[],
  growth: GrowthSummary,
  includeSample: boolean,
): AchievementFacts {
  const filteredHistory = historyFor(history, includeSample)
  const filteredWrongBook = wrongBookFor(wrongBook, includeSample)
  const filteredReviewQueue = reviewQueueFor(reviewQueue, includeSample)
  const filteredMastery = masteryFor(mastery, includeSample)
  return {
    lessonCompletedCount: filteredHistory.filter((item) => item.type === 'lesson_completed').length,
    assessmentCompletedCount: filteredHistory.filter((item) => item.type === 'assessment_completed')
      .length,
    knowledgeMasteredCount: filteredMastery.length,
    wrongQuestionResolvedCount: filteredWrongBook.filter((item) => item.status === 'resolved')
      .length,
    reviewCompletedCount: filteredReviewQueue.filter((item) => item.status === 'completed').length,
    knowledgeEnergy: growth.energy.current,
    lastOccurredAt: latestFactTime(
      filteredHistory,
      filteredWrongBook,
      filteredReviewQueue,
      filteredMastery,
      growth,
    ),
    provenance: provenanceFor(
      filteredHistory,
      filteredWrongBook,
      filteredReviewQueue,
      filteredMastery,
      growth,
      includeSample,
    ),
  }
}

function currentForCondition(definition: AchievementDefinition, facts: AchievementFacts): number {
  switch (definition.condition.type) {
    case 'lesson_completed_count':
      return facts.lessonCompletedCount
    case 'assessment_completed_count':
      return facts.assessmentCompletedCount
    case 'knowledge_mastered_count':
      return facts.knowledgeMasteredCount
    case 'wrong_question_resolved_count':
      return facts.wrongQuestionResolvedCount
    case 'review_completed_count':
      return facts.reviewCompletedCount
    case 'knowledge_energy':
      return facts.knowledgeEnergy
  }
}

function growthOptions(options: AchievementEvaluationOptions): GrowthOptions {
  return {
    ...(options.dataset ? { dataset: options.dataset } : {}),
    includeSample: includeSampleFor(options),
    ...(options.now ? { now: options.now } : {}),
  }
}

export class AchievementService {
  private lastWarning: string | null = null

  constructor(
    private readonly dependencies: AchievementServiceDependencies = defaultDependencies,
  ) {}

  evaluate(profileId: Id, options: AchievementEvaluationOptions = {}): AchievementEvaluationResult {
    const includeSample = includeSampleFor(options)
    const listOptions = { includeSample }
    const history = this.dependencies.historyService.listByProfile(profileId, listOptions)
    const wrongBook = this.dependencies.wrongBookService.listByProfile(profileId, {
      includeResolved: true,
      includeSample,
    })
    const reviewQueue = this.dependencies.reviewQueueService.listByProfile(profileId, {
      includeCompleted: true,
      includeSample,
    })
    const mastery = this.dependencies.masteryRepository.getMasteryRecords(profileId)
    const growth = this.dependencies.growthService.getSummary(profileId, growthOptions(options))
    const facts = factsFor(history, wrongBook, reviewQueue, mastery, growth, includeSample)
    const unlocks: AchievementUnlock[] = []
    const progress = this.dependencies.definitions
      .slice()
      .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
      .map((definition) => {
        const target = definition.condition.target
        const current = currentForCondition(definition, facts)
        const percentage =
          target > 0
            ? Math.min(100, Math.max(0, Math.round((current / target) * 10000) / 100))
            : 100
        const existing =
          this.dependencies.repository
            .listUnlocks(profileId, { includeSample: true })
            .find(
              (unlock) =>
                unlock.achievementId === definition.id &&
                unlock.provenance.isSampleDerived === facts.provenance.isSampleDerived,
            ) ?? null
        const reached = current >= target
        let unlock = existing
        if (!unlock && reached) {
          unlock = this.dependencies.repository.recordUnlock({
            id: `achievement-unlock:${profileId}:${definition.id}:${includeSample ? 'sample' : 'formal'}`,
            profileId,
            achievementId: definition.id,
            unlockedAt: options.now ?? facts.lastOccurredAt ?? EPOCH,
            provenance: { ...facts.provenance },
          })
          unlocks.push(unlock)
        }
        return {
          definition: { ...definition, condition: { ...definition.condition } },
          profileId,
          current,
          target,
          percentage,
          status: unlock || reached ? ('unlocked' as const) : ('locked' as const),
          ...(unlock ? { unlockedAt: unlock.unlockedAt } : {}),
          provenance: { ...facts.provenance },
        } satisfies AchievementProgress
      })
    this.lastWarning =
      this.dependencies.repository.getLastWarning() ??
      this.dependencies.growthService.getLastWarning()
    return { facts, progress, unlocks, diagnostics: this.lastWarning ? [this.lastWarning] : [] }
  }

  listDefinitions(): AchievementDefinition[] {
    return this.dependencies.definitions
      .slice()
      .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
      .map((definition) => ({ ...definition, condition: { ...definition.condition } }))
  }

  listUnlocks(profileId: Id, includeSample = false): AchievementUnlock[] {
    return this.dependencies.repository.listUnlocks(profileId, { includeSample })
  }

  clearDemoAchievements(profileId?: Id): void {
    this.dependencies.repository.clearDemoAchievements(profileId)
    this.lastWarning = this.dependencies.repository.getLastWarning()
  }

  getLastWarning(): string | null {
    return this.lastWarning
  }
}

export const achievementService = new AchievementService()
