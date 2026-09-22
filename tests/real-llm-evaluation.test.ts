import { describe, expect, it } from 'vitest'
import { createAgentScenario } from '@/data/learning-agent/scenarios'
import { MockQuestionGenerator } from '@/services/learning-agent/generators'
import {
  buildDifficultySweep,
  buildEvaluationReport,
  REAL_LLM_GOLDEN_SCENARIOS,
  validateBatchCount,
  type EvaluationObservation,
} from '@/services/learning-agent/realLLMEvaluation'

describe('real LLM acceptance evaluation', () => {
  it('exposes the eight golden scenarios and supported batch sizes', () => {
    expect(REAL_LLM_GOLDEN_SCENARIOS).toHaveLength(8)
    for (const count of [1, 5, 10, 20, 50]) expect(() => validateBatchCount(count)).not.toThrow()
    expect(() => validateBatchCount(2)).toThrow('BATCH_COUNT_MUST_BE_ONE_OF')
  })

  it('builds a mixed carrying and borrowing batch as two independently constrained parts', () => {
    const scenario = REAL_LLM_GOLDEN_SCENARIOS.find((item) => item.id === 'H')!
    const parts = scenario.buildParts(0, 20)
    expect(parts).toHaveLength(2)
    expect(parts.reduce((sum, part) => sum + part.request.count, 0)).toBe(20)
    expect(parts[0]!.request.constraints.math?.requireCarrying).toBe(true)
    expect(parts[1]!.request.constraints.math?.requireBorrowing).toBe(true)
  })

  it('keeps REAL_LLM_ONLY metrics separate from SYSTEM_FINAL fallback results', async () => {
    const part = REAL_LLM_GOLDEN_SCENARIOS[0]!.buildParts(0, 5)[0]!
    for (const template of part.snapshot.templates)
      if (template.templateType === 'addition_range')
        Object.assign(template.config, { minAddend: 1, maxAddend: 9, maxResult: 9 })
    const generated = await new MockQuestionGenerator(part.snapshot.templates).generate(
      part.request,
    )
    const realQuestions = generated.questions.map((question, index) => ({
      ...question,
      id: `${part.request.requestId}:ai:0:${index}`,
    }))
    const realMappings = generated.mappings.map((mapping, index) => ({
      ...mapping,
      id: `mapping:real:${index}`,
      questionId: realQuestions[index]!.id,
    }))
    const observation: EvaluationObservation = {
      scenarioId: 'A',
      scenarioLabel: '100以内基础加法',
      batchIndex: 0,
      partId: 'main',
      request: part.request,
      snapshot: part.snapshot,
      batch: {
        ...generated,
        questions: realQuestions,
        mappings: realMappings,
        generator: { provider: 'OPENAI_COMPATIBLE', model: 'test', promptVersion: '1' },
        validation: { status: 'VALID', checks: [] },
        telemetry: {
          mode: 'REAL_LLM',
          fallbackUsed: false,
          repairCount: 0,
          status: 'READY',
          usage: [],
          events: [],
          origins: Object.fromEntries(realQuestions.map((q) => [q.id, 'REAL_LLM' as const])),
        },
      },
    }
    const report = buildEvaluationReport([observation], {
      provider: 'OPENAI_COMPATIBLE',
      model: 'test',
      batchCount: 1,
      batchSize: 5,
      apiKeyLeakage: false,
    })
    expect(report.REAL_LLM_ONLY.generatedQuestions).toBe(5)
    expect(report.SYSTEM_FINAL.generatedQuestions).toBe(5)
    expect(report.REAL_LLM_ONLY.mathCorrectness).toBe(1)
    expect(report.humanReview.status).toBe('PENDING')
    expect(report.acceptanceStatus).toBe('INCONCLUSIVE')
    expect(report.coverageComplete).toBe(false)
    expect(report.difficultySweep.gradientPassed).toBe(false)

    observation.batch!.telemetry!.origins![realQuestions[0]!.id] = 'MOCK'
    observation.batch!.telemetry!.fallbackUsed = true
    const fallback = buildEvaluationReport([observation], {
      provider: 'OPENAI_COMPATIBLE',
      model: 'test',
      batchCount: 1,
      batchSize: 5,
    })
    expect(fallback.REAL_LLM_ONLY.generatedQuestions).toBe(4)
    expect(fallback.SYSTEM_FINAL.generatedQuestions).toBe(5)
    expect(fallback.REAL_LLM_ONLY.fallbackRate).toBe(1)

    observation.batch!.validation.status = 'INVALID'
    const invalidReady = buildEvaluationReport([observation], {
      provider: 'OPENAI_COMPATIBLE',
      model: 'test',
      batchCount: 1,
      batchSize: 5,
    })
    expect(invalidReady.gates.blocking.invalidReadyZero).toBe(false)
    expect(invalidReady.acceptanceStatus).toBe('FAIL')
  })

  it('creates the four-point difficulty sweep without changing production scenarios', () => {
    const sweep = buildDifficultySweep(0, 5)
    expect(sweep.map((part) => part.request.difficulty)).toEqual([0.2, 0.4, 0.6, 0.8])
    expect(createAgentScenario('A').templates.length).toBeGreaterThan(0)
  })
})

