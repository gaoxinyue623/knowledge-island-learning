import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  prepare: vi.fn(),
  save: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  query: {} as Record<string, string>,
  profile: {
    mathTextbookVersionId: 'math',
    chineseTextbookVersionId: 'chinese',
    englishTextbookVersionId: 'english',
  },
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: state.query }),
  useRouter: () => ({ push: state.push, replace: state.replace }),
}))
vi.mock('@/composables/useLearningProfile', () => ({
  useLearningProfile: () => ({ profileId: ref('student') }),
}))
vi.mock('@/stores/curriculumStore', () => ({
  useCurriculumStore: () => ({ curriculumProfile: state.profile }),
}))
vi.mock('@/services/learning-agent', () => ({
  runtimeLearningAgentDecisionService: { prepare: state.prepare },
  saveFormalAgentLaunch: state.save,
}))
import { selectAccount } from '@/services/account/storage'
import FormalLearningAgentPage from '@/pages/FormalLearningAgentPage.vue'

function decision() {
  const plan = { estimatedQuestionCount: 5, difficulty: 0.4, knowledgePointIds: ['target'] }
  return {
    status: 'READY',
    decision: {
      decisionId: 'decision',
      profileId: 'student',
      textbookId: state.query.subject?.toLowerCase() ?? 'math',
      recommendedActivity: plan,
      targetKnowledgePointId: 'target',
      action: 'NEXT',
      confidence: 0.5,
      reasons: [],
    },
    context: {
      currentLearning: {
        unitId: 'old-unit',
        lessonId: 'old-lesson',
        knowledgePointId: 'old-point',
      },
      mapNodes: [
        {
          unitId: 'new-unit',
          lessonId: 'new-lesson',
          knowledgePointId: 'target',
          status: 'available',
        },
      ],
    },
    activityPlan: { estimatedQuestionCount: 5, difficulty: 0.4 },
  }
}
function page() {
  return mount(FormalLearningAgentPage, {
    global: { stubs: { AppShell: { template: '<main><slot /></main>' } } },
  })
}
beforeEach(() => {
  selectAccount(null)
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  state.query = {}
  state.prepare.mockImplementation(async (_profile: string, textbook: string) => {
    const data = decision()
    data.decision.textbookId = textbook
    return data
  })
  state.save.mockReturnValue(true)
})
describe('formal Agent subject selection', () => {
  it('refreshes advice after AI completion while retaining the completed AI practice context', async () => {
    const wrapper = page()
    await flushPromises()
    const next = decision()
    next.decision.action = 'CHALLENGE'
    next.decision.targetKnowledgePointId = 'next-target'
    next.context.mapNodes.push({ ...next.context.mapNodes[0]!, knowledgePointId: 'next-target' })
    state.prepare.mockResolvedValueOnce(next)
    wrapper.findComponent({ name: 'FormalAiPractice' }).vm.$emit('completed')
    await flushPromises()
    expect(wrapper.text()).toContain('挑战练习')
    expect(wrapper.text()).toContain('下一步建议已更新')
    expect(wrapper.findComponent({ name: 'FormalAiPractice' }).props('knowledgePointId')).toBe(
      'target',
    )
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(state.push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ knowledgePointId: 'next-target' }),
      }),
    )
    wrapper.unmount()
  })

  it('defaults to math, switches to Chinese and launches the decision target instead of the current lesson', async () => {
    const wrapper = page()
    await flushPromises()
    expect(state.prepare).toHaveBeenLastCalledWith('student', 'math')
    await wrapper.get('#formal-agent-subject').setValue('CHINESE')
    await flushPromises()
    expect(state.replace).toHaveBeenCalledWith({ query: { subject: 'CHINESE' } })
    expect(state.prepare).toHaveBeenLastCalledWith('student', 'chinese')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(state.push).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/assessment',
        query: expect.objectContaining({
          textbookId: 'chinese',
          unitId: 'new-unit',
          lessonId: 'new-lesson',
          knowledgePointId: 'target',
          agentSubject: 'CHINESE',
        }),
      }),
    )
    wrapper.unmount()
  })
  it('restores the requested subject and leaves the selector available after a blocked decision', async () => {
    state.query = { subject: 'ENGLISH' }
    state.prepare.mockResolvedValueOnce({ status: 'BLOCKED' })
    const wrapper = page()
    await flushPromises()
    expect(state.prepare).toHaveBeenLastCalledWith('student', 'english')
    expect(wrapper.get('#formal-agent-subject').attributes('disabled')).toBeUndefined()
    await wrapper.get('#formal-agent-subject').setValue('MATH')
    await flushPromises()
    expect(wrapper.text()).toContain('开始正式练习')
    wrapper.unmount()
  })
})
