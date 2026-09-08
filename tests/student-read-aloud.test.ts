import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import StudentReadAloud from '@/components/common/StudentReadAloud.vue'
import { curriculumData } from '@/data/curriculum'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import { createReadingQuest, questReadingText } from '@/services/content-expansion/readingQuest'
import { usePreferencesStore } from '@/stores/preferencesStore'
import type { ContentBlock } from '@/types'
import type { QuestQuestionStage } from '@/types/reading-quest'
import { memoryQuestStorage } from './helpers/questStorage'

class FakeUtterance {
  lang = ''
  rate = 1
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly text: string) {}
}

class FakeSpeech {
  paused = false
  utterances: FakeUtterance[] = []
  cancel = vi.fn()
  speak = vi.fn((utterance: FakeUtterance) => this.utterances.push(utterance))
  get last() {
    return this.utterances.at(-1)!
  }
}

const repository = new StaticContentExpansionRepository()
const mathBundle = (await repository.listBundles('candidate')).find(
  (bundle) => bundle.knowledgePointId === 'G2_SHENZHEN_MATH_S1_KP_01',
)!
function mathQuest() {
  const content = curriculumData.courseContents.find(
    (item) => item.knowledgePointId === mathBundle.knowledgePointId,
  )!
  const blocks = content.body.blocks as ContentBlock[]
  return createReadingQuest({
    bundle: mathBundle,
    title: content.title,
    text: questReadingText(
      blocks.map((block, index) => ({
        id: String(index),
        type: 'intro',
        content: block.text,
        isSample: content.isSample,
        sort: index,
      })),
    ),
  })!
}

let engine: FakeSpeech
beforeEach(() => {
  engine = new FakeSpeech()
  vi.stubGlobal('speechSynthesis', engine)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('localStorage', memoryQuestStorage())
})
afterEach(() => vi.unstubAllGlobals())

describe('StudentReadAloud', () => {
  it('only starts Chinese browser speech after an explicit click and stops stale callbacks', async () => {
    const wrapper = mount(StudentReadAloud, {
      props: { text: '题干：选出苹果。\nA 苹果\nB 香蕉', scope: 'child-a:question-1' },
    })
    expect(engine.speak).not.toHaveBeenCalled()
    await wrapper.get('button').trigger('click')
    expect(engine.last).toMatchObject({
      text: '题干：选出苹果。\nA 苹果\nB 香蕉',
      lang: 'zh-CN',
    })
    engine.last.onstart?.()
    await wrapper.setProps({ scope: 'child-b:question-1' })
    expect(engine.cancel).toHaveBeenCalled()
    engine.last.onend?.()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('offers a stop control, times out when speech never starts, and does not let stale owners stop newer speech', async () => {
    vi.useFakeTimers()
    const first = mount(StudentReadAloud, { props: { text: '第一题', scope: 'first' } })
    await first.get('button').trigger('click')
    expect(first.text()).toContain('停止朗读')
    await first.findAll('button')[1]!.trigger('click')
    expect(first.find('[role="status"]').exists()).toBe(false)

    const second = mount(StudentReadAloud, { props: { text: '第二题', scope: 'second' } })
    await first.get('button').trigger('click')
    const stale = engine.last
    await second.get('button').trigger('click')
    stale.onstart?.()
    await vi.advanceTimersByTimeAsync(8000)
    expect(second.get('[role="status"]').text()).toContain('没有启动')
    const cancelsBeforeUnmount = engine.cancel.mock.calls.length
    first.unmount()
    expect(engine.cancel).toHaveBeenCalledTimes(cancelsBeforeUnmount)
    expect(engine.last.text).toBe('第二题')
    vi.useRealTimers()
  })

  it('reports mute and unsupported speech without blocking the reading task', async () => {
    const muted = mount(StudentReadAloud, { props: { text: '题干', muted: true } })
    await muted.get('button').trigger('click')
    expect(engine.speak).not.toHaveBeenCalled()
    expect(muted.get('[role="status"]').text()).toContain('已静音')
    muted.unmount()

    vi.stubGlobal('speechSynthesis', undefined)
    const unsupported = mount(StudentReadAloud, { props: { text: '题干' } })
    await unsupported.get('button').trigger('click')
    expect(unsupported.get('[role="status"]').text()).toContain('暂不支持')
  })
})

describe('Math ReadingQuest read aloud', () => {
  it('reads only the current visible question and revealed hint', async () => {
    const quest = mathQuest()
    const stage = quest.stages.find(
      (item): item is QuestQuestionStage =>
        item.kind === 'question' && Boolean(item.question.options?.length),
    )!
    const wrapper = mount(ReadingQuest, {
      props: { quest: { ...quest, stages: [stage] }, profileId: 'child-a' },
      global: { plugins: [createPinia()] },
    })
    const expectedQuestion = [
      stage.question.stem.map((block) => block.text ?? '').join('\n'),
      ...stage.question.options!.map((option) =>
        option.content.map((block) => block.text ?? '').join(' '),
      ),
    ].join('\n')
    expect(wrapper.findAll('[data-test="student-read-aloud"]')).toHaveLength(1)
    await wrapper.get('[data-test="student-read-aloud"] button').trigger('click')
    expect(engine.last.text).toBe(expectedQuestion)
    expect(engine.last.text).not.toContain(stage.hint)
    expect(engine.last.text).not.toContain(stage.explanation)

    await wrapper.find('.reading-quest__hint-toggle').trigger('click')
    const readers = wrapper.findAll('[data-test="student-read-aloud"]')
    expect(readers).toHaveLength(2)
    await readers[1]!.get('button').trigger('click')
    expect(engine.last.text).toBe(stage.hint)
  })

  it('honors the persisted app mute preference without blocking choices', async () => {
    const pinia = createPinia()
    const quest = mathQuest()
    const stage = quest.stages.find(
      (item): item is QuestQuestionStage =>
        item.kind === 'question' && Boolean(item.question.options?.length),
    )!
    const wrapper = mount(ReadingQuest, {
      props: { quest: { ...quest, stages: [stage] }, profileId: 'child-a' },
      global: { plugins: [pinia] },
    })
    usePreferencesStore(pinia).save({ reducedMotion: false, muted: true, showTranscript: true })
    await nextTick()
    expect(wrapper.findComponent(StudentReadAloud).props('muted')).toBe(true)
    await wrapper.get('[data-test="student-read-aloud"] button').trigger('click')
    expect(engine.speak).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('已静音')
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
