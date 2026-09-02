import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  correctAnswerDraft,
  isQuestionAnswerComplete,
  validateQuestionAnswer,
  questionEngineAdapter,
  createQuestionSession,
  type QuestionEngineAdapter,
} from '@/services/question-engine'
import type { QuestionEngineAssessment } from '@/services/question-engine/questionEngineAdapter'
import {
  normalizeQuestionSession,
  questionSessionStorage,
  type QuestionSessionStorage,
} from '@/services/question-engine/questionSessionStorage'
import type {
  AssessmentDefinition,
  AssessmentLaunchContext,
  Id,
  Question,
  QuestionAnswerDraft,
  QuestionAttempt,
  QuestionEngineDataset,
  QuestionEngineLoadOptions,
  QuestionEngineStatus,
  QuestionEngineViewModel,
  QuestionSession,
} from '@/types'

export interface QuestionEngineStoreDependencies {
  adapter: QuestionEngineAdapter
  sessionStorage: QuestionSessionStorage
}

const defaultDependencies: QuestionEngineStoreDependencies = {
  adapter: questionEngineAdapter,
  sessionStorage: questionSessionStorage,
}

let dependencies: QuestionEngineStoreDependencies = defaultDependencies

/** Test/dev seam; production uses the default repository and storage boundary. */
export function configureQuestionEngineStore(
  overrides: Partial<QuestionEngineStoreDependencies>,
): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetQuestionEngineStoreDependencies(): void {
  dependencies = defaultDependencies
}

function statusForIssue(issue: string | undefined): QuestionEngineStatus {
  if (issue === 'QUESTION_EMPTY') return 'empty'
  if (issue === 'QUESTION_NOT_AVAILABLE' || issue === 'NOT_AVAILABLE') return 'not_available'
  if (issue === 'INVALID_CONTEXT') return 'invalid_context'
  if (issue === 'UNSUPPORTED_QUESTION') return 'unsupported_question'
  return 'error'
}

function readableLoadError(caught: unknown): string {
  if (!(caught instanceof Error)) return '练习暂时无法加载，请重新试一次。'
  if (caught.message.startsWith('SAMPLE_') || caught.message.endsWith('_ERROR')) {
    return '练习暂时无法加载，请重新试一次。'
  }
  return caught.message || '练习暂时无法加载，请重新试一次。'
}

function upsertAttempt(session: QuestionSession, nextAttempt: QuestionAttempt): QuestionSession {
  const attempts = session.attempts.filter(
    (attempt) => attempt.questionId !== nextAttempt.questionId,
  )
  attempts.push(nextAttempt)
  return { ...session, attempts }
}

function buildShowcaseSession(
  session: QuestionSession,
  questions: readonly Question[],
  mode: 'resume' | 'completed',
): QuestionSession {
  const count = mode === 'completed' ? questions.length : Math.min(2, questions.length)
  const attempts = questions.slice(0, count).map((question) => ({
    questionId: question.id,
    answer: correctAnswerDraft(question),
    submitted: true,
    result: validateQuestionAnswer(question, correctAnswerDraft(question)),
    submittedAt: new Date().toISOString(),
    ...(question.questionVersion !== undefined
      ? { questionVersion: question.questionVersion }
      : {}),
  }))
  const now = new Date().toISOString()
  return {
    ...session,
    status: mode === 'completed' ? 'completed' : 'in_progress',
    currentQuestionIndex: mode === 'completed' ? Math.max(0, questions.length - 1) : count,
    attempts,
    startedAt: session.startedAt ?? now,
    updatedAt: now,
    ...(mode === 'completed' ? { completedAt: session.completedAt ?? now } : {}),
  }
}

