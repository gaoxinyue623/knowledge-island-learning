import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import TenFrameWorkshop from '@/components/hands-on/TenFrameWorkshop.vue'
import EvidenceWorkshop from '@/components/hands-on/EvidenceWorkshop.vue'
import ListenPlaceWorkshop from '@/components/hands-on/ListenPlaceWorkshop.vue'
import ThinkingPlayer from '@/components/thinking/ThinkingPlayer.vue'
import LowerMathVisual from '@/components/knowledge-point/LowerMathVisual.vue'
import QuestTraining from '@/components/knowledge-point/QuestTraining.vue'
import ReadingStoryExperience from '@/components/reading-islands/ReadingStoryExperience.vue'
import {
  storyEvidencePractice,
  textbookEvidencePractice,
} from '@/services/content-expansion/evidencePractice'
import { readingStories } from '@/data/reading-islands'
import { readingQuestionSeeds } from '@/data/content-expansion/reading-quest-seeds'
import { curriculumData } from '@/data/curriculum'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import {
  createReadingQuest,
  questReadingText,
  englishPracticeFor,
} from '@/services/content-expansion/readingQuest'
import type { ContentBlock } from '@/types'
import { thinkingMissions } from '@/data/thinking/islands'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { memoryQuestStorage } from './helpers/questStorage'

const button = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!
const click = async (wrapper: VueWrapper, text: string) => {
  await button(wrapper, text).trigger('click')
}
const story = readingStories.find((s) => s.id === 'zh-leaf-letter')!
const practice = storyEvidencePractice(story)!
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.stubGlobal('localStorage', memoryQuestStorage())
  vi.stubGlobal('speechSynthesis', undefined)
  setActivePinia(createPinia())
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Hands-on ten frame', () => {
  it('conserves sticks, rejects occupied cells, reveals decomposition only after filling ten', async () => {
    const wrapper = mount(TenFrameWorkshop, { props: { a: 8, b: 6 } })
    const sticks = () => wrapper.findAll('.ten-workshop__pool button')
    const slots = () => wrapper.findAll('.ten-workshop__frame button')
    expect(sticks()).toHaveLength(6)
    expect(wrapper.find('.hands-on__success').exists()).toBe(false)
    await sticks()[0]!.trigger('click')
    await slots()[0]!.trigger('click')
    expect(sticks()).toHaveLength(6)
    expect(wrapper.text()).toContain('每格只能放一根')
    await sticks()[0]!.trigger('click')
    await slots()[8]!.trigger('click')
    expect(sticks()).toHaveLength(5)
    await slots()[9]!.trigger('click')
    expect(sticks()).toHaveLength(5)
    await sticks()[0]!.trigger('click')
    await slots()[9]!.trigger('click')
    expect(wrapper.findAll('.ten-workshop__frame .workshop-stick')).toHaveLength(10)
    expect(sticks()).toHaveLength(4)
    expect(wrapper.get('.hands-on__success').text()).toContain('6 分成 2 和 4')
    expect(wrapper.get('.hands-on__success').text()).toContain('10 ＋ 4 ＝ 14')
    await click(wrapper, '取回一根')
    expect(sticks()).toHaveLength(5)
    expect(wrapper.find('.hands-on__success').exists()).toBe(false)
    await click(wrapper, '重新摆一摆')
    expect(sticks()).toHaveLength(6)
    await wrapper.setProps({ a: 9, b: 5 })
    expect(sticks()).toHaveLength(5)
    expect(wrapper.findAll('.ten-workshop__frame .workshop-stick')).toHaveLength(9)
  })
  it('uses the same checked move for pointer dragging, rejects drops outside this workshop and cleans up on unmount', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TenFrameWorkshop, { props: { a: 9, b: 5 } })
    const hit = vi.fn()
    vi.stubGlobal('document', document)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hit })
    const pointer = async (type: string, target: EventTarget = window, x = 20) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.assign(event, { button: 0, isPrimary: true, pointerId: 1, clientX: x, clientY: 10 })
      target.dispatchEvent(event)
      await nextTick()
    }
    const stick = () => wrapper.get('.ten-workshop__pool button')
    const foreign = document.createElement('button')
    foreign.dataset.dropZone = '9'
    hit.mockReturnValue(foreign)
    await pointer('pointerdown', stick().element)
    await pointer('pointermove', window, 100)
    expect(wrapper.find('.workshop-drag-ghost').exists()).toBe(true)
    await pointer('pointerup', window, 100)
    expect(wrapper.findAll('.ten-workshop__pool button')).toHaveLength(5)
    await vi.advanceTimersByTimeAsync(1)
    hit.mockReturnValue(wrapper.get('[data-drop-zone="9"]').element)
    await pointer('pointerdown', stick().element)
    await pointer('pointermove', window, 100)
    await pointer('pointerup', window, 100)
    await stick().trigger('click') // synthetic click must not select another stick
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(0)
    expect(wrapper.findAll('.ten-workshop__pool button')).toHaveLength(4)
    expect(wrapper.find('.hands-on__success').exists()).toBe(true)
    await pointer('pointerdown', stick().element)
    wrapper.unmount()
    const calls = hit.mock.calls.length
    await pointer('pointermove', window, 100)
    await pointer('pointerup', window, 100)
    expect(hit).toHaveBeenCalledTimes(calls)
    Reflect.deleteProperty(document, 'elementFromPoint')
  })
  it('does not replace the previous ten-bridge demonstration, and skips subtraction/invalid inputs', () => {
    const add = mount(LowerMathVisual, {
      props: { visual: { type: 'ten-bridge', operation: 'add', a: 9, b: 5 } },
    })
    expect(add.findComponent(TenFrameWorkshop).exists()).toBe(false)
    expect(button(add, '看看怎样凑十')).toBeTruthy()
    expect(add.find('.lower-ten-groups').exists()).toBe(true)
    const sub = mount(LowerMathVisual, {
      props: { visual: { type: 'ten-bridge', operation: 'subtract', a: 14, b: 9 } },
    })
    expect(sub.findComponent(TenFrameWorkshop).exists()).toBe(false)
    for (const props of [
      { a: 2, b: 3 },
      { a: 10, b: 4 },
      { a: 8, b: -1 },
      { a: 7.5, b: 5 },
    ])
      expect(mount(TenFrameWorkshop, { props }).find('section').exists()).toBe(false)
  })
})

