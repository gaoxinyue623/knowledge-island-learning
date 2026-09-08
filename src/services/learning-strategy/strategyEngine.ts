import type {
  Id,
  KnowledgeRelation,
  LearningEvidence,
  LearningMapProgressRecord,
  LearningNodeStatus,
  LearningRecommendation,
  LearningStrategyInput,
  LearningStrategyOptions,
  MasteryEvidenceSourceStatus,
  MasteryPolicy,
  MasteryRecord,
  NextKnowledgePoint,
  RecommendationReasonCode,
  ReinforcementReason,
  ReviewRecommendation,
  StrategyMapNode,
  StrategyRecommendationType,
} from '@/types'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery'
import { DEFAULT_STRATEGY_POLICY } from './strategyPolicy'

const VALID_NODE_STATUSES: ReadonlySet<LearningNodeStatus> = new Set([
  'locked',
  'available',
  'learning',
  'completed',
  'mastered',
  'perfect',
])

const DISALLOWED_SOURCE_STATUSES: ReadonlySet<string> = new Set([
  'SAMPLE',
  'UNVERIFIED',
  'REJECTED',
])

interface NormalizedRelation {
  id: Id
  sourceKnowledgePointId: Id
  targetKnowledgePointId: Id
  relationType: 'prerequisite' | 'related' | 'advanced'
  textbookId?: Id
  isSample: boolean
  verificationStatus?: string
}

interface PreparedStrategyInput {
  input: LearningStrategyInput
  strategyVersion: string
  policy: MasteryPolicy
  mapNodes: StrategyMapNode[]
  relations: NormalizedRelation[]
  recordsByKnowledgePointId: ReadonlyMap<Id, MasteryRecord>
  evidence: LearningEvidence[]
  questionHistory: LearningStrategyInput['questionHistory']
  diagnostics: string[]
  sourceBlocked: boolean
  isSampleDerived: boolean
  warning?: string
}

interface RecordAssessment {
  type: 'REINFORCE' | 'GATHER_MORE_EVIDENCE' | null
  priority: number
  reason: ReinforcementReason
}

function addDiagnostic(diagnostics: string[], code: string, detail?: string): void {
  const value = detail ? `${code}: ${detail}` : code
  if (!diagnostics.includes(value)) diagnostics.push(value)
}

function compareStrings(left: string | undefined, right: string | undefined): number {
  const a = left ?? ''
  const b = right ?? ''
  return a < b ? -1 : a > b ? 1 : 0
}

function compareMapNodes(left: StrategyMapNode, right: StrategyMapNode): number {
  const leftSort = left.sort ?? left.order ?? Number.MAX_SAFE_INTEGER
  const rightSort = right.sort ?? right.order ?? Number.MAX_SAFE_INTEGER
  return (
    leftSort - rightSort ||
    compareStrings(left.knowledgePointId, right.knowledgePointId) ||
    compareStrings(left.id, right.id)
  )
}

function compareRelations(left: NormalizedRelation, right: NormalizedRelation): number {
  return (
    compareStrings(left.sourceKnowledgePointId, right.sourceKnowledgePointId) ||
    compareStrings(left.targetKnowledgePointId, right.targetKnowledgePointId) ||
    compareStrings(left.relationType, right.relationType) ||
    compareStrings(left.id, right.id)
  )
}

function getRecordSourceStatus(record: MasteryRecord): MasteryEvidenceSourceStatus {
  return record.evidenceSourceStatus
}

function getContentSourceStatus(record: {
  isSample?: boolean
  needsVerification?: boolean
  verificationStatus?: string
}): string | undefined {
  if (record.verificationStatus === 'REJECTED') return 'REJECTED'
  if (record.isSample === true) return 'SAMPLE'
  if (record.needsVerification === true) return 'UNVERIFIED'
  return record.verificationStatus
}

function isDisallowedSource(status: string | undefined): boolean {
  return status !== undefined && DISALLOWED_SOURCE_STATUSES.has(status)
}

function isSampleSource(status: string | undefined): boolean {
  return status === 'SAMPLE'
}

function isValidNodeStatus(value: string): value is LearningNodeStatus {
  return VALID_NODE_STATUSES.has(value as LearningNodeStatus)
}

