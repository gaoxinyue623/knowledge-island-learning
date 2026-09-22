import { describe, expect, it, vi } from 'vitest'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { AIQuestionGenerator } from '@/services/learning-agent/aiQuestionGenerator'
import { LLMRuntime } from '@/services/llm/runtime'
import { MockLLMProvider } from '@/services/llm/mockProvider'
import { LLMError } from '@/services/llm/errors'
import { QuestionGenerationPromptBuilder } from '@/services/llm/questionPromptBuilder'
import { GeneratedQuestionValidator } from '@/services/learning-agent/generatedQuestionValidator'
import { mathConstraintChecks } from '@/services/learning-agent/mathConstraints'
import { LearningOrchestrator } from '@/services/learning-agent/learningOrchestrator'
import type { QuestionGenerationRequest } from '@/types/learning-agent'
import type { GeneratedQuestionDTO } from '@/services/llm/questionSchema'

function fixture(count = 2, target = 'AGENT_KP_CURRENT') {
  const snapshot = createAgentScenario('A')
  const request: QuestionGenerationRequest = {
    requestId: 'domain-request-private-profile',
    profileId: 'AGENT_STUDENT',
    curriculum: {
      regionId: 'AGENT_REGION',
      grade: 'AGENT_G2',
      semester: 'AGENT_S1',
      subject: 'MATH',
      subjectId: 'AGENT_MATH',
      publisher: 'AGENT_PUBLISHER',
      textbookId: 'AGENT_TEXTBOOK',
    },
    targetKnowledgePoints: [target],
    difficulty: 0.7,
    count,
    allowedQuestionTypes: ['calculation'],
    constraints: {
      templateIds: [`AGENT_TEMPLATE_${target}_4`],
      maxTextLength: 2000,
      questionMix: {
        directPractice: 1,
        variationPractice: 0,
        wrongQuestionVariation: 0,
        application: 0,
        review: 0,
      },
    },
    weaknessSignals: ['LOW_MASTERY'],
    errorPatterns: [
      { domain: 'MATH', code: 'BORROWING_ERROR', category: 'ARITHMETIC', confidence: 0.9 },
    ],
    recentQuestionRefs: [],
    avoidQuestionRefs: [],
    generationReason: [],
    seed: 'test',
    createdAt: AGENT_SIMULATION_TIME,
  }
  return { snapshot, request }
}
function dto(
  left = 52,
  right = 27,
  overrides: Partial<GeneratedQuestionDTO> = {},
): GeneratedQuestionDTO {
  return {
    temporaryId: `${left}-${right}`,
    questionType: 'calculation',
    stem: `${left} - ${right} = ?`,
    expectedAnswer: left - right,
    explanation: `从 ${left} 中去掉 ${right}，还剩 ${left - right}。`,
    knowledgePointIds: ['AGENT_KP_CURRENT'],
    difficulty: 0.7,
    ...overrides,
  }
}
function generator(
  respond: ConstructorParameters<typeof MockLLMProvider>[0],
  snapshot = fixture().snapshot,
) {
  return new AIQuestionGenerator(new LLMRuntime(new MockLLMProvider(respond)), snapshot, 100)
}

