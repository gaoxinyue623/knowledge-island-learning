import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EnglishReadAloud from '@/components/lesson-player/EnglishReadAloud.vue'
import LessonReadingPanel from '@/components/lesson-player/LessonReadingPanel.vue'
import { useEnglishReadAloud } from '@/composables/useEnglishReadAloud'
import { gradeOneShenzhenEnglishUpperCourseContents } from '@/data/curriculum/grade-1/english-shanghai-upper'
import { gradeOneShenzhenEnglishLowerCourseContents } from '@/data/curriculum/grade-1/english-shanghai-lower'
import { gradeTwoShenzhenEnglishUpperCourseContents } from '@/data/curriculum/grade-2/english-shanghai-upper'
import {
  buildEnglishReadingSegments,
  type EnglishReadingSegment,
} from '@/services/lesson-player/englishReading'
import type { LessonContentBlockViewModel } from '@/types'

function block(content: string, id = 'english', sort = 1): LessonContentBlockViewModel {
  return { id, content, sort, type: 'intro', isSample: false }
}

describe('English reading projection', () => {
  it('separates sentences, removes role names and Chinese, preserves contractions and repetition', () => {
    const result = buildEnglishReadingSegments([
      block(
        'Ready-Go\r\nListen, then point and say\r\n1. I’m cold. 我冷。\n—How are you? 你好吗？\nStory：The pot 锅\nGrandma: Cook, cook! Stop! 奶奶：停下！\nGrandma: Cook, cook!\n妈妈说：read 是读。',
      ),
    ])
    expect(result.map((item) => item.text)).toEqual([
      'I’m cold.',
      'How are you?',
      'Cook, cook!',
      'Stop!',
      'Cook, cook!',
    ])
    expect(result[2]).toMatchObject({ speaker: 'Grandma', section: 'story' })
    expect(result[4]?.id).not.toBe(result[2]?.id)
  })

  it('preserves apostrophes/hyphens and avoids English-looking fragments of Chinese translations', () => {
    const result = buildEnglishReadingSegments([
      block(
        'one pencil case 1个笔袋\nT-shirt T恤衫\n单词：T-shirtT恤，grandma（外）祖母，toy bear 玩具熊\n核心句型：I need a ...\n课后练习：Try it.',
      ),
    ])
    expect(result.map((item) => item.text)).toEqual([
      'one pencil case',
      'T-shirt',
      'T-shirt',
      'grandma',
      'toy bear',
    ])
  })

  it('skips unsupported/practice content, frames, headings and repeated summaries', () => {
    const blocks = [
      block(
        'Unit 1 Family\nPage 2\nI can ...\nI like ____.\nListen and chant\nHi!\n核心单词：hi你好\n核心句型：Hi!',
      ),
    ]
    blocks.push({ ...block('The answer is cat.', 'answer'), type: 'practice' })
    blocks.push({ ...block('Unknown data.', 'unknown'), type: 'unknown' })
    expect(buildEnglishReadingSegments(blocks).map((item) => item.text)).toEqual(['Hi!'])
  })

  it('supports vocabulary-only revision and bounds long utterances without changing source', () => {
    const source = [
      block(
        'Revision 1 复习\n复习所学单词。\n核心单词：mum（妈妈）、dad（爸爸）\n核心句型：This is my ...',
      ),
    ]
    const before = JSON.stringify(source)
    expect(buildEnglishReadingSegments(source).map((item) => item.text)).toEqual(['mum', 'dad'])
    expect(JSON.stringify(source)).toBe(before)
    const long = 'A little bird '.repeat(40) + 'sings.'
    const segments = buildEnglishReadingSegments([block(long)])
    expect(segments.every((item) => item.text.length <= 160)).toBe(true)
    expect(segments.map((item) => item.text).join(' ')).toBe(long)
  })

  it('orders stably by sort then ID, including paragraphs and bullets, with repeatable IDs', () => {
    const blocks = [
      block('Bye!', 'b'),
      { ...block('Hi!', 'a'), paragraphs: ['Hello!'], bullets: ['Welcome!'] },
    ]
    const before = JSON.stringify(blocks)
    const result = buildEnglishReadingSegments(blocks)
    expect(result.map((item) => item.text)).toEqual(['Hi!', 'Hello!', 'Welcome!', 'Bye!'])
    expect(buildEnglishReadingSegments([...blocks].reverse())).toEqual(result)
    expect(new Set(result.map((item) => item.id)).size).toBe(result.length)
    expect(JSON.stringify(blocks)).toBe(before)
  })

  it.each([
    ['G1 upper', gradeOneShenzhenEnglishUpperCourseContents],
    ['G1 lower', gradeOneShenzhenEnglishLowerCourseContents],
    ['G2 upper', gradeTwoShenzhenEnglishUpperCourseContents],
  ] as const)(
    'projects every current %s lesson/revision without Chinese or source mutation',
    (_, records) => {
      for (const record of records) {
        const blocks = (record.body['blocks'] as { text: string }[]).map((item, i) => ({
          ...block(item.text, `${record.id}:${i}`, i),
          title: i === 0 ? record.title : undefined,
        }))
        const before = JSON.stringify(blocks)
        const result = buildEnglishReadingSegments(blocks)
        expect(result.length, record.id).toBeGreaterThan(0)
        expect(
          result.every((item) => !/\p{Script=Han}|_{2,}|\.{3}/u.test(item.text)),
          record.id,
        ).toBe(true)
        expect(new Set(result.map((item) => item.id)).size).toBe(result.length)
        expect(JSON.stringify(blocks)).toBe(before)
        if (/Unit/i.test(record.title)) {
          expect(new Set(result.map((item) => item.section))).toEqual(
            new Set(['dialogue', 'chant', 'story', 'words']),
          )
        }
      }
    },
  )
})