function normalizeRelation(relation: KnowledgeRelation): NormalizedRelation | null {
  const sourceKnowledgePointId =
    relation.sourceKnowledgePointId ?? relation.prerequisiteKnowledgePointId ?? relation.source
  const targetKnowledgePointId =
    relation.targetKnowledgePointId ?? relation.dependentKnowledgePointId ?? relation.target
  if (!relation.id || !sourceKnowledgePointId || !targetKnowledgePointId) return null

  const relationType =
    relation.relationType === 'REQUIRED' || relation.relationType === 'RECOMMENDED'
      ? 'prerequisite'
      : relation.relationType
  if (
    relationType !== 'prerequisite' &&
    relationType !== 'related' &&
    relationType !== 'advanced'
  ) {
    return null
  }
  return {
    id: relation.id,
    sourceKnowledgePointId,
    targetKnowledgePointId,
    relationType,
    ...(relation.textbookId ? { textbookId: relation.textbookId } : {}),
    isSample: relation.isSample === true || relation.verificationStatus === 'SAMPLE',
    verificationStatus: relation.verificationStatus,
  }
}

function normalizeMapNodes(input: LearningStrategyInput, diagnostics: string[]): StrategyMapNode[] {
  const textbookIds = [...new Set(input.mapNodes.map((node) => node.textbookId).filter(Boolean))]
  const scopedTextbookId =
    input.currentTextbookId ?? (textbookIds.length === 1 ? textbookIds[0] : undefined)
  if (!input.currentTextbookId && textbookIds.length > 1) {
    addDiagnostic(diagnostics, 'TEXTBOOK_CONTEXT_REQUIRED')
    return []
  }

  const candidates = input.mapNodes
    .filter((node) => {
      if (!node.id || !node.knowledgePointId) {
        addDiagnostic(diagnostics, 'INVALID_MAP_NODE')
        return false
      }
      if (!isValidNodeStatus(node.status)) {
        addDiagnostic(diagnostics, 'INVALID_MAP_NODE_STATUS', node.id)
        return false
      }
      if (scopedTextbookId && node.textbookId && node.textbookId !== scopedTextbookId) {
        addDiagnostic(diagnostics, 'TEXTBOOK_NODE_IGNORED', node.id)
        return false
      }
      return true
    })
    .map((node) => ({ ...node }))
    .sort(compareMapNodes)

  const result: StrategyMapNode[] = []
  const seenNodeIds = new Set<Id>()
  for (const node of candidates) {
    if (seenNodeIds.has(node.id)) {
      addDiagnostic(diagnostics, 'DUPLICATE_MAP_NODE', node.id)
      continue
    }
    seenNodeIds.add(node.id)
    result.push(node)
  }
  return result
}

function normalizeProgress(
  nodes: readonly StrategyMapNode[],
  records: readonly LearningMapProgressRecord[] | undefined,
  diagnostics: string[],
): StrategyMapNode[] {
  if (!records?.length) return nodes.map((node) => ({ ...node }))
  const knownNodeIds = new Set(nodes.map((node) => node.id))
  const progressByNodeId = new Map<Id, LearningMapProgressRecord>()
  for (const record of [...records].sort(
    (left, right) =>
      compareStrings(left.nodeId, right.nodeId) ||
      compareStrings(left.status, right.status) ||
      right.progress - left.progress,
  )) {
    if (!knownNodeIds.has(record.nodeId)) {
      addDiagnostic(diagnostics, 'ORPHAN_PROGRESS', record.nodeId)
      continue
    }
    if (!isValidNodeStatus(record.status) || !Number.isFinite(record.progress)) {
      addDiagnostic(diagnostics, 'INVALID_MAP_PROGRESS', record.nodeId)
      continue
    }
    if (!progressByNodeId.has(record.nodeId)) progressByNodeId.set(record.nodeId, record)
  }

  return nodes.map((node) => {
    const progress = progressByNodeId.get(node.id)
    if (!progress || node.status === 'locked' || progress.status === 'locked') return { ...node }
    return {
      ...node,
      status: progress.status,
      progress: progress.progress,
    }
  })
}

