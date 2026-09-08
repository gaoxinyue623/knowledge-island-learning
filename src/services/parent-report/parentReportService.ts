import { phase14DemoProfile, phase14DemoTextbookId } from '@/data/home'
import { growthLevelForEnergy } from '@/services/growth'
import { DEFAULT_GROWTH_POLICY, PARENT_REPORT_VERSION } from '@/types'
import type {
  AchievementDefinition,
  AchievementUnlock,
  DailyLearningPlan,
  Id,
  LearningEvidence,
  LearningHistoryRecord,
  LearningMapCurriculumSource,
  LearningMapProgressRecord,
  LearningMapViewModel,
  MasteryRecord,
  ParentActivityItem,
  ParentAchievementSummary,
  ParentGrowthSummary,
  ParentReport,
  ParentReportDataset,
  ParentReportDemoScenario,
  ParentReportDemoFacts,
  ParentReportFlags,
  ParentReportOptions,
  ParentReportProfileSummary,
  ParentReportRange,
  ParentReportRangePreset,
  ParentReportSubject,
  ParentReportSubjectFilter,
  ParentTrendPoint,
  ReviewQueueItem,
  SubjectCode,
  StudentCurriculumProfile,
  WrongQuestionRecord,
} from '@/types'
import {
  buildLearningMapViewModel,
  createLearningMapProgressStorage,
  learningMapRepository,
} from '@/services/learning-map'
import type { LearningMapProgressStorage, LearningMapRepository } from '@/services/learning-map'
import {
  learningHistoryService,
  type LearningHistoryServiceContract,
} from '@/services/learning-history'
import {
  learningStrategyService,
  toStrategyKnowledgeRelations,
  toStrategyMapNodes,
  type LearningStrategyServiceContract,
} from '@/services/learning-strategy'
import { masteryRepository, type MasteryRepository } from '@/services/mastery/masteryRepository'
import { rewardService, type RewardServiceContract } from '@/services/reward'
import { achievementService } from '@/services/achievement'
import { reviewQueueService, type ReviewQueueService } from '@/services/review-queue'
import { wrongBookService, type WrongBookService } from '@/services/wrong-book'
import { dailyPlanStorage, type DailyPlanStorage } from '@/services/home/dailyPlanStorage'

const SUBJECT_CODES: SubjectCode[] = ['CHINESE', 'MATH', 'ENGLISH']
const UNSAFE_STATUSES = new Set(['SAMPLE', 'UNVERIFIED', 'REJECTED'])
const MASTERY_UNSAFE_STATUSES = new Set(['SAMPLE', 'UNVERIFIED', 'MIXED'])
const EMPTY_DATE = '1970-01-01'

function emptyParticipation(): ParentReport['participation'] {
  return {
    completedLessons: 0,
    completedAssessments: 0,
    activeDays: 0,
    unverifiedCount: 0,
    recentItems: [],
  }
}

function participationAllowed(
  record: LearningHistoryRecord,
  profileId: Id,
  dataset: ParentReportDataset,
): boolean {
  return (
    record.profileId === profileId &&
    record.provenance.verificationStatus !== 'REJECTED' &&
    (dataset === 'demo' ||
      (!record.provenance.isSampleDerived && record.provenance.verificationStatus !== 'SAMPLE'))
  )
}

// Read-only participation, not evidence of mastery. Keep the formal projection below unchanged.
function projectParticipation(
  history: LearningHistoryRecord[],
  range: ParentReportRange,
  selectedSubject: ParentReportSubjectFilter,
  sources: Map<Id, LearningMapCurriculumSource>,
  textbookSubjects: Map<Id, SubjectCode>,
): ParentReport['participation'] {
  const records = [
    ...new Map(
      history
        .filter(
          (record) =>
            (record.type === 'lesson_completed' || record.type === 'assessment_completed') &&
            inRange(record.occurredAt, range) &&
            subjectMatches(
              subjectFromTextbookId(record.textbookId, textbookSubjects),
              selectedSubject,
            ),
        )
        .map((record) => [record.id, record]),
    ).values(),
  ].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
      a.id.localeCompare(b.id),
  )
  return {
    completedLessons: new Set(
      records
        .filter((r) => r.type === 'lesson_completed')
        .map((r) => JSON.stringify([r.textbookId, r.lessonId])),
    ).size,
    completedAssessments: records.filter((r) => r.type === 'assessment_completed').length,
    activeDays: new Set(records.map((r) => dateKeyFromValue(r.occurredAt))).size,
    unverifiedCount: records.filter((r) => !factAllowed(r.provenance, 'profile')).length,
    recentItems: records.slice(0, 8).map((record) => {
      const source = sources.get(record.textbookId)
      const lesson = source?.lessons.find(
        (l) => l.id === record.lessonId && l.unitId === record.unitId,
      )
      const title =
        lesson && !lesson.isSample && lesson.verificationStatus !== 'REJECTED'
          ? `《${lesson.title}》`
          : '教材课程'
      return {
        id: record.id,
        type: record.type as 'lesson_completed' | 'assessment_completed',
        title: `${title} · ${record.type === 'lesson_completed' ? '完成学习' : '完成课后练习'}`,
        subject: subjectFromTextbookId(record.textbookId, textbookSubjects),
        occurredAt: record.occurredAt,
        ...(record.summary ? { summary: { ...record.summary } } : {}),
      }
    }),
  }
}

export interface ParentReportAchievementReader {
  listDefinitions(): AchievementDefinition[]
  listUnlocks(profileId: Id, includeSample?: boolean): AchievementUnlock[]
  getLastWarning(): string | null
}

export interface ParentReportServiceDependencies {
  historyService: LearningHistoryServiceContract
  masteryRepository: MasteryRepository
  wrongBookService: Pick<WrongBookService, 'listByProfile' | 'getLastWarning'>
  reviewQueueService: Pick<ReviewQueueService, 'listByProfile' | 'getLastWarning'>
  rewardService: Pick<RewardServiceContract, 'listByProfile' | 'getLastWarning'>
  achievementService: ParentReportAchievementReader
  dailyPlanStorage: DailyPlanStorage
  mapRepository: LearningMapRepository
  progressStorage: LearningMapProgressStorage
  strategyService: LearningStrategyServiceContract
}

const defaultDependencies: ParentReportServiceDependencies = {
  historyService: learningHistoryService,
  masteryRepository,
  wrongBookService,
  reviewQueueService,
  rewardService,
  achievementService,
  dailyPlanStorage,
  mapRepository: learningMapRepository,
  progressStorage: createLearningMapProgressStorage(),
  strategyService: learningStrategyService,
}

