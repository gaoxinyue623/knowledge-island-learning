import { difficultyProfile } from './difficultyProfile'
import type { Question } from '@/types'
import type {
  GeneratedQuestionBatch,
  LearningAgentSnapshot,
  QuestionGenerationRequest,
} from '@/types/learning-agent'
import type { LLMUsageRecord } from '@/types/llm'
import {
  DeterministicAnswerValidator,
  parseArithmetic,
  questionText,
} from './deterministicAnswerValidator'
import { realMathConstraints, mathConstraintChecks } from './mathConstraints'
import { createAgentScenario } from '@/data/learning-agent/scenarios'
import { templateDifficulty } from './generators'
import {
  GeneratedQuestionValidator,
  matchesTemplate,
  isSafePlainText,
  normalizedQuestionFingerprint,
} from './generatedQuestionValidator'

export const REAL_LLM_EVALUATION_VERSION = 'PHASE18.3.2'
export const DEFAULT_EVALUATION_BATCH_SIZE = 20
export const SUPPORTED_EVALUATION_BATCHES = [1, 5, 10, 20, 50] as const
export const DIFFICULTY_SWEEP = [0.2, 0.4, 0.6, 0.8] as const

type Difficulty = (typeof DIFFICULTY_SWEEP)[number]
type QuestionSource = 'REAL_LLM_ONLY' | 'SYSTEM_FINAL'

export interface EvaluationRequestPart {
  partId: string
  request: QuestionGenerationRequest
  snapshot: LearningAgentSnapshot
}

export interface RealLLMGoldenScenario {
  id: string
  label: string
  difficulty: number
  buildParts(batchIndex: number, count: number): EvaluationRequestPart[]
}

export interface EvaluationObservation {
  scenarioId: string
  scenarioLabel: string
  batchIndex: number
  partId: string
  request: QuestionGenerationRequest
  snapshot: LearningAgentSnapshot
  batch: GeneratedQuestionBatch | null
  error?: string
}

export interface EvaluationMetricSet {
  requestedQuestions: number
  generatedQuestions: number
  firstPassValidRate: number
  finalValidRate: number
  mathCorrectness: number
  knowledgePointMatchRate: number
  constraintCompliance: number
  repairRate: number
  repairBatchRate: number
  repairSuccessRate: number
  fallbackRate: number
  exactDuplicateRate: number
  normalizedDuplicateRate: number
  averageLatencyMs: number
  p95LatencyMs: number
  inputTokens: number
  outputTokens: number
  childSafetyViolations: number
  constraintFailureRate: number
  rawCandidateCount: number
  rawMathCorrectness: number | null
  rawKnowledgeMatchRate: number | null
  rawConstraintCompliance: number | null
  repairQuestions: number
  repairedQuestions: number
  repairedBatches: number
  timeoutCalls: number
  unknownTokenCalls: number
  finalDuplicateRate: number
  failureCodes: Record<string, number>
}

export interface HumanReviewSample {
  scenarioId: string
  sampleId: string
  source: QuestionSource
  stem: string
  expectedAnswer: number | string | null
  difficulty: string
  knowledgePointId?: string
  review: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  ageAppropriate?: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  ambiguity?: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  reviewerNotes?: string
  explanation: string
  target: string
  requestedDifficulty: number
  questionId: string
  targetTraining: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  difficultyReasonable: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  naturalLanguage: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  explanationCorrect: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
  withinCurriculum: 'PENDING' | 'PASS' | 'NEEDS_REVISION' | 'REJECT'
}

export interface DifficultyObservation {
  requestedDifficulty: Difficulty
  requestedQuestions: number
  questionCount: number
  validRate: number
  averageNumericComplexity: number
  carryingRate: number
  borrowingRate: number
  questionTypeComplexity: number
  applicationRate: number
  reasoningStepRate: number
}

