import { z } from 'zod'

import type {
  DailyLearningPlan,
  DailyLearningTask,
  DailyLearningTaskAction,
  LearningHistoryRecord,
  LessonSession,
  QuestionSession,
  ReviewQueueItem,
  WrongQuestionRecord,
} from '@/types'
import { learningHistoryStorage } from '@/services/learning-history/learningHistoryStorage'
import { createHomeLessonSessionReader } from '@/services/home/homeSessionReaders'
import { lessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import { questionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import { reviewQueueService } from '@/services/review-queue/reviewQueueService'
import { wrongBookStorage } from '@/services/wrong-book/wrongBookStorage'

import {
  WEEKLY_PLAN_SCHEMA_VERSION,
  WEEKLY_PLAN_STORAGE_KEY,
  type WeekdayIndex,
  type WeeklyPlan,
  type WeeklyPlanDay,
  type WeeklyPlanStorage,
  type WeeklyPlanStorageLike,
  type WeeklyPlanStoragePayload,
  type WeeklyPlanStorageResult,
  type WeeklyPlanViewModel,
  type WeeklyTaskReference,
  type WeeklyTaskStatus,
} from './weeklyPlanTypes'

const WEEKDAY_COUNT = 7
const MIN_TASKS = 0
const MAX_TASKS = 5

const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('lesson'),
    launchContext: z.object({
      textbookId: z.string().min(1),
      unitId: z.string().min(1),
      lessonId: z.string().min(1),
      knowledgePointId: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal('assessment'),
    launchContext: z.object({
      textbookId: z.string().min(1),
      unitId: z.string().min(1),
      lessonId: z.string().min(1),
      knowledgePointId: z.string().min(1),
      source: z.enum(['lesson_practice', 'wrong_book', 'dev']),
    }),
  }),
  z.object({ type: z.literal('wrong_question'), wrongQuestionId: z.string().min(1) }),
  z.object({ type: z.literal('review_queue'), reviewQueueItemId: z.string().min(1) }),
  z.object({ type: z.literal('learning_map'), knowledgePointId: z.string().min(1).optional() }),
])

export const weeklyTaskReferenceSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  type: z.enum(['continue_learning', 'review', 'reinforce', 'wrong_question', 'next_learning']),
  subject: z.enum(['CHINESE', 'MATH', 'ENGLISH']),
  textbookId: z.string().min(1),
  knowledgePointId: z.string().min(1).optional(),
  lessonId: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  action: actionSchema,
  selectedAt: z.string().min(1),
})

export const weeklyPlanDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  targetCount: z.number().int().min(MIN_TASKS).max(MAX_TASKS),
  taskReferences: z.array(weeklyTaskReferenceSchema).max(MAX_TASKS),
})

export const weeklyPlanSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  weekStartDateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  days: z.array(weeklyPlanDaySchema).length(WEEKDAY_COUNT),
})

/** Export/restore may validate this stable profile-scoped, multi-profile payload without writing it. */
export const weeklyPlanStoragePayloadSchema = z.object({
  schemaVersion: z.literal(WEEKLY_PLAN_SCHEMA_VERSION),
  plans: z.array(weeklyPlanSchema),
})

export interface WeeklyPlanEvidenceReader {
  history(profileId: string): readonly LearningHistoryRecord[]
  lessons(profileId: string): readonly LessonSession[]
  assessments(profileId: string): readonly QuestionSession[]
  reviewQueue(profileId: string): readonly ReviewQueueItem[]
  wrongBook(profileId: string): readonly WrongQuestionRecord[]
  warning(): string | null
}

function browserStorage(): WeeklyPlanStorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function cloneAction(action: DailyLearningTaskAction): DailyLearningTaskAction {
  switch (action.type) {
    case 'lesson':
      return { type: 'lesson', launchContext: { ...action.launchContext } }
    case 'assessment':
      return { type: 'assessment', launchContext: { ...action.launchContext } }
    case 'wrong_question':
      return { ...action }
    case 'review_queue':
      return { ...action }
    case 'learning_map':
      return { ...action }
  }
}

function cloneReference(reference: WeeklyTaskReference): WeeklyTaskReference {
  return { ...reference, action: cloneAction(reference.action) }
}

function cloneDay(day: WeeklyPlanDay): WeeklyPlanDay {
  return { ...day, taskReferences: day.taskReferences.map(cloneReference) }
}

