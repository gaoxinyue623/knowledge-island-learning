import type { DailyLearningTask, DailyLearningTaskAction, DailyLearningTaskStatus } from '@/types/home'

export const WEEKLY_PLAN_SCHEMA_VERSION = 1 as const
export const WEEKLY_PLAN_STORAGE_KEY = 'knowledge-island.weekly-learning-plans'

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type WeeklyTaskStatus = DailyLearningTaskStatus | 'unconfirmed'

export interface WeeklyTaskReference {
  id: string
  sourceId: string
  type: DailyLearningTask['type']
  subject: DailyLearningTask['subject']
  textbookId: string
  knowledgePointId?: string
  lessonId?: string
  title: string
  description?: string
  action: DailyLearningTaskAction
  selectedAt: string
}

export interface WeeklyPlanDay {
  weekday: WeekdayIndex
  /** A student may deliberately choose zero tasks for a rest day. */
  targetCount: number
  taskReferences: WeeklyTaskReference[]
}

export interface WeeklyPlan {
  id: string
  profileId: string
  weekStartDateKey: string
  createdAt: string
  updatedAt: string
  days: WeeklyPlanDay[]
}

export interface WeeklyPlanStoragePayload {
  schemaVersion: typeof WEEKLY_PLAN_SCHEMA_VERSION
  plans: WeeklyPlan[]
}

export interface WeeklyPlanStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface WeeklyPlanStorageResult<T> {
  value: T
  warning: string | null
}

export interface WeeklyPlanStorage {
  load(profileId: string, weekStartDateKey: string): WeeklyPlanStorageResult<WeeklyPlan | null>
  save(plan: WeeklyPlan): WeeklyPlanStorageResult<WeeklyPlan>
  loadAll(): WeeklyPlanStorageResult<WeeklyPlan[]>
}

export interface WeeklyTaskViewModel extends WeeklyTaskReference {
  status: WeeklyTaskStatus
  /** The task is from an earlier day and can be resumed without becoming debt. */
  canContinue: boolean
}

export interface WeeklyPlanDayViewModel extends Omit<WeeklyPlanDay, 'taskReferences'> {
  dateKey: string
  taskReferences: WeeklyTaskViewModel[]
  completedCount: number
  pendingCount: number
  unconfirmedCount: number
  isRestDay: boolean
}

export interface WeeklyPlanViewModel extends Omit<WeeklyPlan, 'days'> {
  days: WeeklyPlanDayViewModel[]
  warning: string | null
}