export interface RealLLMEvaluationReport {
  evaluationVersion: string
  evidenceFile?: string
  generatedAt: string
  provider: string
  model: string
  promptVersions: string[]
  batchCount: number
  batchSize: number
  coverageComplete: boolean
  metricDefinitions: Record<string, string>
  requestedQuestions: number
  REAL_LLM_ONLY: EvaluationMetricSet
  SYSTEM_FINAL: EvaluationMetricSet
  scenarios: Array<{
    id: string
    label: string
    REAL_LLM_ONLY: EvaluationMetricSet
    SYSTEM_FINAL: EvaluationMetricSet
    requirementPassed: boolean
    errors: string[]
  }>
  difficultySweep: {
    enabled: boolean
    observations: DifficultyObservation[]
    gradientPassed: boolean
  }
  humanReview: {
    status: 'PENDING' | 'COMPLETE'
    requestedSamples: number
    selectedSamples: number
    perScenario: Record<string, number>
    samples: HumanReviewSample[]
  }
  gates: {
    blocking: {
      mathCorrectness100: boolean
      outOfScopeReadyZero: boolean
      invalidReadyZero: boolean
      apiKeyLeakageZero: boolean
      childSafetyZero: boolean
    }
    quality: {
      knowledgePointMatch: boolean
      constraintCompliance: boolean
      firstPassValid: boolean
      finalRealLLMValid: boolean
      repairRate: boolean
      repairSuccess: boolean
      fallbackRate: boolean
      exactDuplicate: boolean
      normalizedDuplicate: boolean
      difficultyGradient: boolean
      humanReviewClear: boolean | null
      ageAppropriate: boolean | null
      ambiguity: boolean | null
    }
  }
  acceptanceStatus: 'PASS' | 'CONDITIONAL_PASS' | 'FAIL' | 'INCONCLUSIVE'
  failures: string[]
}

const MIX = {
  directPractice: 1,
  variationPractice: 0,
  wrongQuestionVariation: 0,
  application: 0,
  review: 0,
} as const

function cloneScenario(id: string) {
  return createAgentScenario(id)
}

function tuneTemplate(
  snapshot: LearningAgentSnapshot,
  target: string,
  difficulty: number,
  options: { addition?: boolean; broadRange?: boolean; noCarry?: boolean },
) {
  const level = templateDifficulty(difficulty)
  snapshot.templates = snapshot.templates.map((template) => {
    if (template.knowledgePointId !== target || template.difficulty !== level) return template
    if (template.templateType === 'addition_range' && options.addition) {
      return {
        ...template,
        config: {
          ...template.config,
          minAddend: options.broadRange ? 1 : template.config.minAddend,
          maxAddend: options.broadRange ? 99 : template.config.maxAddend,
          maxResult: options.broadRange ? 100 : template.config.maxResult,
          noCarry: options.noCarry ?? template.config.noCarry,
        },
      }
    }
    if (template.templateType === 'subtraction_range' && options.broadRange) {
      return {
        ...template,
        config: {
          ...template.config,
          minMinuend: 2,
          maxMinuend: 99,
          minSubtrahend: 1,
          maxSubtrahend: 99,
        },
      }
    }
    return template
  })
}

function requestFor(
  scenarioId: string,
  batchIndex: number,
  partId: string,
  snapshot: LearningAgentSnapshot,
  target: string,
  difficulty: number,
  count: number,
  options: {
    operations: Array<'+' | '-'>
    requireCarrying?: boolean
    requireBorrowing?: boolean
    weaknessSignals?: string[]
    errorCodes?: string[]
    recentQuestionRefs?: string[]
    avoidQuestionRefs?: string[]
  },
): EvaluationRequestPart {
  const templateIds = snapshot.templates
    .filter(
      (template) =>
        template.knowledgePointId === target &&
        template.difficulty === templateDifficulty(difficulty),
    )
    .map((template) => template.id)
    .sort()
  const createdAt = new Date(
    Date.parse('2026-09-17T08:00:00.000Z') + batchIndex * 60000,
  ).toISOString()
  const request: QuestionGenerationRequest = {
    requestId: `real-eval:${scenarioId}:batch-${batchIndex}:${partId}`,
    profileId: snapshot.profile.studentId,
    curriculum: {
      regionId: snapshot.profile.regionId,
      grade: snapshot.curriculum.grade.id,
      semester: snapshot.curriculum.semester.id,
      subject: snapshot.curriculum.subject.code,
      subjectId: snapshot.curriculum.subject.id,
      publisher: snapshot.curriculum.publisher!.id,
      textbookId: snapshot.curriculum.textbook.id,
    },
    targetKnowledgePoints: [target],
    difficulty,
    count,
    allowedQuestionTypes: ['calculation'],
    constraints: {
      templateIds,
      maxTextLength: 2000,
      questionMix: MIX,
      math: {
        minNumber: 0,
        maxNumber: 100,
        minLargestOperand: difficultyProfile(difficulty).minLargestOperand,
        maxLargestOperand: difficultyProfile(difficulty).maxLargestOperand,
        allowedOperations: options.operations,
        requireCarrying: options.requireCarrying,
        requireBorrowing: options.requireBorrowing,
      },
    },
    weaknessSignals: options.weaknessSignals ?? [],
    errorPatterns: (options.errorCodes ?? []).map((code) => ({
      domain: 'MATH' as const,
      category: 'ARITHMETIC',
      code,
      confidence: 0.9,
    })),
    recentQuestionRefs: options.recentQuestionRefs ?? [],
    avoidQuestionRefs: options.avoidQuestionRefs ?? [],
    generationReason: [],
    seed: `${scenarioId}-${batchIndex}-${partId}`,
    createdAt,
  }
  return { partId, request, snapshot }
}

