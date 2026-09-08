import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import LessonGuidedPractice from '@/components/lesson-player/LessonGuidedPractice.vue'
import LessonPlayerPage from '@/pages/LessonPlayerPage.vue'
import { contentExpansionRepository } from '@/services/content-expansion'
import { useStudentStore } from '@/stores/studentStore'
import {
  resetLessonPlayerStoreDependencies,
  useLessonPlayerStore,
} from '@/stores/lessonPlayerStore'
import type { ReadingPracticeQuest } from '@/types/reading-quest'

const quest: ReadingPracticeQuest = {
  id: 'guided:math:lesson-1',
  subject: 'MATH',
  textbookId: 'book-1',
  knowledgePointId: 'point-1',
  stages: [],
}

afterEach(() => {
  resetLessonPlayerStoreDependencies()
  vi.restoreAllMocks()
})

const lessonContext = {
  textbookId: 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE',
  unitId: 'G1_SHENZHEN_MATH_S1_UNIT_01',
  lessonId: 'G1_SHENZHEN_MATH_S1_LESSON_01',
  knowledgePointId: 'G1_SHENZHEN_MATH_S1_KP_01',
}

async function mountCompletedPilotLesson(profileId = 'child-guided') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useStudentStore().profile = { id: profileId, displayName: '小岛同学' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/lesson', component: LessonPlayerPage },
      { path: '/learning-map', component: { template: '<p>学习地图</p>' } },
    ],
  })
  await router.push({ path: '/lesson', query: lessonContext })
  await router.isReady()
  const wrapper = mount(LessonPlayerPage, {
    global: {
      plugins: [pinia, router],
      stubs: { AppShell: { template: '<main><slot /></main>' } },
    },
  })
  const store = useLessonPlayerStore()
  await vi.waitFor(() => expect(store.status).toBe('ready'))
  await completeLessonViaUi(wrapper, store)
  return { wrapper, router, store }
}

async function completeLessonViaUi(
  wrapper: ReturnType<typeof mount>,
  store: ReturnType<typeof useLessonPlayerStore>,
) {
  while (!store.isLastStep) store.goNext()
  await flushPromises()
  const completeButton = wrapper
    .findAll('button')
    .find((button) => button.text().includes('完成这次学习'))
  expect(completeButton).toBeDefined()
  await completeButton!.trigger('click')
  await vi.waitFor(() => expect(store.status).toBe('completed'))
  await flushPromises()
}

describe('Lesson guided practice', () => {
  it('shows a real pilot lesson completion with direct foundation practice', async () => {
    const { wrapper } = await mountCompletedPilotLesson()

    expect(wrapper.text()).toContain('现在就试试课后练习')
    expect(wrapper.findComponent({ name: 'ReadingQuest' }).exists()).toBe(true)
    expect(wrapper.find('#knowledge-reading').exists()).toBe(true)
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    wrapper.unmount()
  })

  it('does not let an older A request replace a newer A after A to B to A', async () => {
    const bundle = await contentExpansionRepository.getBundle(lessonContext.knowledgePointId, 'profile')
    expect(bundle).not.toBeNull()
    let rejectFirst!: (reason: unknown) => void
    const first = new Promise<Awaited<typeof bundle>>((_, reject) => {
      rejectFirst = reject
    })
    const getBundle = vi
      .spyOn(contentExpansionRepository, 'getBundle')
      .mockImplementationOnce(() => first)
      .mockResolvedValue(bundle)

    const { wrapper, store } = await mountCompletedPilotLesson('child-first')
    await vi.waitFor(() => expect(getBundle).toHaveBeenCalledTimes(1))

    useStudentStore().profile = { id: 'child-newer', displayName: '新同学' }
    await vi.waitFor(() => expect(store.status).toBe('ready'))
    await completeLessonViaUi(wrapper, store)
    await vi.waitFor(() =>
      expect(wrapper.findComponent({ name: 'ReadingQuest' }).props('profileId')).toBe('child-newer'),
    )

    useStudentStore().profile = { id: 'child-first', displayName: '原来的同学' }
    await vi.waitFor(() =>
      expect(wrapper.findComponent({ name: 'ReadingQuest' }).props('profileId')).toBe('child-first'),
    )
    expect(getBundle).toHaveBeenCalledTimes(3)

    rejectFirst(new Error('stale request'))
    await flushPromises()
    expect(wrapper.text()).not.toContain('课后练习暂时没有准备好')
    expect(wrapper.findComponent({ name: 'ReadingQuest' }).props('profileId')).toBe('child-first')
    wrapper.unmount()
  })

  it.each(['success', 'failure'] as const)(
    'ignores a late guided-practice %s response after the page unmounts',
    async (outcome) => {
      const bundle = await contentExpansionRepository.getBundle(lessonContext.knowledgePointId, 'profile')
      expect(bundle).not.toBeNull()
      let resolveFirst!: (value: typeof bundle) => void
      let rejectFirst!: (reason: unknown) => void
      const first = new Promise<typeof bundle>((resolve, reject) => {
        resolveFirst = resolve
        rejectFirst = reject
      })
      const getBundle = vi.spyOn(contentExpansionRepository, 'getBundle').mockReturnValue(first)
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper } = await mountCompletedPilotLesson(`child-unmount-${outcome}`)
      await vi.waitFor(() => expect(getBundle).toHaveBeenCalledTimes(1))

      wrapper.unmount()
      if (outcome === 'success') resolveFirst(bundle)
      else rejectFirst(new Error('late request'))
      await flushPromises()

      expect(consoleError).not.toHaveBeenCalled()
    },
  )

  it('puts the existing foundation practice directly after a completed lesson without claiming mastery', () => {
    const wrapper = mount(LessonGuidedPractice, {
      props: {
        quest,
        title: '课堂准备',
        profileId: 'child-a',
        state: 'ready',
      },
      global: { stubs: { ReadingQuest: { template: '<div data-test="reading-quest" />' } } },
    })

    expect(wrapper.text()).toContain('现在就试试课后练习')
    expect(wrapper.text()).toContain('完成课程不等于已经掌握')
    expect(wrapper.get('[data-test="reading-quest"]').exists()).toBe(true)
  })

  it('keeps a clear exit and details option when no direct practice is available', async () => {
    const wrapper = mount(LessonGuidedPractice, {
      props: {
        quest: null,
        title: '课堂准备',
        profileId: 'child-a',
        state: 'unavailable',
      },
    })

    expect(wrapper.text()).toContain('暂时没有可直接开始的课后练习')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('openDetails')).toHaveLength(1)
  })

  it('does not retain a previous learner or course practice after its identity changes', async () => {
    const wrapper = mount(LessonGuidedPractice, {
      props: {
        quest,
        title: '课堂准备',
        profileId: 'child-a',
        state: 'ready',
      },
      global: { stubs: { ReadingQuest: { template: '<div data-test="reading-quest" />' } } },
    })

    await wrapper.setProps({
      profileId: 'child-b',
      quest: null,
      state: 'loading',
    })

    expect(wrapper.find('[data-test="reading-quest"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('正在准备课后练习')
  })

  it('offers a retry when preparing the direct practice fails', async () => {
    const wrapper = mount(LessonGuidedPractice, {
      props: {
        quest: null,
        title: '课堂准备',
        profileId: 'child-a',
        state: 'error',
      },
    })

    await wrapper.get('[data-test="retry-guided-practice"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
