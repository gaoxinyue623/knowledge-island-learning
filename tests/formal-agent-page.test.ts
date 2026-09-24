import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  prepare: vi.fn(), save: vi.fn(), push: vi.fn(), replace: vi.fn(),
  query: {} as Record<string, string>,
  profile: { mathTextbookVersionId: 'math', chineseTextbookVersionId: 'chinese', englishTextbookVersionId: 'english' },
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: state.query }), useRouter: () => ({ push: state.push, replace: state.replace }) }))
vi.mock('@/composables/useLearningProfile', () => ({ useLearningProfile: () => ({ profileId: ref('student') }) }))
vi.mock('@/stores/curriculumStore', () => ({ useCurriculumStore: () => ({ curriculumProfile: state.profile }) }))
vi.mock('@/services/learning-agent', () => ({ runtimeLearningAgentDecisionService: { prepare: state.prepare }, saveFormalAgentLaunch: state.save }))
import FormalLearningAgentPage from '@/pages/FormalLearningAgentPage.vue'

function decision() {
  return {
    status: 'READY', decision: { decisionId: 'decision', targetKnowledgePointId: 'target', action: 'NEXT', confidence: 0.5, reasons: [] },
    context: { currentLearning: { unitId: 'old-unit', lessonId: 'old-lesson', knowledgePointId: 'old-point' }, mapNodes: [{ unitId: 'new-unit', lessonId: 'new-lesson', knowledgePointId: 'target', status: 'available' }] },
    activityPlan: { estimatedQuestionCount: 5, difficulty: 0.4 },
  }
}
function page() {
  return mount(FormalLearningAgentPage, { global: { stubs: { AppShell: { template: '<main><slot /></main>' } } } })
}
beforeEach(() => {
  vi.clearAllMocks()
  state.query = {}
  state.prepare.mockResolvedValue(decision())
  state.save.mockReturnValue(true)
})
describe('formal Agent subject selection', () => {
  it('defaults to math, switches to Chinese and launches the decision target instead of the current lesson', async () => {
    const wrapper = page()
    await flushPromises()
    expect(state.prepare).toHaveBeenLastCalledWith('student', 'math')
    await wrapper.get('select').setValue('CHINESE')
    await flushPromises()
    expect(state.replace).toHaveBeenCalledWith({ query: { subject: 'CHINESE' } })
    expect(state.prepare).toHaveBeenLastCalledWith('student', 'chinese')
    await wrapper.get('button').trigger('click')
    expect(state.push).toHaveBeenCalledWith(expect.objectContaining({ path: '/assessment', query: expect.objectContaining({ textbookId: 'chinese', unitId: 'new-unit', lessonId: 'new-lesson', knowledgePointId: 'target', agentSubject: 'CHINESE' }) }))
    wrapper.unmount()
  })
  it('restores the requested subject and leaves the selector available after a blocked decision', async () => {
    state.query = { subject: 'ENGLISH' }
    state.prepare.mockResolvedValueOnce({ status: 'BLOCKED' })
    const wrapper = page()
    await flushPromises()
    expect(state.prepare).toHaveBeenLastCalledWith('student', 'english')
    expect(wrapper.get('select').attributes('disabled')).toBeUndefined()
    await wrapper.get('select').setValue('MATH')
    await flushPromises()
    expect(wrapper.text()).toContain('开始正式练习')
    wrapper.unmount()
  })
})
