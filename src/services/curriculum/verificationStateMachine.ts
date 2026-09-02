import type {
  CurriculumReviewRecord,
  VerificationStatus,
  VerificationTransitionResult,
} from '@/types'

const allowedTransitions: Readonly<Record<VerificationStatus, ReadonlySet<VerificationStatus>>> = {
  SAMPLE: new Set<VerificationStatus>(['SAMPLE']),
  UNVERIFIED: new Set<VerificationStatus>(['UNVERIFIED', 'VERIFIED', 'REJECTED']),
  VERIFIED: new Set<VerificationStatus>(['VERIFIED', 'REVIEWED', 'REJECTED']),
  REVIEWED: new Set<VerificationStatus>(['REVIEWED']),
  REJECTED: new Set<VerificationStatus>(['REJECTED', 'UNVERIFIED']),
}

export function canTransitionVerificationStatus(
  from: VerificationStatus,
  to: VerificationStatus,
): VerificationTransitionResult {
  if (from === to) return { allowed: true, from, to }

  const allowed = allowedTransitions[from].has(to)
  if (allowed) return { allowed: true, from, to }

  return {
    allowed: false,
    from,
    to,
    reason:
      from === 'SAMPLE'
        ? 'SAMPLE 数据不能升级为 VERIFIED 或 REVIEWED'
        : `${from} 不能直接转换为 ${to}`,
  }
}

export function getVerificationStatusForReviewAction(
  action: CurriculumReviewRecord['action'],
): VerificationStatus {
  if (action === 'verify') return 'VERIFIED'
  if (action === 'review') return 'REVIEWED'
  if (action === 'reject') return 'REJECTED'
  return 'UNVERIFIED'
}

export function validateReviewRecordTransition(
  currentStatus: VerificationStatus,
  record: CurriculumReviewRecord,
): VerificationTransitionResult {
  return canTransitionVerificationStatus(
    currentStatus,
    getVerificationStatusForReviewAction(record.action),
  )
}

export function transitionVerificationStatus(
  currentStatus: VerificationStatus,
  record: CurriculumReviewRecord,
): VerificationStatus {
  const result = validateReviewRecordTransition(currentStatus, record)
  if (!result.allowed) {
    throw new Error(result.reason ?? `不能从 ${currentStatus} 转换为 ${result.to}`)
  }
  return result.to
}