class FakeUtterance {
  text: string
  lang = ''
  voice: SpeechSynthesisVoice | null = null
  rate = 1
  pitch = 1
  volume = 1
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

function voice(lang: string, localService = true): SpeechSynthesisVoice {
  return { name: `Voice ${lang}`, lang, localService, default: false, voiceURI: lang }
}

class FakeSpeech extends EventTarget {
  voices = [voice('zh-CN'), voice('en-GB')]
  paused = false
  utterances: FakeUtterance[] = []
  getVoices = vi.fn(() => this.voices)
  cancel = vi.fn()
  resume = vi.fn()
  speak = vi.fn((utterance: FakeUtterance) => {
    this.utterances.push(utterance)
  })
  get last() {
    return this.utterances.at(-1)!
  }
}

let engine: FakeSpeech
const wrappers: VueWrapper[] = []
function harness() {
  const segments = ref<EnglishReadingSegment[]>([
    { id: '1', text: 'Hello, Mum!', section: 'dialogue' },
    { id: '2', text: 'I like apples.', section: 'dialogue' },
  ])
  const muted = ref(false)
  let reader!: ReturnType<typeof useEnglishReadAloud>
  const wrapper = mount(
    defineComponent({
      setup() {
        reader = useEnglishReadAloud(segments, muted)
        return () => null
      },
    }),
  )
  wrappers.push(wrapper)
  return { reader, segments, muted, wrapper }
}

beforeEach(() => {
  vi.useFakeTimers()
  engine = new FakeSpeech()
  vi.stubGlobal('speechSynthesis', engine)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
})
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Read-aloud lifecycle', () => {
  it('does not autoplay, selects only English voices, uses selected rate and stops for imitation', () => {
    const { reader } = harness()
    expect(engine.speak).not.toHaveBeenCalled()
    expect(reader.voice.value?.lang).toBe('en-GB')
    reader.rate.value = 0.7
    reader.play()
    expect(reader.state.value).toBe('starting')
    expect(engine.last).toMatchObject({ text: 'Hello, Mum!', lang: 'en-GB', rate: 0.7, volume: 1 })
    engine.last.onstart?.()
    expect(reader.state.value).toBe('speaking')
    engine.last.onend?.()
    expect(reader.state.value).toBe('waiting')
    expect(engine.speak).toHaveBeenCalledTimes(1)
    reader.move(1)
    expect(engine.last.text).toBe('I like apples.')
  })

