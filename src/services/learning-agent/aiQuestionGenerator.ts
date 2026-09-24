import { productionConfig } from '@/config/production'
import type { Question, QuestionKnowledgePoint } from '@/types'
import type {
  GeneratedQuestionBatch,
  LearningAgentSnapshot,
  QuestionGenerationRequest,
  QuestionGeneratorProvider,
} from '@/types/learning-agent'
import type { QuestionGenerationTelemetry } from '@/types/llm'
import { LLMRuntime } from '../llm/runtime'
import { asLLMError } from '../llm/errors'
import {
  generatedQuestionItemSchema,
  questionGenerationJSONSchema,
  generatedQuestionsSchema,
  QUESTION_SCHEMA_VERSION,
  type GeneratedQuestionDTO,
} from '../llm/questionSchema'
import {
  arithmeticSummary,
  QuestionGenerationPromptBuilder,
  type GenerationPromptVersion,
} from '../llm/questionPromptBuilder'
import {
  GeneratedQuestionValidator,
  matchesTemplate,
  normalizedQuestionFingerprint,
} from './generatedQuestionValidator'
import { difficultyLevel, MockQuestionGenerator, templateDifficulty } from './generators'
import { parseArithmetic, questionText } from './deterministicAnswerValidator'

import { mathConstraintChecks, realMathConstraints } from './mathConstraints'

