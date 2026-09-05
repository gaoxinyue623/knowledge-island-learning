import type { SubjectCode, VerificationStatus } from './domain'
import type {
  CurriculumEvidenceDiagnosticCode,
  CurriculumImportPackage,
  CurriculumReviewReport,
  SourceReference,
} from './curriculum-verification'
import type { CurriculumImportDiff } from './production-readiness'

export type CurriculumBatchSlotStatus = 'CONFIRMED' | 'PARTIAL' | 'UNVERIFIED' | 'NOT_FOUND'

/** Current-year regional mapping is a separate fact from slot survey status. */
export type CurriculumRegionalSelectionStatus = 'NOT_CONFIRMED' | 'CONFIRMED'

export const curriculumRegionalSelectionStatuses: readonly CurriculumRegionalSelectionStatus[] = [
  'NOT_CONFIRMED',
  'CONFIRMED',
]

export type CurriculumEvidenceRequirementStatus =
  | 'MISSING'
  | 'PUBLIC_CANDIDATE_AVAILABLE'
  | 'PHYSICAL_BOOK_REQUIRED'
  | 'OFFICIAL_SELECTION_REQUIRED'
  | 'MANUALLY_CONFIRMED'

export const curriculumEvidenceRequirementStatuses: readonly CurriculumEvidenceRequirementStatus[] =
  [
    'MISSING',
    'PUBLIC_CANDIDATE_AVAILABLE',
    'PHYSICAL_BOOK_REQUIRED',
    'OFFICIAL_SELECTION_REQUIRED',
    'MANUALLY_CONFIRMED',
  ]

export interface CurriculumBatchEvidenceRequirements {
  coverEvidence: CurriculumEvidenceRequirementStatus
  copyrightPageEvidence: CurriculumEvidenceRequirementStatus
  tocEvidence: CurriculumEvidenceRequirementStatus
  regionalSelectionEvidence: CurriculumEvidenceRequirementStatus
  isbnEvidence: CurriculumEvidenceRequirementStatus
}

export type CurriculumBatchReviewStatus =
  | 'NOT_STARTED'
  | 'COLLECTING'
  | 'STRUCTURED'
  | 'VALIDATED'
  | 'REQUIRES_MANUAL_REVIEW'
  | 'PARTIALLY_REVIEWED'
  | 'REVIEWED'

export interface CurriculumBatchSourceManifestEntry {
  id: string
  regionCode: string
  schoolYear: string
  grade: number
  semester: 1 | 2
  subject: SubjectCode
  publisher?: string
  textbookTitle?: string
  isbn?: string
  editionYear?: number
  candidateSeries?: string
  candidateRevision?: string
  candidatePublication?: string
  candidateIsbn?: string
  candidateTextbookIdentifier?: string
  selectionSourceId?: string
  isbnSourceId?: string
  textbookSourceId?: string
  catalogSourceId?: string
  curriculumStandardSourceId?: string
  sourceReferenceIds: string[]
  selectionStatus: CurriculumBatchSlotStatus
  regionalSelectionStatus: CurriculumRegionalSelectionStatus
  verificationStatus: VerificationStatus
  evidenceRequirements: CurriculumBatchEvidenceRequirements
  diagnosticCodes?: CurriculumEvidenceDiagnosticCode[]
  notes?: string
}

export interface CurriculumBatchSlot {
  id: string
  regionCode: string
  regionName: string
  schoolYear: string
  grade: number
  semester: 1 | 2
  subjectCode: SubjectCode
  status: CurriculumBatchSlotStatus
  sourceManifestEntryId: string
  regionalSelectionStatus: CurriculumRegionalSelectionStatus
  packageId?: string
  textbookVersionId?: string
  textbookIdentityKey?: string
  publisher?: string
  textbookTitle?: string
  candidateSeries?: string
  candidateRevision?: string
  candidatePublication?: string
  candidateIsbn?: string
  candidateTextbookIdentifier?: string
  evidenceRequirements: CurriculumBatchEvidenceRequirements
  diagnosticCodes?: CurriculumEvidenceDiagnosticCode[]
  sourceReferenceIds: string[]
  blockingSourceGaps: string[]
  manualReviewItems: string[]
  notes?: string
}

export interface CurriculumBatchPackageDescriptor {
  packageId: string
  slotId: string
  relativePath: string
  status: 'CANDIDATE' | 'RELEASED'
}

export interface CurriculumBatchManifest {
  id: string
  version: number
  title: string
  regionCode: string
  regionName: string
  schoolYear: string
  grade: number
  subjects: readonly SubjectCode[]
  semesters: readonly [1, 2]
  status: CurriculumBatchReviewStatus
  generatedAt: string
  sourceManifestEntryIds: string[]
  slots: readonly CurriculumBatchSlot[]
  packages: readonly CurriculumBatchPackageDescriptor[]
  releaseNote: string
}

export interface CurriculumBatchImportSummary {
  packageId: string
  slotId: string
  success: boolean
  reportStatus: CurriculumReviewReport['finalResult']
  fingerprint: string
  imported: CurriculumImportResultCounts
  diff: CurriculumImportDiff
  reviewedOverwriteGuard: 'PASS' | 'FAIL'
  releaseEligible: boolean
  issues: string[]
}

export interface CurriculumImportResultCounts {
  textbooks: number
  units: number
  lessons: number
  knowledgePoints: number
  lessonKnowledgePoints: number
  knowledgeRelations: number
}

export interface CurriculumBatchReviewReport {
  batchId: string
  status: CurriculumBatchReviewStatus
  slotCount: number
  confirmedSlotCount: number
  partialSlotCount: number
  unverifiedSlotCount: number
  notFoundSlotCount: number
  packageCount: number
  validatedPackageCount: number
  sourceReferenceCount: number
  textbookCount: number
  unitCount: number
  lessonCount: number
  knowledgePointCandidateCount: number
  reusedKnowledgePointCount: number
  newKnowledgePointCount: number
  lessonKnowledgePointCount: number
  knowledgeRelationCount: number
  importValidation: 'PASS' | 'FAIL'
  integrityValidation: 'PASS' | 'FAIL'
  dagValidation: 'PASS' | 'FAIL'
  importDiff: 'PASS' | 'FAIL'
  reviewedOverwriteGuard: 'PASS' | 'FAIL'
  productionIndexChange: 'YES' | 'NO'
  manualReviewItems: string[]
  blockingSourceGaps: string[]
  packageSummaries: CurriculumBatchImportSummary[]
}

export interface CurriculumBatchSourceValidationReport {
  valid: boolean
  issues: string[]
  missingSourceReferenceIds: string[]
  duplicateManifestEntryIds: string[]
}

export interface CurriculumBatchPackageInput {
  descriptor: CurriculumBatchPackageDescriptor
  package: CurriculumImportPackage
  previousPackage?: CurriculumImportPackage
}

export interface CurriculumBatchReportInput {
  manifest: CurriculumBatchManifest
  sourceManifest: readonly CurriculumBatchSourceManifestEntry[]
  sourceReferences: readonly SourceReference[]
  packageInputs: readonly CurriculumBatchPackageInput[]
  packageSummaries: readonly CurriculumBatchImportSummary[]
}
