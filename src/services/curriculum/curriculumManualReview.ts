import type {
  CurriculumBatchImportSummary,
  CurriculumBatchManifest,
  CurriculumBatchPackageInput,
  CurriculumBatchSlot,
  CurriculumBatchSourceManifestEntry,
  CurriculumImportPackage,
  CurriculumSourceManifestEntry,
  CurriculumManualReviewEligibility,
  CurriculumManualReviewStatus,
  CurriculumManualReviewStatusTransitionResult,
  CurriculumBatchManualReviewReport,
  CurriculumBatchManualReviewSlot,
  CurriculumAuditTrailEntry,
  CurriculumEvidenceRequest,
  CurriculumEvidenceReviewRow,
  CurriculumKnowledgePointExistingMatch,
  CurriculumKnowledgePointReviewItem,
  CurriculumKnowledgePointMatchStatus,
  CurriculumMappingReviewFinding,
  CurriculumMappingReviewReport,
  CurriculumRelationReviewItem,
  CurriculumRelationReviewReport,
  CurriculumReviewRecordDraft,
  CurriculumTocDiffItem,
  CurriculumTocDiffReport,
  CurriculumTocReferenceUnit,
  KnowledgePoint,
  SourceReference,
  SubjectCode,
  VerificationStatus,
} from '@/types'

import { importCurriculumPackage } from './curriculumImporter'

export interface CurriculumBatchManualReviewInput {
  manifest: CurriculumBatchManifest
  sourceManifest: readonly CurriculumBatchSourceManifestEntry[]
  sourceReferences: readonly SourceReference[]
  packageInputs: readonly CurriculumBatchPackageInput[]
  packageSummaries?: readonly CurriculumBatchImportSummary[]
  existingKnowledgePoints?: readonly KnowledgePoint[]
  originalTocs?: ReadonlyMap<string, readonly CurriculumTocReferenceUnit[]>
}

const manualReviewStatusTransitions: Readonly<
  Record<CurriculumManualReviewStatus, ReadonlySet<CurriculumManualReviewStatus>>
> = {
  NOT_STARTED: new Set([
    'NOT_STARTED',
    'EVIDENCE_MISSING',
    'EVIDENCE_CONFLICT',
    'READY_FOR_MANUAL_CHECK',
    'REJECTED',
  ]),
  EVIDENCE_MISSING: new Set([
    'EVIDENCE_MISSING',
    'EVIDENCE_CONFLICT',
    'READY_FOR_MANUAL_CHECK',
    'REJECTED',
  ]),
  EVIDENCE_CONFLICT: new Set([
    'EVIDENCE_MISSING',
    'EVIDENCE_CONFLICT',
    'READY_FOR_MANUAL_CHECK',
    'REJECTED',
  ]),
  READY_FOR_MANUAL_CHECK: new Set([
    'READY_FOR_MANUAL_CHECK',
    'MANUALLY_CONFIRMED',
    'EVIDENCE_MISSING',
    'EVIDENCE_CONFLICT',
    'REJECTED',
  ]),
  MANUALLY_CONFIRMED: new Set(['MANUALLY_CONFIRMED', 'REJECTED']),
  REJECTED: new Set([
    'REJECTED',
    'EVIDENCE_MISSING',
    'EVIDENCE_CONFLICT',
    'READY_FOR_MANUAL_CHECK',
  ]),
}

const slotEvidenceFields = [
  'selectionEvidenceStatus',
  'textbookIdentityEvidenceStatus',
  'editionEvidenceStatus',
  'isbnEvidenceStatus',
  'tocEvidenceStatus',
  'regionSelectionStatus',
] as const

const slotReviewFields = [
  'unitReviewStatus',
  'lessonReviewStatus',
  'knowledgePointReviewStatus',
  'mappingReviewStatus',
  'relationReviewStatus',
  'finalVerificationStatus',
] as const

const mappingFindingCodes: readonly CurriculumMappingReviewFinding['code'][] = [
  'LESSON_HAS_NO_CORE_KP',
  'TOO_MANY_CORE_KP',
  'WEIGHT_INVALID',
  'DUPLICATE_MAPPING',
  'SAME_KP_REPEATED_UNUSUALLY',
  'EXTENDED_WITHOUT_CORE',
  'CROSS_SUBJECT_MAPPING',
]

const SUBJECT_LABELS: Readonly<Record<SubjectCode, string>> = {
  CHINESE: '语文',
  MATH: '数学',
  ENGLISH: '英语',
}

const SEMESTER_LABELS: Readonly<Record<1 | 2, string>> = {
  1: '上册',
  2: '下册',
}

const REPEATED_KP_THRESHOLD = 20

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function sourceMetadata(source: SourceReference | undefined): {
  status?: CurriculumSourceManifestEntry['status']
  evidenceScope?: string
  validityNote?: string
  evidenceTypes?: string[]
  diagnosticCodes?: string[]
} {
  if (!source) return {}
  const candidate = source as SourceReference & {
    status?: CurriculumSourceManifestEntry['status']
    evidenceScope?: string
    validityNote?: string
    evidenceTypes?: string[]
    diagnosticCodes?: string[]
  }
  return {
    status: candidate.status,
    evidenceScope: candidate.evidenceScope,
    validityNote: candidate.validityNote,
    evidenceTypes: candidate.evidenceTypes,
    diagnosticCodes: candidate.diagnosticCodes,
  }
}

function sourceStatus(
  source: SourceReference | undefined,
): CurriculumSourceManifestEntry['status'] | undefined {
  return sourceMetadata(source).status
}

function sourceLabel(source: SourceReference | undefined): string {
  if (!source) return '未登记满足该字段的 SourceReference。'
  const metadata = sourceMetadata(source)
  const details = [metadata.status, metadata.evidenceScope, metadata.validityNote].filter(
    (value): value is string => Boolean(value),
  )
  const evidenceTypes = metadata.evidenceTypes?.length
    ? `evidenceTypes=${metadata.evidenceTypes.join(',')}`
    : undefined
  const diagnostics = metadata.diagnosticCodes?.length
    ? `diagnostics=${metadata.diagnosticCodes.join(',')}`
    : undefined
  const metadataDetails = [...details, evidenceTypes, diagnostics].filter(
    (value): value is string => Boolean(value),
  )
  return `${source.title}${metadataDetails.length > 0 ? `（${metadataDetails.join('；')}）` : ''}`
}

function sourceById(
  sourceReferences: readonly SourceReference[],
): ReadonlyMap<string, SourceReference> {
  return new Map(sourceReferences.map((source) => [source.id, source]))
}

function selectionEvidenceStatus(
  sourceId: string | undefined,
  sources: ReadonlyMap<string, SourceReference>,
): CurriculumManualReviewStatus {
  if (!sourceId) return 'EVIDENCE_MISSING'
  const status = sourceStatus(sources.get(sourceId))
  if (status === 'RELEASE_VERIFIED') return 'READY_FOR_MANUAL_CHECK'
  if (status === 'RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE') return 'EVIDENCE_CONFLICT'
  return 'EVIDENCE_MISSING'
}

function candidateEvidenceStatus(
  sourceId: string | undefined,
  sources: ReadonlyMap<string, SourceReference>,
): CurriculumManualReviewStatus {
  if (!sourceId) return 'EVIDENCE_MISSING'
  const status = sourceStatus(sources.get(sourceId))
  if (status === 'RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE') return 'EVIDENCE_CONFLICT'
  if (status === 'CANDIDATE_REQUIRES_MANUAL_REVIEW' || status === 'RELEASE_VERIFIED') {
    return 'READY_FOR_MANUAL_CHECK'
  }
  return 'EVIDENCE_MISSING'
}

function evidenceStatusForSlot(
  slot: CurriculumBatchSlot,
  source: CurriculumBatchSourceManifestEntry,
  sources: ReadonlyMap<string, SourceReference>,
  packageRecord: CurriculumImportPackage | undefined,
): Pick<
  CurriculumBatchManualReviewSlot,
  | 'selectionEvidenceStatus'
  | 'textbookIdentityEvidenceStatus'
  | 'editionEvidenceStatus'
  | 'isbnEvidenceStatus'
  | 'tocEvidenceStatus'
  | 'regionSelectionStatus'
> {
  const candidateIdentity =
    (slot.publisher ?? 'UNKNOWN') !== 'UNKNOWN' && (slot.textbookTitle ?? 'UNKNOWN') !== 'UNKNOWN'
  const identitySourceId = source.textbookSourceId ?? source.catalogSourceId
  const identityStatus = candidateIdentity
    ? candidateEvidenceStatus(identitySourceId, sources)
    : 'EVIDENCE_MISSING'
  const editionSourceId = source.textbookSourceId ?? source.catalogSourceId
  const editionSource = sources.get(editionSourceId ?? '')
  const hasEdition = source.editionYear !== undefined || editionSource?.editionYear !== undefined
  const editionStatus = hasEdition
    ? candidateEvidenceStatus(editionSourceId, sources)
    : 'EVIDENCE_MISSING'
  const isbnSourceId = source.isbnSourceId ?? source.textbookSourceId ?? source.catalogSourceId
  const isbnSource = sources.get(isbnSourceId ?? '')
  const hasIsbn = Boolean(source.isbn ?? source.candidateIsbn ?? isbnSource?.isbn)
  const tocSourceId = source.catalogSourceId ?? source.textbookSourceId
  const tocSourceStatus = sourceStatus(sources.get(tocSourceId ?? ''))
  const tocStatus = packageRecord
    ? tocSourceStatus === 'RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE'
      ? 'EVIDENCE_CONFLICT'
      : tocSourceStatus === 'CANDIDATE_REQUIRES_MANUAL_REVIEW' ||
          tocSourceStatus === 'RELEASE_VERIFIED'
        ? 'READY_FOR_MANUAL_CHECK'
        : 'EVIDENCE_MISSING'
    : candidateEvidenceStatus(tocSourceId, sources)

  return {
    selectionEvidenceStatus: selectionEvidenceStatus(source.selectionSourceId, sources),
    textbookIdentityEvidenceStatus: identityStatus,
    editionEvidenceStatus: editionStatus,
    isbnEvidenceStatus: hasIsbn ? 'READY_FOR_MANUAL_CHECK' : 'EVIDENCE_MISSING',
    tocEvidenceStatus: tocStatus,
    regionSelectionStatus: selectionEvidenceStatus(source.selectionSourceId, sources),
  }
}

