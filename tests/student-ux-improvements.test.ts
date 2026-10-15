import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { thinkingMissions } from '@/data/thinking/islands'
import {
  thinkingProgressKey,
  freshThinkingProgress,
  withSolvedThinkingPuzzle,
} from '@/services/thinking/thinkingProgressStorage'
import { weeklyCourseChoices } from '@/services/weekly-plan/weeklyCourseChoices'
import {
  practiceResumeHref,
  requestedPracticeChoice,
} from '@/services/student-growth/practiceResume'
import { accountStorage, selectAccount } from '@/services/account/storage'
import { isAccountDataKey } from '@/services/account/contract'
import {
  readLearningContinuations,
  saveLearningContinuation,
} from '@/services/student-growth/learningContinuations'
import {
  readExpressionReviews,
  saveExpression,
  saveParentComment,
} from '@/services/student-growth/expressionReviews'
import { readSchoolProgress, saveSchoolProgress } from '@/services/student-growth/schoolProgress'
import { listResumablePractice } from '@/services/student-growth/currentQuestResolver'
import {
  freshQuestProgress,
  saveQuestProgress,
  questContentRevision,
} from '@/services/content-expansion/questProgressStorage'
import { readingStories } from '@/data/reading-islands'
import { createStoryPractice } from '@/services/reading-islands/readingStoryAdapter'
import { useEnglishReadAloud } from '@/composables/useEnglishReadAloud'
import { contentExpansionRepository } from '@/services/content-expansion'
import { createReadingQuest } from '@/services/content-expansion/readingQuest'

beforeEach(() => {
  selectAccount(null)
  window.localStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  selectAccount(null)
})
const story = readingStories[0]!
const quest = createStoryPractice(story)
const continuation = {
  questId: quest.id,
  title: story.title,
  href: `/reading-islands/${story.id}#reading-challenges`,
  contentRevision: questContentRevision(quest),
  completed: 1,
  total: quest.stages.length,
  finished: false,
  updatedAt: '2026-10-14T08:00:00.000Z',
}

describe('unfinished practice navigation', () => {
  it('keeps all-passed work resumable until its completion feedback is recorded', () => {
    saveLearningContinuation('child-a', { ...continuation, completed: continuation.total })
    expect(readLearningContinuations('child-a')).toHaveLength(1)
    expect(readLearningContinuations('child-b')).toEqual([])
    saveLearningContinuation('child-a', { ...continuation, finished: true })
    expect(readLearningContinuations('child-a')).toEqual([])
  })
  it('restores partial legacy work without trusting a stale or foreign content revision', async () => {
    const progress = {
      ...freshQuestProgress('child-a', quest),
      passedIds: [quest.stages[0]!.id],
      completedStageIds: [quest.stages[0]!.id],
      activeStageId: quest.stages[1]!.id,
    }
    expect(saveQuestProgress(accountStorage, progress, quest)).toBeNull()
    expect(await listResumablePractice('child-a', [])).toMatchObject([
      { questId: quest.id, completed: 1, total: quest.stages.length },
    ])
    expect(await listResumablePractice('child-b', [])).toEqual([])
    saveLearningContinuation('child-a', { ...continuation, contentRevision: 'retired-content' })
    expect(await listResumablePractice('child-a', [])).toEqual([])
  })
  it('rejects external navigation and synchronizes only the new scoped storage families', () => {
    expect(() =>
      saveLearningContinuation('child-a', { ...continuation, href: 'https://example.com' }),
    ).toThrow()
    for (const prefix of ['continuations', 'parent-comments', 'school-progress'])
      expect(isAccountDataKey(`knowledge-island.${prefix}.v1:child-a`)).toBe(true)
    expect(isAccountDataKey('knowledge-island.unknown.v1:child-a')).toBe(false)
  })
})

describe('partial thinking routes', () => {
  it('continues a valid partial route while keeping a sibling fresh and completed routes out of the queue', async () => {
    const mission = thinkingMissions[0]!
    let progress = withSolvedThinkingPuzzle(
      freshThinkingProgress('child-a'),
      mission.id,
      mission.puzzles[0]!.id,
    )!
    accountStorage.setItem(thinkingProgressKey('child-a'), JSON.stringify(progress))
    expect(await listResumablePractice('child-a', [])).toMatchObject([
      {
        href: `/thinking-islands/${mission.islandId}/${mission.id}`,
        completed: 1,
        total: mission.puzzles.length,
      },
    ])
    expect(await listResumablePractice('child-b', [])).toEqual([])
    for (const puzzle of mission.puzzles)
      progress = withSolvedThinkingPuzzle(progress, mission.id, puzzle.id)!
    accountStorage.setItem(thinkingProgressKey('child-a'), JSON.stringify(progress))
    expect(await listResumablePractice('child-a', [])).toEqual([])
  })
})

