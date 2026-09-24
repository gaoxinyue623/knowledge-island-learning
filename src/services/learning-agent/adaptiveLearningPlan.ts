import type { QuestionAnswerDraft } from '@/types'
import type {
  AnswerAnalysisResult,
  LearningAgentResult,
  LearningAgentSnapshot,
} from '@/types/learning-agent'
import type { QuestionGeneratorMode } from '@/types/llm'
import { LearningAgentSimulation } from './simulationService'
import { buildAdaptivePlanReport } from './adaptivePlanReport'
import { validateQuestion } from '@/services/validation/questionValidation'
import { DeterministicAnswerValidator } from './deterministicAnswerValidator'
import { scopeAgentSnapshot } from './contextBuilder'

export type AdaptivePlanStatus =
  'IDLE' | 'PREPARING' | 'READY' | 'SUBMITTING' | 'REVIEW' | 'COMPLETE' | 'BLOCKED'
export interface CompletedLearningTask {
  task: LearningAgentResult
  analyses: AnswerAnalysisResult[]
  answers: Array<{ questionId: string; answer: QuestionAnswerDraft }>
  completedAt: string
}

export interface AdaptivePlanCheckpoint {
  schemaVersion: 1
  taskLimit: number
  mode: QuestionGeneratorMode
  seed: string
  startedAt: string
  status: Exclude<AdaptivePlanStatus, 'IDLE' | 'PREPARING' | 'SUBMITTING'>
  current: LearningAgentResult | null
  completed: CompletedLearningTask[]
  error: string | null
  baseline: LearningAgentSnapshot
  snapshot: LearningAgentSnapshot
}

/** A bounded, in-memory practice plan; not a second persisted DailyLearningPlan. */
export class AdaptiveLearningPlan {
  status: AdaptivePlanStatus = 'IDLE'
  current: LearningAgentResult | null = null
  completed: CompletedLearningTask[] = []
  error: string | null = null
  private readonly simulation: LearningAgentSimulation
  private readonly startedAt: number
  private baseline: LearningAgentSnapshot

  constructor(
    snapshot: LearningAgentSnapshot,
    readonly taskLimit = 3,
    private readonly mode: QuestionGeneratorMode = 'REAL_LLM',
    private readonly seed = 'adaptive-plan',
    now = new Date().toISOString(),
  ) {
    if (
      !Number.isInteger(taskLimit) ||
      taskLimit < 1 ||
      taskLimit > 5 ||
      !Number.isFinite(Date.parse(now))
    )
      throw new Error('AGENT_PLAN_OPTIONS_INVALID')
    this.startedAt = Date.parse(now)
    this.simulation = new LearningAgentSimulation(snapshot)
    this.baseline = structuredClone(this.simulation.snapshot)
  }

  get busy() {
    return this.status === 'PREPARING' || this.status === 'SUBMITTING'
  }

  get report() {
    return buildAdaptivePlanReport(
      this.baseline,
      this.simulation.snapshot,
      this.completed,
      this.taskLimit,
    )
  }

  checkpoint(): AdaptivePlanCheckpoint {
    if (this.busy || !['READY', 'REVIEW', 'COMPLETE', 'BLOCKED'].includes(this.status))
      throw new Error('AGENT_PLAN_CHECKPOINT_BUSY')
    return structuredClone({
      schemaVersion: 1 as const,
      taskLimit: this.taskLimit,
      mode: this.mode,
      seed: this.seed,
      startedAt: new Date(this.startedAt).toISOString(),
      status: this.status as AdaptivePlanCheckpoint['status'],
      current: this.current,
      completed: this.completed,
      error: this.error,
      baseline: this.baseline,
      snapshot: this.simulation.snapshot,
    })
  }

  static restore(checkpoint: AdaptivePlanCheckpoint): AdaptiveLearningPlan {
    try {
      return AdaptiveLearningPlan.restoreValidated(checkpoint)
    } catch {
      throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
    }
  }