describe('AI question generation, validation, repair and fallback', () => {
  it('independently validates 52 - 27 and keeps existing domain provenance', async () => {
    const { snapshot, request } = fixture()
    const batch = await generator(() => ({ questions: [dto(), dto(63, 28)] }), snapshot).generate(
      request,
    )
    expect(batch.validation.status).toBe('VALID')
    expect(batch.questions[0].answerRule).toEqual({ ruleType: 'NUMERIC', value: 25 })
    expect(batch.telemetry).toMatchObject({ status: 'READY', fallbackUsed: false, repairCount: 0 })
    expect(
      batch.questions.every(
        (q) => q.isSample && q.needsVerification && q.status === 'AI_GENERATED',
      ),
    ).toBe(true)
    expect(new GeneratedQuestionValidator().validate(batch, request, snapshot).status).toBe('VALID')
  })
  it('preserves valid items and repairs only incorrect/missing items', async () => {
    const { request } = fixture()
    const calls: string[] = []
    const schemas: Record<string, unknown>[] = []
    const batch = await generator((req) => {
      calls.push(req.userPrompt)
      schemas.push(req.jsonSchema)
      return {
        questions:
          calls.length === 1 ? [dto(), dto(63, 28, { expectedAnswer: 99 })] : [dto(63, 28)],
      }
    }).generate(request)
    expect(batch.validation.status).toBe('VALID')
    expect(batch.questions[0].id).toContain(':ai:0:1')
    expect(batch.questions[1].id).toContain(':ai:1:1')
    const repair = JSON.parse(calls[1].slice(calls[1].indexOf('{')))
    expect(repair.questionCount).toBe(1)
    expect(repair.acceptedStems).toEqual(['52 - 27 = ?'])
    expect(repair.repair.failedQuestions).toHaveLength(1)
    expect(repair.repair.validationErrors).toContain('INDEPENDENT_ANSWER_CHECK')
    expect(batch.telemetry?.repairCount).toBe(1)
    expect(batch.telemetry?.usage[1].promptId).toBe('question-generation.repair.v6')
    for (const [index, schema] of schemas.entries())
      expect(schema).toMatchObject({
        properties: {
          questions: {
            minItems: index === 0 ? 2 : 1,
            maxItems: index === 0 ? 2 : 1,
            items: {
              properties: {
                difficulty: { const: request.difficulty },
                knowledgePointIds: {
                  minItems: 1,
                  maxItems: 1,
                  items: { enum: request.targetKnowledgePoints },
                },
              },
            },
          },
        },
      })
  })
  it('retains all eighteen accepted questions while repairing two in a twenty-question batch', async () => {
    const { request } = fixture(20)
    const accepted = Array.from({ length: 18 }, (_, i) =>
      dto(30 + Math.floor(i / 9) * 10 + (i % 9), 19),
    )
    const counts: number[] = []
    const batch = await generator((req) => {
      const context = JSON.parse(req.userPrompt.slice(req.userPrompt.indexOf('{')))
      counts.push(context.questionCount)
      return {
        questions:
          counts.length === 1
            ? [...accepted, dto(52, 27, { expectedAnswer: 0 }), dto(63, 28, { expectedAnswer: 0 })]
            : [dto(), dto(63, 28)],
      }
    }).generate(request)
    expect(counts).toEqual([20, 2])
    expect(batch.questions.slice(0, 18).map((q) => q.stem[0].text)).toEqual(
      accepted.map((q) => q.stem),
    )
    expect(batch.questions.slice(0, 18).every((q) => q.id.includes(':ai:0:'))).toBe(true)
    expect(batch.questions).toHaveLength(20)
    expect(batch.validation.status).toBe('VALID')
  })
  it('salvages schema-valid siblings when one item violates the strict schema', async () => {
    let call = 0
    const batch = await generator(() => ({
      questions: call++ === 0 ? [dto(), { ...dto(63, 28), expectedAnswer: '35' }] : [dto(63, 28)],
    })).generate(fixture().request)
    expect(batch.validation.status).toBe('VALID')
    expect(batch.questions[0].id).toContain(':ai:0:1')
    expect(batch.telemetry?.usage[0].errorType).toBe('STRUCTURED_OUTPUT_ERROR')
    expect(batch.telemetry?.events.some((e) => e.event === 'STRUCTURED_OUTPUT_INVALID')).toBe(true)
  })
  it.each([
    { label: 'wrong answer', bad: dto(63, 28, { expectedAnswer: 34 }) },
    { label: 'wrong point', bad: dto(63, 28, { knowledgePointIds: ['UNAUTHORIZED'] }) },
    { label: 'wrong difficulty', bad: dto(63, 28, { difficulty: 0.5 }) },
    { label: 'no borrowing', bad: dto(65, 24) },
    { label: 'duplicate', bad: dto(52, 27, { temporaryId: 'other' }) },
    { label: 'unsafe explanation', bad: dto(63, 28, { explanation: '<script>bad</script>' }) },
    { label: 'false explanation', bad: dto(63, 28, { explanation: '从 63 中去掉 28，还剩 99。' }) },
    { label: 'out of range', bad: dto(152, 27) },
  ])('repairs $label without replacing the first accepted question', async ({ bad }) => {
    let count = 0
    const batch = await generator(() => ({
      questions: count++ ? [dto(63, 28)] : [dto(), bad],
    })).generate(fixture().request)
    expect(batch.validation.status).toBe('VALID')
    expect(count).toBe(2)
    expect(batch.questions[0].id).toContain(':ai:0:1')
    expect(batch.telemetry?.fallbackUsed).toBe(false)
  })
  it('stops at three generation attempts and fills only missing questions using validated Mock', async () => {
    const respond = vi.fn(() => ({ questions: [dto()] }))
    const batch = await generator(respond).generate(fixture().request)
    expect(respond).toHaveBeenCalledTimes(3)
    expect(batch.telemetry).toMatchObject({
      fallbackUsed: true,
      repairCount: 2,
      status: 'FALLBACK',
    })
    expect(batch.telemetry?.fallbackReason).toContain('DUPLICATE')
    expect(batch.questions[0].id).toContain(':ai:0:1')
    expect(batch.questions).toHaveLength(2)
    expect(batch.validation.status).toBe('VALID')
  })
  it('falls back immediately on non-repairable auth failure and never leaks provider errors', async () => {
    const respond = vi.fn(() => {
      throw new LLMError('AUTH_ERROR')
    })
    const batch = await generator(respond).generate(fixture().request)
    expect(respond).toHaveBeenCalledTimes(1)
    expect(batch.telemetry).toMatchObject({
      fallbackUsed: true,
      fallbackReason: 'AUTH_ERROR',
      repairCount: 0,
    })
    expect(batch.validation.status).toBe('VALID')
  })
  it('rejects fallback when constraints cannot be satisfied', async () => {
    const { request } = fixture(1)
    request.constraints.math = {
      minNumber: 0,
      maxNumber: 100,
      allowedOperations: ['-'],
      requireBorrowing: true,
      requireCarrying: true,
    }
    const batch = await generator(() => ({ questions: [] })).generate(request)
    expect(batch.telemetry).toMatchObject({ fallbackUsed: true, status: 'REJECTED' })
    expect(batch.validation.status).toBe('INVALID')
    expect(batch.questions).toHaveLength(0)
  })
  it('validates carrying addition and detects ranges, operation and negative results', async () => {
    const { request, snapshot } = fixture(1, 'AGENT_KP_BASE')
    request.constraints.math = {
      minNumber: 0,
      maxNumber: 100,
      allowedOperations: ['+'],
      requireCarrying: true,
    }
    const batch = await generator(
      () => ({
        questions: [
          dto(25, 37, {
            stem: '25 + 37 = ?',
            expectedAnswer: 62,
            explanation: '把 25 和 37 合在一起，结果是 62。',
            knowledgePointIds: ['AGENT_KP_BASE'],
          }),
        ],
      }),
      snapshot,
    ).generate(request)
    expect(batch.validation.status).toBe('VALID')
    expect(
      mathConstraintChecks('25 + 31 = ?', request.constraints.math).find(
        (c) => c.code === 'REQUIRE_CARRYING',
      )?.pass,
    ).toBe(false)
    expect(
      mathConstraintChecks('80 + 37 = ?', request.constraints.math).find(
        (c) => c.code === 'MAX_NUMBER',
      )?.pass,
    ).toBe(false)
    expect(
      mathConstraintChecks('25 - 37 = ?', request.constraints.math).find(
        (c) => c.code === 'MIN_NUMBER',
      )?.pass,
    ).toBe(false)
    expect(
      mathConstraintChecks('2 * 3 = ?', request.constraints.math).find(
        (c) => c.code === 'ALLOWED_OPERATIONS',
      )?.pass,
    ).toBe(false)
  })
  it('minimizes prompts and removes identifiers and arbitrary personal text from every repair', () => {
    const { request, snapshot } = fixture()
    request.profileId = 'PRIVATE_STUDENT_NAME'
    request.requestId = 'PRIVATE_REQUEST_PROFILE'
    request.weaknessSignals.push('PRIVATE_PHONE_13800000000')
    request.errorPatterns.push({
      code: 'PRIVATE_SCHOOL',
      category: 'PRIVATE_NAME',
      domain: 'PRIVATE_ADDRESS',
      confidence: 1,
    })
    request.generationReason = [
      { code: 'X', message: 'PRIVATE_PARENT_NAME', evidenceType: 'ATTEMPT' },
    ]
    const prompt = new QuestionGenerationPromptBuilder().build(request, snapshot, {
      count: 1,
      accepted: ['52 - 27 = ?'],
      repair: {
        failedQuestions: [
          dto(1, 1, {
            stem: 'PRIVATE_NAME',
            explanation: 'PRIVATE_ADDRESS',
            temporaryId: 'PRIVATE_ID',
          }),
        ],
        validationErrors: ['INDEPENDENT_ANSWER_CHECK'],
      },
    })
    expect(JSON.stringify(prompt)).not.toContain('PRIVATE_')
    expect(prompt.userPrompt).toContain('BORROWING_ERROR')
    expect(prompt.userPrompt).toContain('二年级')
    expect(prompt.userPrompt).toContain('questionMix')
  })
  it('serializes explicit variation bounds and original operands for wrong-question practice', () => {
    const { request, snapshot } = fixture()
    request.difficulty = 0.4
    request.constraints.templateIds = ['AGENT_TEMPLATE_AGENT_KP_CURRENT_3']
    request.constraints.math = {
      minNumber: 0,
      maxNumber: 100,
      allowedOperations: ['-'],
      requireBorrowing: true,
      minLargestOperand: 20,
      maxLargestOperand: 49,
    }
    request.weaknessSignals = ['ACTIVE_WRONG_QUESTION']
    request.avoidQuestionRefs = ['agent-example']
    const prompt = new QuestionGenerationPromptBuilder().build(request, snapshot, {
      count: 1,
      accepted: [],
    })
    const context = JSON.parse(prompt.userPrompt.slice(prompt.userPrompt.indexOf('{')))
    expect(prompt.definition.id).toBe('question-generation.user.v6')
    expect(context.variation).toEqual([
      expect.objectContaining({
        original: '52 - 27 = ?',
        originalLeft: 52,
        originalRight: 27,
        originalOperator: '-',
        rules: expect.objectContaining({
          minLargestOperand: 20,
          maxLargestOperand: 49,
          bothOperandsMustChange: true,
          preserveKnowledgePoint: true,
          forbidExactOriginal: true,
        }),
      }),
    ])
  })
  it('repairs a wrong-question variation that copies one operand or exceeds the variation ceiling', async () => {
    const { request, snapshot } = fixture()
    request.count = 1
    request.difficulty = 0.4
    request.constraints.templateIds = ['AGENT_TEMPLATE_AGENT_KP_CURRENT_3']
    request.constraints.math = {
      minNumber: 0,
      maxNumber: 100,
      allowedOperations: ['-'],
      requireBorrowing: true,
      minLargestOperand: 20,
      maxLargestOperand: 49,
    }
    request.weaknessSignals = ['ACTIVE_WRONG_QUESTION']
    request.avoidQuestionRefs = ['agent-example']
    let call = 0
    const batch = await generator(() => {
      call += 1
      return {
        questions:
          call === 1
            ? [dto(48, 27, { difficulty: 0.4 })]
            : [dto(42, 17, { difficulty: 0.4 })],
      }
    }, snapshot).generate(request)
    expect(batch.validation.status).toBe('VALID')
    expect(batch.questions[0]!.stem[0]!.text).toBe('42 - 17 = ?')
    expect(batch.telemetry?.repairCount).toBe(1)
    expect(batch.telemetry?.usage[1]!.promptId).toBe('question-generation.repair.v6')
    expect(batch.validation.checks.some((check) => check.code === 'VARIATION_BOUNDS')).toBe(true)
    expect(batch.validation.checks.some((check) => check.code === 'VARIATION_OPERANDS')).toBe(true)
  })
  it('rejects production snapshots before calling a provider', async () => {
    const { request, snapshot } = fixture()
    snapshot.dataset = 'profile'
    const respond = vi.fn()
    await expect(generator(respond, snapshot).generate(request)).rejects.toThrow(
      'AGENT_PRODUCTION_DELIVERY_DISABLED',
    )
    expect(respond).not.toHaveBeenCalled()
  })
  it('integrates events with Orchestrator while leaving Planner decisions unchanged', async () => {
    const { snapshot } = fixture()
    const service = new LearningOrchestrator({ load: async () => snapshot })
    const options = { now: AGENT_SIMULATION_TIME, seed: 'trace' }
    const baseline = await service.prepareNextLearningTask(
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      options,
    )
    const result = await service.prepareNextLearningTask('AGENT_STUDENT', 'AGENT_TEXTBOOK', {
      ...options,
      questionProvider: generator(() => {
        throw new LLMError('CONFIG_ERROR')
      }, snapshot),
    })
    expect(result.decision).toEqual(baseline.decision)
    expect(result.status).toBe('READY')
    expect(result.questionGeneration?.fallbackUsed).toBe(true)
    expect(result.trace.events.map((e) => e.sequence)).toEqual(
      result.trace.events.map((_, i) => i + 1),
    )
    expect(result.trace.events.some((e) => e.event === 'QUESTION_GENERATION_FALLBACK')).toBe(true)
  })
})

