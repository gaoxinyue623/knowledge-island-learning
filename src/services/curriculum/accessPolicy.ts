import type { VerificationStatus } from '@/types'

import { productionConfig } from '../../config/production'

export interface CurriculumAccessPolicy {
  allowSampleCurriculum: boolean
  allowUnreviewedCurriculum: boolean
  /** Learning content uses its own switches so curriculum approval cannot
   * accidentally make unreviewed lesson content readable. */
  allowSampleLearningContent?: boolean
  allowUnreviewedLearningContent?: boolean
  allowSampleQuestions?: boolean
  allowUnreviewedQuestions?: boolean
}

/**
 * SAMPLE data is useful to the local UI, while production resolution is
 * intentionally review-gated. Both switches live here so consumers do not
 * make independent environment checks.
 */
export const curriculumAccessConfig: CurriculumAccessPolicy = {
  allowSampleCurriculum: productionConfig.allowSampleCurriculum,
  allowUnreviewedCurriculum: productionConfig.allowUnreviewedCurriculum,
  allowSampleLearningContent: productionConfig.allowSampleLearningContent,
  allowUnreviewedLearningContent: productionConfig.allowUnreviewedLearningContent,
  allowSampleQuestions: productionConfig.allowSampleQuestions,
  allowUnreviewedQuestions: productionConfig.allowUnreviewedQuestions,
}

export function getRecordVerificationStatus(record: {
  isSample?: boolean
  needsVerification?: boolean
  verificationStatus?: VerificationStatus
}): VerificationStatus | undefined {
  if (record.verificationStatus) return record.verificationStatus
  if (record.isSample === true) return 'SAMPLE'
  if (record.needsVerification === true) return 'UNVERIFIED'
  return undefined
}

export function isCurriculumRecordReadable(
  record: {
    isSample?: boolean
    needsVerification?: boolean
    verificationStatus?: VerificationStatus
    status?: string
  },
  policy: CurriculumAccessPolicy = curriculumAccessConfig,
): boolean {
  if (record.status === 'ARCHIVED') return false
  const verificationStatus = getRecordVerificationStatus(record)
  if (verificationStatus === 'REVIEWED') {
    return record.status === undefined || record.status === 'ACTIVE'
  }
  if (verificationStatus === 'SAMPLE') return policy.allowSampleCurriculum
  if (verificationStatus === 'UNVERIFIED' || verificationStatus === 'VERIFIED') {
    return policy.allowUnreviewedCurriculum
  }
  return false
}

/**
 * Content has a separate publication gate from the curriculum structure.
 * A reviewed textbook therefore never silently publishes an unreviewed
 * CourseContent record.
 */
export function isLearningContentRecordReadable(
  record: {
    isSample?: boolean
    needsVerification?: boolean
    verificationStatus?: VerificationStatus
    status?: string
  },
  policy: CurriculumAccessPolicy = curriculumAccessConfig,
): boolean {
  if (record.status === 'ARCHIVED') return false
  const verificationStatus = getRecordVerificationStatus(record)
  if (verificationStatus === 'REVIEWED') return record.status === 'PUBLISHED'
  if (verificationStatus === 'SAMPLE') return policy.allowSampleLearningContent === true
  if (verificationStatus === 'UNVERIFIED' || verificationStatus === 'VERIFIED') {
    return policy.allowUnreviewedLearningContent === true
  }
  return false
}

/**
 * Questions have an independent guard. A reviewed curriculum does not make
 * an unreviewed question readable by accident.
 */
export function isQuestionRecordReadable(
  record: {
    isSample?: boolean
    needsVerification?: boolean
    verificationStatus?: VerificationStatus
    status?: string
  },
  policy: CurriculumAccessPolicy = curriculumAccessConfig,
): boolean {
  if (record.status === 'ARCHIVED') return false
  const verificationStatus = getRecordVerificationStatus(record)
  if (verificationStatus === 'REVIEWED') return record.status === 'PUBLISHED'
  if (verificationStatus === 'SAMPLE') {
    return policy.allowSampleQuestions ?? policy.allowSampleCurriculum
  }
  if (verificationStatus === 'UNVERIFIED' || verificationStatus === 'VERIFIED') {
    return policy.allowUnreviewedQuestions ?? policy.allowUnreviewedCurriculum
  }
  return false
}
