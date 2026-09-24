import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { AdaptiveLearningPlan } from '@/services/learning-agent/adaptiveLearningPlan'
import { LearningAgentSimulation } from '@/services/learning-agent/simulationService'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { buildAdaptivePlanReport } from '@/services/learning-agent/adaptivePlanReport'

function answers(plan: AdaptiveLearningPlan, correct: boolean) {
  return plan.current!.generatedResources.questions.map((question) => ({
    questionId: question.id,
    answer: {
      type: 'calculation' as const,
      value: String(
        Number(question.answerRule.ruleType === 'NUMERIC' ? question.answerRule.value : 0) +
          (correct ? 0 : 1),
      ),
    },
  }))
}

function makePlan(scenario = 'A', limit = 2) {
  return new AdaptiveLearningPlan(
    createAgentScenario(scenario),
    limit,
    'MOCK',
    'report-test',
    AGENT_SIMULATION_TIME,
  )
}

describe('adaptive plan learning report', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reports only committed tasks and never counts a rejected submission or a replay twice', async () => {
    const plan = makePlan()
    expect(plan.report).toBeNull()
    await plan.next()
    expect(plan.report).toBeNull()
    await plan.submit([])
    expect(plan.report).toBeNull()
    const submitted = answers(plan, true)
    await plan.submit(submitted)
    expect(plan.report).toMatchObject({
      completedTasks: 1,
      taskLimit: 2,
      totalAnswers: 5,
      correctAnswers: 5,
      incorrectAnswers: 0,
      evidenceCount: 5,
      wrongAnswers: [],
    })
    const report = plan.report
    await plan.submit(submitted)
    expect(plan.report).toEqual(report)
    await plan.next()
    expect(plan.report).toEqual(report)
  })

  it('uses authoritative mastery records, counts new evidence, and preserves the input snapshot', async () => {
    const snapshot = createAgentScenario('A')
    const initial = structuredClone(snapshot)
    const plan = new AdaptiveLearningPlan(snapshot, 1, 'MOCK', 'report', AGENT_SIMULATION_TIME)
    await plan.next()
    await plan.submit(answers(plan, true))
    const report = plan.report!
    expect(report.masteryChanges).toHaveLength(1)
    const change = report.masteryChanges[0]!
    const previous = initial.masteryRecords.find(
      (r) => r.knowledgePointId === change.knowledgePointId,
    )!
    expect(change.before).toMatchObject({
      masteryScore: previous.masteryScore,
      evidenceCount: previous.evidenceCount,
    })
    expect(change.after!.masteryScore).toBeGreaterThan(change.before!.masteryScore)
    expect(change.after!.masteryScore).toBeLessThan(100)
    expect(change.after!.evidenceCount).toBe(previous.evidenceCount + 5)
    expect(change.after!.algorithmVersion).toBe(previous.algorithmVersion)
    expect(change.evidenceCount).toBe(5)
    expect(snapshot).toEqual(initial)
    // Returned reports do not expose writable references into the plan's learned state.
    change.after!.masteryScore = 999
    expect(plan.report!.masteryChanges[0]!.after!.masteryScore).toBeLessThan(100)
  })

  it('distinguishes missing evidence from observed zero mastery', async () => {
    const plan = makePlan('G', 1)
    await plan.next()
    await plan.submit(answers(plan, false))
    expect(plan.report!.masteryChanges[0]).toMatchObject({
      before: null,
      after: { masteryScore: 0, evidenceCount: 5 },
    })
  })

  it('keeps wrong answers from earlier groups with their submitted and correct values', async () => {
    const plan = makePlan()
    await plan.next()
    const questions = structuredClone(plan.current!.generatedResources.questions)
    const submitted = answers(plan, false).reverse()
    await plan.submit(submitted)
    const firstReport = plan.report!
    expect(firstReport.recommendation!.action).toBe('SIMPLIFY')
    expect(firstReport.recommendation!.reasons.map((r) => r.code)).toContain('CONSECUTIVE_ERRORS')
    await plan.next()
    await plan.submit(answers(plan, true))
    const report = plan.report!
    expect(report).toMatchObject({
      completedTasks: 2,
      totalAnswers: 10,
      correctAnswers: 5,
      incorrectAnswers: 5,
      evidenceCount: 10,
    })
    expect(report.wrongAnswers).toHaveLength(5)
    for (const [index, item] of report.wrongAnswers.entries()) {
      const q = questions[index]!
      expect(item.taskNumber).toBe(1)
      expect(item.questionId).toBe(q.id)
      expect(item.submittedAnswer).toBe(submitted.find((a) => a.questionId === q.id)!.answer.value)
      expect(item.expectedAnswer).toBe(
        String(q.answerRule.ruleType === 'NUMERIC' ? q.answerRule.value : ''),
      )
    }
  })

  it('previews the actual next decision without generating questions or calling the network', async () => {
    const plan = makePlan('A', 1)
    await plan.next()
    await plan.submit(answers(plan, false))
    const run = vi.spyOn(LearningAgentSimulation.prototype, 'run')
    const fetcher = vi.spyOn(globalThis, 'fetch')
    const report = plan.report!
    expect(plan.report).toEqual(report)
    expect(run).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
    const next = plan.createFollowUp()
    expect(next.report).toBeNull()
    await next.next()
    expect(next.current!.decision).toEqual(report.recommendation)
    await next.submit(answers(next, true))
    expect(next.report!.masteryChanges[0]!.before).toEqual(report.masteryChanges[0]!.after)
    expect(next.report!.evidenceCount).toBe(5)
    expect(plan.report).toEqual(report)
  })

  it('does not suggest another due review after a fully correct review task', async () => {
    const plan = makePlan('D', 1)
    await plan.next()
    expect(plan.current!.decision!.action).toBe('REVIEW')
    await plan.submit(answers(plan, true))
    expect(plan.report!.recommendation!.reasons.map((r) => r.code)).not.toContain('REVIEW_DUE')
  })

  it('keeps committed feedback if recommendation construction fails, without leaking errors', async () => {
    const plan = makePlan('A', 1)
    await plan.next()
    vi.spyOn(LearningPlanner.prototype, 'plan').mockImplementation(() => {
      throw new Error('SECRET_PROVIDER_DETAIL')
    })
    await plan.submit(answers(plan, true))
    expect(plan.status).toBe('COMPLETE')
    expect(plan.report).toMatchObject({ correctAnswers: 5, recommendation: null })
    expect(plan.report!.recommendationError).toContain('已完成的作答与复盘仍保留')
    expect(JSON.stringify(plan.report)).not.toContain('SECRET_PROVIDER_DETAIL')
  })

  it('preserves a partial report after later generation fails and disallows premature continuation', async () => {
    const plan = makePlan()
    expect(() => plan.createFollowUp()).toThrow('AGENT_PLAN_NOT_COMPLETE')
    await plan.next()
    await plan.submit(answers(plan, true))
    const report = plan.report
    vi.spyOn(LearningAgentSimulation.prototype, 'run').mockRejectedValue(new Error('UNAVAILABLE'))
    await plan.next()
    expect(plan.status).toBe('BLOCKED')
    expect(plan.report).toEqual(report)
    expect(() => plan.createFollowUp()).toThrow('AGENT_PLAN_NOT_COMPLETE')
  })

  it('excludes mastery belonging to another profile from the report baseline', async () => {
    const plan = makePlan('A', 1)
    await plan.next()
    await plan.submit(answers(plan, true))
    const snapshot = createAgentScenario('A')
    const foreign = structuredClone(
      snapshot.masteryRecords.find((r) => r.knowledgePointId === 'AGENT_KP_CURRENT')!,
    )
    foreign.studentProfileId = 'ANOTHER_STUDENT'
    foreign.masteryScore = 99
    snapshot.masteryRecords.unshift(foreign)
    const report = buildAdaptivePlanReport(snapshot, snapshot, plan.completed, 1)!
    expect(report.masteryChanges[0]!.before!.masteryScore).not.toBe(99)
    expect(report.evidenceCount).toBe(0)
  })
})