interface MapKnowledgeInfo {
  name: string
  subject: SubjectCode
  textbookId: Id
  lessonId: Id
  unitId: Id
}

interface MapContext {
  subject: SubjectCode
  textbookId: Id
  source: LearningMapCurriculumSource
  viewModel: LearningMapViewModel
  progressRecords: LearningMapProgressRecord[]
}

interface ReadFacts {
  history: LearningHistoryRecord[]
  wrongBook: WrongQuestionRecord[]
  reviewQueue: ReviewQueueItem[]
  mastery: MasteryRecord[]
  evidence: LearningEvidence[]
  rewards: ReturnType<RewardServiceContract['listByProfile']>
  definitions: AchievementDefinition[]
  unlocks: AchievementUnlock[]
  dailyPlans: DailyLearningPlan[]
  maps: MapContext[]
}

function addDiagnostic(diagnostics: string[], message: string): void {
  if (message && !diagnostics.includes(message)) diagnostics.push(message)
}

function readWarning(
  reader: { getLastWarning?: () => string | null },
  diagnostics: string[],
): void {
  try {
    const warning = reader.getLastWarning?.()
    if (warning) addDiagnostic(diagnostics, warning)
  } catch {
    addDiagnostic(diagnostics, '部分学习数据的诊断信息暂时无法读取。')
  }
}

function readSource<T>(label: string, read: () => T, diagnostics: string[], fallback: T): T {
  try {
    return read()
  } catch (caught) {
    addDiagnostic(
      diagnostics,
      caught instanceof Error
        ? `${label}暂时无法读取：${caught.message}`
        : `${label}暂时无法读取。`,
    )
    return fallback
  }
}

function readAsyncSource<T>(
  label: string,
  read: () => Promise<T>,
  diagnostics: string[],
  fallback: T,
): Promise<T> {
  return read().catch((caught: unknown) => {
    addDiagnostic(
      diagnostics,
      caught instanceof Error
        ? `${label}暂时无法读取：${caught.message}`
        : `${label}暂时无法读取。`,
    )
    return fallback
  })
}

function safeNow(value: ParentReportOptions['now']): Date {
  const candidate =
    value instanceof Date ? new Date(value.getTime()) : new Date(value ?? Date.now())
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate
}

function isoFor(date: Date): string {
  return date.toISOString()
}

function getLocalDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dateFromKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return getLocalDateKey(date) === dateKey ? date : null
}

function dateKeyFromValue(value: string | undefined): string | null {
  if (!value) return null
  if (validDateKey(value)) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : getLocalDateKey(date)
}