function normalizeRecords(
  input: LearningStrategyInput,
  knownKnowledgePointIds: ReadonlySet<Id>,
  diagnostics: string[],
): Map<Id, MasteryRecord> {
  const result = new Map<Id, MasteryRecord>()
  const records = [...input.masteryRecords]
    .filter((record) => {
      if (record.studentProfileId !== input.studentProfileId) {
        addDiagnostic(diagnostics, 'PROFILE_RECORD_IGNORED', record.knowledgePointId)
        return false
      }
      if (!knownKnowledgePointIds.has(record.knowledgePointId)) {
        addDiagnostic(diagnostics, 'KNOWLEDGE_POINT_NOT_FOUND', record.knowledgePointId)
        return false
      }
      if (
        !Number.isFinite(record.masteryScore) ||
        record.masteryScore < 0 ||
        record.masteryScore > 100 ||
        !Number.isFinite(record.confidence) ||
        record.confidence < 0 ||
        record.confidence > 1 ||
        !Number.isFinite(record.evidenceCount) ||
        record.evidenceCount < 0
      ) {
        addDiagnostic(diagnostics, 'INVALID_MASTERY_RECORD', record.knowledgePointId)
        return false
      }
      return true
    })
    .sort(
      (left, right) =>
        compareStrings(left.knowledgePointId, right.knowledgePointId) ||
        right.version - left.version ||
        compareStrings(right.updatedAt, left.updatedAt) ||
        right.masteryScore - left.masteryScore ||
        right.confidence - left.confidence,
    )

  for (const record of records) {
    if (result.has(record.knowledgePointId)) {
      addDiagnostic(diagnostics, 'DUPLICATE_MASTERY_RECORD', record.knowledgePointId)
      continue
    }
    result.set(record.knowledgePointId, record)
  }
  return result
}

function normalizeEvidence(
  input: LearningStrategyInput,
  knownKnowledgePointIds: ReadonlySet<Id>,
  diagnostics: string[],
): LearningEvidence[] {
  return [...(input.learningEvidence ?? [])]
    .filter((evidence) => {
      if (evidence.studentProfileId !== input.studentProfileId) {
        addDiagnostic(diagnostics, 'PROFILE_EVIDENCE_IGNORED', evidence.id)
        return false
      }
      if (!knownKnowledgePointIds.has(evidence.knowledgePointId)) {
        addDiagnostic(diagnostics, 'KNOWLEDGE_POINT_NOT_FOUND', evidence.knowledgePointId)
        return false
      }
      return true
    })
    .sort((left, right) => compareStrings(left.id, right.id))
}

function addHistoryDiagnostics(
  recordsByKnowledgePointId: ReadonlyMap<Id, MasteryRecord>,
  evidence: readonly LearningEvidence[],
  questionHistory: LearningStrategyInput['questionHistory'],
  diagnostics: string[],
): void {
  const evidenceByKnowledgePointId = new Map<Id, LearningEvidence[]>()
  for (const item of evidence) {
    const current = evidenceByKnowledgePointId.get(item.knowledgePointId) ?? []
    current.push(item)
    evidenceByKnowledgePointId.set(item.knowledgePointId, current)
  }
  for (const [knowledgePointId, record] of recordsByKnowledgePointId) {
    const count = evidenceByKnowledgePointId.get(knowledgePointId)?.length ?? 0
    if (count !== record.evidenceCount) {
      addDiagnostic(diagnostics, 'EVIDENCE_MASTERY_MISMATCH', knowledgePointId)
    }
  }

  if (!questionHistory?.length) return
  const questionIds = new Set(evidence.map((item) => item.source.questionId))
  for (const attempt of questionHistory) {
    if (attempt.submitted && attempt.result && !questionIds.has(attempt.questionId)) {
      addDiagnostic(diagnostics, 'QUESTION_HISTORY_MASTERY_MISMATCH', attempt.questionId)
    }
  }
}

function buildWarning(
  dataset: LearningStrategyInput['dataset'],
  sourceBlocked: boolean,
): string | undefined {
  if (sourceBlocked) return '当前学习数据尚未通过审核，暂时不生成正式学习建议。'
  if (dataset === 'demo') return '开发样本：本建议只用于验证确定性策略，不代表正式课程建议。'
  if (dataset === 'golden') return 'UNVERIFIED 数据：本建议只用于开发验证，不代表正式课程建议。'
  return undefined
}

