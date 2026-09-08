import type { Id, ReviewQueueItem, ReviewQueueListOptions, ReviewQueueRepository } from '@/types'

import { reviewQueueStorage } from './reviewQueueStorage'
import type { ReviewQueueStorage } from './reviewQueueStorage'

function clone(item: ReviewQueueItem): ReviewQueueItem {
  return { ...item, reason: { ...item.reason }, provenance: { ...item.provenance } }
}

function sortQueue(left: ReviewQueueItem, right: ReviewQueueItem): number {
  return (
    (left.status === 'active' ? 0 : 1) - (right.status === 'active' ? 0 : 1) ||
    left.priority - right.priority ||
    left.reasonCode.localeCompare(right.reasonCode) ||
    left.knowledgePointId.localeCompare(right.knowledgePointId) ||
    (left.mapNodeId ?? '').localeCompare(right.mapNodeId ?? '') ||
    left.id.localeCompare(right.id)
  )
}

function matches(item: ReviewQueueItem, options: ReviewQueueListOptions): boolean {
  if (!options.includeCompleted && item.status !== 'active') return false
  if (options.includeSample === false && item.provenance.isSampleDerived) return false
  if (options.textbookId && item.textbookId !== options.textbookId) return false
  return true
}

export function buildReviewQueueItemId(
  profileId: Id,
  textbookId: Id,
  knowledgePointId: Id,
  recommendationType: ReviewQueueItem['recommendationType'],
  mapNodeId?: Id,
): Id {
  return [
    'review-queue',
    profileId,
    textbookId,
    knowledgePointId,
    mapNodeId ?? knowledgePointId,
    recommendationType,
  ].join(':')
}

export function createReviewQueueRepository(
  storage: ReviewQueueStorage = reviewQueueStorage,
): ReviewQueueRepository {
  return {
    listByProfile(profileId, options = {}) {
      return storage
        .load()
        .items.filter((item) => item.profileId === profileId && matches(item, options))
        .sort(sortQueue)
        .map(clone)
    },
    listByTextbook(profileId, textbookId, options = {}) {
      return this.listByProfile(profileId, { ...options, textbookId })
    },
    get(profileId, itemId) {
      const item = storage
        .load()
        .items.find((candidate) => candidate.profileId === profileId && candidate.id === itemId)
      return item ? clone(item) : null
    },
    upsert(item) {
      const payload = storage.load()
      const index = payload.items.findIndex((candidate) => candidate.id === item.id)
      const existing = index >= 0 ? payload.items[index] : undefined
      const newEvidence =
        existing?.status === 'completed' &&
        (item.reason.evidenceCount > existing.reason.evidenceCount ||
          Boolean(item.evidenceId && item.evidenceId !== existing.evidenceId))
      if (newEvidence && existing)
        payload.items.push({ ...existing, id: `${existing.id}:completed:${existing.completedAt}` })
      const next: ReviewQueueItem = {
        ...item,
        evidenceId: item.evidenceId ?? existing?.evidenceId,
        ...(existing?.status === 'completed' && !newEvidence
          ? {
              status: 'completed' as const,
              ...(existing.completedAt ? { completedAt: existing.completedAt } : {}),
            }
          : {}),
        reason: { ...item.reason },
        provenance: { ...item.provenance },
      }
      if (index >= 0) payload.items[index] = next
      else payload.items.push(next)
      storage.save(payload)
      return clone(next)
    },
    complete(profileId, itemId, completedAt) {
      const payload = storage.load()
      const index = payload.items.findIndex(
        (item) => item.profileId === profileId && item.id === itemId,
      )
      if (index < 0) return null
      const next: ReviewQueueItem = {
        ...payload.items[index],
        status: 'completed',
        completedAt,
      }
      payload.items[index] = next
      storage.save(payload)
      return clone(next)
    },
    reopen(profileId, itemId) {
      const payload = storage.load()
      const index = payload.items.findIndex(
        (item) => item.profileId === profileId && item.id === itemId,
      )
      if (index < 0) return null
      const next = { ...payload.items[index], status: 'active' as const }
      delete next.completedAt
      payload.items[index] = next
      storage.save(payload)
      return clone(next)
    },
    clearDemoQueue(profileId) {
      const payload = storage.load()
      payload.items = payload.items.filter(
        (item) =>
          !item.provenance.isSampleDerived ||
          (profileId !== undefined && item.profileId !== profileId),
      )
      storage.save(payload)
    },
    getLastWarning() {
      return storage.getLastWarning()
    },
  }
}

export const reviewQueueRepository = createReviewQueueRepository()