describe('Source evidence and ordering with explanation', () => {
  it('projects all six Chinese stories without rewriting source and excludes English or absent evidence', () => {
    const before = JSON.stringify(readingStories)
    const chinese = readingStories.filter((s) => s.language === 'chinese')
    expect(chinese).toHaveLength(6)
    for (const s of chinese) {
      const p = storyEvidencePractice(s)
      expect(p, s.id).not.toBeNull()
      expect(
        p!.paragraphs
          .flatMap((v) => v.sentences)
          .map((v) => v.text)
          .join(''),
      ).toBe(s.paragraphs.join(''))
      expect(p!.evidenceIds.length).toBeGreaterThan(0)
      expect(p!.sequence.map((v) => v.text)).toEqual(s.sequence.events)
      expect(storyEvidencePractice(s)).toEqual(p)
    }
    expect(storyEvidencePractice({ ...story, paragraphs: ['没有对应证据。'] })).toBeNull()
    expect(storyEvidencePractice(readingStories.find((s) => s.language === 'english')!)).toBeNull()
    expect(JSON.stringify(readingStories)).toBe(before)
  })
  it('requires matching textbook evidence and a source-ordered sequence before offering the workshop', () => {
    const seed = readingQuestionSeeds.find((s) => s.textbookId)!
    const source = seed.evidence + '。第一件事情已经完成。第二件事情接着发生。最后大家回家休息。'
    const result = textbookEvidencePractice(seed.title, source, seed.textbookId!)
    expect(result).not.toBeNull()
    expect(textbookEvidencePractice(seed.title, '原文里没有证据。', seed.textbookId!)).toBeNull()
    expect(textbookEvidencePractice('不存在的课文', source, seed.textbookId!)).toBeNull()
    expect(textbookEvidencePractice(seed.title, source, 'UNRELATED_TEXTBOOK')).toBeNull()
  })
  it('does not use a repeated lesson title or appended teaching notes as passage evidence', () => {
    const text =
      '《春夏秋冬》\n春风吹，夏雨落。\n秋霜降，冬雪飘。\n鱼出水，鸟入林。\n课后练习：鱼出水，鸟入林。'
    const p = textbookEvidencePractice('春夏秋冬', text, 'G1_PEP_CHINESE_S2_2024_CANDIDATE')!
    expect(
      p.paragraphs
        .flatMap((v) => v.sentences)
        .map((v) => v.text)
        .join(''),
    ).toBe('春风吹，夏雨落。秋霜降，冬雪飘。鱼出水，鸟入林。')
    expect(p.sequence[0]!.text).toBe('春风吹，夏雨落。')
    expect(
      textbookEvidencePractice(
        '春夏秋冬',
        '其他文章内容。\n课后练习：鱼出水，鸟入林。',
        'G1_PEP_CHINESE_S2_2024_CANDIDATE',
      ),
    ).toBeNull()
  })
  it('reports eligible imported lessons, retaining original quest projections and content', async () => {
    const bundles = await new StaticContentExpansionRepository().listBundles('candidate')
    const before = JSON.stringify(bundles)
    const coverage: Record<string, number> = {}
    let math = 0,
      english = 0
    for (const bundle of bundles) {
      const content = curriculumData.courseContents
        .filter((c) => c.knowledgePointId === bundle.knowledgePointId)
        .sort((a, b) => b.currentVersion - a.currentVersion || a.id.localeCompare(b.id))[0]
      if (!content) continue
      const title = curriculumData.lessons.find((l) => l.id === bundle.lessonId)!.title
      const text = questReadingText(
        (content.body.blocks as ContentBlock[]).map((b, i) => ({
          id: String(i),
          sort: i,
          type: 'intro',
          content: b.text,
          isSample: false,
        })),
      )
      const input = { bundle, title, text }
      const original = createReadingQuest(input)
      if (!original) continue
      if (original.subject === 'MATH') {
        if (
          original.stages.some(
            (s) => s.visual?.type === 'ten-bridge' && s.visual.operation === 'add',
          )
        ) {
          math += 1
          if (math === 1) {
            const wrapper = mount(QuestTraining, {
              props: { ...input, quest: original, profileId: 'integration' },
            })
            expect(wrapper.findComponent(TenFrameWorkshop).exists()).toBe(true)
            expect(wrapper.find('.reading-quest').exists()).toBe(true)
            expect(wrapper.find('.math-visual .ten-workshop').exists()).toBe(false)
            const frame = wrapper.findComponent(TenFrameWorkshop)
            await frame.get('.ten-workshop__pool button').trigger('click')
            await wrapper.setProps({ profileId: 'integration-other' })
            expect(wrapper.findAll('.ten-workshop [aria-pressed="true"]')).toHaveLength(0)
          }
        }
      } else if (englishPracticeFor(original.knowledgePointId)) english += 1
      else {
        const p = textbookEvidencePractice(title, text, original.textbookId)
        if (p) {
          coverage[original.textbookId] = (coverage[original.textbookId] ?? 0) + 1
          const sentences = p.paragraphs.flatMap((v) => v.sentences)
          expect(p.evidenceIds.every((id) => sentences.some((s) => s.id === id))).toBe(true)
          expect(p.sequence.every((s) => sentences.some((v) => v.text === s.text))).toBe(true)
          expect(sentences.some((s) => /^(课后练习|学习重点|小练习)/.test(s.text))).toBe(false)
        }
      }
      expect(createReadingQuest(input)).toEqual(original)
    }
    expect(math).toBeGreaterThan(0)
    expect(english).toBe(38)
    expect(Object.keys(coverage).length).toBeGreaterThan(2)
    expect(JSON.stringify(bundles)).toBe(before)
    console.info('Hands-on coverage', { math, english, chinese: coverage })
  })
  it('marks actual source sentences, rejects unrelated/excess selections, and gates oral reflection on correct ordering', async () => {
    const wrapper = mount(EvidenceWorkshop, { props: { practice, profileId: 'p1' } })
    const selected = () => wrapper.findAll('.evidence-workshop__paper button[aria-pressed="true"]')
    await wrapper.get('[data-sentence-id="p0s0"]').trigger('click')
    await click(wrapper, '检查我的证据')
    expect(wrapper.find('.is-verified').exists()).toBe(false)
    for (const id of practice.evidenceIds)
      await wrapper.get(`[data-sentence-id="${id}"]`).trigger('click')
    await click(wrapper, '检查我的证据')
    expect(wrapper.find('.is-verified').exists()).toBe(false)
    await wrapper.get('[data-sentence-id="p0s0"]').trigger('click')
    await click(wrapper, '检查我的证据')
    expect(selected()).toHaveLength(practice.evidenceIds.length)
    expect(wrapper.find('.is-verified').exists()).toBe(true)
    for (const event of [...practice.sequence].reverse()) await click(wrapper, event.text)
    await click(wrapper, '检查顺序，准备说理由')
    expect(wrapper.find('.hands-on__say').exists()).toBe(false)
    for (const card of wrapper.findAll('.evidence-workshop__order button'))
      await card.trigger('click')
    for (const event of practice.sequence) await click(wrapper, event.text)
    await click(wrapper, '检查顺序，准备说理由')
    expect(wrapper.get('.hands-on__say').text()).toContain('因为原文说')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.text()).toContain('表达已自查')
    await wrapper.get('.evidence-workshop__order button').trigger('click')
    expect(wrapper.find('.hands-on__say').exists()).toBe(false)
    await wrapper.setProps({ profileId: 'p2' })
    expect(selected()).toHaveLength(0)
    expect(wrapper.findAll('.evidence-workshop__order button')).toHaveLength(0)
  })
})

