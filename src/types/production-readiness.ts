import type {
  ContentSource,
  CourseContent,
  Grade,
  KnowledgePoint,
  KnowledgePrerequisite,
  Lesson,
  LessonKnowledgePointRelation,
  MediaAsset,
  Publisher,
  Question,
  QuestionKnowledgePoint,
  QuestionType,
  Region,
  RegionTextbookRelation,
  Semester,
  Subject,
  SubjectCode,
  TextbookVersion,
  Unit,
  VerificationStatus,
} from './domain'
import type { CurriculumImportPackage, SourceReference } from './curriculum-verification'

export const PRODUCTION_READINESS_VERSION = 'PRODUCTION_READINESS_V1' as const
export const PRODUCTION_CONFIG_VERSION = 'PRODUCTION_CONFIG_V1' as const

export type ReleaseDecision = 'READY' | 'READY_WITH_LIMITATIONS' | 'NOT_READY'
export type ProductionGateStatus = 'PASS' | 'FAIL'
export type MvpScopeEntryStatus = 'CANDIDATE' | 'RELEASED'

/**
 * This is a release contract, not a curriculum fact. Candidate entries may
 * point to an investigation target without making that target selectable.
 */
export interface MvpCurriculumScopeEntry {
  id: string
  regionCode: string
  regionName: string
  grade: number
  semester: 'UPPER' | 'LOWER'
  subjectCode: SubjectCode
  publisherCode?: string
  textbookVersionId?: string
  status: MvpScopeEntryStatus
  sourceReferenceIds: string[]
  blockingReasons?: string[]
}

export interface MvpCurriculumScope {
  selectionPolicy?: 'MANUAL'
  minimumQuestionsPerKnowledgePoint?: number
  readingOnlyKnowledgePointIds?: string[]
  id: string
  version: number
  title: string
  region: {
    code: string
    name: string
  }
  validFrom: string
  validTo?: string
  entries: MvpCurriculumScopeEntry[]
  sourceReferenceIds: string[]
  releaseNote: string
}

export type CurriculumSourceManifestStatus =
  | 'RELIABLE_BUT_OUT_OF_DATE_FOR_RELEASE'
  | 'RELIABLE_CONTEXT_ONLY'
  | 'CANDIDATE_REQUIRES_MANUAL_REVIEW'
  | 'RELEASE_VERIFIED'

export interface CurriculumSourceManifestEntry extends SourceReference {
  evidenceLevel: 1 | 2 | 3 | 4 | 5
  evidenceScope: string
  status: CurriculumSourceManifestStatus
  validityNote: string
}

export interface ProductionCurriculumRecords {
  grades: readonly Grade[]
  semesters: readonly Semester[]
  subjects: readonly Subject[]
  regions: readonly Region[]
  publishers: readonly Publisher[]
  textbooks: readonly TextbookVersion[]
  regionTextbookRelations: readonly RegionTextbookRelation[]
  units: readonly Unit[]
  lessons: readonly Lesson[]
  knowledgePoints: readonly KnowledgePoint[]
  lessonKnowledgePointRelations: readonly LessonKnowledgePointRelation[]
  knowledgePrerequisites: readonly KnowledgePrerequisite[]
  sourceReferences: readonly SourceReference[]
}

export interface ProductionReadinessDataset extends ProductionCurriculumRecords {
  contents: readonly CourseContent[]
  questions: readonly Question[]
  questionKnowledgePoints: readonly QuestionKnowledgePoint[]
  contentSources: readonly ContentSource[]
  mediaAssets: readonly MediaAsset[]
}

export interface ProductionCurriculumIndex {
  scopeId: string
  regions: readonly Region[]
  grades: readonly Grade[]
  semesters: readonly Semester[]
  subjects: readonly Subject[]
  publishers: readonly Publisher[]
  textbooks: readonly TextbookVersion[]
  regionTextbookRelations: readonly RegionTextbookRelation[]
  units: readonly Unit[]
  lessons: readonly Lesson[]
  knowledgePoints: readonly KnowledgePoint[]
  lessonKnowledgePointRelations: readonly LessonKnowledgePointRelation[]
  knowledgePrerequisites: readonly KnowledgePrerequisite[]
  sourceReferences: readonly SourceReference[]
  textbookIds: ReadonlySet<string>
  lessonIds: ReadonlySet<string>
  knowledgePointIds: ReadonlySet<string>
}