function clonePlan(plan: WeeklyPlan): WeeklyPlan {
  return { ...plan, days: plan.days.map(cloneDay) }
}

function dateKey(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Monday is 0. This uses local calendar fields and never UTC conversion. */
export function getLocalWeekStartDateKey(date = new Date()): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const mondayOffset = (local.getDay() + 6) % 7
  local.setDate(local.getDate() - mondayOffset)
  return dateKey(local)
}

export function weekDateKey(weekStartDateKey: string, weekday: WeekdayIndex): string {
  const local = parseDateKey(weekStartDateKey)
  local.setDate(local.getDate() + weekday)
  return dateKey(local)
}

export function buildWeeklyPlanId(profileId: string, weekStartDateKey: string): string {
  return `weekly-plan:${profileId}:${weekStartDateKey}`
}

export function taskReferenceFrom(task: DailyLearningTask, selectedAt: string): WeeklyTaskReference {
  return {
    id: task.id,
    sourceId: task.sourceId,
    type: task.type,
    subject: task.subject,
    textbookId: task.textbookId,
    ...(task.knowledgePointId ? { knowledgePointId: task.knowledgePointId } : {}),
    ...(task.lessonId ? { lessonId: task.lessonId } : {}),
    title: task.title,
    ...(task.description ? { description: task.description } : {}),
    action: cloneAction(task.action),
    selectedAt,
  }
}

export function defaultWeeklyPlan(profileId: string, weekStartDateKey = getLocalWeekStartDateKey(), now = new Date()): WeeklyPlan {
  const timestamp = now.toISOString()
  return {
    id: buildWeeklyPlanId(profileId, weekStartDateKey),
    profileId,
    weekStartDateKey,
    createdAt: timestamp,
    updatedAt: timestamp,
    // A gentle default: three short study days, with the rest explicitly optional.
    days: ([0, 1, 2, 3, 4, 5, 6] as WeekdayIndex[]).map((weekday) => ({
      weekday,
      targetCount: weekday === 0 || weekday === 2 || weekday === 4 ? 2 : 0,
      taskReferences: [],
    })),
  }
}

export function createWeeklyPlanStorage(
  storage: WeeklyPlanStorageLike | null = browserStorage(),
  key = WEEKLY_PLAN_STORAGE_KEY,
): WeeklyPlanStorage {
  function payload(): WeeklyPlanStorageResult<WeeklyPlanStoragePayload | null> {
    if (!storage) return { value: null, warning: '周计划暂时无法读取，请稍后重试。' }
    try {
      const raw = storage.getItem(key)
      if (!raw) return { value: null, warning: null }
      const parsed = weeklyPlanStoragePayloadSchema.safeParse(JSON.parse(raw))
      if (parsed.success) return { value: parsed.data as WeeklyPlanStoragePayload, warning: null }
      return { value: null, warning: '周计划存储格式无法识别，原有内容已保留，请勿覆盖。' }
    } catch {
      return { value: null, warning: '周计划暂时无法读取，原有内容已保留，请稍后重试。' }
    }
  }

  return {
    load(profileId, weekStartDateKey) {
      const result = payload()
      const plan = result.value?.plans.find(
        (candidate) => candidate.profileId === profileId && candidate.weekStartDateKey === weekStartDateKey,
      )
      return { value: plan ? clonePlan(plan) : null, warning: result.warning }
    },
    loadAll() {
      const result = payload()
      return { value: result.value?.plans.map(clonePlan) ?? [], warning: result.warning }
    },
    save(plan) {
      const normalized = weeklyPlanSchema.safeParse(plan)
      if (!normalized.success) {
        return { value: clonePlan(plan), warning: '周计划格式无效，本次更改未保存。' }
      }
      const existing = payload()
      if (existing.warning) return { value: clonePlan(plan), warning: existing.warning }
      if (!storage) return { value: clonePlan(plan), warning: '周计划暂时无法保存，请稍后重试。' }
      const plans = (existing.value?.plans ?? []).filter((item) => item.id !== plan.id)
      const next: WeeklyPlanStoragePayload = {
        schemaVersion: WEEKLY_PLAN_SCHEMA_VERSION,
        plans: [...plans, normalized.data as WeeklyPlan],
      }
      try {
        storage.setItem(key, JSON.stringify(next))
        return { value: clonePlan(normalized.data as WeeklyPlan), warning: null }
      } catch {
        return { value: clonePlan(plan), warning: '周计划暂时无法保存，本次更改未写入。' }
      }
    },
  }
}

