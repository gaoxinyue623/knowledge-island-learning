import { afterEach, describe, expect, it } from 'vitest'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { AdaptiveLearningPlan } from '@/services/learning-agent/adaptiveLearningPlan'
import {
  adaptivePlanCheckpointScope,
  clearAdaptivePlanCheckpoint,
  loadAdaptivePlanCheckpoint,
  saveAdaptivePlanCheckpoint,
} from '@/services/learning-agent/adaptivePlanCheckpointStorage'

const scope = adaptivePlanCheckpointScope('demo', 'AGENT_STUDENT', 'AGENT_TEXTBOOK', 'A', 'MOCK')

function answers(plan: AdaptiveLearningPlan) {
  return plan.current!.generatedResources.questions.map((question) => ({
    questionId: question.id,
    answer: {
      type: 'calculation' as const,
      value: String(question.answerRule.ruleType === 'NUMERIC' ? question.answerRule.value : 0),
    },
  }))
}

describe('adaptive plan session checkpoint', () => {
  afterEach(() => clearAdaptivePlanCheckpoint(scope))

  it('saves a ready task and restores it with the same questions and plan state', async () => {
    const original = new AdaptiveLearningPlan(
      createAgentScenario('A'),
      2,
      'MOCK',
      'checkpoint-test',
      AGENT_SIMULATION_TIME,
    )
    await original.next()
    const questionIds = original.current!.generatedResources.questions.map(
      (question) => question.id,
    )
    expect(saveAdaptivePlanCheckpoint(scope, original)).toBe(true)
    const saved = loadAdaptivePlanCheckpoint(scope)
    expect(saved).toMatchObject({ schemaVersion: 1, status: 'READY', taskLimit: 2, mode: 'MOCK' })

    const restored = AdaptiveLearningPlan.restore(saved!)
    expect(restored.status).toBe('READY')
    expect(restored.current!.generatedResources.questions.map((question) => question.id)).toEqual(
      questionIds,
    )
    await restored.submit(answers(restored))
    expect(restored.status).toBe('REVIEW')
    expect(restored.report!.evidenceCount).toBe(5)
  })

  it('restores completed reviews and permits a follow-up from the learned snapshot', async () => {
    const original = new AdaptiveLearningPlan(
      createAgentScenario('A'),
      1,
      'MOCK',
      'complete-checkpoint',
      AGENT_SIMULATION_TIME,
    )
    await original.next()
    await original.submit(answers(original))
    expect(original.status).toBe('COMPLETE')
    saveAdaptivePlanCheckpoint(scope, original)
    const restored = AdaptiveLearningPlan.restore(loadAdaptivePlanCheckpoint(scope)!)
    expect(restored.status).toBe('COMPLETE')
    expect(restored.report!.completedTasks).toBe(1)
    const followUp = restored.createFollowUp()
    await followUp.next()
    expect(followUp.current!.decision).toEqual(restored.report!.recommendation)
  })

  it('fails closed for corrupt or unsafe checkpoints and never serializes a busy plan', async () => {
    sessionStorage.setItem('knowledge-island.learning-agent.plan.v1:corrupt', '{bad json')
    expect(loadAdaptivePlanCheckpoint('corrupt')).toBeNull()
    const plan = new AdaptiveLearningPlan(
      createAgentScenario('A'),
      1,
      'MOCK',
      'busy-checkpoint',
      AGENT_SIMULATION_TIME,
    )
    expect(() => plan.checkpoint()).toThrow('AGENT_PLAN_CHECKPOINT_BUSY')
    await plan.next()
    const checkpoint = plan.checkpoint()
    checkpoint.baseline.dataset = 'profile'
    expect(() => AdaptiveLearningPlan.restore(checkpoint)).toThrow('AGENT_PLAN_CHECKPOINT_INVALID')
  })

  it('treats unavailable session storage as an optional recovery feature', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    const original = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: original.getItem.bind(original),
        removeItem: original.removeItem.bind(original),
        setItem() {
          throw new Error('QUOTA')
        },
      },
    })
    const plan = new AdaptiveLearningPlan(
      createAgentScenario('A'),
      1,
      'MOCK',
      'storage-failure',
      AGENT_SIMULATION_TIME,
    )
    await plan.next()
    try {
      expect(saveAdaptivePlanCheckpoint(scope, plan)).toBe(false)
    } finally {
      if (descriptor) Object.defineProperty(window, 'sessionStorage', descriptor)
    }
  })
})
