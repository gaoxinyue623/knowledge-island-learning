import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import DevLearningAgentPage from '@/pages/DevLearningAgentPage.vue'
import { useLearningAgentStore } from '@/stores/learningAgentStore'
import { AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'

describe('learning agent development simulation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  it('renders only validated questions and adjusts the visible decision after answering', async () => {
    const wrapper = mount(DevLearningAgentPage, {
      global: { stubs: { AppShell: { template: '<div><slot /></div>' } } },
    })
    await flushPromises()
    expect(wrapper.find('.decision-action').text()).toBe('REINFORCE')
    expect(wrapper.findAll('.questions li')).toHaveLength(5)
    await wrapper
      .findAll('button')
      .find((b) => b.text() === '连续失败')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('.decision-action').text()).toBe('SIMPLIFY')
    expect(wrapper.text()).toContain('REINFORCE → SIMPLIFY')
    await wrapper.find('select').setValue('H')
    await flushPromises()
    expect(wrapper.findAll('.questions li')).toHaveLength(0)
    expect(wrapper.text()).toContain('AGENT_CURRICULUM_GUARD')
    wrapper.unmount()
  })
  it('selects REAL_LLM, displays explicit fallback usage, and hides failed BFF resources', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
    const { generateDevQuestions } = await import('../server/llm/devGeneration')
    fetcher.mockImplementation(
      async (_url, init) =>
        new Response(
          JSON.stringify(await generateDevQuestions(JSON.parse(init!.body as string), {})),
        ),
    )
    const wrapper = mount(DevLearningAgentPage, {
      global: { stubs: { AppShell: { template: '<div><slot /></div>' } } },
    })
    try {
      await flushPromises()
      await wrapper.find('[aria-label="生成模式"]').setValue('REAL_LLM')
      await wrapper
        .findAll('button')
        .find((b) => b.text() === 'Run Agent')!
        .trigger('click')
      await flushPromises()
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(wrapper.findAll('.questions li')).toHaveLength(5)
      expect(wrapper.text()).toContain('已回退 Mock：CONFIG_ERROR')
    expect(wrapper.text()).toContain('question-generation.user.v6')
      expect(wrapper.text()).toContain('QUESTION_GENERATION_FALLBACK')
      fetcher.mockRejectedValueOnce(new Error('SECRET_NETWORK_DETAIL'))
      await wrapper
        .findAll('button')
        .find((b) => b.text() === 'Run Agent')!
        .trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.questions li')).toHaveLength(0)
      expect(wrapper.text()).toContain('LLM_DEV_SERVICE_UNAVAILABLE')
      expect(wrapper.text()).not.toContain('SECRET_NETWORK_DETAIL')
    } finally {
      fetcher.mockRestore()
      wrapper.unmount()
    }
  })
  it('does not overwrite a reset simulation with a stale task result', async () => {
    const store = useLearningAgentStore(),
      result = await store.simulation.run(AGENT_SIMULATION_TIME)
    let resolve!: (value: typeof result) => void
    vi.spyOn(store.simulation, 'run').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const pending = store.run()
    store.reset('G')
    resolve(result)
    await pending
    expect(store.result).toBeNull()
    expect(store.round).toBe(0)
  })
})
