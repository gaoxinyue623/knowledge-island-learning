import type {
  Id,
  LearningHistoryListOptions,
  LearningHistoryRecord,
  LearningHistoryRepository,
} from '@/types'

import { learningHistoryStorage } from './learningHistoryStorage'
import type { LearningHistoryStorage } from './learningHistoryStorage'

const HISTORY_TYPE_ORDER: Record<LearningHistoryRecord['type'], number> = {
  lesson_started: 1,
  lesson_completed: 2,
  assessment_started: 3,
  assessment_completed: 4,
}

function clone(record: LearningHistoryRecord): LearningHistoryRecord {
  return {
    ...record,
    ...(record.summary ? { summary: { ...record.summary } } : {}),
    provenance: { ...record.provenance },
  }
}

function sortHistory(left: LearningHistoryRecord, right: LearningHistoryRecord): number {
  return (
    right.occurredAt.localeCompare(left.occurredAt) ||
    HISTORY_TYPE_ORDER[right.type] - HISTORY_TYPE_ORDER[left.type] ||
    left.id.localeCompare(right.id)
  )
}

function matchesOptions(
  record: LearningHistoryRecord,
  options: LearningHistoryListOptions = {},
): boolean {
  if (options.includeSample === false && record.provenance.isSampleDerived) return false
  if (options.textbookId && record.textbookId !== options.textbookId) return false
  return true
}

export function createLearningHistoryRepository(
  storage: LearningHistoryStorage = learningHistoryStorage,
): LearningHistoryRepository {
  function all(): LearningHistoryRecord[] {
    return storage.loadAll()
  }

  function write(records: readonly LearningHistoryRecord[]): void {
    storage.saveAll(records)
  }

  function listByProfile(
    profileId: Id,
    options: LearningHistoryListOptions = {},
  ): LearningHistoryRecord[] {
    return all()
      .filter((record) => record.profileId === profileId && matchesOptions(record, options))
      .sort(sortHistory)
      .map(clone)
  }

  return {
    append(record) {
      const records = all()
      const existing = records.find((candidate) => candidate.id === record.id)
      if (existing) return clone(existing)
      write([...records, clone(record)])
      return clone(record)
    },
    appendMany(nextRecords) {
      const records = all()
      const byId = new Map(records.map((record) => [record.id, record]))
      for (const record of nextRecords) {
        if (!byId.has(record.id)) byId.set(record.id, clone(record))
      }
      write([...byId.values()])
      return nextRecords.map((record) => clone(byId.get(record.id) ?? record))
    },
    listByProfile,
    listByKnowledgePoint(profileId, knowledgePointId, options = {}) {
      return listByProfile(profileId, options).filter(
        (record) => record.knowledgePointId === knowledgePointId,
      )
    },
    listByLesson(profileId, lessonId, options = {}) {
      return listByProfile(profileId, options).filter((record) => record.lessonId === lessonId)
    },
    listByTextbook(profileId, textbookId, options = {}) {
      return listByProfile(profileId, { ...options, textbookId })
    },
    clearDemoHistory(profileId) {
      const remaining = all().filter(
        (record) =>
          !record.provenance.isSampleDerived ||
          (profileId !== undefined && record.profileId !== profileId),
      )
      write(remaining)
    },
    getLastWarning() {
      return storage.getLastWarning()
    },
  }
}

export const learningHistoryRepository = createLearningHistoryRepository()
