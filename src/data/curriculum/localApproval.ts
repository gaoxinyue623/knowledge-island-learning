import { G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL } from './production/gradeFourEnglishUpperApproval'
import { G5_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL } from './production/gradeFiveEnglishLowerApproval'
import { G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL } from './production/gradeSixEnglishLowerApproval'
import { G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL } from './production/gradeSixEnglishUpperApproval'
import { G5_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL } from './production/gradeFiveEnglishUpperApproval'
import { G4_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL } from './production/gradeFourEnglishLowerApproval'
import { G3_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL } from './production/gradeThreeEnglishLowerApproval'
import { G3_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL } from './production/gradeThreeEnglishUpperApproval'
import { G6_BNU_MATH_LOWER_IMPORT_APPROVAL } from './production/gradeSixBnuMathLowerApproval'
import { G6_BNU_MATH_LOWER_SYNC_APPROVAL } from './production/gradeSixBnuMathLowerSyncApproval'
import { G6_BNU_MATH_IMPORT_APPROVAL } from './production/gradeSixBnuMathApproval'
import { G6_BNU_MATH_SYNC_APPROVAL } from './production/gradeSixBnuMathSyncApproval'
import { G5_BNU_MATH_LOWER_IMPORT_APPROVAL } from './production/gradeFiveBnuMathLowerApproval'
import { G5_BNU_MATH_LOWER_SYNC_APPROVAL } from './production/gradeFiveBnuMathLowerSyncApproval'
import { G5_BNU_MATH_IMPORT_APPROVAL } from './production/gradeFiveBnuMathApproval'
import { G5_BNU_MATH_SYNC_APPROVAL } from './production/gradeFiveBnuMathSyncApproval'
import { G4_BNU_MATH_LOWER_IMPORT_APPROVAL } from './production/gradeFourBnuMathLowerApproval'
import { G4_BNU_MATH_LOWER_SYNC_APPROVAL } from './production/gradeFourBnuMathLowerSyncApproval'
import { G4_BNU_MATH_SYNC_APPROVAL } from './production/gradeFourBnuMathSyncApproval'
import { G4_BNU_MATH_IMPORT_APPROVAL } from './production/gradeFourBnuMathApproval'
import { G3_BNU_MATH_SYNC_APPROVAL } from './production/gradeThreeBnuMathSyncApproval'
import { G3_BNU_MATH_LOWER_IMPORT_APPROVAL } from './production/gradeThreeBnuMathLowerApproval'
import { G3_BNU_MATH_IMPORT_APPROVAL } from './production/gradeThreeBnuMathApproval'
import { G6_CHINESE_2019_LOWER_IMPORT_APPROVAL } from './production/gradeSixChinese2019LowerApproval'
import { G6_CHINESE_IMPORT_APPROVAL } from './production/gradeSixChineseApproval'
import { G6_CHINESE_2019_IMPORT_APPROVAL } from './production/gradeSixChinese2019Approval'
import { G5_CHINESE_LOWER_IMPORT_APPROVAL } from './production/gradeFiveChineseLowerApproval'
import { G5_CHINESE_IMPORT_APPROVAL } from './production/gradeFiveChineseApproval'
import { G4_CHINESE_LOWER_IMPORT_APPROVAL } from './production/gradeFourChineseLowerApproval'
import { G4_CHINESE_IMPORT_APPROVAL } from './production/gradeFourChineseApproval'
import { G3_CHINESE_LOWER_IMPORT_APPROVAL } from './production/gradeThreeChineseLowerApproval'
import { G3_CHINESE_LOWER_SYNC_APPROVAL } from './production/gradeThreeChineseLowerSyncApproval'
import { G3_CHINESE_SYNC_APPROVAL } from './production/gradeThreeChineseSyncApproval'
import { G3_CHINESE_IMPORT_APPROVAL } from './production/gradeThreeChineseApproval'
import { SHENZHEN_ENGLISH_SYNC_APPROVAL } from './production/shenzhenEnglishSyncApproval'
import { CHINESE_READING_RELEASE_APPROVAL } from './production/chineseReadingRelease'
import { SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL } from './production/shenzhenEnglishLowerApproval'
import { BNU_MATH_LOWER_IMPORT_APPROVAL } from './production/bnuMathLowerApproval'

/** Release acceptance explicitly supplied by the project owner on 2026-09-07.
 * This is local product approval, not an assertion of external textbook verification or licensing.
 */
