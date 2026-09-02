import type {
  CurriculumImportPackage,
  CurriculumImportResult,
  CurriculumReviewReport,
  CurriculumValidationIssue,
} from '@/types'

import { CurriculumImportPackageSchema } from './curriculumImportSchema'
import { buildCurriculumReviewReport, validateCurriculumImportPackage } from './curriculumIntegrity'
import { buildTextbookIdentityKey } from './textbookIdentity'

function emptyReport(input: unknown, issues: CurriculumValidationIssue[]): CurriculumReviewReport {
  const textbookId =
    typeof input === 'object' && input !== null && 'textbook' in input
      ? (() => {
          const textbook = input.textbook
          return typeof textbook === 'object' &&
            textbook !== null &&
            'id' in textbook &&
            typeof textbook.id === 'string'
            ? textbook.id
            : 'UNKNOWN'
        })()
      : 'UNKNOWN'
  return {
    schemaVersion: 0,
    textbookId,
    textbookIdentityKey: 'UNKNOWN',
    generatedAt: new Date(0).toISOString(),
    summary: {
      errorCount: issues.filter((issue) => issue.severity === 'error').length,
      warningCount: issues.filter((issue) => issue.severity === 'warning').length,
      infoCount: issues.filter((issue) => issue.severity === 'info').length,
    },
    completeness: {
      textbook: false,
      units: { total: 0, valid: 0 },
      lessons: { total: 0, valid: 0 },
      knowledgePoints: { total: 0, valid: 0 },
      mappings: { total: 0, valid: 0 },
      relations: { total: 0, valid: 0 },
    },
    verificationStatus: 'UNVERIFIED',
    issues,
    pendingManualReview: issues,
    samplePollution: issues.some((issue) => issue.code.includes('SAMPLE')) ? 'FAIL' : 'PASS',
    knowledgeDag: 'PASS',
    finalResult: 'FAIL',
  }
}

function schemaIssues(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>
}): CurriculumValidationIssue[] {
  return error.issues.map((current) => ({
    code: 'SCHEMA_INVALID',
    severity: 'error',
    field: current.path.map((segment) => String(segment)).join('.') || undefined,
    message: current.message,
  }))
}

function normalizePackage(pkg: CurriculumImportPackage): CurriculumImportPackage {
  return {
    ...pkg,
    textbook: {
      ...pkg.textbook,
      textbookIdentityKey:
        pkg.textbook.textbookIdentityKey ?? buildTextbookIdentityKey(pkg.textbook.identity),
    },
    units: [...pkg.units].sort(
      (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
    ),
    lessons: [...pkg.lessons].sort(
      (left, right) =>
        left.unitId.localeCompare(right.unitId) ||
        left.sort - right.sort ||
        left.id.localeCompare(right.id),
    ),
    knowledgePoints: [...pkg.knowledgePoints].sort(
      (left, right) => left.code.localeCompare(right.code) || left.id.localeCompare(right.id),
    ),
    lessonKnowledgePoints: [...pkg.lessonKnowledgePoints].sort(
      (left, right) =>
        left.lessonId.localeCompare(right.lessonId) ||
        left.knowledgePointId.localeCompare(right.knowledgePointId) ||
        left.id.localeCompare(right.id),
    ),
    knowledgeRelations: [...pkg.knowledgeRelations].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    sources: [...pkg.sources].sort((left, right) => left.id.localeCompare(right.id)),
  }
}

function counts(pkg: CurriculumImportPackage): CurriculumImportResult['imported'] {
  return {
    textbooks: 1,
    units: pkg.units.length,
    lessons: pkg.lessons.length,
    knowledgePoints: pkg.knowledgePoints.length,
    lessonKnowledgePoints: pkg.lessonKnowledgePoints.length,
    knowledgeRelations: pkg.knowledgeRelations.length,
  }
}

export function importCurriculumPackage(input: unknown): CurriculumImportResult {
  const parsed = CurriculumImportPackageSchema.safeParse(input)
  if (!parsed.success) {
    const errors = schemaIssues(parsed.error)
    return {
      success: false,
      imported: {
        textbooks: 0,
        units: 0,
        lessons: 0,
        knowledgePoints: 0,
        lessonKnowledgePoints: 0,
        knowledgeRelations: 0,
      },
      errors,
      warnings: [],
      report: emptyReport(input, errors),
    }
  }

  const normalizedPackage = normalizePackage(parsed.data)
  const issues = validateCurriculumImportPackage(normalizedPackage)
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  return {
    success: errors.length === 0,
    imported: counts(normalizedPackage),
    errors,
    warnings,
    report: buildCurriculumReviewReport(normalizedPackage, issues),
    normalizedPackage,
  }
}

export const reviewCurriculumPackage = importCurriculumPackage