function statusFromEvidence(
  statuses: readonly CurriculumManualReviewStatus[],
): CurriculumManualReviewStatus {
  if (statuses.includes('EVIDENCE_CONFLICT')) return 'EVIDENCE_CONFLICT'
  if (statuses.includes('EVIDENCE_MISSING')) return 'EVIDENCE_MISSING'
  if (statuses.every((status) => status === 'MANUALLY_CONFIRMED')) {
    return 'MANUALLY_CONFIRMED'
  }
  if (statuses.every((status) => status === 'READY_FOR_MANUAL_CHECK')) {
    return 'READY_FOR_MANUAL_CHECK'
  }
  return 'NOT_STARTED'
}

function packageReviewStatus(
  packageRecord: CurriculumImportPackage | undefined,
  validation: ReturnType<typeof importCurriculumPackage> | undefined,
): CurriculumManualReviewStatus {
  if (!packageRecord) return 'NOT_STARTED'
  return validation?.success ? 'READY_FOR_MANUAL_CHECK' : 'EVIDENCE_CONFLICT'
}

function slotBlockingIssues(
  slot: CurriculumBatchSlot,
  evidence: ReturnType<typeof evidenceStatusForSlot>,
  packageRecord: CurriculumImportPackage | undefined,
): string[] {
  const messages: string[] = [...slot.blockingSourceGaps]
  const fieldMessages: Readonly<Record<(typeof slotEvidenceFields)[number], string>> = {
    selectionEvidenceStatus: '缺少可证明 2026—2027 深圳当前教材选用关系的可靠来源。',
    textbookIdentityEvidenceStatus: '缺少可与候选材料对应的正式教材身份和原书证据。',
    editionEvidenceStatus: '缺少同一原书版次/出版或修订年份的核对记录。',
    isbnEvidenceStatus: '缺少 ISBN；需要从版权页或封底核对，不能猜测。',
    tocEvidenceStatus: '缺少与同一版次原书目录逐项对照的证据。',
    regionSelectionStatus: '地区选用关系尚未独立完成核验；出版社或国家目录不能替代它。',
  }
  for (const field of slotEvidenceFields) {
    if (evidence[field] === 'EVIDENCE_MISSING' || evidence[field] === 'EVIDENCE_CONFLICT') {
      messages.push(`${fieldMessages[field]} 当前状态：${evidence[field]}。`)
    }
  }
  const requirementLabels: Readonly<
    Record<keyof CurriculumBatchSlot['evidenceRequirements'], string>
  > = {
    coverEvidence: '需要教材封面证据',
    copyrightPageEvidence: '需要教材版权页证据',
    tocEvidence: '需要同一版次目录证据',
    regionalSelectionEvidence: '需要当前地区选用证据',
    isbnEvidence: '需要 ISBN 证据',
  }
  for (const field of Object.keys(requirementLabels) as Array<
    keyof CurriculumBatchSlot['evidenceRequirements']
  >) {
    const status = slot.evidenceRequirements[field]
    if (status !== 'MANUALLY_CONFIRMED') {
      messages.push(`${requirementLabels[field]}：${status}。`)
    }
  }
  if (!packageRecord) {
    messages.push('当前没有可供 Unit、Lesson、KnowledgePoint、Mapping、Relation 逐项核对的候选包。')
  }
  messages.push('尚未填写真实人工审核者、审核时间和逐项 review note。')
  return uniqueSorted(messages)
}

function buildSlotEvidenceRows(
  slot: CurriculumBatchManualReviewSlot,
  source: CurriculumBatchSourceManifestEntry,
  sources: ReadonlyMap<string, SourceReference>,
  evidence: ReturnType<typeof evidenceStatusForSlot>,
): { identity: CurriculumEvidenceReviewRow[]; region: CurriculumEvidenceReviewRow[] } {
  const sourceFor = (id: string | undefined): string => id ?? 'NONE'
  const evidenceRow = (input: {
    sourceId: string | undefined
    field: string
    claim: string
    evidence: string
    decision: CurriculumEvidenceReviewRow['decision']
  }): CurriculumEvidenceReviewRow => {
    const sourceRecord = input.sourceId ? sources.get(input.sourceId) : undefined
    return {
      source: sourceFor(input.sourceId),
      sourceType: sourceRecord?.type ?? 'NONE',
      evidenceTypes: sourceRecord?.evidenceTypes ? [...sourceRecord.evidenceTypes] : [],
      sourceLocator: sourceRecord?.sourceUrl ?? 'UNKNOWN',
      page: sourceRecord?.page ?? 'UNKNOWN',
      retrievedAt: sourceRecord?.retrievedAt ?? null,
      entity: slot.slot,
      field: input.field,
      claim: input.claim,
      evidence: input.evidence,
      decision: input.decision,
      reviewer: 'PENDING_MANUAL_REVIEW',
      date: null,
    }
  }
  const currentIdentitySourceId = source.textbookSourceId ?? source.catalogSourceId
  const editionSourceId = source.textbookSourceId ?? source.catalogSourceId
  const isbnSourceId = source.isbnSourceId ?? source.textbookSourceId ?? source.catalogSourceId
  const tocSourceId = source.catalogSourceId ?? source.textbookSourceId
  const identityRows: CurriculumEvidenceReviewRow[] = [
    evidenceRow({
      sourceId: currentIdentitySourceId,
      field: 'textbookIdentity',
      claim: `${slot.slotLabel} 的正式教材身份是“${slot.candidateTextbookTitle}”，出版社是“${slot.candidatePublisher}”。`,
      evidence: currentIdentitySourceId
        ? sourceLabel(sources.get(currentIdentitySourceId))
        : '没有登记教材身份来源；国家目录或历史地区目录不能替代原书身份。',
      decision: evidence.textbookIdentityEvidenceStatus,
    }),
    evidenceRow({
      sourceId: editionSourceId,
      field: 'edition',
      claim: '候选教材的版次、出版/修订年份与课程标准版本可由同一版次原书核对。',
      evidence: editionSourceId
        ? sourceLabel(sources.get(editionSourceId))
        : '没有登记版次来源；当前值为 UNKNOWN。',
      decision: evidence.editionEvidenceStatus,
    }),
    evidenceRow({
      sourceId: isbnSourceId,
      field: 'isbn',
      claim: '教材 ISBN 与实际原书身份一致。',
      evidence: isbnSourceId
        ? sourceLabel(sources.get(isbnSourceId))
        : '没有登记 ISBN 来源；当前值为 UNKNOWN，禁止推测。',
      decision: evidence.isbnEvidenceStatus,
    }),
    evidenceRow({
      sourceId: tocSourceId,
      field: 'toc',
      claim: '候选 Unit / Lesson 与同一版次原书目录一致。',
      evidence: tocSourceId
        ? sourceLabel(sources.get(tocSourceId))
        : '没有登记可用于目录比对的来源；原书目录页尚未提供。',
      decision: evidence.tocEvidenceStatus,
    }),
  ]
  for (const sourceId of slot.sourceReferenceIds) {
    const sourceRecord = sources.get(sourceId)
    const diagnosticCodes = sourceRecord?.diagnosticCodes ?? []
    if (diagnosticCodes.length === 0) continue
    identityRows.push(
      evidenceRow({
        sourceId,
        field: 'diagnostic',
        claim: `该来源带有版本诊断：${diagnosticCodes.join('、')}。`,
        evidence: `${sourceLabel(sourceRecord)}；不得用版本差异覆盖候选事实。`,
        decision: 'CONTEXT_ONLY',
      }),
    )
  }
  const regionSourceId = source.selectionSourceId
  const regionRows: CurriculumEvidenceReviewRow[] = [
    evidenceRow({
      sourceId: regionSourceId,
      field: 'regionSelection',
      claim: `该教材实际用于 ${slot.regionName} ${slot.schoolYear} 学年小学${slot.grade}年级${slot.subjectLabel}${slot.semesterLabel}。`,
      evidence: regionSourceId
        ? sourceLabel(sources.get(regionSourceId))
        : '没有登记当前地区选用来源；出版社、国家目录和历史线索不能证明当前关系。',
      decision: evidence.regionSelectionStatus,
    }),
  ]
  return { identity: identityRows, region: regionRows }
}

function mappingCounts(): Record<CurriculumMappingReviewFinding['code'], number> {
  return Object.fromEntries(mappingFindingCodes.map((code) => [code, 0])) as Record<
    CurriculumMappingReviewFinding['code'],
    number
  >
}