describe('hardening metric integrity', () => {
  it('separates content repair slots from transport failures and batch incidence', async () => {
    const part = REAL_LLM_GOLDEN_SCENARIOS[0]!.buildParts(0, 20)[0]!
    const batch = await new MockQuestionGenerator(part.snapshot.templates).generate(part.request)
    const audit = {
      attempt: 0,
      requested: 20,
      received: 20,
      accepted: 19,
      schemaValid: 20,
      mathCorrect: 19,
      knowledgeMatch: 20,
      constraintValid: 20,
      exactDuplicates: 0,
      normalizedDuplicates: 0,
      errors: [],
      terminal: false,
    }
    batch.telemetry = {
      mode: 'REAL_LLM',
      status: 'REJECTED',
      fallbackUsed: false,
      repairCount: 1,
      usage: [],
      events: [],
      origins: {},
      attempts: [audit, { ...audit, attempt: 1, requested: 1, received: 1, accepted: 1 }],
    }
    const observation: EvaluationObservation = {
      ...part,
      scenarioId: 'A',
      scenarioLabel: 'test',
      batchIndex: 0,
      batch,
    }
    const timeout = structuredClone(observation)
    timeout.batchIndex = 1
    timeout.batch!.telemetry!.repairCount = 0
    timeout.batch!.telemetry!.fallbackUsed = true
    timeout.batch!.telemetry!.attempts = [
      {
        ...audit,
        received: 0,
        accepted: 0,
        errors: ['TIMEOUT'],
        terminal: true,
      },
    ]
    const report = buildEvaluationReport([observation, timeout], {
      provider: 'test',
      model: 'test',
      batchCount: 5,
      batchSize: 20,
    })
    expect(report.REAL_LLM_ONLY.repairRate).toBe(1 / 40)
    expect(report.REAL_LLM_ONLY.repairBatchRate).toBe(1 / 2)
    expect(report.REAL_LLM_ONLY.repairQuestions).toBe(1)
    expect(report.REAL_LLM_ONLY.repairedQuestions).toBe(1)
    expect(report.REAL_LLM_ONLY.repairSuccessRate).toBe(1)
    expect(report.REAL_LLM_ONLY.fallbackRate).toBe(1 / 2)
    expect(report.REAL_LLM_ONLY.firstPassValidRate).toBe(19 / 40)
  })
  it('never allows a subset or skipped difficulty ladder to pass acceptance', () => {
    const report = buildEvaluationReport([], {
      provider: 'test',
      model: 'test',
      batchCount: 1,
      batchSize: 20,
    })
    expect(report.acceptanceStatus).not.toBe('PASS')
    expect(report.gates.quality.difficultyGradient).toBe(false)
    expect(report.humanReview.selectedSamples).toBe(0)
  })
  it('maps increasing difficulty to independently checkable operand ranges', async () => {
    const { mathConstraintChecks } = await import('@/services/learning-agent/mathConstraints')
    const sweep = buildDifficultySweep(0, 20)
    const limits = sweep.map((p) => p.request.constraints.math!)
    expect(limits.map((m) => m.minLargestOperand)).toEqual([1, 20, 50, 80])
    expect(limits.map((m) => m.maxLargestOperand)).toEqual([19, 49, 79, 99])
    expect(mathConstraintChecks('42 - 18 = ?', limits[3]!).some((c) => !c.pass)).toBe(true)
    expect(mathConstraintChecks('83 - 19 = ?', limits[3]!).every((c) => c.pass)).toBe(true)
  })
})
