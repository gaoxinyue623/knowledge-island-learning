import { describe, expect, it } from 'vitest'

import {
  batch01Manifest,
  batch01MathG1S1Package,
  batch01MathG1S2Package,
  batch01SourceManifest,
  curriculumSourceManifest,
} from '@/data/curriculum'
import {
  buildCurriculumAuditTrailFromTocDiff,
  buildCurriculumBatchManualReviewReport,
  buildCurriculumMappingReviewReport,
  buildCurriculumTocDiffReport,
  canTransitionCurriculumManualReviewStatus,
  canTransitionVerificationStatus,
  createCurriculumAuditTrailEntry,
  CurriculumBatchManualReviewReportSchema,
  CurriculumBatchManualReviewSlotSchema,
  evaluateCurriculumManualReviewEligibility,
  isCurriculumManualReviewSlotComplete,
  renderCurriculumBatchManualReviewReport,
  CurriculumReviewRecordSchema,
} from '@/services/curriculum'
import type {
  CurriculumBatchManualReviewSlot,
  CurriculumBatchPackageInput,
  CurriculumTocReferenceUnit,
} from '@/types'

const packageInputs: readonly CurriculumBatchPackageInput[] = batch01Manifest.packages.map(
  (descriptor) => ({
    descriptor,
    package: descriptor.packageId.includes('S1') ? batch01MathG1S1Package : batch01MathG1S2Package,
  }),
)

function buildReport() {
  return buildCurriculumBatchManualReviewReport({
    manifest: batch01Manifest,
    sourceManifest: batch01SourceManifest,
    sourceReferences: curriculumSourceManifest,
    packageInputs,
  })
}