export const useQuestionEngineStore = defineStore('questionEngine', () => {
  const context = ref<AssessmentLaunchContext | null>(null)
  const assessment = ref<QuestionEngineAssessment | null>(null)
  const definition = ref<AssessmentDefinition | null>(null)
  const questions = ref<Question[]>([])
  const session = ref<QuestionSession | null>(null)
  const viewModel = ref<QuestionEngineViewModel | null>(null)
  const status = ref<QuestionEngineStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)
  const dataset = ref<QuestionEngineDataset>('profile')
  const studentId = ref<Id>('local-profile')

  const currentQuestion = computed(() => viewModel.value?.currentQuestion ?? null)
  const currentQuestionIndex = computed(() => viewModel.value?.session.currentQuestionIndex ?? 0)
  const totalQuestions = computed(() => viewModel.value?.session.totalQuestions ?? 0)
  const currentQuestionEntity = computed(() => {
    const questionId = definition.value?.questionIds[currentQuestionIndex.value]
    return questionId
      ? (questions.value.find((question) => question.id === questionId) ?? null)
      : null
  })
  const currentAttempt = computed(() => {
    const current = currentQuestion.value
    return current && session.value
      ? (session.value.attempts.find((attempt) => attempt.questionId === current.id) ?? null)
      : null
  })
  const currentDraft = computed(() => currentQuestion.value?.answerDraft ?? null)
  const isCurrentSubmitted = computed(() => currentQuestion.value?.submitted === true)
  const canSubmit = computed(
    () =>
      Boolean(currentQuestion.value && currentDraft.value) &&
      !isCurrentSubmitted.value &&
      Boolean(
        currentQuestionEntity.value &&
        currentDraft.value &&
        isQuestionAnswerComplete(currentQuestionEntity.value, currentDraft.value),
      ),
  )
  const canGoPrevious = computed(() => currentQuestionIndex.value > 0)
  const canGoNext = computed(
    () => isCurrentSubmitted.value && currentQuestionIndex.value < totalQuestions.value - 1,
  )
  const canComplete = computed(
    () =>
      Boolean(definition.value && session.value) &&
      Boolean(
        definition.value?.questionIds.every((questionId) =>
          session.value?.attempts.some(
            (attempt) => attempt.questionId === questionId && attempt.submitted,
          ),
        ),
      ),
  )
  const resultSummary = computed(() => viewModel.value?.resultSummary)

  function persistSession(nextSession: QuestionSession): void {
    dependencies.sessionStorage.save(nextSession)
    warning.value = dependencies.sessionStorage.getLastWarning()
  }

  async function rebuildViewModel(): Promise<void> {
    if (!assessment.value || !session.value) return
    viewModel.value = await dependencies.adapter.buildViewModel(
      assessment.value,
      session.value,
      status.value,
    )
  }

  async function updateSession(nextSession: QuestionSession): Promise<void> {
    session.value = nextSession
    persistSession(nextSession)
    await rebuildViewModel()
  }

  async function loadAssessment(
    launchContext: AssessmentLaunchContext,
    options: QuestionEngineLoadOptions = {},
  ): Promise<QuestionEngineViewModel | null> {
    context.value = launchContext
    dataset.value = options.dataset ?? 'profile'
    studentId.value = options.studentId ?? 'local-profile'
    assessment.value = null
    definition.value = null
    questions.value = []
    session.value = null
    viewModel.value = null
    status.value = 'loading'
    loading.value = true
    error.value = null
    warning.value = null
    try {
      const result = await dependencies.adapter.loadAssessment(launchContext, {
        ...options,
        dataset: dataset.value,
      })
      if (!result.definition) {
        status.value = statusForIssue(result.issue)
        error.value = result.message ?? null
        return null
      }
      if (!result.questions.length) {
        status.value = 'empty'
        return null
      }
      assessment.value = {
        context: launchContext,
        definition: result.definition,
        questions: result.questions,
        flags: result.flags ?? { isSample: false, isUnverified: false, isDemo: false },
        diagnostics: result.diagnostics ?? [],
      }
      definition.value = result.definition
      questions.value = result.questions
      const freshSession = createQuestionSession(launchContext, result.definition, studentId.value)
      const persisted = dependencies.sessionStorage.get(freshSession.id)
      let nextSession = normalizeQuestionSession(
        persisted ?? freshSession,
        result.definition.questionIds,
      )
      if (
        dataset.value === 'demo' &&
        options.demoState === 'resume' &&
        nextSession.status === 'not_started'
      ) {
        nextSession = buildShowcaseSession(nextSession, result.questions, 'resume')
      }
      if (dataset.value === 'demo' && options.demoState === 'completed') {
        nextSession = buildShowcaseSession(nextSession, result.questions, 'completed')
      }
      if (!persisted || JSON.stringify(persisted) !== JSON.stringify(nextSession)) {
        persistSession(nextSession)
      }
      session.value = nextSession
      status.value = nextSession.status === 'completed' ? 'completed' : 'ready'
      await rebuildViewModel()
      warning.value = dependencies.sessionStorage.getLastWarning()
      return viewModel.value
    } catch (caught) {
      status.value = 'error'
      error.value = readableLoadError(caught)
      return null
    } finally {
      loading.value = false
    }
  }

  async function startSession(): Promise<boolean> {
    const active = session.value
    if (!active || status.value === 'completed' || status.value === 'error') return false
    if (active.status === 'in_progress') return true
    const now = new Date().toISOString()
    await updateSession({
      ...active,
      status: 'in_progress',
      startedAt: active.startedAt ?? now,
      updatedAt: now,
    })
    status.value = 'ready'
    return true
  }

  async function resumeSession(): Promise<boolean> {
    if (!session.value) return false
    if (session.value.status === 'not_started') return startSession()
    await rebuildViewModel()
    return true
  }

  async function setAnswerDraft(draft: QuestionAnswerDraft): Promise<boolean> {
    const active = session.value
    const current = currentQuestion.value
    const currentEntity = currentQuestionEntity.value
    if (
      !active ||
      !current ||
      !currentEntity ||
      current.submitted ||
      draft.type !== currentEntity.questionType
    ) {
      return false
    }
    if (!(await startSession())) return false
    const latest = session.value
    if (!latest) return false
    const attempt: QuestionAttempt = {
      questionId: current.id,
      answer: draft,
      submitted: false,
      ...(current.questionVersion !== undefined
        ? { questionVersion: current.questionVersion }
        : {}),
    }
    const nextSession = upsertAttempt(latest, attempt)
    await updateSession({ ...nextSession, updatedAt: new Date().toISOString() })
    return true
  }

  async function submitAnswer(): Promise<boolean> {
    const active = session.value
    const current = currentQuestion.value
    const currentEntity = currentQuestionEntity.value
    const draft = currentDraft.value
    if (!active || !current || !currentEntity || !draft || current.submitted) return false
    if (!isQuestionAnswerComplete(currentEntity, draft)) return false
    if (!(await startSession())) return false
    const latest = session.value
    if (!latest) return false
    const result = validateQuestionAnswer(currentEntity, draft)
    const attempt: QuestionAttempt = {
      questionId: current.id,
      answer: draft,
      submitted: true,
      result,
      submittedAt: new Date().toISOString(),
      ...(current.questionVersion !== undefined
        ? { questionVersion: current.questionVersion }
        : {}),
    }
    const nextSession = upsertAttempt(latest, attempt)
    await updateSession({ ...nextSession, updatedAt: new Date().toISOString() })
    return true
  }

  async function goNext(): Promise<boolean> {
    if (!canGoNext.value || !session.value) return false
    const nextIndex = currentQuestionIndex.value + 1
    await updateSession({
      ...session.value,
      currentQuestionIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    })
    return true
  }

  async function goPrevious(): Promise<boolean> {
    if (!canGoPrevious.value || !session.value) return false
    const targetIndex = currentQuestionIndex.value - 1
    const targetQuestionId = definition.value?.questionIds[targetIndex]
    if (!targetQuestionId) return false
    const targetAttempt = session.value.attempts.find(
      (attempt) => attempt.questionId === targetQuestionId,
    )
    if (!targetAttempt?.submitted) return false
    await updateSession({
      ...session.value,
      currentQuestionIndex: targetIndex,
      updatedAt: new Date().toISOString(),
    })
    return true
  }

  async function goToQuestion(index: number): Promise<boolean> {
    if (!Number.isInteger(index) || !session.value || !definition.value) return false
    if (index < 0 || index >= definition.value.questionIds.length) return false
    if (index !== currentQuestionIndex.value) {
      const questionId = definition.value.questionIds[index]
      const attempt = session.value.attempts.find(
        (candidate) => candidate.questionId === questionId,
      )
      if (!attempt?.submitted) return false
    }
    await updateSession({
      ...session.value,
      currentQuestionIndex: index,
      updatedAt: new Date().toISOString(),
    })
    return true
  }

  async function completeAssessment(): Promise<boolean> {
    if (!canComplete.value || !session.value || status.value === 'completed') return false
    const now = new Date().toISOString()
    await updateSession({
      ...session.value,
      status: 'completed',
      currentQuestionIndex: Math.max(0, (definition.value?.questionIds.length ?? 1) - 1),
      updatedAt: now,
      completedAt: now,
    })
    status.value = 'completed'
    await rebuildViewModel()
    return true
  }

  async function resetDemoAssessment(): Promise<boolean> {
    if (dataset.value !== 'demo' || !context.value || !definition.value) return false
    const fresh = createQuestionSession(context.value, definition.value, studentId.value)
    dependencies.sessionStorage.remove(fresh.id)
    warning.value = dependencies.sessionStorage.getLastWarning()
    session.value = fresh
    status.value = 'ready'
    error.value = null
    await rebuildViewModel()
    return true
  }

  function clearStoredSessions(): void {
    dependencies.sessionStorage.clear()
    warning.value = dependencies.sessionStorage.getLastWarning()
  }

  return {
    context,
    assessment,
    definition,
    questions,
    session,
    viewModel,
    currentQuestion,
    currentQuestionIndex,
    currentAttempt,
    currentDraft,
    totalQuestions,
    isCurrentSubmitted,
    canSubmit,
    canGoPrevious,
    canGoNext,
    canComplete,
    resultSummary,
    status,
    loading,
    error,
    warning,
    dataset,
    loadAssessment,
    startSession,
    resumeSession,
    setAnswerDraft,
    submitAnswer,
    goNext,
    goPrevious,
    goToQuestion,
    completeAssessment,
    resetDemoAssessment,
    clearStoredSessions,
  }
})