function prepareInput(
  input: LearningStrategyInput,
  options: LearningStrategyOptions,
): PreparedStrategyInput {
  const diagnostics: string[] = []
  const strategyVersion = input.strategyVersion ?? DEFAULT_STRATEGY_POLICY.strategyVersion
  const policy = options.policy ?? DEFAULT_MASTERY_POLICY
  const rawMapNodes = normalizeMapNodes(input, diagnostics)
  const nodes = normalizeProgress(rawMapNodes, input.learningMapProgress, diagnostics)

  const rawRelations = input.knowledgeRelations
    .map(normalizeRelation)
    .filter((relation): relation is NormalizedRelation => Boolean(relation))
    .sort(compareRelations)
  if (input.knowledgeRelations.length > 0 && rawRelations.length === 0) {
    addDiagnostic(diagnostics, 'KNOWLEDGE_RELATIONS_INVALID')
  }

  const nodeTextbookIds = new Set(nodes.map((node) => node.textbookId).filter(Boolean))
  const relations = rawRelations.filter((relation) => {
    if (
      input.currentTextbookId &&
      relation.textbookId &&
      relation.textbookId !== input.currentTextbookId
    ) {
      addDiagnostic(diagnostics, 'TEXTBOOK_RELATION_IGNORED', relation.id)
      return false
    }
    if (!input.currentTextbookId && nodeTextbookIds.size === 1 && relation.textbookId) {
      const textbookId = [...nodeTextbookIds][0]
      if (relation.textbookId !== textbookId) {
        addDiagnostic(diagnostics, 'TEXTBOOK_RELATION_IGNORED', relation.id)
        return false
      }
    }
    return true
  })

  const knownKnowledgePointIds = new Set<Id>(nodes.map((node) => node.knowledgePointId))
  for (const relation of relations) {
    if (!knownKnowledgePointIds.has(relation.sourceKnowledgePointId)) {
      addDiagnostic(diagnostics, 'KNOWLEDGE_POINT_NOT_FOUND', relation.sourceKnowledgePointId)
      continue
    }
    if (!knownKnowledgePointIds.has(relation.targetKnowledgePointId)) {
      addDiagnostic(diagnostics, 'KNOWLEDGE_POINT_NOT_FOUND', relation.targetKnowledgePointId)
    }
  }
  const validRelations = relations.filter(
    (relation) =>
      knownKnowledgePointIds.has(relation.sourceKnowledgePointId) &&
      knownKnowledgePointIds.has(relation.targetKnowledgePointId),
  )

  const recordsByKnowledgePointId = normalizeRecords(input, knownKnowledgePointIds, diagnostics)
  const evidence = normalizeEvidence(input, knownKnowledgePointIds, diagnostics)
  addHistoryDiagnostics(recordsByKnowledgePointId, evidence, input.questionHistory, diagnostics)

  let sourceBlocked = false
  let isSampleDerived = input.dataset === 'demo'
  for (const node of nodes) {
    const status = getContentSourceStatus(node)
    sourceBlocked ||= input.dataset === 'profile' && isDisallowedSource(status)
    isSampleDerived ||= isSampleSource(status)
  }
  for (const relation of validRelations) {
    sourceBlocked ||=
      input.dataset === 'profile' &&
      (relation.isSample || isDisallowedSource(relation.verificationStatus))
    isSampleDerived ||= relation.isSample || isSampleSource(relation.verificationStatus)
  }
  for (const record of recordsByKnowledgePointId.values()) {
    const status = getRecordSourceStatus(record)
    sourceBlocked ||=
      input.dataset === 'profile' && (record.isSampleDerived || isDisallowedSource(status))
    isSampleDerived ||= record.isSampleDerived || isSampleSource(status)
  }
  for (const item of evidence) {
    const status = item.metadata?.sourceVerificationStatus
    sourceBlocked ||=
      input.dataset === 'profile' &&
      (item.metadata?.isSample === true || isDisallowedSource(status))
    isSampleDerived ||= item.metadata?.isSample === true || isSampleSource(status)
  }
  if (sourceBlocked) addDiagnostic(diagnostics, 'SOURCE_NOT_ALLOWED')
  if (nodes.length === 0) addDiagnostic(diagnostics, 'MAP_NODES_MISSING')
  if (validRelations.length === 0) addDiagnostic(diagnostics, 'KNOWLEDGE_RELATIONS_MISSING')

  if (input.currentMapNodeId && !nodes.some((node) => node.id === input.currentMapNodeId)) {
    addDiagnostic(diagnostics, 'MAP_NODE_NOT_FOUND', input.currentMapNodeId)
  }
  if (input.currentKnowledgePointId && !knownKnowledgePointIds.has(input.currentKnowledgePointId)) {
    addDiagnostic(diagnostics, 'KNOWLEDGE_POINT_NOT_FOUND', input.currentKnowledgePointId)
  }

  return {
    input,
    strategyVersion,
    policy,
    mapNodes: nodes,
    relations: validRelations,
    recordsByKnowledgePointId,
    evidence,
    questionHistory: input.questionHistory,
    diagnostics,
    sourceBlocked,
    isSampleDerived,
    ...(buildWarning(input.dataset, sourceBlocked)
      ? { warning: buildWarning(input.dataset, sourceBlocked) }
      : {}),
  }
}

