import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import LessonContentRenderer from '@/components/lesson-player/LessonContentRenderer.vue'
import LessonReadingPanel from '@/components/lesson-player/LessonReadingPanel.vue'
import ReadingTextBlock from '@/components/lesson-player/ReadingTextBlock.vue'
import { gradeOneChineseLowerCourseContents } from '@/data/curriculum/grade-1/chinese-pep-lower'
import { gradeOneShenzhenEnglishUpperCourseContents } from '@/data/curriculum/grade-1/english-shanghai-upper'
import { demoLessonPlayerSource } from '@/data/lesson-player/demo'
import {
  buildLessonPlayerViewModel,
  createLessonSession,
} from '@/services/lesson-player/lessonPlayerAdapter'
import type { LessonContentBlockViewModel } from '@/types'

function block(overrides: Partial<LessonContentBlockViewModel> = {}): LessonContentBlockViewModel {
  return {
    id: 'reader-block',
    type: 'intro',
    content: '先读一读，再想一想。',
    isSample: false,
    verificationStatus: 'UNVERIFIED',
    sort: 1,
    ...overrides,
  }
}

const compact = (text: string) => text.replace(/\s/g, '')

describe('Book-style lesson text presentation', () => {
  it('separates stanzas while keeping poem line breaks and title brackets', () => {
    const wrapper = mount(ReadingTextBlock, {
      props: {
        block: block({
          title: '《春夏秋冬》',
          content:
            '《春夏秋冬》\n\n春风吹，夏雨落。\n秋霜降，冬雪飘。\n\n池草青，山花红。\n鱼出水，鸟入林。',
        }),
      },
    })
    expect(wrapper.get('h3').text()).toBe('《春夏秋冬》')
    expect(
      wrapper.findAll('.reading-text-block__body > p').map((p) => p.element.textContent),
    ).toEqual(['春风吹，夏雨落。\n秋霜降，冬雪飘。', '池草青，山花红。\n鱼出水，鸟入林。'])
    expect(wrapper.text().match(/《春夏秋冬》/g)).toHaveLength(1)
    expect(wrapper.classes()).toContain('reading-text-block--short-lines')
  })

  it('keeps long narrative paragraphs in the full reading column', () => {
    const wrapper = mount(ReadingTextBlock, {
      props: {
        block: block({
          content:
            '小朋友们在书页里发现了许多有趣的事情，他们一边阅读，一边把自己的发现说给身边的同伴听。\n\n先读一读。\n再想一想。',
        }),
      },
    })
    expect(wrapper.classes()).not.toContain('reading-text-block--short-lines')
  })

  it('only removes an exact first-line title, not similar text or later occurrences', () => {
    const source = '影子在前。\n\n《影子》\n影子在后。'
    const wrapper = mount(ReadingTextBlock, {
      props: { block: block({ title: '《影子》', content: source }) },
    })
    expect(compact(wrapper.get('.reading-text-block__body').text())).toBe(compact(source))
  })

  it('keeps bilingual dialogue, apostrophes, spaces and CRLF line boundaries', () => {
    const wrapper = mount(ReadingTextBlock, {
      props: {
        block: block({
          content:
            "Mum: What's this?\r\n妈妈：这是什么？\r\n\r\nIt's a toy bear.\r\n它是一只玩具熊。",
        }),
      },
    })
    expect(wrapper.findAll('p').map((p) => p.element.textContent)).toEqual([
      "Mum: What's this?\n妈妈：这是什么？",
      "It's a toy bear.\n它是一只玩具熊。",
    ])
  })

  it('preserves mathematical symbols and never interprets source text as HTML', () => {
    const source = '9＋5＝14；1米＝100厘米。\n2 < 5，8 > 3。\n<script>alert(1)</script>'
    const wrapper = mount(ReadingTextBlock, { props: { block: block({ content: source }) } })
    expect(wrapper.get('p').element.textContent).toBe(source)
    expect(wrapper.find('script').exists()).toBe(false)
  })

  it('keeps all repeated paragraphs, bullet items and highlights in their original order', () => {
    const wrapper = mount(ReadingTextBlock, {
      props: {
        block: block({
          paragraphs: ['春天来了！', '春天来了！'],
          bullets: ['先想一想', '再试一试'],
          highlights: ['数位对齐', '检查答案'],
        }),
      },
    })
    expect(wrapper.findAll('.reading-text-block__body > p').map((p) => p.text())).toEqual([
      '先读一读，再想一想。',
      '春天来了！',
      '春天来了！',
    ])
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['先想一想', '再试一试'])
    expect(wrapper.get('[aria-label="重点提示"]').text()).toContain('检查答案')
  })

  it.each([
    ['Chinese', gradeOneChineseLowerCourseContents],
    ['English', gradeOneShenzhenEnglishUpperCourseContents],
  ] as const)(
    'keeps all source characters across the %s volume including appendices',
    (_, records) => {
      for (const record of records) {
        const texts = record.body['blocks'] as { type: string; text?: string }[]
        for (const [index, item] of texts.entries()) {
          if (item.type !== 'TEXT' || !item.text) continue
          const source = block({
            title: index === 0 ? record.title : undefined,
            content: item.text,
          })
          const before = JSON.stringify(source)
          const wrapper = mount(ReadingTextBlock, { props: { block: source } })
          const sourceHasTitle = item.text.split(/\r?\n/)[0]?.trim() === source.title?.trim()
          const expected = (sourceHasTitle ? '' : (source.title ?? '')) + item.text
          expect(compact(wrapper.text()), record.id).toBe(compact(expected))
          expect(JSON.stringify(source)).toBe(before)
          wrapper.unmount()
        }
      }
    },
  )

  it('shows a fallback when a text block is empty', () => {
    const wrapper = mount(ReadingTextBlock, { props: { block: block({ content: ' \n ' }) } })
    expect(wrapper.text()).toContain('这一步的内容正在整理中')
  })
})

