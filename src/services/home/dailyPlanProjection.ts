import type {
  DailyLearningPlan,
  DailyLearningTask,
  DailyLearningTaskAction,
  DailyLearningTaskStatus,
  DailyLearningTaskType,
  DailyPlanPolicy,
  DailyPlanProjectionInput,
  HomeMapSnapshot,
  HomeStrategySnapshot,
  LearningNodeStatus,
  SubjectCode,
} from '@/types'

import { DAILY_PLAN_VERSION, DEFAULT_DAILY_PLAN_POLICY } from '@/types'

const SUBJECT_CODES: SubjectCode[] = ['CHINESE', 'MATH', 'ENGLISH']
const TASK_TYPES: DailyLearningTaskType[] = [
  'continue_learning',
  'review',
  'reinforce',
  'wrong_question',
  'next_learning',
]

const UNSAFE_STATUSES = new Set(['SAMPLE', 'UNVERIFIED', 'REJECTED'])

interface MapNodeReference {
  subject: SubjectCode
  textbookId: string
  mapNodeId: string
  unitId: string
  lessonId: string
  knowledgePointId: string
  lessonTitle: string
  nodeTitle: string
  status: LearningNodeStatus
  progress: number
}

interface CandidateTask {
  profileId: string
  type: DailyLearningTaskType
  subject: SubjectCode
  textbookId: string
  knowledgePointId?: string
  lessonId?: string
  sourceId: string
  title: string
  description?: string
  priority: number
  action: DailyLearningTaskAction
  occurredAt?: string
}

function emptyTextbookIds(): Record<SubjectCode, string | null> {
  return { CHINESE: null, MATH: null, ENGLISH: null }
}

function nonNegativeInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value !== undefined && value >= 0 ? value : fallback
}

export function normalizeDailyPlanPolicy(policy: Partial<DailyPlanPolicy> = {}): DailyPlanPolicy {
  return {
    version: policy.version?.trim() || DEFAULT_DAILY_PLAN_POLICY.version,
    maxTasks: nonNegativeInteger(policy.maxTasks, DEFAULT_DAILY_PLAN_POLICY.maxTasks),
    maxContinueTasks: nonNegativeInteger(
      policy.maxContinueTasks,
      DEFAULT_DAILY_PLAN_POLICY.maxContinueTasks,
    ),
    maxReviewTasks: nonNegativeInteger(
      policy.maxReviewTasks,
      DEFAULT_DAILY_PLAN_POLICY.maxReviewTasks,
    ),
    maxReinforceTasks: nonNegativeInteger(
      policy.maxReinforceTasks,
      DEFAULT_DAILY_PLAN_POLICY.maxReinforceTasks,
    ),
    maxWrongQuestionTasks: nonNegativeInteger(
      policy.maxWrongQuestionTasks,
      DEFAULT_DAILY_PLAN_POLICY.maxWrongQuestionTasks,
    ),
    maxNewLearningTasks: nonNegativeInteger(
      policy.maxNewLearningTasks,
      DEFAULT_DAILY_PLAN_POLICY.maxNewLearningTasks,
    ),
  }
}

