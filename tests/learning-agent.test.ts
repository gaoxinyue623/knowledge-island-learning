import { describe, expect, it, vi } from 'vitest'
import {
  AGENT_SCENARIOS,
  AGENT_SIMULATION_TIME as NOW,
  createAgentScenario,
  simulationMapping,
  simulationQuestion,
} from '@/data/learning-agent/scenarios'
import { LearningAgentSimulation } from '@/services/learning-agent/simulationService'
import { LearningOrchestrator } from '@/services/learning-agent/learningOrchestrator'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { DEFAULT_LEARNING_PLANNER_CONFIG as CONFIG } from '@/services/learning-agent/plannerConfig'
import { LearningPlanner, validateQuestionMix } from '@/services/learning-agent/learningPlanner'
import { buildGenerationRequests } from '@/services/learning-agent/generationServices'
import { MockQuestionGenerator, MockContentGenerator } from '@/services/learning-agent/generators'
import { GeneratedQuestionValidator } from '@/services/learning-agent/generatedQuestionValidator'
import { GeneratedContentValidator } from '@/services/learning-agent/generatedContentValidator'
import { DeterministicAnswerValidator } from '@/services/learning-agent/deterministicAnswerValidator'
import { AnswerAnalyzer } from '@/services/learning-agent/answerAnalyzer'
import { AgentEvaluationService } from '@/services/learning-agent/agentEvaluationService'
import { createQuestionSession } from '@/services/question-engine/questionEngineAdapter'
import { createReviewQueueStorage } from '@/services/review-queue/reviewQueueStorage'
import { createReviewQueueRepository } from '@/services/review-queue/reviewQueueRepository'
import { createQuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import type { AnswerAnalysisRequest, LearningAgentSnapshot } from '@/types/learning-agent'

function orchestrator(snapshot: LearningAgentSnapshot) {
  return new LearningOrchestrator({ load: async () => snapshot })
}
function run(snapshot = createAgentScenario('A')) {
  return orchestrator(snapshot).prepareNextLearningTask(
    snapshot.profile.studentId,
    snapshot.curriculum.textbook.id,
    { now: NOW, seed: 'test-seed' },
  )
}
async function generation() {
  const { context, snapshot } = buildAgentContext(
    createAgentScenario('A'),
    'AGENT_STUDENT',
    'AGENT_TEXTBOOK',
    NOW,
    CONFIG,
  )
  const decision = new LearningPlanner().plan(context)
  const requests = buildGenerationRequests(context, decision, snapshot, 'test-seed')
  const batch = await new MockQuestionGenerator(snapshot.templates).generate(requests.questions)
  return { context, snapshot, decision, requests, batch }
}

describe('PHASE17 deterministic scenarios and closed loop', () => {
  it.each(AGENT_SCENARIOS)('$id selects $expected and emits a complete trace', async (scenario) => {
    const result = await run(createAgentScenario(scenario.id))
    const evaluation = new AgentEvaluationService().evaluate([{ ...scenario, result }])
    expect(
      evaluation.results[0],
      JSON.stringify({
        action: result.decision?.action,
        failures: result.validation.checks.filter((c) => c.status !== 'PASS'),
      }),
    ).toMatchObject({ passed: true })
    expect(result.trace.events.at(-1)?.event).toBe(result.status)
  })
  it('replays the same inputs and seed without mutating facts or localStorage', async () => {
    const input = createAgentScenario('A'),
      before = structuredClone(input)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    expect(await run(input)).toEqual(await run(input))
    expect(input).toEqual(before)
    expect(write).not.toHaveBeenCalled()
    write.mockRestore()
  })
  it('normalizes authoritative 0–100 mastery and derives attempts only once', () => {
    const input = createAgentScenario('A')
    input.sessions.push(structuredClone(input.sessions[0]))
    const { context } = buildAgentContext(input, 'AGENT_STUDENT', 'AGENT_TEXTBOOK', NOW, CONFIG)
    expect(
      context.knowledgeState.knowledgePoints.find((k) => k.knowledgePointId === 'AGENT_KP_CURRENT'),
    ).toMatchObject({
      masteryScore: 0.3,
      correctCount: 3,
      incorrectCount: 7,
      attemptCount: 10,
      recentCorrectRate: 0.3,
    })
  })
  it('processes answers through existing evidence and mastery, then simplifies after repeated failure', async () => {
    const sim = new LearningAgentSimulation(createAgentScenario('A'))
    const first = await sim.run(NOW)
    const before = sim.snapshot.evidence.length
    const answers = await sim.answer(first, 'REPEATED_FAILURE', '2026-09-17T08:01:00.000Z')
    expect(answers.every((a) => a.evidence.length === 1)).toBe(true)
    expect(sim.snapshot.evidence.length).toBe(before + 5)
    const second = await sim.run('2026-09-17T08:01:00.000Z', 'second')
    expect(second.decision?.action).toBe('SIMPLIFY')
    expect(second.decision!.difficulty).toBeLessThan(first.decision!.difficulty)
    expect(
      second.studentStateSummary!.knowledgePoints.find(
        (k) => k.knowledgePointId === 'AGENT_KP_CURRENT',
      )!.masteryScore,
    ).toBeLessThan(0.3)
    await sim.answer(first, 'REPEATED_FAILURE', '2026-09-17T08:01:00.000Z')
    expect(sim.snapshot.evidence.length).toBe(before + 5)
  })
  it('correct answers raise mastery using MASTERY_V1', async () => {
    const sim = new LearningAgentSimulation(createAgentScenario('A')),
      first = await sim.run(NOW)
    await sim.answer(first, 'CORRECT', '2026-09-17T08:01:00.000Z')
    expect(sim.snapshot.masteryRecords[0].masteryScore).toBeGreaterThan(30)
    expect(sim.snapshot.masteryRecords[0].algorithmVersion).toBe('MASTERY_V1')
  })
  it('preserves map state and does not select a locked next target', async () => {
    const s = createAgentScenario('E')
    s.curriculum.knowledgePrerequisites = [
      {
        ...createAgentScenario('C').curriculum.knowledgePrerequisites[0],
        prerequisiteKnowledgePointId: 'AGENT_KP_BASE',
        dependentKnowledgePointId: 'AGENT_KP_NEXT',
      },
    ]
    s.progress = []
    const before = structuredClone(s.progress),
      result = await run(s)
    expect(result.decision?.targetKnowledgePointId).not.toBe('AGENT_KP_NEXT')
    expect(s.progress).toEqual(before)
  })
  it('does not treat undated or future queue entries as due', async () => {
    for (const dueAt of [undefined, '2026-09-18T08:00:00.000Z']) {
      const s = createAgentScenario('D')
      s.reviewQueue[0].dueAt = dueAt
      expect((await run(s)).decision?.action).toBe('CHALLENGE')
    }
  })
  it('checks question mix values, total and planner configuration', () => {
    expect(
      validateQuestionMix({
        directPractice: 0.6,
        variationPractice: 0,
        wrongQuestionVariation: 0.2,
        application: 0.1,
        review: 0.1,
      }),
    ).toBe(true)
    expect(
      validateQuestionMix({
        directPractice: 0.8,
        variationPractice: 0,
        wrongQuestionVariation: 0.2,
        application: 0.1,
        review: 0.1,
      }),
    ).toBe(false)
    expect(() => new LearningPlanner({ ...CONFIG, lowMastery: NaN })).toThrow()
  })
})

describe('curriculum and profile boundaries', () => {
  it.each(['region', 'grade', 'semester', 'subject', 'publisher', 'textbook', 'rejected'] as const)(
    'blocks invalid %s context before provider calls',
    async (field) => {
      const s = createAgentScenario('A')
      if (field === 'region') s.profile.regionId = 'other'
      if (field === 'grade') s.profile.gradeId = 'other'
      if (field === 'semester') s.profile.semesterId = 'other'
      if (field === 'subject') s.curriculum.subject.id = 'other'
      if (field === 'publisher') s.curriculum.publisher!.id = 'other'
      if (field === 'textbook') s.profile.mathTextbookVersionId = 'other'
      if (field === 'rejected') s.curriculum.lessons[0].verificationStatus = 'REJECTED'
      const generate = vi.fn()
      const result = await orchestrator(s).prepareNextLearningTask(
        'AGENT_STUDENT',
        'AGENT_TEXTBOOK',
        { now: NOW, questionProvider: { generate } },
      )
      expect(result.status).toBe('BLOCKED')
      expect(generate).not.toHaveBeenCalled()
      expect(result.generatedResources.questions).toEqual([])
    },
  )
  it('filters foreign student evidence, mastery, sessions, queue and wrong book', async () => {
    const s = createAgentScenario('A'),
      expected = await run(s)
    s.masteryRecords.push({ ...s.masteryRecords[0], studentProfileId: 'other', masteryScore: 100 })
    s.evidence.push({ ...s.evidence[0], id: 'foreign', studentProfileId: 'other' })
    s.sessions.push({ ...s.sessions[0], id: 'question-session:other:foreign' })
    s.reviewQueue.push({ ...createAgentScenario('D').reviewQueue[0], profileId: 'other' })
    expect((await run(s)).decision).toEqual(expected.decision)
  })
  it('cannot use developer curriculum in a profile task', async () => {
    const s = createAgentScenario('A')
    s.dataset = 'profile'
    expect((await run(s)).status).toBe('BLOCKED')
  })
})

describe('untrusted generation pipeline', () => {
  it('generates reproducible seeded questions and independently validates them', async () => {
    const { snapshot, requests, batch } = await generation()
    expect(
      await new MockQuestionGenerator(snapshot.templates).generate(requests.questions),
    ).toEqual(batch)
    expect(
      new GeneratedQuestionValidator().validate(batch, requests.questions, snapshot).status,
    ).toBe('VALID')
    expect(
      batch.questions.every(
        (q) => q.status === 'AI_GENERATED' && q.needsVerification && q.isSample,
      ),
    ).toBe(true)
  })
  it.each([
    'schema',
    'answer',
    'curriculum',
    'mapping',
    'difficulty',
    'duplicate',
    'normalized',
    'unsafe',
    'publication',
    'request',
  ] as const)('rejects %s violations', async (kind) => {
    const { snapshot, requests, batch } = await generation()
    const q = batch.questions[0]
    if (kind === 'schema') q.stem = []
    if (kind === 'answer' && q.answerRule.ruleType === 'NUMERIC') q.answerRule.value = 9999
    if (kind === 'curriculum') q.textbookVersionId = 'foreign'
    if (kind === 'mapping') batch.mappings[0].knowledgePointId = 'foreign'
    if (kind === 'difficulty') q.difficulty = 'ADVANCED'
    if (kind === 'duplicate') batch.questions[1] = structuredClone(q)
    if (kind === 'normalized')
      batch.questions[1].stem = [{ type: 'FORMULA', text: q.stem[0].text!.replaceAll(' ', '') }]
    if (kind === 'unsafe')
      q.explanation.summary = [{ type: 'TEXT', text: '<script>alert(1)</script>' }]
    if (kind === 'publication') q.status = 'PUBLISHED'
    if (kind === 'request') batch.requestId = 'foreign'
    expect(
      new GeneratedQuestionValidator().validate(batch, requests.questions, snapshot).status,
    ).toBe('INVALID')
  })
  it('detects recent question duplicates even with new IDs', async () => {
    const { snapshot, requests, batch } = await generation()
    snapshot.questions.push({ ...batch.questions[0], id: 'old' })
    requests.questions.recentQuestionRefs.push('old')
    expect(
      new GeneratedQuestionValidator().validate(batch, requests.questions, snapshot).status,
    ).toBe('INVALID')
  })
  it('requires review for an unrecognized question and a future provider', async () => {
    const { snapshot, requests, batch } = await generation()
    batch.questions[0].stem = [{ type: 'TEXT', text: '为什么要这样计算？' }]
    batch.generator.provider = 'FUTURE_PROVIDER'
    expect(
      new GeneratedQuestionValidator().validate(batch, requests.questions, snapshot).status,
    ).toBe('REQUIRES_REVIEW')
  })
  it('blocks provider failures and never exposes invalid resources', async () => {
    const s = createAgentScenario('A')
    const failed = await orchestrator(s).prepareNextLearningTask(
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      {
        now: NOW,
        questionProvider: {
          generate: async () => {
            throw new Error('secret key or provider raw payload')
          },
        },
      },
    )
    expect(failed.status).toBe('BLOCKED')
    expect(JSON.stringify(failed)).not.toContain('secret key')
    const invalid = await orchestrator(s).prepareNextLearningTask(
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      {
        now: NOW,
        questionProvider: {
          generate: async (request) => {
            const batch = await new MockQuestionGenerator(s.templates).generate(request)
            batch.questions[0].stem = []
            return batch
          },
        },
      },
    )
    expect(invalid.status).toBe('BLOCKED')
    expect(invalid.generatedResources).toEqual({ questions: [], mappings: [], content: [] })
  })
  it('providers cannot mutate the validation request', async () => {
    const s = createAgentScenario('A')
    const result = await orchestrator(s).prepareNextLearningTask(
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      {
        now: NOW,
        questionProvider: {
          generate: async (request) => {
            request.curriculum.textbookId = 'evil'
            return new MockQuestionGenerator(s.templates).generate(request)
          },
        },
      },
    )
    expect(result.status).toBe('BLOCKED')
    expect(result.context?.curriculum.textbookId).toBe('AGENT_TEXTBOOK')
  })
  it('validates content binding and requires review for arbitrary explanations', async () => {
    const { snapshot, requests } = await generation(),
      validator = new GeneratedContentValidator()
    const content = await new MockContentGenerator().generate(requests.content)
    expect(validator.validate(content, requests.content, snapshot).status).toBe('VALID')
    content.blocks = [{ type: 'TEXT', text: '未经验证的新解释' }]
    expect(validator.validate(content, requests.content, snapshot).status).toBe('REQUIRES_REVIEW')
    content.lessonId = 'foreign'
    expect(validator.validate(content, requests.content, snapshot).status).toBe('INVALID')
  })
})

function analysisRequest(operation: '+' | '-' = '-', value = '25'): AnswerAnalysisRequest {
  const question = simulationQuestion('analysis', operation)
  const session = createQuestionSession(
    {
      textbookId: 'AGENT_TEXTBOOK',
      unitId: 'AGENT_UNIT',
      lessonId: 'AGENT_LESSON_1',
      knowledgePointId: 'AGENT_KP_CURRENT',
      source: 'dev',
    },
    {
      id: 'analysis',
      knowledgePointId: 'AGENT_KP_CURRENT',
      questionIds: [question.id],
      mode: 'practice',
    },
    'AGENT_STUDENT',
  )
  session.status = 'completed'
  session.completedAt = NOW
  const studentAnswer = { type: 'calculation' as const, value }
  session.attempts = [
    { questionId: question.id, answer: studentAnswer, submitted: true, submittedAt: NOW },
  ]
  return {
    question,
    expectedAnswer: question.answerRule,
    studentAnswer,
    knowledgePoints: [simulationMapping(question)],
    attemptContext: { profileId: 'AGENT_STUDENT', session, subject: 'MATH', dataset: 'demo' },
  }
}
describe('deterministic answers and cautious error classification', () => {
  it.each([
    ['25 + 37 = ?', 62],
    ['52 − 27 = ?', 25],
    ['7 × 8 = ?', 56],
    ['12 ÷ 4 = ?', 3],
    ['5 ÷ 2 = ?', 2.5],
  ])('verifies %s independently', (text, value) => {
    const q = simulationQuestion()
    q.stem = [{ type: 'FORMULA', text }]
    q.answerRule = { ruleType: 'NUMERIC', value }
    expect(new DeterministicAnswerValidator().validate(q)).toBe('VALID')
    q.answerRule.value = value + 1
    expect(new DeterministicAnswerValidator().validate(q)).toBe('INVALID')
  })
  it('rejects division by zero and never evaluates executable input', () => {
    const q = simulationQuestion()
    q.stem = [{ type: 'FORMULA', text: '5 / 0 = ?' }]
    expect(new DeterministicAnswerValidator().validate(q)).toBe('INVALID')
    q.stem = [{ type: 'FORMULA', text: 'globalThis.secret() = ?' }]
    expect(new DeterministicAnswerValidator().validate(q)).toBe('REQUIRES_REVIEW')
  })
  it('produces stable evidence and does not emit evidence before completion', async () => {
    const request = analysisRequest(),
      analyzer = new AnswerAnalyzer()
    const result = await analyzer.analyze(request)
    expect(result.correct).toBe(true)
    expect(result.evidence).toHaveLength(1)
    expect(await analyzer.analyze(request)).toEqual(result)
    request.attemptContext.session.status = 'in_progress'
    expect((await analyzer.analyze(request)).evidence).toEqual([])
  })
  it.each([
    ['-', '35', 'BORROWING_ERROR', { tensResult: 3, onesResult: 5 }],
    ['+', '52', 'CARRYING_ERROR', { tensResult: 5, onesResult: 2 }],
    ['-', '7', 'PLACE_VALUE_ERROR', { tensResult: 2, onesResult: 5 }],
  ] as const)('classifies %s with student-observed steps', async (op, value, code, working) => {
    const request = analysisRequest(op, value),
      analyzer = new AnswerAnalyzer()
    expect((await analyzer.analyze(request)).errorPatterns[0].code).toBe('UNKNOWN')
    request.attemptContext.working = working
    expect((await analyzer.analyze(request)).errorPatterns[0].code).toBe(code)
  })
  it('does not guess mathematical error causes in language subjects', async () => {
    const request = analysisRequest('-', '35')
    request.attemptContext.subject = 'CHINESE'
    request.attemptContext.working = { tensResult: 3, onesResult: 5 }
    expect((await new AnswerAnalyzer().analyze(request)).errorPatterns[0].code).toBe('UNKNOWN')
  })
  it('keeps blank, uncommitted and open answers out of evidence', async () => {
    const analyzer = new AnswerAnalyzer(),
      blank = analysisRequest('-', '')
    expect((await analyzer.analyze(blank)).evidence).toEqual([])
    const open = analysisRequest()
    open.question.questionType = 'shortAnswer'
    open.question.answerRule = { ruleType: 'MANUAL_REVIEW' }
    open.expectedAnswer = open.question.answerRule
    open.studentAnswer = { type: 'shortAnswer', value: '我觉得' }
    expect(await analyzer.analyze(open)).toMatchObject({
      correct: null,
      score: null,
      evidence: [],
      status: 'manual_review_required',
    })
    const uncommitted = analysisRequest()
    uncommitted.attemptContext.session.attempts = []
    expect((await analyzer.analyze(uncommitted)).evidence).toEqual([])
  })
})

describe('backward-compatible domain persistence', () => {
  it('preserves optional dueAt across queue storage and strategy refresh', () => {
    const data = new Map<string, string>(),
      storage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => {
          data.set(k, v)
        },
        removeItem: (k: string) => {
          data.delete(k)
        },
      }
    const repository = createReviewQueueRepository(createReviewQueueStorage(storage)),
      item = createAgentScenario('D').reviewQueue[0]
    repository.upsert(item)
    repository.upsert({ ...item, dueAt: undefined })
    expect(repository.get(item.profileId, item.id)?.dueAt).toBe(item.dueAt)
  })
  it('round trips optional error patterns without changing legacy sessions', () => {
    const data = new Map<string, string>(),
      storage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => {
          data.set(k, v)
        },
        removeItem: (k: string) => {
          data.delete(k)
        },
      }
    const repo = createQuestionSessionStorage(storage),
      session = analysisRequest().attemptContext.session
    session.attempts[0].errorPatterns = [
      { domain: 'MATH', category: 'ARITHMETIC', code: 'BORROWING_ERROR', confidence: 0.8 },
    ]
    repo.save(session)
    expect(repo.get(session.id)?.attempts[0].errorPatterns).toEqual(
      session.attempts[0].errorPatterns,
    )
  })
})