export function buildCurriculumMappingReviewReport(
  packageRecord: CurriculumImportPackage,
  packageId = packageRecord.textbook.id.replace(/_TEXTBOOK_.*/, ''),
): CurriculumMappingReviewReport {
  const findings: CurriculumMappingReviewFinding[] = []
  const counts = mappingCounts()
  const lessonsById = new Map(packageRecord.lessons.map((lesson) => [lesson.id, lesson]))
  const knowledgePointsById = new Map(
    packageRecord.knowledgePoints.map((knowledgePoint) => [knowledgePoint.id, knowledgePoint]),
  )
  const mappingsByLesson = new Map<string, typeof packageRecord.lessonKnowledgePoints>()
  for (const mapping of packageRecord.lessonKnowledgePoints) {
    const current = mappingsByLesson.get(mapping.lessonId) ?? []
    current.push(mapping)
    mappingsByLesson.set(mapping.lessonId, current)
    if (!Number.isFinite(mapping.weight) || mapping.weight <= 0 || mapping.weight > 1) {
      findings.push({
        code: 'WEIGHT_INVALID',
        entityId: mapping.id,
        lessonId: mapping.lessonId,
        knowledgePointId: mapping.knowledgePointId,
        message: `映射权重 ${mapping.weight} 不在 (0, 1]。`,
      })
    }
    const knowledgePoint = knowledgePointsById.get(mapping.knowledgePointId)
    if (
      knowledgePoint &&
      knowledgePoint.subjectCode !== packageRecord.textbook.identity.subjectCode
    ) {
      findings.push({
        code: 'CROSS_SUBJECT_MAPPING',
        entityId: mapping.id,
        lessonId: mapping.lessonId,
        knowledgePointId: mapping.knowledgePointId,
        message: `课次学科为 ${packageRecord.textbook.identity.subjectCode}，知识点学科为 ${knowledgePoint.subjectCode}。`,
      })
    }
  }

  const seenMappingKeys = new Map<string, string>()
  for (const mapping of packageRecord.lessonKnowledgePoints) {
    const key = `${mapping.lessonId}:${mapping.knowledgePointId}`
    const previousId = seenMappingKeys.get(key)
    if (previousId) {
      findings.push({
        code: 'DUPLICATE_MAPPING',
        entityId: mapping.id,
        lessonId: mapping.lessonId,
        knowledgePointId: mapping.knowledgePointId,
        message: `与映射 ${previousId} 指向同一课次和知识点。`,
      })
    } else {
      seenMappingKeys.set(key, mapping.id)
    }
  }

  for (const lesson of [...packageRecord.lessons].sort(
    (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
  )) {
    const mappings = mappingsByLesson.get(lesson.id) ?? []
    const coreMappings = mappings.filter((mapping) => mapping.role === 'core')
    if (coreMappings.length === 0) {
      findings.push({
        code: 'LESSON_HAS_NO_CORE_KP',
        entityId: lesson.id,
        lessonId: lesson.id,
        message: `课次“${lesson.title}”没有 core KnowledgePoint。`,
      })
    }
    if (coreMappings.length > 3) {
      findings.push({
        code: 'TOO_MANY_CORE_KP',
        entityId: lesson.id,
        lessonId: lesson.id,
        message: `课次“${lesson.title}”有 ${coreMappings.length} 个 core KnowledgePoint，超过审核阈值 3。`,
      })
    }
    if (mappings.some((mapping) => mapping.role === 'extended') && coreMappings.length === 0) {
      findings.push({
        code: 'EXTENDED_WITHOUT_CORE',
        entityId: lesson.id,
        lessonId: lesson.id,
        message: `课次“${lesson.title}”包含 extended 映射但没有 core 映射。`,
      })
    }
  }

  const mappingCountByKnowledgePoint = new Map<string, number>()
  for (const mapping of packageRecord.lessonKnowledgePoints) {
    mappingCountByKnowledgePoint.set(
      mapping.knowledgePointId,
      (mappingCountByKnowledgePoint.get(mapping.knowledgePointId) ?? 0) + 1,
    )
  }
  for (const [knowledgePointId, count] of [...mappingCountByKnowledgePoint].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    if (count >= REPEATED_KP_THRESHOLD) {
      const knowledgePoint = knowledgePointsById.get(knowledgePointId)
      findings.push({
        code: 'SAME_KP_REPEATED_UNUSUALLY',
        entityId: knowledgePointId,
        knowledgePointId,
        message: `知识点“${knowledgePoint?.name ?? knowledgePointId}”被映射 ${count} 次（阈值 ${REPEATED_KP_THRESHOLD}），需要人工确认是否过度复用。`,
      })
    }
  }

  for (const finding of findings) counts[finding.code] += 1
  return {
    packageId,
    textbookId: packageRecord.textbook.id,
    totalMappingCount: packageRecord.lessonKnowledgePoints.length,
    lessonCount: lessonsById.size,
    repeatedKnowledgePointThreshold: REPEATED_KP_THRESHOLD,
    findings: findings.sort(
      (left, right) =>
        left.code.localeCompare(right.code) || left.entityId.localeCompare(right.entityId),
    ),
    counts,
    reviewStatus: 'READY_FOR_MANUAL_CHECK',
  }
}

function tocCounts(): Record<CurriculumTocDiffReport['items'][number]['status'], number> {
  return {
    MATCH: 0,
    TITLE_DIFFERENCE: 0,
    ORDER_DIFFERENCE: 0,
    MISSING_IN_CANDIDATE: 0,
    EXTRA_IN_CANDIDATE: 0,
    NEEDS_REVIEW: 0,
  }
}

function tocItem(item: CurriculumTocDiffItem): CurriculumTocDiffItem {
  return item
}

/**
 * Compare a candidate package with a supplied original-book TOC. When the
 * original TOC is absent, every candidate row remains NEEDS_REVIEW; absence
 * is never interpreted as MATCH, EXTRA or MISSING.
 */
export function buildCurriculumTocDiffReport(
  packageRecord: CurriculumImportPackage,
  originalToc?: readonly CurriculumTocReferenceUnit[],
  packageId = packageRecord.textbook.id.replace(/_TEXTBOOK_.*/, ''),
): CurriculumTocDiffReport {
  const items: CurriculumTocDiffItem[] = []
  const counts = tocCounts()
  const lessonsByUnit = new Map<string, typeof packageRecord.lessons>()
  for (const lesson of packageRecord.lessons) {
    const current = lessonsByUnit.get(lesson.unitId) ?? []
    current.push(lesson)
    lessonsByUnit.set(lesson.unitId, current)
  }
  const sortedUnits = [...packageRecord.units].sort(
    (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
  )
  const add = (item: CurriculumTocDiffItem) => {
    items.push(tocItem(item))
    counts[item.status] += 1
  }

  if (!originalToc) {
    for (const unit of sortedUnits) {
      add({
        level: 'unit',
        candidateId: unit.id,
        candidateTitle: unit.title,
        candidateOrder: unit.sort,
        originalTitle: 'UNKNOWN',
        originalOrder: null,
        status: 'NEEDS_REVIEW',
        sourceReferenceIds: [...unit.sourceReferenceIds],
        note: '未提供同一版次原书目录页，不能判定 MATCH 或差异。',
      })
      for (const lesson of [...(lessonsByUnit.get(unit.id) ?? [])].sort(
        (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
      )) {
        add({
          level: 'lesson',
          candidateId: lesson.id,
          candidateTitle: lesson.title,
          candidateOrder: lesson.sort,
          originalTitle: 'UNKNOWN',
          originalOrder: null,
          status: 'NEEDS_REVIEW',
          sourceReferenceIds: [...lesson.sourceReferenceIds],
          note: '未提供同一版次原书目录页，不能判定 MATCH 或差异。',
        })
      }
    }
  } else {
    const originalByUnitNo = new Map(originalToc.map((unit) => [unit.unitNo, unit]))
    const matchedUnitNos = new Set<number>()
    for (const unit of sortedUnits) {
      const originalUnit = originalByUnitNo.get(unit.unitNo)
      if (!originalUnit) {
        add({
          level: 'unit',
          candidateId: unit.id,
          candidateTitle: unit.title,
          candidateOrder: unit.sort,
          originalTitle: 'UNKNOWN',
          originalOrder: null,
          status: 'EXTRA_IN_CANDIDATE',
          sourceReferenceIds: [...unit.sourceReferenceIds],
          note: '原书目录中未找到同编号 Unit。',
        })
      } else {
        matchedUnitNos.add(originalUnit.unitNo)
        const status =
          unit.title !== originalUnit.title
            ? 'TITLE_DIFFERENCE'
            : unit.sort !== originalUnit.sort
              ? 'ORDER_DIFFERENCE'
              : 'MATCH'
        add({
          level: 'unit',
          candidateId: unit.id,
          candidateTitle: unit.title,
          candidateOrder: unit.sort,
          originalTitle: originalUnit.title,
          originalOrder: originalUnit.sort,
          status,
          sourceReferenceIds: [...unit.sourceReferenceIds],
          note: status === 'MATCH' ? 'Unit 标题和顺序一致。' : '需要人工确认目录差异及修订理由。',
        })
      }

      const originalLessons = originalUnit?.lessons ?? []
      const originalLessonsByNo = new Map(
        originalLessons.map((lesson) => [lesson.lessonNo, lesson]),
      )
      const matchedLessonNos = new Set<number>()
      for (const lesson of [...(lessonsByUnit.get(unit.id) ?? [])].sort(
        (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
      )) {
        const originalLesson = originalLessonsByNo.get(lesson.lessonNo)
        if (!originalLesson) {
          add({
            level: 'lesson',
            candidateId: lesson.id,
            candidateTitle: lesson.title,
            candidateOrder: lesson.sort,
            originalTitle: 'UNKNOWN',
            originalOrder: null,
            status: 'EXTRA_IN_CANDIDATE',
            sourceReferenceIds: [...lesson.sourceReferenceIds],
            note: '原书目录中未找到同编号 Lesson。',
          })
        } else {
          matchedLessonNos.add(originalLesson.lessonNo)
          const status =
            lesson.title !== originalLesson.title
              ? 'TITLE_DIFFERENCE'
              : lesson.sort !== originalLesson.sort
                ? 'ORDER_DIFFERENCE'
                : 'MATCH'
          add({
            level: 'lesson',
            candidateId: lesson.id,
            candidateTitle: lesson.title,
            candidateOrder: lesson.sort,
            originalTitle: originalLesson.title,
            originalOrder: originalLesson.sort,
            status,
            sourceReferenceIds: [...lesson.sourceReferenceIds],
            note:
              status === 'MATCH' ? 'Lesson 标题和顺序一致。' : '需要人工确认目录差异及修订理由。',
          })
        }
      }
      for (const originalLesson of originalLessons
        .filter((lesson) => !matchedLessonNos.has(lesson.lessonNo))
        .sort((left, right) => left.sort - right.sort || left.lessonNo - right.lessonNo)) {
        add({
          level: 'lesson',
          candidateId: null,
          candidateTitle: 'UNKNOWN',
          candidateOrder: null,
          originalTitle: originalLesson.title,
          originalOrder: originalLesson.sort,
          status: 'MISSING_IN_CANDIDATE',
          sourceReferenceIds: [],
          note: '原书目录存在该 Lesson，但候选包中未找到。',
        })
      }
    }
    for (const originalUnit of originalToc
      .filter((unit) => !matchedUnitNos.has(unit.unitNo))
      .sort((left, right) => left.sort - right.sort || left.unitNo - right.unitNo)) {
      add({
        level: 'unit',
        candidateId: null,
        candidateTitle: 'UNKNOWN',
        candidateOrder: null,
        originalTitle: originalUnit.title,
        originalOrder: originalUnit.sort,
        status: 'MISSING_IN_CANDIDATE',
        sourceReferenceIds: [],
        note: '原书目录存在该 Unit，但候选包中未找到。',
      })
      for (const originalLesson of [...originalUnit.lessons].sort(
        (left, right) => left.sort - right.sort || left.lessonNo - right.lessonNo,
      )) {
        add({
          level: 'lesson',
          candidateId: null,
          candidateTitle: 'UNKNOWN',
          candidateOrder: null,
          originalTitle: originalLesson.title,
          originalOrder: originalLesson.sort,
          status: 'MISSING_IN_CANDIDATE',
          sourceReferenceIds: [],
          note: '原书目录存在该 Lesson，但候选包中对应 Unit 未找到。',
        })
      }
    }
  }

  const hasOriginalEvidence = Boolean(originalToc)
  return {
    packageId,
    textbookId: packageRecord.textbook.id,
    originalBookEvidenceStatus: hasOriginalEvidence ? 'READY_FOR_MANUAL_CHECK' : 'EVIDENCE_MISSING',
    items,
    counts,
    reviewStatus: hasOriginalEvidence ? 'READY_FOR_MANUAL_CHECK' : 'EVIDENCE_MISSING',
  }
}

export interface CurriculumAuditTrailChangeInput {
  entityType: string
  entityId: string
  field: string
  before: string | number | null
  after: string | number | null
  sourceReferenceIds?: readonly string[]
  reason: string
  reviewStatus?: CurriculumManualReviewStatus
}

function auditIdPart(value: string | number | null): string {
  return String(value ?? 'NULL').replace(/[^A-Za-z0-9_-]+/g, '_')
}

export function createCurriculumAuditTrailEntry(
  input: CurriculumAuditTrailChangeInput,
): CurriculumAuditTrailEntry {
  return {
    id: `CURRICULUM_AUDIT__${auditIdPart(input.entityType)}__${auditIdPart(input.entityId)}__${auditIdPart(input.field)}__${auditIdPart(input.before)}__${auditIdPart(input.after)}`,
    entityType: input.entityType,
    entityId: input.entityId,
    field: input.field,
    before: input.before,
    after: input.after,
    sourceReferenceIds: uniqueSorted(input.sourceReferenceIds ?? []),
    reason: input.reason,
    reviewStatus: input.reviewStatus ?? 'READY_FOR_MANUAL_CHECK',
    reviewer: 'PENDING_MANUAL_REVIEW',
    reviewedAt: null,
  }
}

export function buildCurriculumAuditTrailFromTocDiff(
  report: CurriculumTocDiffReport,
): CurriculumAuditTrailEntry[] {
  return report.items
    .filter((item) => item.status !== 'MATCH' && item.status !== 'NEEDS_REVIEW')
    .map((item) => {
      const entityType = item.level
      const entityId = item.candidateId ?? `${report.textbookId}:${item.originalOrder ?? 'UNKNOWN'}`
      const field =
        item.status === 'ORDER_DIFFERENCE'
          ? 'sort'
          : item.status === 'TITLE_DIFFERENCE'
            ? 'title'
            : 'entity_presence'
      const before =
        item.status === 'EXTRA_IN_CANDIDATE'
          ? null
          : item.originalTitle === 'UNKNOWN'
            ? null
            : item.originalTitle
      const after =
        item.status === 'MISSING_IN_CANDIDATE'
          ? null
          : item.candidateTitle === 'UNKNOWN'
            ? null
            : item.candidateTitle
      const orderBefore = item.status === 'ORDER_DIFFERENCE' ? item.originalOrder : before
      const orderAfter = item.status === 'ORDER_DIFFERENCE' ? item.candidateOrder : after
      return createCurriculumAuditTrailEntry({
        entityType,
        entityId,
        field,
        before: orderBefore,
        after: orderAfter,
        sourceReferenceIds: item.sourceReferenceIds,
        reason: item.note,
      })
    })
    .sort((left, right) => left.id.localeCompare(right.id))
}

function normalizeComparable(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s，。、“”‘’（）()\-—_/]/g, '')
}

function comparableTokens(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .split(/[\s，。、“”‘’（）()\-—_/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1)
}

function existingMatch(
  candidate: CurriculumImportPackage['knowledgePoints'][number],
  existing: readonly KnowledgePoint[],
): {
  status: CurriculumKnowledgePointMatchStatus
  matches: CurriculumKnowledgePointExistingMatch[]
} {
  const candidateName = normalizeComparable(candidate.name)
  const candidateCode = normalizeComparable(candidate.code)
  const exact = existing.filter(
    (current) =>
      normalizeComparable(current.code) === candidateCode ||
      normalizeComparable(current.name) === candidateName,
  )
  if (exact.length > 0) {
    return {
      status: 'exact match',
      matches: exact.map(toExistingMatch),
    }
  }
  const candidateTokens = new Set(comparableTokens(candidate.name))
  const possible = existing.filter((current) => {
    const currentTokens = comparableTokens(current.name)
    const overlap = currentTokens.filter((token) => candidateTokens.has(token)).length
    return overlap >= 2 || (overlap === 1 && candidateTokens.size === 1)
  })
  if (possible.length > 0) {
    return {
      status: 'possible duplicate',
      matches: possible.map(toExistingMatch),
    }
  }
  return { status: 'new knowledge point', matches: [] }
}

function toExistingMatch(point: KnowledgePoint): CurriculumKnowledgePointExistingMatch {
  return {
    id: point.id,
    code: point.code,
    name: point.name,
    isSample: (point as KnowledgePoint & { isSample?: boolean }).isSample === true,
    verificationStatus: point.verificationStatus ?? null,
  }
}

export function buildCurriculumKnowledgePointReview(
  packageInputs: readonly CurriculumBatchPackageInput[],
  existingKnowledgePoints: readonly KnowledgePoint[] = [],
): CurriculumKnowledgePointReviewItem[] {
  const candidates = new Map<
    string,
    {
      point: CurriculumImportPackage['knowledgePoints'][number]
      packageIds: Set<string>
    }
  >()
  for (const input of packageInputs) {
    for (const point of input.package.knowledgePoints) {
      const current = candidates.get(point.id) ?? { point, packageIds: new Set<string>() }
      current.packageIds.add(input.descriptor.packageId)
      candidates.set(point.id, current)
    }
  }
  return [...candidates.values()]
    .sort((left, right) => left.point.code.localeCompare(right.point.code))
    .map(({ point, packageIds }) => {
      const match = existingMatch(point, existingKnowledgePoints)
      const reviewStatus: CurriculumManualReviewStatus = 'READY_FOR_MANUAL_CHECK'
      return {
        candidateId: point.id,
        code: point.code,
        name: point.name,
        description: point.description,
        packageIds: [...packageIds].sort((left, right) => left.localeCompare(right)),
        reusedAcrossPackages: packageIds.size > 1,
        existingMatches: match.matches,
        automatedMatchStatus: match.status,
        manualDecision: 'PENDING_MANUAL_REVIEW',
        reviewStatus,
        checks: {
          name: reviewStatus,
          definition: reviewStatus,
          granularity: reviewStatus,
          duplicate: reviewStatus,
          textbookBinding: reviewStatus,
          gradeScope: reviewStatus,
          difficulty: reviewStatus,
          importance: reviewStatus,
          cognitiveLevel: reviewStatus,
        },
        reviewNote: null,
      }
    })
}

function relationReview(
  packageRecord: CurriculumImportPackage,
  validation: ReturnType<typeof importCurriculumPackage> | undefined,
  packageId = packageRecord.textbook.id.replace(/_TEXTBOOK_.*/, ''),
): CurriculumRelationReviewReport {
  const knowledgePointsById = new Map(
    packageRecord.knowledgePoints.map((point) => [point.id, point]),
  )
  const items: CurriculumRelationReviewItem[] = packageRecord.knowledgeRelations
    .map((relation) => {
      const source = knowledgePointsById.get(relation.sourceKnowledgePointId)
      const target = knowledgePointsById.get(relation.targetKnowledgePointId)
      const reason =
        relation.relationType === 'prerequisite'
          ? `候选包声明“${source?.name ?? relation.sourceKnowledgePointId}”是“${target?.name ?? relation.targetKnowledgePointId}”的前置知识；DAG PASS 只证明无环，不能证明教育逻辑。`
          : `候选包声明“${source?.name ?? relation.sourceKnowledgePointId}”与“${target?.name ?? relation.targetKnowledgePointId}”存在 ${relation.relationType} 关系，需要人工确认语义。`
      const reviewStatus: CurriculumManualReviewStatus = validation?.success
        ? 'READY_FOR_MANUAL_CHECK'
        : 'EVIDENCE_CONFLICT'
      return {
        relationId: relation.id,
        sourceKnowledgePointId: relation.sourceKnowledgePointId,
        sourceKnowledgePointName: source?.name ?? 'UNKNOWN',
        targetKnowledgePointId: relation.targetKnowledgePointId,
        targetKnowledgePointName: target?.name ?? 'UNKNOWN',
        relationType: relation.relationType,
        reason,
        evidence: [...relation.sourceReferenceIds].sort((left, right) => left.localeCompare(right)),
        reviewStatus,
        reviewNote: null,
      }
    })
    .sort((left, right) => left.relationId.localeCompare(right.relationId))
  return {
    packageId,
    textbookId: packageRecord.textbook.id,
    items,
    dagValidation: validation?.report.knowledgeDag ?? 'FAIL',
    reviewStatus: validation?.success ? 'READY_FOR_MANUAL_CHECK' : 'EVIDENCE_CONFLICT',
  }
}

function evidenceRequests(
  slots: readonly CurriculumBatchManualReviewSlot[],
): CurriculumEvidenceRequest[] {
  const priority = (slot: CurriculumBatchManualReviewSlot): 1 | 2 | 3 =>
    slot.subject === 'MATH' ? 1 : slot.subject === 'CHINESE' ? 2 : 3
  const reviewOrder: Readonly<Record<SubjectCode, number>> = {
    MATH: 0,
    CHINESE: 1,
    ENGLISH: 2,
  }
  return slots
    .map((slot) => {
      const requestedEvidence = [
        '教材封面照片或 PDF 首页',
        '版权页照片或 PDF（正式名称、出版社、版次/出版或修订年份、ISBN）',
        '与封面/版权页同一版次的完整目录页（含 Unit / Lesson 顺序）',
        `2026—2027 深圳市、区级教育局或学校的${slot.subjectLabel}教材选用/使用通知`,
      ]
      if (slot.subject === 'ENGLISH' && slot.candidatePublisher === 'UNKNOWN') {
        requestedEvidence.unshift(
          '官方说明深圳一年级英语是否存在统一市级教材；若不统一，请提供区级/学校教材映射。',
        )
      }
      if (slot.subject === 'ENGLISH') {
        requestedEvidence.push(
          '如全市不统一，请明确适用区、学校和生效学年，不创建 city-wide DEFAULT。',
        )
      }
      return {
        slot: slot.slot,
        subject: slot.subject,
        semester: slot.semester,
        priority: priority(slot),
        requestedEvidence,
        reason: slot.blockingIssues.join('；'),
      }
    })
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        reviewOrder[left.subject] - reviewOrder[right.subject] ||
        left.semester - right.semester,
    )
}

function reviewDraft(
  manifest: CurriculumBatchManifest,
  slot: CurriculumBatchManualReviewSlot,
): CurriculumReviewRecordDraft {
  const entityId = slot.packageId
    ? `${slot.packageId.replace(/_CANDIDATE$/, '')}_TEXTBOOK_CANDIDATE`
    : `SLOT_${slot.slot}`
  return {
    id: `${manifest.id}__${slot.slot}__TEXTBOOK_REVIEW_DRAFT`,
    entityType: 'textbook',
    entityId,
    action: null,
    reviewer: 'PENDING_MANUAL_REVIEW',
    reviewedAt: null,
    note: null,
    draftStatus: 'PENDING_USER_CONFIRMATION',
  }
}

export function canTransitionCurriculumManualReviewStatus(
  from: CurriculumManualReviewStatus,
  to: CurriculumManualReviewStatus,
): CurriculumManualReviewStatusTransitionResult {
  if (manualReviewStatusTransitions[from].has(to)) return { allowed: true, from, to }
  return {
    allowed: false,
    from,
    to,
    reason: `审核准备状态 ${from} 不能直接转换为 ${to}。`,
  }
}

export function isCurriculumManualReviewSlotComplete(
  slot: CurriculumBatchManualReviewSlot,
): boolean {
  return [...slotEvidenceFields, ...slotReviewFields].every(
    (field) => slot[field] === 'MANUALLY_CONFIRMED',
  )
}

export function evaluateCurriculumManualReviewEligibility(
  slot: CurriculumBatchManualReviewSlot,
  currentVerificationStatus: VerificationStatus,
): CurriculumManualReviewEligibility {
  const reasons: string[] = []
  if (!isCurriculumManualReviewSlotComplete(slot)) {
    reasons.push('全部审核字段必须为 MANUALLY_CONFIRMED。')
  }
  if (!slot.manualReviewer || slot.manualReviewer === 'PENDING_MANUAL_REVIEW') {
    reasons.push('尚未填写真实人工审核者。')
  }
  if (!slot.packageId) reasons.push('尚未绑定可审核的教材实体或候选包。')
  if (!slot.manualReviewedAt) reasons.push('尚未填写人工审核时间。')
  if (!slot.reviewNote) reasons.push('尚未填写逐项 review note。')
  return {
    canVerify: currentVerificationStatus === 'UNVERIFIED' && reasons.length === 0,
    canReview: currentVerificationStatus === 'VERIFIED' && reasons.length === 0,
    reasons,
  }
}

function buildSlot(
  slot: CurriculumBatchSlot,
  source: CurriculumBatchSourceManifestEntry,
  sources: ReadonlyMap<string, SourceReference>,
  packageRecord: CurriculumImportPackage | undefined,
  validation: ReturnType<typeof importCurriculumPackage> | undefined,
): CurriculumBatchManualReviewSlot {
  const evidence = evidenceStatusForSlot(slot, source, sources, packageRecord)
  const structureStatus = packageReviewStatus(packageRecord, validation)
  const finalVerificationStatus = statusFromEvidence([
    evidence.selectionEvidenceStatus,
    evidence.textbookIdentityEvidenceStatus,
    evidence.editionEvidenceStatus,
    evidence.isbnEvidenceStatus,
    evidence.tocEvidenceStatus,
    evidence.regionSelectionStatus,
    structureStatus,
  ])
  return {
    slot: slot.id,
    slotLabel: `${SUBJECT_LABELS[slot.subjectCode]}${SEMESTER_LABELS[slot.semester]}`,
    regionName: slot.regionName,
    schoolYear: slot.schoolYear,
    grade: slot.grade,
    subject: slot.subjectCode,
    subjectLabel: SUBJECT_LABELS[slot.subjectCode],
    semester: slot.semester,
    semesterLabel: SEMESTER_LABELS[slot.semester],
    batchSlotStatus: slot.status,
    regionalSelectionStatus: slot.regionalSelectionStatus,
    candidatePublisher: slot.publisher ?? 'UNKNOWN',
    candidateTextbookTitle: slot.textbookTitle ?? 'UNKNOWN',
    candidateSeries: slot.candidateSeries ?? null,
    candidateRevision: slot.candidateRevision ?? null,
    candidatePublication: slot.candidatePublication ?? null,
    candidateIsbn: slot.candidateIsbn ?? null,
    candidateTextbookIdentifier: slot.candidateTextbookIdentifier ?? null,
    evidenceRequirements: { ...slot.evidenceRequirements },
    diagnosticCodes: [...(slot.diagnosticCodes ?? [])],
    packageId: slot.packageId ?? null,
    sourceReferenceIds: [...slot.sourceReferenceIds].sort((left, right) =>
      left.localeCompare(right),
    ),
    ...evidence,
    unitReviewStatus: structureStatus,
    lessonReviewStatus: structureStatus,
    knowledgePointReviewStatus: structureStatus,
    mappingReviewStatus: structureStatus,
    relationReviewStatus: structureStatus,
    finalVerificationStatus,
    blockingIssues: slotBlockingIssues(slot, evidence, packageRecord),
    manualReviewer: 'PENDING_MANUAL_REVIEW',
    manualReviewedAt: null,
    reviewNote: null,
  }
}

export function buildCurriculumBatchManualReviewReport(
  input: CurriculumBatchManualReviewInput,
): CurriculumBatchManualReviewReport {
  const sources = sourceById(input.sourceReferences)
  const sourceEntries = new Map(input.sourceManifest.map((source) => [source.id, source]))
  const packageBySlot = new Map(
    input.packageInputs.map((packageInput) => [
      packageInput.descriptor.slotId,
      {
        packageRecord: packageInput.package,
        packageId: packageInput.descriptor.packageId,
      },
    ]),
  )
  const validationByPackageId = new Map(
    input.packageInputs.map((packageInput) => [
      packageInput.descriptor.packageId,
      importCurriculumPackage(packageInput.package),
    ]),
  )
  const slots = input.manifest.slots.map((slot) => {
    const source = sourceEntries.get(slot.sourceManifestEntryId)
    if (!source) {
      throw new Error(`Manual review source manifest entry missing: ${slot.sourceManifestEntryId}`)
    }
    const packageInfo = packageBySlot.get(slot.id)
    const packageRecord = packageInfo?.packageRecord
    const validation = packageInfo ? validationByPackageId.get(packageInfo.packageId) : undefined
    return buildSlot(slot, source, sources, packageRecord, validation)
  })
  const identityRows: CurriculumEvidenceReviewRow[] = []
  const regionRows: CurriculumEvidenceReviewRow[] = []
  for (const slot of input.manifest.slots) {
    const source = sourceEntries.get(slot.sourceManifestEntryId)
    if (!source) continue
    const reviewSlot = slots.find((current) => current.slot === slot.id)
    if (!reviewSlot) continue
    const rows = buildSlotEvidenceRows(
      reviewSlot,
      source,
      sources,
      evidenceStatusForSlot(slot, source, sources, packageBySlot.get(slot.id)?.packageRecord),
    )
    identityRows.push(...rows.identity)
    regionRows.push(...rows.region)
  }

  const packageInputs = [...input.packageInputs].sort((left, right) =>
    left.descriptor.packageId.localeCompare(right.descriptor.packageId),
  )
  const tocDiffReports = packageInputs.map((packageInput) =>
    buildCurriculumTocDiffReport(
      packageInput.package,
      input.originalTocs?.get(packageInput.descriptor.packageId) ??
        input.originalTocs?.get(packageInput.package.textbook.id),
      packageInput.descriptor.packageId,
    ),
  )
  const mappingReviewReports = packageInputs.map((packageInput) =>
    buildCurriculumMappingReviewReport(packageInput.package, packageInput.descriptor.packageId),
  )
  const relationReviewReports = packageInputs.map((packageInput) =>
    relationReview(
      packageInput.package,
      validationByPackageId.get(packageInput.descriptor.packageId),
      packageInput.descriptor.packageId,
    ),
  )
  const reviewRecordDrafts = slots.map((slot) => reviewDraft(input.manifest, slot))
  const evidenceCompleteSlots = slots
    .filter((slot) =>
      slotEvidenceFields.every(
        (field) => slot[field] === 'READY_FOR_MANUAL_CHECK' || slot[field] === 'MANUALLY_CONFIRMED',
      ),
    )
    .map((slot) => slot.slot)
  const evidenceMissingSlots = slots
    .filter((slot) => slotEvidenceFields.some((field) => slot[field] === 'EVIDENCE_MISSING'))
    .map((slot) => slot.slot)
  const evidenceConflictSlots = slots
    .filter((slot) => slotEvidenceFields.some((field) => slot[field] === 'EVIDENCE_CONFLICT'))
    .map((slot) => slot.slot)
  const blockingIssues = uniqueSorted(slots.flatMap((slot) => slot.blockingIssues))

  return {
    schemaVersion: 1,
    batchId: input.manifest.id,
    generatedAt: input.manifest.generatedAt,
    status: 'REQUIRES_MANUAL_REVIEW',
    slotCount: slots.length,
    slots,
    evidenceCompleteSlots,
    evidenceMissingSlots,
    evidenceConflictSlots,
    textbookIdentityReview: identityRows,
    regionSelectionReview: regionRows,
    tocDiffReports,
    knowledgePointReview: buildCurriculumKnowledgePointReview(
      packageInputs,
      input.existingKnowledgePoints ?? [],
    ),
    mappingReviewReports,
    relationReviewReports,
    reviewRecordDrafts,
    auditTrail: tocDiffReports.flatMap(buildCurriculumAuditTrailFromTocDiff),
    productionEligibleTextbooks: [],
    productionIndexChange: 'UNCHANGED',
    evidenceRequestList: evidenceRequests(slots),
    blockingIssues,
  }
}

function markdownCell(value: unknown): string {
  return String(value ?? 'UNKNOWN')
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>')
}

function statusCell(status: string | null): string {
  return `\`${markdownCell(status ?? 'PENDING_MANUAL_REVIEW')}\``
}

function listCell(values: readonly string[]): string {
  return values.length > 0 ? values.map(markdownCell).join('<br>') : 'NONE'
}

function renderSlotMatrix(slots: readonly CurriculumBatchManualReviewSlot[]): string {
  const headers = [
    'slot',
    'subject',
    'semester',
    'batchSlotStatus',
    'regionalSelectionStatus',
    'candidatePublisher',
    'candidateTextbookTitle',
    'selectionEvidenceStatus',
    'textbookIdentityEvidenceStatus',
    'editionEvidenceStatus',
    'isbnEvidenceStatus',
    'tocEvidenceStatus',
    'regionSelectionStatus',
    'unitReviewStatus',
    'lessonReviewStatus',
    'knowledgePointReviewStatus',
    'mappingReviewStatus',
    'relationReviewStatus',
    'finalVerificationStatus',
    'blockingIssues',
    'manualReviewer',
    'manualReviewedAt',
    'reviewNote',
  ]
  const rows = slots.map((slot) =>
    [
      slot.slot,
      `${slot.subject}（${slot.subjectLabel}）`,
      `${slot.semester}（${slot.semesterLabel}）`,
      slot.batchSlotStatus,
      slot.regionalSelectionStatus,
      slot.candidatePublisher,
      slot.candidateTextbookTitle,
      slot.selectionEvidenceStatus,
      slot.textbookIdentityEvidenceStatus,
      slot.editionEvidenceStatus,
      slot.isbnEvidenceStatus,
      slot.tocEvidenceStatus,
      slot.regionSelectionStatus,
      slot.unitReviewStatus,
      slot.lessonReviewStatus,
      slot.knowledgePointReviewStatus,
      slot.mappingReviewStatus,
      slot.relationReviewStatus,
      slot.finalVerificationStatus,
      slot.blockingIssues,
      slot.manualReviewer,
      slot.manualReviewedAt ?? 'PENDING_MANUAL_REVIEW',
      slot.reviewNote ?? 'PENDING_MANUAL_REVIEW',
    ]
      .map((value, index) =>
        index >= 7 && index <= 18
          ? statusCell(String(value))
          : index === 19 && Array.isArray(value)
            ? listCell(value)
            : markdownCell(value),
      )
      .join(' | '),
  )
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row} |`),
  ].join('\n')
}

function renderPublicEvidenceEntryTable(slots: readonly CurriculumBatchManualReviewSlot[]): string {
  const rows = slots.map(
    (slot) =>
      `| ${markdownCell(slot.slot)} | ${markdownCell(slot.batchSlotStatus)} | ${markdownCell(slot.regionalSelectionStatus)} | ${markdownCell(slot.candidatePublisher)} | ${markdownCell(slot.candidateTextbookTitle)} | ${markdownCell(slot.candidateSeries)} | ${markdownCell(slot.candidateRevision)} | ${markdownCell(slot.candidatePublication)} | ${markdownCell(slot.candidateIsbn)} | ${markdownCell(slot.candidateTextbookIdentifier)} | ${listCell(slot.diagnosticCodes)} | ${markdownCell(slot.evidenceRequirements.coverEvidence)} | ${markdownCell(slot.evidenceRequirements.copyrightPageEvidence)} | ${markdownCell(slot.evidenceRequirements.tocEvidence)} | ${markdownCell(slot.evidenceRequirements.regionalSelectionEvidence)} | ${markdownCell(slot.evidenceRequirements.isbnEvidence)} | ${markdownCell('UNVERIFIED')} |`,
  )
  return [
    '| Slot | Batch slot status | Regional selection status | Candidate publisher | Candidate textbook title | Candidate series | Candidate revision | Candidate publication | Candidate ISBN | Candidate textbook identifier | Diagnostics | coverEvidence | copyrightPageEvidence | tocEvidence | regionalSelectionEvidence | isbnEvidence | Entity VerificationStatus |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n')
}

function renderEvidenceTable(rows: readonly CurriculumEvidenceReviewRow[]): string {
  const body = rows.map(
    (row) =>
      `| ${markdownCell(row.source)} | ${markdownCell(row.sourceType)} | ${markdownCell(row.evidenceTypes.join(', ') || 'UNKNOWN')} | ${markdownCell(row.sourceLocator)} | ${markdownCell(row.page)} | ${markdownCell(row.retrievedAt ?? 'UNKNOWN')} | ${markdownCell(row.entity)} | ${markdownCell(row.field)} | ${markdownCell(row.claim)} | ${markdownCell(row.evidence)} | ${statusCell(row.decision)} | ${markdownCell(row.reviewer)} | ${markdownCell(row.date ?? 'PENDING_MANUAL_REVIEW')} |`,
  )
  return [
    '| Source | Source type | Evidence types | Source filename / URL | Page | Retrieved at | Entity | Field | Claim | Evidence | Decision | Reviewer | Date |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...body,
  ].join('\n')
}

function renderTocReport(report: CurriculumTocDiffReport): string {
  const summary = Object.entries(report.counts)
    .map(([status, count]) => `${status}=${count}`)
    .join('；')
  const rows = report.items.map(
    (item) =>
      `| ${item.level} | ${markdownCell(item.candidateId ?? 'UNKNOWN')} | ${markdownCell(item.candidateTitle)} | ${markdownCell(item.candidateOrder)} | ${markdownCell(item.originalTitle)} | ${markdownCell(item.originalOrder)} | ${statusCell(item.status)} | ${markdownCell(item.note)} |`,
  )
  return [
    `### ${report.packageId}`,
    '',
    `- 原书目录证据：${statusCell(report.originalBookEvidenceStatus)}`,
    `- 差异计数：${summary}`,
    '',
    '| Level | Candidate ID | Candidate Title | Candidate Order | Original Title | Original Order | Status | Note |',
    '| --- | --- | --- | ---: | --- | ---: | --- | --- |',
    ...rows,
  ].join('\n')
}

