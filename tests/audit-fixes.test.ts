import { describe, expect, it } from 'vitest'
import {
  createLearningMapProgressStorage,
  LEARNING_MAP_PROGRESS_STORAGE_KEY,
  mapProgressStorageKey,
} from '@/services/learning-map/learningMapStorage'
import { createReviewQueueRepository } from '@/services/review-queue/reviewQueueRepository'
import { createReviewQueueStorage } from '@/services/review-queue/reviewQueueStorage'
import {
  readActivityHistory,
  recordLearningActivity,
} from '@/services/learning-activity/activityHistory'
import type { ReviewQueueItem } from '@/types'

function memory() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  }
}
const records = [{ nodeId: 'node-1', status: 'completed' as const, progress: 100 }]
describe('audit fixes: persistence and review lifecycle', () => {
  it('retains progress across subjects, textbooks, reloads and student profiles', () => {
    const storage = memory(),
      map = createLearningMapProgressStorage(storage)
    map.save('math-upper', records, { profileId: 'alice' })
    map.save('chinese', records, { profileId: 'alice' })
    map.save('math-lower', records, { profileId: 'alice' })
    map.save('math-upper', [], { profileId: 'bob' })
    const reloaded = createLearningMapProgressStorage(storage)
    for (const textbook of ['math-upper', 'chinese', 'math-lower'])
      expect(reloaded.load(textbook, { profileId: 'alice' })).toEqual(records)
    expect(reloaded.load('math-upper', { profileId: 'bob' })).toEqual([])
    expect(reloaded.load('math-upper', { profileId: 'alice', dataset: 'demo' })).toEqual([])
  })
  it('migrates the original record without deleting its backup or resurrecting cleared progress', () => {
    const storage = memory()
    const legacy = JSON.stringify({ schemaVersion: 1, textbookId: 'math', records })
    storage.setItem(LEARNING_MAP_PROGRESS_STORAGE_KEY, legacy)
    const map = createLearningMapProgressStorage(storage)
    expect(map.load('math')).toEqual(records)
    map.save('chinese', records)
    expect(map.load('math')).toEqual(records)
    expect(storage.getItem(LEARNING_MAP_PROGRESS_STORAGE_KEY)).toBe(legacy)
    expect(map.load('math', { profileId: 'another-student' })).toEqual([])
    map.clear('math')
    expect(map.load('math')).toEqual([])
    expect(map.load('chinese')).toEqual(records)
  })
  it('preserves malformed v2 data and surfaces a storage failure instead of resetting it', () => {
    const storage = memory()
    storage.setItem(mapProgressStorageKey('math'), '{broken')
    expect(() => createLearningMapProgressStorage(storage).load('math')).toThrow()
    expect(storage.getItem(mapProgressStorageKey('math'))).toBe('{broken')
  })
  it('reactivates a completed review only after new evidence and preserves its completion history', () => {
    const repo = createReviewQueueRepository(createReviewQueueStorage(memory()))
    const item: ReviewQueueItem = {
      id: 'review',
      profileId: 'alice',
      textbookId: 'math',
      knowledgePointId: 'kp',
      recommendationType: 'REINFORCE',
      priority: 1,
      reasonCode: 'WEAK_MASTERY',
      status: 'active',
      sourceStrategyVersion: 'v1',
      sourceRecommendationId: 'recommendation',
      provenance: { isSampleDerived: false },
      reason: {
        code: 'WEAK_MASTERY',
        title: '再练',
        description: '薄弱点',
        masteryScore: 20,
        confidence: 0.5,
        evidenceCount: 2,
      },
    }
    repo.upsert(item)
    repo.complete('alice', item.id, '2026-09-07T01:00:00.000Z')
    repo.upsert(item)
    expect(repo.listByProfile('alice')).toHaveLength(0)
    repo.upsert({ ...item, reason: { ...item.reason, evidenceCount: 3 } })
    expect(repo.listByProfile('alice')).toHaveLength(1)
    expect(repo.listByProfile('alice', { includeCompleted: true })).toHaveLength(2)
  })
  it('records activities idempotently with timestamps and strict profile isolation', () => {
    const storage = memory()
    const event = {
      id: 'activity',
      profileId: 'alice',
      contentId: 'story',
      contentVersion: '1',
      kind: 'quest' as const,
      title: '阅读',
      subject: 'CHINESE' as const,
      occurredAt: '2026-09-07T01:00:00.000Z',
      completedCount: 5,
      mistakeCount: 1,
      href: '/reading-islands/story',
    }
    recordLearningActivity(event, storage)
    recordLearningActivity(event, storage)
    expect(readActivityHistory('alice', storage)).toEqual([event])
    expect(readActivityHistory('bob', storage)).toEqual([])
  })
})
