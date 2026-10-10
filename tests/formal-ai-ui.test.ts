import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('@/services/formal-ai/client', async () => ({
  ...(await vi.importActual('@/services/formal-ai/client')),
  aiRequest: state.request,
}))
vi.mock('@/composables/useLearningProfile', () => ({
  useLearningProfile: () => ({ profileId: ref('student') }),
}))
import FormalAiPractice from '@/components/knowledge-point/FormalAiPractice.vue'
import { AiApiError } from '@/services/formal-ai/client'
const props = {
  textbookId: 'G2_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE',
  knowledgePointId: 'G2_SHENZHEN_MATH_S1_KP_03',
}
const session = () => ({
  ...props,
  profileId: 'student',
  id: crypto.randomUUID(),
  title: '退位减法',
  source: 'REAL_LLM',
  validation: 'AUTO_VALIDATED',
  model: 'test-model',
  createdAt: new Date().toISOString(),
  completed: false,
  questions: [1, 2, 3].map(() => ({ id: crypto.randomUUID(), stem: '32 − 7 = ?' })),
})
let wrapper: ReturnType<typeof mount>
beforeEach(() => state.request.mockReset())
afterEach(() => wrapper?.unmount())
function connected(saved: unknown = null) {
  state.request.mockImplementation(async (path: string) =>
    path === 'session'
      ? { username: 'parent_a' }
      : path === 'ai/status'
        ? { enabled: true }
        : { session: saved },
  )
}
describe('formal AI learning UI', () => {
  it('restores an exact wrong-question session and saves the review without altering the original answer', async () => {
    const saved = { ...session(), completed: true }
    const wrong = {
      ...saved.questions[0]!,
      feedback: { correct: false, answer: 0, expected: 25, explanation: '退位计算。' },
    }
    saved.questions = [wrong]
    connected(saved)
    wrapper = mount(FormalAiPractice, {
      props: { ...props, initialSessionId: saved.id, reviewing: true },
      global: {
        mocks: { $route: { fullPath: '/ai-review/test' } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    expect(state.request).toHaveBeenCalledWith(
      `ai/sessions/${saved.id}?profileId=student`,
      expect.anything(),
    )
    expect(wrapper.text()).not.toContain('让 AI 出')
    await wrapper.get('[aria-label="计算答案"]').setValue('25')
    state.request.mockResolvedValueOnce({
      session: {
        ...saved,
        questions: [
          { ...wrong, review: { correct: true, answer: 25, at: new Date().toISOString() } },
        ],
      },
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(state.request).toHaveBeenLastCalledWith(
      `ai/sessions/${saved.id}/reviews`,
      expect.objectContaining({ body: { profileId: 'student', questionId: wrong.id, answer: 25 } }),
    )
    expect(wrapper.text()).toContain('这组错题已巩固')
    expect(wrapper.emitted('completed')).toHaveLength(1)
  })
  it('renders reviewed Chinese choice questions and submits option keys with the actual question count', async () => {
    const chinese = {
      textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
      knowledgePointId: 'G1_PEP_CHINESE_S1_KP_01',
    }
    const saved = {
      ...session(),
      ...chinese,
      questions: [
        {
          id: crypto.randomUUID(),
          stem: '选择正确的读音',
          kind: 'singleChoice',
          options: [
            { value: 'A', label: '读音一' },
            { value: 'B', label: '读音二' },
          ],
        },
      ],
    }
    connected(saved)
    wrapper = mount(FormalAiPractice, {
      props: chinese,
      global: {
        mocks: { $route: { fullPath: '/learning-agent' } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('已完成 0 / 1')
    await wrapper.get('input[value="B"]').setValue()
    state.request.mockResolvedValueOnce({
      session: {
        ...saved,
        completed: true,
        questions: [
          {
            ...saved.questions[0],
            feedback: { answer: 'B', expected: 'B', correct: true, explanation: '读音方法' },
          },
        ],
      },
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(state.request).toHaveBeenLastCalledWith(
      `ai/sessions/${saved.id}/answers`,
      expect.objectContaining({
        body: { profileId: 'student', questionId: saved.questions[0]!.id, answer: 'B' },
      }),
    )
    expect(wrapper.text()).toContain('答对 1 / 1')
  })

  it('does not request a model for unsupported topics', async () => {
    wrapper = mount(FormalAiPractice, { props: { ...props, knowledgePointId: 'CHINESE' } })
    await flushPromises()
    expect(state.request).not.toHaveBeenCalled()
    expect(wrapper.text()).toBe('')
  })
  it('shows login before generation and recovers a server-side session', async () => {
    state.request.mockResolvedValueOnce({ username: null })
    wrapper = mount(FormalAiPractice, {
      props,
      global: {
        mocks: { $route: { fullPath: '/learning-map' } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('请家长登录')
    expect(wrapper.text()).not.toContain('让 AI 出')
    const saved = session()
    state.request.mockImplementation(async (path: string) =>
      path === 'session'
        ? { username: 'parent_a' }
        : path === 'ai/status'
          ? { enabled: true }
          : { session: saved },
    )
    expect(wrapper.text()).toContain('前往登录')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('32 − 7 = ?')
    expect(wrapper.text()).not.toContain('正确答案')
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
    await wrapper.get('[aria-label="计算答案"]').setValue('25')
    const feedback = { answer: 25, expected: 25, correct: true, explanation: '退位计算。' }
    state.request.mockResolvedValue({
      session: {
        ...saved,
        questions: saved.questions.map((q, i) => (i === 0 ? { ...q, feedback } : q)),
      },
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(state.request).toHaveBeenLastCalledWith(
      `ai/sessions/${saved.id}/answers`,
      expect.objectContaining({
        body: { profileId: 'student', questionId: saved.questions[0]!.id, answer: 25 },
      }),
    )
    expect(wrapper.text()).toContain('答对了')
    expect(wrapper.text()).toContain('已完成 1 / 3')
  })
  it('blocks repeated generation and discards a late response after context changes', async () => {
    connected()
    wrapper = mount(FormalAiPractice, {
      props,
      global: {
        mocks: { $route: { fullPath: '/learning-map' } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    const saved = session()
    let finish!: (value: unknown) => void
    state.request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('正在出题')
    await wrapper.setProps({ knowledgePointId: 'CHINESE' })
    finish({ session: saved })
    await flushPromises()
    expect(wrapper.text()).toBe('')
  })
  it('preserves the request identity after a network failure and never substitutes mock questions', async () => {
    connected()
    wrapper = mount(FormalAiPractice, {
      props,
      global: {
        mocks: { $route: { fullPath: '/learning-map' } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    state.request.mockRejectedValueOnce(new AiApiError('NETWORK_ERROR', '网络暂时中断'))
    await wrapper.get('button').trigger('click')
    await flushPromises()
    const requestId = state.request.mock.calls.at(-1)![1].body.requestId
    expect(wrapper.text()).toContain('网络暂时中断')
    expect(wrapper.find('[aria-label="计算答案"]').exists()).toBe(false)
    state.request.mockResolvedValueOnce({ session: session() })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(state.request.mock.calls.at(-1)![1].body.requestId).toBe(requestId)
    expect(wrapper.text()).toContain('32 − 7 = ?')
  })
})
