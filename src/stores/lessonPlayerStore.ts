import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  buildLessonPlayerViewModel,
  createLessonSession,
  validateLessonLaunchContext,
  lessonPlayerRepository,
} from '@/services/lesson-player'
import {
  lessonSessionStorage,
  normalizeLessonSession,
  type LessonSessionStorage,
} from '@/services/lesson-player/lessonSessionStorage'
import {
  learningMapCompletionService,
  type LearningMapCompletionService,
} from '@/services/learning-map'
import {
  learningHistoryService,
  type LearningHistoryServiceContract,
} from '@/services/learning-history'
import { rewardService, type RewardServiceContract } from '@/services/reward'
import type {
  Id,
  LessonLaunchContext,
  LessonPlayerDataset,
  LessonPlayerLoadOptions,
  LessonPlayerRepository,
  LessonPlayerStatus,
  LessonPlayerViewModel,
  LessonSession,
  RewardEvent,
} from '@/types'

export interface LessonPlayerStoreDependencies {
  repository: LessonPlayerRepository
  sessionStorage: LessonSessionStorage
  mapCompletionService: LearningMapCompletionService
  historyService: LearningHistoryServiceContract
  rewardService: RewardServiceContract
}

const defaultDependencies: LessonPlayerStoreDependencies = {
  repository: lessonPlayerRepository,
  sessionStorage: lessonSessionStorage,
  mapCompletionService: learningMapCompletionService,
  historyService: learningHistoryService,
  rewardService,
}

let dependencies: LessonPlayerStoreDependencies = defaultDependencies

/** Test/dev seam; the application uses the default production boundary. */
export function configureLessonPlayerStore(
  overrides: Partial<LessonPlayerStoreDependencies>,
): void {
  dependencies = { ...defaultDependencies, ...overrides }
}

export function resetLessonPlayerStoreDependencies(): void {
  dependencies = defaultDependencies
}

function statusForIssue(issue: string | undefined): LessonPlayerStatus {
  if (issue === 'CONTENT_EMPTY') return 'empty'
  if (issue === 'NOT_AVAILABLE' || issue === 'CONTENT_NOT_AVAILABLE') return 'not_available'
  return 'error'
}

function readableLoadError(caught: unknown): string {
  if (!(caught instanceof Error)) return '学习内容暂时无法加载，请重新试一次。'
  if (caught.message.startsWith('SAMPLE_') || caught.message.endsWith('_ERROR')) {
    return '学习内容暂时无法加载，请重新试一次。'
  }
  return caught.message || '学习内容暂时无法加载，请重新试一次。'
}