describe('practice choices and weekly course selection', () => {
  it('resumes the exact strengthened group instead of the last globally selected group', () => {
    const href = practiceResumeHref('/knowledge-point/point?textbookId=book#knowledge-challenges', {
      id: 'training',
      stages: [],
      training: { variantIndex: 1, variantCount: 3 },
    })
    const url = new URL(href, 'https://knowledge-island.local')
    expect(requestedPracticeChoice(Object.fromEntries(url.searchParams))).toEqual({
      mode: 'training',
      variant: 1,
    })
    expect(requestedPracticeChoice({ practiceMode: 'training', practiceVariant: '9' })).toBeNull()
    expect(practiceResumeHref(href, { id: 'foundation', stages: [] })).not.toContain(
      'practiceVariant',
    )
  })
  it('offers an actual selected textbook course without creating completion or reward records', () => {
    const choices = weeklyCourseChoices('child-a', '2026-10-14', [
      {
        code: 'MATH',
        label: '数学',
        color: 'green',
        softColor: 'white',
        icon: 'route',
        textbookId: 'G2_BNU_MATH_S2_2024_REVISED',
        textbookName: '北师大二年级下册',
        mapStatus: 'available',
        progress: { completed: 0, total: 37, percentage: 0 },
        currentKnowledgePointTitle: '谁的得分高',
        isSample: false,
      },
    ])
    expect(choices).toHaveLength(1)
    expect(choices[0]).toMatchObject({
      profileId: 'child-a',
      status: 'pending',
      subject: 'MATH',
      action: { type: 'lesson', launchContext: { knowledgePointId: 'G2_BNU_MATH_S2_2024_KP_01' } },
    })
    expect(accountStorage.length).toBe(0)
    expect(weeklyCourseChoices('child-a', '2026-10-14', [])).toEqual([])
  })
})

describe('family expression feedback', () => {
  it('round-trips a draft and parent comment, keeps siblings separate, and retires comments when the response changes', () => {
    const input = {
      contentId: 'story-expression:a',
      title: '树叶信',
      prompt: '讲讲你的发现',
      response: '我发现树叶可以当信纸。',
      submitted: false,
    }
    saveExpression('child-a', input)
    expect(readExpressionReviews('child-a')[0]?.response).toBe(input.response)
    expect(() => saveParentComment('child-a', input.contentId, '讲得清楚')).toThrow()
    saveExpression('child-a', { ...input, submitted: true })
    saveParentComment('child-a', input.contentId, '你讲清楚了发现，下次再说说依据。')
    expect(readExpressionReviews('child-a')[0]?.comment).toContain('依据')
    expect(readExpressionReviews('child-b')).toEqual([])
    saveExpression('child-a', { ...input, submitted: true, response: '这是另一个想法。' })
    expect(readExpressionReviews('child-a')[0]?.comment).toBe('')
    expect(readExpressionReviews('child-a')[0]?.reviewedAt).toBeUndefined()
    expect(accountStorage.getItem('knowledge-island.mastery-records')).toBeNull()
  })
  it('isolates records by account as well as profile', () => {
    selectAccount('family-a')
    saveExpression('child', {
      contentId: 'a',
      title: '表达',
      prompt: '说一说',
      response: '第一家的内容',
      submitted: true,
    })
    selectAccount('family-b')
    expect(readExpressionReviews('child')).toEqual([])
    selectAccount('family-a')
    expect(readExpressionReviews('child')[0]?.response).toBe('第一家的内容')
  })
})

describe('school bookmarks and comprehension', () => {
  it('remembers school position independently of completion and mastery', () => {
    saveSchoolProgress('child-a', 'book-a', 'node-5')
    expect(readSchoolProgress('child-a', 'book-a')).toBe('node-5')
    expect(readSchoolProgress('child-a', 'book-b')).toBeNull()
    expect(readSchoolProgress('child-b', 'book-a')).toBeNull()
    expect(accountStorage.getItem('knowledge-island.learning-map-progress')).toBeNull()
    saveSchoolProgress('child-a', 'book-a', '')
    expect(readSchoolProgress('child-a', 'book-a')).toBeNull()
  })
  it('asks grade-two poetry readers to explain an action, imagery, and metaphor', async () => {
    const bundle = await contentExpansionRepository.getBundle('G2_PEP_CHINESE_S2_KP_01', 'profile')
    expect(bundle).not.toBeNull()
    const result = createReadingQuest({
      bundle,
      title: '1 古诗二首',
      text: '儿童散学归来早，忙趁东风放纸鸢。不知细叶谁裁出，二月春风似剪刀。',
    })
    expect(result?.stages).toHaveLength(6)
    expect(result?.stages[0]?.explanation).toContain('快乐心情')
    expect(result?.stages.some((stage) => stage.title === '看懂比喻')).toBe(true)
    expect(result?.stages.some((stage) => stage.title === '把方法用起来')).toBe(true)
  })
})

describe('English audio without device voices', () => {
  it('plays a bundled clip, stops on unmount, and never calls a network synthesis endpoint', async () => {
    const players: Array<{
      src: string
      play: ReturnType<typeof vi.fn>
      pause: ReturnType<typeof vi.fn>
      removeAttribute: ReturnType<typeof vi.fn>
      onended: (() => void) | null
      onerror: (() => void) | null
    }> = []
    class FakeAudio {
      src: string
      playbackRate = 1
      preservesPitch = true
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      play = vi.fn(async () => {})
      pause = vi.fn()
      removeAttribute = vi.fn()
      constructor(src: string) {
        this.src = src
        players.push(this)
      }
    }
    vi.stubGlobal('Audio', FakeAudio)
    vi.stubGlobal('speechSynthesis', undefined)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    let reader!: ReturnType<typeof useEnglishReadAloud>
    const harness = defineComponent({
      setup() {
        reader = useEnglishReadAloud(
          ref([{ id: 'one', text: 'Mia has a red bag.', section: 'story' as const }]),
          ref(false),
        )
        return () => null
      },
    })
    const wrapper = mount(harness)
    expect(reader.unavailable.value).toBe('')
    expect(reader.usingBundledAudio.value).toBe(true)
    reader.play()
    await flushPromises()
    expect(players[0]?.src).toMatch(/^\/audio\/basic-english\/.*\.m4a$/)
    expect(reader.state.value).toBe('speaking')
    expect(fetch).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(players[0]?.pause).toHaveBeenCalled()
  })
})
