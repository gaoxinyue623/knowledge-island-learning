import type { Id, SubjectCode, VerificationStatus } from './domain'
import type { IconName } from './icons'
import type { LearningHistoryRecord } from './learning-history'
import type {
  LearningMapCurriculumSource,
  LearningMapProgressRecord,
  LearningMapViewModel,
} from './learning-map'
import type { LessonLaunchContext } from './learning-map'
import type { LearningRecommendation } from './learning-strategy'
import type { LessonSession } from './lesson-player'
import type { AssessmentLaunchContext } from './question-engine'
import type { ReviewQueueItem } from './review-queue'
import type { WrongQuestionRecord } from './wrong-book'

export const DAILY_PLAN_VERSION = 'DAILY_PLAN_V1' as const

export type HomeDataset = 'profile' | 'demo'

export type DailyLearningTaskType =
  'continue_learning' | 'review' | 'reinforce' | 'wrong_question' | 'next_learning'

export type DailyLearningTaskStatus = 'pending' | 'completed' | 'unavailable'
export type DailyLearningPlanStatus = 'not_started' | 'in_progress' | 'completed'

export interface DailyProgress {
  completed: number
  total: number
  percentage: number
}

export interface DailyPlanPolicy {
  version: string
  maxTasks: number
  maxContinueTasks: number
  maxReviewTasks: number
  maxReinforceTasks: number
  maxWrongQuestionTasks: number
  maxNewLearningTasks: number
}

export const DEFAULT_DAILY_PLAN_POLICY: DailyPlanPolicy = {
  version: DAILY_PLAN_VERSION,
  maxTasks: 3,
  maxContinueTasks: 1,
  maxReviewTasks: 1,
  maxReinforceTasks: 1,
  maxWrongQuestionTasks: 1,
  maxNewLearningTasks: 1,
}

export type DailyLearningTaskAction =
  | {
      type: 'lesson'
      launchContext: LessonLaunchContext
    }
  | {
      type: 'assessment'
      launchContext: AssessmentLaunchContext
    }
  | {
      type: 'wrong_question'
      wrongQuestionId: Id
    }
  | {
      type: 'review_queue'
      reviewQueueItemId: Id
    }
  | {
      type: 'learning_map'
      knowledgePointId?: Id
    }

export interface DailyLearningTask {
  id: Id
  profileId: Id
  type: DailyLearningTaskType
  subject: SubjectCode
  textbookId: Id
  knowledgePointId?: Id
  lessonId?: Id
  sourceId: Id
  title: string
  description?: string
  status: DailyLearningTaskStatus
  priority: number
  action: DailyLearningTaskAction
}

export type DailyLearningPlanViewModel = DailyLearningPlan

export interface DailyLearningPlan {
  id: Id
  profileId: Id
  dateKey: string
  textbookContextKey: string
  textbookIds: Record<SubjectCode, Id | null>
  dataset: HomeDataset
  tasks: DailyLearningTask[]
  progress: DailyProgress
  status: DailyLearningPlanStatus
  generatedAt: string
  policyVersion: string
}

export interface DailyPlanStoragePayload {
  schemaVersion: 1
  plans: DailyLearningPlan[]
}

export interface HomeProfileViewModel {
  profileId: Id
  displayName: string
  regionName: string
  gradeName: string
  semesterName: string
}

export interface HomeGreetingViewModel {
  title: string
  subtitle: string
  dateKey: string
  dateLabel: string
}

export interface ContinueLearningViewModel {
  taskId: Id
  subject: SubjectCode
  title: string
  lessonId: Id
  knowledgePointId: Id
  progress: number
  action: DailyLearningTaskAction
}

export type SubjectMapStatus = 'available' | 'not_available' | 'sample' | 'unverified'

export interface SubjectHomeSummary {
  completedLearningSessions?: number
  code: SubjectCode
  label: string
  color: string
  softColor: string
  icon: IconName
  textbookId?: Id
  textbookName: string
  publisherName?: string
  mapStatus: SubjectMapStatus
  progress: DailyProgress
  currentLessonTitle?: string
  currentKnowledgePointTitle?: string
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export interface RecentLearningItem {
  id: Id
  type: LearningHistoryRecord['type']
  title: string
  subject: SubjectCode
  textbookId: Id
  knowledgePointId: Id
  occurredAt: string
  summary?: LearningHistoryRecord['summary']
  isSample: boolean
}

export interface HomeShortcut {
  id: 'learning_map' | 'history' | 'wrong_book' | 'review_queue' | 'curriculum_settings'
  label: string
  description: string
  icon: IconName
  path: string
  count?: number
}

export interface HomeGrowthSummary {
  knowledgeEnergy: number
  growthLevel: number
  progressToNextLevel: number
  nextLevelThreshold?: number
  isSampleDerived: boolean
}

export interface HomeAchievementSummary {
  unlockedCount: number
  totalCount: number
  nextAchievement?: {
    id: Id
    title: string
    description: string
    percentage: number
  }
  isSampleDerived: boolean
}

export interface HomeMapSnapshot {
  subject: SubjectCode
  textbookId: Id
  source: LearningMapCurriculumSource | null
  viewModel: LearningMapViewModel | null
  progressRecords: LearningMapProgressRecord[]
  available: boolean
  isSample: boolean
  isUnverified: boolean
  verificationStatus?: VerificationStatus
}

export interface HomeStrategySnapshot {
  subject: SubjectCode
  textbookId: Id
  recommendation: LearningRecommendation
}

export interface DailyPlanProjectionInput {
  profileId: Id
  dateKey: string
  generatedAt?: string
  dataset: HomeDataset
  textbookIds?: Record<SubjectCode, Id | null>
  lessonSessions: readonly LessonSession[]
  strategies?: readonly HomeStrategySnapshot[]
  /** A single-strategy shorthand is useful for a one-subject fixture. */
  strategy?: LearningRecommendation | null
  reviewQueue: readonly ReviewQueueItem[]
  wrongBook: readonly WrongQuestionRecord[]
  maps: readonly HomeMapSnapshot[]
  history: readonly LearningHistoryRecord[]
}

export interface HomeProjectionInput {
  profile: HomeProfileViewModel
  greeting: HomeGreetingViewModel
  dailyPlan: DailyLearningPlan
  subjects: SubjectHomeSummary[]
  recentLearning: RecentLearningItem[]
  shortcuts: HomeShortcut[]
  growth: HomeGrowthSummary
  achievement?: HomeAchievementSummary
  flags: HomeViewModel['flags']
  warnings?: string[]
}

export interface HomeViewModel {
  profile: HomeProfileViewModel
  greeting: HomeGreetingViewModel
  today: DailyLearningPlanViewModel
  continueLearning?: ContinueLearningViewModel
  subjects: SubjectHomeSummary[]
  recentLearning: RecentLearningItem[]
  shortcuts: HomeShortcut[]
  growth: HomeGrowthSummary
  achievement?: HomeAchievementSummary
  flags: {
    isSample: boolean
    isUnverified: boolean
    hasAvailableCurriculum: boolean
  }
  warnings: string[]
}

export interface HomeLoadOptions {
  dataset?: HomeDataset
  displayName?: string
  now?: Date | string
  policy?: DailyPlanPolicy
  seedDemo?: boolean
}