function metrics(
  record: MasteryRecord | undefined,
): Pick<ReinforcementReason, 'masteryScore' | 'confidence' | 'evidenceCount'> {
  return {
    masteryScore: record?.masteryScore ?? 0,
    confidence: record?.confidence ?? 0,
    evidenceCount: record?.evidenceCount ?? 0,
  }
}

function reasonCopy(
  code: RecommendationReasonCode,
): Pick<ReinforcementReason, 'title' | 'description'> {
  switch (code) {
    case 'WEAK_MASTERY':
      return { title: '建议巩固', description: '再练几题，巩固这个知识点。' }
    case 'LOW_CONFIDENCE':
      return { title: '再收集一些证据', description: '再练几题，补充一些证据。' }
    case 'INSUFFICIENT_EVIDENCE':
      return { title: '再收集一些证据', description: '分数不错，但还需要更多作答证据。' }
    case 'NOT_STARTED':
      return { title: '从这里开始', description: '这是当前可以开始学习的知识点。' }
    case 'IN_PROGRESS':
      return { title: '继续学习', description: '你正在掌握这个知识点，可以继续当前学习。' }
    case 'MASTERED':
      return { title: '已经掌握', description: '这个知识点已经满足当前掌握条件。' }
    case 'CURRENT_KNOWLEDGE_POINT':
      return { title: '当前知识点', description: '先完成当前知识点，再决定下一步。' }
    case 'NEXT_AVAILABLE_KNOWLEDGE_POINT':
      return { title: '下一步', description: '前置条件已满足，可以继续下一个知识点。' }
    case 'PREREQUISITE_LOCKED':
      return { title: '先完成前置知识', description: '这个节点还在等待前置知识完成。' }
    case 'NO_AVAILABLE_KNOWLEDGE_POINT':
      return { title: '暂时没有优先推荐', description: '当前没有可以安全推荐的下一知识点。' }
    case 'SOURCE_NOT_ALLOWED':
      return { title: '课程正在准备中', description: '来源还没有通过审核，暂时不生成正式建议。' }
    case 'KNOWLEDGE_POINT_NOT_FOUND':
      return { title: '课程正在准备中', description: '知识点关系还不完整，暂时不能生成建议。' }
    case 'MASTERY_RECORD_NOT_FOUND':
      return { title: '还没有掌握度记录', description: '完成一些作答后，这里会显示更明确的建议。' }
  }
}

function makeReason(
  code: RecommendationReasonCode,
  record: MasteryRecord | undefined,
): ReinforcementReason {
  return { code, ...metrics(record), ...reasonCopy(code) }
}

function assessRecord(record: MasteryRecord | undefined, policy: MasteryPolicy): RecordAssessment {
  if (!record)
    return {
      type: null,
      priority: Number.MAX_SAFE_INTEGER,
      reason: makeReason('NOT_STARTED', record),
    }
  const score = record.masteryScore
  if (record.state === 'weak' || score < policy.weakThreshold) {
    return {
      type: 'REINFORCE',
      priority: 1,
      reason: makeReason('WEAK_MASTERY', record),
    }
  }
  if (record.confidence < policy.minimumConfidenceForMastery) {
    return {
      type: 'GATHER_MORE_EVIDENCE',
      priority: 2,
      reason: makeReason('LOW_CONFIDENCE', record),
    }
  }
  if (
    score >= policy.masteredThreshold &&
    record.evidenceCount < policy.minimumEvidenceForMastery
  ) {
    return {
      type: 'GATHER_MORE_EVIDENCE',
      priority: 3,
      reason: makeReason('INSUFFICIENT_EVIDENCE', record),
    }
  }
  return {
    type: null,
    priority: Number.MAX_SAFE_INTEGER,
    reason: makeReason('IN_PROGRESS', record),
  }
}

