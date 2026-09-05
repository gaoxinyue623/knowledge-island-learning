import { z } from 'zod'

const nonEmptyString = z.string().trim().min(1)

export const verificationStatusSchema = z.enum([
  'SAMPLE',
  'UNVERIFIED',
  'VERIFIED',
  'REVIEWED',
  'REJECTED',
])

export const curriculumSourceTypeSchema = z.enum([
  'official_platform',
  'publisher',
  'curriculum_standard',
  'official_document',
  'manual',
  'licensed',
])

const curriculumEvidenceTypeSchema = z.enum([
  'TEXTBOOK_EXISTENCE',
  'TEXTBOOK_IDENTITY',
  'TEXTBOOK_CATALOG',
  'LOCAL_EDUCATION_RESOURCE',
  'REGIONAL_SELECTION',
  'NATIONAL_CATALOG',
  'CURRICULUM_STANDARD',
  'PHYSICAL_BOOK',
])

const curriculumEvidenceDiagnosticCodeSchema = z.enum([
  'EDITION_MISMATCH_WARNING',
  'EDITION_DIFFERENCE',
  'EDITION_VARIANT_CONFLICT',
])

export const sourceReferenceSchema = z.object({
  id: nonEmptyString,
  type: curriculumSourceTypeSchema,
  title: nonEmptyString,
  sourceUrl: nonEmptyString.optional(),
  publisher: nonEmptyString.optional(),
  editionYear: z.number().int().positive().optional(),
  curriculumStandardVersion: nonEmptyString.optional(),
  isbn: nonEmptyString.optional(),
  page: nonEmptyString.optional(),
  section: nonEmptyString.optional(),
  retrievedAt: nonEmptyString.optional(),
  verifiedAt: nonEmptyString.optional(),
  verifiedBy: nonEmptyString.optional(),
  note: nonEmptyString.optional(),
  evidenceTypes: z.array(curriculumEvidenceTypeSchema).min(1).optional(),
  diagnosticCodes: z.array(curriculumEvidenceDiagnosticCodeSchema).min(1).optional(),
})

export const SourceReferenceSchema = sourceReferenceSchema

export const textbookIdentitySchema = z.object({
  stage: z.literal('primary'),
  subjectCode: nonEmptyString,
  grade: z.number().int().min(1).max(6),
  semester: z.union([z.literal(1), z.literal(2)]),
  publisherCode: nonEmptyString,
  seriesCode: nonEmptyString.optional(),
  editionYear: z.number().int().positive().optional(),
  curriculumStandardVersion: nonEmptyString.optional(),
  isbn: nonEmptyString.optional(),
})

export const TextbookIdentitySchema = textbookIdentitySchema

const provenanceMetadataSchema = z.object({
  sourceReferenceIds: z.array(nonEmptyString).min(1),
  verificationStatus: verificationStatusSchema,
  isSample: z.boolean().optional(),
  needsVerification: z.boolean().optional(),
  createdAt: nonEmptyString.optional(),
  updatedAt: nonEmptyString.optional(),
  verifiedAt: nonEmptyString.optional(),
  verifiedBy: nonEmptyString.optional(),
})

export const ProvenanceMetadataSchema = provenanceMetadataSchema

const textbookImportDataSchema = provenanceMetadataSchema.extend({
  id: nonEmptyString,
  title: nonEmptyString,
  identity: textbookIdentitySchema,
  textbookIdentityKey: nonEmptyString.optional(),
})

const unitImportDataSchema = provenanceMetadataSchema.extend({
  id: nonEmptyString,
  textbookId: nonEmptyString,
  unitNo: z.number().int().positive(),
  sort: z.number().int().positive(),
  title: nonEmptyString,
  mappingSkipReason: nonEmptyString.optional(),
})

const lessonImportDataSchema = provenanceMetadataSchema.extend({
  id: nonEmptyString,
  unitId: nonEmptyString,
  lessonNo: z.number().int().positive(),
  sort: z.number().int().positive(),
  title: nonEmptyString,
  mappingSkipReason: nonEmptyString.optional(),
})

const knowledgePointImportDataSchema = provenanceMetadataSchema.extend({
  id: nonEmptyString,
  code: nonEmptyString,
  subjectCode: nonEmptyString,
  categoryId: nonEmptyString,
  name: nonEmptyString,
  description: nonEmptyString,
  gradeStart: z.number().int().min(1).max(6),
  gradeEnd: z.number().int().min(1).max(6),
  difficulty: z.enum(['FOUNDATION', 'STANDARD', 'ADVANCED']),
  importance: z.number().int().min(1).max(5),
  cognitiveLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
  tags: z.array(nonEmptyString),
})

const lessonKnowledgePointImportDataSchema = provenanceMetadataSchema.extend({
  id: nonEmptyString,
  lessonId: nonEmptyString,
  knowledgePointId: nonEmptyString,
  role: z.enum(['core', 'secondary', 'extended']),
  weight: z.number().positive().max(1),
})

const knowledgeRelationImportDataSchema = provenanceMetadataSchema.extend({
  id: nonEmptyString,
  sourceKnowledgePointId: nonEmptyString,
  targetKnowledgePointId: nonEmptyString,
  relationType: z.enum(['prerequisite', 'related', 'advanced']),
})

export const CurriculumImportPackageSchema = z.object({
  schemaVersion: z.number().int().positive(),
  textbook: textbookImportDataSchema,
  units: z.array(unitImportDataSchema),
  lessons: z.array(lessonImportDataSchema),
  knowledgePoints: z.array(knowledgePointImportDataSchema),
  lessonKnowledgePoints: z.array(lessonKnowledgePointImportDataSchema),
  knowledgeRelations: z.array(knowledgeRelationImportDataSchema),
  sources: z.array(sourceReferenceSchema).min(1),
  metadata: z.object({
    generatedAt: nonEmptyString,
    importType: z.enum(['manual', 'official_source', 'migration']),
    verificationStatus: verificationStatusSchema,
  }),
})

export const curriculumImportPackageSchema = CurriculumImportPackageSchema

export const CurriculumReviewRecordSchema = z.object({
  id: nonEmptyString,
  entityType: nonEmptyString,
  entityId: nonEmptyString,
  action: z.enum(['verify', 'review', 'reject', 'request_change']),
  reviewer: z.enum(['SYSTEM', 'MANUAL_REVIEW']),
  reviewedAt: nonEmptyString,
  note: nonEmptyString.optional(),
})
