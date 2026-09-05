import { describe, expect, it } from 'vitest'

import { sampleCurriculumData } from '@/data/curriculum/sample'
import { goldenMathPepG3S1Package } from '@/data/curriculum/verified/math/pep/g3-s1'
import {
  CurriculumImportPackageSchema,
  CurriculumReviewRecordSchema,
  SourceReferenceSchema,
  importCurriculumPackage,
  isCurriculumRecordReadable,
  buildTextbookIdentityKey,
  canTransitionVerificationStatus,
  validateTextbookIdentityUniqueness,
} from '@/services/curriculum'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import type { CurriculumImportPackage } from '@/types'

function copyGoldenPackage(): CurriculumImportPackage {
  return {
    ...goldenMathPepG3S1Package,
    textbook: {
      ...goldenMathPepG3S1Package.textbook,
      identity: { ...goldenMathPepG3S1Package.textbook.identity },
    },
    units: goldenMathPepG3S1Package.units.map((unit) => ({ ...unit })),
    lessons: goldenMathPepG3S1Package.lessons.map((lesson) => ({ ...lesson })),
    knowledgePoints: goldenMathPepG3S1Package.knowledgePoints.map((knowledgePoint) => ({
      ...knowledgePoint,
      tags: [...knowledgePoint.tags],
    })),
    lessonKnowledgePoints: goldenMathPepG3S1Package.lessonKnowledgePoints.map((mapping) => ({
      ...mapping,
    })),
    knowledgeRelations: goldenMathPepG3S1Package.knowledgeRelations.map((relation) => ({
      ...relation,
    })),
    sources: goldenMathPepG3S1Package.sources.map((source) => ({ ...source })),
    metadata: { ...goldenMathPepG3S1Package.metadata },
  }
}

describe('curriculum import schema and identity', () => {
  it('validates the public evidence categories and edition diagnostics', () => {
    const source = {
      id: 'PUBLIC_EVIDENCE_01',
      type: 'publisher' as const,
      title: '公开教材产品页',
      sourceUrl: 'https://example.com/textbook',
      evidenceTypes: ['TEXTBOOK_EXISTENCE', 'TEXTBOOK_IDENTITY'] as const,
      diagnosticCodes: ['EDITION_MISMATCH_WARNING'] as const,
    }
    expect(SourceReferenceSchema.safeParse(source).success).toBe(true)
    expect(
      SourceReferenceSchema.safeParse({ ...source, evidenceTypes: ['UNKNOWN_TYPE'] }).success,
    ).toBe(false)
    expect(
      SourceReferenceSchema.safeParse({ ...source, diagnosticCodes: ['UNKNOWN_DIAGNOSTIC'] })
        .success,
    ).toBe(false)
  })

  it('accepts the complete Golden Sample Framework and preserves the unknown year', () => {
    expect(CurriculumImportPackageSchema.safeParse(goldenMathPepG3S1Package).success).toBe(true)
    expect(buildTextbookIdentityKey(goldenMathPepG3S1Package.textbook.identity)).toBe(
      'PRI-MAT-PEP-G3-S1-UNKNOWN',
    )
  })

  it('rejects a package without a SourceReference', () => {
    const invalid = { ...copyGoldenPackage(), sources: [] }
    const result = importCurriculumPackage(invalid)

    expect(result.success).toBe(false)
    expect(result.errors.some((issue) => issue.code === 'SCHEMA_INVALID')).toBe(true)
  })

  it('validates the allowed curriculum review record reviewers', () => {
    expect(
      CurriculumReviewRecordSchema.safeParse({
        id: 'REVIEW_01',
        entityType: 'textbook',
        entityId: 'TEXTBOOK_01',
        action: 'verify',
        reviewer: 'SYSTEM',
        reviewedAt: '2026-09-02T00:00:00+08:00',
      }).success,
    ).toBe(true)
    expect(
      CurriculumReviewRecordSchema.safeParse({
        id: 'REVIEW_02',
        entityType: 'textbook',
        entityId: 'TEXTBOOK_01',
        action: 'review',
        reviewer: 'AI',
        reviewedAt: '2026-09-02T00:00:00+08:00',
      }).success,
    ).toBe(false)
  })

  it('detects duplicate textbook identity keys', () => {
    const first = copyGoldenPackage().textbook
    const second = { ...first, id: 'GOLDEN_MATH_PEP_G3_S1_TEXTBOOK_DUPLICATE' }
    const issues = validateTextbookIdentityUniqueness([first, second])

    expect(issues.some((issue) => issue.code === 'DUPLICATE_TEXTBOOK_IDENTITY')).toBe(true)
  })
})