function renderKnowledgePointTable(items: readonly CurriculumKnowledgePointReviewItem[]): string {
  const rows = items.map(
    (item) =>
      `| ${markdownCell(item.candidateId)} | ${markdownCell(item.code)} | ${markdownCell(item.name)} | ${markdownCell(item.packageIds.join(', '))} | ${item.reusedAcrossPackages ? 'REUSED' : 'NEW'} | ${markdownCell(item.existingMatches.map((match) => `${match.id}：${match.name}`).join('<br>') || 'NONE')} | ${markdownCell(item.automatedMatchStatus)} | ${markdownCell(item.manualDecision)} | ${statusCell(item.reviewStatus)} |`,
  )
  return [
    '| Candidate ID | Code | Name | Packages | Reuse | Existing match | Automated match | Manual decision | Review status |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n')
}

function renderMappingReports(reports: readonly CurriculumMappingReviewReport[]): string {
  return reports
    .map((report) => {
      const counts = Object.entries(report.counts)
        .filter(([, count]) => count > 0)
        .map(([code, count]) => `${code}=${count}`)
        .join('；')
      const findings = report.findings.length
        ? report.findings.map(
            (finding) =>
              `| ${finding.code} | ${markdownCell(finding.entityId)} | ${markdownCell(finding.lessonId ?? 'UNKNOWN')} | ${markdownCell(finding.knowledgePointId ?? 'UNKNOWN')} | ${markdownCell(finding.message)} |`,
          )
        : [
            '| NONE | NONE | NONE | NONE | 当前自动异常扫描未发现结构性异常；仍需人工判断权重和教研语义。 |',
          ]
      return [
        `### ${report.packageId}`,
        '',
        `- mappings=${report.totalMappingCount}；lessons=${report.lessonCount}；重复知识点阈值=${report.repeatedKnowledgePointThreshold}`,
        `- findings=${report.findings.length}${counts ? `；${counts}` : ''}`,
        `- reviewStatus=${statusCell(report.reviewStatus)}`,
        '',
        '| Code | Entity | Lesson | KnowledgePoint | Message |',
        '| --- | --- | --- | --- | --- |',
        ...findings,
      ].join('\n')
    })
    .join('\n\n')
}

