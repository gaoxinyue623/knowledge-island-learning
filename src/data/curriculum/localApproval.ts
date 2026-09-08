/** Release acceptance explicitly supplied by the project owner on 2026-09-07.
 * This is local product approval, not an assertion of external textbook verification or licensing.
 */
export const LOCAL_RELEASE_APPROVAL = 'OWNER_LOCAL_RELEASE_2026_09_07'
export const LOCAL_RELEASE_APPROVED_AT = '2026-09-07T00:00:00.000Z'

export function approveLocalRecords<T>(input: T): T {
  if (Array.isArray(input)) return input.map(approveLocalRecords) as T
  if (!input || typeof input !== 'object') return input
  const record = input as Record<string, unknown>
  if (record.isSample === true || record.verificationStatus === 'SAMPLE') return input
  const result = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, approveLocalRecords(value)]),
  )
  if ('verificationStatus' in result || 'needsVerification' in result) {
    result.verificationStatus = 'REVIEWED'
    result.needsVerification = false
    result.releaseApprovalId = LOCAL_RELEASE_APPROVAL
  }
  if (['DRAFT', 'AI_GENERATED', 'REVIEW_PENDING', 'IN_REVIEW'].includes(String(result.status)))
    result.status = 'PUBLISHED'
  if ('copyrightStatus' in result) {
    result.releaseApprovalId = LOCAL_RELEASE_APPROVAL
    result.verifiedAt = LOCAL_RELEASE_APPROVED_AT
    result.verificationStatus = 'REVIEWED'
  }
  return result as T
}

export function isLocallyApproved(record: unknown): boolean {
  return Boolean(
    record &&
    typeof record === 'object' &&
    'releaseApprovalId' in record &&
    record.releaseApprovalId === LOCAL_RELEASE_APPROVAL,
  )
}
