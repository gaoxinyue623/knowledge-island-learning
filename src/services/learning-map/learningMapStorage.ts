import type {
  Id,
  LearningMapProgressRecord,
  LearningMapProgressStoragePayload,
  LearningNodeStatus,
} from '@/types'

export const LEARNING_MAP_PROGRESS_STORAGE_KEY = 'knowledge-island.learning-map-progress'

const LEARNING_NODE_STATUSES: ReadonlySet<LearningNodeStatus> = new Set([
  'locked',
  'available',
  'learning',
  'completed',
  'mastered',
  'perfect',
])

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function parseRecords(value: unknown): LearningMapProgressRecord[] | null {
  if (!Array.isArray(value)) return null
  const records: LearningMapProgressRecord[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null
    const candidate = item as Record<string, unknown>
    if (
      typeof candidate.nodeId !== 'string' ||
      typeof candidate.status !== 'string' ||
      !LEARNING_NODE_STATUSES.has(candidate.status as LearningNodeStatus) ||
      typeof candidate.progress !== 'number' ||
      !Number.isFinite(candidate.progress)
    ) {
      return null
    }
    const optionalString = (key: string): string | undefined =>
      candidate[key] === undefined
        ? undefined
        : typeof candidate[key] === 'string'
          ? candidate[key]
          : ''
    const startedAt = optionalString('startedAt')
    const completedAt = optionalString('completedAt')
    if (startedAt === '' || completedAt === '') return null
    records.push({
      nodeId: candidate.nodeId,
      status: candidate.status as LearningNodeStatus,
      progress: Math.min(100, Math.max(0, candidate.progress)),
      ...(startedAt ? { startedAt } : {}),
      ...(completedAt ? { completedAt } : {}),
    })
  }
  return records
}

function parsePayload(value: string | null): LearningMapProgressStoragePayload | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as Record<string, unknown>
    if (
      candidate.schemaVersion !== 1 ||
      typeof candidate.textbookId !== 'string' ||
      !candidate.textbookId
    ) {
      return null
    }
    const records = parseRecords(candidate.records)
    return records ? { schemaVersion: 1, textbookId: candidate.textbookId, records } : null
  } catch {
    return null
  }
}

export interface LearningMapProgressStorage {
  load(textbookId: Id): LearningMapProgressRecord[]
  save(textbookId: Id, records: LearningMapProgressRecord[]): void
  clear(textbookId: Id): void
}

export function createLearningMapProgressStorage(
  storage: StorageLike | null = browserStorage(),
): LearningMapProgressStorage {
  return {
    load(textbookId) {
      const payload = parsePayload(storage?.getItem(LEARNING_MAP_PROGRESS_STORAGE_KEY) ?? null)
      return payload?.textbookId === textbookId ? payload.records : []
    },
    save(textbookId, records) {
      if (!storage) return
      const payload: LearningMapProgressStoragePayload = {
        schemaVersion: 1,
        textbookId,
        records,
      }
      storage.setItem(LEARNING_MAP_PROGRESS_STORAGE_KEY, JSON.stringify(payload))
    },
    clear(textbookId) {
      const payload = parsePayload(storage?.getItem(LEARNING_MAP_PROGRESS_STORAGE_KEY) ?? null)
      if (payload?.textbookId === textbookId) storage?.removeItem(LEARNING_MAP_PROGRESS_STORAGE_KEY)
    },
  }
}