  private static restoreValidated(checkpoint: AdaptivePlanCheckpoint): AdaptiveLearningPlan {
    if (
      checkpoint.schemaVersion !== 1 ||
      !Number.isInteger(checkpoint.taskLimit) ||
      checkpoint.taskLimit < 1 ||
      checkpoint.taskLimit > 5 ||
      !['MOCK', 'REAL_LLM'].includes(checkpoint.mode) ||
      !Number.isFinite(Date.parse(checkpoint.startedAt)) ||
      !['READY', 'REVIEW', 'COMPLETE', 'BLOCKED'].includes(checkpoint.status) ||
      checkpoint.baseline.dataset !== 'demo' ||
      checkpoint.snapshot.dataset !== 'demo'
    )
      throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
    const { snapshot, baseline, completed, status, current, taskLimit } = checkpoint
    if (
      typeof checkpoint.seed !== 'string' ||
      !checkpoint.seed.length ||
      !Array.isArray(completed) ||
      completed.length > taskLimit ||
      baseline.profile.studentId !== snapshot.profile.studentId ||
      baseline.curriculum.textbook.id !== snapshot.curriculum.textbook.id ||
      (status === 'COMPLETE') !== (completed.length === taskLimit) ||
      (status === 'REVIEW' && !completed.length) ||
      (status === 'READY' ? !current : current !== null)
    )
      throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
    // Ensure the stored snapshots remain readable by the existing projection layer.
    scopeAgentSnapshot(baseline)
    scopeAgentSnapshot(snapshot)
    if (
      snapshot.curriculum.knowledgePoints.some(
        (p) => typeof p.id !== 'string' || typeof p.name !== 'string',
      )
    )
      throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
    const tasks = [...completed.map((row) => row.task), ...(current ? [current] : [])]
    const seen = new Set<string>()
    for (const task of tasks) {
      const questions = task.generatedResources.questions
      if (
        task.status !== 'READY' ||
        task.validation.status !== 'VALID' ||
        !task.decision ||
        !task.context ||
        task.context.dataset !== 'demo' ||
        task.context.profileId !== snapshot.profile.studentId ||
        task.decision.profileId !== snapshot.profile.studentId ||
        task.decision.textbookId !== snapshot.curriculum.textbook.id ||
        !Array.isArray(task.decision.reasons) ||
        questions.length !== task.activityPlan?.estimatedQuestionCount ||
        !questions.length ||
        questions.length > 25 ||
        (checkpoint.mode === 'REAL_LLM' &&
          (task.questionGeneration?.mode !== 'REAL_LLM' ||
            task.questionGeneration.fallbackUsed ||
            questions.some((q) => task.questionGeneration?.origins?.[q.id] !== 'REAL_LLM')))
      )
        throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
      for (const question of questions) {
        if (
          seen.has(question.id) ||
          !validateQuestion(question).valid ||
          question.questionType !== 'calculation' ||
          question.textbookVersionId !== snapshot.curriculum.textbook.id ||
          new DeterministicAnswerValidator().validate(question) !== 'VALID'
        )
          throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
        seen.add(question.id)
      }
    }
    for (const row of completed) {
      if (
        !Number.isFinite(Date.parse(row.completedAt)) ||
        row.analyses.length !== row.task.generatedResources.questions.length ||
        row.answers.length !== row.analyses.length ||
        row.analyses.some((a) => !['correct', 'incorrect'].includes(a.status))
      )
        throw new Error('AGENT_PLAN_CHECKPOINT_INVALID')
    }
    const plan = new AdaptiveLearningPlan(
      checkpoint.snapshot,
      checkpoint.taskLimit,
      checkpoint.mode,
      checkpoint.seed,
      checkpoint.startedAt,
    )
    plan.baseline = structuredClone(checkpoint.baseline)
    plan.current = structuredClone(checkpoint.current)
    plan.completed = structuredClone(checkpoint.completed)
    plan.status = checkpoint.status
    plan.error = checkpoint.status === 'BLOCKED' ? '任务尚未准备完成，可以重试。' : null
    // Read the report now so malformed stored feedback fails before rendering.
    if (completed.length) void plan.report
    return plan
  }

  createFollowUp(): AdaptiveLearningPlan {
    if (this.status !== 'COMPLETE') throw new Error('AGENT_PLAN_NOT_COMPLETE')
    return new AdaptiveLearningPlan(
      this.simulation.snapshot,
      this.taskLimit,
      this.mode,
      `${this.seed}-follow-up`,
      this.completed.at(-1)!.completedAt,
    )
  }

  async next(): Promise<void> {
    if (!['IDLE', 'REVIEW', 'BLOCKED'].includes(this.status)) return
    if (this.completed.length >= this.taskLimit) {
      this.status = 'COMPLETE'
      return
    }
    this.status = 'PREPARING'
    this.error = null
    this.current = null
    try {
      const task = await this.simulation.run(
        new Date(this.startedAt + this.completed.length * 60000).toISOString(),
        `${this.seed}-${this.completed.length}`,
        this.mode,
      )
      // This executor has a numeric entry UI. Other task surfaces remain blocked.
      if (
        task.status !== 'READY' ||
        task.validation.status !== 'VALID' ||
        !task.generatedResources.questions.length ||
        task.generatedResources.questions.some((q) => q.questionType !== 'calculation')
      ) {
        this.status = 'BLOCKED'
        this.error = '本次任务未通过校验，尚未开始。可以重试或重新选择学习情境。'
        return
      }
      this.current = task
      this.status = 'READY'
    } catch {
      this.status = 'BLOCKED'
      this.error = '任务准备失败，请重试。'
    }
  }

  async submit(answers: CompletedLearningTask['answers']): Promise<void> {
    if (this.status !== 'READY' || !this.current) return
    this.status = 'SUBMITTING'
    this.error = null
    const task = this.current
    const completedAt = new Date(this.startedAt + (this.completed.length + 1) * 60000).toISOString()
    try {
      const submitted = structuredClone(answers)
      const analyses = await this.simulation.submitAnswers(task, submitted, completedAt)
      this.completed.push({ task, analyses, answers: submitted, completedAt })
      this.current = null
      this.status = this.completed.length >= this.taskLimit ? 'COMPLETE' : 'REVIEW'
    } catch {
      this.status = 'READY'
      this.error = '提交未完成，请检查每道题的答案后重试。'
    }
  }
}
