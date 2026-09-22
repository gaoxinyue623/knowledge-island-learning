import { mathConstraintChecks, realMathConstraints } from './mathConstraints'
import { z } from 'zod'
import type { ExerciseTemplate, Question } from '@/types'
import type {
  GeneratedQuestionBatch,
  GenerationValidation,
  LearningAgentSnapshot,
  QuestionGenerationRequest,
} from '@/types/learning-agent'
import { validateQuestion } from '@/services/validation/questionValidation'
import {
  DeterministicAnswerValidator,
  parseArithmetic,
  questionText,
} from './deterministicAnswerValidator'
import { difficultyLevel, templateDifficulty } from './generators'
import { validateQuestionMix } from './learningPlanner'

const batchSchema = z.object({
  batchId: z.string().min(1),
  requestId: z.string().min(1),
  questions: z.array(z.unknown()).min(1).max(100),
  mappings: z.array(
    z.object({
      id: z.string().min(1),
      relationType: z.enum(['PRIMARY', 'SECONDARY']),
      order: z.number().int().nonnegative(),
      isPrimary: z.boolean(),
      questionId: z.string(),
      knowledgePointId: z.string(),
      weight: z.number().finite().positive().max(1),
      sourceId: z.string(),
      isSample: z.boolean(),
      needsVerification: z.boolean(),
      verificationStatus: z.string(),
      status: z.string(),
    }),
  ),
  generator: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    promptVersion: z.string().min(1),
  }),
  createdAt: z.string().datetime(),
})
export function normalizedQuestionFingerprint(q: Question): string {
  return questionText(q)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[−－]/g, '-')
    .replace(/[×x]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '')
}
export interface SemanticDuplicateDetector {
  isDuplicate(question: Question, references: readonly Question[]): Promise<boolean>
}
export function finishValidation(checks: GenerationValidation['checks']): GenerationValidation {
  return {
    status: checks.some((c) => c.status === 'FAIL')
      ? 'INVALID'
      : checks.some((c) => c.status === 'REQUIRES_REVIEW')
        ? 'REQUIRES_REVIEW'
        : 'VALID',
    checks,
  }
}
export function isSafePlainText(value: string, maxLength = 2000): boolean {
  return (
    value.length <= maxLength &&
    !/<\/?[a-z][^>]*>|javascript:|https?:\/\/|data:|自杀|色情|杀死|银行卡|身份证号/i.test(value)
  )
}
/** Checks constraints independently from the template generator's answer and derivation. */
export function matchesTemplate(q: Question, template: ExerciseTemplate): boolean {
  const c = parseArithmetic(questionText(q))
  if (template.templateType === 'addition_range' && c?.operator === '+') {
    const t = template.config
    return (
      Number.isInteger(c.left) &&
      Number.isInteger(c.right) &&
      c.left >= t.minAddend &&
      c.left <= t.maxAddend &&
      c.right >= t.minAddend &&
      c.right <= t.maxAddend &&
      c.result <= t.maxResult &&
      (t.allowZero || (c.left !== 0 && c.right !== 0)) &&
      (!t.noCarry || (c.left % 10) + (c.right % 10) < 10)
    )
  }
  if (template.templateType === 'subtraction_range' && c?.operator === '-') {
    const t = template.config
    return (
      Number.isInteger(c.left) &&
      Number.isInteger(c.right) &&
      c.left >= t.minMinuend &&
      c.left <= t.maxMinuend &&
      c.right >= t.minSubtrahend &&
      c.right <= t.maxSubtrahend &&
      (!t.nonNegative || c.result >= 0) &&
      (t.allowZero || (c.left !== 0 && c.right !== 0))
    )
  }
  if (template.templateType === 'compare_numbers') {
    const m = questionText(q).match(/^比较 (\d+) 和 (\d+)，选一选。$/),
      t = template.config
    return Boolean(
      m &&
      Number(m[1]) >= t.min &&
      Number(m[1]) <= t.max &&
      Number(m[2]) >= t.min &&
      Number(m[2]) <= t.max &&
      (t.allowEqual || m[1] !== m[2]),
    )
  }
  return false
}
export class GeneratedQuestionValidator {
  validate(
    raw: unknown,
    request: QuestionGenerationRequest,
    snapshot: LearningAgentSnapshot,
  ): GenerationValidation {
    const checks: GenerationValidation['checks'] = []
    const check = (stage: string, pass: boolean, code: string, resourceId?: string) =>
      checks.push({ stage, status: pass ? 'PASS' : 'FAIL', code, resourceId })
    const parsed = batchSchema.safeParse(raw)
    check('SCHEMA', parsed.success, 'BATCH_SCHEMA')
    if (!parsed.success) return finishValidation(checks)
    const batch = raw as GeneratedQuestionBatch
    if (batch.questions.some((q) => !validateQuestion(q).valid)) {
      check('SCHEMA', false, 'QUESTION_SCHEMA')
      return finishValidation(checks)
    }
    check(
      'SCHEMA',
      batch.requestId === request.requestId &&
        batch.createdAt === request.createdAt &&
        batch.questions.length === request.count &&
        Number.isInteger(request.count) &&
        request.count > 0 &&
        request.count <= 100 &&
        validateQuestionMix(request.constraints.questionMix),
      'REQUEST_BINDING',
    )
    check(
      'CURRICULUM',
      request.curriculum.textbookId === snapshot.curriculum.textbook.id &&
        request.profileId === snapshot.profile.studentId &&
        request.curriculum.regionId === snapshot.profile.regionId &&
        request.curriculum.grade === snapshot.curriculum.grade.id &&
        request.curriculum.semester === snapshot.curriculum.semester.id &&
        request.curriculum.subjectId === snapshot.curriculum.subject.id &&
        request.curriculum.subject === snapshot.curriculum.subject.code &&
        request.curriculum.publisher === snapshot.curriculum.publisher?.id,
      'REQUEST_CURRICULUM',
    )
    const ids = new Set<string>(),
      exact = new Set<string>(),
      normalized = new Set<string>()
    const referenceQuestions = snapshot.questions.filter(
      (q) => request.recentQuestionRefs.includes(q.id) || request.avoidQuestionRefs.includes(q.id),
    )
    const recentNormalized = new Set(referenceQuestions.map(normalizedQuestionFingerprint))
    check(
      'KNOWLEDGE_POINT',
      batch.mappings.every((m) => batch.questions.some((q) => q.id === m.questionId)) &&
        new Set(batch.mappings.map((m) => m.id)).size === batch.mappings.length,
      'MAPPING_OWNERSHIP',
    )
    for (const q of batch.questions) {
      const valid = validateQuestion(q).valid
      check('SCHEMA', valid, 'QUESTION_SCHEMA', q?.id)
      if (!valid) continue
      check(
        'CURRICULUM',
        q.textbookVersionId === request.curriculum.textbookId &&
          q.gradeId === request.curriculum.grade &&
          q.semesterId === request.curriculum.semester &&
          q.subjectId === request.curriculum.subjectId &&
          request.allowedQuestionTypes.includes(q.questionType),
        'QUESTION_CURRICULUM',
        q.id,
      )
      check(
        'CURRICULUM',
        q.status === 'AI_GENERATED' &&
          q.needsVerification &&
          q.isSample &&
          q.verificationStatus === 'SAMPLE',
        'SUPPLEMENT_NOT_PUBLISHED',
        q.id,
      )
      const mappings = batch.mappings.filter((m) => m.questionId === q.id)
      const template = snapshot.templates.find(
        (t) =>
          request.constraints.templateIds.includes(t.id) && q.sourceId === `agent-template:${t.id}`,
      )
      check(
        'KNOWLEDGE_POINT',
        mappings.length > 0 &&
          Math.abs(mappings.reduce((n, m) => n + m.weight, 0) - 1) < 1e-8 &&
          new Set(mappings.map((m) => m.knowledgePointId)).size === mappings.length &&
          mappings.every(
            (m) =>
              request.targetKnowledgePoints.includes(m.knowledgePointId) &&
              snapshot.curriculum.knowledgePoints.some((k) => k.id === m.knowledgePointId) &&
              m.isSample &&
              m.needsVerification &&
              m.verificationStatus === 'SAMPLE' &&
              m.status === 'DRAFT' &&
              m.sourceId === q.sourceId &&
              (!q.knowledgePointId || q.knowledgePointId === m.knowledgePointId),
          ),
        'KNOWLEDGE_MAPPING',
        q.id,
      )
      const bound = Boolean(
        template &&
        mappings.every((m) => m.knowledgePointId === template.knowledgePointId) &&
        matchesTemplate(q, template),
      )
      checks.push({
        stage: 'KNOWLEDGE_POINT',
        status: bound ? 'PASS' : 'REQUIRES_REVIEW',
        code: 'TEMPLATE_SEMANTIC_SCOPE',
        resourceId: q.id,
      })
      const answer = new DeterministicAnswerValidator().validate(q)
      checks.push({
        stage: 'ANSWER',
        status: answer === 'VALID' ? 'PASS' : answer === 'INVALID' ? 'FAIL' : 'REQUIRES_REVIEW',
        code: 'INDEPENDENT_ANSWER_CHECK',
        resourceId: q.id,
      })
      check(
        'DIFFICULTY',
        Number.isFinite(request.difficulty) &&
          request.difficulty >= 0 &&
          request.difficulty <= 1 &&
          q.difficulty === difficultyLevel(request.difficulty) &&
          template?.difficulty === templateDifficulty(request.difficulty),
        'DIFFICULTY_RANGE',
        q.id,
      )
      const text = questionText(q),
        fingerprint = normalizedQuestionFingerprint(q)
      check(
        'DUPLICATE',
        !ids.has(q.id) &&
          !exact.has(text) &&
          !request.avoidQuestionRefs.includes(q.id) &&
          !request.recentQuestionRefs.includes(q.id),
        'EXACT_DUPLICATE',
        q.id,
      )
      check(
        'DUPLICATE',
        !normalized.has(fingerprint) && !recentNormalized.has(fingerprint),
        'NORMALIZED_DUPLICATE',
        q.id,
      )
      ids.add(q.id)
      exact.add(text)
      normalized.add(fingerprint)
      const blocks = [
        ...q.stem,
        ...q.explanation.summary,
        ...q.explanation.steps.flat(),
        ...q.hints.flatMap((h) => h.content),
        ...(q.options ?? []).flatMap((o) => o.content),
      ]
      check(
        'SAFETY',
        blocks.every(
          (b) =>
            (b.type === 'TEXT' || b.type === 'FORMULA') &&
            isSafePlainText(b.text ?? '', request.constraints.maxTextLength),
        ) &&
          q.media.length === 0 &&
          !(q.options ?? []).some((o) => o.media?.length),
        'PLAIN_TEXT_SAFETY',
        q.id,
      )
      const real =
        batch.generator.provider === 'OPENAI_COMPATIBLE' || batch.telemetry?.mode === 'REAL_LLM'
      if (real || request.constraints.math) {
        for (const constraint of mathConstraintChecks(
          text,
          real ? realMathConstraints(request, snapshot) : request.constraints.math!,
        ))
          check('CONSTRAINT', constraint.pass, constraint.code, q.id)
      }
      const arithmetic = parseArithmetic(questionText(q))
      if (request.weaknessSignals.includes('ACTIVE_WRONG_QUESTION')) {
        const originals = snapshot.questions.filter(
          (original) =>
            request.avoidQuestionRefs.includes(original.id) && !original.id.includes(':chunk:'),
        )
        const references = originals
          .map((original) => ({
            question: original,
            arithmetic: parseArithmetic(questionText(original)),
            fingerprint: normalizedQuestionFingerprint(original),
          }))
          .filter(
            (reference): reference is typeof reference & { arithmetic: NonNullable<typeof reference.arithmetic> } =>
              !!reference.arithmetic,
          )
        const variationMath = mathConstraintChecks(
          text,
          realMathConstraints(request, snapshot),
        ).every((constraint) => constraint.pass)
        check('CONSTRAINT', references.length > 0, 'VARIATION_REFERENCE_PRESENT', q.id)
        check(
          'CONSTRAINT',
          references.length > 0 &&
            !!arithmetic &&
            references.every((reference) => arithmetic.operator === reference.arithmetic.operator),
          'VARIATION_OPERATOR',
          q.id,
        )
        check(
          'KNOWLEDGE_POINT',
          references.length > 0 &&
            !!q.knowledgePointId &&
            references.every((reference) => q.knowledgePointId === reference.question.knowledgePointId),
          'VARIATION_KNOWLEDGE_POINT',
          q.id,
        )
        check('CONSTRAINT', variationMath, 'VARIATION_BOUNDS', q.id)
        check(
          'DUPLICATE',
          !!arithmetic &&
            references.every(
              (reference) =>
                normalizedQuestionFingerprint(q) !== reference.fingerprint &&
                arithmetic.left !== reference.arithmetic.left &&
                arithmetic.right !== reference.arithmetic.right,
            ),
          'VARIATION_OPERANDS',
          q.id,
        )
        check(
          'CONSTRAINT',
          !!arithmetic && references.length > 0,
          'VARIATION_ARITHMETIC',
          q.id,
        )
      }
      const explanation =
        arithmetic?.operator === '+'
          ? `把 ${arithmetic.left} 和 ${arithmetic.right} 合在一起，结果是 ${arithmetic.result}。`
          : arithmetic?.operator === '-'
            ? `从 ${arithmetic.left} 中去掉 ${arithmetic.right}，还剩 ${arithmetic.result}。`
            : null
      const comparison = questionText(q).match(/^比较 (\d+) 和 (\d+)，选一选。$/)
      const comparisonExplanation = comparison
        ? `${comparison[1]} ${Number(comparison[1]) < Number(comparison[2]) ? '<' : Number(comparison[1]) > Number(comparison[2]) ? '>' : '='} ${comparison[2]}。`
        : null
      const curatedExplanation =
        JSON.stringify(q.explanation) ===
          JSON.stringify({
            summary: [{ type: 'TEXT', text: explanation ?? comparisonExplanation }],
            steps: [],
          }) && q.hints.length === 0
      if (!curatedExplanation)
        checks.push({
          stage: 'SAFETY',
          status: 'REQUIRES_REVIEW',
          code: 'EXPLANATION_REVIEW_REQUIRED',
          resourceId: q.id,
        })
      // Real generation is approved only on the same bounded arithmetic and curated explanation surface.
      if (
        batch.generator.provider !== 'MOCK' &&
        !(
          batch.generator.provider === 'OPENAI_COMPATIBLE' &&
          snapshot.dataset === 'demo' &&
          bound &&
          arithmetic &&
          ['+', '-'].includes(arithmetic.operator) &&
          curatedExplanation
        )
      )
        checks.push({
          stage: 'SAFETY',
          status: 'REQUIRES_REVIEW',
          code: 'PROVIDER_REVIEW_REQUIRED',
          resourceId: q.id,
        })
    }
    return finishValidation(checks)
  }
}