function nodeForKnowledgePoint(
  nodes: readonly StrategyMapNode[],
  knowledgePointId: Id,
  includeLocked = false,
): StrategyMapNode | undefined {
  return nodes.find(
    (node) =>
      node.knowledgePointId === knowledgePointId && (includeLocked || node.status !== 'locked'),
  )
}

function toReviewRecommendation(
  prepared: PreparedStrategyInput,
  knowledgePointId: Id,
  node: StrategyMapNode | undefined,
  assessment: RecordAssessment,
): ReviewRecommendation | null {
  if (!assessment.type) return null
  const record = prepared.recordsByKnowledgePointId.get(knowledgePointId)
  if (!record) return null
  return {
    strategyVersion: prepared.strategyVersion,
    studentProfileId: prepared.input.studentProfileId,
    knowledgePointId,
    ...(node?.id ? { mapNodeId: node.id } : {}),
    type: assessment.type,
    priority: assessment.priority,
    reason: assessment.reason,
    isSampleDerived: record.isSampleDerived || record.evidenceSourceStatus === 'SAMPLE',
    evidenceSourceStatus: record.evidenceSourceStatus,
  }
}

function compareReviewRecommendations(
  left: ReviewRecommendation,
  right: ReviewRecommendation,
  nodesById: ReadonlyMap<Id, StrategyMapNode>,
): number {
  const leftNode = left.mapNodeId ? nodesById.get(left.mapNodeId) : undefined
  const rightNode = right.mapNodeId ? nodesById.get(right.mapNodeId) : undefined
  return (
    left.priority - right.priority ||
    left.reason.masteryScore - right.reason.masteryScore ||
    left.reason.confidence - right.reason.confidence ||
    (leftNode?.sort ?? leftNode?.order ?? Number.MAX_SAFE_INTEGER) -
      (rightNode?.sort ?? rightNode?.order ?? Number.MAX_SAFE_INTEGER) ||
    compareStrings(left.knowledgePointId, right.knowledgePointId) ||
    compareStrings(left.mapNodeId, right.mapNodeId)
  )
}

function resolveReviews(
  prepared: PreparedStrategyInput,
  options: LearningStrategyOptions,
): ReviewRecommendation[] {
  if (prepared.sourceBlocked || !prepared.mapNodes.length) return []

  const candidateNodes = new Map<Id, StrategyMapNode>()
  for (const node of prepared.mapNodes) {
    if (node.status === 'locked') continue
    const existing = candidateNodes.get(node.knowledgePointId)
    if (!existing || compareMapNodes(node, existing) < 0) {
      candidateNodes.set(node.knowledgePointId, node)
    }
  }
  const knowledgePointIds = new Set<Id>([
    ...candidateNodes.keys(),
    ...prepared.relations.flatMap((relation) => [
      relation.sourceKnowledgePointId,
      relation.targetKnowledgePointId,
    ]),
  ])
  const recommendations = [...knowledgePointIds].flatMap((knowledgePointId) => {
    const assessment = assessRecord(
      prepared.recordsByKnowledgePointId.get(knowledgePointId),
      prepared.policy,
    )
    const recommendation = toReviewRecommendation(
      prepared,
      knowledgePointId,
      candidateNodes.get(knowledgePointId),
      assessment,
    )
    return recommendation ? [recommendation] : []
  })
  const nodesById = new Map(prepared.mapNodes.map((node) => [node.id, node]))
  recommendations.sort((left, right) => compareReviewRecommendations(left, right, nodesById))
  const requestedLimit = options.limit ?? options.reviewLimit ?? 3
  const limit = Number.isFinite(requestedLimit) ? Math.max(0, Math.floor(requestedLimit)) : 3
  return recommendations.slice(0, limit)
}

function isAccessibleStatus(status: LearningNodeStatus): boolean {
  return status !== 'locked'
}

function isMastered(record: MasteryRecord | undefined): boolean {
  return record?.state === 'mastered'
}