  it('reads continuously in order, finishes, and restarts from the beginning on request', () => {
    const { reader } = harness()
    reader.mode.value = 'continuous'
    reader.play()
    engine.last.onend?.()
    expect(reader.index.value).toBe(1)
    engine.last.onend?.()
    expect(reader.state.value).toBe('finished')
    expect(engine.speak).toHaveBeenCalledTimes(2)
    reader.play()
    expect(engine.last.text).toBe('Hello, Mum!')
  })

  it('pauses safely, restarts the same sentence and ignores old cancellation callbacks', () => {
    const { reader } = harness()
    reader.mode.value = 'continuous'
    reader.play()
    const staleEnd = engine.last.onend
    const staleError = engine.last.onerror
    reader.play()
    expect(reader.state.value).toBe('paused')
    staleEnd?.()
    staleError?.()
    expect(reader.state.value).toBe('paused')
    expect(reader.index.value).toBe(0)
    reader.play()
    expect(engine.speak).toHaveBeenCalledTimes(2)
    expect(engine.last.text).toBe('Hello, Mum!')
  })

  it('replays only the current sentence even in continuous mode and rejects out-of-range selections', () => {
    const { reader } = harness()
    reader.mode.value = 'continuous'
    reader.replay()
    engine.last.onend?.()
    expect(reader.state.value).toBe('waiting')
    expect(engine.speak).toHaveBeenCalledTimes(1)
    reader.select(-1)
    reader.select(100)
    reader.select(0.5)
    expect(reader.index.value).toBe(0)
    reader.select(1)
    expect(reader.index.value).toBe(1)
    expect(engine.speak).toHaveBeenCalledTimes(1)
  })

  it('stops on mode/speed/mute/content changes, with no automatic restart', () => {
    const { reader, muted, segments } = harness()
    for (const change of [
      () => {
        reader.rate.value = 1
      },
      () => {
        reader.mode.value = 'continuous'
      },
      () => {
        segments.value = [{ id: 'new', text: 'A new lesson.', section: 'words' }]
      },
      () => {
        muted.value = true
      },
    ]) {
      reader.play()
      change()
      expect(reader.state.value).toBe('idle')
    }
    expect(engine.speak).toHaveBeenCalledTimes(4)
    reader.play()
    expect(engine.speak).toHaveBeenCalledTimes(4)
    expect(reader.unavailable.value).toContain('已静音')
  })

  it('handles delayed/missing voices without falling back to Chinese or autoplaying', () => {
    engine.voices = [voice('zh-CN')]
    const { reader } = harness()
    reader.play()
    expect(reader.unavailable.value).toContain('暂未找到英语声音')
    expect(engine.speak).not.toHaveBeenCalled()
    engine.voices.push(voice('en-US', false), voice('en-GB'))
    engine.dispatchEvent(new Event('voiceschanged'))
    expect(reader.voice.value?.localService).toBe(true)
    expect(reader.unavailable.value).toBe('')
    expect(engine.speak).not.toHaveBeenCalled()
    reader.play()
    engine.voices = []
    engine.dispatchEvent(new Event('voiceschanged'))
    expect(reader.state.value).toBe('idle')
  })