function buildAddition(
  scenarioId: string,
  snapshotId: string,
  batchIndex: number,
  count: number,
  difficulty: number,
  requireCarrying: boolean,
): EvaluationRequestPart[] {
  const snapshot = cloneScenario(snapshotId)
  tuneTemplate(snapshot, 'AGENT_KP_BASE', difficulty, {
    addition: true,
    broadRange: true,
    noCarry: !requireCarrying,
  })
  return [
    requestFor(scenarioId, batchIndex, 'main', snapshot, 'AGENT_KP_BASE', difficulty, count, {
      operations: ['+'],
      requireCarrying,
      weaknessSignals: requireCarrying ? ['CONSECUTIVE_ERRORS'] : [],
      errorCodes: requireCarrying ? ['CARRYING_ERROR'] : [],
    }),
  ]
}

function buildSubtraction(
  scenarioId: string,
  snapshotId: string,
  batchIndex: number,
  count: number,
  difficulty: number,
  requireBorrowing: boolean,
  recentQuestionRefs: string[] = [],
): EvaluationRequestPart[] {
  const snapshot = cloneScenario(snapshotId)
  tuneTemplate(snapshot, 'AGENT_KP_CURRENT', difficulty, { broadRange: true })
  return [
    requestFor(scenarioId, batchIndex, 'main', snapshot, 'AGENT_KP_CURRENT', difficulty, count, {
      operations: ['-'],
      requireBorrowing: recentQuestionRefs.length ? true : requireBorrowing,
      weaknessSignals: recentQuestionRefs.length
        ? ['ACTIVE_WRONG_QUESTION']
        : requireBorrowing
          ? ['LOW_MASTERY']
          : [],
      errorCodes: requireBorrowing ? ['BORROWING_ERROR'] : [],
      recentQuestionRefs,
      avoidQuestionRefs: recentQuestionRefs,
    }),
  ]
}

export const REAL_LLM_GOLDEN_SCENARIOS: readonly RealLLMGoldenScenario[] = [
  {
    id: 'A',
    label: '100以内基础加法',
    difficulty: 0.2,
    buildParts: (batchIndex, count) => buildAddition('A', 'A', batchIndex, count, 0.2, false),
  },
  {
    id: 'B',
    label: '100以内进位加法 · REINFORCE',
    difficulty: 0.4,
    buildParts: (batchIndex, count) => buildAddition('B', 'B', batchIndex, count, 0.4, true),
  },
  {
    id: 'C',
    label: '100以内借位减法 · REINFORCE',
    difficulty: 0.4,
    buildParts: (batchIndex, count) => buildSubtraction('C', 'C', batchIndex, count, 0.4, true),
  },
  {
    id: 'D',
    label: '连续错误后的 SIMPLIFY',
    difficulty: 0.22,
    buildParts: (batchIndex, count) => buildSubtraction('D', 'B', batchIndex, count, 0.22, true),
  },
  {
    id: 'E',
    label: '掌握后 NEXT',
    difficulty: 0.5,
    buildParts: (batchIndex, count) => {
      const snapshot = cloneScenario('E')
      tuneTemplate(snapshot, 'AGENT_KP_NEXT', 0.5, { broadRange: true })
      return [
        requestFor('E', batchIndex, 'main', snapshot, 'AGENT_KP_NEXT', 0.5, count, {
          operations: ['-'],
        }),
      ]
    },
  },
  {
    id: 'F',
    label: '高掌握度 CHALLENGE',
    difficulty: 0.75,
    buildParts: (batchIndex, count) => buildSubtraction('F', 'F', batchIndex, count, 0.75, true),
  },
  {
    id: 'G',
    label: '错题变式',
    difficulty: 0.4,
    buildParts: (batchIndex, count) =>
      buildSubtraction('G', 'G', batchIndex, count, 0.4, false, ['agent-example']),
  },
  {
    id: 'H',
    label: '进位 + 借位混合强化',
    difficulty: 0.4,
    buildParts: (batchIndex, count) => {
      const additionCount = Math.ceil(count / 2)
      const subtractionCount = count - additionCount
      return [
        ...buildAddition('H', 'H', batchIndex, additionCount, 0.4, true).map((part) => ({
          ...part,
          partId: 'carrying',
          request: { ...part.request, requestId: part.request.requestId + ':carrying' },
        })),
        ...buildSubtraction('H', 'H', batchIndex, subtractionCount, 0.4, true).map((part) => ({
          ...part,
          partId: 'borrowing',
          request: { ...part.request, requestId: part.request.requestId + ':borrowing' },
        })),
      ]
    },
  },
]