describe('additional adversarial and extension cases', () => {
  it('fails closed on null or malformed provider payloads without throwing', async () => {
    const { snapshot, requests, batch } = await generation()
    for (const malformed of [
      null,
      {},
      { ...batch, questions: [null] },
      { ...batch, mappings: [null] },
    ]) {
      expect(
        new GeneratedQuestionValidator().validate(malformed, requests.questions, snapshot).status,
      ).toBe('INVALID')
    }
  })
  it('does not approve a correct numeric answer with a fabricated explanation', async () => {
    const { snapshot, requests, batch } = await generation()
    batch.questions[0].explanation.summary = [
      { type: 'TEXT', text: '减法的结果总是等于两个数的和。' },
    ]
    expect(
      new GeneratedQuestionValidator().validate(batch, requests.questions, snapshot).status,
    ).toBe('REQUIRES_REVIEW')
  })
  it('verifies numeric comparison options independently', () => {
    const q = simulationQuestion('compare')
    q.questionType = 'singleChoice'
    q.stem = [{ type: 'TEXT', text: '比较 3 和 8，选一选。' }]
    q.options = ['<', '=', '>'].map((symbol, i) => ({
      id: `o${i}`,
      questionId: q.id,
      optionKey: String(i),
      sortOrder: i,
      content: [{ type: 'TEXT', text: symbol }],
    }))
    q.answerRule = { ruleType: 'SINGLE_OPTION', correctOptionKey: '0' }
    expect(new DeterministicAnswerValidator().validate(q)).toBe('VALID')
    q.answerRule.correctOptionKey = '2'
    expect(new DeterministicAnswerValidator().validate(q)).toBe('INVALID')
  })
  it('supports reliable single-digit calculation error detection', async () => {
    const request = analysisRequest('+', '6')
    request.question.stem = [{ type: 'FORMULA', text: '2 + 3 = ?' }]
    request.question.answerRule = { ruleType: 'NUMERIC', value: 5 }
    request.expectedAnswer = request.question.answerRule
    request.attemptContext.working = { tensResult: 0, onesResult: 6 }
    expect((await new AnswerAnalyzer().analyze(request)).errorPatterns[0].code).toBe(
      'CALCULATION_ERROR',
    )
  })
  it('does not emit evidence for a foreign profile, duplicate mappings or an incomplete completed session', async () => {
    const analyzer = new AnswerAnalyzer()
    const foreign = analysisRequest()
    foreign.attemptContext.profileId = 'foreign'
    expect((await analyzer.analyze(foreign)).evidence).toEqual([])
    const duplicate = analysisRequest()
    duplicate.knowledgePoints = [
      { ...duplicate.knowledgePoints[0], weight: 0.5 },
      { ...duplicate.knowledgePoints[0], id: 'duplicate', weight: 0.5 },
    ]
    expect((await analyzer.analyze(duplicate)).evidence).toEqual([])
    const incomplete = analysisRequest()
    incomplete.attemptContext.session.questionIds.push('unanswered')
    expect((await analyzer.analyze(incomplete)).evidence).toEqual([])
  })
  it('propagates weighted evidence to all mapped knowledge points', async () => {
    const request = analysisRequest()
    request.knowledgePoints = [
      { ...request.knowledgePoints[0], weight: 0.7 },
      {
        ...request.knowledgePoints[0],
        id: 'secondary',
        knowledgePointId: 'AGENT_KP_BASE',
        weight: 0.3,
        relationType: 'SECONDARY',
        isPrimary: false,
      },
    ]
    const result = await new AnswerAnalyzer().analyze(request)
    expect(result.evidence.map((e) => e.knowledgeWeight)).toEqual([0.7, 0.3])
    expect(result.affectedKnowledgePoints).toEqual(['AGENT_KP_CURRENT', 'AGENT_KP_BASE'])
  })
  it('leaves production delivery blocked even for fully reviewed curriculum', async () => {
    const s = createAgentScenario('G')
    s.dataset = 'profile'
    const records = [
      s.curriculum.textbook,
      ...s.regionTextbookRelations,
      ...s.curriculum.units,
      ...s.curriculum.lessons,
      ...s.curriculum.knowledgePoints,
      ...s.curriculum.lessonKnowledgePoints,
    ]
    records.forEach((r) => {
      r.verificationStatus = 'REVIEWED'
      r.needsVerification = false
    })
    const result = await run(s)
    expect(result.status).toBe('BLOCKED')
    expect(
      result.validation.checks.some((c) => c.code === 'AGENT_PRODUCTION_DELIVERY_DISABLED'),
    ).toBe(true)
    expect(result.generatedResources.questions).toEqual([])
  })
})

describe('simulation feedback projections', () => {
  it('reuses wrong-book and learning-history projections in memory', async () => {
    const sim = new LearningAgentSimulation(createAgentScenario('A')),
      task = await sim.run(NOW)
    await sim.answer(task, 'INCORRECT', '2026-09-17T08:01:00.000Z')
    expect(sim.snapshot.wrongBook).toHaveLength(5)
    expect(
      sim.snapshot.wrongBook.every((w) => w.provenance.isSampleDerived && w.wrongCount === 1),
    ).toBe(true)
    expect(
      sim.snapshot.history.some(
        (h) => h.type === 'assessment_completed' && h.summary?.incorrectCount === 5,
      ),
    ).toBe(true)
  })
  it('completes a due review only after a correct submitted review task', async () => {
    const sim = new LearningAgentSimulation(createAgentScenario('D')),
      task = await sim.run(NOW)
    expect(sim.snapshot.reviewQueue[0].status).toBe('active')
    await sim.answer(task, 'CORRECT', '2026-09-17T08:01:00.000Z')
    expect(sim.snapshot.reviewQueue[0].status).toBe('completed')
    expect((await sim.run('2026-09-17T08:01:00.000Z', 'next')).decision?.action).toBe('CHALLENGE')
  })
})
