import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  interactiveActivityService,
  type InteractiveActivityService,
} from '@/services/interactive-activity'
import type {
  ActivityProgress,
  ActivityResult,
  ContentExpansionDataset,
  Id,
  InteractiveActivity,
} from '@/types'

let service: InteractiveActivityService = interactiveActivityService

export function configureInteractiveActivityStore(next: InteractiveActivityService): void {
  service = next
}

export function resetInteractiveActivityStoreDependencies(): void {
  service = interactiveActivityService
}

export const useInteractiveActivityStore = defineStore('interactiveActivity', () => {
  const activity = ref<InteractiveActivity | null>(null)
  const progress = ref<ActivityProgress | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const profileId = ref<Id>('local-profile')

  const isCompleted = computed(() => progress.value?.status === 'completed')

  async function loadActivity(
    activityId: Id,
    nextProfileId = 'local-profile',
    dataset: ContentExpansionDataset = 'golden',
  ): Promise<InteractiveActivity | null> {
    status.value = 'loading'
    error.value = null
    warning.value = null
    profileId.value = nextProfileId
    try {
      const result = await service.getActivity(activityId, dataset)
      activity.value = result
      progress.value = result ? service.getProgress(nextProfileId, activityId) : null
      status.value = result ? 'ready' : 'error'
      error.value = result ? null : '这项活动暂时没有准备好。'
      return result
    } catch {
      activity.value = null
      progress.value = null
      status.value = 'error'
      error.value = '这项活动暂时无法打开，请重新试一次。'
      return null
    }
  }

  function start(): void {
    if (!activity.value) return
    progress.value = service.start(profileId.value, activity.value.id)
    warning.value = null
  }

  function complete(result: ActivityResult): void {
    progress.value = service.complete(profileId.value, result)
    warning.value = null
  }

  function clearProfile(): void {
    service.clearProfile(profileId.value)
    progress.value = activity.value ? service.getProgress(profileId.value, activity.value.id) : null
  }

  return {
    activity,
    progress,
    status,
    error,
    warning,
    profileId,
    isCompleted,
    loadActivity,
    start,
    complete,
    clearProfile,
  }
})