describe('Lesson reading panel integration', () => {
  it('offers three accessible font sizes without changing content or emitting learning events', async () => {
    const source = block({ title: '有几瓶牛奶', content: '9＋5＝14' })
    const before = JSON.stringify(source)
    const wrapper = mount(LessonReadingPanel, { props: { blocks: [source], subject: 'math' } })
    expect(wrapper.get('h2').text()).toBe('知识讲解')
    expect(wrapper.get('legend').text()).toBe('正文字号')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3)
    expect(wrapper.get<HTMLInputElement>('input[value="standard"]').element.checked).toBe(true)
    const text = wrapper.get('.lesson-content-renderer').text()

    for (const size of ['large', 'extra-large', 'standard']) {
      await wrapper.get(`input[value="${size}"]`).setValue(true)
      expect(wrapper.classes()).toContain(`lesson-reader--${size}`)
      expect(wrapper.get('.lesson-content-renderer').text()).toBe(text)
    }
    expect(JSON.stringify(source)).toBe(before)
    expect(wrapper.emitted('start-assessment')).toBeUndefined()
  })

  it.each(['chinese', 'english'] as const)(
    'uses the %s presentation without changing the chapter title',
    (subject) => {
      const wrapper = mount(LessonReadingPanel, {
        props: { blocks: [block({ title: '《春夏秋冬》' })], subject },
      })
      expect(wrapper.attributes('data-subject')).toBe(subject)
      expect(wrapper.get('h2').text()).toBe('课文原文')
      expect(wrapper.get('.reading-text-block__title').text()).toBe('《春夏秋冬》')
    },
  )

  it('renders the supplied source note and the empty content fallback', () => {
    const wrapper = mount(LessonReadingPanel, {
      props: { blocks: [] },
      slots: { note: '仅供课程演示的内容。' },
    })
    expect(wrapper.get('.lesson-reader__note').text()).toBe('仅供课程演示的内容。')
    expect(wrapper.text()).toContain('这一步的内容正在准备中')
  })

  it('sorts reading blocks stably without mutating the source array', () => {
    const blocks = [
      block({ id: 'z', title: '第三', sort: 2 }),
      block({ id: 'b', title: '第二', sort: 1 }),
      block({ id: 'a', title: '第一', sort: 1 }),
    ]
    const wrapper = mount(LessonReadingPanel, { props: { blocks } })
    expect(wrapper.findAll('h3').map((heading) => heading.text())).toEqual(['第一', '第二', '第三'])
    expect(blocks.map((item) => item.id)).toEqual(['z', 'b', 'a'])
  })

  it('keeps media, interactions, guarded assessment launch and unknown-block diagnostics', async () => {
    const model = buildLessonPlayerViewModel(
      demoLessonPlayerSource,
      createLessonSession(demoLessonPlayerSource.context),
    )
    const blocks = model.steps.flatMap((step) => step.contentBlocks)
    const wrapper = mount(LessonReadingPanel, {
      global: { plugins: [createPinia()] },
      props: {
        blocks: [...blocks, block({ id: 'unknown', type: 'future-block', sort: 99 })],
        showDiagnostics: true,
        practiceAvailable: true,
      },
    })
    expect(wrapper.find('.lesson-media-list').exists()).toBe(true)
    expect(wrapper.find('.lesson-interaction').exists()).toBe(true)
    expect(wrapper.text()).toContain('Unsupported Content Block')
    const button = wrapper.findAll('button').find((item) => item.text() === '开始练习')
    expect(button).toBeDefined()
    await button?.trigger('click')
    expect(wrapper.emitted('start-assessment')).toHaveLength(1)
    await wrapper.setProps({ practiceAvailable: false })
    expect(wrapper.findAll('button').some((item) => item.text() === '开始练习')).toBe(false)
    wrapper.unmount()
  })

  it('keeps the step player unchanged unless reading presentation is requested', () => {
    const wrapper = mount(LessonContentRenderer, { props: { blocks: [block()] } })
    expect(wrapper.find('.reading-text-block').exists()).toBe(false)
    expect(wrapper.find('.lesson-block').exists()).toBe(true)
    expect(wrapper.text()).toContain('今天学什么')
  })
})