export function createWeeklyPlanEvidenceReader(): WeeklyPlanEvidenceReader {
  const lessonReader = createHomeLessonSessionReader()
  return {
    history: (profileId) => learningHistoryStorage.loadAll().filter((item) => item.profileId === profileId),
    lessons: (profileId) => lessonReader.listByProfile(profileId),
    assessments: (profileId) =>
      questionSessionStorage.loadAll().filter((item) => item.id.includes(`:${profileId}:`)),
    reviewQueue: (profileId) => reviewQueueService.listByProfile(profileId, { includeCompleted: true }),
    wrongBook: (profileId) => wrongBookStorage.load().records.filter((item) => item.profileId === profileId),
    warning: () =>
      learningHistoryStorage.getLastWarning() ??
      lessonSessionStorage.getLastWarning() ??
      questionSessionStorage.getLastWarning() ??
      reviewQueueService.getLastWarning() ??
      wrongBookStorage.getLastWarning(),
  }
}

function completedAfter(occurredAt: string | undefined, selectedAt: string): boolean {
  return Boolean(occurredAt && occurredAt.localeCompare(selectedAt) >= 0)
}

function contextMatches(reference: WeeklyTaskReference, context: { textbookId: string; lessonId: string; knowledgePointId: string }): boolean {
  return (
    reference.textbookId === context.textbookId &&
    (!reference.lessonId || reference.lessonId === context.lessonId) &&
    (!reference.knowledgePointId || reference.knowledgePointId === context.knowledgePointId)
  )
}

export function sameWeeklyTask(reference: WeeklyTaskReference, task: DailyLearningTask | WeeklyTaskReference): boolean {
  return reference.type === task.type && reference.sourceId === task.sourceId &&
    reference.textbookId === task.textbookId && reference.knowledgePointId === task.knowledgePointId &&
    (!reference.lessonId || !task.lessonId || reference.lessonId === task.lessonId) &&
    reference.action.type === task.action.type
}

function liveTaskMatch(reference: WeeklyTaskReference, dailyPlan: DailyLearningPlan | null): DailyLearningTask | null {
  if (!dailyPlan) return null
  return (
    dailyPlan.tasks.find(
      (task) =>
        sameWeeklyTask(reference, task),
    ) ?? null
  )
}

function evidenceStatus(
  profileId: string,
  reference: WeeklyTaskReference,
  evidence: WeeklyPlanEvidenceReader,
): WeeklyTaskStatus {
  try {
    const history = reference.action.type === 'lesson' || reference.action.type === 'assessment'
      ? evidence.history(profileId) : []
    const completedHistory = history.some(
      (record) =>
        completedAfter(record.occurredAt, reference.selectedAt) &&
        record.type === (reference.action.type === 'lesson' ? 'lesson_completed' : 'assessment_completed') &&
        contextMatches(reference, record),
    )
    if (completedHistory) return 'completed'
    if (reference.action.type === 'lesson') {
      const completedLesson = evidence.lessons(profileId).some(
        (session) =>
          session.status === 'completed' &&
          completedAfter(session.completedAt, reference.selectedAt) &&
          contextMatches(reference, session),
      )
      return completedLesson ? 'completed' : 'pending'
    }
    if (reference.action.type === 'assessment') {
      const completedAssessment = evidence.assessments(profileId).some(
        (session) =>
          session.status === 'completed' &&
          completedAfter(session.completedAt, reference.selectedAt) &&
          contextMatches(reference, session),
      )
      return completedAssessment ? 'completed' : 'pending'
    }
    if (reference.action.type === 'review_queue') {
      const action = reference.action
      const item = evidence.reviewQueue(profileId).find(
        (candidate) => candidate.id === reference.sourceId || candidate.id === action.reviewQueueItemId,
      )
      return item?.status === 'completed' && completedAfter(item.completedAt, reference.selectedAt)
        ? 'completed'
        : 'pending'
    }
    if (reference.action.type === 'wrong_question') {
      const action = reference.action
      const record = evidence.wrongBook(profileId).find(
        (candidate) => candidate.id === reference.sourceId || candidate.questionId === action.wrongQuestionId,
      )
      return record?.status === 'resolved' && completedAfter(record.resolvedAt, reference.selectedAt)
        ? 'completed'
        : 'pending'
    }
    return completedHistory ? 'completed' : 'pending'
  } catch {
    return 'unconfirmed'
  }
}