function renderRelationReports(reports: readonly CurriculumRelationReviewReport[]): string {
  return reports
    .map((report) => {
      const rows = report.items.map(
        (item) =>
          `| ${markdownCell(item.relationId)} | ${markdownCell(item.sourceKnowledgePointName)} (${markdownCell(item.sourceKnowledgePointId)}) | ${markdownCell(item.targetKnowledgePointName)} (${markdownCell(item.targetKnowledgePointId)}) | ${markdownCell(item.relationType)} | ${markdownCell(item.reason)} | ${markdownCell(item.evidence.join(', '))} | ${statusCell(item.reviewStatus)} |`,
      )
      return [
        `### ${report.packageId}`,
        '',
        `- DAG 自动校验：${report.dagValidation}`,
        `- 教研审核状态：${statusCell(report.reviewStatus)}`,
        '',
        '| Relation | Source KP | Target KP | Type | Reason | Evidence | Review status |',
        '| --- | --- | --- | --- | --- | --- | --- |',
        ...rows,
      ].join('\n')
    })
    .join('\n\n')
}

function renderAuditTrail(entries: readonly CurriculumAuditTrailEntry[]): string {
  const rows = entries.map(
    (entry) =>
      `| ${markdownCell(entry.id)} | ${markdownCell(entry.entityType)} | ${markdownCell(entry.entityId)} | ${markdownCell(entry.field)} | ${markdownCell(entry.before)} | ${markdownCell(entry.after)} | ${markdownCell(entry.sourceReferenceIds.join(', '))} | ${markdownCell(entry.reason)} | ${statusCell(entry.reviewStatus)} | ${markdownCell(entry.reviewer)} | ${markdownCell(entry.reviewedAt ?? 'PENDING_MANUAL_REVIEW')} |`,
  )
  return [
    '| ID | Entity type | Entity ID | Field | Before | After | Source | Reason | Review status | Reviewer | Reviewed at |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...(rows.length > 0
      ? rows
      : [
          '| NONE | NONE | NONE | NONE | NONE | NONE | NONE | 当前没有已提交的修正；待人工提供 before / after。 | `NOT_STARTED` | PENDING_MANUAL_REVIEW | PENDING_MANUAL_REVIEW |',
        ]),
  ].join('\n')
}

