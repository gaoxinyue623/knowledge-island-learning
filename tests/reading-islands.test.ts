import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { chineseReadingStories } from '@/data/reading-islands/chinese'
import { englishReadingStories } from '@/data/reading-islands/english'
import {
  readingDiagnostics,
  readingStories,
  filterReadingStories,
  validateReadingLibrary,
  findReadingStory,
  readingLength,
} from '@/data/reading-islands'
import {
  READING_ISLANDS_SOURCE,
  readingStorySchema,
  type ReadingStory,
} from '@/types/reading-islands'
import {
  createStoryPractice,
  readingStoryBlocks,
  readingStorySpeechBlocks,
} from '@/services/reading-islands/readingStoryAdapter'
import { checkQuestAnswer, emptyQuestDraft } from '@/services/content-expansion/readingQuest'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import { buildEnglishReadingSegments } from '@/services/lesson-player/englishReading'
import { questionSchema } from '@/services/validation/schemas'
import { interactiveActivitySchema } from '@/services/validation/contentExpansionValidation'
import ReadingStoryExperience from '@/components/reading-islands/ReadingStoryExperience.vue'
import ReadingIslandsPage from '@/pages/ReadingIslandsPage.vue'
import ReadingStoryPage from '@/pages/ReadingStoryPage.vue'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { QUEST_PROGRESS_PREFIX } from '@/services/content-expansion/questProgressStorage'
import DragMatchActivity from '@/components/interactive-activity/DragMatchActivity.vue'
import SortOrderActivity from '@/components/interactive-activity/SortOrderActivity.vue'
import { useStudentStore } from '@/stores/studentStore'
import appRouter from '@/router'