/** Return the user's local calendar date; UTC conversion is intentionally not used. */
export function getLocalDateKey(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function buildTextbookContextKey(
  textbookIds: Partial<Record<SubjectCode, string | null>> = {},
): string {
  return SUBJECT_CODES.map(
    (subjectCode) => `${subjectCode}=${textbookIds[subjectCode] ?? '-'}`,
  ).join('|')
}

export function buildDailyPlanId(
  profileId: string,
  dateKey: string,
  textbookContextKey: string,
  dataset: DailyPlanProjectionInput['dataset'] = 'profile',
): string {
  return `daily-plan:${profileId}:${dateKey}:${dataset}:${textbookContextKey}`
}

export function buildDailyLearningTaskId(
  profileId: string,
  dateKey: string,
  type: DailyLearningTaskType,
  sourceId: string,
): string {
  return `daily-task:${profileId}:${dateKey}:${type}:${sourceId}`
}

/** Short alias for callers that use the terminology from the product spec. */
export const buildDailyTaskId = buildDailyLearningTaskId

function mapReferences(maps: readonly HomeMapSnapshot[]): {
  byNodeId: ReadonlyMap<string, MapNodeReference>
  byKnowledgePoint: ReadonlyMap<string, MapNodeReference>
  byTextbook: ReadonlyMap<string, HomeMapSnapshot>
} {
  const byNodeId = new Map<string, MapNodeReference>()
  const byKnowledgePoint = new Map<string, MapNodeReference>()
  const byTextbook = new Map<string, HomeMapSnapshot>()
  for (const map of maps) {
    byTextbook.set(map.textbookId, map)
    if (!map.viewModel || !map.available) continue
    for (const island of map.viewModel.islands) {
      for (const lesson of island.lessons) {
        for (const node of lesson.nodes) {
          const reference: MapNodeReference = {
            subject: map.subject,
            textbookId: map.textbookId,
            mapNodeId: node.id,
            unitId: node.unitId,
            lessonId: node.lessonId,
            knowledgePointId: node.knowledgePointId,
            lessonTitle: lesson.title,
            nodeTitle: node.title,
            status: node.status,
            progress: node.progress,
          }
          if (!byNodeId.has(node.id)) byNodeId.set(node.id, reference)
          const knowledgePointKey = `${map.textbookId}:${node.knowledgePointId}`
          const current = byKnowledgePoint.get(knowledgePointKey)
          if (
            !current ||
            `${reference.textbookId}:${reference.mapNodeId}`.localeCompare(
              `${current.textbookId}:${current.mapNodeId}`,
            ) < 0
          ) {
            byKnowledgePoint.set(knowledgePointKey, reference)
          }
        }
      }
    }
  }
  return { byNodeId, byKnowledgePoint, byTextbook }
}

function subjectFromTextbookId(textbookId: string): SubjectCode {
  const normalized = textbookId.toUpperCase()
  if (normalized.includes('CHINESE') || normalized.includes('语文')) return 'CHINESE'
  if (normalized.includes('ENGLISH') || normalized.includes('英语')) return 'ENGLISH'
  return 'MATH'
}

function isAllowedProvenance(
  dataset: DailyPlanProjectionInput['dataset'],
  isSampleDerived: boolean,
  verificationStatus?: string,
): boolean {
  if (dataset === 'demo') return true
  return !isSampleDerived && !UNSAFE_STATUSES.has(verificationStatus ?? '')
}

function textbookIsBlocked(
  mapsByTextbook: ReadonlyMap<string, HomeMapSnapshot>,
  textbookId: string,
): boolean {
  const map = mapsByTextbook.get(textbookId)
  return Boolean(map && !map.available)
}

function referenceFor(
  maps: ReturnType<typeof mapReferences>,
  textbookId: string,
  knowledgePointId?: string,
  mapNodeId?: string,
): MapNodeReference | undefined {
  if (mapNodeId) {
    const node = maps.byNodeId.get(mapNodeId)
    if (node && node.textbookId === textbookId) return node
  }
  if (knowledgePointId) {
    const node = maps.byKnowledgePoint.get(`${textbookId}:${knowledgePointId}`)
    if (node) return node
  }
  return undefined
}

function lessonContextFor(
  reference: MapNodeReference | undefined,
  fallback: { textbookId: string; unitId: string; lessonId: string; knowledgePointId: string },
) {
  return {
    textbookId: reference?.textbookId ?? fallback.textbookId,
    unitId: reference?.unitId ?? fallback.unitId,
    lessonId: reference?.lessonId ?? fallback.lessonId,
    knowledgePointId: reference?.knowledgePointId ?? fallback.knowledgePointId,
  }
}

function strategySnapshots(input: DailyPlanProjectionInput): HomeStrategySnapshot[] {
  const snapshots = [...(input.strategies ?? [])]
  if (input.strategy) {
    const textbookId =
      input.maps.find((map) => map.available)?.textbookId ??
      input.textbookIds?.MATH ??
      input.textbookIds?.CHINESE ??
      input.textbookIds?.ENGLISH
    if (textbookId) {
      snapshots.push({
        subject: subjectFromTextbookId(textbookId),
        textbookId,
        recommendation: input.strategy,
      })
    }
  }
  const seen = new Set<string>()
  return snapshots.filter((snapshot) => {
    const key = `${snapshot.textbookId}:${snapshot.recommendation.strategyVersion}:${snapshot.recommendation.studentProfileId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sourceIdForStrategy(
  snapshot: HomeStrategySnapshot,
  type: string,
  knowledgePointId: string,
  mapNodeId?: string,
): string {
  return [
    'strategy',
    snapshot.recommendation.strategyVersion,
    snapshot.textbookId,
    type,
    knowledgePointId,
    mapNodeId ?? knowledgePointId,
  ].join(':')
}

function taskSort(left: CandidateTask, right: CandidateTask): number {
  return (
    left.priority - right.priority ||
    (right.occurredAt ?? '').localeCompare(left.occurredAt ?? '') ||
    left.subject.localeCompare(right.subject) ||
    left.sourceId.localeCompare(right.sourceId)
  )
}

function taskLimitFor(policy: DailyPlanPolicy, type: DailyLearningTaskType): number {
  switch (type) {
    case 'continue_learning':
      return policy.maxContinueTasks
    case 'review':
      return policy.maxReviewTasks
    case 'reinforce':
      return policy.maxReinforceTasks
    case 'wrong_question':
      return policy.maxWrongQuestionTasks
    case 'next_learning':
      return policy.maxNewLearningTasks
  }
}

function sameLessonKnowledgePoint(
  task: CandidateTask,
  continuePairs: ReadonlySet<string>,
): boolean {
  if (task.type !== 'next_learning' || !task.lessonId || !task.knowledgePointId) return false
  return continuePairs.has(`${task.textbookId}:${task.lessonId}:${task.knowledgePointId}`)
}

function selectCandidates(
  candidates: ReadonlyMap<DailyLearningTaskType, CandidateTask[]>,
  policy: DailyPlanPolicy,
): CandidateTask[] {
  const selected: CandidateTask[] = []
  const occupiedKnowledgePoints = new Set<string>()
  const selectedSources = new Set<string>()
  const continuePairs = new Set(
    (candidates.get('continue_learning') ?? [])
      .filter((candidate) => candidate.lessonId && candidate.knowledgePointId)
      .map(
        (candidate) =>
          `${candidate.textbookId}:${candidate.lessonId}:${candidate.knowledgePointId}`,
      ),
  )

  for (const type of TASK_TYPES) {
    if (selected.length >= policy.maxTasks) break
    let categoryCount = 0
    const categoryCandidates = [...(candidates.get(type) ?? [])].sort(taskSort)
    for (const candidate of categoryCandidates) {
      if (selected.length >= policy.maxTasks || categoryCount >= taskLimitFor(policy, type)) break
      const sourceKey = `${candidate.type}:${candidate.sourceId}`
      if (selectedSources.has(sourceKey)) continue
      if (
        (type === 'review' || type === 'reinforce' || type === 'next_learning') &&
        candidate.knowledgePointId &&
        occupiedKnowledgePoints.has(`${candidate.textbookId}:${candidate.knowledgePointId}`)
      ) {
        continue
      }
      if (sameLessonKnowledgePoint(candidate, continuePairs)) continue
      selected.push(candidate)
      selectedSources.add(sourceKey)
      categoryCount += 1
      if (
        candidate.knowledgePointId &&
        (type === 'review' || type === 'reinforce' || type === 'next_learning')
      ) {
        occupiedKnowledgePoints.add(`${candidate.textbookId}:${candidate.knowledgePointId}`)
      }
    }
  }
  return selected
}

function candidateTasks(
  input: DailyPlanProjectionInput,
): Map<DailyLearningTaskType, CandidateTask[]> {
  const maps = mapReferences(input.maps)
  const result = new Map<DailyLearningTaskType, CandidateTask[]>(
    TASK_TYPES.map((type) => [type, []]),
  )
  const push = (candidate: CandidateTask) => result.get(candidate.type)?.push(candidate)

  for (const session of input.lessonSessions) {
    if (session.status !== 'in_progress') continue
    if (textbookIsBlocked(maps.byTextbook, session.textbookId)) continue
    const reference = referenceFor(maps, session.textbookId, session.knowledgePointId)
    const subject = reference?.subject ?? subjectFromTextbookId(session.textbookId)
    push({
      profileId: input.profileId,
      type: 'continue_learning',
      subject,
      textbookId: session.textbookId,
      knowledgePointId: session.knowledgePointId,
      lessonId: session.lessonId,
      sourceId: session.id,
      title: `继续学习：${reference?.lessonTitle ?? session.lessonId}`,
      description: reference?.nodeTitle
        ? `从「${reference.nodeTitle}」停下的地方继续。`
        : '从上次停下的地方继续。',
      priority: 1,
      action: {
        type: 'lesson',
        launchContext: {
          textbookId: session.textbookId,
          unitId: session.unitId,
          lessonId: session.lessonId,
          knowledgePointId: session.knowledgePointId,
        },
      },
      occurredAt: session.updatedAt ?? session.startedAt,
    })
  }

  for (const item of input.reviewQueue) {
    if (item.status !== 'active') continue
    if (
      !isAllowedProvenance(
        input.dataset,
        item.provenance.isSampleDerived,
        item.provenance.verificationStatus,
      )
    ) {
      continue
    }
    if (textbookIsBlocked(maps.byTextbook, item.textbookId)) continue
    const reference = referenceFor(maps, item.textbookId, item.knowledgePointId, item.mapNodeId)
    push({
      profileId: input.profileId,
      type: 'review',
      subject: reference?.subject ?? subjectFromTextbookId(item.textbookId),
      textbookId: item.textbookId,
      knowledgePointId: item.knowledgePointId,
      sourceId: item.id,
      title: `待巩固：${reference?.nodeTitle ?? item.reason.title}`,
      description: item.reason.description,
      priority: item.priority,
      action: { type: 'review_queue', reviewQueueItemId: item.id },
      occurredAt: undefined,
    })
  }

  for (const snapshot of strategySnapshots(input)) {
    const recommendation = snapshot.recommendation
    if (!isAllowedProvenance(input.dataset, recommendation.isSampleDerived, undefined)) continue
    if (textbookIsBlocked(maps.byTextbook, snapshot.textbookId)) continue
    for (const review of recommendation.reviewRecommendations) {
      if (
        !isAllowedProvenance(input.dataset, review.isSampleDerived, review.evidenceSourceStatus)
      ) {
        continue
      }
      const reference = referenceFor(
        maps,
        snapshot.textbookId,
        review.knowledgePointId,
        review.mapNodeId,
      )
      const context = reference
        ? lessonContextFor(reference, {
            textbookId: snapshot.textbookId,
            unitId: '',
            lessonId: '',
            knowledgePointId: review.knowledgePointId,
          })
        : undefined
      push({
        profileId: input.profileId,
        type: 'reinforce',
        subject: reference?.subject ?? snapshot.subject,
        textbookId: snapshot.textbookId,
        knowledgePointId: review.knowledgePointId,
        lessonId: reference?.lessonId,
        sourceId: sourceIdForStrategy(
          snapshot,
          review.type,
          review.knowledgePointId,
          review.mapNodeId,
        ),
        title: `薄弱巩固：${reference?.nodeTitle ?? review.reason.title}`,
        description: review.reason.description,
        priority: review.priority,
        action: context
          ? {
              type: 'assessment',
              launchContext: { ...context, source: 'lesson_practice' },
            }
          : { type: 'learning_map', knowledgePointId: review.knowledgePointId },
        occurredAt: undefined,
      })
    }

    if (
      ['PROCEED_TO_NEXT', 'CONTINUE_CURRENT'].includes(recommendation.type) &&
      recommendation.nextKnowledgePoint
    ) {
      const next = recommendation.nextKnowledgePoint
      if (!isAllowedProvenance(input.dataset, recommendation.isSampleDerived, undefined)) continue
      const reference = referenceFor(
        maps,
        snapshot.textbookId,
        next.knowledgePointId,
        next.mapNodeId,
      )
      const context = reference
        ? lessonContextFor(reference, {
            textbookId: snapshot.textbookId,
            unitId: '',
            lessonId: '',
            knowledgePointId: next.knowledgePointId,
          })
        : undefined
      push({
        profileId: input.profileId,
        type: 'next_learning',
        subject: reference?.subject ?? snapshot.subject,
        textbookId: snapshot.textbookId,
        knowledgePointId: next.knowledgePointId,
        lessonId: reference?.lessonId,
        sourceId: sourceIdForStrategy(
          snapshot,
          'PROCEED_TO_NEXT',
          next.knowledgePointId,
          next.mapNodeId,
        ),
        title: `新知识：${reference?.nodeTitle ?? next.title ?? next.knowledgePointId}`,
        description: next.reason.description,
        priority: 1,
        action: context
          ? { type: 'lesson', launchContext: context }
          : { type: 'learning_map', knowledgePointId: next.knowledgePointId },
        occurredAt: undefined,
      })
    }
  }

  for (const record of input.wrongBook) {
    if (record.status !== 'active') continue
    if (
      !isAllowedProvenance(
        input.dataset,
        record.provenance.isSampleDerived,
        record.provenance.verificationStatus,
      )
    ) {
      continue
    }
    const textbookId =
      record.textbookId ??
      record.textbookIds?.slice().sort()[0] ??
      input.maps.find((map) =>
        map.viewModel?.islands.some((island) =>
          island.lessons.some((lesson) =>
            lesson.nodes.some((node) => record.knowledgePointIds.includes(node.knowledgePointId)),
          ),
        ),
      )?.textbookId
    if (!textbookId || textbookIsBlocked(maps.byTextbook, textbookId)) continue
    const knowledgePointId = record.knowledgePointIds.slice().sort()[0]
    const reference = referenceFor(maps, textbookId, knowledgePointId)
    push({
      profileId: input.profileId,
      type: 'wrong_question',
      subject: reference?.subject ?? subjectFromTextbookId(textbookId),
      textbookId,
      knowledgePointId,
      lessonId: record.lessonId ?? reference?.lessonId,
      sourceId: record.id,
      title: `错题重练：${reference?.nodeTitle ?? record.questionId}`,
      description: `这道题曾经答错 ${record.wrongCount} 次，回来再挑战一次。`,
      priority: 1,
      action: { type: 'wrong_question', wrongQuestionId: record.questionId },
      occurredAt: record.lastWrongAt,
    })
  }

  return result
}

function taskContext(task: DailyLearningTask): {
  textbookId: string
  unitId?: string
  lessonId?: string
  knowledgePointId?: string
} {
  if (task.action.type === 'lesson' || task.action.type === 'assessment') {
    return task.action.launchContext
  }
  return {
    textbookId: task.textbookId,
    ...(task.lessonId ? { lessonId: task.lessonId } : {}),
    ...(task.knowledgePointId ? { knowledgePointId: task.knowledgePointId } : {}),
  }
}

function completedAfter(
  input: DailyPlanProjectionInput,
  task: DailyLearningTask,
  generatedAt: string,
): boolean {
  const context = taskContext(task)
  return input.history.some(
    (record) =>
      (record.type === 'lesson_completed' || record.type === 'assessment_completed') &&
      record.textbookId === context.textbookId &&
      (!context.lessonId || record.lessonId === context.lessonId) &&
      (!context.knowledgePointId || record.knowledgePointId === context.knowledgePointId) &&
      record.occurredAt.localeCompare(generatedAt) > 0,
  )
}

function mapCompletion(input: DailyPlanProjectionInput, task: DailyLearningTask): boolean {
  const context = taskContext(task)
  return input.maps.some(
    (map) =>
      map.textbookId === context.textbookId &&
      map.progressRecords.some(
        (record) =>
          record.status === 'completed' &&
          Boolean(
            task.knowledgePointId &&
            map.viewModel?.islands.some((island) =>
              island.lessons.some((lesson) =>
                lesson.nodes.some(
                  (node) =>
                    node.knowledgePointId === task.knowledgePointId &&
                    (!task.lessonId || node.lessonId === task.lessonId) &&
                    node.id === record.nodeId,
                ),
              ),
            ),
          ),
      ),
  )
}

function strategySourceExists(task: DailyLearningTask, input: DailyPlanProjectionInput): boolean {
  return strategySnapshots(input).some((snapshot) => {
    if (snapshot.textbookId !== task.textbookId) return false
    if (task.type === 'reinforce') {
      return snapshot.recommendation.reviewRecommendations.some(
        (review) =>
          review.knowledgePointId === task.knowledgePointId &&
          sourceIdForStrategy(snapshot, review.type, review.knowledgePointId, review.mapNodeId) ===
            task.sourceId,
      )
    }
    if (task.type === 'next_learning') {
      const next = snapshot.recommendation.nextKnowledgePoint
      return Boolean(
        ['PROCEED_TO_NEXT', 'CONTINUE_CURRENT'].includes(snapshot.recommendation.type) &&
        next &&
        next.knowledgePointId === task.knowledgePointId &&
        sourceIdForStrategy(snapshot, 'PROCEED_TO_NEXT', next.knowledgePointId, next.mapNodeId) ===
          task.sourceId,
      )
    }
    return false
  })
}

function statusForTask(
  task: DailyLearningTask,
  input: DailyPlanProjectionInput,
  generatedAt: string,
): DailyLearningTaskStatus {
  if (task.type === 'continue_learning') {
    const session = input.lessonSessions.find(
      (candidate) =>
        candidate.id === task.sourceId ||
        (candidate.textbookId === task.textbookId &&
          candidate.lessonId === task.lessonId &&
          candidate.knowledgePointId === task.knowledgePointId),
    )
    return session?.status === 'completed'
      ? 'completed'
      : session?.status === 'in_progress'
        ? 'pending'
        : 'unavailable'
  }
  if (task.type === 'review') {
    const item = input.reviewQueue.find((candidate) => candidate.id === task.sourceId)
    return item?.status === 'completed'
      ? 'completed'
      : item?.status === 'active'
        ? 'pending'
        : 'unavailable'
  }
  if (task.type === 'wrong_question') {
    const questionId = task.action.type === 'wrong_question' ? task.action.wrongQuestionId : ''
    const record = input.wrongBook.find(
      (candidate) => candidate.id === task.sourceId || candidate.questionId === questionId,
    )
    return record?.status === 'resolved'
      ? 'completed'
      : record?.status === 'active'
        ? 'pending'
        : 'unavailable'
  }
  if (completedAfter(input, task, generatedAt)) return 'completed'
  if (task.type === 'next_learning' && mapCompletion(input, task)) return 'completed'
  if (task.type === 'reinforce') {
    const completedQueueItem = input.reviewQueue.some(
      (item) =>
        item.status === 'completed' &&
        item.textbookId === task.textbookId &&
        item.knowledgePointId === task.knowledgePointId,
    )
    if (completedQueueItem) return 'completed'
  }
  return strategySourceExists(task, input) ? 'pending' : 'unavailable'
}

function progressFor(tasks: readonly DailyLearningTask[]): DailyLearningPlan['progress'] {
  const available = tasks.filter((task) => task.status !== 'unavailable')
  const completed = available.filter((task) => task.status === 'completed').length
  return {
    completed,
    total: available.length,
    percentage: available.length ? Math.round((completed / available.length) * 100) : 0,
  }
}

function planStatus(progress: DailyLearningPlan['progress']): DailyLearningPlan['status'] {
  if (progress.total > 0 && progress.completed === progress.total) return 'completed'
  if (progress.completed > 0) return 'in_progress'
  return 'not_started'
}

function toTask(
  candidate: CandidateTask,
  dateKey: string,
  input: DailyPlanProjectionInput,
  generatedAt: string,
): DailyLearningTask {
  const task = {
    ...candidate,
    id: buildDailyLearningTaskId(input.profileId, dateKey, candidate.type, candidate.sourceId),
    status: 'pending' as const,
  }
  return { ...task, status: statusForTask(task, input, generatedAt) }
}

function refreshExistingTask(
  task: DailyLearningTask,
  candidate: CandidateTask | undefined,
  input: DailyPlanProjectionInput,
  generatedAt: string,
): DailyLearningTask {
  const display = candidate
    ? {
        title: candidate.title,
        ...(candidate.description ? { description: candidate.description } : {}),
      }
    : {}
  const refreshed = { ...task, ...display }
  return { ...refreshed, status: statusForTask(refreshed, input, generatedAt) }
}

/**
 * Compose the existing domain outputs into one daily snapshot. The function
 * never writes Mastery, Strategy, ReviewQueue, WrongBook, or Reward facts.
 */
export function projectDailyPlan(
  input: DailyPlanProjectionInput,
  policyInput: Partial<DailyPlanPolicy> = DEFAULT_DAILY_PLAN_POLICY,
  existingPlan?: DailyLearningPlan | null,
): DailyLearningPlan {
  const policy = normalizeDailyPlanPolicy(policyInput)
  const dateKey = input.dateKey || getLocalDateKey()
  const textbookIds = { ...emptyTextbookIds(), ...(input.textbookIds ?? {}) }
  for (const map of input.maps) textbookIds[map.subject] = map.textbookId
  const textbookContextKey = buildTextbookContextKey(textbookIds)
  const generatedAt = existingPlan?.generatedAt ?? input.generatedAt ?? new Date().toISOString()
  const candidates = candidateTasks(input)
  const candidatesById = new Map<string, CandidateTask>()
  for (const category of candidates.values()) {
    for (const candidate of category) {
      const id = buildDailyLearningTaskId(
        input.profileId,
        dateKey,
        candidate.type,
        candidate.sourceId,
      )
      candidatesById.set(id, candidate)
    }
  }
  const tasks = existingPlan?.tasks.length
    ? existingPlan.tasks.map((task) =>
        refreshExistingTask(task, candidatesById.get(task.id), input, generatedAt),
      )
    : selectCandidates(candidates, policy).map((candidate) =>
        toTask(candidate, dateKey, input, generatedAt),
      )
  const progress = progressFor(tasks)
  return {
    id:
      existingPlan?.id ??
      buildDailyPlanId(input.profileId, dateKey, textbookContextKey, input.dataset),
    profileId: input.profileId,
    dateKey,
    textbookContextKey,
    textbookIds,
    dataset: input.dataset,
    tasks,
    progress,
    status: planStatus(progress),
    generatedAt,
    policyVersion: existingPlan?.policyVersion ?? (policy.version || DAILY_PLAN_VERSION),
  }
}

export function isDailyPlanSnapshotMatch(
  plan: DailyLearningPlan,
  input: DailyPlanProjectionInput,
): boolean {
  const textbookIds = { ...emptyTextbookIds(), ...(input.textbookIds ?? {}) }
  for (const map of input.maps) textbookIds[map.subject] = map.textbookId
  return (
    plan.profileId === input.profileId &&
    plan.dateKey === input.dateKey &&
    plan.dataset === input.dataset &&
    plan.textbookContextKey === buildTextbookContextKey(textbookIds)
  )
}

export { DAILY_PLAN_VERSION }
