import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, expect, it, vi } from 'vitest'
import QuestionEnginePage from '@/pages/QuestionEnginePage.vue'
import { useStudentStore } from '@/stores/studentStore'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { correctAnswerDraft } from '@/services/question-engine'
import {
  saveFormalAgentLaunch,
  clearFormalAgentLaunch,
} from '@/services/learning-agent/formalAgentLaunchStorage'
import { runtimeLearningAgentExecutionService } from '@/services/learning-agent/runtimeExecutionService'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'

const launchId = 'formal-page-clone-test'
afterEach(() => {
  vi.restoreAllMocks()
  clearFormalAgentLaunch(launchId)
})
it('submits answers, advances to the next question and returns to the selected subject', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const studentId = 'formal-page-student'
  useStudentStore().profile = { id: studentId, displayName: '测试档案' }
  const snapshot = createAgentScenario('A')
  const decision = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(
    buildAgentContext(
      snapshot,
      snapshot.profile.studentId,
      'AGENT_TEXTBOOK',
      AGENT_SIMULATION_TIME,
      DEFAULT_LEARNING_PLANNER_CONFIG,
    ).context,
  )
  const textbookId = 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE'
  const launch = {
    id: launchId,
    profileId: studentId,
    textbookId,
    createdAt: AGENT_SIMULATION_TIME,
    decision: { ...decision, profileId: studentId, textbookId },
  }
  expect(saveFormalAgentLaunch(launch)).toBe(true)
  const open = vi
    .spyOn(runtimeLearningAgentExecutionService, 'open')
    .mockImplementation(async (request) => {
      expect(request.profileId).toBe(studentId)
      return {
        status: 'READY',
        code: 'test',
        session: null,
        appendedEvidence: [],
        records: [],
        trace: { traceId: 'test', events: [] },
        analyses: [],
      }
    })
  const submit = vi
    .spyOn(runtimeLearningAgentExecutionService, 'submit')
    .mockImplementation(async (request) => {
      expect(request.profileId).toBe(studentId)
      return {
        status: 'COMPLETED',
        code: 'test',
        session: null,
        appendedEvidence: [],
        records: [],
        trace: { traceId: 'test', events: [] },
        analyses: [],
      }
    })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/assessment', component: QuestionEnginePage },
      { path: '/learning-agent', component: { template: '<p>Agent</p>' } },
      { path: '/lesson', component: { template: '<p>Lesson</p>' } },
    ],
  })
  await router.push({
    path: '/assessment',
    query: {
      textbookId,
      unitId: 'G1_SHENZHEN_MATH_S1_UNIT_01',
      lessonId: 'G1_SHENZHEN_MATH_S1_LESSON_02',
      knowledgePointId: 'G1_SHENZHEN_MATH_S1_KP_02',
      agentLaunchId: launchId,
      agentSubject: 'MATH',
      sessionScope: launchId,
    },
  })
  await router.isReady()
  const wrapper = mount(QuestionEnginePage, {
    global: {
      plugins: [pinia, router],
      stubs: { AppShell: { template: '<main><slot /></main>' } },
    },
  })
  try {
    await flushPromises()
    expect(open).toHaveBeenCalledTimes(1)
    const store = useQuestionEngineStore()
    expect(store.currentQuestion).toBeTruthy()
    await store.setAnswerDraft(
      correctAnswerDraft(
        store.questions.find((question) => question.id === store.currentQuestion!.id)!,
      ),
    )
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '提交答案')!
      .trigger('click')
    await flushPromises()
    expect(submit).toHaveBeenCalledTimes(1)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '下一题')!
      .trigger('click')
    await flushPromises()
    expect(store.currentQuestionIndex).toBe(1)
    await wrapper
      .findAll('a')
      .find((link) => link.text() === '返回 Agent 学习建议')!
      .trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/learning-agent?subject=MATH')
  } finally {
    wrapper.unmount()
  }
})
