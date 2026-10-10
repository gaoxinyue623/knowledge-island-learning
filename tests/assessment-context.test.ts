import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, expect, it, vi } from 'vitest'
import QuestionEnginePage from '@/pages/QuestionEnginePage.vue'
import { demoAssessmentContext } from '@/data/question-engine'
import { questionEngineAdapter } from '@/services/question-engine'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'

afterEach(() => vi.restoreAllMocks())

it.each([{}, { textbookId: 'incomplete' }])(
  'shows recovery for incomplete assessment context: %j',
  async (query) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/assessment', component: QuestionEnginePage },
        { path: '/learning-map', component: { template: '<p>地图</p>' } },
      ],
    })
    await router.push({ path: '/assessment', query })
    const wrapper = mount(QuestionEnginePage, {
      global: {
        plugins: [pinia, router],
        stubs: { AppShell: { template: '<main><slot /></main>' } },
      },
    })
    try {
      await flushPromises()
      expect(wrapper.text()).toContain('练习暂时无法打开')
      expect(wrapper.text()).toContain('练习入口信息不完整')
      expect(useQuestionEngineStore().status).toBe('invalid_context')
      await wrapper
        .findAll('button')
        .find((button) => button.text() === '返回知识地图')!
        .trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/learning-map')
    } finally {
      wrapper.unmount()
    }
  },
)

it('clears a previous assessment without deleting its saved session and can reopen it', async () => {
  setActivePinia(createPinia())
  const store = useQuestionEngineStore()
  await store.loadAssessment(demoAssessmentContext, { dataset: 'demo', studentId: 'context-audit' })
  expect(store.currentQuestion).toBeTruthy()
  const sessionId = store.session!.id
  await store.loadAssessment(null)
  expect(store.currentQuestion).toBeNull()
  expect(store.session).toBeNull()
  expect(store.canSubmit).toBe(false)
  expect(store.loading).toBe(false)
  await store.loadAssessment(demoAssessmentContext, { dataset: 'demo', studentId: 'context-audit' })
  expect(store.session!.id).toBe(sessionId)
  expect(store.status).toBe('ready')
})

it('does not let an in-flight assessment overwrite the invalid context state', async () => {
  setActivePinia(createPinia())
  let resolve!: (result: Awaited<ReturnType<typeof questionEngineAdapter.loadAssessment>>) => void
  vi.spyOn(questionEngineAdapter, 'loadAssessment').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const store = useQuestionEngineStore()
  const pending = store.loadAssessment(demoAssessmentContext, { dataset: 'demo' })
  await store.loadAssessment(null)
  resolve({ definition: null, questions: [], issue: 'QUESTION_EMPTY' })
  await pending
  expect(store.status).toBe('invalid_context')
  expect(store.loading).toBe(false)
  expect(store.viewModel).toBeNull()
})