describe('Curriculum Data Review 01 manual review preparation', () => {
  it('builds the explicit six-slot matrix without a verification decision', () => {
    const report = buildReport()
    const requiredFields = [
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
    ] as const
    const validStatuses = new Set([
      'NOT_STARTED',
      'EVIDENCE_MISSING',
      'EVIDENCE_CONFLICT',
      'READY_FOR_MANUAL_CHECK',
      'MANUALLY_CONFIRMED',
      'REJECTED',
    ])

    expect(report.status).toBe('REQUIRES_MANUAL_REVIEW')
    expect(report.slots).toHaveLength(6)
    expect(report.slots.map((slot) => slot.slot)).toEqual([
      'B01-SZ-G1-CHI-S1',
      'B01-SZ-G1-CHI-S2',
      'B01-SZ-G1-MATH-S1',
      'B01-SZ-G1-MATH-S2',
      'B01-SZ-G1-ENG-S1',
      'B01-SZ-G1-ENG-S2',
    ])
    for (const slot of report.slots) {
      for (const field of requiredFields) expect(validStatuses.has(slot[field])).toBe(true)
      expect(slot.batchSlotStatus).toBe('PARTIAL')
      expect(slot.regionalSelectionStatus).toBe('NOT_CONFIRMED')
      expect(slot.manualReviewer).toBe('PENDING_MANUAL_REVIEW')
      expect(slot.manualReviewedAt).toBeNull()
      expect(slot.reviewNote).toBeNull()
    }
    expect(report.evidenceCompleteSlots).toEqual([])
    expect(report.evidenceMissingSlots).toHaveLength(6)
    expect(report.evidenceConflictSlots).toEqual([
      'B01-SZ-G1-CHI-S2',
      'B01-SZ-G1-MATH-S2',
      'B01-SZ-G1-ENG-S2',
    ])
    expect(report.productionEligibleTextbooks).toEqual([])
    expect(report.productionIndexChange).toBe('UNCHANGED')
    expect(CurriculumBatchManualReviewReportSchema.safeParse(report).success).toBe(true)
    expect(CurriculumBatchManualReviewSlotSchema.safeParse(report.slots[0]).success).toBe(true)
    expect(
      report.slots.every(
        (slot) =>
          slot.evidenceRequirements.regionalSelectionEvidence === 'OFFICIAL_SELECTION_REQUIRED',
      ),
    ).toBe(true)
    expect(
      report.slots.every((slot) => slot.finalVerificationStatus !== 'MANUALLY_CONFIRMED'),
    ).toBe(true)
  })

  it('keeps missing selection evidence and historical evidence from confirming current use', () => {
    const report = buildReport()
    const mathUpper = report.slots.find((slot) => slot.slot === 'B01-SZ-G1-MATH-S1')
    const chineseLower = report.slots.find((slot) => slot.slot === 'B01-SZ-G1-CHI-S2')
    if (!mathUpper || !chineseLower) throw new Error('expected Batch 01 slots are missing')

    expect(mathUpper.textbookIdentityEvidenceStatus).toBe('READY_FOR_MANUAL_CHECK')
    expect(mathUpper.selectionEvidenceStatus).toBe('EVIDENCE_MISSING')
    expect(mathUpper.regionSelectionStatus).toBe('EVIDENCE_MISSING')
    expect(chineseLower.selectionEvidenceStatus).toBe('EVIDENCE_CONFLICT')
    expect(chineseLower.regionSelectionStatus).toBe('EVIDENCE_CONFLICT')
    expect(report.evidenceCompleteSlots).not.toContain(mathUpper.slot)
    expect(mathUpper.candidateRevision).toBe('2024 修订体系')
    expect(mathUpper.candidateTextbookIdentifier).toBe('35524210031')
    expect(mathUpper.candidateIsbn).toBeNull()
    expect(chineseLower.candidateSeries).toBe('统编 / 人教体系')
  })

  it('produces an explicit TOC diff and audit trail when an original-book TOC is supplied', () => {
    const unitOne = batch01MathG1S1Package.units[0]
    const unitTwo = batch01MathG1S1Package.units[1]
    const lessonOne = batch01MathG1S1Package.lessons.find((lesson) => lesson.unitId === unitOne?.id)
    const lessonTwo = batch01MathG1S1Package.lessons.find((lesson) => lesson.unitId === unitTwo?.id)
    if (!unitOne || !unitTwo || !lessonOne || !lessonTwo) {
      throw new Error('expected candidate TOC records are missing')
    }
    const originalToc: CurriculumTocReferenceUnit[] = [
      {
        unitNo: unitOne.unitNo,
        sort: unitOne.sort,
        title: '原书不同标题',
        lessons: [{ lessonNo: lessonOne.lessonNo, sort: lessonOne.sort, title: '原书不同课名' }],
      },
      {
        unitNo: unitTwo.unitNo,
        sort: unitTwo.sort + 10,
        title: unitTwo.title,
        lessons: [
          { lessonNo: lessonTwo.lessonNo, sort: lessonTwo.sort + 10, title: lessonTwo.title },
        ],
      },
      {
        unitNo: 99,
        sort: 99,
        title: '原书新增单元',
        lessons: [{ lessonNo: 1, sort: 1, title: '原书新增课次' }],
      },
    ]
    const diff = buildCurriculumTocDiffReport(
      batch01MathG1S1Package,
      originalToc,
      'B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE',
    )
    const auditTrail = buildCurriculumAuditTrailFromTocDiff(diff)

    expect(diff.originalBookEvidenceStatus).toBe('READY_FOR_MANUAL_CHECK')
    expect(diff.counts.TITLE_DIFFERENCE).toBeGreaterThanOrEqual(2)
    expect(diff.counts.ORDER_DIFFERENCE).toBeGreaterThanOrEqual(2)
    expect(diff.counts.MISSING_IN_CANDIDATE).toBeGreaterThanOrEqual(2)
    expect(diff.counts.EXTRA_IN_CANDIDATE).toBeGreaterThan(0)
    expect(auditTrail.length).toBeGreaterThan(0)
    expect(auditTrail.every((entry) => entry.reviewer === 'PENDING_MANUAL_REVIEW')).toBe(true)
    expect(auditTrail.some((entry) => entry.before !== null && entry.after !== null)).toBe(true)
  })

  it('marks the current math mapping anomalies without changing any mapping', () => {
    const report = buildCurriculumMappingReviewReport(
      batch01MathG1S1Package,
      'B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE',
    )
    expect(report.totalMappingCount).toBe(84)
    expect(report.counts.LESSON_HAS_NO_CORE_KP).toBe(0)
    expect(report.counts.WEIGHT_INVALID).toBe(0)
    expect(report.counts.DUPLICATE_MAPPING).toBe(0)
    expect(report.counts.SAME_KP_REPEATED_UNUSUALLY).toBe(1)
    expect(report.reviewStatus).toBe('READY_FOR_MANUAL_CHECK')
    expect(batch01MathG1S1Package.lessonKnowledgePoints).toHaveLength(84)
  })

  it('keeps reused and new KnowledgePoint candidates as independent manual decisions', () => {
    const report = buildReport()
    expect(report.knowledgePointReview).toHaveLength(11)
    expect(report.knowledgePointReview.filter((item) => item.reusedAcrossPackages)).toHaveLength(3)
    expect(report.knowledgePointReview.filter((item) => !item.reusedAcrossPackages)).toHaveLength(8)
    expect(
      report.knowledgePointReview.every((item) => item.manualDecision === 'PENDING_MANUAL_REVIEW'),
    ).toBe(true)
    const evidenceRow = report.textbookIdentityReview.find(
      (row) => row.source === 'MATH-G1-UPPER-PUBLIC-CANDIDATE',
    )
    expect(evidenceRow).toMatchObject({
      sourceType: 'manual',
      sourceLocator: 'https://www.renjiaoshe.com/jiaocai/2424.html',
      retrievedAt: '2026-09-03',
      evidenceTypes: ['TEXTBOOK_EXISTENCE', 'TEXTBOOK_IDENTITY', 'TEXTBOOK_CATALOG'],
    })
    const publisherEvidenceRow = report.textbookIdentityReview.find(
      (row) => row.source === 'BNUP-G1-MATH-S1-2024-PUBLISHER-CATALOG',
    )
    expect(publisherEvidenceRow).toMatchObject({
      sourceType: 'publisher',
      sourceLocator: 'https://bnupg.com/docs/2024-11/b736b96d48884a3391f45c8efd5a1290.pdf',
      retrievedAt: '2026-09-04',
      evidenceTypes: ['TEXTBOOK_EXISTENCE', 'TEXTBOOK_IDENTITY', 'TEXTBOOK_CATALOG'],
    })
    const englishDiagnostic = report.textbookIdentityReview.find(
      (row) => row.source === 'SZNS-G1-ENGLISH-S1-HJ-RESOURCE' && row.field === 'diagnostic',
    )
    expect(englishDiagnostic).toMatchObject({
      evidenceTypes: ['LOCAL_EDUCATION_RESOURCE', 'TEXTBOOK_CATALOG'],
      decision: 'CONTEXT_ONLY',
    })
    expect(
      report.knowledgePointReview.every(
        (item) => item.automatedMatchStatus === 'new knowledge point',
      ),
    ).toBe(true)
  })

  it('keeps relation review separate from the automatic prerequisite DAG result', () => {
    const report = buildReport()
    expect(report.relationReviewReports).toHaveLength(2)
    expect(report.relationReviewReports.flatMap((current) => current.items)).toHaveLength(6)
    expect(report.relationReviewReports.every((current) => current.dagValidation === 'PASS')).toBe(
      true,
    )
    expect(
      report.relationReviewReports
        .flatMap((current) => current.items)
        .every((item) => item.reviewStatus === 'READY_FOR_MANUAL_CHECK'),
    ).toBe(true)
  })

  it('requires evidence and a real reviewer before verification or review', () => {
    const report = buildReport()
    const pending = report.slots[2]
    if (!pending) throw new Error('expected math slot is missing')
    expect(isCurriculumManualReviewSlotComplete(pending)).toBe(false)
    expect(evaluateCurriculumManualReviewEligibility(pending, 'UNVERIFIED').canVerify).toBe(false)
    expect(evaluateCurriculumManualReviewEligibility(pending, 'VERIFIED').canReview).toBe(false)
    expect(
      canTransitionCurriculumManualReviewStatus('EVIDENCE_MISSING', 'MANUALLY_CONFIRMED').allowed,
    ).toBe(false)
    expect(
      canTransitionCurriculumManualReviewStatus('READY_FOR_MANUAL_CHECK', 'MANUALLY_CONFIRMED')
        .allowed,
    ).toBe(true)
    expect(canTransitionVerificationStatus('UNVERIFIED', 'REVIEWED').allowed).toBe(false)
    expect(canTransitionVerificationStatus('UNVERIFIED', 'VERIFIED').allowed).toBe(true)
    expect(canTransitionVerificationStatus('VERIFIED', 'REVIEWED').allowed).toBe(true)

    const draft = report.reviewRecordDrafts[2]
    if (!draft) throw new Error('expected review draft is missing')
    expect(draft.action).toBeNull()
    expect(draft.reviewer).toBe('PENDING_MANUAL_REVIEW')
    expect(draft.reviewedAt).toBeNull()
    expect(CurriculumReviewRecordSchema.safeParse(draft).success).toBe(false)
  })

  it('creates deterministic audit IDs and renders the required manual review boundary', () => {
    const first = createCurriculumAuditTrailEntry({
      entityType: 'unit',
      entityId: 'UNIT_01',
      field: 'title',
      before: '旧标题',
      after: '新标题',
      sourceReferenceIds: ['SOURCE_B', 'SOURCE_A'],
      reason: '人工比对原书目录后提出修正。',
    })
    const second = createCurriculumAuditTrailEntry({
      entityType: 'unit',
      entityId: 'UNIT_01',
      field: 'title',
      before: '旧标题',
      after: '新标题',
      sourceReferenceIds: ['SOURCE_A', 'SOURCE_B'],
      reason: '人工比对原书目录后提出修正。',
    })
    const markdown = renderCurriculumBatchManualReviewReport(buildReport())

    expect(first.id).toBe(second.id)
    expect(first.sourceReferenceIds).toEqual(['SOURCE_A', 'SOURCE_B'])
    expect(first.reviewer).toBe('PENDING_MANUAL_REVIEW')
    expect(markdown).toContain('Shenzhen Grade 1 6-slot Manual Review Matrix')
    expect(markdown).toContain('selectionEvidenceStatus')
    expect(markdown).toContain('Production Index change')
    expect(markdown).toContain('PHASE 17')
  })

  it('keeps a completed review template eligible only at the right lifecycle step', () => {
    const report = buildReport()
    const pending = report.slots[2]
    if (!pending) throw new Error('expected math slot is missing')
    const confirmed = {
      ...pending,
      selectionEvidenceStatus: 'MANUALLY_CONFIRMED',
      textbookIdentityEvidenceStatus: 'MANUALLY_CONFIRMED',
      editionEvidenceStatus: 'MANUALLY_CONFIRMED',
      isbnEvidenceStatus: 'MANUALLY_CONFIRMED',
      tocEvidenceStatus: 'MANUALLY_CONFIRMED',
      regionSelectionStatus: 'MANUALLY_CONFIRMED',
      unitReviewStatus: 'MANUALLY_CONFIRMED',
      lessonReviewStatus: 'MANUALLY_CONFIRMED',
      knowledgePointReviewStatus: 'MANUALLY_CONFIRMED',
      mappingReviewStatus: 'MANUALLY_CONFIRMED',
      relationReviewStatus: 'MANUALLY_CONFIRMED',
      finalVerificationStatus: 'MANUALLY_CONFIRMED',
      manualReviewer: 'real-reviewer',
      manualReviewedAt: '2026-09-04T10:00:00+08:00',
      reviewNote: '人工逐项核对完成。',
    } satisfies CurriculumBatchManualReviewSlot

    expect(isCurriculumManualReviewSlotComplete(confirmed)).toBe(true)
    expect(evaluateCurriculumManualReviewEligibility(confirmed, 'UNVERIFIED')).toMatchObject({
      canVerify: true,
      canReview: false,
    })
    expect(evaluateCurriculumManualReviewEligibility(confirmed, 'VERIFIED')).toMatchObject({
      canVerify: false,
      canReview: true,
    })
  })
})