export function resolveWeeklyPlan(
  plan: WeeklyPlan,
  dailyPlan: DailyLearningPlan | null,
  evidence: WeeklyPlanEvidenceReader = createWeeklyPlanEvidenceReader(),
): WeeklyPlanViewModel {
  const warning = evidence.warning()
  const today = dailyPlan?.dateKey
  return {
    ...clonePlan(plan),
    warning,
    days: plan.days.map((day) => {
      const dayDateKey = weekDateKey(plan.weekStartDateKey, day.weekday)
      const taskReferences = day.taskReferences.map((reference) => {
        const current = liveTaskMatch(reference, dailyPlan?.profileId === plan.profileId ? dailyPlan : null)
        const status = warning
          ? 'unconfirmed'
          : current?.status === 'completed'
            ? 'completed'
            : evidenceStatus(plan.profileId, reference, evidence)
        return { ...cloneReference(reference), status, canContinue: Boolean(today && dayDateKey < today && status === 'pending') }
      })
      return {
        ...cloneDay(day),
        dateKey: dayDateKey,
        taskReferences,
        completedCount: taskReferences.filter((task) => task.status === 'completed').length,
        pendingCount: taskReferences.filter((task) => task.status === 'pending').length,
        unconfirmedCount: taskReferences.filter((task) => task.status === 'unconfirmed').length,
        isRestDay: day.targetCount === 0,
      }
    }),
  }
}

export function updateWeeklyPlanDay(
  plan: WeeklyPlan,
  weekday: WeekdayIndex,
  input: {
    targetCount: number
    /** Omit to change only the day's target; saved references are never silently removed. */
    tasks?: readonly DailyLearningTask[]
    /** Completed, unavailable, or historic references retained while today's pending choices change. */
    retainedTaskReferences?: readonly WeeklyTaskReference[]
  },
  now = new Date(),
): WeeklyPlan {
  const selectedAt = now.toISOString()
  const priorDay = plan.days.find((day) => day.weekday === weekday)
  const retained = input.retainedTaskReferences ?? (input.tasks === undefined ? priorDay?.taskReferences ?? [] : [])
  const uniqueTasks = new Map((input.tasks ?? []).map((task) => [task.id, task]))
  const remainingCapacity = Math.max(0, MAX_TASKS - retained.length)
  const selected = [...uniqueTasks.values()]
    .filter((task) => !retained.some((reference) => reference.id === task.id))
    .slice(0, remainingCapacity)
  const references = [...retained.map(cloneReference), ...selected.map((task) => taskReferenceFrom(task, selectedAt))]
  // A lower future goal may not erase already selected/completed evidence.
  const targetCount = Math.min(
    MAX_TASKS,
    Math.max(MIN_TASKS, Math.floor(input.targetCount), references.length),
  )
  return {
    ...clonePlan(plan),
    updatedAt: selectedAt,
    days: plan.days.map((day) =>
      day.weekday === weekday
        ? { weekday, targetCount, taskReferences: references }
        : cloneDay(day),
    ),
  }
}

export function listWeeklyPlanCarryOvers(
  profileId: string,
  currentWeekStartDateKey: string,
  dailyPlan: DailyLearningPlan | null,
  evidence: WeeklyPlanEvidenceReader = createWeeklyPlanEvidenceReader(),
  storage: WeeklyPlanStorage = weeklyPlanStorage,
): WeeklyPlanStorageResult<WeeklyPlanViewModel['days'][number]['taskReferences']> {
  const loaded = storage.loadAll()
  if (loaded.warning) return { value: [], warning: loaded.warning }
  const tasks = loaded.value
    .filter((plan) => plan.profileId === profileId && plan.weekStartDateKey < currentWeekStartDateKey)
    .sort((left, right) => right.weekStartDateKey.localeCompare(left.weekStartDateKey))
    .flatMap((plan) => resolveWeeklyPlan(plan, dailyPlan, evidence).days)
    .flatMap((day) => day.taskReferences)
    .filter((task) => task.canContinue)
  return { value: tasks, warning: evidence.warning() }
}

export const weeklyPlanStorage = createWeeklyPlanStorage()