describe('curriculum importer integrity checks', () => {
  it('imports the Golden Sample Framework with a complete chain and manual-review warning', () => {
    const result = importCurriculumPackage(goldenMathPepG3S1Package)

    expect(result.success).toBe(true)
    expect(result.imported).toEqual({
      textbooks: 1,
      units: 1,
      lessons: 3,
      knowledgePoints: 4,
      lessonKnowledgePoints: 6,
      knowledgeRelations: 3,
    })
    expect(result.report.finalResult).toBe('REQUIRES_MANUAL_REVIEW')
    expect(result.report.completeness.lessons).toEqual({ total: 3, valid: 3 })
    expect(result.report.completeness.mappings).toEqual({ total: 6, valid: 6 })
    expect(result.report.samplePollution).toBe('PASS')
    expect(result.report.knowledgeDag).toBe('PASS')
  })

  it('detects broken Unit references, duplicate KP codes and duplicate mappings', () => {
    const invalid = copyGoldenPackage()
    invalid.units[0].textbookId = 'MISSING_TEXTBOOK'
    invalid.knowledgePoints[1].code = invalid.knowledgePoints[0].code
    invalid.lessonKnowledgePoints[1].knowledgePointId =
      invalid.lessonKnowledgePoints[0].knowledgePointId

    const result = importCurriculumPackage(invalid)
    const codes = result.errors.map((issue) => issue.code)

    expect(codes).toContain('UNIT_TEXTBOOK_REF_INVALID')
    expect(codes).toContain('DUPLICATE_KNOWLEDGE_POINT_CODE')
    expect(codes).toContain('DUPLICATE_LESSON_KNOWLEDGE_POINT')
  })

  it('detects self relations, prerequisite cycles and SAMPLE pollution', () => {
    const invalid = copyGoldenPackage()
    invalid.knowledgeRelations[0].targetKnowledgePointId =
      invalid.knowledgeRelations[0].sourceKnowledgePointId
    invalid.knowledgeRelations[1].relationType = 'prerequisite'
    invalid.knowledgeRelations[1].sourceKnowledgePointId = 'GOLDEN_MATH_KP_02'
    invalid.knowledgeRelations[1].targetKnowledgePointId = 'GOLDEN_MATH_KP_01'
    invalid.metadata.verificationStatus = 'VERIFIED'
    invalid.textbook.isSample = true
    invalid.textbook.needsVerification = true
    invalid.textbook.verificationStatus = 'SAMPLE'

    const result = importCurriculumPackage(invalid)
    const codes = result.errors.map((issue) => issue.code)

    expect(codes).toContain('KNOWLEDGE_RELATION_SELF_REFERENCE')
    expect(codes).toContain('KNOWLEDGE_PREREQUISITE_CYCLE')
    expect(codes).toContain('SAMPLE_DATA_POLLUTION')
    expect(result.report.samplePollution).toBe('FAIL')
  })
})

describe('verification state and curriculum access policy', () => {
  it('keeps SAMPLE records out of VERIFIED and REVIEWED', () => {
    expect(canTransitionVerificationStatus('SAMPLE', 'VERIFIED').allowed).toBe(false)
    expect(canTransitionVerificationStatus('SAMPLE', 'REVIEWED').allowed).toBe(false)
    expect(canTransitionVerificationStatus('UNVERIFIED', 'VERIFIED').allowed).toBe(true)
    expect(canTransitionVerificationStatus('VERIFIED', 'REVIEWED').allowed).toBe(true)
    expect(canTransitionVerificationStatus('REJECTED', 'REVIEWED').allowed).toBe(false)
  })

  it('allows SAMPLE only with an explicit development policy and production only REVIEWED', () => {
    const sample = {
      isSample: true,
      needsVerification: true,
      verificationStatus: 'SAMPLE' as const,
    }
    const reviewed = { verificationStatus: 'REVIEWED' as const, status: 'ACTIVE' }

    expect(
      isCurriculumRecordReadable(sample, {
        allowSampleCurriculum: false,
        allowUnreviewedCurriculum: false,
      }),
    ).toBe(false)
    expect(
      isCurriculumRecordReadable(sample, {
        allowSampleCurriculum: true,
        allowUnreviewedCurriculum: false,
      }),
    ).toBe(true)
    expect(
      isCurriculumRecordReadable(reviewed, {
        allowSampleCurriculum: false,
        allowUnreviewedCurriculum: false,
      }),
    ).toBe(true)
  })

  it('applies the access policy at the Mock Service boundary', async () => {
    const productionService = new MockCurriculumService({
      data: sampleCurriculumData,
      accessPolicy: { allowSampleCurriculum: false, allowUnreviewedCurriculum: false },
    })
    const developmentService = new MockCurriculumService({
      data: sampleCurriculumData,
      accessPolicy: { allowSampleCurriculum: true, allowUnreviewedCurriculum: false },
    })

    expect(await productionService.getRegions()).toEqual([])
    expect(await developmentService.getRegions()).toHaveLength(3)
  })
})