/** Three generation attempts total: initial + at most two repairs. Transport retries are separate. */
export const MAX_GENERATION_ATTEMPTS = 3
const MAX_FALLBACK_CANDIDATES = 300
export class AIQuestionGenerator implements QuestionGeneratorProvider {
  constructor(
    private readonly runtime: LLMRuntime,
    private readonly snapshot: LearningAgentSnapshot,
    private readonly chunkSize = 5,
    private readonly promptVersion: GenerationPromptVersion = '6',
    private readonly temperature?: number,
    private readonly allowMockFallback = true,
  ) {
    if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 100)
      throw new Error('INVALID_CHUNK_SIZE')
  }
  async generate(request: QuestionGenerationRequest): Promise<GeneratedQuestionBatch> {
    if (!productionConfig.devRoutes || this.snapshot.dataset !== 'demo')
      throw new Error('AGENT_PRODUCTION_DELIVERY_DISABLED')
    const curriculum = this.snapshot.curriculum
    if (
      request.profileId !== this.snapshot.profile.studentId ||
      request.curriculum.regionId !== this.snapshot.profile.regionId ||
      request.curriculum.textbookId !== curriculum.textbook.id ||
      request.curriculum.grade !== curriculum.grade.id ||
      request.curriculum.semester !== curriculum.semester.id ||
      request.curriculum.subjectId !== curriculum.subject.id ||
      request.curriculum.subject !== 'MATH' ||
      request.curriculum.publisher !== curriculum.publisher?.id ||
      !Number.isInteger(request.count) ||
      request.count < 1 ||
      request.count > 100 ||
      !Number.isFinite(request.difficulty) ||
      request.difficulty < 0 ||
      request.difficulty > 1 ||
      !request.targetKnowledgePoints.length ||
      request.targetKnowledgePoints.some(
        (id) => !curriculum.knowledgePoints.some((k) => k.id === id),
      )
    )
      throw new Error('GENERATION_REQUEST_INVALID')
    if (request.count > this.chunkSize) return this.generateChunks(request)
    const telemetry: QuestionGenerationTelemetry = {
      mode: 'REAL_LLM',
      fallbackUsed: false,
      repairCount: 0,
      status: 'REJECTED',
      usage: [],
      events: [],
      attempts: [],
      origins: {},
      chunkCount: 1,
    }
    const emit = (event: string, data: Record<string, unknown> = {}) =>
      telemetry.events.push({ event, at: new Date().toISOString(), data })
    const batch: GeneratedQuestionBatch = {
      batchId: `batch:${request.requestId}`,
      requestId: request.requestId,
      questions: [],
      mappings: [],
      validation: { status: 'GENERATED', checks: [] },
      generator: {
        provider: this.runtime.provider.providerId,
        model: this.runtime.provider.model,
        promptVersion: this.promptVersion,
      },
      createdAt: request.createdAt,
      telemetry,
    }
    const validator = new GeneratedQuestionValidator()
    let failed: GeneratedQuestionDTO[] = [],
      codes: string[] = [],
      reason = 'GENERATION_ATTEMPTS_EXHAUSTED'
    const appendIfValid = (question: Question, mappings: QuestionKnowledgePoint[]): boolean => {
      const proposed = {
        ...batch,
        questions: [...batch.questions, question],
        mappings: [...batch.mappings, ...mappings],
      }
      const validation = validator.validate(
        proposed,
        { ...request, count: proposed.questions.length },
        this.snapshot,
      )
      if (validation.status !== 'VALID') {
        codes.push(...validation.checks.filter((c) => c.status !== 'PASS').map((c) => c.code))
        return false
      }
      batch.questions.push(question)
      batch.mappings.push(...mappings)
      return true
    }
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      if (attempt) {
        telemetry.repairCount = attempt
        emit('QUESTION_REPAIR_STARTED', {
          repairCount: attempt,
          missingCount: request.count - batch.questions.length,
        })
      }
      const prompt = new QuestionGenerationPromptBuilder(this.promptVersion).build(
        request,
        this.snapshot,
        {
          count: request.count - batch.questions.length,
          accepted: batch.questions.map(questionText),
          ...(attempt
            ? { repair: { failedQuestions: failed, validationErrors: [...new Set(codes)] } }
            : {}),
        },
      )
      codes = []
      let items: unknown[] = []
      let terminal = false
      try {
        const result = await this.runtime.generateStructured(
          {
            // Opaque transport identity: domain request IDs can contain profile IDs or user seeds.
            requestId: crypto.randomUUID(),
            systemPrompt: prompt.systemPrompt,
            userPrompt: prompt.userPrompt,
            schema: generatedQuestionsSchema,
            jsonSchema: questionGenerationJSONSchema(
              request.difficulty,
              request.targetKnowledgePoints,
              request.count - batch.questions.length,
            ),
            schemaName: 'generated_questions_v1',
            temperature: this.temperature,
            maxOutputTokens: Math.min(
              16000,
              Math.max(4096, (request.count - batch.questions.length) * 350),
            ),
          },
          {
            promptId: prompt.definition.id,
            promptVersion: prompt.definition.version,
            schemaVersion: QUESTION_SCHEMA_VERSION,
            repairCount: attempt,
            onUsage: (record) => telemetry.usage.push(record),
            onEvent: (event) => telemetry.events.push(event),
          },
        )
        items = result.data.questions
      } catch (raw) {
        const error = asLLMError(raw)
        reason = error.type
        const invalid = error.invalidData
        // A malformed item must not discard its well-formed siblings. Strictly inspect each below.
        if (
          invalid &&
          typeof invalid === 'object' &&
          Object.keys(invalid).length === 1 &&
          'questions' in invalid &&
          Array.isArray(invalid.questions) &&
          invalid.questions.length <= 100
        )
          items = invalid.questions
        terminal = error.type !== 'STRUCTURED_OUTPUT_ERROR' && error.type !== 'INVALID_RESPONSE'
        codes = [error.type]
      }
      emit('QUESTION_VALIDATION_STARTED', { attempt, receivedCount: items.length })
      const remaining = request.count - batch.questions.length
      const before = batch.questions.length
      const audit = {
        attempt,
        requested: remaining,
        received: items.length,
        accepted: 0,
        schemaValid: 0,
        mathCorrect: 0,
        knowledgeMatch: 0,
        constraintValid: 0,
        exactDuplicates: 0,
        normalizedDuplicates: 0,
        errors: [] as string[],
        failedItems: [] as Array<{
          stem: string | null
          expectedAnswer?: number
          difficulty?: number
          errors: string[]
        }>,
        terminal,
      }
      const prior = [
        ...batch.questions,
        ...this.snapshot.questions.filter(
          (q) =>
            request.recentQuestionRefs.includes(q.id) || request.avoidQuestionRefs.includes(q.id),
        ),
      ]
      const seenExact = new Set(prior.map(questionText))
      const seenNormalized = new Set(prior.map(normalizedQuestionFingerprint))
      const requestErrors = [...codes]
      codes = []
      failed = []
      const temporaryIds = new Set<string>()
      if (items.length !== remaining) codes.push('QUESTION_COUNT')
      // Surplus items are untrusted and discarded; they cannot replace accepted questions.
      for (const raw of items.slice(0, remaining)) {
        const parsed = generatedQuestionItemSchema.safeParse(raw)
        if (!parsed.success) {
          codes.push('QUESTION_SCHEMA')
          audit.failedItems.push({ stem: null, errors: ['QUESTION_SCHEMA'] })
          continue
        }
        const dto = parsed.data
        audit.schemaValid++
        const arithmetic = parseArithmetic(dto.stem)
        if (
          arithmetic &&
          Number.isFinite(arithmetic.result) &&
          arithmetic.result === dto.expectedAnswer
        )
          audit.mathCorrect++
        const adaptedForAudit = this.adapt(dto, request, 'audit')
        if (adaptedForAudit) audit.knowledgeMatch++
        if (
          mathConstraintChecks(dto.stem, realMathConstraints(request, this.snapshot)).every(
            (c) => c.pass,
          )
        )
          audit.constraintValid++
        const fingerprint = normalizedQuestionFingerprint({
          stem: [{ type: 'FORMULA', text: dto.stem }],
        } as Question)
        if (seenExact.has(dto.stem)) audit.exactDuplicates++
        if (seenNormalized.has(fingerprint)) audit.normalizedDuplicates++
        seenExact.add(dto.stem)
        seenNormalized.add(fingerprint)
        if (temporaryIds.has(dto.temporaryId)) {
          codes.push('TEMPORARY_ID_DUPLICATE')
          audit.failedItems.push({
            stem: arithmeticSummary(dto.stem),
            expectedAnswer: dto.expectedAnswer,
            difficulty: dto.difficulty,
            errors: ['TEMPORARY_ID_DUPLICATE'],
          })
          failed.push(dto)
          continue
        }
        temporaryIds.add(dto.temporaryId)
        const codeStart = codes.length
        const adapted = this.adapt(dto, request, `${attempt}:${temporaryIds.size}`)
        if (
          !adapted ||
          dto.difficulty !== request.difficulty ||
          !appendIfValid(adapted.question, adapted.mappings)
        ) {
          failed.push(dto)
          if (!adapted) codes.push('TEMPLATE_SEMANTIC_SCOPE')
          if (dto.difficulty !== request.difficulty) codes.push('DIFFICULTY_RANGE')
          audit.failedItems.push({
            stem: arithmeticSummary(dto.stem),
            expectedAnswer: dto.expectedAnswer,
            difficulty: dto.difficulty,
            errors: [...new Set(codes.slice(codeStart))],
          })
        }
      }
      audit.accepted = batch.questions.length - before
      for (const question of batch.questions.slice(before))
        telemetry.origins![question.id] = 'REAL_LLM'
      audit.errors = [...new Set([...requestErrors, ...codes])]
      telemetry.attempts!.push(audit)
      if (batch.questions.length < request.count) {
        codes.push('MISSING_QUESTIONS')
        emit('QUESTION_VALIDATION_FAILED', {
          attempt,
          acceptedCount: batch.questions.length,
          codes: [...new Set(codes)],
        })
      }
      audit.errors = [...new Set([...audit.errors, ...codes])]
      if (attempt)
        emit('QUESTION_REPAIR_COMPLETED', {
          repairCount: attempt,
          acceptedCount: batch.questions.length,
        })
      if (batch.questions.length === request.count) {
        batch.validation = validator.validate(batch, request, this.snapshot)
        if (batch.validation.status === 'VALID') {
          telemetry.status = 'READY'
          emit('QUESTION_GENERATION_READY', { count: batch.questions.length })
          return batch
        }
      }
      if (terminal) break
    }
    if (!this.allowMockFallback) {
      batch.validation = validator.validate(batch, request, this.snapshot)
      telemetry.status = 'REJECTED'
      emit('QUESTION_GENERATION_REJECTED', {
        reason:
          reason === 'GENERATION_ATTEMPTS_EXHAUSTED'
            ? [...new Set(codes)].join(',') || reason
            : reason,
        retainedCount: batch.questions.length,
      })
      return batch
    }
    telemetry.fallbackUsed = true
    telemetry.fallbackReason =
      reason === 'GENERATION_ATTEMPTS_EXHAUSTED' ? [...new Set(codes)].join(',') || reason : reason
    emit('QUESTION_GENERATION_FALLBACK', {
      fallbackReason: telemetry.fallbackReason,
      retainedCount: batch.questions.length,
    })
    const mock = new MockQuestionGenerator(this.snapshot.templates)
    // Preserve valid LLM items. Use the existing seeded template engine for missing items only.
    // Bound candidate search because some template/constraint combinations are impossible.
    for (
      let candidate = 0;
      candidate < MAX_FALLBACK_CANDIDATES && batch.questions.length < request.count;
      candidate++
    ) {
      try {
        const replacement = await mock.generate({
          ...request,
          count: 1,
          seed: `${request.seed}:fallback:${candidate}`,
        })
        for (const question of replacement.questions)
          if (
            appendIfValid(
              question,
              replacement.mappings.filter((m) => m.questionId === question.id),
            )
          )
            telemetry.origins![question.id] = 'MOCK'
      } catch {
        break
      }
    }
    batch.validation = validator.validate(batch, request, this.snapshot)
    telemetry.status = batch.validation.status === 'VALID' ? 'FALLBACK' : 'REJECTED'
    if (batch.validation.status === 'VALID')
      emit('QUESTION_GENERATION_READY', { count: batch.questions.length, fallbackUsed: true })
    return batch
  }
  private async generateChunks(
    request: QuestionGenerationRequest,
  ): Promise<GeneratedQuestionBatch> {
    const snapshot = structuredClone(this.snapshot)
    const telemetry: QuestionGenerationTelemetry = {
      mode: 'REAL_LLM',
      status: 'REJECTED',
      fallbackUsed: false,
      repairCount: 0,
      usage: [],
      events: [],
      attempts: [],
      origins: {},
      chunkCount: 0,
    }
    const batch: GeneratedQuestionBatch = {
      batchId: `batch:${request.requestId}`,
      requestId: request.requestId,
      questions: [],
      mappings: [],
      createdAt: request.createdAt,
      generator: {
        provider: this.runtime.provider.providerId,
        model: this.runtime.provider.model,
        promptVersion: this.promptVersion,
      },
      validation: { status: 'GENERATED', checks: [] },
      telemetry,
    }
    for (let offset = 0; offset < request.count; offset += this.chunkSize) {
      const chunk = await new AIQuestionGenerator(
        this.runtime,
        snapshot,
        this.chunkSize,
        this.promptVersion,
        this.temperature,
        this.allowMockFallback,
      ).generate({
        ...request,
        requestId: `${request.requestId}:chunk:${offset / this.chunkSize}`,
        count: Math.min(this.chunkSize, request.count - offset),
        avoidQuestionRefs: [...request.avoidQuestionRefs, ...batch.questions.map((q) => q.id)],
      })
      batch.questions.push(...chunk.questions)
      batch.mappings.push(...chunk.mappings)
      snapshot.questions.push(...chunk.questions)
      telemetry.chunkCount!++
      telemetry.usage.push(...chunk.telemetry!.usage)
      // Only the assembled original request may emit a batch-ready event.
      telemetry.events.push(
        ...chunk.telemetry!.events.filter((e) => e.event !== 'QUESTION_GENERATION_READY'),
      )
      telemetry.attempts!.push(...chunk.telemetry!.attempts!)
      Object.assign(telemetry.origins!, chunk.telemetry!.origins)
      telemetry.repairCount = Math.max(telemetry.repairCount, chunk.telemetry!.repairCount)
      telemetry.fallbackUsed ||= chunk.telemetry!.fallbackUsed
      if (chunk.telemetry!.fallbackReason)
        telemetry.fallbackReason = chunk.telemetry!.fallbackReason
    }
    batch.validation = new GeneratedQuestionValidator().validate(batch, request, this.snapshot)
    telemetry.status =
      batch.validation.status !== 'VALID'
        ? 'REJECTED'
        : telemetry.fallbackUsed
          ? 'FALLBACK'
          : 'READY'
    if (batch.validation.status === 'VALID')
      telemetry.events.push({
        event: 'QUESTION_GENERATION_READY',
        at: new Date().toISOString(),
        data: { count: batch.questions.length, fallbackUsed: telemetry.fallbackUsed },
      })
    return batch
  }
  private adapt(
    dto: GeneratedQuestionDTO,
    request: QuestionGenerationRequest,
    index: string,
  ): { question: Question; mappings: QuestionKnowledgePoint[] } | null {
    const question: Question = {
      id: `${request.requestId}:ai:${index}`,
      questionType: dto.questionType,
      stem: [{ type: 'FORMULA', text: dto.stem }],
      answerRule: { ruleType: 'NUMERIC', value: dto.expectedAnswer },
      explanation: { summary: [{ type: 'TEXT', text: dto.explanation }], steps: [] },
      knowledgePointId: dto.knowledgePointIds[0],
      difficulty: difficultyLevel(dto.difficulty),
      contentType: 'EXTENSION',
      sourceId: '',
      status: 'AI_GENERATED',
      needsVerification: true,
      isSample: true,
      verificationStatus: 'SAMPLE',
      estimatedSeconds: 30,
      tags: ['AI_GENERATED_SUPPLEMENT'],
      media: [],
      hints: [],
      gradeId: request.curriculum.grade,
      semesterId: request.curriculum.semester,
      subjectId: request.curriculum.subjectId,
      textbookVersionId: request.curriculum.textbookId,
    }
    const template = this.snapshot.templates.find(
      (t) =>
        request.constraints.templateIds.includes(t.id) &&
        t.difficulty === templateDifficulty(request.difficulty) &&
        dto.knowledgePointIds.length === 1 &&
        dto.knowledgePointIds[0] === t.knowledgePointId &&
        request.targetKnowledgePoints.includes(t.knowledgePointId) &&
        matchesTemplate(question, t),
    )
    if (!template) return null
    question.sourceId = `agent-template:${template.id}`
    return {
      question,
      mappings: [
        {
          id: `agent-mapping:${question.id}`,
          questionId: question.id,
          knowledgePointId: template.knowledgePointId,
          relationType: 'PRIMARY',
          weight: 1,
          order: 1,
          isPrimary: true,
          sourceId: question.sourceId,
          status: 'DRAFT',
          needsVerification: true,
          isSample: true,
          verificationStatus: 'SAMPLE',
        },
      ],
    }
  }
}
