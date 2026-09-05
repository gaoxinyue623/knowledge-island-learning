import type {
  Id,
  RewardEvent,
  RewardEventListOptions,
  RewardEventRepository,
  RewardEventType,
} from '@/types'

import { rewardEventStorage } from './rewardEventStorage'
import type { RewardEventStorage } from './rewardEventStorage'

const REWARD_TYPE_ORDER: Record<RewardEventType, number> = {
  lesson_completed: 1,
  assessment_completed: 2,
  knowledge_mastered: 3,
  review_completed: 4,
  wrong_question_resolved: 5,
}

function clone(event: RewardEvent): RewardEvent {
  return {
    ...event,
    reward: { ...event.reward },
    provenance: { ...event.provenance },
  }
}

function sortEvents(left: RewardEvent, right: RewardEvent): number {
  return (
    right.occurredAt.localeCompare(left.occurredAt) ||
    REWARD_TYPE_ORDER[right.type] - REWARD_TYPE_ORDER[left.type] ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.id.localeCompare(right.id)
  )
}

function matches(event: RewardEvent, options: RewardEventListOptions): boolean {
  if (options.includeSample === false && event.provenance.isSampleDerived) return false
  if (options.textbookId && event.textbookId !== options.textbookId) return false
  return true
}

function sourceKey(profileId: Id, type: RewardEventType, sourceId: Id): string {
  return `${profileId}::${type}::${sourceId}`
}

export function createRewardEventRepository(
  storage: RewardEventStorage = rewardEventStorage,
): RewardEventRepository {
  function all(): RewardEvent[] {
    return storage.load().events
  }

  function write(events: readonly RewardEvent[]): void {
    storage.save({ schemaVersion: 1, events: [...events] })
  }

  function findBySource(
    events: readonly RewardEvent[],
    profileId: Id,
    type: RewardEventType,
    sourceId: Id,
  ): RewardEvent | undefined {
    const expected = sourceKey(profileId, type, sourceId)
    return events.find(
      (event) => sourceKey(event.profileId, event.type, event.sourceId) === expected,
    )
  }

  return {
    append(event) {
      const events = all()
      const existing =
        events.find((candidate) => candidate.id === event.id) ??
        findBySource(events, event.profileId, event.type, event.sourceId)
      if (existing) return clone(existing)
      write([...events, clone(event)])
      return clone(event)
    },
    appendMany(nextEvents) {
      const events = all()
      const byId = new Map(events.map((event) => [event.id, event]))
      const bySource = new Map(
        events.map((event) => [sourceKey(event.profileId, event.type, event.sourceId), event]),
      )
      const result: RewardEvent[] = []
      for (const event of nextEvents) {
        const existing =
          byId.get(event.id) ?? bySource.get(sourceKey(event.profileId, event.type, event.sourceId))
        if (existing) {
          result.push(clone(existing))
          continue
        }
        const copy = clone(event)
        byId.set(copy.id, copy)
        bySource.set(sourceKey(copy.profileId, copy.type, copy.sourceId), copy)
        events.push(copy)
        result.push(clone(copy))
      }
      write(events)
      return result
    },
    listByProfile(profileId, options = {}) {
      return all()
        .filter((event) => event.profileId === profileId && matches(event, options))
        .sort(sortEvents)
        .map(clone)
    },
    listByType(profileId, type, options = {}) {
      return this.listByProfile(profileId, options).filter((event) => event.type === type)
    },
    listByKnowledgePoint(profileId, knowledgePointId, options = {}) {
      return this.listByProfile(profileId, options).filter(
        (event) => event.knowledgePointId === knowledgePointId,
      )
    },
    hasRewardForSource(profileId, type, sourceId) {
      return Boolean(findBySource(all(), profileId, type, sourceId))
    },
    getBySource(profileId, type, sourceId) {
      const event = findBySource(all(), profileId, type, sourceId)
      return event ? clone(event) : null
    },
    clearDemoRewards(profileId) {
      write(
        all().filter(
          (event) =>
            !event.provenance.isSampleDerived ||
            (profileId !== undefined && event.profileId !== profileId),
        ),
      )
    },
    getLastWarning() {
      return storage.getLastWarning()
    },
  }
}

export const rewardEventRepository = createRewardEventRepository()
