import { describe, expect, it } from 'vitest'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { AdaptiveLearningPlan } from '@/services/learning-agent/adaptiveLearningPlan'

describe('adaptive learning plan', () => {
  it('prepares a task, requires every answer, and updates the next-task state in memory', async () => {
    const plan = new AdaptiveLearningPlan(
      createAgentScenario('A'),
      2,
      'MOCK',
      'test-plan',
      AGENT_SIMULATION_TIME,
    )
    await plan.next()
    expect(plan.status).toBe('READY')
    expect(plan.current?.decision?.action).toBe('REINFORCE')
    expect(plan.current?.generatedResources.questions).toHaveLength(5)

    await plan.submit([])
    expect(plan.status).toBe('READY')
    expect(plan.error).toContain('提交未完成')

    const answers = plan.current!.generatedResources.questions.map((question) => ({
      questionId: question.id,
      answer: {
        type: 'calculation' as const,
        value: String(question.answerRule.ruleType === 'NUMERIC' ? question.answerRule.value : ''),
      },
    }))
    await plan.submit(answers)
    expect(plan.status).toBe('REVIEW')
    expect(plan.completed).toHaveLength(1)
    expect(plan.completed[0]!.analyses.every((analysis) => analysis.correct)).toBe(true)

    await plan.next()
    expect(plan.status).toBe('READY')
    expect(plan.completed).toHaveLength(1)
  })

  it('blocks a rejected curriculum task without exposing unvalidated resources', async () => {
    const plan = new AdaptiveLearningPlan(
      createAgentScenario('H'),
      1,
      'MOCK',
      'blocked-plan',
      AGENT_SIMULATION_TIME,
    )
    await plan.next()
    expect(plan.status).toBe('BLOCKED')
    expect(plan.current).toBeNull()
    expect(plan.error).toContain('未通过校验')
  })
})