export function renderCurriculumBatchManualReviewReport(
  report: CurriculumBatchManualReviewReport,
): string {
  const slotRows = report.slots
    .map((slot) => `- ${slot.slot}：${slot.finalVerificationStatus}`)
    .join('\n')
  const draftRows = report.reviewRecordDrafts.map(
    (draft) =>
      `| ${markdownCell(draft.id)} | ${markdownCell(draft.entityType)} | ${markdownCell(draft.entityId)} | ${markdownCell(draft.action ?? 'PENDING_MANUAL_REVIEW')} | ${markdownCell(draft.reviewer)} | ${markdownCell(draft.reviewedAt ?? 'PENDING_MANUAL_REVIEW')} | ${markdownCell(draft.note ?? 'PENDING_MANUAL_REVIEW')} | ${draft.draftStatus} |`,
  )
  const requestRows = report.evidenceRequestList.map(
    (request) =>
      `| ${request.priority} | ${request.slot} | ${request.subject} ${request.semester === 1 ? '上册' : '下册'} | ${listCell(request.requestedEvidence)} | ${markdownCell(request.reason)} |`,
  )
  return `# CURRICULUM DATA REVIEW 01

## 文档状态

| 项目 | 值 |
| --- | --- |
| Batch ID | \`${report.batchId}\` |
| 目标范围 | 深圳市 / 小学一年级 / 2026—2027 / 语文、数学、英语上下册 |
| Review preparation status | \`${report.status}\` |
| Slot count | ${report.slotCount} |
| Evidence complete slots | ${report.evidenceCompleteSlots.length} |
| Evidence missing slots | ${report.evidenceMissingSlots.length} |
| Evidence conflict slots | ${report.evidenceConflictSlots.length} |
| Production Index | \`${report.productionIndexChange}\` |

本报告是人工审核准备材料，不是审核决定。\`READY_FOR_MANUAL_CHECK\` 只表示已有材料可供人工逐项检查；它不等于 \`MANUALLY_CONFIRMED\`、\`VERIFIED\` 或 \`REVIEWED\`。本报告没有填写真实 reviewer、reviewedAt，也没有修改 Candidate Package、Verification 状态或 Production Index。

## 1. Shenzhen Grade 1 6-slot Manual Review Matrix

${renderSlotMatrix(report.slots)}

### Public Evidence Data Entry

下表只登记公开资料支持的候选身份、候选 ISBN / 识别码和证据要求。\`candidateIsbn\` 不是实物核验结果；\`candidateTextbookIdentifier\` 不是 ISBN；所有实体 VerificationStatus 仍为 \`UNVERIFIED\`。

${renderPublicEvidenceEntryTable(report.slots)}

### 当前槽位结论

${slotRows}

### Evidence 分类

- Evidence Complete Slots：${report.evidenceCompleteSlots.length ? report.evidenceCompleteSlots.join('、') : 'NONE'}
- Evidence Missing Slots：${report.evidenceMissingSlots.length ? report.evidenceMissingSlots.join('、') : 'NONE'}
- Evidence Conflict Slots：${report.evidenceConflictSlots.length ? report.evidenceConflictSlots.join('、') : 'NONE'}
- 以上两个列表可以重叠：同一槽位可能同时缺字段并存在历史证据冲突。

## 2. Textbook Identity Review

必须人工核对正式教材名称、出版社、教材系列、学段、年级、学期、版次、出版/修订年份、课程标准版本和 ISBN。缺失字段保持 \`UNKNOWN\`，不得从出版社名、国家目录或模型记忆补齐。

${renderEvidenceTable(report.textbookIdentityReview)}

## 3. Region Selection Review

必须单独回答“这本教材是否实际用于 2026—2027 学年深圳一年级对应学科”。出版社存在、国家目录、历史深圳目录和课程标准都不能单独确认当前地区关系。若不同区/学校不同，审核结果应改为 district mapping 或 school override，不创建 city-wide DEFAULT。

${renderEvidenceTable(report.regionSelectionReview)}

## 4. TOC Diff Report

数学审核优先。当前没有与候选身份闭环的原书目录页，因此数学上下册的 Candidate Unit / Lesson 均保留为 \`NEEDS_REVIEW\`；没有静默修正目录。若人工发现差异，必须记录 before、after、source、reason 和 reviewStatus，再重新运行 import diff。

${report.tocDiffReports.map(renderTocReport).join('\n\n') || '当前没有候选目录包。'}

## 5. KnowledgePoint Review

KnowledgePoint 不会因教材目录通过而自动变成 \`REVIEWED\`。当前需要人工核对名称、定义、粒度、重复/去重、是否教材绑定、gradeStart / gradeEnd、difficulty、importance 和 cognitiveLevel。跨上下册复用只作为候选事实；最终决定必须是 \`REUSE\`、\`SPLIT\`、\`MERGE\`、\`RENAME\` 或 \`REJECT\` 之一。

${renderKnowledgePointTable(report.knowledgePointReview) || '当前没有候选 KnowledgePoint。'}

## 6. Mapping Review Report

自动检查只负责标记异常，不替人工判断教研正确性。当前“同一知识点重复映射”的阈值为 20 次，仅是审核提醒；Schema PASS 不等于权重合理。

${renderMappingReports(report.mappingReviewReports) || '当前没有候选 Mapping。'}

## 7. KnowledgeRelation Review

当前每条关系都要人工确认 source KP、target KP、relation type、reason 和 evidence。DAG PASS 只证明没有环，不证明 prerequisite 的教育逻辑正确。

${renderRelationReports(report.relationReviewReports) || '当前没有候选 Relation。'}

## 8. CurriculumReviewRecord Drafts

以下是待用户确认的草稿，不符合正式 \`CurriculumReviewRecordSchema\`，不会写入实体。\`action\`、\`reviewer\`、\`reviewedAt\` 和 note 必须由真实人工审核者填写；禁止使用 teacher01、admin、system-reviewer 或其他伪造身份。

| ID | Entity type | Entity ID | Action | Reviewer | Reviewed at | Note | Draft status |
| --- | --- | --- | --- | --- | --- | --- | --- |
${draftRows.join('\n') || '| NONE | NONE | NONE | NONE | NONE | NONE | NONE | NONE |'}

## 9. Audit Trail

任何标题、顺序、ISBN、Unit、Lesson、KnowledgePoint 或 Relation 修正都必须保留 before、after、source、reason 和 reviewStatus。当前原书目录证据缺失，因此没有提交任何静默修正；下表仅承载明确差异或后续补证据后生成的审计记录。

${renderAuditTrail(report.auditTrail)}

## 10. Evidence Request List

${report.evidenceRequestList.length ? `| Priority | Slot | Subject / Semester | Requested evidence | Reason |\n| ---: | --- | --- | --- | --- |\n${requestRows.join('\n')}` : '当前没有请求。'}

## 11. Production Decision

| 项目 | 结果 |
| --- | --- |
| Production eligible textbooks | ${report.productionEligibleTextbooks.length ? report.productionEligibleTextbooks.join(', ') : 'NONE'} |
| Production Index change | \`${report.productionIndexChange}\` |
| Candidate packages changed | NO |
| MASTERY_V1 / STRATEGY_V1 changed | NO |
| Grade 2 / PHASE 17 entered | NO |

Production 只接真实人工审核后达到 \`REVIEWED\` 且满足 Region Mapping、版权、Content 和 Question 门禁的记录。本轮没有满足条件的教材，因此 Production Index 保持不变。

## 12. Blocking Issues

${report.blockingIssues.map((issue) => `- ${markdownCell(issue)}`).join('\n') || '- NONE'}

## 13. Final Review Status

**${report.status}**

当前不存在已经满足 \`VERIFIED\` 条件的 Batch 01 教材，也不存在已经满足 \`REVIEWED\` 条件的 Batch 01 教材。只有收到明确的人工确认（例如“我已经核对”）并取得对应证据后，才可以依照状态机执行 \`UNVERIFIED → VERIFIED\`，再由第二轮审核执行 \`VERIFIED → REVIEWED\`；不得直接 \`UNVERIFIED → REVIEWED\`。

下一步停止在人工证据补齐与审核，不启动 Grade 2，不进入 PHASE 17。
`
}