  it('handles absent APIs without preventing normal reading', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    const { reader } = harness()
    reader.play()
    expect(reader.supported.value).toBe(false)
    expect(reader.unavailable.value).toContain('暂不支持朗读')
    expect(engine.speak).not.toHaveBeenCalled()
  })

  it('recovers from speech errors, thrown engines and silent start timeouts', () => {
    const { reader } = harness()
    reader.play()
    engine.last.onerror?.()
    expect(reader.state.value).toBe('error')
    reader.play()
    vi.advanceTimersByTime(8000)
    expect(reader.error.value).toContain('没有启动')
    engine.speak.mockImplementationOnce(() => {
      throw new Error('disconnected')
    })
    reader.play()
    expect(reader.state.value).toBe('error')
    reader.play()
    engine.last.onstart?.()
    expect(reader.error.value).toBe('')
    vi.advanceTimersByTime(60000)
    expect(reader.error.value).toContain('中断')
  })

  it('cleans up voice listeners, timers and speech on unmount, with no stale continuation', () => {
    const { reader, wrapper } = harness()
    reader.mode.value = 'continuous'
    reader.play()
    const staleEnd = engine.last.onend
    const calls = engine.getVoices.mock.calls.length
    wrapper.unmount()
    staleEnd?.()
    vi.runAllTimers()
    engine.dispatchEvent(new Event('voiceschanged'))
    expect(engine.getVoices).toHaveBeenCalledTimes(calls)
    expect(engine.speak).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops when hidden and never resumes on return', () => {
    const { reader } = harness()
    reader.play()
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(reader.state.value).toBe('idle')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(engine.speak).toHaveBeenCalledTimes(1)
  })

  it('allows only one active reader and does not cancel it when another idle reader unmounts', () => {
    const first = harness()
    const second = harness()
    first.reader.play()
    second.reader.play()
    expect(first.reader.state.value).toBe('idle')
    expect(second.reader.state.value).toBe('starting')
    const cancels = engine.cancel.mock.calls.length
    first.wrapper.unmount()
    expect(engine.cancel).toHaveBeenCalledTimes(cancels)
  })
})

describe('English read-aloud UI', () => {
  async function render(muted = false) {
    const wrapper = mount(EnglishReadAloud, {
      props: {
        blocks: [block('Hello! 你好。\nListen and chant\nI see a cat.\n单词：cat猫')],
        muted,
      },
    })
    wrappers.push(wrapper)
    await nextTick()
    return wrapper
  }

  it('provides labelled controls, sentence replay, speed and section selection', async () => {
    const wrapper = await render()
    expect(wrapper.text()).toContain('设备合成朗读，不是教材原声')
    expect(engine.speak).not.toHaveBeenCalled()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '听这一句')!
      .trigger('click')
    engine.last.onend?.()
    await nextTick()
    expect(wrapper.get('[role="status"]').text()).toContain('轮到你啦')
    await wrapper.get('select[id$="-rate"]').setValue('0.7')
    await wrapper.get('select[id$="-section"]').setValue('words')
    expect(wrapper.get('.english-listener__text').text()).toBe('cat')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重听这句')!
      .trigger('click')
    expect(engine.last).toMatchObject({ text: 'cat', rate: 0.7 })
    expect(wrapper.emitted('start-assessment')).toBeUndefined()
    await wrapper.setProps({ blocks: [block('New lesson.', 'new')] })
    expect(wrapper.get('.english-listener__text').text()).toBe('New lesson.')
    expect(wrapper.get<HTMLSelectElement>('select[id$="-section"]').element.value).toBe('all')
  })

  it('disables audio while muted and points to existing settings without changing preferences', async () => {
    const wrapper = await render(true)
    expect(wrapper.get('[role="status"]').text()).toContain('已静音')
    expect(wrapper.get('a').attributes('href')).toBe('/settings')
    expect(
      wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined),
    ).toBe(true)
    expect(engine.speak).not.toHaveBeenCalled()
  })

  it('shows an honest unsupported fallback but keeps source text, and stays absent from other subjects', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    for (const subject of ['english', 'chinese', 'math'] as const) {
      const wrapper = mount(LessonReadingPanel, {
        props: { blocks: [block('Hello! 你好。')], subject },
      })
      wrappers.push(wrapper)
      expect(wrapper.findComponent(EnglishReadAloud).exists()).toBe(subject === 'english')
      expect(wrapper.get('.reading-text-block__body').text()).toBe('Hello! 你好。')
      if (subject === 'english') expect(wrapper.text()).toContain('暂不支持朗读')
    }
  })

  it('detects voices on request and shows an empty-text message when nothing can be read', async () => {
    engine.voices = []
    const wrapper = await render()
    expect(wrapper.text()).toContain('重新检测声音')
    engine.voices = [voice('en-US', false)]
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重新检测声音')!
      .trigger('click')
    expect(wrapper.text()).toContain('可能需要联网')
    await wrapper.setProps({ blocks: [block('这是一段中文。')] })
    expect(wrapper.get('[role="status"]').text()).toContain('没有可朗读的英文')
  })
})