export function buildDifficultySweep(batchIndex: number, count: number): EvaluationRequestPart[] {
  return DIFFICULTY_SWEEP.map((difficulty) => {
    const snapshot = cloneScenario('F')
    tuneTemplate(snapshot, 'AGENT_KP_CURRENT', difficulty, { broadRange: true })
    return requestFor(
      'DIFFICULTY',
      batchIndex,
      `d-${difficulty}`,
      snapshot,
      'AGENT_KP_CURRENT',
      difficulty,
      count,
      {
        operations: ['-'],
        requireBorrowing: true,
      },
    )
  })
}

function sourceQuestions(observation: EvaluationObservation, source: QuestionSource): Question[] {
  const questions =
    observation.batch?.validation.status === 'VALID' ? observation.batch.questions : []
  return source === 'REAL_LLM_ONLY'
    ? questions.filter((q) => observation.batch?.telemetry?.origins?.[q.id] === 'REAL_LLM')
    : questions
}

function firstPassAccepted(observation: EvaluationObservation): number {
  const batch = observation.batch
  if (!batch) return 0
  if (batch.telemetry?.attempts)
    return batch.telemetry.attempts
      .filter((a) => a.attempt === 0)
      .reduce((sum, a) => sum + a.accepted, 0)
  const failure = batch.telemetry?.events.find(
    (event) => event.event === 'QUESTION_VALIDATION_FAILED' && event.data.attempt === 0,
  )
  if (failure && typeof failure.data.acceptedCount === 'number') return failure.data.acceptedCount
  return batch.telemetry?.repairCount === 0 && batch.telemetry.status === 'READY'
    ? batch.questions.length
    : 0
}

function usageFor(observations: readonly EvaluationObservation[]): LLMUsageRecord[] {
  return observations.flatMap((observation) => observation.batch?.telemetry?.usage ?? [])
}

function ratio(value: number, total: number): number {
  return total > 0 ? value / total : 0
}

function p95(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]!
}

function questionQuality(observation: EvaluationObservation, question: Question) {
  const request = observation.request
  const snapshot = observation.snapshot
  const arithmetic = parseArithmetic(questionText(question))
  const answerValid = new DeterministicAnswerValidator().validate(question) === 'VALID'
  const knowledgePointMatch =
    snapshot.templates.some(
      (t) =>
        request.constraints.templateIds.includes(t.id) &&
        t.knowledgePointId === question.knowledgePointId &&
        matchesTemplate(question, t),
    ) &&
    request.targetKnowledgePoints.includes(question.knowledgePointId ?? '') &&
    observation.batch?.mappings.some(
      (mapping) =>
        mapping.questionId === question.id &&
        mapping.knowledgePointId === question.knowledgePointId,
    ) === true
  const constraints = arithmetic
    ? mathConstraintChecks(questionText(question), realMathConstraints(request, snapshot)).every(
        (check) => check.pass,
      )
    : false
  const textBlocks = [
    ...question.stem,
    ...question.explanation.summary,
    ...question.explanation.steps.flat(),
    ...question.hints.flatMap((hint) => hint.content),
  ]
  const childSafe =
    question.media.length === 0 &&
    textBlocks.every(
      (block) =>
        (block.type === 'TEXT' || block.type === 'FORMULA') && isSafePlainText(block.text ?? ''),
    )
  return { answerValid, knowledgePointMatch, constraints, childSafe, arithmetic }
}

