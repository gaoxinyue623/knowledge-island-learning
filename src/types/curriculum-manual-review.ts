import type { SubjectCode } from './domain'
import type { CurriculumReviewRecord } from './curriculum-verification'
import type {
  CurriculumBatchEvidenceRequirements,
  CurriculumRegionalSelectionStatus,
  CurriculumBatchSlotStatus,
} from './curriculum-batch'
import type { CurriculumEvidenceType } from './curriculum-verification'

/**
 * A review-preparation status is intentionally separate from the curriculum
 * verification lifecycle. It describes what a human can check next; it is
 * never written to a curriculum entity as VERIFIED or REVIEWED.
 */
export type CurriculumManualReviewStatus =
  | 'NOT_STARTED'
  | 'EVIDENCE_MISSING'
  | 'EVIDENCE_CONFLICT'
  | 'READY_FOR_MANUAL_CHECK'
  | 'MANUALLY_CONFIRMED'
  | 'REJECTED'

export const curriculumManualReviewStatuses: readonly CurriculumManualReviewStatus[] = [
  'NOT_STARTED',
  'EVIDENCE_MISSING',
  'EVIDENCE_CONFLICT',
  'READY_FOR_MANUAL_CHECK',
  'MANUALLY_CONFIRMED',
  'REJECTED',
]