export interface ProductionIndex extends ProductionCurriculumIndex {
  contents: readonly CourseContent[]
  questions: readonly Question[]
  questionKnowledgePoints: readonly QuestionKnowledgePoint[]
  contentSources: readonly ContentSource[]
  mediaAssets: readonly MediaAsset[]
  questionIds: ReadonlySet<string>
  contentIds: ReadonlySet<string>
}

export interface CurriculumImportEntityChanges {
  added: string[]
  updated: string[]
  removed: string[]
}

export interface CurriculumImportDiff {
  previousFingerprint: string
  nextFingerprint: string
  unchanged: boolean
  byEntity: Record<
    | 'textbook'
    | 'unit'
    | 'lesson'
    | 'knowledgePoint'
    | 'lessonKnowledgePoint'
    | 'knowledgeRelation',
    CurriculumImportEntityChanges
  >
}

export interface ReviewedCurriculumOverwriteGuardResult {
  allowed: boolean
  reason?: string
  requiresNewIdentity: boolean
}

export interface RegionMappingValidationReport {
  valid: boolean
  issues: string[]
  effectiveRelationIds: string[]
}

export interface ContentCoverageReport {
  lessonTotal: number
  knowledgePointTotal: number
  contentBlockCount: number
  reviewedContentCount: number
  missingLessonIds: string[]
  missingKnowledgePointIds: string[]
  invalidContentIds: string[]
  unsupportedMediaCount: number
  sourceIssueCount: number
  passed: boolean
}

export interface QuestionCoverageReport {
  knowledgePointTotal: number
  knowledgePointsWithQuestions: number
  questionCount: number
  reviewedQuestionCount: number
  typeDistribution: Partial<Record<QuestionType, number>>
  difficultyDistribution: Record<'FOUNDATION' | 'STANDARD' | 'ADVANCED', number>
  missingKnowledgePointIds: string[]
  insufficientKnowledgePointIds: string[]
  invalidQuestionIds: string[]
  sourceIssueCount: number
  minimumQuestionsPerKnowledgePoint: number
  passed: boolean
}

export interface SampleLeakViolation {
  dataset: string
  recordId: string
  field: string
  reason: string
}

export interface SampleLeakScanReport {
  passed: boolean
  violations: SampleLeakViolation[]
}

export interface ProductionReadinessIssue {
  code: string
  severity: 'blocking' | 'warning'
  message: string
  entityId?: string
}

export interface ProductionReadinessReport {
  version: typeof PRODUCTION_READINESS_VERSION
  scopeId: string
  status: ProductionGateStatus
  issues: ProductionReadinessIssue[]
  curriculum: {
    candidateCount: number
    releasedCount: number
    reviewedTextbookCount: number
    reviewedUnitCount: number
    reviewedLessonCount: number
    reviewedKnowledgePointCount: number
    sourceReferenceCount: number
    regionMapping: RegionMappingValidationReport
  }
  content: ContentCoverageReport
  questions: QuestionCoverageReport
  sampleLeak: SampleLeakScanReport
  index: ProductionCurriculumIndex
}

export interface StorageMigrationMatrixRow {
  storageName: string
  storageKey: string
  currentVersion: number
  migrationPath: string
  fallbackBehavior: string
  dataLossRisk: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface StorageMigrationReport {
  valid: boolean
  rows: StorageMigrationMatrixRow[]
  issues: string[]
}

export interface ProductionRuntimeConfig {
  version: typeof PRODUCTION_CONFIG_VERSION
  isProduction: boolean
  allowSampleCurriculum: boolean
  allowUnreviewedCurriculum: boolean
  allowSampleLearningContent: boolean
  allowUnreviewedLearningContent: boolean
  allowSampleQuestions: boolean
  allowUnreviewedQuestions: boolean
  devRoutes: boolean
}

export interface MVPReleaseGateInput {
  readiness: ProductionReadinessReport
  config: ProductionRuntimeConfig
  engineering: Record<string, boolean>
  qa: Record<string, boolean>
  regression: Record<string, boolean>
  documentation: Record<string, boolean>
  limitations?: string[]
}

export interface MVPReleaseGateReport {
  decision: ReleaseDecision
  blockingIssues: string[]
  limitations: string[]
  checks: Record<string, ProductionGateStatus>
}

export interface CurriculumProductionPackageResult {
  package: CurriculumImportPackage
  fingerprint: string
  reportStatus: ProductionGateStatus
  releaseEligible: boolean
  issues: string[]
}

export type ProductionVerificationStatus = VerificationStatus
