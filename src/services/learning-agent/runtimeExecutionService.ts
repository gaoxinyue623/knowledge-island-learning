import type {
  LearningEvidence,
  MasteryRecord,
  QuestionAnswerDraft,
  QuestionKnowledgePoint,
  QuestionSession,
  LearningHistoryRepository,
  WrongBookRepository,
  ReviewQueueRepository,
} from '@/types'
import type {
  AnswerAnalysisResult,
  LearningAgentSource,
  LearningDecision,
  LearningAgentTrace,
} from '@/types/learning-agent'
import {
  questionRepository,
  type QuestionRepository,
} from '@/services/question-engine/questionRepository'
import {
  questionSessionStorage,
  type QuestionSessionStorage,
} from '@/services/question-engine/questionSessionStorage'
import { createQuestionSession } from '@/services/question-engine/questionEngineAdapter'
import {
  isQuestionAnswerComplete,
  validateQuestionAnswer,
  isScorableQuestionType,
} from '@/services/question-engine/answerValidator'
import { masteryRepository, type MasteryRepository } from '@/services/mastery/masteryRepository'
import { buildMasteryRecord } from '@/services/mastery/masteryEngine'
import { wrongBookRepository } from '@/services/wrong-book/wrongBookRepository'
import { WrongBookProjectionService } from '@/services/wrong-book/wrongBookProjection'
import { reviewQueueRepository } from '@/services/review-queue/reviewQueueRepository'
import { ReviewQueueProjectionService } from '@/services/review-queue/reviewQueueProjection'
import { learningHistoryRepository } from '@/services/learning-history/learningHistoryRepository'
import { projectQuestionSessionToHistory } from '@/services/learning-history/learningHistoryProjection'
import { validateQuestion } from '@/services/validation/questionValidation'
import { AnswerAnalyzer } from './answerAnalyzer'
import { DeterministicAnswerValidator } from './deterministicAnswerValidator'
import { RuntimeLearningAgentSource } from './runtimeSource'
import { buildAgentContext } from './contextBuilder'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from './plannerConfig'

export interface RuntimeExecutionRequest {
  profileId: string
  textbookId: string
  decision: LearningDecision
  /** IDs only: questions and mappings are always read from the profile repository. */
  questionIds: string[]
  /** Same discriminator used by Question Engine so both stores recover one session. */
  sessionScope?: string
}
export interface RuntimeSubmission extends RuntimeExecutionRequest {
  sessionId: string
  answers: Array<{ questionId: string; answer: QuestionAnswerDraft }>
}
export interface RuntimeExecutionResult {
  status: 'READY' | 'COMPLETED' | 'BLOCKED' | 'RETRY_REQUIRED'
  code: string
  session: QuestionSession | null
  appendedEvidence: LearningEvidence[]
  records: MasteryRecord[]
  trace: LearningAgentTrace
  analyses: Array<{ questionId: string; result: AnswerAnalysisResult }>
}
export interface RuntimeExecutionDependencies {
  source: LearningAgentSource
  questions: QuestionRepository
  sessions: QuestionSessionStorage
  mastery: MasteryRepository
  wrongBook: WrongBookRepository
  reviewQueue: ReviewQueueRepository
  history: LearningHistoryRepository
}
const defaults: RuntimeExecutionDependencies = {
  source: new RuntimeLearningAgentSource(),
  questions: questionRepository,
  sessions: questionSessionStorage,
  mastery: masteryRepository,
  wrongBook: wrongBookRepository,
  reviewQueue: reviewQueueRepository,
  history: learningHistoryRepository,
}

// Same-browser execution calls serialize across service instances. Server/multi-tab
// transactions require a transactional repository, not this local-storage boundary.
let pending: Promise<unknown> = Promise.resolve()
class ExecutionGuard extends Error {}
function requireValid(value: unknown, code: string): asserts value {
  if (!value) throw new ExecutionGuard(code)
}
/** Execution DTOs contain only plain records, arrays and primitive values.
 * Copy recursively so reactive proxies at any depth never reach structuredClone.
 * Keep the copy synchronous: queued work must not observe later UI edits.
 */