function shiftLocalDate(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function validDateKey(value: string): boolean {
  return dateFromKey(value) !== null
}

function compareDateDesc(left: string, right: string): number {
  return right.localeCompare(left)
}

function inRange(value: string | undefined, range: ParentReportRange): boolean {
  const key = dateKeyFromValue(value)
  return Boolean(key && key >= range.startDate && key <= range.endDate)
}

function factAllowed(
  value: { isSampleDerived?: boolean; verificationStatus?: string },
  dataset: ParentReportDataset,
): boolean {
  if (dataset === 'demo') return true
  return !value.isSampleDerived && !UNSAFE_STATUSES.has(value.verificationStatus ?? '')
}

function masteryAllowed(record: MasteryRecord, dataset: ParentReportDataset): boolean {
  if (dataset === 'demo') return true
  return !record.isSampleDerived && !MASTERY_UNSAFE_STATUSES.has(record.evidenceSourceStatus)
}

function subjectFromTextbookId(
  textbookId: Id | undefined,
  textbookSubjects: ReadonlyMap<Id, SubjectCode>,
): SubjectCode | undefined {
  if (!textbookId) return undefined
  const known = textbookSubjects.get(textbookId)
  if (known) return known
  const normalized = textbookId.toUpperCase()
  if (normalized.includes('CHINESE') || normalized.includes('语文')) return 'CHINESE'
  if (normalized.includes('ENGLISH') || normalized.includes('英语')) return 'ENGLISH'
  if (normalized.includes('MATH') || normalized.includes('数学')) return 'MATH'
  return undefined
}

function textbookIdsForProfile(
  profile: StudentCurriculumProfile | undefined,
): Record<SubjectCode, Id | null> {
  return {
    CHINESE: profile?.chineseTextbookVersionId ?? null,
    MATH: profile?.mathTextbookVersionId ?? null,
    ENGLISH: profile?.englishTextbookVersionId ?? null,
  }
}

function profileForReport(
  profileId: Id,
  dataset: ParentReportDataset,
  profile: StudentCurriculumProfile | undefined,
): StudentCurriculumProfile | undefined {
  if (profile?.studentId === profileId) return profile
  if (dataset === 'demo' && phase14DemoProfile.studentId === profileId) return phase14DemoProfile
  return undefined
}

function sourceIsSample(source: LearningMapCurriculumSource): boolean {
  return Boolean(
    source.isSample ||
    source.textbook.isSample ||
    source.verificationStatus === 'SAMPLE' ||
    source.textbook.verificationStatus === 'SAMPLE' ||
    source.units.some((item) => item.isSample || item.verificationStatus === 'SAMPLE') ||
    source.lessons.some((item) => item.isSample || item.verificationStatus === 'SAMPLE') ||
    source.knowledgePoints.some((item) => item.isSample || item.verificationStatus === 'SAMPLE') ||
    source.lessonKnowledgePoints.some(
      (item) => item.isSample || item.verificationStatus === 'SAMPLE',
    ) ||
    source.knowledgeRelations.some((item) => item.isSample || item.verificationStatus === 'SAMPLE'),
  )
}

function sourceHasUnverifiedContent(source: LearningMapCurriculumSource): boolean {
  const statuses = [
    source.verificationStatus,
    source.textbook.verificationStatus,
    ...source.units.map((item) => item.verificationStatus),
    ...source.lessons.map((item) => item.verificationStatus),
    ...source.knowledgePoints.map((item) => item.verificationStatus),
    ...source.lessonKnowledgePoints.map((item) => item.verificationStatus),
    ...source.knowledgeRelations.map((item) => item.verificationStatus),
  ]
  return statuses.some((status) => status === 'UNVERIFIED')
}

function sourceAllowed(source: LearningMapCurriculumSource, dataset: ParentReportDataset): boolean {
  if (dataset === 'demo') return true
  return (
    !sourceIsSample(source) &&
    ![
      source.verificationStatus,
      source.textbook.verificationStatus,
      ...source.units.map((item) => item.verificationStatus),
      ...source.lessons.map((item) => item.verificationStatus),
      ...source.knowledgePoints.map((item) => item.verificationStatus),
      ...source.lessonKnowledgePoints.map((item) => item.verificationStatus),
      ...source.knowledgeRelations.map((item) => item.verificationStatus),
    ].some((status) => UNSAFE_STATUSES.has(status ?? ''))
  )
}

function rangeFromPreset(
  preset: ParentReportRangePreset,
  now: Date,
  dateCandidates: string[],
): ParentReportRange {
  const endDate = getLocalDateKey(now)
  if (preset === 'all') {
    const earliest = dateCandidates
      .filter(validDateKey)
      .sort((left, right) => left.localeCompare(right))[0]
    return { preset, startDate: earliest ?? endDate, endDate }
  }
  const days = preset === '30d' ? 29 : 6
  return { preset, startDate: getLocalDateKey(shiftLocalDate(now, -days)), endDate }
}

function resolveRange(
  value: ParentReportOptions['range'],
  now: Date,
  dateCandidates: string[],
): ParentReportRange {
  if (value && typeof value === 'object') {
    if (
      validDateKey(value.startDate) &&
      validDateKey(value.endDate) &&
      value.startDate <= value.endDate
    ) {
      return { ...value }
    }
    return rangeFromPreset('7d', now, dateCandidates)
  }
  return rangeFromPreset(value ?? '7d', now, dateCandidates)
}

function profileSummary(
  profileId: Id,
  profile?: StudentCurriculumProfile,
): ParentReportProfileSummary {
  return {
    profileId,
    displayName: profileId === 'local-profile' ? '小岛探险家' : '同学',
    ...(profile?.gradeId ? { gradeId: profile.gradeId } : {}),
    ...(profile?.semesterId ? { semesterId: profile.semesterId } : {}),
  }
}

function historyTitle(type: LearningHistoryRecord['type']): string {
  return type === 'lesson_completed' ? '完成一节课程' : '完成一次练习'
}

function cloneActivitySummary(summary: LearningHistoryRecord['summary']) {
  return summary ? { ...summary } : undefined
}

function subjectMatches(
  subject: ParentReportSubject | undefined,
  selected: ParentReportSubjectFilter,
): boolean {
  return selected === 'ALL' || subject === selected
}

function subjectForWrong(
  record: WrongQuestionRecord,
  knowledgeInfo: ReadonlyMap<Id, MapKnowledgeInfo>,
  textbookSubjects: ReadonlyMap<Id, SubjectCode>,
): ParentReportSubject | undefined {
  const fromKnowledge = record.knowledgePointIds
    .map((knowledgePointId) => knowledgeInfo.get(knowledgePointId)?.subject)
    .find((subject): subject is SubjectCode => Boolean(subject))
  return (
    fromKnowledge ??
    subjectFromTextbookId(record.textbookId ?? record.textbookIds?.[0], textbookSubjects)
  )
}

function subjectForReview(
  item: ReviewQueueItem,
  textbookSubjects: ReadonlyMap<Id, SubjectCode>,
): ParentReportSubject | undefined {
  return subjectFromTextbookId(item.textbookId, textbookSubjects)
}

function countByDate(values: string[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const value of values) {
    const key = dateKeyFromValue(value)
    if (key) result.set(key, (result.get(key) ?? 0) + 1)
  }
  return result
}

function sumRewardEvents(
  events: ReadonlyArray<ReturnType<RewardServiceContract['listByProfile']>[number]>,
): number {
  return events.reduce((total, event) => {
    const reward = event.reward.knowledgeEnergy
    return Number.isFinite(reward) ? total + reward : total
  }, 0)
}

function buildFlags(
  dataset: ParentReportDataset,
  history: readonly LearningHistoryRecord[],
  wrongBook: readonly WrongQuestionRecord[],
  reviewQueue: readonly ReviewQueueItem[],
  mastery: readonly MasteryRecord[],
  rewards: ReadonlyArray<ReturnType<RewardServiceContract['listByProfile']>[number]>,
  unlocks: readonly AchievementUnlock[],
  maps: readonly MapContext[],
): ParentReportFlags {
  return {
    isSampleDerived:
      dataset === 'demo' ||
      history.some((item) => item.provenance.isSampleDerived) ||
      wrongBook.some((item) => item.provenance.isSampleDerived) ||
      reviewQueue.some((item) => item.provenance.isSampleDerived) ||
      mastery.some((item) => item.isSampleDerived || item.evidenceSourceStatus === 'SAMPLE') ||
      rewards.some((item) => item.provenance.isSampleDerived) ||
      unlocks.some((item) => item.provenance.isSampleDerived) ||
      maps.some((item) => sourceIsSample(item.source)),
    containsUnverifiedContent:
      history.some((item) => item.provenance.verificationStatus === 'UNVERIFIED') ||
      wrongBook.some((item) => item.provenance.verificationStatus === 'UNVERIFIED') ||
      reviewQueue.some((item) => item.provenance.verificationStatus === 'UNVERIFIED') ||
      mastery.some(
        (item) =>
          item.evidenceSourceStatus === 'UNVERIFIED' || item.evidenceSourceStatus === 'MIXED',
      ) ||
      rewards.some((item) => item.provenance.verificationStatus === 'UNVERIFIED') ||
      unlocks.some((item) => item.provenance.verificationStatus === 'UNVERIFIED') ||
      maps.some((item) => sourceHasUnverifiedContent(item.source)),
  }
}

function buildTrend(
  range: ParentReportRange,
  activity: readonly ParentActivityItem[],
  dailyPlans: DailyPlanCompletionItemInput[],
): { points: ParentTrendPoint[]; hasData: boolean; description: string } {
  const activityByDate = countByDate(activity.map((item) => item.occurredAt))
  const taskByDate = new Map<string, number>()
  for (const item of dailyPlans) {
    if (item.completed > 0) taskByDate.set(item.dateKey, item.completed)
  }
  const dateKeys = [...new Set([...activityByDate.keys(), ...taskByDate.keys()])]
    .filter((dateKey) => dateKey >= range.startDate && dateKey <= range.endDate)
    .sort()
  const points = dateKeys.map((dateKey) => ({
    dateKey,
    completedTaskCount: taskByDate.get(dateKey) ?? 0,
    activityCount: activityByDate.get(dateKey) ?? 0,
  }))
  return {
    points,
    hasData: points.length > 0,
    description: points.length
      ? `${points.length} 个日期有完成记录。`
      : '选择范围内还没有可展示的完成记录。',
  }
}

interface DailyPlanCompletionItemInput {
  dateKey: string
  completed: number
  total: number
  percentage: number
}

function applyDemoScenario(
  report: ParentReport,
  scenario: ParentReportDemoScenario | undefined,
): ParentReport {
  if (scenario === 'error') {
    throw new Error('开发场景：模拟报告读取失败。')
  }
  if (!scenario || scenario === 'full' || scenario === 'sample') return report
  const next: ParentReport = {
    ...report,
    diagnostics: [...report.diagnostics],
    overview: { ...report.overview },
    wrongBook: {
      ...report.wrongBook,
      recentItems: report.wrongBook.recentItems.map((item) => ({ ...item })),
    },
    review: { ...report.review },
    activity: {
      ...report.activity,
      recentItems: report.activity.recentItems.map((item) => ({ ...item })),
    },
    trend: { ...report.trend, points: report.trend.points.map((point) => ({ ...point })) },
    flags: { ...report.flags },
  }
  if (scenario === 'empty') {
    next.participation = emptyParticipation()
    next.overview = {
      learningDays: 0,
      completedLessons: 0,
      completedAssessments: 0,
      completedDailyTasks: 0,
      totalDailyTasks: 0,
      activeWrongQuestions: 0,
      resolvedWrongQuestions: 0,
      completedReviews: 0,
      masteredKnowledgePoints: 0,
    }
    next.subjects = next.subjects.map((subject) => ({
      ...subject,
      hasData: false,
      completedLessons: 0,
      completedAssessments: 0,
      masteredKnowledgePoints: 0,
      learningKnowledgePoints: 0,
      weakKnowledgePoints: 0,
      activeWrongQuestions: 0,
      completedReviews: 0,
    }))
    next.mastery = { totalKnowledgePoints: 0, notStarted: 0, weak: 0, learning: 0, mastered: 0 }
    next.weakKnowledge = { totalCount: 0, items: [] }
    next.wrongBook = { activeCount: 0, resolvedCount: 0, repeatedWrongCount: 0, recentItems: [] }
    next.review = { pendingCount: 0, completedCount: 0, recentCompletedCount: 0 }
    next.dailyPlan = { completedTasks: 0, totalTasks: 0, days: [] }
    next.activity = {
      activeDays: 0,
      lessonCompletedCount: 0,
      assessmentCompletedCount: 0,
      reviewCompletedCount: 0,
      wrongQuestionResolvedCount: 0,
      recentItems: [],
    }
    next.trend = { points: [], hasData: false, description: '开发场景没有学习记录。' }
    next.growth = {
      knowledgeEnergy: 0,
      growthLevel: 1,
      progressToNextLevel: 0,
      earnedInRange: 0,
      isSampleDerived: false,
    }
    next.achievements = {
      unlockedCount: 0,
      totalCount: next.achievements.totalCount,
      recentlyUnlocked: [],
      isSampleDerived: false,
    }
  }
  if (scenario === 'no-wrong-book') {
    next.overview.activeWrongQuestions = 0
    next.overview.resolvedWrongQuestions = 0
    next.wrongBook = { activeCount: 0, resolvedCount: 0, repeatedWrongCount: 0, recentItems: [] }
    next.activity.wrongQuestionResolvedCount = 0
    next.activity.recentItems = next.activity.recentItems.filter(
      (item) => item.type !== 'wrong_question_resolved',
    )
  }
  if (scenario === 'no-review') {
    next.overview.completedReviews = 0
    next.review = { pendingCount: 0, completedCount: 0, recentCompletedCount: 0 }
    next.activity.reviewCompletedCount = 0
    next.activity.recentItems = next.activity.recentItems.filter(
      (item) => item.type !== 'review_completed',
    )
  }
  if (scenario === 'unverified') {
    next.flags.containsUnverifiedContent = true
    addDiagnostic(next.diagnostics, '开发场景：展示未审核数据提示。')
  }
  if (scenario === 'weak-heavy')
    addDiagnostic(next.diagnostics, '开发场景：展示待巩固内容密集状态。')
  if (scenario === 'partial') addDiagnostic(next.diagnostics, '开发场景：部分数据源读取失败。')
  return next
}

export function buildParentReportId(
  profileId: Id,
  startDate: string,
  endDate: string,
  reportVersion: string = PARENT_REPORT_VERSION,
): Id {
  return `parent-report:${profileId}:${startDate}:${endDate}:${reportVersion}`
}

export class ParentReportService {
  private lastWarning: string | null = null

  constructor(
    private readonly dependencies: ParentReportServiceDependencies = defaultDependencies,
  ) {}

  async buildReport(profileId: Id, options: ParentReportOptions = {}): Promise<ParentReport> {
    const dataset = options.dataset ?? 'profile'
    const selectedSubject = options.subject ?? 'ALL'
    const now = safeNow(options.now)
    const diagnostics: string[] = []
    const profile = profileForReport(profileId, dataset, options.profile)
    if (options.profile && options.profile.studentId !== profileId) {
      addDiagnostic(diagnostics, '报告已忽略与当前档案不匹配的教材配置。')
    }
    const includeSample = dataset === 'demo'
    const demoFacts: ParentReportDemoFacts | undefined =
      dataset === 'demo' ? options.demoFacts : undefined

    const historyRaw = readSource(
      '学习记录',
      () =>
        demoFacts?.history ??
        this.dependencies.historyService.listByProfile(profileId, { includeSample }),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.historyService, diagnostics)
    const wrongBookRaw = readSource(
      '错题本',
      () =>
        demoFacts?.wrongBook ??
        this.dependencies.wrongBookService.listByProfile(profileId, {
          includeResolved: true,
          includeSample,
        }),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.wrongBookService, diagnostics)
    const reviewQueueRaw = readSource(
      '待巩固列表',
      () =>
        demoFacts?.reviewQueue ??
        this.dependencies.reviewQueueService.listByProfile(profileId, {
          includeCompleted: true,
          includeSample,
        }),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.reviewQueueService, diagnostics)
    const masteryRaw = readSource(
      '掌握度记录',
      () => demoFacts?.mastery ?? this.dependencies.masteryRepository.getMasteryRecords(profileId),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.masteryRepository, diagnostics)
    const evidenceRaw = readSource(
      '学习证据',
      () => demoFacts?.evidence ?? this.dependencies.masteryRepository.getEvidence(profileId),
      diagnostics,
      [],
    )
    const rewardsRaw = readSource(
      '成长记录',
      () =>
        demoFacts?.rewards ??
        this.dependencies.rewardService.listByProfile(profileId, { includeSample }),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.rewardService, diagnostics)
    const definitions = readSource(
      '成长成就定义',
      () => this.dependencies.achievementService.listDefinitions(),
      diagnostics,
      [],
    )
    const unlocksRaw = readSource(
      '成长成就记录',
      () =>
        demoFacts?.unlocks ??
        this.dependencies.achievementService.listUnlocks(profileId, includeSample),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.achievementService, diagnostics)
    const dailyPlans = readSource(
      '今日学习计划记录',
      () => demoFacts?.dailyPlans ?? this.dependencies.dailyPlanStorage.loadAll(),
      diagnostics,
      [],
    )
    if (!demoFacts) readWarning(this.dependencies.dailyPlanStorage, diagnostics)

    const history = historyRaw.filter(
      (record) => record.profileId === profileId && factAllowed(record.provenance, dataset),
    )
    const participationHistory = historyRaw.filter((record) =>
      participationAllowed(record, profileId, dataset),
    )
    const wrongBook = wrongBookRaw.filter(
      (record) => record.profileId === profileId && factAllowed(record.provenance, dataset),
    )
    const reviewQueue = reviewQueueRaw.filter(
      (item) => item.profileId === profileId && factAllowed(item.provenance, dataset),
    )
    const mastery = masteryRaw.filter(
      (record) => record.studentProfileId === profileId && masteryAllowed(record, dataset),
    )
    const evidence = evidenceRaw.filter(
      (item) =>
        dataset === 'demo' ||
        (item.metadata?.isSample !== true &&
          !UNSAFE_STATUSES.has(item.metadata?.sourceVerificationStatus ?? '')),
    )
    const rewards = rewardsRaw.filter(
      (event) => event.profileId === profileId && factAllowed(event.provenance, dataset),
    )
    const unlocks = unlocksRaw.filter(
      (unlock) => unlock.profileId === profileId && factAllowed(unlock.provenance, dataset),
    )

    const allDateCandidates = [
      ...participationHistory.map((item) => item.occurredAt),
      ...wrongBook.flatMap((item) => [item.firstWrongAt, item.lastWrongAt, item.resolvedAt ?? '']),
      ...reviewQueue.flatMap((item) => [item.completedAt ?? '']),
      ...rewards.map((item) => item.occurredAt),
      ...unlocks.map((item) => item.unlockedAt),
      ...dailyPlans.filter((plan) => plan.profileId === profileId).map((plan) => plan.dateKey),
    ]
      .map((value) => dateKeyFromValue(value) ?? (validDateKey(value) ? value : null))
      .filter((value): value is string => Boolean(value))
    const range = resolveRange(options.range, now, allDateCandidates)

    const textbookSubjects = new Map<Id, SubjectCode>()
    const profileTextbooks = textbookIdsForProfile(profile)
    for (const subject of SUBJECT_CODES) {
      const textbookId = profileTextbooks[subject]
      if (textbookId) textbookSubjects.set(textbookId, subject)
    }
    for (const record of participationHistory) {
      const subject = subjectFromTextbookId(record.textbookId, textbookSubjects)
      if (subject) textbookSubjects.set(record.textbookId, subject)
    }
    for (const record of wrongBook) {
      for (const textbookId of [
        ...(record.textbookId ? [record.textbookId] : []),
        ...(record.textbookIds ?? []),
      ]) {
        const subject = subjectFromTextbookId(textbookId, textbookSubjects)
        if (subject) textbookSubjects.set(textbookId, subject)
      }
    }
    for (const item of reviewQueue) {
      const subject = subjectFromTextbookId(item.textbookId, textbookSubjects)
      if (subject) textbookSubjects.set(item.textbookId, subject)
    }
    if (dataset === 'demo' && !textbookSubjects.has(phase14DemoTextbookId)) {
      textbookSubjects.set(phase14DemoTextbookId, 'MATH')
    }

    const textbookIds = new Set<Id>([
      ...Object.values(profileTextbooks).filter((value): value is Id => Boolean(value)),
      ...participationHistory.map((item) => item.textbookId),
      ...wrongBook.flatMap((item) =>
        [item.textbookId, ...(item.textbookIds ?? [])].filter((value): value is Id =>
          Boolean(value),
        ),
      ),
      ...reviewQueue.map((item) => item.textbookId),
    ])
    if (dataset === 'demo' && textbookIds.size === 0) textbookIds.add(phase14DemoTextbookId)

    const maps: MapContext[] = []
    const participationSources = new Map<Id, LearningMapCurriculumSource>()
    const strategyRecommendations: Array<{
      knowledgePointId: Id
      priority: number
      isSampleDerived: boolean
      evidenceSourceStatus: MasteryRecord['evidenceSourceStatus']
    }> = []
    for (const requestedTextbookId of [...textbookIds].sort()) {
      const source = await readAsyncSource(
        '知识地图',
        () =>
          this.dependencies.mapRepository.getMapSource({
            dataset: dataset === 'demo' ? 'demo' : 'profile',
            textbookId: requestedTextbookId,
          }),
        diagnostics,
        null,
      )
      if (!source) continue
      if (
        source.textbook.id === requestedTextbookId &&
        (dataset === 'demo' || (!source.isSample && !source.textbook.isSample)) &&
        source.verificationStatus !== 'REJECTED' &&
        source.textbook.verificationStatus !== 'REJECTED'
      ) {
        participationSources.set(source.textbook.id, source)
        textbookSubjects.set(source.textbook.id, source.textbook.subject)
      }
      if (sourceHasUnverifiedContent(source))
        addDiagnostic(diagnostics, `知识地图 ${source.textbook.id} 含有未审核内容。`)
      if (!sourceAllowed(source, dataset)) {
        addDiagnostic(diagnostics, `知识地图 ${source.textbook.id} 当前不计入正式报告。`)
        continue
      }
      const progressRecords = readSource(
        '知识地图进度',
        () => this.dependencies.progressStorage.load(source.textbook.id, { profileId, dataset }),
        diagnostics,
        [],
      )
      let viewModel: LearningMapViewModel
      try {
        viewModel = buildLearningMapViewModel(source, progressRecords, {
          dataset,
          isReadOnly: true,
          masteryRecords: mastery,
        })
      } catch (caught) {
        addDiagnostic(
          diagnostics,
          caught instanceof Error ? `知识地图整理失败：${caught.message}` : '知识地图整理失败。',
        )
        continue
      }
      const subject = source.textbook.subject
      textbookSubjects.set(source.textbook.id, subject)
      maps.push({ subject, textbookId: source.textbook.id, source, viewModel, progressRecords })
    }

    for (const map of maps) {
      try {
        const recommendation = this.dependencies.strategyService.resolve({
          studentProfileId: profileId,
          currentTextbookId: map.textbookId,
          masteryRecords: mastery,
          mapNodes: toStrategyMapNodes(map.viewModel),
          knowledgeRelations: toStrategyKnowledgeRelations(map.viewModel),
          learningMapProgress: map.progressRecords,
          learningEvidence: evidence,
          questionHistory: [],
          dataset,
        })
        strategyRecommendations.push(...recommendation.reviewRecommendations)
      } catch (caught) {
        addDiagnostic(
          diagnostics,
          caught instanceof Error
            ? `学习策略暂时无法读取：${caught.message}`
            : '学习策略暂时无法读取。',
        )
      }
    }

    const facts: ReadFacts = {
      history,
      wrongBook,
      reviewQueue,
      mastery,
      evidence,
      rewards,
      definitions,
      unlocks,
      dailyPlans,
      maps,
    }
    const report = this.composeReport(
      profileId,
      profile,
      dataset,
      selectedSubject,
      range,
      now,
      facts,
      strategyRecommendations,
      diagnostics,
    )
    this.lastWarning = diagnostics[0] ?? null
    report.participation = projectParticipation(
      participationHistory,
      range,
      selectedSubject,
      participationSources,
      textbookSubjects,
    )
    return applyDemoScenario(report, options.demoScenario)
  }

  async loadReport(profileId: Id, options: ParentReportOptions = {}): Promise<ParentReport> {
    return this.buildReport(profileId, options)
  }

  getLastWarning(): string | null {
    return this.lastWarning
  }

  private composeReport(
    profileId: Id,
    profile: StudentCurriculumProfile | undefined,
    dataset: ParentReportDataset,
    selectedSubject: ParentReportSubjectFilter,
    range: ParentReportRange,
    now: Date,
    facts: ReadFacts,
    strategyRecommendations: Array<{
      knowledgePointId: Id
      priority: number
      isSampleDerived: boolean
      evidenceSourceStatus: MasteryRecord['evidenceSourceStatus']
    }>,
    diagnostics: string[],
  ): ParentReport {
    const knowledgeInfo = new Map<Id, MapKnowledgeInfo>()
    for (const map of facts.maps) {
      for (const island of map.viewModel.islands) {
        for (const lesson of island.lessons) {
          for (const node of lesson.nodes) {
            if (!knowledgeInfo.has(node.knowledgePointId)) {
              knowledgeInfo.set(node.knowledgePointId, {
                name: node.title,
                subject: map.subject,
                textbookId: map.textbookId,
                lessonId: node.lessonId,
                unitId: node.unitId,
              })
            }
          }
        }
      }
    }
    const mapTextbookSubjects = new Map<Id, SubjectCode>()
    for (const map of facts.maps) mapTextbookSubjects.set(map.textbookId, map.subject)
    const profileTextbooks = textbookIdsForProfile(profile)
    for (const subject of SUBJECT_CODES) {
      const textbookId = profileTextbooks[subject]
      if (textbookId && !mapTextbookSubjects.has(textbookId)) {
        mapTextbookSubjects.set(textbookId, subject)
      }
    }
    const subjectForTextbook = (textbookId: Id | undefined): ParentReportSubject | undefined =>
      subjectFromTextbookId(textbookId, mapTextbookSubjects)
    const historyInRange = facts.history.filter((record) => inRange(record.occurredAt, range))
    const completedHistory = historyInRange.filter(
      (record) => record.type === 'lesson_completed' || record.type === 'assessment_completed',
    )
    const activeWrong = facts.wrongBook.filter((record) => record.status === 'active')
    const resolvedWrongInRange = facts.wrongBook.filter(
      (record) => record.status === 'resolved' && inRange(record.resolvedAt, range),
    )
    const activeReview = facts.reviewQueue.filter((item) => item.status === 'active')
    const completedReviewInRange = facts.reviewQueue.filter(
      (item) => item.status === 'completed' && inRange(item.completedAt, range),
    )
    const filteredHistory = completedHistory.filter((record) =>
      subjectMatches(subjectForTextbook(record.textbookId), selectedSubject),
    )
    const filteredActiveWrong = activeWrong.filter((record) =>
      subjectMatches(subjectForWrong(record, knowledgeInfo, mapTextbookSubjects), selectedSubject),
    )
    const filteredResolvedWrong = resolvedWrongInRange.filter((record) =>
      subjectMatches(subjectForWrong(record, knowledgeInfo, mapTextbookSubjects), selectedSubject),
    )
    const filteredActiveReview = activeReview.filter((item) =>
      subjectMatches(subjectForReview(item, mapTextbookSubjects), selectedSubject),
    )
    const filteredCompletedReview = completedReviewInRange.filter((item) =>
      subjectMatches(subjectForReview(item, mapTextbookSubjects), selectedSubject),
    )

    const masteryByKnowledgePoint = new Map<Id, MasteryRecord>()
    for (const record of facts.mastery) {
      if (!masteryByKnowledgePoint.has(record.knowledgePointId))
        masteryByKnowledgePoint.set(record.knowledgePointId, record)
    }
    const masteryForFilter = facts.mastery.filter((record) =>
      subjectMatches(knowledgeInfo.get(record.knowledgePointId)?.subject, selectedSubject),
    )
    const mastery = {
      totalKnowledgePoints: masteryForFilter.length,
      notStarted: masteryForFilter.filter((record) => record.state === 'not_started').length,
      weak: masteryForFilter.filter((record) => record.state === 'weak').length,
      learning: masteryForFilter.filter((record) => record.state === 'learning').length,
      mastered: masteryForFilter.filter((record) => record.state === 'mastered').length,
    }

    const strategyByKnowledgePoint = new Map<Id, { priority: number; isSampleDerived: boolean }>()
    for (const recommendation of strategyRecommendations) {
      const existing = strategyByKnowledgePoint.get(recommendation.knowledgePointId)
      if (!existing || recommendation.priority < existing.priority) {
        strategyByKnowledgePoint.set(recommendation.knowledgePointId, {
          priority: recommendation.priority,
          isSampleDerived: recommendation.isSampleDerived,
        })
      }
    }
    const activeWrongCountByKnowledgePoint = new Map<Id, number>()
    for (const record of filteredActiveWrong) {
      for (const knowledgePointId of record.knowledgePointIds) {
        activeWrongCountByKnowledgePoint.set(
          knowledgePointId,
          (activeWrongCountByKnowledgePoint.get(knowledgePointId) ?? 0) + 1,
        )
      }
    }
    const activeReviewByKnowledgePoint = new Set(
      filteredActiveReview.map((item) => item.knowledgePointId),
    )
    const weakCandidateIds = new Set<Id>([
      ...masteryForFilter
        .filter((record) => record.state === 'weak')
        .map((record) => record.knowledgePointId),
      ...activeReviewByKnowledgePoint,
      ...[...strategyByKnowledgePoint.keys()].filter((knowledgePointId) =>
        subjectMatches(knowledgeInfo.get(knowledgePointId)?.subject, selectedSubject),
      ),
    ])
    const weakItems = [...weakCandidateIds]
      .map((knowledgePointId) => {
        const record = masteryByKnowledgePoint.get(knowledgePointId)
        const info = knowledgeInfo.get(knowledgePointId)
        const strategy = strategyByKnowledgePoint.get(knowledgePointId)
        const subject: ParentReportSubject = info?.subject ?? 'UNKNOWN'
        return {
          knowledgePointId,
          name: info?.name ?? knowledgePointId,
          subject,
          masteryScore: record?.masteryScore ?? 0,
          confidence: record?.confidence ?? 0,
          state: record?.state ?? 'learning',
          ...(record?.evidenceSourceStatus
            ? { evidenceSourceStatus: record.evidenceSourceStatus }
            : {}),
          activeWrongQuestionCount: activeWrongCountByKnowledgePoint.get(knowledgePointId) ?? 0,
          hasReviewRecommendation:
            activeReviewByKnowledgePoint.has(knowledgePointId) || Boolean(strategy),
          ...(strategy ? { strategyPriority: strategy.priority } : {}),
          ...(info?.textbookId ? { textbookId: info.textbookId } : {}),
        }
      })
      .filter((item) => subjectMatches(item.subject, selectedSubject))
      .sort(
        (left, right) =>
          (left.strategyPriority ?? Number.MAX_SAFE_INTEGER) -
            (right.strategyPriority ?? Number.MAX_SAFE_INTEGER) ||
          Number(right.state === 'weak') - Number(left.state === 'weak') ||
          left.masteryScore - right.masteryScore ||
          left.knowledgePointId.localeCompare(right.knowledgePointId),
      )
    const weakKnowledge = { totalCount: weakItems.length, items: weakItems.slice(0, 5) }

    const wrongBookItems = facts.wrongBook
      .filter((record) =>
        subjectMatches(
          subjectForWrong(record, knowledgeInfo, mapTextbookSubjects),
          selectedSubject,
        ),
      )
      .sort(
        (left, right) =>
          compareDateDesc(left.lastWrongAt, right.lastWrongAt) ||
          right.wrongCount - left.wrongCount ||
          left.questionId.localeCompare(right.questionId),
      )
      .slice(0, 5)
      .map((record) => ({
        questionId: record.questionId,
        ...(record.knowledgePointIds[0] ? { knowledgePointId: record.knowledgePointIds[0] } : {}),
        ...(subjectForWrong(record, knowledgeInfo, mapTextbookSubjects)
          ? { subject: subjectForWrong(record, knowledgeInfo, mapTextbookSubjects) }
          : {}),
        wrongCount: record.wrongCount,
        status: record.status,
        lastWrongAt: record.lastWrongAt,
        ...(record.resolvedAt ? { resolvedAt: record.resolvedAt } : {}),
      }))

    const planRecords = facts.dailyPlans
      .filter((plan) => plan.profileId === profileId && plan.dataset === dataset)
      .filter((plan) => plan.dateKey >= range.startDate && plan.dateKey <= range.endDate)
    const dailyPlanDays = planRecords
      .sort(
        (left, right) =>
          left.dateKey.localeCompare(right.dateKey) || left.id.localeCompare(right.id),
      )
      .map((plan) => {
        const tasks = plan.tasks.filter(
          (task) => task.status !== 'unavailable' && subjectMatches(task.subject, selectedSubject),
        )
        const completed = tasks.filter((task) => task.status === 'completed').length
        const total = tasks.length
        return {
          dateKey: plan.dateKey,
          completed,
          total,
          percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
        }
      })
    const dailyPlan = {
      completedTasks: dailyPlanDays.reduce((total, item) => total + item.completed, 0),
      totalTasks: dailyPlanDays.reduce((total, item) => total + item.total, 0),
      days: dailyPlanDays,
    }

    const activity: ParentActivityItem[] = [
      ...filteredHistory.map((record) => ({
        id: record.id,
        type:
          record.type === 'lesson_completed'
            ? ('lesson_completed' as const)
            : ('assessment_completed' as const),
        title: historyTitle(record.type),
        subject: subjectForTextbook(record.textbookId),
        occurredAt: record.occurredAt,
        ...(record.summary ? { summary: cloneActivitySummary(record.summary) } : {}),
      })),
      ...filteredCompletedReview.map((item) => ({
        id: item.id,
        type: 'review_completed' as const,
        title: '完成一次待巩固',
        subject: subjectForReview(item, mapTextbookSubjects),
        occurredAt: item.completedAt ?? EMPTY_DATE,
      })),
      ...filteredResolvedWrong.map((item) => ({
        id: item.id,
        type: 'wrong_question_resolved' as const,
        title: '解决一道错题',
        subject: subjectForWrong(item, knowledgeInfo, mapTextbookSubjects),
        occurredAt: item.resolvedAt ?? EMPTY_DATE,
      })),
    ]
      .filter((item) => item.occurredAt !== EMPTY_DATE)
      .sort(
        (left, right) =>
          compareDateDesc(left.occurredAt, right.occurredAt) || left.id.localeCompare(right.id),
      )
    const activitySummary = {
      activeDays: new Set(activity.map((item) => dateKeyFromValue(item.occurredAt)).filter(Boolean))
        .size,
      lessonCompletedCount: activity.filter((item) => item.type === 'lesson_completed').length,
      assessmentCompletedCount: activity.filter((item) => item.type === 'assessment_completed')
        .length,
      reviewCompletedCount: activity.filter((item) => item.type === 'review_completed').length,
      wrongQuestionResolvedCount: activity.filter((item) => item.type === 'wrong_question_resolved')
        .length,
      recentItems: activity.slice(0, 8),
    }

    const growthResult = growthLevelForEnergy(sumRewardEvents(facts.rewards), DEFAULT_GROWTH_POLICY)
    const growth: ParentGrowthSummary = {
      knowledgeEnergy: Math.max(0, sumRewardEvents(facts.rewards)),
      growthLevel: growthResult.level,
      progressToNextLevel: growthResult.progress,
      ...(growthResult.nextThreshold !== undefined
        ? { nextLevelThreshold: growthResult.nextThreshold }
        : {}),
      earnedInRange: sumRewardEvents(
        facts.rewards.filter((event) => inRange(event.occurredAt, range)),
      ),
      isSampleDerived: facts.rewards.some((event) => event.provenance.isSampleDerived),
    }

    const definitionById = new Map(
      facts.definitions.map((definition) => [definition.id, definition]),
    )
    const uniqueUnlocks = [
      ...new Map(facts.unlocks.map((unlock) => [unlock.achievementId, unlock])).values(),
    ]
    const recentlyUnlocked = uniqueUnlocks
      .filter((unlock) => inRange(unlock.unlockedAt, range))
      .sort(
        (left, right) =>
          compareDateDesc(left.unlockedAt, right.unlockedAt) || left.id.localeCompare(right.id),
      )
      .slice(0, 3)
      .map((unlock) => ({
        id: unlock.achievementId,
        title: definitionById.get(unlock.achievementId)?.title ?? unlock.achievementId,
        unlockedAt: unlock.unlockedAt,
      }))
    const achievements: ParentAchievementSummary = {
      unlockedCount: uniqueUnlocks.length,
      totalCount: facts.definitions.length,
      recentlyUnlocked,
      isSampleDerived: facts.unlocks.some((unlock) => unlock.provenance.isSampleDerived),
    }

    const trend = buildTrend(range, activity, dailyPlan.days)
    const flags = buildFlags(
      dataset,
      facts.history,
      facts.wrongBook,
      facts.reviewQueue,
      facts.mastery,
      facts.rewards,
      facts.unlocks,
      facts.maps,
    )
    const completedLessons = filteredHistory.filter(
      (record) => record.type === 'lesson_completed',
    ).length
    const completedAssessments = filteredHistory.filter(
      (record) => record.type === 'assessment_completed',
    ).length
    const overview = {
      learningDays: activitySummary.activeDays,
      completedLessons,
      completedAssessments,
      completedDailyTasks: dailyPlan.completedTasks,
      totalDailyTasks: dailyPlan.totalTasks,
      activeWrongQuestions: filteredActiveWrong.length,
      resolvedWrongQuestions: facts.wrongBook
        .filter((record) => record.status === 'resolved')
        .filter((record) =>
          subjectMatches(
            subjectForWrong(record, knowledgeInfo, mapTextbookSubjects),
            selectedSubject,
          ),
        ).length,
      completedReviews: filteredCompletedReview.length,
      masteredKnowledgePoints: masteryForFilter.filter((record) => record.state === 'mastered')
        .length,
    }

    const subjects = SUBJECT_CODES.map((subject) => {
      const history = filteredHistory.filter(
        (record) => subjectForTextbook(record.textbookId) === subject,
      )
      const masteryRecords = facts.mastery.filter(
        (record) => knowledgeInfo.get(record.knowledgePointId)?.subject === subject,
      )
      const wrong = filteredActiveWrong.filter(
        (record) => subjectForWrong(record, knowledgeInfo, mapTextbookSubjects) === subject,
      )
      const review = filteredCompletedReview.filter(
        (item) => subjectForReview(item, mapTextbookSubjects) === subject,
      )
      const pendingReview = filteredActiveReview.filter(
        (item) => subjectForReview(item, mapTextbookSubjects) === subject,
      )
      const resolvedWrong = filteredResolvedWrong.filter(
        (record) => subjectForWrong(record, knowledgeInfo, mapTextbookSubjects) === subject,
      )
      const summary = {
        subject,
        hasData:
          history.length > 0 ||
          masteryRecords.length > 0 ||
          wrong.length > 0 ||
          resolvedWrong.length > 0 ||
          review.length > 0 ||
          pendingReview.length > 0,
        completedLessons: history.filter((record) => record.type === 'lesson_completed').length,
        completedAssessments: history.filter((record) => record.type === 'assessment_completed')
          .length,
        masteredKnowledgePoints: masteryRecords.filter((record) => record.state === 'mastered')
          .length,
        learningKnowledgePoints: masteryRecords.filter((record) => record.state === 'learning')
          .length,
        weakKnowledgePoints: masteryRecords.filter((record) => record.state === 'weak').length,
        activeWrongQuestions: wrong.length,
        completedReviews: review.length,
      }
      return summary
    })

    return {
      id: buildParentReportId(profileId, range.startDate, range.endDate, PARENT_REPORT_VERSION),
      profile: profileSummary(profileId, profile),
      profileId,
      range,
      generatedAt: isoFor(now),
      overview,
      subjects,
      mastery,
      weakKnowledge,
      wrongBook: {
        activeCount: filteredActiveWrong.length,
        resolvedCount: facts.wrongBook
          .filter((record) => record.status === 'resolved')
          .filter((record) =>
            subjectMatches(
              subjectForWrong(record, knowledgeInfo, mapTextbookSubjects),
              selectedSubject,
            ),
          ).length,
        repeatedWrongCount: facts.wrongBook
          .filter((record) => record.wrongCount > 1)
          .filter((record) =>
            subjectMatches(
              subjectForWrong(record, knowledgeInfo, mapTextbookSubjects),
              selectedSubject,
            ),
          ).length,
        recentItems: wrongBookItems,
      },
      review: {
        pendingCount: filteredActiveReview.length,
        completedCount: facts.reviewQueue
          .filter((item) => item.status === 'completed')
          .filter((item) =>
            subjectMatches(subjectForReview(item, mapTextbookSubjects), selectedSubject),
          ).length,
        recentCompletedCount: filteredCompletedReview.length,
      },
      dailyPlan,
      activity: activitySummary,
      participation: emptyParticipation(),
      growth,
      achievements,
      trend,
      flags,
      reportVersion: PARENT_REPORT_VERSION,
      subjectFilter: selectedSubject,
      diagnostics: [...diagnostics],
    }
  }
}

export const parentReportService = new ParentReportService()

export function createParentReportService(
  overrides: Partial<ParentReportServiceDependencies> = {},
): ParentReportService {
  return new ParentReportService({ ...defaultDependencies, ...overrides })
}