function makeNextKnowledgePoint(
  node: StrategyMapNode | undefined,
  record: MasteryRecord | undefined,
  reason: ReinforcementReason,
): NextKnowledgePoint | undefined {
  if (!node) return undefined
  return {
    knowledgePointId: node.knowledgePointId,
    mapNodeId: node.id,
    ...(node.title ? { title: node.title } : {}),
    currentStatus: node.status,
    masteryState: record?.state ?? 'not_started',
    reason,
  }
}

function emptyRecommendation(
  prepared: PreparedStrategyInput,
  code: RecommendationReasonCode,
): LearningRecommendation {
  return {
    strategyVersion: prepared.strategyVersion,
    studentProfileId: prepared.input.studentProfileId,
    type: 'NO_RECOMMENDATION',
    reviewRecommendations: [],
    diagnostics: [...prepared.diagnostics],
    isSampleDerived: prepared.isSampleDerived,
    ...(prepared.warning ? { warning: prepared.warning } : {}),
    reason: makeReason(code, undefined),
  }
}

function buildRecommendation(
  prepared: PreparedStrategyInput,
  type: StrategyRecommendationType,
  reviews: ReviewRecommendation[],
  nextKnowledgePoint: NextKnowledgePoint | undefined,
  reason: ReinforcementReason | undefined,
): LearningRecommendation {
  return {
    strategyVersion: prepared.strategyVersion,
    studentProfileId: prepared.input.studentProfileId,
    type,
    ...(nextKnowledgePoint ? { nextKnowledgePoint } : {}),
    reviewRecommendations: reviews,
    diagnostics: [...prepared.diagnostics],
    isSampleDerived: prepared.isSampleDerived,
    ...(prepared.warning ? { warning: prepared.warning } : {}),
    ...(reason ? { reason } : {}),
  }
}

function findCurrentNode(prepared: PreparedStrategyInput): StrategyMapNode | undefined {
  const { currentMapNodeId, currentKnowledgePointId } = prepared.input
  if (currentMapNodeId) {
    return prepared.mapNodes.find((node) => node.id === currentMapNodeId)
  }
  if (currentKnowledgePointId) {
    return nodeForKnowledgePoint(prepared.mapNodes, currentKnowledgePointId, true)
  }
  return (
    prepared.mapNodes.find((node) => node.status === 'learning') ??
    prepared.mapNodes.find((node) => node.status === 'available')
  )
}

function findNextAvailableNode(
  prepared: PreparedStrategyInput,
  currentNode: StrategyMapNode | undefined,
): StrategyMapNode | undefined {
  const candidates = prepared.mapNodes.filter(
    (node) => node.status === 'available' && node.id !== currentNode?.id,
  )
  return candidates.find(
    (node) => !isMastered(prepared.recordsByKnowledgePointId.get(node.knowledgePointId)),
  )
}

function makeCurrentReason(record: MasteryRecord | undefined): ReinforcementReason {
  if (!record || record.state === 'not_started') return makeReason('NOT_STARTED', record)
  if (record.state === 'learning') return makeReason('IN_PROGRESS', record)
  if (record.state === 'mastered') return makeReason('MASTERED', record)
  return makeReason('CURRENT_KNOWLEDGE_POINT', record)
}

