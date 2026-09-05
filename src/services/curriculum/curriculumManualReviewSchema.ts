import { z } from 'zod'

const manualReviewStatusSchema = z.enum([
  'NOT_STARTED',
  'EVIDENCE_MISSING',
  'EVIDENCE_CONFLICT',
  'READY_FOR_MANUAL_CHECK',
  'MANUALLY_CONFIRMED',
  'REJECTED',
])

const evidenceRequirementStatusSchema = z.enum([
  'MISSING',
  'PUBLIC_CANDIDATE_AVAILABLE',
  'PHYSICAL_BOOK_REQUIRED',
  'OFFICIAL_SELECTION_REQUIRED',
  'MANUALLY_CONFIRMED',
])

const evidenceDiagnosticCodeSchema = z.enum([
  'EDITION_MISMATCH_WARNING',
  'EDITION_DIFFERENCE',
  'EDITION_VARIANT_CONFLICT',
])

const evidenceRequirementsSchema = z.object({
  coverEvidence: evidenceRequirementStatusSchema,
  copyrightPageEvidence: evidenceRequirementStatusSchema,
  tocEvidence: evidenceRequirementStatusSchema,
  regionalSelectionEvidence: evidenceRequirementStatusSchema,
  isbnEvidence: evidenceRequirementStatusSchema,
})

const slotStatusFields = {
  selectionEvidenceStatus: manualReviewStatusSchema,
  textbookIdentityEvidenceStatus: manualReviewStatusSchema,
  editionEvidenceStatus: manualReviewStatusSchema,
  isbnEvidenceStatus: manualReviewStatusSchema,
  tocEvidenceStatus: manualReviewStatusSchema,
  regionSelectionStatus: manualReviewStatusSchema,
  unitReviewStatus: manualReviewStatusSchema,
  lessonReviewStatus: manualReviewStatusSchema,
  knowledgePointReviewStatus: manualReviewStatusSchema,
  mappingReviewStatus: manualReviewStatusSchema,
  relationReviewStatus: manualReviewStatusSchema,
  finalVerificationStatus: manualReviewStatusSchema,
}

/** Runtime contract for the six-slot review matrix. */
export const CurriculumBatchManualReviewSlotSchema = z.object({
  slot: z.string().min(1),
  slotLabel: z.string().min(1),
  regionName: z.string().min(1),
  schoolYear: z.string().min(1),
  grade: z.number().int().min(1).max(6),
  subject: z.enum(['CHINESE', 'MATH', 'ENGLISH']),
  subjectLabel: z.string().min(1),
  semester: z.union([z.literal(1), z.literal(2)]),
  semesterLabel: z.string().min(1),
  batchSlotStatus: z.enum(['CONFIRMED', 'PARTIAL', 'UNVERIFIED', 'NOT_FOUND']),
  regionalSelectionStatus: z.enum(['NOT_CONFIRMED', 'CONFIRMED']),
  candidatePublisher: z.string().min(1),
  candidateTextbookTitle: z.string().min(1),
  candidateSeries: z.string().nullable(),
  candidateRevision: z.string().nullable(),
  candidatePublication: z.string().nullable(),
  candidateIsbn: z.string().nullable(),
  candidateTextbookIdentifier: z.string().nullable(),
  evidenceRequirements: evidenceRequirementsSchema,
  diagnosticCodes: z.array(evidenceDiagnosticCodeSchema),
  packageId: z.string().min(1).nullable(),
  sourceReferenceIds: z.array(z.string()),
  ...slotStatusFields,
  blockingIssues: z.array(z.string()),
  manualReviewer: z.string().min(1),
  manualReviewedAt: z.string().nullable(),
  reviewNote: z.string().nullable(),
})

export const CurriculumReviewRecordDraftSchema = z.object({
  id: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  action: z.enum(['verify', 'review', 'reject', 'request_change']).nullable(),
  reviewer: z.literal('PENDING_MANUAL_REVIEW'),
  reviewedAt: z.string().nullable(),
  note: z.string().nullable(),
  draftStatus: z.literal('PENDING_USER_CONFIRMATION'),
})

/**
 * The nested reports have their own domain contracts. This top-level schema
 * validates the matrix and draft boundary while allowing those report
 * sections to evolve independently.
 */
export const CurriculumBatchManualReviewReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    batchId: z.string().min(1),
    generatedAt: z.string().min(1),
    status: z.literal('REQUIRES_MANUAL_REVIEW'),
    slotCount: z.number().int().nonnegative(),
    slots: z.array(CurriculumBatchManualReviewSlotSchema),
    evidenceCompleteSlots: z.array(z.string()),
    evidenceMissingSlots: z.array(z.string()),
    evidenceConflictSlots: z.array(z.string()),
    textbookIdentityReview: z.array(z.unknown()),
    regionSelectionReview: z.array(z.unknown()),
    tocDiffReports: z.array(z.unknown()),
    knowledgePointReview: z.array(z.unknown()),
    mappingReviewReports: z.array(z.unknown()),
    relationReviewReports: z.array(z.unknown()),
    reviewRecordDrafts: z.array(CurriculumReviewRecordDraftSchema),
    auditTrail: z.array(z.unknown()),
    productionEligibleTextbooks: z.array(z.string()),
    productionIndexChange: z.enum(['UPDATED', 'UNCHANGED']),
    evidenceRequestList: z.array(z.unknown()),
    blockingIssues: z.array(z.string()),
  })
  .refine((report) => report.slotCount === report.slots.length, {
    message: 'slotCount must equal slots.length',
    path: ['slotCount'],
  })
