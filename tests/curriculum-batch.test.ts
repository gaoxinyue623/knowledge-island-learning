import { describe, expect, it } from 'vitest'

import {
  batch01KnowledgePointRegistry,
  batch01Manifest,
  batch01MathG1S1Package,
  batch01MathG1S2Package,
  batch01SourceManifest,
  curriculumSourceManifest,
  mvpCurriculumScope,
  productionCurriculumIndex,
} from '@/data/curriculum'
import {
  buildCurriculumBatchImportSummary,
  buildCurriculumBatchReviewReport,
  buildCurriculumPackageFingerprint,
  importCurriculumPackage,
  validateCurriculumBatchManifest,
} from '@/services'
import type { CurriculumBatchPackageInput, CurriculumImportPackage } from '@/types'

const packageById = new Map([
  [batch01MathG1S1Package.textbook.id, batch01MathG1S1Package],
  [batch01MathG1S2Package.textbook.id, batch01MathG1S2Package],
])

const packageInputs: CurriculumBatchPackageInput[] = batch01Manifest.packages.map((descriptor) => {
  const packageRecord = descriptor.packageId.includes('S1')
    ? batch01MathG1S1Package
    : batch01MathG1S2Package
  return { descriptor, package: packageRecord }
})

describe('Curriculum Data Batch 01', () => {
  it('keeps the Shenzhen Grade 1 six-slot matrix explicit', () => {
    const validation = validateCurriculumBatchManifest(
      batch01Manifest,
      batch01SourceManifest,
      curriculumSourceManifest,
    )

    expect(validation).toEqual({
      valid: true,
      issues: [],
      missingSourceReferenceIds: [],
      duplicateManifestEntryIds: [],
    })
    expect(batch01Manifest.slots.map((slot) => `${slot.subjectCode}:${slot.semester}`)).toEqual([
      'CHINESE:1',
      'CHINESE:2',
      'MATH:1',
      'MATH:2',
      'ENGLISH:1',
      'ENGLISH:2',
    ])
    expect(batch01Manifest.slots.every((slot) => slot.grade === 1)).toBe(true)
    expect(batch01Manifest.slots.every((slot) => slot.schoolYear === '2026-2027')).toBe(true)
    expect(
      batch01SourceManifest.every((slot) => slot.regionalSelectionStatus === 'NOT_CONFIRMED'),
    ).toBe(true)
    expect(
      batch01Manifest.slots.every((slot) => slot.regionalSelectionStatus === 'NOT_CONFIRMED'),
    ).toBe(true)
  })

  it('does not turn historical or candidate evidence into current confirmation', () => {
    const chineseUpper = batch01SourceManifest.find((slot) => slot.id === 'B01-SZ-G1-CHI-S1')
    const mathUpper = batch01SourceManifest.find((slot) => slot.id === 'B01-SZ-G1-MATH-S1')
    const chineseLower = batch01SourceManifest.find((slot) => slot.id === 'B01-SZ-G1-CHI-S2')

    expect(chineseUpper?.selectionSourceId).toBeUndefined()
    expect(mathUpper?.selectionSourceId).toBeUndefined()
    expect(chineseLower?.selectionSourceId).toBe('SZ-TEXTBOOK-SELECTION-2022-2024')
    expect(batch01Manifest.slots.every((slot) => slot.status !== 'CONFIRMED')).toBe(true)
    expect(batch01Manifest.status).toBe('REQUIRES_MANUAL_REVIEW')
  })

  it('records the public-evidence candidates while keeping every slot partial and unverified', () => {
    const summaries = packageInputs.map(buildCurriculumBatchImportSummary)
    const report = buildCurriculumBatchReviewReport({
      manifest: batch01Manifest,
      sourceManifest: batch01SourceManifest,
      sourceReferences: curriculumSourceManifest,
      packageInputs,
      packageSummaries: summaries,
    })
    const sourceById = new Map(curriculumSourceManifest.map((source) => [source.id, source]))
    const chineseUpper = batch01SourceManifest.find((slot) => slot.id === 'B01-SZ-G1-CHI-S1')
    const mathUpper = batch01SourceManifest.find((slot) => slot.id === 'B01-SZ-G1-MATH-S1')
    const englishUpper = batch01SourceManifest.find((slot) => slot.id === 'B01-SZ-G1-ENG-S1')

    expect(batch01SourceManifest.every((slot) => slot.selectionStatus === 'PARTIAL')).toBe(true)
    expect(batch01SourceManifest.every((slot) => slot.verificationStatus === 'UNVERIFIED')).toBe(
      true,
    )
    expect(batch01Manifest.slots.every((slot) => slot.status === 'PARTIAL')).toBe(true)
    expect(report).toMatchObject({
      confirmedSlotCount: 0,
      partialSlotCount: 6,
      unverifiedSlotCount: 0,
      notFoundSlotCount: 0,
      productionIndexChange: 'NO',
    })

    expect(chineseUpper).toMatchObject({
      candidateSeries: '统编 / 国家统编语文教材',
      candidateRevision: '2024 修订',
      candidatePublication: '2024-07',
      candidateIsbn: '9787107383007',
      isbnSourceId: 'PEP-G1-CHINESE-S1-2024-BIBLIOGRAPHIC',
      selectionStatus: 'PARTIAL',
      regionalSelectionStatus: 'NOT_CONFIRMED',
      verificationStatus: 'UNVERIFIED',
    })
    expect(mathUpper).toMatchObject({
      candidateRevision: '2024 修订体系',
      candidateTextbookIdentifier: '35524210031',
      selectionStatus: 'PARTIAL',
      verificationStatus: 'UNVERIFIED',
    })
    expect(englishUpper).toMatchObject({
      publisher: '上海教育出版社',
      candidateSeries: '沪教版（深圳）',
      diagnosticCodes: ['EDITION_VARIANT_CONFLICT'],
      selectionStatus: 'PARTIAL',
      verificationStatus: 'UNVERIFIED',
    })
    expect(sourceById.get('PEP-G1-CHINESE-S1-2024-BIBLIOGRAPHIC')).toMatchObject({
      isbn: '9787107383007',
      evidenceTypes: ['TEXTBOOK_EXISTENCE', 'TEXTBOOK_IDENTITY'],
    })
    expect(sourceById.get('PEP-G1-CHINESE-S1-HISTORICAL-PRODUCT')).toMatchObject({
      isbn: '9787107312403',
      diagnosticCodes: ['EDITION_MISMATCH_WARNING', 'EDITION_DIFFERENCE'],
    })
    expect(sourceById.get('SZNS-G1-ENGLISH-S1-HJ-RESOURCE')).toMatchObject({
      evidenceTypes: ['LOCAL_EDUCATION_RESOURCE', 'TEXTBOOK_CATALOG'],
      diagnosticCodes: ['EDITION_VARIANT_CONFLICT'],
    })
    expect(batch01MathG1S1Package.metadata.verificationStatus).toBe('UNVERIFIED')
    expect(batch01MathG1S2Package.metadata.verificationStatus).toBe('UNVERIFIED')
    expect(productionCurriculumIndex.textbooks).toHaveLength(0)
  })

  it('keeps candidate packages manual, unverified and free of generated content or questions', () => {
    for (const packageRecord of [batch01MathG1S1Package, batch01MathG1S2Package]) {
      expect(packageRecord.metadata.importType).toBe('manual')
      expect(packageRecord.metadata.verificationStatus).toBe('UNVERIFIED')
      expect(
        packageRecord.knowledgePoints.every((point) => point.verificationStatus === 'UNVERIFIED'),
      ).toBe(true)
      expect(packageRecord.knowledgePoints.every((point) => point.isSample !== true)).toBe(true)
      expect(packageRecord).not.toHaveProperty('contents')
      expect(packageRecord).not.toHaveProperty('questions')
    }
  })

  it('passes the existing importer, integrity checks and prerequisite DAG for both candidates', () => {
    const summaries = packageInputs.map(buildCurriculumBatchImportSummary)

    expect(summaries.every((summary) => summary.success)).toBe(true)
    expect(summaries.every((summary) => summary.reportStatus === 'REQUIRES_MANUAL_REVIEW')).toBe(
      true,
    )
    expect(summaries.every((summary) => summary.releaseEligible === false)).toBe(true)
    expect(summaries.every((summary) => summary.issues.length === 1)).toBe(true)
    expect(
      summaries.every((summary) => summary.issues[0]?.startsWith('MANUAL_REVIEW_REQUIRED')),
    ).toBe(true)
    expect(summaries[0]?.imported).toEqual({
      textbooks: 1,
      units: 10,
      lessons: 43,
      knowledgePoints: 7,
      lessonKnowledgePoints: 84,
      knowledgeRelations: 3,
    })
    expect(summaries[1]?.imported).toEqual({
      textbooks: 1,
      units: 9,
      lessons: 48,
      knowledgePoints: 7,
      lessonKnowledgePoints: 89,
      knowledgeRelations: 3,
    })
  })

  it('reports reused and new KnowledgePoint candidates deterministically', () => {
    const summaries = packageInputs.map(buildCurriculumBatchImportSummary)
    const report = buildCurriculumBatchReviewReport({
      manifest: batch01Manifest,
      sourceManifest: batch01SourceManifest,
      sourceReferences: curriculumSourceManifest,
      packageInputs,
      packageSummaries: summaries,
    })

    expect(batch01KnowledgePointRegistry).toHaveLength(11)
    expect(report.knowledgePointCandidateCount).toBe(11)
    expect(report.reusedKnowledgePointCount).toBe(3)
    expect(report.newKnowledgePointCount).toBe(8)
    expect(report.unitCount).toBe(19)
    expect(report.lessonCount).toBe(91)
    expect(report.lessonKnowledgePointCount).toBe(173)
    expect(report.knowledgeRelationCount).toBe(6)
    expect(report.importValidation).toBe('PASS')
    expect(report.integrityValidation).toBe('PASS')
    expect(report.dagValidation).toBe('PASS')
    expect(report.importDiff).toBe('PASS')
    expect(report.productionIndexChange).toBe('NO')
    expect(report.status).toBe('REQUIRES_MANUAL_REVIEW')
  })

  it('detects missing batch evidence before import', () => {
    const brokenManifest = {
      ...batch01Manifest,
      sourceManifestEntryIds: [...batch01Manifest.sourceManifestEntryIds, 'MISSING_SOURCE'],
    }
    const validation = validateCurriculumBatchManifest(
      brokenManifest,
      batch01SourceManifest,
      curriculumSourceManifest,
    )

    expect(validation.valid).toBe(false)
    expect(validation.issues).toContain('BATCH_SOURCE_MANIFEST_ENTRY_MISSING: MISSING_SOURCE。')
  })

  it('creates a deterministic fingerprint without changing the production allow-list', () => {
    const first = buildCurriculumPackageFingerprint(batch01MathG1S1Package)
    const second = buildCurriculumPackageFingerprint(batch01MathG1S1Package)

    expect(first).toBe(second)
    expect(first).toContain('B01_SZ_G1_MATH_S1_BNUP_2024_TEXTBOOK_CANDIDATE')
    expect(productionCurriculumIndex.textbooks).toHaveLength(0)
    expect(productionCurriculumIndex.units).toHaveLength(0)
    expect(mvpCurriculumScope.entries.every((entry) => entry.status === 'CANDIDATE')).toBe(true)
  })

  it('strips unknown import fields while preserving the existing package contract', () => {
    const input = {
      ...batch01MathG1S1Package,
      textbook: {
        ...batch01MathG1S1Package.textbook,
        unknownBatchField: 'ignored',
      },
    }
    const result = importCurriculumPackage(input)

    expect(result.success).toBe(true)
    expect(result.normalizedPackage?.textbook).not.toHaveProperty('unknownBatchField')
  })

  it('rejects duplicate KnowledgePoint codes before a candidate can be released', () => {
    const firstKnowledgePoint = batch01MathG1S1Package.knowledgePoints[0]
    if (!firstKnowledgePoint) throw new Error('Batch 01 KnowledgePoint candidate missing')
    const input: CurriculumImportPackage = {
      ...batch01MathG1S1Package,
      knowledgePoints: [
        ...batch01MathG1S1Package.knowledgePoints,
        { ...firstKnowledgePoint, id: 'B01_DUPLICATE_KP_ID' },
      ],
    }
    const result = importCurriculumPackage(input)

    expect(result.success).toBe(false)
    expect(result.errors.some((issue) => issue.code === 'DUPLICATE_KNOWLEDGE_POINT_CODE')).toBe(
      true,
    )
  })

  it('keeps a mistakenly marked SAMPLE candidate out of the non-sample import', () => {
    const input: CurriculumImportPackage = {
      ...batch01MathG1S1Package,
      textbook: {
        ...batch01MathG1S1Package.textbook,
        isSample: true,
        verificationStatus: 'SAMPLE',
        needsVerification: true,
      },
    }
    const result = importCurriculumPackage(input)

    expect(result.success).toBe(false)
    expect(result.errors.some((issue) => issue.code === 'SAMPLE_DATA_POLLUTION')).toBe(true)
  })

  it('reuses the reviewed overwrite guard when a previous reviewed package is supplied', () => {
    const previous: CurriculumImportPackage = {
      ...batch01MathG1S1Package,
      metadata: { ...batch01MathG1S1Package.metadata, verificationStatus: 'REVIEWED' },
    }
    const next: CurriculumImportPackage = {
      ...previous,
      units: previous.units.map((unit, index) =>
        index === 0 ? { ...unit, title: '变更后的候选标题' } : unit,
      ),
    }
    const summary = buildCurriculumBatchImportSummary({
      descriptor: packageInputs[0]!.descriptor,
      package: next,
      previousPackage: previous,
    })

    expect(summary.reviewedOverwriteGuard).toBe('FAIL')
    expect(summary.releaseEligible).toBe(false)
    expect(summary.issues.some((issue) => issue.startsWith('REVIEWED_OVERWRITE_BLOCKED'))).toBe(
      true,
    )
  })

  it('keeps one package descriptor per candidate math slot and no package for unresolved slots', () => {
    expect(batch01Manifest.packages).toHaveLength(2)
    expect(batch01Manifest.slots.filter((slot) => slot.packageId)).toHaveLength(2)
    expect(
      batch01Manifest.slots.filter((slot) => !slot.packageId).map((slot) => slot.subjectCode),
    ).toEqual(['CHINESE', 'CHINESE', 'ENGLISH', 'ENGLISH'])
    expect(packageById.size).toBe(2)
  })
})