function snapshotRequest<T>(value: T, ancestors = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object') {
    requireValid(
      value === null ||
        value === undefined ||
        ['string', 'boolean'].includes(typeof value) ||
        (typeof value === 'number' && Number.isFinite(value)),
      'AGENT_EXECUTION_INPUT_INVALID',
    )
    return value
  }
  requireValid(!ancestors.has(value), 'AGENT_EXECUTION_INPUT_INVALID')
  requireValid(
    Array.isArray(value) ||
      Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null,
    'AGENT_EXECUTION_INPUT_INVALID',
  )
  ancestors.add(value)
  try {
    return (
      Array.isArray(value)
        ? value.map((item) => snapshotRequest(item, ancestors))
        : Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, snapshotRequest(item, ancestors)]),
          )
    ) as T
  } finally {
    ancestors.delete(value)
  }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`
  return JSON.stringify(value)
}
function reviewed(
  record: {
    isSample?: boolean
    needsVerification?: boolean
    verificationStatus?: string
    status?: string
  },
  status: string | readonly string[],
): boolean {
  return (
    !record.isSample &&
    !record.needsVerification &&
    record.verificationStatus === 'REVIEWED' &&
    (Array.isArray(status) ? status : [status]).includes(record.status ?? '')
  )
}

/** Local formal execution: no generation, map unlocks, daily-plan or profile mutation. */
export class RuntimeLearningAgentExecutionService {
  constructor(private readonly deps: RuntimeExecutionDependencies = defaults) {}

  open(
    request: RuntimeExecutionRequest,
    now = new Date().toISOString(),
  ): Promise<RuntimeExecutionResult> {
    return this.schedule(request, now)
  }
  submit(
    request: RuntimeSubmission,
    now = new Date().toISOString(),
  ): Promise<RuntimeExecutionResult> {
    return this.schedule(request, now, true)
  }
  private schedule(
    request: RuntimeExecutionRequest | RuntimeSubmission,
    now: string,
    submit = false,
  ) {
    let copy: typeof request
    try {
      copy = snapshotRequest(request)
    } catch {
      return Promise.resolve<RuntimeExecutionResult>({
        status: 'BLOCKED',
        code: 'AGENT_EXECUTION_INPUT_INVALID',
        session: null,
        appendedEvidence: [],
        records: [],
        analyses: [],
        trace: { traceId: `agent-execution:${now}`, events: [] },
      })
    }
    const run = pending.then(() => this.execute(copy, now, submit))
    pending = run.catch(() => undefined)
    return run
  }

  private async load(request: RuntimeExecutionRequest, now: string) {
    const { profileId, textbookId, decision, questionIds } = request
    requireValid(
      profileId && textbookId && Number.isFinite(Date.parse(now)),
      'AGENT_EXECUTION_INPUT_INVALID',
    )
    requireValid(
      questionIds.length > 0 &&
        questionIds.length <= 50 &&
        new Set(questionIds).size === questionIds.length,
      'AGENT_EXECUTION_QUESTIONS_INVALID',
    )
    const raw = await this.deps.source.load(profileId, textbookId)
    requireValid(raw.dataset === 'profile', 'AGENT_EXECUTION_PROFILE_REQUIRED')
    requireValid(
      [
        raw.curriculum.textbook,
        ...raw.curriculum.units,
        ...raw.curriculum.lessons,
        ...raw.curriculum.knowledgePoints,
        ...raw.curriculum.lessonKnowledgePoints,
        ...raw.curriculum.knowledgePrerequisites,
      ].every((r) => reviewed(r, ['ACTIVE', 'PUBLISHED'])),
      'AGENT_EXECUTION_CURRICULUM_NOT_ALLOWED',
    )
    const { context, snapshot } = buildAgentContext(
      raw,
      profileId,
      textbookId,
      now,
      DEFAULT_LEARNING_PLANNER_CONFIG,
    )
    requireValid(
      decision &&
        decision.decisionId &&
        decision.profileId === profileId &&
        decision.textbookId === textbookId &&
        ['NEXT', 'REINFORCE', 'REVIEW', 'REMEDIATE', 'CHALLENGE', 'SIMPLIFY', 'CONTINUE'].includes(
          decision.action,
        ) &&
        Number.isFinite(Date.parse(decision.createdAt)) &&
        decision.createdAt <= now &&
        decision.recommendedActivity.knowledgePointIds.includes(decision.targetKnowledgePointId) &&
        decision.recommendedActivity.knowledgePointIds.every((id) =>
          snapshot.curriculum.knowledgePoints.some((k) => k.id === id),
        ),
      'AGENT_EXECUTION_DECISION_MISMATCH',
    )
    const relation = snapshot.curriculum.lessonKnowledgePoints.find(
      (r) => r.knowledgePointId === decision.targetKnowledgePointId,
    )
    const lesson = snapshot.curriculum.lessons.find((l) => l.id === relation?.lessonId)
    requireValid(lesson && relation, 'AGENT_EXECUTION_TARGET_INVALID')
    const questions = await this.deps.questions.getQuestionsByIds(questionIds, 'profile')
    requireValid(
      questions.length === questionIds.length && questions.every((q, i) => q.id === questionIds[i]),
      'AGENT_EXECUTION_QUESTION_NOT_FOUND',
    )
    const mappings: QuestionKnowledgePoint[] = []
    for (const q of questions) {
      requireValid(
        reviewed(q, 'PUBLISHED') &&
          validateQuestion(q).valid &&
          q.textbookVersionId === textbookId &&
          (!q.subjectId || q.subjectId === context.curriculum.subjectId) &&
          (!q.gradeId || q.gradeId === context.curriculum.grade) &&
          (!q.semesterId || q.semesterId === context.curriculum.semester),
        'AGENT_EXECUTION_QUESTION_NOT_ALLOWED',
      )
      requireValid(
        isScorableQuestionType(q.questionType) && q.answerRule.ruleType !== 'MANUAL_REVIEW',
        'AGENT_EXECUTION_MANUAL_REVIEW_REQUIRED',
      )
      requireValid(
        context.curriculum.subject !== 'MATH' ||
          new DeterministicAnswerValidator().validate(q) !== 'INVALID',
        'AGENT_EXECUTION_QUESTION_INVALID',
      )
      const links = await this.deps.questions.getQuestionKnowledgePoints(q.id, 'profile')
      requireValid(
        links.length > 0 &&
          new Set(links.map((m) => m.knowledgePointId)).size === links.length &&
          links.some((m) => m.knowledgePointId === decision.targetKnowledgePointId) &&
          links.every(
            (m) =>
              m.questionId === q.id &&
              reviewed(m, 'ACTIVE') &&
              Number.isFinite(m.weight) &&
              m.weight > 0 &&
              m.weight <= 1 &&
              snapshot.curriculum.knowledgePoints.some((k) => k.id === m.knowledgePointId),
          ) &&
          Math.abs(links.reduce((n, m) => n + m.weight, 0) - 1) < 1e-8,
        'AGENT_EXECUTION_MAPPING_INVALID',
      )
      mappings.push(...links)
    }
    const session = createQuestionSession(
      {
        textbookId,
        unitId: lesson.unitId,
        lessonId: lesson.id,
        knowledgePointId: decision.targetKnowledgePointId,
        source: decision.action === 'REVIEW' ? 'wrong_book' : 'lesson_practice',
      },
      {
        id: `ASSESSMENT:${lesson.id}:${decision.targetKnowledgePointId}:PRACTICE`,
        knowledgePointId: decision.targetKnowledgePointId,
        questionIds,
        mode: 'practice',
      },
      profileId,
      request.sessionScope ?? decision.decisionId,
    )
    const reviewBindings: Record<string, string> = {}
    for (const reason of decision.reasons) {
      if (reason.evidenceType !== 'REVIEW_QUEUE' || !reason.evidenceRef) continue
      const item = this.deps.reviewQueue.get(profileId, reason.evidenceRef)
      this.checkStorage(this.deps.reviewQueue)
      requireValid(
        item &&
          item.profileId === profileId &&
          item.textbookId === textbookId &&
          item.knowledgePointId === decision.targetKnowledgePointId &&
          !item.provenance.isSampleDerived &&
          item.provenance.verificationStatus === 'REVIEWED',
        'AGENT_EXECUTION_REVIEW_MISMATCH',
      )
      reviewBindings[item.id] = canonical({
        evidenceId: item.evidenceId,
        sourceRecommendationId: item.sourceRecommendationId,
        evidenceCount: item.reason.evidenceCount,
      })
    }
    session.runtimeAgent = { binding: canonical({ decision, questions, mappings }), reviewBindings }
    return { session, questions, mappings, context, snapshot }
  }

  private checkStorage(repository: { getLastWarning(): string | null }) {
    requireValid(!repository.getLastWarning(), 'AGENT_EXECUTION_STORAGE_FAILED')
  }
  private persistSession(session: QuestionSession) {
    this.deps.sessions.save(session)
    this.checkStorage(this.deps.sessions)
    requireValid(
      canonical(this.deps.sessions.get(session.id)) === canonical(session),
      'AGENT_EXECUTION_STORAGE_FAILED',
    )
  }

  private async execute(
    request: RuntimeExecutionRequest | RuntimeSubmission,
    now: string,
    submit: boolean,
  ): Promise<RuntimeExecutionResult> {
    const result: RuntimeExecutionResult = {
      status: 'BLOCKED',
      code: '',
      session: null,
      appendedEvidence: [],
      records: [],
      analyses: [],
      trace: { traceId: `agent-execution:${now}`, events: [] },
    }
    const event = (name: string) =>
      result.trace.events.push({
        sequence: result.trace.events.length + 1,
        event: name,
        at: now,
        data: {},
      })
    let committed = false
    try {
      const loaded = await this.load(request, now)
      event('VALIDATED_RUNTIME_SCOPE')
      const existing = this.deps.sessions.get(loaded.session.id)
      this.checkStorage(this.deps.sessions)
      let session = existing ?? loaded.session
      if (existing && !existing.runtimeAgent) {
        requireValid(
          existing.status === 'not_started' && existing.attempts.length === 0,
          'AGENT_EXECUTION_SESSION_MISMATCH',
        )
        session = loaded.session
      }
      if (existing?.runtimeAgent) {
        requireValid(
          canonical({
            ...loaded.session,
            runtimeAgent: undefined,
            attempts: [],
            status: 'not_started',
            currentQuestionIndex: 0,
          }) ===
            canonical({
              ...existing,
              runtimeAgent: undefined,
              attempts: [],
              status: 'not_started',
              currentQuestionIndex: 0,
              startedAt: undefined,
              updatedAt: undefined,
              completedAt: undefined,
            }) && existing.runtimeAgent?.binding === loaded.session.runtimeAgent?.binding,
          'AGENT_EXECUTION_SESSION_MISMATCH',
        )
        requireValid(
          new Set(existing.attempts.map((a) => a.questionId)).size === existing.attempts.length &&
            existing.attempts.every((a) => existing.questionIds.includes(a.questionId)),
          'AGENT_EXECUTION_SESSION_MISMATCH',
        )
      }
      if (!submit) {
        if (!existing || !existing.runtimeAgent) {
          session.status = 'in_progress'
          session.startedAt = now
          session.updatedAt = now
          this.persistSession(session)
        }
        result.session = session
        result.status =
          session.status === 'completed'
            ? session.runtimeAgent?.projectedAt
              ? 'COMPLETED'
              : 'RETRY_REQUIRED'
            : 'READY'
        result.code = 'AGENT_EXECUTION_SESSION_READY'
        event('SESSION_READY')
        return result
      }
      const input = request as RuntimeSubmission
      requireValid(existing && input.sessionId === session.id, 'AGENT_EXECUTION_SESSION_MISMATCH')
      requireValid(
        input.answers.length > 0 &&
          new Set(input.answers.map((a) => a.questionId)).size === input.answers.length &&
          input.answers.every(
            (entry) =>
              loaded.questions.some((q) => q.id === entry.questionId) &&
              isQuestionAnswerComplete(
                loaded.questions.find((q) => q.id === entry.questionId)!,
                entry.answer,
              ),
          ),
        'AGENT_EXECUTION_ANSWERS_INCOMPLETE',
      )
      if (session.status === 'completed') {
        requireValid(
          session.attempts.length === session.questionIds.length &&
            session.completedAt &&
            session.attempts.every((a) => a.submitted && a.submittedAt),
          'AGENT_EXECUTION_SESSION_MISMATCH',
        )
        requireValid(
          input.answers.every((entry) => {
            const attempt = session.attempts.find((a) => a.questionId === entry.questionId)
            return attempt?.submitted && canonical(attempt.answer) === canonical(entry.answer)
          }),
          'AGENT_EXECUTION_ALREADY_SUBMITTED',
        )
      } else {
        for (const entry of input.answers) {
          const question = loaded.questions.find((q) => q.id === entry.questionId)!
          const existingAttempt = session.attempts.find((a) => a.questionId === question.id)
          if (existingAttempt?.submitted) {
            requireValid(
              canonical(existingAttempt.answer) === canonical(entry.answer),
              'AGENT_EXECUTION_ALREADY_SUBMITTED',
            )
            continue
          }
          requireValid(!existingAttempt, 'AGENT_EXECUTION_SESSION_MISMATCH')
          session.attempts.push({
            questionId: question.id,
            answer: entry.answer,
            submitted: true,
            submittedAt: now,
            ...(question.questionVersion ? { questionVersion: question.questionVersion } : {}),
          })
        }
        const complete = session.questionIds.every((id) =>
          session.attempts.some((a) => a.questionId === id && a.submitted),
        )
        session.status = complete ? 'completed' : 'in_progress'
        session.updatedAt = now
        if (complete) {
          session.completedAt = now
          session.currentQuestionIndex = session.questionIds.length - 1
        }
      }
      if (session.status === 'completed' && session.runtimeAgent?.projectedAt) {
        result.session = session
        result.status = 'COMPLETED'
        result.code = 'AGENT_EXECUTION_COMPLETED'
        result.records = [...new Set(loaded.mappings.map((m) => m.knowledgePointId))].flatMap(
          (id) => {
            const record = this.deps.mastery.getMasteryRecord(request.profileId, id)
            this.checkStorage(this.deps.mastery)
            return record ? [record] : []
          },
        )
        event('ALREADY_COMPLETED')
        return result
      }
      const evidence: LearningEvidence[] = []
      const analysisQuestions =
        session.status === 'completed'
          ? loaded.questions
          : loaded.questions.filter((q) => input.answers.some((a) => a.questionId === q.id))
      for (const q of analysisQuestions) {
        const attempt = session.attempts.find((a) => a.questionId === q.id)!
        const analysis = await new AnswerAnalyzer().analyze({
          question: q,
          expectedAnswer: q.answerRule,
          studentAnswer: attempt.answer,
          knowledgePoints: loaded.mappings.filter((m) => m.questionId === q.id),
          attemptContext: {
            profileId: request.profileId,
            session,
            subject: loaded.context.curriculum.subject,
            dataset: 'profile',
          },
        })
        requireValid(
          analysis.status !== 'manual_review_required' &&
            (session.status !== 'completed' ||
              analysis.evidence.length ===
                loaded.mappings.filter((m) => m.questionId === q.id).length),
          'AGENT_EXECUTION_ANALYSIS_BLOCKED',
        )
        result.analyses.push({ questionId: q.id, result: analysis })
        attempt.result = validateQuestionAnswer(q, attempt.answer)
        attempt.errorPatterns = analysis.errorPatterns
        evidence.push(...analysis.evidence)
      }
      if (session.status !== 'completed') {
        this.persistSession(session)
        committed = true
        this.deps.history.appendMany(
          projectQuestionSessionToHistory(request.profileId, session, {
            verificationStatus: 'REVIEWED',
            isSampleDerived: false,
          }).records,
        )
        this.checkStorage(this.deps.history)
        result.session = session
        result.status = 'READY'
        result.code = 'AGENT_EXECUTION_PARTIAL_SAVED'
        event('PARTIAL_SUBMISSION_SAVED')
        return result
      }
      // Persist the complete source fact first. Replays repair interrupted projections.
      this.persistSession(session)
      committed = true
      result.session = session
      event('SESSION_COMMITTED')
      const oldEvidence = this.deps.mastery.getEvidence(request.profileId)
      this.checkStorage(this.deps.mastery)
      for (const e of evidence) {
        const previous = oldEvidence.find((old) => old.id === e.id)
        requireValid(
          !previous || canonical(previous) === canonical(e),
          'AGENT_EXECUTION_EVIDENCE_CONFLICT',
        )
      }
      result.appendedEvidence = this.deps.mastery.appendEvidence(evidence)
      this.checkStorage(this.deps.mastery)
      const allEvidence = this.deps.mastery.getEvidence(request.profileId)
      this.checkStorage(this.deps.mastery)
      requireValid(
        evidence.every((e) => allEvidence.some((old) => canonical(old) === canonical(e))),
        'AGENT_EXECUTION_STORAGE_FAILED',
      )
      const storedSessions = this.deps.sessions.loadAll()
      this.checkStorage(this.deps.sessions)
      requireValid(
        evidence.every((e) => {
          const sourceSession = e.source.questionSessionId
            ? storedSessions.find((s) => s.id === e.source.questionSessionId)
            : undefined
          return (
            sourceSession?.id.startsWith(`question-session:${request.profileId}:`) &&
            sourceSession.textbookId === request.textbookId
          )
        }),
        'AGENT_EXECUTION_EVIDENCE_SCOPE_MISMATCH',
      )
      result.records = [...new Set(evidence.map((e) => e.knowledgePointId))].map(
        (knowledgePointId) => {
          const previous = this.deps.mastery.getMasteryRecord(request.profileId, knowledgePointId)
          this.checkStorage(this.deps.mastery)
          const items = allEvidence.filter((e) => e.knowledgePointId === knowledgePointId)
          requireValid(
            items.every((e) => {
              const sourceSession = e.source.questionSessionId
                ? storedSessions.find((s) => s.id === e.source.questionSessionId)
                : undefined
              return (
                !e.metadata?.isSample &&
                e.metadata?.sourceVerificationStatus === 'REVIEWED' &&
                sourceSession?.id.startsWith(`question-session:${request.profileId}:`) &&
                sourceSession.textbookId === request.textbookId
              )
            }),
            'AGENT_EXECUTION_EVIDENCE_NOT_ALLOWED',
          )
          const next = buildMasteryRecord({
            studentProfileId: request.profileId,
            knowledgePointId,
            evidence: items,
            previousRecord: previous ?? undefined,
            updatedAt: session.completedAt,
          })
          return previous &&
            canonical({ ...previous, version: 0, updatedAt: '' }) ===
              canonical({ ...next, version: 0, updatedAt: '' })
            ? previous
            : next
        },
      )
      this.deps.mastery.saveMasteryRecords(result.records)
      this.checkStorage(this.deps.mastery)
      event('MASTERY_PROJECTED')
      const wrongProjection = new WrongBookProjectionService(
        this.deps.wrongBook,
      ).projectQuestionSession(request.profileId, session, {
        dataset: 'profile',
        isSampleDerived: false,
        verificationStatus: 'REVIEWED',
        textbookId: session.textbookId,
        unitId: session.unitId,
        lessonId: session.lessonId,
        supportedQuestionIds: new Set(session.questionIds),
        questionKnowledgePoints: new Map(
          loaded.questions.map((q) => [
            q.id,
            loaded.mappings.filter((m) => m.questionId === q.id).map((m) => m.knowledgePointId),
          ]),
        ),
      })
      this.checkStorage(this.deps.wrongBook)
      requireValid(!wrongProjection.diagnostics.length, 'AGENT_EXECUTION_STORAGE_FAILED')
      this.deps.history.appendMany(
        projectQuestionSessionToHistory(request.profileId, session, {
          verificationStatus: 'REVIEWED',
          isSampleDerived: false,
        }).records,
      )
      this.checkStorage(this.deps.history)
      // Recompute strategy from the newly committed facts using the existing strategy engine.
      const updated = {
        ...loaded.snapshot,
        evidence: allEvidence,
        masteryRecords: this.deps.mastery.getMasteryRecords(request.profileId),
        sessions: [...loaded.snapshot.sessions.filter((s) => s.id !== session.id), session],
      }
      const { context } = buildAgentContext(
        updated,
        request.profileId,
        request.textbookId,
        now,
        DEFAULT_LEARNING_PLANNER_CONFIG,
      )
      const eligibleReviews = Object.entries(session.runtimeAgent!.reviewBindings)
        .filter(
          ([id, binding]) =>
            loaded.session.runtimeAgent!.reviewBindings[id] === binding ||
            this.deps.reviewQueue.get(request.profileId, id)?.evidenceId === evidence.at(-1)?.id,
        )
        .map(([id]) => id)
      const queueProjection = new ReviewQueueProjectionService(
        this.deps.reviewQueue,
      ).projectStrategy(context.strategyRecommendations, {
        profileId: request.profileId,
        textbookId: request.textbookId,
        dataset: 'profile',
        verificationStatus: 'REVIEWED',
        evidenceId: evidence.at(-1)?.id,
      })
      this.checkStorage(this.deps.reviewQueue)
      requireValid(!queueProjection.diagnostics.length, 'AGENT_EXECUTION_REVIEW_PROJECTION_BLOCKED')
      if (
        request.decision.action === 'REVIEW' &&
        session.attempts.every((a) => a.result?.status === 'correct')
      ) {
        for (const id of eligibleReviews) {
          // Only finish the queue generation that was launched, never a newer review.
          const item = this.deps.reviewQueue.get(request.profileId, id)
          if (item?.status === 'active') {
            this.deps.reviewQueue.complete(request.profileId, id, session.completedAt!)
            this.checkStorage(this.deps.reviewQueue)
          }
        }
      }
      session.runtimeAgent!.projectedAt = now
      this.persistSession(session)
      event('PROJECTIONS_COMPLETED')
      result.status = 'COMPLETED'
      result.code = 'AGENT_EXECUTION_COMPLETED'
    } catch (error) {
      result.status = committed ? 'RETRY_REQUIRED' : 'BLOCKED'
      result.code =
        error instanceof ExecutionGuard ? error.message : 'AGENT_EXECUTION_DEPENDENCY_FAILED'
      event(result.status)
    }
    return result
  }
}
export const runtimeLearningAgentExecutionService = new RuntimeLearningAgentExecutionService()
