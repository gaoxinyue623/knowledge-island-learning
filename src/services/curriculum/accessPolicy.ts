import type { VerificationStatus } from '@/types'

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

type ViteEnvironment = {
  PROD?: boolean
  VITE_ALLOW_SAMPLE_CURRICULUM?: string
  VITE_ALLOW_UNREVIEWED_CURRICULUM?: string
  VITE_ALLOW_SAMPLE_LEARNING_CONTENT?: string
  VITE_ALLOW_UNREVIEWED_LEARNING_CONTENT?: string
  VITE_ALLOW_SAMPLE_QUESTIONS?: string
  VITE_ALLOW_UNREVIEWED_QUESTIONS?: string
}

const viteEnvironment = (import.meta as ImportMeta & { env?: ViteEnvironment }).env

/**
 * SAMPLE data is useful to the local UI, while production resolution is
 * intentionally review-gated. Both switches live here so consumers do not
 * make independent environment checks.
 */
export const curriculumAccessConfig: CurriculumAccessPolicy = {
  allowSampleCurriculum:
    viteEnvironment?.PROD !== true && viteEnvironment?.VITE_ALLOW_SAMPLE_CURRICULUM !== 'false',
  allowUnreviewedCurriculum:
    viteEnvironment?.PROD !== true && viteEnvironment?.VITE_ALLOW_UNREVIEWED_CURRICULUM === 'true',
  allowSampleLearningContent:
    viteEnvironment?.PROD !== true &&
    viteEnvironment?.VITE_ALLOW_SAMPLE_LEARNING_CONTENT !== 'false',
  allowUnreviewedLearningContent:
    viteEnvironment?.PROD !== true &&
    viteEnvironment?.VITE_ALLOW_UNREVIEWED_LEARNING_CONTENT !== 'false',
  allowSampleQuestions:
    viteEnvironment?.PROD !== true && viteEnvironment?.VITE_ALLOW_SAMPLE_QUESTIONS !== 'false',
  allowUnreviewedQuestions:
    viteEnvironment?.PROD !== true && viteEnvironment?.VITE_ALLOW_UNREVIEWED_QUESTIONS !== 'false',
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
  if (verificationStatus === 'REVIEWED') return true
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
  if (verificationStatus === 'REVIEWED') return true
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
  if (verificationStatus === 'REVIEWED') return true
  if (verificationStatus === 'SAMPLE') {
    return policy.allowSampleQuestions ?? policy.allowSampleCurriculum
  }
  if (verificationStatus === 'UNVERIFIED' || verificationStatus === 'VERIFIED') {
    return policy.allowUnreviewedQuestions ?? policy.allowUnreviewedCurriculum
  }
  return false
}