function metrics(
  observations: readonly EvaluationObservation[],
  source: QuestionSource,
): EvaluationMetricSet {
  const requestedQuestions = observations.reduce(
    (total, observation) => total + observation.request.count,
    0,
  )
  const selected = observations.flatMap((observation) =>
    sourceQuestions(observation, source).map((question) => ({ observation, question })),
  )
  const quality = selected.map(({ observation, question }) =>
    questionQuality(observation, question),
  )
  const usages = usageFor(observations)
  const attempts = observations.flatMap((o) => o.batch?.telemetry?.attempts ?? [])
  // Only actual content repair enters repair denominators. Timeouts remain transport failures.
  const repairNeeded = observations.reduce(
    (sum, o) =>
      sum +
      (o.batch?.telemetry?.attempts ?? [])
        .filter((a) => a.attempt === 1)
        .reduce((n, a) => n + a.requested, 0),
    0,
  )
  const repairAccepted = attempts.filter((a) => a.attempt > 0).reduce((n, a) => n + a.accepted, 0)
  const logicalBatches = new Map<string, EvaluationObservation[]>()
  for (const o of observations) {
    const key = `${o.scenarioId}:${o.batchIndex}`
    logicalBatches.set(key, [...(logicalBatches.get(key) ?? []), o])
  }
  const groups = [...logicalBatches.values()]
  const repairedBatches = groups.filter((g) =>
    g.some((o) => (o.batch?.telemetry?.repairCount ?? 0) > 0),
  ).length
  const candidates = attempts.reduce((n, a) => n + a.received, 0)
  const failureCodes: Record<string, number> = {}
  for (const a of attempts)
    for (const code of a.errors) failureCodes[code] = (failureCodes[code] ?? 0) + 1
  let exactDuplicates = 0
  let normalizedDuplicates = 0
  for (const observation of observations) {
    const questions = sourceQuestions(observation, source)
    const exact = new Set<string>()
    const normalized = new Set<string>()
    for (const question of questions) {
      const text = questionText(question)
      const fingerprint = normalizedQuestionFingerprint(question)
      if (exact.has(text)) exactDuplicates++
      if (normalized.has(fingerprint)) normalizedDuplicates++
      exact.add(text)
      normalized.add(fingerprint)
    }
  }
  const latency = usages.map((usage) => usage.latencyMs)
  return {
    constraintFailureRate: candidates
      ? 1 -
        ratio(
          attempts.reduce((n, a) => n + a.constraintValid, 0),
          candidates,
        )
      : 0,
    rawCandidateCount: candidates,
    rawMathCorrectness: candidates
      ? ratio(
          attempts.reduce((n, a) => n + a.mathCorrect, 0),
          candidates,
        )
      : null,
    rawKnowledgeMatchRate: candidates
      ? ratio(
          attempts.reduce((n, a) => n + a.knowledgeMatch, 0),
          candidates,
        )
      : null,
    rawConstraintCompliance: candidates
      ? ratio(
          attempts.reduce((n, a) => n + a.constraintValid, 0),
          candidates,
        )
      : null,
    repairQuestions: repairNeeded,
    repairedQuestions: repairAccepted,
    repairedBatches,
    timeoutCalls: usages.filter((u) => u.errorType === 'TIMEOUT').length,
    unknownTokenCalls: usages.filter(
      (u) => u.inputTokens === undefined || u.outputTokens === undefined,
    ).length,
    finalDuplicateRate: ratio(normalizedDuplicates, selected.length),
    failureCodes,
    requestedQuestions,
    generatedQuestions: selected.length,
    firstPassValidRate: ratio(
      observations.reduce((total, observation) => total + firstPassAccepted(observation), 0),
      requestedQuestions,
    ),
    finalValidRate: ratio(selected.length, requestedQuestions),
    mathCorrectness: ratio(quality.filter((result) => result.answerValid).length, selected.length),
    knowledgePointMatchRate: ratio(
      quality.filter((result) => result.knowledgePointMatch).length,
      selected.length,
    ),
    constraintCompliance: ratio(
      quality.filter((result) => result.constraints).length,
      selected.length,
    ),
    repairRate: ratio(repairNeeded, requestedQuestions),
    repairBatchRate: ratio(repairedBatches, groups.length),
    repairSuccessRate: repairNeeded > 0 ? ratio(repairAccepted, repairNeeded) : 1,
    fallbackRate: ratio(
      groups.filter((g) => g.some((o) => o.batch?.telemetry?.fallbackUsed)).length,
      groups.length,
    ),
    exactDuplicateRate:
      source === 'REAL_LLM_ONLY'
        ? ratio(
            attempts.reduce((n, a) => n + a.exactDuplicates, 0),
            candidates,
          )
        : ratio(exactDuplicates, selected.length),
    normalizedDuplicateRate:
      source === 'REAL_LLM_ONLY'
        ? ratio(
            attempts.reduce((n, a) => n + a.normalizedDuplicates, 0),
            candidates,
          )
        : ratio(normalizedDuplicates, selected.length),
    averageLatencyMs: latency.length
      ? latency.reduce((sum, value) => sum + value, 0) / latency.length
      : 0,
    p95LatencyMs: p95(latency),
    inputTokens: usages.reduce((sum, usage) => sum + (usage.inputTokens ?? 0), 0),
    outputTokens: usages.reduce((sum, usage) => sum + (usage.outputTokens ?? 0), 0),
    childSafetyViolations: quality.filter((result) => !result.childSafe).length,
  }
}