export function renderCurriculumBatchEvidenceReview(
  report: CurriculumBatchManualReviewReport,
): string {
  const rows = [...report.textbookIdentityReview, ...report.regionSelectionReview]
  return `# CURRICULUM BATCH 01 EVIDENCE REVIEW

## 用途

本文件汇总 Batch 01 的 Source / Entity / Field / Claim / Evidence / Decision / Reviewer / Date。它是证据盘点和人工审核入口，不是人工审核记录；所有 Reviewer 和 Date 保持待填写。

## Evidence Table

${renderEvidenceTable(rows)}

## Evidence Rules

- 当前地区选用必须有深圳市、区级教育局或学校官方的 2026—2027 证明。
- 历史选用材料只能标记为 \`EVIDENCE_CONFLICT\` / \`RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE\`，不能确认当前学年。
- 出版社存在、教育部国家目录和课程标准只能作为背景或候选来源，不能替代地区关系与原书身份。
- 封面、版权页、目录页、版次和 ISBN 必须属于同一实际原书；无法确认时保持 \`UNKNOWN\`。
- \`PENDING_MANUAL_REVIEW\` 不是 reviewer 身份，不得写入正式 \`verifiedBy\`。
`
}

export function renderCurriculumBatchPhysicalEvidenceRequest(
  report: CurriculumBatchManualReviewReport,
): string {
  const code = String.fromCharCode(96)
  const sections = report.slots
    .map((slot) =>
      [
        '### ' + slot.slot + '：' + slot.subjectLabel + slot.semesterLabel,
        '',
        '| 项目 | 当前候选记录 |',
        '| --- | --- |',
        '| 候选出版社 | ' + markdownCell(slot.candidatePublisher) + ' |',
        '| 候选教材身份 | ' + markdownCell(slot.candidateTextbookTitle) + ' |',
        '| 候选系列 | ' + markdownCell(slot.candidateSeries) + ' |',
        '| 候选版本 | ' + markdownCell(slot.candidateRevision) + ' |',
        '| 候选出版标识 | ' + markdownCell(slot.candidatePublication) + ' |',
        '| 候选 ISBN | ' + markdownCell(slot.candidateIsbn) + ' |',
        '| 候选教材识别码 | ' + markdownCell(slot.candidateTextbookIdentifier) + ' |',
        '| 当前实体 VerificationStatus | ' + code + 'UNVERIFIED' + code + ' |',
        '| 版本诊断 | ' + listCell(slot.diagnosticCodes) + ' |',
        '',
        '需要提交：',
        '',
        '- [ ] 原书封面照片或 PDF 首页',
        '- [ ] 原书版权页照片或 PDF（正式书名、出版社、版次/出版或修订年份、ISBN）',
        '- [ ] 与封面和版权页属于同一版次的完整目录页',
        '- [ ] 2026—2027 深圳市、区级教育局或学校的' + slot.subjectLabel + '教材选用/使用证明',
        '- [ ] 若不是全市统一版本，注明适用区、学校和生效学年，不创建 city-wide DEFAULT',
        '',
        '当前阻断：' + listCell(slot.blockingIssues),
      ].join('\n'),
    )
    .join('\n\n')
  const priorityRows = report.evidenceRequestList
    .map(
      (request) =>
        '1. ' +
        request.slot +
        '（优先级 ' +
        request.priority +
        '）：' +
        request.requestedEvidence.join('；'),
    )
    .join('\n')
  return [
    '# BATCH 01 PHYSICAL EVIDENCE REQUEST',
    '',
    '## 用途',
    '',
    '本清单请求 Batch 01 六个槽位的原书和当前地区选用证据。它只补充人工审核输入，不会自动改变候选包、VerificationStatus 或 Production Index。',
    '',
    '## Submission Rules',
    '',
    '- 证据必须能追溯到具体文件、URL、页码和取得日期。',
    '- 封面、版权页和目录页必须来自同一实际原书；无法确认的字段保持 ' +
      code +
      'UNKNOWN' +
      code +
      '。',
    '- 公开教材存在、国家目录、地方资源平台和历史深圳目录不能单独证明 2026—2027 深圳当前选用。',
    '- 真实人工审核者填写 reviewer、reviewedAt 和 review note 后，才可考虑按状态机从 ' +
      code +
      'UNVERIFIED' +
      code +
      ' 推进到 ' +
      code +
      'VERIFIED' +
      code +
      '；不得直接推进到 ' +
      code +
      'REVIEWED' +
      code +
      '。',
    '',
    '## Priority',
    '',
    priorityRows,
    '',
    '## Slot Requests',
    '',
    sections,
    '',
    '## Production Boundary',
    '',
    '- Production eligible textbooks：NONE',
    '- Production Index：' + code + 'UNCHANGED' + code,
    '- Grade 2 / PHASE 17：NO',
  ].join('\n')
}