const mounts: VueWrapper[] = []
let write: ReturnType<typeof vi.fn>
beforeEach(() => {
  write = vi.fn()
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: write, removeItem: write })
  setActivePinia(createPinia())
})
afterEach(() => {
  for (const wrapper of mounts.splice(0)) wrapper.unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const chinese = readingStories[0]!,
  english = readingStories.find((s) => s.id === 'en-picnic-box')!
const button = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll('button').find((b) => b.text() === label)!

describe('Original reading library and content boundaries', () => {
  it('contains twelve valid original stories, balanced across language and level', () => {
    expect(readingDiagnostics).toEqual([])
    expect(readingStories).toHaveLength(12)
    for (const language of ['chinese', 'english'] as const)
      for (const level of ['starter', 'growing'] as const)
        expect(filterReadingStories({ language, level })).toHaveLength(3)
    expect(READING_ISLANDS_SOURCE).toMatchObject({
      authorship: 'AI_ASSISTED_ORIGINAL',
      textbookDerived: false,
      humanReviewed: false,
    })
    expect(new Set(readingStories.map((s) => s.id)).size).toBe(12)
  })

  it('filters by titles, Chinese subtitles, themes and vocabulary without modifying data', () => {
    const original = JSON.stringify(readingStories)
    expect(filterReadingStories({ search: ' RED BAG ' }).map((s) => s.id)).toEqual(['en-red-bag'])
    expect(filterReadingStories({ search: '月亮小店' }).map((s) => s.id)).toEqual(['en-moon-shop'])
    expect(filterReadingStories({ language: 'chinese', search: 'bag' })).toEqual([])
    expect(filterReadingStories({ search: '换位思考' })[0]?.id).toBe('zh-library-sign')
    expect(findReadingStory('missing')).toBeUndefined()
    expect(JSON.stringify(readingStories)).toBe(original)
  })

  it('fails safely for malformed stories and duplicates, retaining a diagnostic', () => {
    const bad = { ...chinese, detail: { ...chinese.detail, answers: ['not an option'] } }
    const result = validateReadingLibrary([null, bad, chinese, chinese])
    expect(result.stories.map((s) => s.id)).toEqual([chinese.id])
    expect(result.diagnostics).toHaveLength(3)
    expect(validateReadingLibrary([])).toEqual({ stories: [], diagnostics: [] })
  })

  it.each([
    ['dangling evidence', { ...chinese, sequence: { ...chinese.sequence, evidence: [99] } }],
    [
      'duplicate choices',
      { ...chinese, detail: { ...chinese.detail, options: ['a', 'a', 'b'], answers: ['a'] } },
    ],
    [
      'ambiguous matching',
      { ...chinese, vocabulary: [chinese.vocabulary[0], ...chinese.vocabulary.slice(0, 3)] },
    ],
    ['missing translation', { ...english, translations: [] }],
    [
      'Chinese mixed into English',
      { ...english, paragraphs: ['hello 你好', ...english.paragraphs.slice(1)] },
    ],
    [
      'missing repeated letter',
      { ...english, wordPractice: { ...english.wordPractice, tiles: ['e', 'g', 'a'] } },
    ],
  ])('rejects %s', (_, story) => {
    expect(readingStorySchema.safeParse(story).success).toBe(false)
  })

  it.each(readingStories.map((story) => [story.id, story] as const))(
    'keeps every %s stage deterministic, typed, solvable and independent of textbooks',
    (_, story) => {
      const before = JSON.stringify(story)
      const quest = createStoryPractice(story)
      expect(createStoryPractice(story)).toEqual(quest)
      expect(quest).not.toHaveProperty('textbookId')
      expect(quest.stages).toHaveLength(story.language === 'english' ? 7 : 6)
      expect(new Set(quest.stages.map((s) => s.id)).size).toBe(quest.stages.length)
      for (const stage of quest.stages) {
        expect(stage.hint.length).toBeGreaterThan(5)
        expect(stage.explanation.length).toBeGreaterThan(5)
        expect(stage.context).toContain('线索')
        if (stage.kind === 'question') {
          expect(questionSchema.safeParse(stage.question).success).toBe(true)
          expect(stage.question).not.toHaveProperty('textbookVersionId')
          expect(stage.question).not.toHaveProperty('knowledgePointId')
          expect(stage.question.sourceId).toBe(READING_ISLANDS_SOURCE.id)
          expect(stage.question.verificationStatus).toBe('UNVERIFIED')
          expect(checkQuestAnswer(stage.question, emptyQuestDraft(stage.question))).toBe(
            'incomplete',
          )
          expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
            'correct',
          )
          if (stage.question.questionType === 'fillBlank') {
            expect(
              checkQuestAnswer(stage.question, { type: 'fillBlank', values: ['not-the-answer'] }),
            ).toBe('incorrect')
          }
        } else {
          expect(interactiveActivitySchema.safeParse(stage.activity).success).toBe(true)
          if (stage.activity.activityType === 'sort_order') {
            expect(stage.activity.config.items.map((item) => item.id)).not.toEqual(
              stage.activity.config.correctOrder,
            )
            const actual = stage.activity.config.correctOrder.map(
              (id) =>
                stage.activity.activityType === 'sort_order' &&
                stage.activity.config.items.find((i) => i.id === id)?.label,
            )
            expect(actual).toEqual(
              stage.id.endsWith(':sequence') ? story.sequence.events : story.sentence?.chunks,
            )
          }
        }
      }
      for (const [key, task] of [
        ['detail', story.detail],
        ['reasoning', story.reasoning],
        ['transfer', story.transfer],
      ] as const) {
        const stage = quest.stages.find((s) => s.id.endsWith(':' + key))!
        expect(stage.kind).toBe('question')
        if (stage.kind !== 'question') continue
        const selected = stage.question.options!.filter((o) =>
          task.answers.includes(o.content[0]!.text!),
        )
        expect(
          checkQuestAnswer(
            stage.question,
            task.answers.length === 1
              ? { type: 'singleChoice', optionId: selected[0]!.id }
              : { type: 'multipleChoice', optionIds: selected.map((o) => o.id) },
          ),
        ).toBe('correct')
        const wrong = stage.question.options!.find(
          (o) => !task.answers.includes(o.content[0]!.text!),
        )!
        expect(
          checkQuestAnswer(
            stage.question,
            task.answers.length === 1
              ? { type: 'singleChoice', optionId: wrong.id }
              : { type: 'multipleChoice', optionIds: [...selected.map((o) => o.id), wrong.id] },
          ),
        ).toBe('incorrect')
      }
      expect(JSON.stringify(story)).toBe(before)
      expect(write).not.toHaveBeenCalled()
    },
  )

  it('has 78 closed stages, 48 vocabulary cards and twelve non-scored expression prompts', () => {
    expect(readingStories.flatMap((s) => createStoryPractice(s).stages)).toHaveLength(78)
    expect(readingStories.flatMap((s) => s.vocabulary)).toHaveLength(48)
    expect(readingStories.every((s) => s.expression.checklist.length === 3)).toBe(true)
  })

  it('preserves the exact original text and derives length instead of hard-coding it', () => {
    for (const story of readingStories) {
      const blocks = readingStoryBlocks(story)
      expect(blocks[0]?.content).toBe(story.paragraphs.join('\n\n'))
      expect(blocks[0]?.title).toBe(`《${story.title}》`)
      expect(readingLength(story)).toMatch(/^\d+ (字|个英文词)$/)
    }
    expect(
      validateReadingLibrary([...chineseReadingStories, ...englishReadingStories]).diagnostics,
    ).toEqual([])
  })

  it('provides story and word listening without speaking Chinese translations or answer hints', () => {
    for (const story of readingStories.filter((s) => s.language === 'english')) {
      const segments = buildEnglishReadingSegments(readingStorySpeechBlocks(story))
      expect(segments.some((s) => s.section === 'story')).toBe(true)
      expect(segments.filter((s) => s.section === 'words').map((s) => s.text)).toEqual(
        story.vocabulary.map((v) => v.word),
      )
      expect(segments.every((s) => !/\p{Script=Han}/u.test(s.text))).toBe(true)
      expect(segments.map((s) => s.text).join(' ')).not.toContain(story.expression.sample)
    }
    expect(readingStorySpeechBlocks(chinese)).toEqual([])
  })
})

async function finishStory(wrapper: VueWrapper, story: ReadingStory) {
  const quest = wrapper.findComponent(ReadingQuest)
  for (const stage of createStoryPractice(story).stages) {
    if (stage.kind === 'question') {
      if (stage.question.options) {
        const source = stage.id.endsWith(':detail')
          ? story.detail
          : stage.id.endsWith(':reasoning')
            ? story.reasoning
            : story.transfer
        const choices = stage.question.options.filter((o) =>
          source.answers.includes(o.content[0]!.text!),
        )
        for (const option of choices) await quest.get(`input[value="${option.id}"]`).setValue(true)
      } else {
        const chars =
          story.language === 'english'
            ? [...story.wordPractice.answer]
            : [story.wordPractice.answer]
        for (const char of chars) {
          const tile = quest
            .findAll('.reading-quest__tiles button')
            .find((b) => b.text() === char && b.attributes('disabled') === undefined)!
          await tile.trigger('click')
        }
      }
      await button(quest, '检查答案').trigger('click')
    } else if (stage.activity.activityType === 'drag_match') {
      const activity = quest.findComponent(DragMatchActivity)
      for (const word of story.vocabulary) {
        await button(activity, word.word).trigger('click')
        await button(activity, word.meaning).trigger('click')
      }
    } else {
      const activity = quest.findComponent(SortOrderActivity)
      const labels = stage.id.endsWith(':sequence') ? story.sequence.events : story.sentence!.chunks
      for (const label of labels) await button(activity, label).trigger('click')
      await button(activity, '检查顺序').trigger('click')
    }
    expect(quest.find('.reading-quest__success').exists(), stage.id).toBe(true)
    const next = quest.findAll('button').find((b) => ['下一关', '查看闯关小结'].includes(b.text()))!
    await next.trigger('click')
  }
  expect(quest.find('.reading-quest__summary').exists()).toBe(true)
}

describe('Reading routes and interactive practice', () => {
  it('keeps the reading library in place when search or filters change', async () => {
    const library = appRouter.resolve('/reading-islands?language=english')
    const filtered = appRouter.resolve('/reading-islands?language=english&q=bag')
    const detail = appRouter.resolve('/reading-islands/en-red-bag')
    expect(await appRouter.options.scrollBehavior!(filtered, library, null)).toBe(false)
    expect(await appRouter.options.scrollBehavior!(detail, library, null)).toEqual({ top: 0 })
  })
  async function page(path: string) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/reading-islands', component: ReadingIslandsPage },
        { path: '/reading-islands/:storyId', component: ReadingStoryPage },
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ],
    })
    await router.push(path)
    await router.isReady()
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [router, createPinia()] } },
    )
    mounts.push(wrapper)
    await flushPromises()
    return { router, wrapper }
  }

  it('offers language and level filters, searching, and a recoverable empty state', async () => {
    const { wrapper, router } = await page('/reading-islands?language=english&level=starter')
    expect(wrapper.findAll('.reading-story-card')).toHaveLength(3)
    await wrapper.get('input[type="search"]').setValue('no matching story')
    await flushPromises()
    expect(wrapper.find('.reading-empty').exists()).toBe(true)
    await button(wrapper, '查看全部故事').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.reading-story-card')).toHaveLength(12)
    await wrapper.get('input[value="chinese"]').setValue(true)
    await flushPromises()
    expect(router.currentRoute.value.query.language).toBe('chinese')
    expect(wrapper.findAll('.reading-story-card')).toHaveLength(6)
    await wrapper.get('select').setValue('growing')
    await flushPromises()
    expect(wrapper.findAll('.reading-story-card')).toHaveLength(3)
    expect(write).not.toHaveBeenCalled()
  })

  it('preserves filters on return, handles unknown routes, and needs no chosen textbook', async () => {
    const { wrapper, router } = await page(
      '/reading-islands/en-red-bag?language=english&level=starter',
    )
    expect(wrapper.get('h1').text()).toBe('《The Red Bag》')
    expect(wrapper.get('.reading-breadcrumb a').attributes('href')).toContain('language=english')
    expect(wrapper.text()).toContain('英语跟读角')
    expect(wrapper.text()).not.toContain('课文原文')
    await router.push('/reading-islands/missing')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('这个故事暂时找不到')
    expect(wrapper.findComponent(ReadingStoryExperience).exists()).toBe(false)
  })

  it.each([chinese, english])(
    'completes $id through cards, matching and order, writing only independent quest progress',
    async (story) => {
      const wrapper = mount(ReadingStoryExperience, {
        props: { story, profileId: 'reader-a', muted: false },
        global: { plugins: [createPinia()] },
      })
      mounts.push(wrapper)
      expect(
        wrapper
          .findAll('.reading-quest__trail button')
          .slice(1)
          .every((b) => b.attributes('disabled') !== undefined),
      ).toBe(true)
      await finishStory(wrapper, story)
      expect(write).toHaveBeenCalled()
      expect(
        write.mock.calls.every(
          ([key]) =>
            String(key).startsWith(QUEST_PROGRESS_PREFIX) ||
            String(key).startsWith('knowledge-island.activities.v1:'),
        ),
      ).toBe(true)
      await button(wrapper, '全部再闯一次').trigger('click')
      expect(wrapper.get('.reading-quest__counter strong').text()).toContain('0')
    },
  )

  it('lets a wrong choice be retried, gives help, and resets practice and expression on profile changes', async () => {
    const wrapper = mount(ReadingStoryExperience, {
      props: { story: chinese, profileId: 'reader-a', muted: false },
      global: { plugins: [createPinia()] },
    })
    mounts.push(wrapper)
    const stage = createStoryPractice(chinese).stages[0]!
    if (stage.kind !== 'question') throw new Error('Expected choice')
    const wrong = stage.question.options!.find(
      (o) => !chinese.detail.answers.includes(o.content[0]!.text!),
    )!
    await wrapper.get(`input[value="${wrong.id}"]`).setValue(true)
    await button(wrapper, '检查答案').trigger('click')
    expect(wrapper.find('.reading-quest__success').exists()).toBe(false)
    await button(wrapper, '给我一点提示').trigger('click')
    expect(wrapper.get('#quest-hint').text()).toContain(chinese.detail.hint)
    await wrapper.get('.reading-self-check input').setValue(true)
    await button(wrapper, '看一个表达示例').trigger('click')
    await wrapper.setProps({ profileId: 'reader-b' })
    expect(wrapper.find('#reading-expression-sample').exists()).toBe(false)
    expect((wrapper.get('.reading-self-check input').element as HTMLInputElement).checked).toBe(
      false,
    )
    expect(wrapper.get('.reading-quest__counter strong').text()).toContain('0')
    expect(
      write.mock.calls.every(
        ([key]) =>
          String(key).startsWith(QUEST_PROGRESS_PREFIX) ||
          String(key).startsWith('knowledge-island.activities.v1:'),
      ),
    ).toBe(true)
  })

  it('remounts learner-scoped practice when the story or active learner changes', async () => {
    const { wrapper, router } = await page('/reading-islands/en-red-bag')
    const original = wrapper.findComponent(ReadingStoryExperience).vm
    useStudentStore().profile = { id: 'reader-b', displayName: '新读者' }
    await flushPromises()
    expect(wrapper.findComponent(ReadingStoryExperience).vm === original).toBe(false)
    await router.push('/reading-islands/zh-leaf-letter')
    await flushPromises()
    expect(wrapper.find('.english-listener').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('《树叶信》')
    expect(wrapper.get('.reading-quest__counter strong').text()).toContain('0')
  })
})