export const LOCAL_RELEASE_APPROVAL = 'OWNER_LOCAL_RELEASE_2026_09_07'
export const LOCAL_RELEASE_APPROVED_AT = '2026-09-07T00:00:00.000Z'

export function approveLocalRecords<T>(input: T): T {
  if (Array.isArray(input)) return input.map(approveLocalRecords) as T
  if (!input || typeof input !== 'object') return input
  const record = input as Record<string, unknown>
  // A separately reviewed import retains its own date, provenance and scope.
  if (
    [
      BNU_MATH_LOWER_IMPORT_APPROVAL,
      G3_BNU_MATH_IMPORT_APPROVAL,
      G4_BNU_MATH_SYNC_APPROVAL,
      G4_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G4_BNU_MATH_LOWER_SYNC_APPROVAL,
      G5_BNU_MATH_IMPORT_APPROVAL,
      G5_BNU_MATH_SYNC_APPROVAL,
      G5_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G5_BNU_MATH_LOWER_SYNC_APPROVAL,
      G6_BNU_MATH_IMPORT_APPROVAL,
      G6_BNU_MATH_SYNC_APPROVAL,
      G6_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G6_BNU_MATH_LOWER_SYNC_APPROVAL,
      G4_BNU_MATH_IMPORT_APPROVAL,
      G3_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      G5_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      G5_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      G4_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G3_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G3_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL,
      SHENZHEN_ENGLISH_SYNC_APPROVAL,
      G3_CHINESE_IMPORT_APPROVAL,
      G4_CHINESE_IMPORT_APPROVAL,
      G5_CHINESE_IMPORT_APPROVAL,
      G6_CHINESE_IMPORT_APPROVAL,
      G6_CHINESE_2019_IMPORT_APPROVAL,
      G6_CHINESE_2019_LOWER_IMPORT_APPROVAL,
      G5_CHINESE_LOWER_IMPORT_APPROVAL,
      G4_CHINESE_LOWER_IMPORT_APPROVAL,
      G3_CHINESE_LOWER_IMPORT_APPROVAL,
      G3_CHINESE_LOWER_SYNC_APPROVAL,
      G3_BNU_MATH_SYNC_APPROVAL,
      G3_CHINESE_SYNC_APPROVAL,
    ].includes(String(record.releaseApprovalId))
  )
    return input
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
    [
      LOCAL_RELEASE_APPROVAL,
      CHINESE_READING_RELEASE_APPROVAL,
      BNU_MATH_LOWER_IMPORT_APPROVAL,
      G3_BNU_MATH_IMPORT_APPROVAL,
      G4_BNU_MATH_SYNC_APPROVAL,
      G4_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G4_BNU_MATH_LOWER_SYNC_APPROVAL,
      G5_BNU_MATH_IMPORT_APPROVAL,
      G5_BNU_MATH_SYNC_APPROVAL,
      G5_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G5_BNU_MATH_LOWER_SYNC_APPROVAL,
      G6_BNU_MATH_IMPORT_APPROVAL,
      G6_BNU_MATH_SYNC_APPROVAL,
      G6_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G6_BNU_MATH_LOWER_SYNC_APPROVAL,
      G4_BNU_MATH_IMPORT_APPROVAL,
      G3_BNU_MATH_LOWER_IMPORT_APPROVAL,
      G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      G5_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      G5_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      G4_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G3_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL,
      G3_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL,
      SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL,
      SHENZHEN_ENGLISH_SYNC_APPROVAL,
      G3_CHINESE_IMPORT_APPROVAL,
      G4_CHINESE_IMPORT_APPROVAL,
      G5_CHINESE_IMPORT_APPROVAL,
      G6_CHINESE_IMPORT_APPROVAL,
      G6_CHINESE_2019_IMPORT_APPROVAL,
      G6_CHINESE_2019_LOWER_IMPORT_APPROVAL,
      G5_CHINESE_LOWER_IMPORT_APPROVAL,
      G4_CHINESE_LOWER_IMPORT_APPROVAL,
      G3_CHINESE_LOWER_IMPORT_APPROVAL,
      G3_CHINESE_LOWER_SYNC_APPROVAL,
      G3_BNU_MATH_SYNC_APPROVAL,
      G3_CHINESE_SYNC_APPROVAL,
    ].includes(String(record.releaseApprovalId)),
  )
}