export function renderManualReviewChecklist(report: CurriculumBatchManualReviewReport): string {
  const slotSections = report.slots
    .map(
      (slot) => `### ${slot.slot}：${slot.subjectLabel}${slot.semesterLabel}

- [ ] 教材身份：正式名称、出版社、教材系列、学段、年级、学期
- [ ] 版次、出版/修订年份、课程标准版本
- [ ] ISBN（若不存在，记录原书依据和缺失原因）
- [ ] 原书封面
- [ ] 原书版权页
- [ ] 原书目录页
- [ ] 2026—2027 深圳/区/学校选用关系
- [ ] 如果区/学校不一致，记录 district mapping / school override
- [ ] Unit 标题与顺序
- [ ] Lesson 标题与顺序
- [ ] KnowledgePoint 名称、定义、粒度、gradeScope、difficulty、importance、cognitiveLevel
- [ ] KnowledgePoint 去重决定：REUSE / SPLIT / MERGE / RENAME / REJECT
- [ ] LessonKnowledgePoint 的 core / secondary / extended 与权重
- [ ] KnowledgeRelation 的方向、类型、prerequisite 语义
- [ ] 填写真实 manualReviewer
- [ ] 填写 manualReviewedAt
- [ ] 填写逐项 reviewNote
- [ ] 依据状态机决定是否可从 UNVERIFIED → VERIFIED
- [ ] 第二轮审核后才考虑 VERIFIED → REVIEWED
`,
    )
    .join('\n')
  return `# MANUAL REVIEW CHECKLIST

## 使用说明

这份清单供真实人工审核者逐项勾选。勾选本身不自动改变代码或数据状态；完成后请提供证据文件、审核者身份、时间和 review note，并明确回复“我已经核对”或等价确认。禁止直接把候选包标成 REVIEWED。

## Batch Scope

- [ ] Batch ID：\`${report.batchId}\`
- [ ] 范围确认为深圳市、小学一年级、2026—2027 学年
- [ ] 六个槽位均被单独处理，没有把历史信息跨学期外推
- [ ] 当前 Production Index 未被候选数据污染

## Slot-by-slot Review

${slotSections}

## Final Gate

- [ ] 所有证据来源可追溯到文件/URL、页码和 retrievedAt
- [ ] 没有把历史来源当作当前地区选用证明
- [ ] 没有把 Schema PASS 当作教研审核 PASS
- [ ] 没有把 DAG PASS 当作 prerequisite 教育逻辑 PASS
- [ ] 没有伪造 reviewer 或 verifiedAt
- [ ] 如存在目录、ISBN、KP 或 relation 修正，已保留 before / after / source / reason / reviewStatus
- [ ] 只有真实人工确认后，才按状态机推进 Verification
- [ ] 如仅数学通过，Production Scope 只增加已 REVIEWED 数学，语文/英语仍排除

## Evidence Request Priority

${report.evidenceRequestList.map((request) => `1. ${request.slot}：${request.requestedEvidence.join('；')}`).join('\n')}
`
}
