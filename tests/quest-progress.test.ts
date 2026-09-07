import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryQuestStorage } from './helpers/questStorage'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { readingStories } from '@/data/reading-islands'
import { createStoryPractice } from '@/services/reading-islands/readingStoryAdapter'
import {
  freshQuestProgress,
  readQuestProgress,
  saveQuestProgress,
  questProgressKey,
  questContentRevision,
  questProgressSchema,
  type QuestStorage,
} from '@/services/content-expansion/questProgressStorage'
import { lessonProgressPresentation } from '@/services/lesson-player/lessonProgressPresentation'
import type { ReadingPracticeQuest, QuestQuestionStage } from '@/types/reading-quest'
import type { LessonPlayerSessionViewModel } from '@/types'

const original = createStoryPractice(readingStories[0]!).stages[0] as QuestQuestionStage
const quest: ReadingPracticeQuest = {
  id: 'test:book-a:lesson-a',
  training: { variantIndex: 0, variantCount: 3 },
  stages: [0, 1, 2].map((index) => ({
    ...structuredClone(original),
    id: `stage-${index}`,
    title: `第${index + 1}关`,
    question: {
      ...structuredClone(original.question),
      id: `question-${index}`,
      questionType: 'trueFalse',
      options: undefined,
      answerRule: { ruleType: 'BOOLEAN', correctValue: true },
    },
  })),
}
function memory(): QuestStorage {
  const records = new Map<string, string>()
  return {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => {
      records.set(key, value)
    },
  }
}
const progress = () => ({
  ...freshQuestProgress('child-a', quest),
  passedIds: ['stage-0'],
  completedStageIds: ['stage-0'],
  activeStageId: 'stage-1',
})
const button = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find((b) => b.text() === label)!
enableAutoUnmount(afterEach)
beforeEach(() => vi.stubGlobal('localStorage', memoryQuestStorage()))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Independent quest persistence', () => {
  it('validates version one and round-trips without answer or question copies', () => {
    const storage = memory(),
      data = progress()
    expect(questProgressSchema.safeParse(data).success).toBe(true)
    expect(saveQuestProgress(storage, data, quest)).toBeNull()
    expect(readQuestProgress(storage, 'child-a', quest)).toMatchObject({
      data,
      writable: true,
      resumed: true,
    })
    const raw = storage.getItem(questProgressKey('child-a', quest.id))!
    expect(raw).not.toContain('answerRule')
    expect(raw).not.toContain('stem')
  })
  it('isolates learners, books and variants, including forged profile payloads', () => {
    const storage = memory()
    saveQuestProgress(storage, progress(), quest)
    for (const [profileId, id] of [
      ['child-b', quest.id],
      ['child-a', 'book-b'],
      ['child-a', quest.id + ':variant-2'],
    ] as const) {
      expect(readQuestProgress(storage, profileId, { ...quest, id }).data.passedIds).toEqual([])
    }
    storage.setItem(questProgressKey('child-b', quest.id), JSON.stringify(progress()))
    expect(readQuestProgress(storage, 'child-b', quest).writable).toBe(false)
  })
  it.each([
    '{broken',
    JSON.stringify({ ...progress(), schemaVersion: 2 }),
    JSON.stringify({ ...progress(), passedIds: ['stage-2'] }),
    JSON.stringify({ ...progress(), passedIds: ['stage-0', 'stage-0'] }),
    JSON.stringify({ ...progress(), activeStageId: 'stage-2' }),
    JSON.stringify({ ...progress(), summaryVisible: true }),
  ])('preserves unreadable, future or impossible progress without overwriting it', (raw) => {
    const storage = memory(),
      key = questProgressKey('child-a', quest.id)
    storage.setItem(key, raw)
    const result = readQuestProgress(storage, 'child-a', quest)
    expect(result.writable).toBe(false)
    expect(result.warning).toContain('原记录已保留')
    expect(storage.getItem(key)).toBe(raw)
    expect(result.data.passedIds).toEqual([])
  })
  it('invalidates changed prompts and provenance while leaving the old record untouched until new work is saved', () => {
    const storage = memory(),
      key = questProgressKey('child-a', quest.id)
    saveQuestProgress(storage, progress(), quest)
    const raw = storage.getItem(key)
    const changed = structuredClone(quest)
    ;(changed.stages[0] as QuestQuestionStage).question.stem = [{ type: 'TEXT', text: '新版题目' }]
    expect(questContentRevision(changed)).not.toBe(questContentRevision(quest))
    const result = readQuestProgress(storage, 'child-a', changed)
    expect(result.data.passedIds).toEqual([])
    expect(result.warning).toContain('题目已更新')
    expect(result.writable).toBe(true)
    expect(storage.getItem(key)).toBe(raw)
    ;(changed.stages[0] as QuestQuestionStage).question.isSample = true
    expect(questContentRevision(changed)).not.toBe(result.data.contentRevision)
  })
  it('handles unavailable storage and write failures without reporting a saved result', () => {
    expect(readQuestProgress(undefined, 'child-a', quest).writable).toBe(false)
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota')
      },
    }
    expect(saveQuestProgress(storage, progress(), quest)).toContain('没能保存')
  })
  it('restores passed stages, mistakes, hints and the current stage after remount', async () => {
    const props = { quest, profileId: 'child-a' }
    const first = mount(ReadingQuest, { props })
    await first.findAll('.reading-quest__boolean button')[1]!.trigger('click')
    await button(first, '检查答案').trigger('click')
    await button(first, '给我一点提示').trigger('click')
    await first.find('.reading-quest__boolean button').trigger('click')
    await button(first, '检查答案').trigger('click')
    await button(first, '下一关').trigger('click')
    await first.find('.reading-quest__boolean button').trigger('click')
    await button(first, '检查答案').trigger('click')
    await button(first, '下一关').trigger('click')
    first.unmount()
    const resumed = mount(ReadingQuest, { props })
    expect(resumed.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('2')
    expect(resumed.get('#quest-stage-title').text()).toBe('第3关')
    expect(resumed.text()).toContain('已接上上次的进度')
    await resumed.find('.reading-quest__boolean button').trigger('click')
    await button(resumed, '检查答案').trigger('click')
    await button(resumed, '查看闯关小结').trigger('click')
    expect(resumed.text()).toContain('首次独立通过 2 关')
    expect(resumed.text()).toContain('1 关使用过提示')
    resumed.unmount()
    const summary = mount(ReadingQuest, { props })
    expect(summary.text()).toContain('这一轮，全部通过')
    await button(summary, '再练错过的关卡').trigger('click')
    summary.unmount()
    const review = mount(ReadingQuest, { props })
    expect(review.get('[role="progressbar"]').attributes('aria-valuemax')).toBe('1')
    expect(review.text()).toContain('这些关卡，再来试试看')
    expect(readQuestProgress(localStorage, 'child-a', quest).data.completedStageIds).toHaveLength(3)
  })
  it('requires confirmation before restarting and retains completed footprints', async () => {
    saveQuestProgress(localStorage, progress(), quest)
    const wrapper = mount(ReadingQuest, { props: { quest, profileId: 'child-a' } })
    await button(wrapper, '从第一关重练').trigger('click')
    await button(wrapper, '继续当前关卡').trigger('click')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    await button(wrapper, '从第一关重练').trigger('click')
    await button(wrapper, '确认重新练习').trigger('click')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(readQuestProgress(localStorage, 'child-a', quest).data.completedStageIds).toHaveLength(1)
  })
  it('never overwrites corrupt storage even after playing and leaving', async () => {
    const key = questProgressKey('child-a', quest.id)
    localStorage.setItem(key, 'broken')
    const wrapper = mount(ReadingQuest, { props: { quest, profileId: 'child-a' } })
    await wrapper.find('.reading-quest__boolean button').trigger('click')
    await button(wrapper, '检查答案').trigger('click')
    wrapper.unmount()
    expect(localStorage.getItem(key)).toBe('broken')
  })
})

describe('Lesson progress presentation', () => {
  const session: LessonPlayerSessionViewModel = {
    id: 'lesson',
    status: 'completed',
    progress: 0,
    completedCount: 2,
    totalCount: 2,
    currentStepIndex: 1,
    completedStepIds: ['a', 'b'],
  }
  it('shows a completed session as 100 percent, not a stale entry-link percentage', () => {
    expect(lessonProgressPresentation(session, false)).toEqual({
      status: 'completed',
      progress: 100,
    })
  })
  it('shows in-progress steps without claiming mastery or unlocking a locked node', () => {
    expect(
      lessonProgressPresentation({ ...session, status: 'in_progress', progress: 50 }, false),
    ).toEqual({ status: 'learning', progress: 50 })
    expect(lessonProgressPresentation(session, true)).toEqual({ status: 'locked', progress: 0 })
    expect(lessonProgressPresentation(undefined, false)).toEqual({
      status: 'available',
      progress: 0,
    })
  })
})