function resolveNext(
  prepared: PreparedStrategyInput,
  reviews: ReviewRecommendation[],
): LearningRecommendation {
  if (prepared.sourceBlocked) return emptyRecommendation(prepared, 'SOURCE_NOT_ALLOWED')
  if (!prepared.mapNodes.length) return emptyRecommendation(prepared, 'KNOWLEDGE_POINT_NOT_FOUND')

  const currentNode = findCurrentNode(prepared)
  const currentRecord = currentNode
    ? prepared.recordsByKnowledgePointId.get(currentNode.knowledgePointId)
    : prepared.input.currentKnowledgePointId
      ? prepared.recordsByKnowledgePointId.get(prepared.input.currentKnowledgePointId)
      : undefined
  const currentAssessment = assessRecord(currentRecord, prepared.policy)

  if (currentNode?.status === 'locked') {
    const fallback = reviews.find((review) => review.type === 'REINFORCE')
    if (fallback) {
      const node = fallback.mapNodeId
        ? prepared.mapNodes.find((candidate) => candidate.id === fallback.mapNodeId)
        : undefined
      return buildRecommendation(
        prepared,
        'REINFORCE',
        reviews,
        makeNextKnowledgePoint(node, currentRecord, fallback.reason),
        fallback.reason,
      )
    }
    return emptyRecommendation(prepared, 'PREREQUISITE_LOCKED')
  }

  if (currentNode && currentAssessment.type) {
    const next = makeNextKnowledgePoint(currentNode, currentRecord, currentAssessment.reason)
    return buildRecommendation(
      prepared,
      currentAssessment.type,
      reviews,
      next,
      currentAssessment.reason,
    )
  }

  if (
    currentNode &&
    isAccessibleStatus(currentNode.status) &&
    !isMastered(currentRecord) &&
    currentRecord?.state !== 'mastered'
  ) {
    const reason = makeCurrentReason(currentRecord)
    const next = makeNextKnowledgePoint(currentNode, currentRecord, reason)
    return buildRecommendation(prepared, 'CONTINUE_CURRENT', reviews, next, reason)
  }

  const nextNode = findNextAvailableNode(prepared, currentNode)
  if (nextNode) {
    const nextRecord = prepared.recordsByKnowledgePointId.get(nextNode.knowledgePointId)
    const nextAssessment = assessRecord(nextRecord, prepared.policy)
    if (nextAssessment.type) {
      const next = makeNextKnowledgePoint(nextNode, nextRecord, nextAssessment.reason)
      return buildRecommendation(
        prepared,
        nextAssessment.type,
        reviews,
        next,
        nextAssessment.reason,
      )
    }
    const reason = makeReason('NEXT_AVAILABLE_KNOWLEDGE_POINT', nextRecord)
    const next = makeNextKnowledgePoint(nextNode, nextRecord, reason)
    return buildRecommendation(prepared, 'PROCEED_TO_NEXT', reviews, next, reason)
  }

  const weakFallback = reviews.find((review) => review.type === 'REINFORCE')
  if (weakFallback) {
    const node = weakFallback.mapNodeId
      ? prepared.mapNodes.find((candidate) => candidate.id === weakFallback.mapNodeId)
      : undefined
    const record = prepared.recordsByKnowledgePointId.get(weakFallback.knowledgePointId)
    return buildRecommendation(
      prepared,
      'REINFORCE',
      reviews,
      makeNextKnowledgePoint(node, record, weakFallback.reason),
      weakFallback.reason,
    )
  }
  return emptyRecommendation(prepared, 'NO_AVAILABLE_KNOWLEDGE_POINT')
}

/** Pure deterministic strategy engine. It never writes map, mastery, or question state. */
export class StrategyEngine {
  resolve(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): LearningRecommendation {
    const prepared = prepareInput(input, options)
    const reviews = resolveReviews(prepared, options)
    return resolveNext(prepared, reviews)
  }

  resolveReviews(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): ReviewRecommendation[] {
    return resolveReviews(prepareInput(input, options), options)
  }
}

/** Public review facade kept separate so callers can verify the review boundary. */
export class ReviewStrategy {
  resolve(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): ReviewRecommendation[] {
    return resolveReviews(prepareInput(input, options), options)
  }
}

/** Public next-point facade kept separate from review ranking. */
export class NextLearningResolver {
  resolve(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): LearningRecommendation {
    const prepared = prepareInput(input, options)
    return resolveNext(prepared, resolveReviews(prepared, options))
  }
}

export const strategyEngine = new StrategyEngine()
export const reviewStrategy = new ReviewStrategy()
export const nextLearningResolver = new NextLearningResolver()

export function resolveLearningRecommendation(
  input: LearningStrategyInput,
  options: LearningStrategyOptions = {},
): LearningRecommendation {
  return strategyEngine.resolve(input, options)
}

export function resolveReviewRecommendations(
  input: LearningStrategyInput,
  options: LearningStrategyOptions = {},
): ReviewRecommendation[] {
  return reviewStrategy.resolve(input, options)
}

export function resolveNextLearningRecommendation(
  input: LearningStrategyInput,
  options: LearningStrategyOptions = {},
): LearningRecommendation {
  return nextLearningResolver.resolve(input, options)
}

export { prepareInput as prepareLearningStrategyInput }
