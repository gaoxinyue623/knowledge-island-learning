import type {
  ContentSource,
  CourseContent,
  Challenge,
  ExtensionActivity,
  ExerciseTemplate,
  InteractiveActivity,
  PracticeSet,
  MediaAsset,
  Question,
  QuestionKnowledgePoint,
  SourceReference,
  VerificationStatus,
} from '@/types'
import type { SampleLeakScanReport, SampleLeakViolation } from '@/types'

export interface ProductionRecordMetadata {
  id: string
  sourceId?: string
  sourceReferenceIds?: readonly string[]
  isSample?: boolean
  needsVerification?: boolean
  verificationStatus?: VerificationStatus
  status?: string
}

function isReviewedMetadata(record: ProductionRecordMetadata): boolean {
  return (
    record.isSample !== true &&
    record.needsVerification !== true &&
    record.verificationStatus === 'REVIEWED' &&
    record.status !== 'ARCHIVED'
  )
}

export function isProductionCurriculumRecord(record: ProductionRecordMetadata): boolean {
  return isReviewedMetadata(record) && (record.status === undefined || record.status === 'ACTIVE')
}

export function isProductionRelationRecord(record: ProductionRecordMetadata): boolean {
  return isReviewedMetadata(record) && (record.status === undefined || record.status === 'ACTIVE')
}

export function isProductionContentRecord(
  record: CourseContent | ProductionRecordMetadata,
): boolean {
  return (
    isReviewedMetadata(record) &&
    record.status === 'PUBLISHED' &&
    record.isSample !== true &&
    record.verificationStatus === 'REVIEWED'
  )
}

export function isProductionQuestionRecord(record: Question | ProductionRecordMetadata): boolean {
  return (
    isReviewedMetadata(record) &&
    record.status === 'PUBLISHED' &&
    record.isSample !== true &&
    record.verificationStatus === 'REVIEWED'
  )
}

export function isProductionQuestionMapping(record: QuestionKnowledgePoint): boolean {
  return isReviewedMetadata(record) && record.status === 'ACTIVE'
}

/**
 * Content Expansion records are independently publishable. A reviewed
 * curriculum or question never makes an activity/template readable by
 * accident.
 */
export function isProductionInteractiveActivity(record: InteractiveActivity): boolean {
  return isReviewedMetadata(record)
}

export function isProductionExerciseTemplate(record: ExerciseTemplate): boolean {
  return isReviewedMetadata(record)
}

export function isProductionPracticeSet(record: PracticeSet): boolean {
  return isReviewedMetadata(record)
}

export function isProductionExtensionActivity(record: ExtensionActivity): boolean {
  return isReviewedMetadata(record)
}

export function isProductionChallenge(record: Challenge): boolean {
  return isReviewedMetadata(record)
}

export function isProductionSourceReference(record: SourceReference): boolean {
  return Boolean(
    record.sourceUrl &&
    record.verifiedAt &&
    record.verifiedBy &&
    !record.sourceUrl.startsWith('sample:') &&
    !record.id.startsWith('SAMPLE_'),
  )
}

export function isProductionContentSource(record: ContentSource): boolean {
  return Boolean(
    record.verificationStatus === 'REVIEWED' &&
    record.copyrightStatus === 'CLEARED' &&
    record.sourceRef &&
    record.verifiedAt &&
    !record.sourceRef.startsWith('sample:') &&
    !record.id.startsWith('SAMPLE_'),
  )
}

export function isProductionMediaAsset(record: MediaAsset): boolean {
  return Boolean(
    record.status === 'ACTIVE' &&
    record.needsVerification === false &&
    record.verificationStatus === 'REVIEWED' &&
    record.copyrightStatus === 'CLEARED' &&
    record.url &&
    record.altText &&
    !record.id.startsWith('SAMPLE_') &&
    !record.sourceId.startsWith('SAMPLE_'),
  )
}

function addViolation(
  violations: SampleLeakViolation[],
  dataset: string,
  record: ProductionRecordMetadata,
  field: string,
  reason: string,
): void {
  violations.push({ dataset, recordId: record.id, field, reason })
}

/** Scan only release-index records. Text inside authored lesson/question copy is not scanned. */
export function scanProductionSampleLeaks(
  groups: ReadonlyArray<{
    dataset: string
    records: readonly ProductionRecordMetadata[]
  }>,
): SampleLeakScanReport {
  const violations: SampleLeakViolation[] = []
  for (const group of groups) {
    for (const record of group.records) {
      if (record.id.startsWith('SAMPLE_')) {
        addViolation(violations, group.dataset, record, 'id', 'SAMPLE_* ID 不能进入生产索引。')
      }
      if (record.sourceId?.startsWith('SAMPLE_')) {
        addViolation(
          violations,
          group.dataset,
          record,
          'sourceId',
          '生产记录不能引用 SAMPLE 来源。',
        )
      }
      if (record.sourceReferenceIds?.some((id) => id.startsWith('SAMPLE_'))) {
        addViolation(
          violations,
          group.dataset,
          record,
          'sourceReferenceIds',
          '生产记录不能引用 SAMPLE SourceReference。',
        )
      }
      if (record.isSample === true || record.verificationStatus === 'SAMPLE') {
        addViolation(
          violations,
          group.dataset,
          record,
          record.isSample === true ? 'isSample' : 'verificationStatus',
          'SAMPLE 标记不能进入生产索引。',
        )
      }
    }
  }
  return { passed: violations.length === 0, violations }
}