describe('PHASE 18.3.2 generation chunks', () => {
  it('assembles original request identity, rejects cross-chunk duplicates and repairs only the missing slot', async () => {
    const { request, snapshot } = fixture(12)
    const pool = Array.from({ length: 12 }, (_, i) =>
      dto(30 + Math.floor(i / 9) * 10 + (i % 9), 19),
    )
    const contexts: Array<{
      questionCount: number
      acceptedStems: string[]
      recentQuestionSummary: string[]
    }> = []
    let cursor = 0
    const provider = new MockLLMProvider((req) => {
      const context = JSON.parse(req.userPrompt.slice(req.userPrompt.indexOf('{')))
      contexts.push(context)
      if (contexts.length === 2) return { questions: [pool[0], ...pool.slice(5, 9)] }
      if (contexts.length === 3) {
        cursor = 10
        return { questions: [pool[9]] }
      }
      const result = pool.slice(cursor, cursor + context.questionCount)
      cursor += context.questionCount
      return { questions: result }
    })
    const batch = await new AIQuestionGenerator(new LLMRuntime(provider), snapshot).generate(
      request,
    )
    expect(contexts.map((c) => c.questionCount)).toEqual([5, 5, 1, 2])
    expect(contexts[1]!.recentQuestionSummary).toHaveLength(5)
    expect(batch.requestId).toBe(request.requestId)
    expect(batch.questions).toHaveLength(12)
    expect(new Set(batch.questions.map((q) => q.id)).size).toBe(12)
    expect(batch.validation.status).toBe('VALID')
    expect(batch.telemetry?.attempts?.some((a) => a.normalizedDuplicates === 1)).toBe(true)
    expect(
      batch.telemetry?.origins &&
        Object.values(batch.telemetry.origins).every((o) => o === 'REAL_LLM'),
    ).toBe(true)
    expect(
      batch.telemetry?.events.filter((e) => e.event === 'QUESTION_GENERATION_READY'),
    ).toHaveLength(1)
  })

  it('does not count transport exhaustion as content repair or expose rejected batches as READY', async () => {
    const { request, snapshot } = fixture(6)
    const provider = new MockLLMProvider(() => {
      throw new LLMError('TIMEOUT', true)
    })
    request.constraints.math = {
      minNumber: 0,
      maxNumber: 100,
      allowedOperations: ['-'],
      requireCarrying: true,
    }
    const batch = await new AIQuestionGenerator(
      new LLMRuntime(provider, { maxRetries: 0 }),
      snapshot,
    ).generate(request)
    expect(batch.telemetry?.attempts?.every((a) => a.attempt === 0 && a.terminal)).toBe(true)
    expect(batch.telemetry?.repairCount).toBe(0)
    expect(batch.telemetry?.status).toBe('REJECTED')
    expect(batch.telemetry?.events.some((e) => e.event === 'QUESTION_GENERATION_READY')).toBe(false)
  })
})