function scenarioRequirement(
  scenarioId: string,
  observations: readonly EvaluationObservation[],
): boolean {
  const questions = observations.flatMap((observation) =>
    sourceQuestions(observation, 'REAL_LLM_ONLY').map((question) =>
      parseArithmetic(questionText(question)),
    ),
  )
  if (scenarioId === 'H')
    return (
      questions.some(
        (question) =>
          question?.operator === '+' && (question.left % 10) + (question.right % 10) >= 10,
      ) &&
      questions.some(
        (question) => question?.operator === '-' && question.left % 10 < question.right % 10,
      )
    )
  if (scenarioId === 'G') {
    const references = new Set(
      observations.flatMap((observation) =>
        observation.snapshot.questions.map((question) => normalizedQuestionFingerprint(question)),
      ),
    )
    return (
      questions.length > 0 &&
      questions.every(
        (question) =>
          !question || !references.has(`${question.left}${question.operator}${question.right}=?`),
      )
    )
  }
  return true
}

export function difficultyObservation(
  observations: readonly EvaluationObservation[],
  requestedDifficulty: Difficulty,
): DifficultyObservation {
  const selected = observations.flatMap((observation) =>
    sourceQuestions(observation, 'REAL_LLM_ONLY').map((question) => ({ observation, question })),
  )
  const arithmetic = selected
    .map(({ question }) => parseArithmetic(questionText(question)))
    .filter(Boolean)
  return {
    requestedDifficulty,
    requestedQuestions: observations.reduce(
      (sum, observation) => sum + observation.request.count,
      0,
    ),
    questionCount: selected.length,
    validRate: ratio(
      selected.filter(
        ({ observation, question }) => questionQuality(observation, question).answerValid,
      ).length,
      selected.length,
    ),
    averageNumericComplexity: arithmetic.length
      ? arithmetic.reduce(
          (sum, value) => sum + Math.max(value!.left, value!.right, value!.result) / 100,
          0,
        ) / arithmetic.length
      : 0,
    carryingRate: ratio(
      arithmetic.filter(
        (value) => value!.operator === '+' && (value!.left % 10) + (value!.right % 10) >= 10,
      ).length,
      arithmetic.length,
    ),
    borrowingRate: ratio(
      arithmetic.filter((value) => value!.operator === '-' && value!.left % 10 < value!.right % 10)
        .length,
      arithmetic.length,
    ),
    questionTypeComplexity: ratio(
      selected.filter(({ question }) => question.questionType !== 'calculation').length,
      selected.length,
    ),
    applicationRate: 0,
    reasoningStepRate: ratio(
      selected.filter(({ question }) => question.explanation.steps.length > 0).length,
      selected.length,
    ),
  }
}

function randomSamples(
  observations: readonly EvaluationObservation[],
  perScenario = 5,
): HumanReviewSample[] {
  const samples: HumanReviewSample[] = []
  for (const scenarioId of [
    ...new Set(
      observations
        .filter((o) => o.scenarioId !== 'DIFFICULTY')
        .map((observation) => observation.scenarioId),
    ),
  ].sort()) {
    const candidates = observations
      .filter((observation) => observation.scenarioId === scenarioId)
      .flatMap((observation) =>
        sourceQuestions(observation, 'REAL_LLM_ONLY').map((question) => ({
          observation,
          question,
          rank: crypto.randomUUID(),
        })),
      )
      .sort((a, b) => a.rank.localeCompare(b.rank))
      .slice(0, perScenario)
    candidates.forEach(({ observation, question }, index) => {
      const answer = question.answerRule.ruleType === 'NUMERIC' ? question.answerRule.value : null
      samples.push({
        scenarioId,
        sampleId: `${scenarioId}-${index + 1}`,
        source: 'REAL_LLM_ONLY',
        questionId: question.id,
        explanation: question.explanation.summary.map((b) => b.text ?? '').join(' '),
        requestedDifficulty: observation.request.difficulty,
        target:
          observation.snapshot.curriculum.knowledgePoints.find(
            (k) => k.id === question.knowledgePointId,
          )?.name ?? '',
        targetTraining: 'PENDING',
        difficultyReasonable: 'PENDING',
        naturalLanguage: 'PENDING',
        explanationCorrect: 'PENDING',
        withinCurriculum: 'PENDING',
        stem: questionText(question),
        expectedAnswer: answer,
        difficulty: question.difficulty,
        knowledgePointId: question.knowledgePointId,
        review: 'PENDING',
        ageAppropriate: 'PENDING',
        ambiguity: 'PENDING',
      })
    })
  }
  return samples
}