export const CURRICULUM_MANUAL_REVIEW_FIELDS = [
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

export type CurriculumManualReviewField = (typeof CURRICULUM_MANUAL_REVIEW_FIELDS)[number]

export const PENDING_MANUAL_REVIEW = 'PENDING_MANUAL_REVIEW' as const

export interface CurriculumBatchManualReviewSlot {
  /** Stable Batch slot ID, for example B01-SZ-G1-MATH-S1. */
  slot: string
  slotLabel: string
  regionName: string
  schoolYear: string
  grade: number
  subject: SubjectCode
  subjectLabel: string
  semester: 1 | 2
  semesterLabel: string
  batchSlotStatus: CurriculumBatchSlotStatus
  regionalSelectionStatus: CurriculumRegionalSelectionStatus
  candidatePublisher: string
  candidateTextbookTitle: string
  candidateSeries: string | null
  candidateRevision: string | null
  candidatePublication: string | null
  candidateIsbn: string | null
  candidateTextbookIdentifier: string | null
  evidenceRequirements: CurriculumBatchEvidenceRequirements
  diagnosticCodes: string[]
  packageId: string | null
  sourceReferenceIds: string[]
  selectionEvidenceStatus: CurriculumManualReviewStatus
  textbookIdentityEvidenceStatus: CurriculumManualReviewStatus
  editionEvidenceStatus: CurriculumManualReviewStatus
  isbnEvidenceStatus: CurriculumManualReviewStatus
  tocEvidenceStatus: CurriculumManualReviewStatus
  regionSelectionStatus: CurriculumManualReviewStatus
  unitReviewStatus: CurriculumManualReviewStatus
  lessonReviewStatus: CurriculumManualReviewStatus
  knowledgePointReviewStatus: CurriculumManualReviewStatus
  mappingReviewStatus: CurriculumManualReviewStatus
  relationReviewStatus: CurriculumManualReviewStatus
  finalVerificationStatus: CurriculumManualReviewStatus
  blockingIssues: string[]
  manualReviewer: string
  manualReviewedAt: string | null
  reviewNote: string | null
}

export type CurriculumEvidenceDecision =
  CurriculumManualReviewStatus | 'CANDIDATE_ONLY' | 'HISTORICAL_ONLY' | 'CONTEXT_ONLY'

export interface CurriculumEvidenceReviewRow {
  source: string
  sourceType: string
  evidenceTypes: CurriculumEvidenceType[]
  sourceLocator: string
  page: string
  retrievedAt: string | null
  entity: string
  field: string
  claim: string
  evidence: string
  decision: CurriculumEvidenceDecision
  reviewer: string
  date: string | null
}

export interface CurriculumTocReferenceLesson {
  lessonNo: number
  sort: number
  title: string
}

export interface CurriculumTocReferenceUnit {
  unitNo: number
  sort: number
  title: string
  lessons: CurriculumTocReferenceLesson[]
}

export type CurriculumTocDiffStatus =
  | 'MATCH'
  | 'TITLE_DIFFERENCE'
  | 'ORDER_DIFFERENCE'
  | 'MISSING_IN_CANDIDATE'
  | 'EXTRA_IN_CANDIDATE'
  | 'NEEDS_REVIEW'

export interface CurriculumTocDiffItem {
  level: 'unit' | 'lesson'
  candidateId: string | null
  candidateTitle: string
  candidateOrder: number | null
  originalTitle: string
  originalOrder: number | null
  status: CurriculumTocDiffStatus
  sourceReferenceIds: string[]
  note: string
}

export interface CurriculumTocDiffReport {
  packageId: string
  textbookId: string
  originalBookEvidenceStatus: CurriculumManualReviewStatus
  items: CurriculumTocDiffItem[]
  counts: Record<CurriculumTocDiffStatus, number>
  reviewStatus: CurriculumManualReviewStatus
}

export type CurriculumKnowledgePointMatchStatus =
  'exact match' | 'possible duplicate' | 'new knowledge point' | 'needs manual decision'

export type CurriculumKnowledgePointManualDecision =
  'PENDING_MANUAL_REVIEW' | 'REUSE' | 'SPLIT' | 'MERGE' | 'RENAME' | 'REJECT'

export interface CurriculumKnowledgePointExistingMatch {
  id: string
  code: string
  name: string
  isSample: boolean
  verificationStatus: string | null
}

export interface CurriculumKnowledgePointReviewItem {
  candidateId: string
  code: string
  name: string
  description: string
  packageIds: string[]
  reusedAcrossPackages: boolean
  existingMatches: CurriculumKnowledgePointExistingMatch[]
  automatedMatchStatus: CurriculumKnowledgePointMatchStatus
  manualDecision: CurriculumKnowledgePointManualDecision
  reviewStatus: CurriculumManualReviewStatus
  checks: {
    name: CurriculumManualReviewStatus
    definition: CurriculumManualReviewStatus
    granularity: CurriculumManualReviewStatus
    duplicate: CurriculumManualReviewStatus
    textbookBinding: CurriculumManualReviewStatus
    gradeScope: CurriculumManualReviewStatus
    difficulty: CurriculumManualReviewStatus
    importance: CurriculumManualReviewStatus
    cognitiveLevel: CurriculumManualReviewStatus
  }
  reviewNote: string | null
}

export interface CurriculumMappingReviewFinding {
  code:
    | 'LESSON_HAS_NO_CORE_KP'
    | 'TOO_MANY_CORE_KP'
    | 'WEIGHT_INVALID'
    | 'DUPLICATE_MAPPING'
    | 'SAME_KP_REPEATED_UNUSUALLY'
    | 'EXTENDED_WITHOUT_CORE'
    | 'CROSS_SUBJECT_MAPPING'
  entityId: string
  knowledgePointId?: string
  lessonId?: string
  message: string
}

export interface CurriculumMappingReviewReport {
  packageId: string
  textbookId: string
  totalMappingCount: number
  lessonCount: number
  repeatedKnowledgePointThreshold: number
  findings: CurriculumMappingReviewFinding[]
  counts: Record<CurriculumMappingReviewFinding['code'], number>
  reviewStatus: CurriculumManualReviewStatus
}

export interface CurriculumRelationReviewItem {
  relationId: string
  sourceKnowledgePointId: string
  sourceKnowledgePointName: string
  targetKnowledgePointId: string
  targetKnowledgePointName: string
  relationType: string
  reason: string
  evidence: string[]
  reviewStatus: CurriculumManualReviewStatus
  reviewNote: string | null
}

export interface CurriculumRelationReviewReport {
  packageId: string
  textbookId: string
  items: CurriculumRelationReviewItem[]
  dagValidation: 'PASS' | 'FAIL'
  reviewStatus: CurriculumManualReviewStatus
}

/**
 * This is a template, not a CurriculumReviewRecord. It is deliberately not
 * accepted by CurriculumReviewRecordSchema until a real reviewer fills the
 * action, reviewer and timestamp.
 */
export interface CurriculumReviewRecordDraft {
  id: string
  entityType: string
  entityId: string
  action: CurriculumReviewRecord['action'] | null
  reviewer: typeof PENDING_MANUAL_REVIEW
  reviewedAt: string | null
  note: string | null
  draftStatus: 'PENDING_USER_CONFIRMATION'
}

export interface CurriculumAuditTrailEntry {
  id: string
  entityType: string
  entityId: string
  field: string
  before: string | number | null
  after: string | number | null
  sourceReferenceIds: string[]
  reason: string
  reviewStatus: CurriculumManualReviewStatus
  reviewer: string
  reviewedAt: string | null
}

export interface CurriculumEvidenceRequest {
  slot: string
  subject: SubjectCode
  semester: 1 | 2
  priority: 1 | 2 | 3
  requestedEvidence: string[]
  reason: string
}

export interface CurriculumManualReviewEligibility {
  canVerify: boolean
  canReview: boolean
  reasons: string[]
}

export interface CurriculumBatchManualReviewReport {
  schemaVersion: 1
  batchId: string
  generatedAt: string
  status: 'REQUIRES_MANUAL_REVIEW'
  slotCount: number
  slots: CurriculumBatchManualReviewSlot[]
  evidenceCompleteSlots: string[]
  evidenceMissingSlots: string[]
  evidenceConflictSlots: string[]
  textbookIdentityReview: CurriculumEvidenceReviewRow[]
  regionSelectionReview: CurriculumEvidenceReviewRow[]
  tocDiffReports: CurriculumTocDiffReport[]
  knowledgePointReview: CurriculumKnowledgePointReviewItem[]
  mappingReviewReports: CurriculumMappingReviewReport[]
  relationReviewReports: CurriculumRelationReviewReport[]
  reviewRecordDrafts: CurriculumReviewRecordDraft[]
  auditTrail: CurriculumAuditTrailEntry[]
  productionEligibleTextbooks: string[]
  productionIndexChange: 'UPDATED' | 'UNCHANGED'
  evidenceRequestList: CurriculumEvidenceRequest[]
  blockingIssues: string[]
}

export interface CurriculumManualReviewStatusTransitionResult {
  allowed: boolean
  from: CurriculumManualReviewStatus
  to: CurriculumManualReviewStatus
  reason?: string
}