describe('Listen, place, then say', () => {
  const english = () =>
    mount(ListenPlaceWorkshop, { props: { profileId: 'p1', contextId: 'en1', muted: false } })
  async function place(wrapper: VueWrapper, item: string, zone: string) {
    await wrapper.get(`button[aria-label="选择${item}"]`).trigger('click')
    await wrapper.get(`button[aria-label="放到${zone}"]`).trigger('click')
  }
  it('has usable text fallback and lets children correct placements, then self-check each spoken sentence', async () => {
    const wrapper = english()
    expect(button(wrapper, '听这一句指令').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('由家人读指令')
    expect(wrapper.find('.hands-on__hint').exists()).toBe(false)
    await click(wrapper, '需要文字帮助')
    expect(wrapper.get('.hands-on__hint').text()).toContain('Put the ball under the desk.')
    await place(wrapper, 'ball · 球', '书桌上面')
    await click(wrapper, '检查摆放位置')
    expect(wrapper.find('.hands-on__say').exists()).toBe(false)
    await wrapper.get('button[aria-label="移动ball · 球，当前在书桌上面"]').trigger('click')
    await wrapper.get('button[aria-label="放到书桌下面"]').trigger('click')
    await click(wrapper, '检查摆放位置')
    expect(wrapper.get('.hands-on__say').text()).toContain('The ball is under the desk.')
    expect(button(wrapper, '下一句指令').attributes('disabled')).toBeDefined()
    await wrapper.get('input').setValue(true)
    await click(wrapper, '下一句指令')
    expect(wrapper.find('.hands-on__hint').exists()).toBe(false)
    await place(wrapper, 'book · 书', '书桌上面')
    await click(wrapper, '检查摆放位置')
    await wrapper.get('input').setValue(true)
    await click(wrapper, '下一句指令')
    await place(wrapper, 'teddy bear · 玩具熊', '盒子里面')
    await click(wrapper, '检查摆放位置')
    await wrapper.get('input').setValue(true)
    await click(wrapper, '完成这次口语练习')
    expect(wrapper.text()).toContain('你完成了三个摆物场景和口头自查')
    expect(wrapper.findAll('.listen-place__placed .workshop-object')).toHaveLength(3)
    await wrapper.setProps({ contextId: 'another-book' })
    expect(wrapper.findAll('.listen-place__placed .workshop-object')).toHaveLength(0)
    expect(wrapper.text()).toContain('场景 1 / 3')
  })
  it('plays only on request and cancels speech on mute, context switch and unmount', async () => {
    class Utterance {
      constructor(public text: string) {}
    }
    const speech = {
      getVoices: () => [{ lang: 'en-GB', name: 'Test English', localService: true }],
      speak: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal('speechSynthesis', speech)
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
    const wrapper = english()
    expect(speech.speak).not.toHaveBeenCalled()
    await nextTick()
    await click(wrapper, '听这一句指令')
    expect(speech.speak.mock.lastCall![0].text).toBe('Put the ball under the desk.')
    await wrapper.setProps({ muted: true })
    expect(speech.cancel).toHaveBeenCalled()
    expect(button(wrapper, '听这一句指令').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ muted: false })
    await click(wrapper, '听这一句指令')
    let calls = speech.cancel.mock.calls.length
    await wrapper.setProps({ contextId: 'en2' })
    expect(speech.cancel.mock.calls.length).toBeGreaterThan(calls)
    await click(wrapper, '听这一句指令')
    calls = speech.cancel.mock.calls.length
    wrapper.unmount()
    expect(speech.cancel.mock.calls.length).toBeGreaterThan(calls)
  })
})

describe('Illustrated thinking route', () => {
  const player = () =>
    mount(ThinkingPlayer, {
      props: {
        mission: thinkingMissions.find((m) => m.id === 'direction-guide')!,
        profileId: 'path1',
      },
      global: { stubs: { RouterLink: true } },
    })
  it('replaces letter cells with drawings, moves one square per animation, blocks rocks and backtracks', async () => {
    vi.useFakeTimers()
    const wrapper = player()
    expect(wrapper.get('.thinking-path-board').text()).toBe('')
    expect(wrapper.findAll('.thinking-path-board .workshop-object').length).toBeGreaterThan(0)
    const actor = () => wrapper.get('.thinking-path-actor')
    const start = actor().attributes('style')
    await click(wrapper, '向上走')
    expect(actor().classes()).toContain('is-moving')
    expect(actor().attributes('style')).not.toBe(start)
    await click(wrapper, '向上走')
    expect(wrapper.get('.thinking-path-status').text()).toContain('已走 1 / 4')
    await vi.advanceTimersByTimeAsync(300)
    await click(wrapper, '撤回一步')
    await vi.advanceTimersByTimeAsync(300)
    expect(actor().attributes('style')).toBe(start)
    for (const label of ['向右走', '向右走', '向上走', '向上走']) {
      await click(wrapper, label)
      await vi.advanceTimersByTimeAsync(300)
    }
    expect(wrapper.get('.thinking-path-board .is-goal').attributes('aria-label')).toContain(
      '团子现在的位置',
    )
    await click(wrapper, '检查方案')
    expect(wrapper.text()).toContain('这个任务通过啦')
  })
  it('respects reduced motion and resets movement when profile changes', async () => {
    usePreferencesStore().preferences.reducedMotion = true
    const wrapper = player()
    await click(wrapper, '向右走')
    await click(wrapper, '向右走')
    expect(wrapper.get('.thinking-path-status').text()).toContain('已走 2 / 4')
    expect(wrapper.get('.thinking-path-stage').classes()).toContain('is-reduced-motion')
    expect(wrapper.get('.thinking-path-actor').classes()).not.toContain('is-moving')
    await wrapper.setProps({ profileId: 'path2' })
    expect(wrapper.get('.thinking-path-status').text()).toContain('已走 0 / 4')
  })
})

it('adds workshops beside the original story quest rather than changing question content or persisted identity', () => {
  const storageWrite = vi.spyOn(localStorage, 'setItem')
  const wrapper = mount(ReadingStoryExperience, {
    props: { story, profileId: 'p1', muted: true },
    global: { stubs: { LessonReadingPanel: true } },
  })
  expect(wrapper.findComponent(EvidenceWorkshop).exists()).toBe(true)
  expect(wrapper.find('.reading-quest').exists()).toBe(true)
  expect(storageWrite).not.toHaveBeenCalled()
})
