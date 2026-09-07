import type { Id, SubjectCode, StudentCurriculumProfile, VerificationStatus } from './domain'
import type { AchievementUnlock } from './achievement'
import type { DailyLearningPlan } from './home'
import type { LearningHistoryRecord } from './learning-history'
import type {
  KnowledgeLearningState,
  LearningEvidence,
  MasteryEvidenceSourceStatus,
  MasteryRecord,
} from './mastery'
import type { ReviewQueueItem } from './review-queue'
import type { RewardEvent } from './reward'
import type { WrongQuestionRecord } from './wrong-book'

export const PARENT_REPORT_VERSION = 'PARENT_REPORT_V1' as const

export type ParentReportDataset = 'profile' | 'demo'
export type ParentReportRangePreset = '7d' | '30d' | 'all'
export type ParentReportSubjectFilter = SubjectCode | 'ALL'
export type ParentReportSubject = SubjectCode | 'UNKNOWN'

export interface ParentReportRange {
  preset: ParentReportRangePreset
  startDate: string
  endDate: string
}

export interface ParentOverviewSummary {
  learningDays: number
  completedLessons: number
  completedAssessments: number
  completedDailyTasks: number
  totalDailyTasks: number
  activeWrongQuestions: number
  resolvedWrongQuestions: number
  completedReviews: number
  masteredKnowledgePoints: number
}

export interface SubjectProgressSummary {
  subject: SubjectCode
  hasData: boolean
  completedLessons: number
  completedAssessments: number
  masteredKnowledgePoints: number
  learningKnowledgePoints: number
  weakKnowledgePoints: number
  activeWrongQuestions: number
  completedReviews: number
}

export interface MasteryReportSummary {
  totalKnowledgePoints: number
  notStarted: number
  weak: number
  learning: number
  mastered: number
}

export interface WeakKnowledgeItem {
  knowledgePointId: Id
  name: string
  subject: ParentReportSubject
  masteryScore: number
  confidence: number
  state: KnowledgeLearningState
  evidenceSourceStatus?: MasteryEvidenceSourceStatus
  activeWrongQuestionCount: number
  hasReviewRecommendation: boolean
  strategyPriority?: number
  textbookId?: Id
}

export interface WeakKnowledgeSummary {
  totalCount: number
  items: WeakKnowledgeItem[]
}

export interface WrongBookReportItem {
  questionId: Id
  knowledgePointId?: Id
  subject?: ParentReportSubject
  wrongCount: number
  status: 'active' | 'resolved'
  lastWrongAt: string
  resolvedAt?: string
}

export interface WrongBookReportSummary {
  activeCount: number
  resolvedCount: number
  repeatedWrongCount: number
  recentItems: WrongBookReportItem[]
}

export interface ReviewReportSummary {
  pendingCount: number
  completedCount: number
  recentCompletedCount: number
}

export interface DailyPlanCompletionItem {
  dateKey: string
  completed: number
  total: number
  percentage: number
}

export interface DailyPlanCompletionSummary {
  completedTasks: number
  totalTasks: number
  days: DailyPlanCompletionItem[]
}

export type ParentActivityType =
  'lesson_completed' | 'assessment_completed' | 'review_completed' | 'wrong_question_resolved'

export interface ParentActivityItem {
  id: Id
  type: ParentActivityType
  title: string
  subject?: ParentReportSubject
  occurredAt: string
  summary?: {
    questionCount?: number
    correctCount?: number
    incorrectCount?: number
    manualReviewCount?: number
    assessmentPercentage?: number | null
  }
}

export interface LearningActivitySummary {
  activeDays: number
  lessonCompletedCount: number
  assessmentCompletedCount: number
  reviewCompletedCount: number
  wrongQuestionResolvedCount: number
  recentItems: ParentActivityItem[]
}

