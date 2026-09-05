import { createPhase13DemoRewardFacts } from '@/data/reward/demo'
import {
  phase14DemoLessonSession,
  phase14DemoQuestionSession,
  phase14DemoReviewRecommendation,
} from '@/data/home'
import { subjectTheme } from '@/data/subjectTheme'
import type {
  AchievementEvaluationResult,
  DailyLearningPlan,
  GrowthServiceContract,
  HomeDataset,
  HomeLoadOptions,
  HomeMapSnapshot,
  HomeStrategySnapshot,
  HomeViewModel,
  Id,
  LearningEvidence,
  LearningHistoryRecord,
  LearningMapProgressRecord,
  LearningMapViewModel,
  LessonSession,
  MasteryRecord,
  ReviewQueueItem,
  StudentCurriculumProfile,
  SubjectCode,
  TextbookDisplay,
  WrongQuestionRecord,
} from '@/types'

import { learningMapRepository } from '@/services/learning-map/learningMapRepository'
import {
  buildLearningMapViewModel,
  createLearningMapProgressStorage,
} from '@/services/learning-map'
import type { LearningMapProgressStorage, LearningMapRepository } from '@/services/learning-map'
import { masteryRepository } from '@/services/mastery/masteryRepository'
import type { MasteryRepository } from '@/services/mastery/masteryRepository'
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
import type { CurriculumService } from '@/services/contracts'
import { lessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import type { LessonSessionStorage } from '@/services/lesson-player/lessonSessionStorage'
import { questionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import type { QuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import { reviewQueueService, type ReviewQueueService } from '@/services/review-queue'
import { rewardService, type RewardServiceContract } from '@/services/reward'
import { growthService } from '@/services/growth'
import { achievementService } from '@/services/achievement'
import type { AchievementService } from '@/services/achievement/achievementService'
import { curriculumService } from '@/services/runtime'
import { wrongBookService, type WrongBookService } from '@/services/wrong-book'

import { getLocalDateKey, projectDailyPlan } from './dailyPlanProjection'
import { dailyPlanService, type DailyPlanServiceContract } from './dailyPlanService'
import type { HomeLessonSessionReader, HomeQuestionSessionReader } from './homeSessionReaders'
import { homeLessonSessionReader, homeQuestionSessionReader } from './homeSessionReaders'

const SUBJECT_CODES: SubjectCode[] = ['CHINESE', 'MATH', 'ENGLISH']
const DEMO_TEXTBOOK_ID = 'DEMO_TEXTBOOK_MATH_G3_S1'
const UNSAFE_STATUSES = new Set(['SAMPLE', 'UNVERIFIED', 'REJECTED'])

export interface HomeServiceDependencies {
  curriculum: CurriculumService
  mapRepository: LearningMapRepository
  progressStorage: LearningMapProgressStorage
  masteryRepository: MasteryRepository
  strategyService: LearningStrategyServiceContract
  historyService: LearningHistoryServiceContract
  wrongBookService: WrongBookService
  reviewQueueService: ReviewQueueService
  growthService: GrowthServiceContract
  achievementService: AchievementService
  rewardService: RewardServiceContract
  dailyPlanService: DailyPlanServiceContract
  lessonSessionStorage: LessonSessionStorage
  questionSessionStorage: QuestionSessionStorage
  lessonSessionReader: HomeLessonSessionReader
  questionSessionReader: HomeQuestionSessionReader
}

const defaultDependencies: HomeServiceDependencies = {
  curriculum: curriculumService,
  mapRepository: learningMapRepository,
  progressStorage: createLearningMapProgressStorage(),
  masteryRepository,
  strategyService: learningStrategyService,
  historyService: learningHistoryService,
  wrongBookService,
  reviewQueueService,
  growthService,
  achievementService,
  rewardService,
  dailyPlanService,
  lessonSessionStorage,
  questionSessionStorage,
  lessonSessionReader: homeLessonSessionReader,
  questionSessionReader: homeQuestionSessionReader,
}

function subjectTextbookIds(profile: StudentCurriculumProfile): Record<SubjectCode, Id | null> {
  return {
    CHINESE: profile.chineseTextbookVersionId,
    MATH: profile.mathTextbookVersionId,
    ENGLISH: profile.englishTextbookVersionId,
  }
}

function safeDate(value: HomeLoadOptions['now']): Date {
  const candidate =
    value instanceof Date ? new Date(value.getTime()) : new Date(value ?? Date.now())
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate
}

function safeIso(value: HomeLoadOptions['now'], date: Date): string {
  if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return value
  return date.toISOString()
}

function isFormalRecord(record: {
  isSampleDerived: boolean
  verificationStatus?: string
}): boolean {
  return !record.isSampleDerived && !UNSAFE_STATUSES.has(record.verificationStatus ?? '')
}

function findMapNode(viewModel: LearningMapViewModel | null, nodeId: Id | undefined) {
  if (!viewModel || !nodeId) return null
  for (const island of viewModel.islands) {
    for (const lesson of island.lessons) {
      const node = lesson.nodes.find((candidate) => candidate.id === nodeId)
      if (node) return { node, lesson }
    }
  }
  return null
}

function subjectForTextbook(textbookId: Id, maps: readonly HomeMapSnapshot[]): SubjectCode {
  const map = maps.find((candidate) => candidate.textbookId === textbookId)
  if (map) return map.subject
  const normalized = textbookId.toUpperCase()
  if (normalized.includes('CHINESE') || normalized.includes('语文')) return 'CHINESE'
  if (normalized.includes('ENGLISH') || normalized.includes('英语')) return 'ENGLISH'
  return 'MATH'
}

function displayNameFor(profileId: Id, displayName?: string): string {
  const cleaned = displayName?.trim()
  if (cleaned) return cleaned
  return profileId === 'local-profile' ? '小岛探险家' : '同学'
}

function addWarning(warnings: string[], warning: string | null | undefined): void {
  if (warning && !warnings.includes(warning)) warnings.push(warning)
}

function statusLabelForMap(
  snapshot: HomeMapSnapshot,
): HomeViewModel['subjects'][number]['mapStatus'] {
  if (snapshot.isSample) return 'sample'
  if (snapshot.isUnverified) return 'unverified'
  return snapshot.available ? 'available' : 'not_available'
}

function historyTitle(type: LearningHistoryRecord['type']): string {
  switch (type) {
    case 'lesson_started':
      return '开始学习一节课程'
    case 'lesson_completed':
      return '完成一节课程'
    case 'assessment_started':
      return '开始一次练习'
    case 'assessment_completed':
      return '完成一次练习'
  }
}

function mapHistoryRecords(
  records: readonly LearningHistoryRecord[],
  maps: readonly HomeMapSnapshot[],
): HomeViewModel['recentLearning'] {
  return [...records]
    .sort(
      (left, right) =>
        right.occurredAt.localeCompare(left.occurredAt) || left.id.localeCompare(right.id),
    )
    .slice(0, 6)
    .map((record) => ({
      id: record.id,
      type: record.type,
      title: historyTitle(record.type),
      subject: subjectForTextbook(record.textbookId, maps),
      textbookId: record.textbookId,
      knowledgePointId: record.knowledgePointId,
      occurredAt: record.occurredAt,
      ...(record.summary ? { summary: { ...record.summary } } : {}),
      isSample: record.provenance.isSampleDerived,
    }))
}

function filterHistory(
  records: readonly LearningHistoryRecord[],
  textbookIds: ReadonlySet<Id>,
  dataset: HomeDataset,
): LearningHistoryRecord[] {
  return records.filter(
    (record) =>
      textbookIds.has(record.textbookId) &&
      (dataset === 'demo' || isFormalRecord(record.provenance)),
  )
}

function filterWrongBook(
  records: readonly WrongQuestionRecord[],
  textbookIds: ReadonlySet<Id>,
  dataset: HomeDataset,
): WrongQuestionRecord[] {
  return records.filter((record) => {
    const recordTextbooks = new Set([
      ...(record.textbookId ? [record.textbookId] : []),
      ...(record.textbookIds ?? []),
    ])
    return (
      [...recordTextbooks].some((textbookId) => textbookIds.has(textbookId)) &&
      (dataset === 'demo' || isFormalRecord(record.provenance))
    )
  })
}

function filterReviewQueue(
  items: readonly ReviewQueueItem[],
  textbookIds: ReadonlySet<Id>,
  dataset: HomeDataset,
): ReviewQueueItem[] {
  return items.filter(
    (item) =>
      textbookIds.has(item.textbookId) && (dataset === 'demo' || isFormalRecord(item.provenance)),
  )
}

function filterMastery(records: readonly MasteryRecord[], dataset: HomeDataset): MasteryRecord[] {
  return records.filter(
    (record) =>
      dataset === 'demo' ||
      (!record.isSampleDerived &&
        record.evidenceSourceStatus !== 'SAMPLE' &&
        record.evidenceSourceStatus !== 'UNVERIFIED' &&
        record.evidenceSourceStatus !== 'MIXED'),
  )
}

function filterEvidence(
  records: readonly LearningEvidence[],
  dataset: HomeDataset,
): LearningEvidence[] {
  return records.filter(
    (record) =>
      dataset === 'demo' ||
      (record.metadata?.isSample !== true &&
        record.metadata?.sourceVerificationStatus !== 'SAMPLE' &&
        record.metadata?.sourceVerificationStatus !== 'UNVERIFIED'),
  )
}

function summaryForGrowth(
  summary: ReturnType<GrowthServiceContract['getSummary']> | null,
): HomeViewModel['growth'] {
  if (!summary) {
    return {
      knowledgeEnergy: 0,
      growthLevel: 1,
      progressToNextLevel: 0,
      isSampleDerived: false,
    }
  }
  return {
    knowledgeEnergy: summary.energy.current,
    growthLevel: summary.growth.growthLevel,
    progressToNextLevel: summary.growth.progressToNextLevel,
    ...(summary.nextLevelThreshold !== undefined
      ? { nextLevelThreshold: summary.nextLevelThreshold }
      : {}),
    isSampleDerived: summary.energy.provenance.isSampleDerived,
  }
}

function summaryForAchievement(
  result: AchievementEvaluationResult | null,
): HomeViewModel['achievement'] {
  if (!result) return undefined
  const next = result.progress
    .filter((item) => item.status === 'locked')
    .sort(
      (left, right) =>
        left.percentage - right.percentage ||
        left.definition.sort - right.definition.sort ||
        left.definition.id.localeCompare(right.definition.id),
    )[0]
  return {
    unlockedCount: result.progress.filter((item) => item.status === 'unlocked').length,
    totalCount: result.progress.length,
    ...(next
      ? {
          nextAchievement: {
            id: next.definition.id,
            title: next.definition.title,
            description: next.definition.description,
            percentage: next.percentage,
          },
        }
      : {}),
    isSampleDerived: result.facts.provenance.isSampleDerived,
  }
}

function shortcutPath(id: HomeViewModel['shortcuts'][number]['id'], dataset: HomeDataset): string {
  const prefix = dataset === 'demo' ? '/dev' : ''
  return {
    learning_map: `${prefix}/learning-map`,
    history: `${prefix}/history`,
    wrong_book: `${prefix}/wrong-book`,
    review_queue: `${prefix}/review-queue`,
    curriculum_settings: dataset === 'demo' ? '/dev/home' : '/curriculum-settings',
  }[id]
}

function buildShortcuts(
  dataset: HomeDataset,
  historyCount: number,
  wrongCount: number,
  reviewCount: number,
): HomeViewModel['shortcuts'] {
  return [
    {
      id: 'learning_map' as const,
      label: '知识岛地图',
      description: '自由探索已开放的知识点',
      icon: 'map',
      path: shortcutPath('learning_map', dataset),
    },
    {
      id: 'history' as const,
      label: '学习记录',
      description: '回看已经学过的内容',
      icon: 'book-open',
      path: shortcutPath('history', dataset),
      count: historyCount,
    },
    {
      id: 'wrong_book' as const,
      label: '错题本',
      description: '把错过的题再挑战一次',
      icon: 'circle-help',
      path: shortcutPath('wrong_book', dataset),
      count: wrongCount,
    },
    {
      id: 'review_queue' as const,
      label: '待巩固',
      description: '继续完成主动复习建议',
      icon: 'lightbulb',
      path: shortcutPath('review_queue', dataset),
      count: reviewCount,
    },
    {
      id: 'curriculum_settings' as const,
      label: '学习设置',
      description: '查看地区、年级和教材',
      icon: 'settings',
      path: shortcutPath('curriculum_settings', dataset),
    },
  ]
}

function continueViewModel(
  plan: DailyLearningPlan,
  sessions: readonly LessonSession[],
): HomeViewModel['continueLearning'] {
  const task = plan.tasks.find(
    (candidate) => candidate.type === 'continue_learning' && candidate.status === 'pending',
  )
  if (!task || task.action.type !== 'lesson' || !task.knowledgePointId || !task.lessonId)
    return undefined
  const session = sessions.find((candidate) => candidate.id === task.sourceId)
  const currentProgress = session
    ? session.status === 'completed'
      ? 100
      : Math.min(
          99,
          Math.round(
            (session.completedStepIds.length /
              Math.max(session.completedStepIds.length + 1, session.currentStepIndex + 1)) *
              100,
          ),
        )
    : 0
  return {
    taskId: task.id,
    subject: task.subject,
    title: task.title,
    lessonId: task.lessonId,
    knowledgePointId: task.knowledgePointId,
    progress: currentProgress,
    action: task.action,
  }
}

export class HomeService {
  constructor(private readonly dependencies: HomeServiceDependencies = defaultDependencies) {}

  async load(
    profile: StudentCurriculumProfile,
    options: HomeLoadOptions = {},
  ): Promise<HomeViewModel> {
    const dataset = options.dataset ?? 'profile'
    const date = safeDate(options.now)
    const now = safeIso(options.now, date)
    const dateKey = getLocalDateKey(date)
    const warnings: string[] = []
    const textbookIds = subjectTextbookIds(profile)
    if (dataset === 'demo') textbookIds.MATH = DEMO_TEXTBOOK_ID

    const [regions, grades, semesters] = await Promise.all([
      this.dependencies.curriculum.getRegions().catch((caught: unknown) => {
        addWarning(warnings, caught instanceof Error ? caught.message : '地区信息暂时无法读取。')
        return []
      }),
      this.dependencies.curriculum.getGrades().catch((caught: unknown) => {
        addWarning(warnings, caught instanceof Error ? caught.message : '年级信息暂时无法读取。')
        return []
      }),
      this.dependencies.curriculum.getSemesters().catch((caught: unknown) => {
        addWarning(warnings, caught instanceof Error ? caught.message : '学期信息暂时无法读取。')
        return []
      }),
    ])

    const displays = await Promise.all(
      SUBJECT_CODES.map(async (subjectCode) => {
        const textbookId = textbookIds[subjectCode]
        if (!textbookId || dataset === 'demo') return null
        try {
          return await this.dependencies.curriculum.getTextbookDisplay(textbookId)
        } catch (caught) {
          addWarning(
            warnings,
            caught instanceof Error ? caught.message : `${subjectCode} 教材信息暂时无法读取。`,
          )
          return null
        }
      }),
    )

    const masteryRecords = filterMastery(
      this.dependencies.masteryRepository.getMasteryRecords(profile.studentId),
      dataset,
    )
    const evidence = filterEvidence(
      this.dependencies.masteryRepository.getEvidence(profile.studentId),
      dataset,
    )
    addWarning(warnings, this.dependencies.masteryRepository.getLastWarning())

    const maps: HomeMapSnapshot[] = []
    for (const subjectCode of SUBJECT_CODES) {
      const textbookId = textbookIds[subjectCode]
      if (!textbookId) continue
      const mapDataset = dataset === 'demo' ? 'demo' : 'profile'
      let source = null
      try {
        source = await this.dependencies.mapRepository.getMapSource({
          dataset: mapDataset,
          textbookId,
        })
      } catch (caught) {
        addWarning(
          warnings,
          caught instanceof Error ? caught.message : `${subjectCode} 知识地图暂时无法读取。`,
        )
      }
      const verificationStatus = source?.verificationStatus ?? source?.textbook.verificationStatus
      const isSample = Boolean(
        source?.isSample || source?.textbook.isSample || verificationStatus === 'SAMPLE',
      )
      const isUnverified = verificationStatus === 'UNVERIFIED'
      const available = Boolean(
        source &&
        (dataset === 'demo' || (!isSample && !isUnverified && verificationStatus !== 'REJECTED')),
      )
      let progressRecords: LearningMapProgressRecord[] = []
      if (source) {
        try {
          progressRecords = this.dependencies.progressStorage.load(source.textbook.id)
        } catch (caught) {
          addWarning(warnings, caught instanceof Error ? caught.message : '地图进度暂时无法读取。')
        }
      }
      let viewModel: LearningMapViewModel | null = null
      if (source && available) {
        try {
          viewModel = buildLearningMapViewModel(source, progressRecords, {
            dataset: dataset === 'demo' ? 'demo' : 'profile',
            isReadOnly: dataset === 'demo',
            masteryRecords,
          })
        } catch (caught) {
          addWarning(warnings, caught instanceof Error ? caught.message : '知识地图暂时无法整理。')
        }
      }
      const mapSnapshot: HomeMapSnapshot = {
        subject: subjectCode,
        textbookId,
        source,
        viewModel,
        progressRecords,
        available,
        isSample,
        isUnverified,
        ...(verificationStatus ? { verificationStatus } : {}),
      }
      maps.push(mapSnapshot)
    }

    const textbookSet = new Set(Object.values(textbookIds).filter((id): id is Id => Boolean(id)))
    const includeSample = dataset === 'demo'
    const rawHistory = this.dependencies.historyService.listByProfile(profile.studentId, {
      includeSample,
    })
    const rawWrongBook = this.dependencies.wrongBookService.listByProfile(profile.studentId, {
      includeResolved: true,
      includeSample,
    })
    const rawReviewQueue = this.dependencies.reviewQueueService.listByProfile(profile.studentId, {
      includeCompleted: true,
      includeSample,
    })
    addWarning(warnings, this.dependencies.historyService.getLastWarning())
    addWarning(warnings, this.dependencies.wrongBookService.getLastWarning())
    addWarning(warnings, this.dependencies.reviewQueueService.getLastWarning())

    const history = filterHistory(rawHistory, textbookSet, dataset)
    const wrongBook = filterWrongBook(rawWrongBook, textbookSet, dataset)
    const reviewQueue = filterReviewQueue(rawReviewQueue, textbookSet, dataset)
    const lessonSessions = this.dependencies.lessonSessionReader
      .listByProfile(profile.studentId)
      .filter((session) => textbookSet.has(session.textbookId))
    addWarning(warnings, this.dependencies.lessonSessionStorage.getLastWarning())
    addWarning(warnings, this.dependencies.questionSessionStorage.getLastWarning())

    const strategies: HomeStrategySnapshot[] = []
    for (const map of maps) {
      if (!map.available || !map.viewModel) continue
      try {
        const mapNodes = toStrategyMapNodes(map.viewModel)
        const currentNode = map.viewModel.currentNodeId
          ? mapNodes.find((node) => node.id === map.viewModel?.currentNodeId)
          : undefined
        const recommendation = this.dependencies.strategyService.resolve(
          {
            studentProfileId: profile.studentId,
            currentTextbookId: map.textbookId,
            ...(currentNode
              ? {
                  currentMapNodeId: currentNode.id,
                  currentKnowledgePointId: currentNode.knowledgePointId,
                }
              : {}),
            masteryRecords,
            mapNodes,
            knowledgeRelations: toStrategyKnowledgeRelations(map.viewModel),
            learningMapProgress: map.progressRecords,
            learningEvidence: evidence,
            dataset,
          },
          { reviewLimit: 6 },
        )
        strategies.push({ subject: map.subject, textbookId: map.textbookId, recommendation })
      } catch (caught) {
        addWarning(warnings, caught instanceof Error ? caught.message : '学习建议暂时无法读取。')
      }
    }

    const dailyInput = {
      profileId: profile.studentId,
      dateKey,
      generatedAt: now,
      dataset,
      textbookIds,
      lessonSessions,
      strategies,
      reviewQueue,
      wrongBook,
      maps,
      history,
    } satisfies Parameters<typeof projectDailyPlan>[0]
    let dailyPlan: DailyLearningPlan
    try {
      dailyPlan = this.dependencies.dailyPlanService.getOrCreate(dailyInput, options.policy)
    } catch (caught) {
      addWarning(warnings, caught instanceof Error ? caught.message : '今日学习计划暂时无法保存。')
      dailyPlan = projectDailyPlan(dailyInput, options.policy)
    }
    addWarning(warnings, this.dependencies.dailyPlanService.getLastWarning())

    let growthResult: ReturnType<GrowthServiceContract['getSummary']> | null = null
    try {
      growthResult = this.dependencies.growthService.getSummary(profile.studentId, {
        dataset,
        includeSample,
        now,
      })
    } catch (caught) {
      addWarning(warnings, caught instanceof Error ? caught.message : '成长反馈暂时无法读取。')
    }
    addWarning(warnings, this.dependencies.growthService.getLastWarning())

    let achievementResult: AchievementEvaluationResult | null = null
    try {
      achievementResult = this.dependencies.achievementService.evaluate(profile.studentId, {
        dataset,
        includeSample,
        now,
      })
    } catch (caught) {
      addWarning(warnings, caught instanceof Error ? caught.message : '里程碑暂时无法读取。')
    }
    addWarning(warnings, this.dependencies.achievementService.getLastWarning())

    const subjects = SUBJECT_CODES.map((subjectCode, index) => {
      const textbookId = textbookIds[subjectCode]
      const map = maps.find((candidate) => candidate.subject === subjectCode)
      const display = displays[index] as TextbookDisplay | null
      const currentNode = findMapNode(map?.viewModel ?? null, map?.viewModel?.currentNodeId)
      const mapProgress = map?.viewModel?.progress ?? {
        completedNodes: 0,
        totalNodes: 0,
        percentage: 0,
      }
      return {
        code: subjectCode,
        label: subjectTheme[subjectCode].label,
        color: subjectTheme[subjectCode].color,
        softColor: subjectTheme[subjectCode].softColor,
        icon: subjectTheme[subjectCode].icon,
        ...(textbookId ? { textbookId } : {}),
        textbookName:
          display?.textbook.versionName ??
          map?.source?.textbook.title ??
          (textbookId ? '教材待确认' : '暂未选择教材'),
        ...(display?.publisher.name ? { publisherName: display.publisher.name } : {}),
        mapStatus: map ? statusLabelForMap(map) : ('not_available' as const),
        progress: {
          completed: mapProgress.completedNodes,
          total: mapProgress.totalNodes,
          percentage: mapProgress.percentage,
        },
        ...(currentNode
          ? {
              currentLessonTitle: currentNode.lesson.title,
              currentKnowledgePointTitle: currentNode.node.title,
            }
          : {}),
        isSample: map?.isSample ?? false,
        ...(map?.verificationStatus ? { verificationStatus: map.verificationStatus } : {}),
      }
    })

    const recentLearning = mapHistoryRecords(history, maps)
    const activeWrongCount = wrongBook.filter((record) => record.status === 'active').length
    const activeReviewCount = reviewQueue.filter((item) => item.status === 'active').length
    const mapSample = maps.some((map) => map.isSample)
    const mapUnverified = maps.some((map) => map.isUnverified)
    const isSample =
      dataset === 'demo' || mapSample || history.some((record) => record.provenance.isSampleDerived)
    const isUnverified =
      mapUnverified ||
      history.some((record) => record.provenance.verificationStatus === 'UNVERIFIED')
    const profileView = {
      profileId: profile.studentId,
      displayName: displayNameFor(profile.studentId, options.displayName),
      regionName: regions.find((region) => region.id === profile.regionId)?.name ?? '地区待确认',
      gradeName: grades.find((grade) => grade.id === profile.gradeId)?.name ?? '年级待确认',
      semesterName:
        semesters.find((semester) => semester.id === profile.semesterId)?.name ?? '学期待确认',
    }
    const greeting = {
      title: `你好，${profileView.displayName}`,
      subtitle:
        dailyPlan.status === 'completed'
          ? '今天的学习安排已经完成，去知识岛自由探索吧。'
          : '今天也来知识岛走一小步吧。',
      dateKey,
      dateLabel: new Intl.DateTimeFormat('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(date),
    }
    const achievement = summaryForAchievement(achievementResult)
    return {
      profile: profileView,
      greeting,
      today: dailyPlan,
      continueLearning: continueViewModel(dailyPlan, lessonSessions),
      subjects,
      recentLearning,
      shortcuts: buildShortcuts(dataset, history.length, activeWrongCount, activeReviewCount),
      growth: summaryForGrowth(growthResult),
      ...(achievement ? { achievement } : {}),
      flags: {
        isSample,
        isUnverified,
        hasAvailableCurriculum: subjects.some((subject) => subject.mapStatus === 'available'),
      },
      warnings,
    }
  }

  async getHome(
    profile: StudentCurriculumProfile,
    options: HomeLoadOptions = {},
  ): Promise<HomeViewModel> {
    return this.load(profile, options)
  }

  /** Seed only development fixtures; formal Home never calls this method. */
  seedDemoData(profileId: Id): void {
    const lessonSession = {
      ...phase14DemoLessonSession,
      id: phase14DemoLessonSession.id.replace('local-profile', profileId),
    }
    const questionSession = {
      ...phase14DemoQuestionSession,
      id: phase14DemoQuestionSession.id.replace('local-profile', profileId),
    }
    if (!this.dependencies.lessonSessionStorage.get(lessonSession.id)) {
      this.dependencies.lessonSessionStorage.save(lessonSession)
    }
    if (!this.dependencies.questionSessionStorage.get(questionSession.id)) {
      this.dependencies.questionSessionStorage.save(questionSession)
    }
    this.dependencies.historyService.recordLessonSession(profileId, lessonSession, {
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    this.dependencies.historyService.recordQuestionSession(profileId, questionSession, {
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    this.dependencies.wrongBookService.projectQuestionSession(profileId, questionSession, {
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
      textbookId: questionSession.textbookId,
      unitId: questionSession.unitId,
      lessonId: questionSession.lessonId,
      supportedQuestionIds: new Set(questionSession.questionIds),
      questionKnowledgePoints: new Map(
        questionSession.questionIds.map((questionId) => [
          questionId,
          [questionSession.knowledgePointId],
        ]),
      ),
    })
    this.dependencies.reviewQueueService.projectStrategy(phase14DemoReviewRecommendation, {
      profileId,
      textbookId: DEMO_TEXTBOOK_ID,
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    this.dependencies.rewardService.processLearningFacts(
      profileId,
      createPhase13DemoRewardFacts(profileId),
      {
        dataset: 'demo',
        isSampleDerived: true,
        verificationStatus: 'SAMPLE',
      },
    )
  }

  clearDemoPlans(profileId?: Id): void {
    this.dependencies.dailyPlanService.clearDemoPlans(profileId)
  }
}

export function createHomeService(overrides: Partial<HomeServiceDependencies> = {}): HomeService {
  return new HomeService({ ...defaultDependencies, ...overrides })
}

export const homeService = new HomeService()
