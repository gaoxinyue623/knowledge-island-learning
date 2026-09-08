import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LessonPlayerPage from '@/pages/LessonPlayerPage.vue'
import LessonReadingControls from '@/components/lesson-player/LessonReadingControls.vue'
import {
  lessonReadingSubject,
  lessonReadingText,
  supportsChineseLessonReading,
} from '@/services/lesson-player/lessonReadingText'
import { useStudentStore } from '@/stores/studentStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useLessonPlayerStore } from '@/stores/lessonPlayerStore'

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
  cancel = vi.fn()
  speak = vi.fn()
}

const context = {
  textbookId: 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE',
  unitId: 'G1_SHENZHEN_MATH_S1_UNIT_01',
  lessonId: 'G1_SHENZHEN_MATH_S1_LESSON_01',
  knowledgePointId: 'G1_SHENZHEN_MATH_S1_KP_01',
}

let speech: FakeSpeech

beforeEach(() => {
  speech = new FakeSpeech()
  vi.stubGlobal('speechSynthesis', speech)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
})

afterEach(() => vi.unstubAllGlobals())

async function renderLesson(
  muted = false,
  path = '/lesson',
  query: Record<string, string> = context,
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useStudentStore(pinia).profile = { id: 'course-reader', displayName: '小岛同学' }
  usePreferencesStore(pinia).save({ reducedMotion: false, muted, showTranscript: true })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/lesson', component: LessonPlayerPage },
      { path: '/dev/lesson-player', component: LessonPlayerPage },
      { path: '/learning-map', component: { template: '<p>地图</p>' } },
      { path: '/dev/learning-map', component: { template: '<p>开发地图</p>' } },
    ],
  })
  await router.push({ path, query })
  await router.isReady()
  const wrapper = mount(LessonPlayerPage, {
    global: {
      plugins: [pinia, router],
      stubs: { AppShell: { template: '<main><slot /></main>' } },
    },
  })
  await vi.waitFor(() =>
    expect(wrapper.find('[data-test="lesson-reading-controls"]').exists()).toBe(true),
  )
  return {
    wrapper,
    router,
    student: useStudentStore(pinia),
    lessonStore: useLessonPlayerStore(pinia),
  }
}

