import type { DifficultyLevel, VerificationStatus } from './domain'

/** Public evidence categories are separate from SourceReference.type. */
export type CurriculumEvidenceType =
  | 'TEXTBOOK_EXISTENCE'
  | 'TEXTBOOK_IDENTITY'
  | 'TEXTBOOK_CATALOG'
  | 'LOCAL_EDUCATION_RESOURCE'
  | 'REGIONAL_SELECTION'
  | 'NATIONAL_CATALOG'
  | 'CURRICULUM_STANDARD'
  | 'PHYSICAL_BOOK'

export const curriculumEvidenceTypes: readonly CurriculumEvidenceType[] = [
  'TEXTBOOK_EXISTENCE',
  'TEXTBOOK_IDENTITY',
  'TEXTBOOK_CATALOG',
  'LOCAL_EDUCATION_RESOURCE',
  'REGIONAL_SELECTION',
  'NATIONAL_CATALOG',
  'CURRICULUM_STANDARD',
  'PHYSICAL_BOOK',
]

export type CurriculumEvidenceDiagnosticCode =
  'EDITION_MISMATCH_WARNING' | 'EDITION_DIFFERENCE' | 'EDITION_VARIANT_CONFLICT'

export const curriculumEvidenceDiagnosticCodes: readonly CurriculumEvidenceDiagnosticCode[] = [
  'EDITION_MISMATCH_WARNING',
  'EDITION_DIFFERENCE',
  'EDITION_VARIANT_CONFLICT',
]

export type CurriculumSourceType =
  | 'official_platform'
  | 'publisher'
  | 'curriculum_standard'
  | 'official_document'
  | 'manual'
  | 'licensed'

export interface SourceReference {
  id: string
  type: CurriculumSourceType
  title: string
  sourceUrl?: string
  publisher?: string
  editionYear?: number
  curriculumStandardVersion?: string
  isbn?: string
  page?: string
  section?: string
  retrievedAt?: string
  verifiedAt?: string
  verifiedBy?: string
  note?: string
  evidenceTypes?: CurriculumEvidenceType[]
  diagnosticCodes?: CurriculumEvidenceDiagnosticCode[]
}

export type EntitySourceReferenceType =
  | 'publisher'
  | 'textbook'
  | 'unit'
  | 'lesson'
  | 'knowledge_point'
  | 'lesson_knowledge_point'
  | 'knowledge_relation'

export interface EntitySourceReference {
  id: string
  entityType: EntitySourceReferenceType
  entityId: string
  sourceReferenceId: string
  role: 'primary' | 'secondary' | 'verification'
  note?: string
}

export interface ProvenanceMetadata {
  sourceReferenceIds: string[]
  verificationStatus: VerificationStatus
  isSample?: boolean
  needsVerification?: boolean
  createdAt?: string
  updatedAt?: string
  verifiedAt?: string
  verifiedBy?: string
}

export interface TextbookIdentity {
  stage: 'primary'
  subjectCode: string
  grade: number
  semester: 1 | 2
  publisherCode: string
  seriesCode?: string
  editionYear?: number
  curriculumStandardVersion?: string
  isbn?: string
}

export interface TextbookImportData extends ProvenanceMetadata {
  id: string
  title: string
  identity: TextbookIdentity
  textbookIdentityKey?: string
}

export interface UnitImportData extends ProvenanceMetadata {
  id: string
  textbookId: string
  unitNo: number
  sort: number
  title: string
  mappingSkipReason?: string
}

export interface LessonImportData extends ProvenanceMetadata {
  id: string
  unitId: string
  lessonNo: number
  sort: number
  title: string
  mappingSkipReason?: string
}

export interface KnowledgePointImportData extends ProvenanceMetadata {
  id: string
  code: string
  subjectCode: string
  categoryId: string
  name: string
  description: string
  gradeStart: number
  gradeEnd: number
  difficulty: DifficultyLevel
  importance: number
  cognitiveLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'
  tags: string[]
}

export interface LessonKnowledgePointImportData extends ProvenanceMetadata {
  id: string
  lessonId: string
  knowledgePointId: string
  role: 'core' | 'secondary' | 'extended'
  weight: number
}

export interface KnowledgeRelationImportData extends ProvenanceMetadata {
  id: string
  sourceKnowledgePointId: string
  targetKnowledgePointId: string
  relationType: 'prerequisite' | 'related' | 'advanced'
}

export interface CurriculumImportPackage {
  schemaVersion: number
  textbook: TextbookImportData
  units: UnitImportData[]
  lessons: LessonImportData[]
  knowledgePoints: KnowledgePointImportData[]
  lessonKnowledgePoints: LessonKnowledgePointImportData[]
  knowledgeRelations: KnowledgeRelationImportData[]
  sources: SourceReference[]
  metadata: {
    generatedAt: string
    importType: 'manual' | 'official_source' | 'migration'
    verificationStatus: VerificationStatus
  }
}

export interface CurriculumValidationIssue {
  code: string
  severity: 'error' | 'warning' | 'info'
  entityType?: string
  entityId?: string
  field?: string
  message: string
}

export interface CurriculumReviewReport {
  schemaVersion: number
  textbookId: string
  textbookIdentityKey: string
  generatedAt: string
  summary: {
    errorCount: number
    warningCount: number
    infoCount: number
  }
  completeness: {
    textbook: boolean
    units: { total: number; valid: number }
    lessons: { total: number; valid: number }
    knowledgePoints: { total: number; valid: number }
    mappings: { total: number; valid: number }
    relations: { total: number; valid: number }
  }
  verificationStatus: VerificationStatus
  issues: CurriculumValidationIssue[]
  pendingManualReview: CurriculumValidationIssue[]
  samplePollution: 'PASS' | 'FAIL'
  knowledgeDag: 'PASS' | 'FAIL'
  finalResult: 'PASS' | 'FAIL' | 'REQUIRES_MANUAL_REVIEW'
}

export interface CurriculumImportResult {
  success: boolean
  imported: {
    textbooks: number
    units: number
    lessons: number
    knowledgePoints: number
    lessonKnowledgePoints: number
    knowledgeRelations: number
  }
  errors: CurriculumValidationIssue[]
  warnings: CurriculumValidationIssue[]
  report: CurriculumReviewReport
  normalizedPackage?: CurriculumImportPackage
}

export type CurriculumReviewer = 'SYSTEM' | 'MANUAL_REVIEW'

export interface CurriculumReviewRecord {
  id: string
  entityType: string
  entityId: string
  action: 'verify' | 'review' | 'reject' | 'request_change'
  reviewer: CurriculumReviewer
  reviewedAt: string
  note?: string
}

export interface VerificationTransitionResult {
  allowed: boolean
  from: VerificationStatus
  to: VerificationStatus
  reason?: string
}
