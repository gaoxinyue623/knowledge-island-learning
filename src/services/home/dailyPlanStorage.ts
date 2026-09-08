import { z } from 'zod'

import type {
  DailyLearningPlan,
  DailyLearningTask,
  DailyLearningTaskAction,
  DailyPlanStoragePayload,
  HomeDataset,
} from '@/types'

export const DAILY_PLAN_STORAGE_KEY = 'knowledge-island.daily-learning-plans'
export const dailyPlanStorageKey = DAILY_PLAN_STORAGE_KEY

export interface DailyPlanStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface DailyPlanStorage {
  loadAll(): DailyLearningPlan[]
  saveAll(plans: readonly DailyLearningPlan[]): void
  get(
    profileId: string,
    dateKey: string,
    textbookContextKey: string,
    dataset: HomeDataset,
  ): DailyLearningPlan | null
  save(plan: DailyLearningPlan): void
  clearDemoPlans(profileId?: string): void
  clear(): void
  getLastWarning(): string | null
}

const subjectSchema = z.enum(['CHINESE', 'MATH', 'ENGLISH'])
const datasetSchema = z.enum(['profile', 'demo'])
const taskTypeSchema = z.enum([
  'continue_learning',
  'review',
  'reinforce',
  'wrong_question',
  'next_learning',
])
const taskStatusSchema = z.enum(['pending', 'completed', 'unavailable'])

const lessonLaunchContextSchema = z.object({
  textbookId: z.string().min(1),
  unitId: z.string().min(1),
  lessonId: z.string().min(1),
  knowledgePointId: z.string().min(1),
})

const assessmentLaunchContextSchema = lessonLaunchContextSchema.extend({
  source: z.enum(['lesson_practice', 'wrong_book', 'dev']),
})

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('lesson'), launchContext: lessonLaunchContextSchema }),
  z.object({ type: z.literal('assessment'), launchContext: assessmentLaunchContextSchema }),
  z.object({ type: z.literal('wrong_question'), wrongQuestionId: z.string().min(1) }),
  z.object({ type: z.literal('review_queue'), reviewQueueItemId: z.string().min(1) }),
  z.object({ type: z.literal('learning_map'), knowledgePointId: z.string().min(1).optional() }),
])

const taskSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  type: taskTypeSchema,
  subject: subjectSchema,
  textbookId: z.string().min(1),
  knowledgePointId: z.string().min(1).optional(),
  lessonId: z.string().min(1).optional(),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusSchema,
  priority: z.number().int().nonnegative(),
  action: actionSchema,
})

const planSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  textbookContextKey: z.string().min(1),
  textbookIds: z.object({
    CHINESE: z.string().min(1).nullable(),
    MATH: z.string().min(1).nullable(),
    ENGLISH: z.string().min(1).nullable(),
  }),
  dataset: datasetSchema,
  tasks: z.array(taskSchema),
  progress: z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    percentage: z.number().finite().min(0).max(100),
  }),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  generatedAt: z.string().min(1),
  policyVersion: z.string().min(1),
})

export const dailyPlanStoragePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  plans: z.array(planSchema),
})

function browserStorage(): DailyPlanStorageLike | null {
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

function cloneTask(task: DailyLearningTask): DailyLearningTask {
  return {
    ...task,
    action: cloneAction(task.action),
  }
}

function clonePlan(plan: DailyLearningPlan): DailyLearningPlan {
  return {
    ...plan,
    textbookIds: { ...plan.textbookIds },
    tasks: plan.tasks.map(cloneTask),
    progress: { ...plan.progress },
  }
}

function parsePayload(raw: string | null): DailyPlanStoragePayload | null {
  if (!raw) return null
  try {
    const result = dailyPlanStoragePayloadSchema.safeParse(JSON.parse(raw))
    return result.success ? (result.data as DailyPlanStoragePayload) : null
  } catch {
    return null
  }
}

export function createDailyPlanStorage(
  storage: DailyPlanStorageLike | null = browserStorage(),
  key = DAILY_PLAN_STORAGE_KEY,
): DailyPlanStorage {
  let lastWarning: string | null = null

  function loadAll(): DailyLearningPlan[] {
    lastWarning = null
    if (!storage) return []
    let raw: string | null
    try {
      raw = storage.getItem(key)
    } catch {
      lastWarning = '今日学习计划暂时无法读取，将从空白计划开始。'
      return []
    }
    if (!raw) return []
    const payload = parsePayload(raw)
    if (payload) return payload.plans.map(clonePlan)
    lastWarning = '今日学习计划存储已损坏，已安全恢复为空白计划。'
    try {
      storage.removeItem(key)
    } catch {
      // Corruption recovery must not make Home unusable.
    }
    return []
  }

  function saveAll(plans: readonly DailyLearningPlan[]): void {
    if (!storage) return
    const payload: DailyPlanStoragePayload = {
      schemaVersion: 1,
      plans: plans.map(clonePlan),
    }
    const result = dailyPlanStoragePayloadSchema.safeParse(payload)
    if (!result.success) {
      lastWarning = '今日学习计划格式无效，本次更新未保存。'
      return
    }
    try {
      storage.setItem(key, JSON.stringify(result.data))
      lastWarning = null
    } catch {
      lastWarning = '今日学习计划暂时无法保存，学习内容仍可继续。'
    }
  }

  return {
    loadAll,
    saveAll,
    get(profileId, dateKey, textbookContextKey, dataset) {
      return (
        loadAll().find(
          (plan) =>
            plan.profileId === profileId &&
            plan.dateKey === dateKey &&
            plan.textbookContextKey === textbookContextKey &&
            plan.dataset === dataset,
        ) ?? null
      )
    },
    save(plan) {
      const plans = loadAll().filter((candidate) => candidate.id !== plan.id)
      saveAll([...plans, plan])
    },
    clearDemoPlans(profileId) {
      saveAll(
        loadAll().filter(
          (plan) =>
            plan.dataset !== 'demo' || (profileId !== undefined && plan.profileId !== profileId),
        ),
      )
    },
    clear() {
      if (!storage) return
      try {
        storage.removeItem(key)
        lastWarning = null
      } catch {
        lastWarning = '今日学习计划暂时无法清理。'
      }
    },
    getLastWarning() {
      return lastWarning
    },
  }
}

export const dailyPlanStorage = createDailyPlanStorage()

export function migrateDailyPlanStoragePayload(value: unknown): {
  payload: DailyPlanStoragePayload | null
  warning: string | null
} {
  const result = dailyPlanStoragePayloadSchema.safeParse(value)
  if (result.success) return { payload: result.data as DailyPlanStoragePayload, warning: null }
  return {
    payload: null,
    warning: '今日学习计划版本或格式无法识别，已安全恢复为空白计划。',
  }
}