describe('student course reading controls', () => {
  it('keeps English and practice-only blocks out of Chinese step reading', () => {
    expect(lessonReadingSubject('G1_SHENZHEN_ENGLISH_S1')).toBe('ENGLISH')
    expect(supportsChineseLessonReading(lessonReadingSubject('G1_SHENZHEN_ENGLISH_S1'))).toBe(false)
    expect(
      lessonReadingText([
        {
          id: 'practice',
          type: 'practice',
          content: '练习题正文',
          paragraphs: ['练习答案'],
          isSample: false,
          sort: 1,
        },
      ]),
    ).toBe('')

    const controls = mount(LessonReadingControls, {
      props: { text: '', canRead: false, scope: 'empty-step', modelValue: 'standard' },
    })
    expect(controls.find('[data-test="lesson-read-aloud"]').exists()).toBe(false)
    expect(controls.get('fieldset').text()).toContain('特大字')
  })

  it('reads only ordered visible structured fields and preserves repeated Chinese lines', () => {
    const blocks = [
      {
        id: 'summary',
        type: 'summary',
        title: '回顾标题',
        content: '重复句',
        paragraphs: ['总结段'],
        bullets: ['总结要点'],
        highlights: ['回顾重点'],
        isSample: false,
        sort: 2,
      },
      {
        id: 'intro',
        type: 'intro',
        title: '开场标题',
        content: '第一段',
        paragraphs: ['重复句'],
        isSample: false,
        sort: 1,
      },
      {
        id: 'interactive',
        type: 'interactive',
        title: '互动标题',
        content: '互动正文',
        paragraphs: ['隐藏互动解答'],
        isSample: false,
        sort: 0,
      },
      {
        id: 'media',
        type: 'media',
        content: '媒体说明',
        isSample: false,
        sort: 0,
      },
      {
        id: 'unknown',
        type: 'other',
        content: { unsafe: '不应朗读' } as unknown as string,
        isSample: false,
        sort: 0,
      },
    ]

    expect(lessonReadingText(blocks)).toBe(
      ['开场标题', '第一段', '重复句', '回顾标题', '重复句', '总结段', '总结要点', '回顾重点'].join(
        '\n',
      ),
    )
  })

  it('only reads the current math step after a click and changes the visible text size', async () => {
    const { wrapper } = await renderLesson()
    const controls = wrapper.get('[data-test="lesson-reading-controls"]')

    expect(speech.speak).not.toHaveBeenCalled()
    expect(controls.get('fieldset').text()).toContain('标准')
    await controls.get('[data-test="lesson-read-aloud"] button').trigger('click')
    expect(speech.speak).toHaveBeenCalledTimes(1)
    expect((speech.speak.mock.calls[0]![0] as FakeUtterance).lang).toBe('zh-CN')
    expect((speech.speak.mock.calls[0]![0] as FakeUtterance).text).not.toContain('参考答案')

    await controls.get('input[value="xlarge"]').setValue()
    expect(wrapper.get('#knowledge-reading').classes()).toContain(
      'lesson-player__content-card--xlarge',
    )
    wrapper.unmount()
  })

  it('stops Chinese reading when the student changes step and does not speak while muted', async () => {
    const { wrapper, student } = await renderLesson()
    await wrapper.get('[data-test="lesson-read-aloud"] button').trigger('click')
    await wrapper.findAll('.lesson-player__step-button')[1]!.trigger('click')
    await flushPromises()
    expect(speech.cancel).toHaveBeenCalled()

    await wrapper.get('[data-test="lesson-read-aloud"] button').trigger('click')
    const cancelsBeforeProfileChange = speech.cancel.mock.calls.length
    student.profile = { id: 'course-reader-next', displayName: '新同学' }
    await flushPromises()
    expect(speech.cancel.mock.calls.length).toBeGreaterThan(cancelsBeforeProfileChange)
    wrapper.unmount()

    const muted = await renderLesson(true)
    const speaksBeforeMutedClick = speech.speak.mock.calls.length
    await muted.wrapper.get('[data-test="lesson-read-aloud"] button').trigger('click')
    expect(speech.speak).toHaveBeenCalledTimes(speaksBeforeMutedClick)
    expect(muted.wrapper.text()).toContain('已静音')
    muted.wrapper.unmount()
  })

  it('lets a completed course review earlier steps without changing the saved completion or reward', async () => {
    const { wrapper, lessonStore } = await renderLesson()
    while (!lessonStore.isLastStep) lessonStore.goNext()
    await flushPromises()
    const finishButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('完成这次学习'))
    expect(finishButton).toBeDefined()
    await finishButton!.trigger('click')
    await vi.waitFor(() => expect(lessonStore.status).toBe('completed'))

    const savedStepIndex = lessonStore.currentStepIndex
    const reward = lessonStore.lastRewardEvent
    await wrapper.findAll('.lesson-player__step-button')[0]!.trigger('click')
    const firstText = wrapper
      .getComponent({ name: 'LessonReadingControls' })
      .props('text') as string
    await wrapper.get('[data-test="lesson-read-aloud"] button').trigger('click')
    expect((speech.speak.mock.lastCall![0] as FakeUtterance).text).toBe(firstText)
    expect(lessonStore.status).toBe('completed')
    expect(lessonStore.currentStepIndex).toBe(savedStepIndex)
    expect(lessonStore.lastRewardEvent).toEqual(reward)

    await wrapper.findAll('.lesson-player__step-button')[1]!.trigger('click')
    const secondText = wrapper
      .getComponent({ name: 'LessonReadingControls' })
      .props('text') as string
    expect(secondText).not.toBe(firstText)
    wrapper.unmount()
  })

  it('keeps a completed practice step in read-only review and cannot start assessment again', async () => {
    const { wrapper, lessonStore } = await renderLesson(false, '/dev/lesson-player', {})
    while (!lessonStore.isLastStep) lessonStore.goNext()
    await flushPromises()
    const finishButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('完成这次学习'))
    await finishButton!.trigger('click')
    await vi.waitFor(() => expect(lessonStore.status).toBe('completed'))

    const practiceIndex = lessonStore.viewModel!.steps.findIndex((step) => step.type === 'practice')
    expect(practiceIndex).toBeGreaterThanOrEqual(0)
    await wrapper.findAll('.lesson-player__step-button')[practiceIndex]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('当前为回看模式')
    expect(wrapper.findAll('button').some((button) => button.text().includes('开始练习'))).toBe(
      false,
    )
    expect(lessonStore.status).toBe('completed')
    wrapper.unmount()
  })
})
