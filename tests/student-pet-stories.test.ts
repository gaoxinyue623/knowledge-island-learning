import { describe, expect, it } from 'vitest'
import {
  createPetStoryService,
  petStoryStorageKey,
} from '@/services/pet-stories/petStoryService'
import type { SpacedReviewEvidence } from '@/services/student-growth/spacedReview'

class Memory {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

class FailingMemory extends Memory {
  override setItem() { throw new Error('quota') }
}

function evidence(
  profileId = 'a',
  completedAt = '2026-09-01T00:00:00.000Z',
): SpacedReviewEvidence {
  return {
    attemptId: completedAt,
    profileId,
    questId: 'quest',
    contentRevision: 'r1',
    courseHref: '/knowledge-point/kp?textbookId=b&unitId=u&lessonId=l&knowledgePointId=kp#knowledge-challenges',
    title: '数数',
    subject: 'MATH',
    completedAt,
    stages: [{
      stageId: 's',
      prompt: '有几个？',
      firstAttempt: 'independent',
      usedHint: false,
      hadIncorrectAnswer: false,
    }],
  }
}

describe('pet stories', () => {
  it('requires new current-revision evidence after opening before review completes', () => {
    const service = createPetStoryService(new Memory(), () => '2026-09-02T00:00:00.000Z')
    const oldEvidence = evidence()

    expect(service.list('a', [oldEvidence], { quest: 'r1' })[0]!.chapters[0]!.completed).toBe(false)
    expect(service.open('a', oldEvidence)).toBe(true)
    expect(service.list('a', [oldEvidence], { quest: 'r1' })[0]!.chapters[0]!.completed).toBe(false)

    const newEvidence = evidence('a', '2026-09-03T00:00:00.000Z')
    expect(service.list('a', [oldEvidence, newEvidence], { quest: 'r1' })[0]!.chapters[0]!.completed).toBe(true)
    expect(service.list('a', [oldEvidence, newEvidence], { quest: 'r2' })).toEqual([])
  })

  it('keeps self-reported chapters separate from evidence and other profiles', () => {
    const service = createPetStoryService(new Memory())
    const originalEvidence = evidence()
    expect(service.open('a', originalEvidence)).toBe(true)

    expect(service.selfReport('a', 'quest', 'r1', 'expression')).toBe(true)
    const ownStory = service.list('a', [originalEvidence], { quest: 'r1' })[0]!
    expect(ownStory.chapters.find((chapter) => chapter.id === 'expression')!.completed).toBe(true)
    expect(ownStory.chapters.find((chapter) => chapter.id === 'review')!.completed).toBe(false)
    expect(originalEvidence.completedAt).toBe('2026-09-01T00:00:00.000Z')

    const otherStory = service.list('b', [evidence('b')], { quest: 'r1' })[0]!
    expect(otherStory.chapters.find((chapter) => chapter.id === 'expression')!.completed).toBe(false)
  })

  it('has an honest empty state for no evidence and fails closed on corrupt storage', () => {
    const storage = new Memory()
    const service = createPetStoryService(storage)
    expect(service.list('a', [], {})).toEqual([])
    storage.setItem(petStoryStorageKey('a'), 'bad')
    expect(service.load('a')).toEqual([])
    expect(service.getLastWarning()).toContain('无法读取')
    expect(service.open('a', evidence())).toBe(false)
    expect(storage.getItem(petStoryStorageKey('a'))).toBe('bad')
  })

  it('does not mark progress complete when storage cannot save', () => {
    const service = createPetStoryService(new FailingMemory())
    const originalEvidence = evidence()
    expect(service.open('a', originalEvidence)).toBe(false)
    expect(service.getLastWarning()).toContain('无法保存')
    expect(service.list('a', [originalEvidence], { quest: 'r1' })[0]!.chapters.every((chapter) => !chapter.completed)).toBe(true)
  })

  it('rejects foreign evidence and keeps self-reports idempotent', () => {
    const storage = new Memory()
    let date = '2026-09-02T00:00:00.000Z'
    const service = createPetStoryService(storage, () => date)
    expect(service.open('a', evidence('b'))).toBe(false)
    expect(storage.values.size).toBe(0)
    expect(service.open('a', evidence())).toBe(true)
    expect(service.selfReport('a', 'quest', 'r1', 'expression')).toBe(true)
    const original = storage.getItem(petStoryStorageKey('a'))
    date = '2026-09-03T00:00:00.000Z'
    expect(service.selfReport('a', 'quest', 'r1', 'expression')).toBe(true)
    expect(storage.getItem(petStoryStorageKey('a'))).toBe(original)
    const payload = JSON.parse(original!)
    payload.records.push(payload.records[0])
    storage.setItem(petStoryStorageKey('a'), JSON.stringify(payload))
    expect(service.open('a', evidence())).toBe(false)
    expect(service.getLastWarning()).toContain('无法读取')
  })
})