export function buildEvaluationReport(
  observations: readonly EvaluationObservation[],
  options: {
    provider: string
    model: string
    batchCount: number
    batchSize: number
    difficultyObservations?: DifficultyObservation[]
    apiKeyLeakage?: boolean
  },
): RealLLMEvaluationReport {
  const real = metrics(observations, 'REAL_LLM_ONLY')
  const final = metrics(observations, 'SYSTEM_FINAL')
  const scenarioReports = [...new Set(observations.map((observation) => observation.scenarioId))]
    .sort()
    .map((id) => {
      const subset = observations.filter((observation) => observation.scenarioId === id)
      const definition = REAL_LLM_GOLDEN_SCENARIOS.find((scenario) => scenario.id === id)
      return {
        id,
        label: definition?.label ?? id,
        REAL_LLM_ONLY: metrics(subset, 'REAL_LLM_ONLY'),
        SYSTEM_FINAL: metrics(subset, 'SYSTEM_FINAL'),
        requirementPassed: scenarioRequirement(id, subset),
        errors: subset.flatMap((observation) => (observation.error ? [observation.error] : [])),
      }
    })
  const samples = randomSamples(observations)
  const humanPerScenario = Object.fromEntries(
    [...new Set(samples.map((sample) => sample.scenarioId))].map((id) => [
      id,
      samples.filter((sample) => sample.scenarioId === id).length,
    ]),
  )
  const promptVersions = [
    ...new Set(usageFor(observations).map((usage) => `${usage.promptId}@${usage.promptVersion}`)),
  ].sort()
  const invalidReadyZero = observations.every(
    (o) =>
      !o.batch ||
      (!['READY', 'FALLBACK'].includes(o.batch.telemetry?.status ?? '') &&
        o.batch.validation.status !== 'VALID') ||
      (o.batch.validation.status === 'VALID' &&
        new GeneratedQuestionValidator().validate(o.batch, o.request, o.snapshot).status ===
          'VALID'),
  )
  const outOfScopeReadyZero = observations.every((observation) =>
    sourceQuestions(observation, 'SYSTEM_FINAL').every((question) => {
      const q = questionQuality(observation, question)
      return q.constraints && q.knowledgePointMatch && question.questionType === 'calculation'
    }),
  )
  const humanComplete =
    samples.length >= 40 &&
    samples.every(
      (sample) =>
        sample.review !== 'PENDING' &&
        sample.ageAppropriate !== 'PENDING' &&
        sample.ambiguity !== 'PENDING',
    )
  const humanReviewClear = humanComplete
    ? samples.every((sample) => sample.review === 'PASS')
    : null
  const ageAppropriate = humanComplete
    ? samples.filter((sample) => sample.ageAppropriate === 'PASS').length / samples.length >= 0.9
    : null
  const ambiguity = humanComplete
    ? samples.filter((sample) => sample.ambiguity !== 'REJECT').length / samples.length >= 0.99
    : null
  const blocking = {
    mathCorrectness100:
      real.generatedQuestions > 0 && real.mathCorrectness === 1 && final.mathCorrectness === 1,
    outOfScopeReadyZero,
    invalidReadyZero,
    apiKeyLeakageZero: options.apiKeyLeakage !== true,
    childSafetyZero: real.childSafetyViolations === 0 && final.childSafetyViolations === 0,
  }
  const gradientPassed =
    options.difficultyObservations?.length === DIFFICULTY_SWEEP.length &&
    options.difficultyObservations.every(
      (current, index, all) =>
        current.requestedDifficulty === DIFFICULTY_SWEEP[index] &&
        current.questionCount > 0 &&
        current.validRate === 1 &&
        (index === 0 ||
          current.averageNumericComplexity > all[index - 1]!.averageNumericComplexity),
    )
  const quality = {
    knowledgePointMatch: real.knowledgePointMatchRate >= 0.99,
    constraintCompliance: real.constraintCompliance >= 0.995,
    firstPassValid: real.firstPassValidRate >= 0.95,
    finalRealLLMValid: real.finalValidRate >= 0.99,
    repairRate: real.repairRate <= 0.1,
    repairSuccess: real.repairSuccessRate >= 0.9,
    fallbackRate: real.fallbackRate <= 0.01,
    exactDuplicate: real.exactDuplicateRate <= 0.005,
    normalizedDuplicate: real.normalizedDuplicateRate <= 0.02,
    difficultyGradient: gradientPassed,
    humanReviewClear,
    ageAppropriate,
    ambiguity,
  }
  const failures: string[] = []
  for (const [name, passed] of Object.entries(blocking))
    if (!passed) failures.push(`BLOCKING:${name}`)
  for (const [name, passed] of Object.entries(quality))
    if (passed === false) failures.push(`QUALITY:${name}`)
  if (samples.length < 40) failures.push(`QUALITY:humanReviewSamples(${samples.length}/40)`)
  const coverageComplete =
    options.batchCount >= 5 &&
    options.batchSize >= 20 &&
    REAL_LLM_GOLDEN_SCENARIOS.every((s) =>
      Array.from({ length: options.batchCount }, (_, index) => index).every(
        (index) =>
          observations
            .filter((o) => o.scenarioId === s.id && o.batchIndex === index)
            .reduce((sum, o) => sum + o.request.count, 0) >= options.batchSize,
      ),
    ) &&
    options.difficultyObservations?.length === 4 &&
    options.difficultyObservations.every((o) => o.requestedQuestions >= 100)
  if (!coverageComplete) failures.push('INCOMPLETE:FULL_EVALUATION_COVERAGE')
  for (const scenario of scenarioReports)
    if (!scenario.requirementPassed) failures.push(`QUALITY:SCENARIO_${scenario.id}_REQUIREMENT`)
  const severe =
    real.firstPassValidRate < 0.9 ||
    real.finalValidRate < 0.97 ||
    real.repairRate > 0.2 ||
    (real.repairQuestions > 0 && real.repairSuccessRate < 0.8) ||
    real.fallbackRate > 0.03
  return {
    evaluationVersion: REAL_LLM_EVALUATION_VERSION,
    generatedAt: new Date().toISOString(),
    metricDefinitions: {
      firstPassValid:
        'first content-attempt accepted questions / requested slots; includes transport retries, excludes repairs/fallback',
      finalValid:
        'independently validated and delivered questions / requested slots; REAL_LLM excludes explicit MOCK origins',
      repairRate:
        'missing slots at the first actual content-repair call per chunk / requested slots; transport exhaustion excluded; repairBatchRate separately counts affected logical batches',
      repairSuccess:
        'questions recovered by content repair / missing slots at first repair call; no repair = 1 (vacuous, see repairQuestions)',
      fallbackRate:
        'logical batches using any fallback / logical batches; H counts once, chunks are not batches',
      duplicateRate:
        'REAL_LLM raw duplicate candidates before filtering / raw candidates, across chunks within batch and provided history; SYSTEM_FINAL delivered duplicates / delivered questions',
      latency: 'per transport call including failed/retried calls, not full batch wall time',
      tokens: 'sum of known usage only; unknownTokenCalls are not claimed as zero cost',
      constraints:
        'compliance on delivered questions; rawConstraintCompliance separately includes discarded candidates',
      difficulty:
        'numeric operand bands only; application and multistep reasoning remain unsupported',
      independence:
        'sample requests are repeated with new identities; seed controls local templates, not provider deterministic sampling',
    },
    provider: options.provider,
    model: options.model,
    promptVersions,
    batchCount: options.batchCount,
    batchSize: options.batchSize,
    coverageComplete,
    requestedQuestions: observations.reduce(
      (sum, observation) => sum + observation.request.count,
      0,
    ),
    REAL_LLM_ONLY: real,
    SYSTEM_FINAL: final,
    scenarios: scenarioReports,
    difficultySweep: {
      enabled: Boolean(options.difficultyObservations?.length),
      observations: options.difficultyObservations ?? [],
      gradientPassed,
    },
    humanReview: {
      status: humanComplete ? 'COMPLETE' : 'PENDING',
      requestedSamples: 40,
      selectedSamples: samples.length,
      perScenario: humanPerScenario,
      samples,
    },
    gates: { blocking, quality },
    acceptanceStatus:
      failures.some((failure) => failure.startsWith('BLOCKING:')) || severe
        ? 'FAIL'
        : !coverageComplete || !humanComplete
          ? 'INCONCLUSIVE'
          : humanComplete && failures.length === 0
            ? 'PASS'
            : 'CONDITIONAL_PASS',
    failures,
  }
}

export function validateBatchCount(
  value: number,
): asserts value is (typeof SUPPORTED_EVALUATION_BATCHES)[number] {
  if (
    !SUPPORTED_EVALUATION_BATCHES.includes(value as (typeof SUPPORTED_EVALUATION_BATCHES)[number])
  )
    throw new Error(`BATCH_COUNT_MUST_BE_ONE_OF_${SUPPORTED_EVALUATION_BATCHES.join('_')}`)
}