export const useLessonPlayerStore = defineStore('lessonPlayer', () => {
  const context = ref<LessonLaunchContext | null>(null)
  const viewModel = ref<LessonPlayerViewModel | null>(null)
  const session = ref<LessonSession | null>(null)
  const currentStepIndex = ref(0)
  const status = ref<LessonPlayerStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dataset = ref<LessonPlayerDataset>('profile')
  const studentId = ref<Id>('local-profile')
  const warning = ref<string | null>(null)
  const lastRewardEvent = ref<RewardEvent | null>(null)

  const currentStep = computed(() => viewModel.value?.steps[currentStepIndex.value])
  const totalSteps = computed(() => viewModel.value?.steps.length ?? 0)
  const isLastStep = computed(
    () => totalSteps.value > 0 && currentStepIndex.value === totalSteps.value - 1,
  )
  const canGoPrevious = computed(() => currentStepIndex.value > 0 && totalSteps.value > 0)
  const canGoNext = computed(() => totalSteps.value > 0 && status.value !== 'completed')

  function persistSession(nextSession: LessonSession): void {
    dependencies.sessionStorage.save(nextSession)
    warning.value = dependencies.sessionStorage.getLastWarning()
  }

  /**
   * The store holds the current source privately so the page consumes one
   * ready ViewModel rather than assembling several repositories itself.
   */
  const source = ref<import('@/types').LessonPlayerSource | null>(null)

  function historyOptions() {
    const verificationStatus =
      source.value?.verificationStatus ?? source.value?.contentVerificationStatus
    return {
      isSampleDerived: dataset.value === 'demo' || source.value?.isSample === true,
      ...(verificationStatus ? { verificationStatus } : {}),
    }
  }

  function projectHistory(nextSession: LessonSession): void {
    try {
      dependencies.historyService.recordLessonSession(
        studentId.value,
        nextSession,
        historyOptions(),
      )
      warning.value =
        dependencies.sessionStorage.getLastWarning() ?? dependencies.historyService.getLastWarning()
    } catch {
      warning.value = '学习记录暂时未能保存，本次学习仍可继续。'
    }
  }

  function projectReward(nextSession: LessonSession): void {
    if (nextSession.status !== 'completed') return
    try {
      const result = dependencies.rewardService.processLearningFact(
        studentId.value,
        { type: 'lesson_completed', session: nextSession },
        { dataset: dataset.value, ...historyOptions() },
      )
      lastRewardEvent.value = result.event
      warning.value =
        dependencies.sessionStorage.getLastWarning() ??
        dependencies.rewardService.getLastWarning() ??
        dependencies.historyService.getLastWarning()
    } catch {
      warning.value = '成长反馈暂时未能保存，本次学习仍可继续。'
    }
  }

  function rebuildViewModel(): void {
    if (!source.value || !session.value) return
    viewModel.value = buildLessonPlayerViewModel(source.value, session.value, {
      status: status.value === 'completed' ? 'completed' : 'ready',
    })
    currentStepIndex.value = viewModel.value.currentStepIndex
  }

  function updateSession(next: LessonSession): void {
    session.value = next
    persistSession(next)
    rebuildViewModel()
  }

  async function loadLesson(
    launchContext: LessonLaunchContext,
    options: LessonPlayerLoadOptions = {},
  ): Promise<LessonPlayerViewModel | null> {
    context.value = launchContext
    dataset.value = options.dataset ?? 'profile'
    studentId.value = options.studentId ?? 'local-profile'
    viewModel.value = null
    source.value = null
    session.value = null
    currentStepIndex.value = 0
    status.value = 'loading'
    loading.value = true
    error.value = null
    warning.value = null
    try {
      const result = await dependencies.repository.getLessonPlayerSource(
        launchContext,
        dataset.value,
        { demoState: options.demoState },
      )
      if (!result.source) {
        status.value = statusForIssue(result.issue)
        error.value = result.message ?? null
        return null
      }
      const validation = validateLessonLaunchContext(launchContext, result.source)
      if (!validation.valid) {
        status.value = 'error'
        error.value = `学习上下文无效：${validation.issues.join('；')}`
        return null
      }
      if (!result.source.steps.length) {
        status.value = 'empty'
        error.value = null
        return null
      }
      source.value = result.source
      const sessionId = createLessonSession(launchContext, studentId.value).id
      const persisted = dependencies.sessionStorage.get(sessionId)
      let nextSession = normalizeLessonSession(
        persisted &&
          persisted.textbookId === launchContext.textbookId &&
          persisted.unitId === launchContext.unitId &&
          persisted.lessonId === launchContext.lessonId &&
          persisted.knowledgePointId === launchContext.knowledgePointId
          ? persisted
          : createLessonSession(launchContext, studentId.value),
        result.source.steps.map((step) => step.id),
      )
      if (
        dataset.value === 'demo' &&
        options.demoState === 'resume' &&
        nextSession.status === 'not_started'
      ) {
        const resumeIndex = Math.min(2, result.source.steps.length - 1)
        nextSession = {
          ...nextSession,
          status: 'in_progress',
          currentStepIndex: resumeIndex,
          completedStepIds: result.source.steps.slice(0, resumeIndex).map((step) => step.id),
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
      if (dataset.value === 'demo' && options.demoState === 'completed') {
        const now = new Date().toISOString()
        nextSession = {
          ...nextSession,
          status: 'completed',
          currentStepIndex: result.source.steps.length - 1,
          completedStepIds: result.source.steps.map((step) => step.id),
          startedAt: nextSession.startedAt ?? now,
          updatedAt: now,
          completedAt: nextSession.completedAt ?? now,
        }
      }
      if (!persisted || JSON.stringify(persisted) !== JSON.stringify(nextSession)) {
        persistSession(nextSession)
      }
      session.value = nextSession
      currentStepIndex.value = nextSession.currentStepIndex
      status.value = nextSession.status === 'completed' ? 'completed' : 'ready'
      rebuildViewModel()
      if (nextSession.status !== 'not_started') projectHistory(nextSession)
      if (nextSession.status === 'completed') projectReward(nextSession)
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

  function startSession(): boolean {
    const active = session.value
    if (!active || status.value === 'completed' || status.value === 'error') return false
    if (active.status === 'in_progress') return true
    const now = new Date().toISOString()
    const nextSession = {
      ...active,
      status: 'in_progress',
      startedAt: active.startedAt ?? now,
      updatedAt: now,
    } satisfies LessonSession
    updateSession(nextSession)
    projectHistory(nextSession)
    status.value = 'ready'
    return true
  }

  function resumeSession(): boolean {
    if (!session.value) return false
    currentStepIndex.value = session.value.currentStepIndex
    if (session.value.status === 'not_started') return startSession()
    rebuildViewModel()
    return true
  }

  function completeStep(stepIndex = currentStepIndex.value): boolean {
    const active = session.value
    const activeViewModel = viewModel.value
    const step = activeViewModel?.steps[stepIndex]
    if (!active || !step || active.status === 'completed') return false
    if (active.status === 'not_started') startSession()
    const latest = session.value
    if (!latest) return false
    const now = new Date().toISOString()
    updateSession({
      ...latest,
      status: 'in_progress',
      completedStepIds: [...new Set([...latest.completedStepIds, step.id])],
      updatedAt: now,
    })
    return true
  }

  function goNext(): boolean {
    if (!canGoNext.value) return false
    if (!startSession()) return false
    completeStep()
    if (currentStepIndex.value >= totalSteps.value - 1) return false
    currentStepIndex.value += 1
    const active = session.value
    if (active) {
      updateSession({
        ...active,
        currentStepIndex: currentStepIndex.value,
        updatedAt: new Date().toISOString(),
      })
    }
    return true
  }

  function goPrevious(): boolean {
    if (!canGoPrevious.value || status.value === 'completed') return false
    currentStepIndex.value -= 1
    const active = session.value
    if (active) {
      updateSession({
        ...active,
        currentStepIndex: currentStepIndex.value,
        updatedAt: new Date().toISOString(),
      })
    }
    return true
  }

  function goToStep(stepIndex: number): boolean {
    if (status.value === 'completed' || !Number.isInteger(stepIndex)) return false
    if (stepIndex < 0 || stepIndex >= totalSteps.value) return false
    currentStepIndex.value = stepIndex
    const active = session.value
    if (active) {
      updateSession({
        ...active,
        currentStepIndex: stepIndex,
        updatedAt: new Date().toISOString(),
      })
    }
    return true
  }

  async function completeLesson(): Promise<boolean> {
    const active = session.value
    const activeViewModel = viewModel.value
    if (!active || !activeViewModel || active.status === 'completed' || !isLastStep.value)
      return false
    if (!completeStep()) return false
    const latest = session.value
    if (!latest) return false
    const requiredStepIds = activeViewModel.steps
      .filter((step) => step.required)
      .map((step) => step.id)
    if (!requiredStepIds.every((stepId) => latest.completedStepIds.includes(stepId))) return false
    const now = new Date().toISOString()
    const completed: LessonSession = {
      ...latest,
      status: 'completed',
      currentStepIndex: Math.max(0, activeViewModel.steps.length - 1),
      updatedAt: now,
      completedAt: now,
    }
    session.value = completed
    persistSession(completed)
    status.value = 'completed'
    rebuildViewModel()
    projectHistory(completed)
    projectReward(completed)
    if (context.value) {
      await dependencies.mapCompletionService.markKnowledgePointCompleted(context.value, {
        dataset: dataset.value,
      })
    }
    return true
  }

  function resetDemoSession(): boolean {
    if (!context.value || dataset.value !== 'demo') return false
    const fresh = createLessonSession(context.value, studentId.value)
    dependencies.sessionStorage.remove(fresh.id)
    warning.value = dependencies.sessionStorage.getLastWarning()
    session.value = fresh
    currentStepIndex.value = 0
    status.value = source.value?.steps.length ? 'ready' : 'empty'
    error.value = null
    rebuildViewModel()
    return true
  }

  function clearStoredSessions(): void {
    dependencies.sessionStorage.clear()
    warning.value = dependencies.sessionStorage.getLastWarning()
  }

  return {
    context,
    activeStudentId: computed(() => studentId.value),
    viewModel,
    session,
    currentStepIndex,
    currentStep,
    totalSteps,
    isLastStep,
    canGoPrevious,
    canGoNext,
    status,
    loading,
    error,
    warning,
    lastRewardEvent,
    dataset,
    loadLesson,
    startSession,
    resumeSession,
    completeStep,
    goNext,
    goPrevious,
    goToStep,
    completeLesson,
    resetDemoSession,
    clearStoredSessions,
  }
})
