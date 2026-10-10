import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import QuestionRenderer from '@/components/question-engine/QuestionRenderer.vue'
import { gradeThreeChineseLowerSyncQuestions } from '@/data/curriculum/grade-3/chinese-pep-lower/synchronousExercises'
import images from '@/data/curriculum/grade-3/chinese-pep-lower/picture-writing-images.json'
import { adaptQuestionToViewModel } from '@/services/question-engine/questionEngineAdapter'
import { validateQuestionAnswer } from '@/services/question-engine/answerValidator'
import type { QuestionAnswerDraft } from '@/types'

const question = gradeThreeChineseLowerSyncQuestions.find((item) => item.pictureWriting)!
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('unit two picture story writing', () => {
  it('resolves four released images with intact project files and keeps manual review', async () => {
    const model = await adaptQuestionToViewModel(question, undefined)
    expect(model.media).toHaveLength(4)
    expect(
      model.media.every((asset) => asset.isAvailable && asset.altText?.includes('AI生成练习素材')),
    ).toBe(true)
    expect(question.questionVersion).toBe(2)
    expect(question.stem.map((block) => block.text).join('\n')).not.toContain('请先准备一幅图')
    expect(question.pictureWriting?.choices.map((choice) => choice.title)).toEqual([
      '小猴子丢玉米',
      '小熊送小白兔回家',
      '小松鼠种花生',
      '小狗认真练字',
    ])
    for (const image of images.images) {
      const bytes = readFileSync(resolve('public', image.url.slice(1)))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(image.sha256)
    }
    expect(
      validateQuestionAnswer(question, {
        type: 'shortAnswer',
        value: '小猴子决定做事时先放好手里的东西。',
      }).status,
    ).toBe('manual_review_required')
  })

  it('shows the selected picture above six writing lines and preserves text when switching', async () => {
    let model = await adaptQuestionToViewModel(question, undefined)
    const wrapper = mount(QuestionRenderer, { props: { question: model } })
    try {
      expect(wrapper.findAll('img')).toHaveLength(1)
      expect(wrapper.get('img').attributes('src')).toBe(images.images[0]!.url)
      expect(wrapper.get('textarea').attributes('rows')).toBe('6')
      await wrapper.get('textarea').setValue('小猴子有点后悔。\n接下来，他回头寻找玉米。')
      const first = wrapper.emitted('update-draft')!.at(-1)![0] as QuestionAnswerDraft
      expect(first).toEqual({
        type: 'shortAnswer',
        value: '【小猴子丢玉米】\n小猴子有点后悔。\n接下来，他回头寻找玉米。',
      })
      model = { ...model, answerDraft: first }
      await wrapper.setProps({ question: model })
      await wrapper.findAll('input[type="radio"]')[1]!.setValue(true)
      const changed = wrapper.emitted('update-draft')!.at(-1)![0] as QuestionAnswerDraft
      expect(changed.type === 'shortAnswer' && changed.value).toBe(
        '【小熊送小白兔回家】\n小猴子有点后悔。\n接下来，他回头寻找玉米。',
      )
      await wrapper.setProps({ question: { ...model, answerDraft: changed } })
      expect(wrapper.get('img').attributes('src')).toBe(images.images[1]!.url)
      expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toContain(
        '接下来，他回头寻找玉米。',
      )
      await wrapper.get('textarea').setValue('')
      expect(wrapper.emitted('update-draft')!.at(-1)![0]).toEqual({
        type: 'shortAnswer',
        value: '',
      })
    } finally {
      wrapper.unmount()
    }
  })

  it('restores the chosen story from its saved draft and locks writing after submission', async () => {
    const model = await adaptQuestionToViewModel(question, undefined)
    const wrapper = mount(QuestionRenderer, {
      props: {
        question: {
          ...model,
          submitted: true,
          answerDraft: {
            type: 'shortAnswer',
            value: '【小松鼠种花生】\n小松鼠和朋友一起收获花生。',
          },
        },
      },
    })
    try {
      expect(wrapper.get('img').attributes('src')).toBe(images.images[2]!.url)
      expect(wrapper.get('textarea').attributes('disabled')).toBeDefined()
      expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
      await wrapper.get('textarea').trigger('input')
      expect(wrapper.emitted('update-draft')).toBeUndefined()
    } finally {
      wrapper.unmount()
    }
  })
})
