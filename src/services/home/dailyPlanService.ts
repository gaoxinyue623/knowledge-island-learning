import type {
  DailyLearningPlan,
  DailyPlanPolicy,
  DailyPlanProjectionInput,
  HomeDataset,
  Id,
} from '@/types'

import { dailyPlanStorage } from './dailyPlanStorage'
import type { DailyPlanStorage } from './dailyPlanStorage'
import { buildTextbookContextKey, getLocalDateKey, projectDailyPlan } from './dailyPlanProjection'

export interface DailyPlanServiceContract {
  getOrCreate(input: DailyPlanProjectionInput, policy?: Partial<DailyPlanPolicy>): DailyLearningPlan
  clearDemoPlans(profileId?: Id): void
  getLastWarning(): string | null
}

export class DailyPlanService implements DailyPlanServiceContract {
  private lastWarning: string | null = null

  constructor(private readonly storage: DailyPlanStorage = dailyPlanStorage) {}

  getOrCreate(
    input: DailyPlanProjectionInput,
    policy: Partial<DailyPlanPolicy> = {},
  ): DailyLearningPlan {
    const dateKey = input.dateKey || getLocalDateKey()
    const textbookIds = {
      CHINESE: input.textbookIds?.CHINESE ?? null,
      MATH: input.textbookIds?.MATH ?? null,
      ENGLISH: input.textbookIds?.ENGLISH ?? null,
    }
    for (const map of input.maps) textbookIds[map.subject] = map.textbookId
    const textbookContextKey = buildTextbookContextKey(textbookIds)
    const existing = this.storage.get(
      input.profileId,
      dateKey,
      textbookContextKey,
      input.dataset as HomeDataset,
    )
    const normalizedInput = { ...input, dateKey, textbookIds }
    const plan = projectDailyPlan(normalizedInput, policy, existing)
    if (!existing || JSON.stringify(existing) !== JSON.stringify(plan)) this.storage.save(plan)
    this.lastWarning = this.storage.getLastWarning()
    return plan
  }

  clearDemoPlans(profileId?: Id): void {
    this.storage.clearDemoPlans(profileId)
    this.lastWarning = this.storage.getLastWarning()
  }

  getLastWarning(): string | null {
    return this.lastWarning ?? this.storage.getLastWarning()
  }
}

export function createDailyPlanService(storage: DailyPlanStorage): DailyPlanService {
  return new DailyPlanService(storage)
}

export const dailyPlanService = new DailyPlanService()