export interface ParentGrowthSummary {
  knowledgeEnergy: number
  growthLevel: number
  progressToNextLevel: number
  nextLevelThreshold?: number
  earnedInRange: number
  isSampleDerived: boolean
}

export interface ParentAchievementSummary {
  unlockedCount: number
  totalCount: number
  recentlyUnlocked: Array<{
    id: Id
    title: string
    unlockedAt: string
  }>
  isSampleDerived: boolean
}

export interface ParentTrendPoint {
  dateKey: string
  completedTaskCount: number
  activityCount: number
}

export interface ParentTrendSummary {
  points: ParentTrendPoint[]
  hasData: boolean
  description: string
}

export interface ParentReportFlags {
  isSampleDerived: boolean
  containsUnverifiedContent: boolean
}

export interface ParentReportProfileSummary {
  profileId: Id
  displayName: string
  gradeId?: Id
  semesterId?: Id
}

export interface ParentReport {
  id: Id
  profileId: Id
  profile: ParentReportProfileSummary
  range: ParentReportRange
  generatedAt: string
  overview: ParentOverviewSummary
  subjects: SubjectProgressSummary[]
  mastery: MasteryReportSummary
  weakKnowledge: WeakKnowledgeSummary
  wrongBook: WrongBookReportSummary
  review: ReviewReportSummary
  dailyPlan: DailyPlanCompletionSummary
  activity: LearningActivitySummary
  participation: {
    completedLessons: number
    completedAssessments: number
    activeDays: number
    unverifiedCount: number
    recentItems: ParentActivityItem[]
  }
  growth: ParentGrowthSummary
  achievements: ParentAchievementSummary
  trend: ParentTrendSummary
  flags: ParentReportFlags
  reportVersion: typeof PARENT_REPORT_VERSION
  subjectFilter: ParentReportSubjectFilter
  diagnostics: string[]
}

export interface ParentReportOptions {
  dataset?: ParentReportDataset
  range?: ParentReportRangePreset | ParentReportRange
  subject?: ParentReportSubjectFilter
  now?: Date | string
  profile?: StudentCurriculumProfile
  /** Explicitly selected by a development-only fixture control. */
  demoScenario?: ParentReportDemoScenario
  /** Read-only development fixture facts; never persisted by the report layer. */
  demoFacts?: ParentReportDemoFacts
}

export type ParentReportDemoScenario =
  | 'full'
  | 'empty'
  | 'sample'
  | 'unverified'
  | 'weak-heavy'
  | 'no-wrong-book'
  | 'no-review'
  | 'partial'
  | 'error'

export interface ParentReportDemoFacts {
  history: LearningHistoryRecord[]
  wrongBook: WrongQuestionRecord[]
  reviewQueue: ReviewQueueItem[]
  mastery: MasteryRecord[]
  evidence: LearningEvidence[]
  rewards: RewardEvent[]
  unlocks: AchievementUnlock[]
  dailyPlans: DailyLearningPlan[]
}

export interface ParentReportPreferencesPayload {
  schemaVersion: 1
  selectedRange: ParentReportRangePreset
  selectedSubject: ParentReportSubjectFilter
}

export interface ParentReportPreferencesStorage {
  load(): ParentReportPreferencesPayload | null
  save(payload: ParentReportPreferencesPayload): void
  clear(): void
  getLastWarning(): string | null
}

export type ParentReportStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ParentReportStoreLoadOptions extends ParentReportOptions {
  profileId?: Id
}

export interface ParentReportReadSourceDiagnostics {
  warnings: string[]
  isSampleDerived: boolean
  containsUnverifiedContent: boolean
}

// Keep these imports type-visible for downstream consumers that build fixtures
// alongside a report without making the report layer own those domains.
export type ParentReportRewardEvent = RewardEvent
export type ParentReportAchievementUnlock = AchievementUnlock
export type ParentReportMasteryRecord = MasteryRecord
export type ParentReportVerificationStatus = VerificationStatus
