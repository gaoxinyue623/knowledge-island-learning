import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import appRouter from '@/router'
import { getOnboardingRedirect } from '@/router/guard'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useStudentStore } from '@/stores/studentStore'
import { useLearningHistoryStore } from '@/stores/learningHistoryStore'
import App from '@/App.vue'
import * as presentation from '@/composables/useCurriculumPresentation'
import { useGrowthStore } from '@/stores/growthStore'
const shell = { template: '<main><slot /></main>' }
beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  router.beforeEach(
    (to) =>
      getOnboardingRedirect(
        to.path,
        Boolean(to.meta.requiresOnboarding),
        useCurriculumStore(pinia).isComplete,
      ) ?? true,
  )
  await router.push('/profile')
  await router.isReady()
  const wrapper = mount(RouterView, {
    global: { plugins: [pinia, router], stubs: { AppShell: shell, PetParentReport: true } },
  })
  await flushPromises()
  return { wrapper, router, pinia }
}
describe('learning space routes and recovery', () => {
  it('opens every real destination and returns without requiring textbook setup', async () => {
    const { wrapper, router } = await setup()
    for (const [path, title] of [
      ['/character', '团子的衣帽间'],
      ['/history', '我的学习记录'],
      ['/wrong-book', '错题本'],
      ['/review-queue', '待巩固列表'],
      ['/parent', '学习报告'],
    ]) {
      await wrapper.get(`a[href="${path}"]`).trigger('click')
      await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(path))
      await flushPromises()
      expect(wrapper.find('h1').text()).toBe(title)
      await wrapper.get('a[href="/profile"]').trigger('click')
      await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/profile'))
      await flushPromises()
      expect(wrapper.text()).toContain('我的学习空间')
    }
    wrapper.unmount()
  })
  it('reloads learning history for the same profile identity used by the personal space', async () => {
    const { wrapper, router } = await setup()
    useStudentStore().profile = { id: 'alice', displayName: '小青' }
    await router.push('/history')
    await flushPromises()
    expect(useLearningHistoryStore().profileId).toBe('alice')
    useStudentStore().profile = { id: 'bob', displayName: '小蓝' }
    await flushPromises()
    expect(useLearningHistoryStore().profileId).toBe('bob')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === '去学习')!
      .trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/onboarding'))
    wrapper.unmount()
  })
  it('keeps entrances available and loads the new profile even if curriculum labels fail', async () => {
    const { wrapper } = await setup()
    vi.spyOn(presentation, 'getCurriculumPresentation').mockRejectedValue(
      new Error('课程名称暂时无法读取'),
    )
    const load = vi.spyOn(useGrowthStore(), 'load')
    const curriculum = useCurriculumStore()
    curriculum.curriculumProfile = { studentId: 'bob' } as NonNullable<
      typeof curriculum.curriculumProfile
    >
    await flushPromises()
    expect(load).toHaveBeenCalledWith('bob', { dataset: 'profile', includeSample: false })
    expect(wrapper.get('a[href="/character"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('课程名称暂时无法读取')
    wrapper.unmount()
  })
  it('shows a retry link when a destination module cannot be loaded', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<p>我的空间</p>' } },
        { path: '/broken', component: () => Promise.reject(new Error('chunk failed')) },
      ],
    })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await expect(router.push('/broken')).rejects.toThrow('chunk failed')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('页面暂时没有打开')
    expect(wrapper.get('a').attributes('href')).toBe('/broken')
    wrapper.unmount()
  })
})
