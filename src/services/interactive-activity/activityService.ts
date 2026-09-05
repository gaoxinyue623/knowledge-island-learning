import type {
  ActivityProgress,
  ActivityResult,
  ActivityStatus,
  Id,
  InteractiveActivity,
} from '@/types'

import {
  interactiveActivityRepository,
  type InteractiveActivityRepository,
} from './activityRepository'
import { interactiveActivityStorage, type InteractiveActivityStorage } from './activityStorage'

export interface InteractiveActivityService {
  getActivity(
    id: Id,
    dataset?: import('@/types').ContentExpansionDataset,
  ): Promise<InteractiveActivity | null>
  getProgress(profileId: Id, activityId: Id): ActivityProgress | null
  start(profileId: Id, activityId: Id): ActivityProgress
  complete(profileId: Id, result: ActivityResult): ActivityProgress
  clearProfile(profileId: Id): void
}

export interface InteractiveActivityServiceOptions {
  repository?: InteractiveActivityRepository
  storage?: InteractiveActivityStorage
}

function now(): string {
  return new Date().toISOString()
}

function nextProgress(
  profileId: Id,
  activityId: Id,
  status: ActivityStatus,
  attempts: number,
  completedAt?: string,
): ActivityProgress {
  return {
    profileId,
    activityId,
    status,
    attempts,
    updatedAt: now(),
    ...(completedAt ? { completedAt } : {}),
  }
}

export class DefaultInteractiveActivityService implements InteractiveActivityService {
  private readonly repository: InteractiveActivityRepository
  private readonly storage: InteractiveActivityStorage

  constructor(options: InteractiveActivityServiceOptions = {}) {
    this.repository = options.repository ?? interactiveActivityRepository
    this.storage = options.storage ?? interactiveActivityStorage
  }

  getActivity(id: Id, dataset?: import('@/types').ContentExpansionDataset) {
    return this.repository.getById(id, dataset)
  }

  getProgress(profileId: Id, activityId: Id): ActivityProgress | null {
    return this.storage.get(profileId, activityId)
  }

  start(profileId: Id, activityId: Id): ActivityProgress {
    const existing = this.storage.get(profileId, activityId)
    const status: ActivityStatus = existing?.status === 'completed' ? 'completed' : 'in_progress'
    const progress = nextProgress(
      profileId,
      activityId,
      status,
      existing?.attempts ?? 0,
      existing?.completedAt,
    )
    this.storage.upsert(progress)
    return progress
  }

  complete(profileId: Id, result: ActivityResult): ActivityProgress {
    const previous = this.storage.get(profileId, result.activityId)
    const completedAt = result.completedAt ?? (result.status === 'completed' ? now() : undefined)
    const progress = nextProgress(
      profileId,
      result.activityId,
      result.status,
      Math.max(previous?.attempts ?? 0, result.attempts),
      completedAt,
    )
    this.storage.upsert(progress)
    return progress
  }

  clearProfile(profileId: Id): void {
    this.storage.clearProfile(profileId)
  }
}

export const interactiveActivityService = new DefaultInteractiveActivityService()
