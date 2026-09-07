import { G1_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-1/chinese-pep-upper'
import { G1_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-1/chinese-pep-lower'
import { G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID } from './grade-1/english-shanghai-upper'
import { G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID } from './grade-1/english-shanghai-lower'
import { G1_PEP_CHINESE_GRADE_ID } from './grade-1/chinese-pep-upper'
import { G2_PEP_CHINESE_GRADE_ID, G2_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-2/chinese-pep-upper'
import { G2_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-2/chinese-pep-lower'
import { G2_REVISED_CHINESE_TEXTBOOK_ID } from './grade-2/chinese-pep-lower-revised'
import { G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID } from './grade-2/english-shanghai-upper'
import { G2_SHENZHEN_MATH_S1_TEXTBOOK_ID } from './grade-2/math-bnu-upper'
import { G1_SHENZHEN_MATH_S1_TEXTBOOK_ID } from './grade-1/math-bnu-upper'
import { G1_SHENZHEN_MATH_S2_TEXTBOOK_ID } from './grade-1/math-bnu-lower'

const CHINESE_PILOT_TEXTBOOK_IDS = new Set([
  G1_PEP_CHINESE_S1_TEXTBOOK_ID,
  G1_PEP_CHINESE_S2_TEXTBOOK_ID,
  G2_PEP_CHINESE_S1_TEXTBOOK_ID,
  G2_PEP_CHINESE_S2_TEXTBOOK_ID,
  G2_REVISED_CHINESE_TEXTBOOK_ID,
])

const CHINESE_PILOT_GRADE_IDS = new Set([G1_PEP_CHINESE_GRADE_ID, G2_PEP_CHINESE_GRADE_ID])

/** Locally entered PEP Chinese textbooks; selection is not region-restricted. */
export function isChinesePilotTextbook(textbookId: string | null | undefined): boolean {
  return textbookId ? CHINESE_PILOT_TEXTBOOK_IDS.has(textbookId) : false
}

/** Grades whose Chinese pilot only requires a Chinese textbook in onboarding. */
export function isChinesePilotGrade(gradeId: string | null | undefined): boolean {
  return gradeId ? CHINESE_PILOT_GRADE_IDS.has(gradeId) : false
}

const ENGLISH_PILOT_TEXTBOOK_IDS = new Set([
  G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
  G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
])

/** User-facing Shenzhen Shanghai-English pilot textbooks. */
export function isEnglishPilotTextbook(textbookId: string | null | undefined): boolean {
  return textbookId ? ENGLISH_PILOT_TEXTBOOK_IDS.has(textbookId) : false
}

/** All locally entered pilot textbooks that use clean user-facing copy. */
export function isPilotTextbook(textbookId: string | null | undefined): boolean {
  return (
    isChinesePilotTextbook(textbookId) ||
    isEnglishPilotTextbook(textbookId) ||
    isMathPilotTextbook(textbookId)
  )
}

export function isMathPilotTextbook(textbookId: string | null | undefined): boolean {
  return (
    textbookId === G2_SHENZHEN_MATH_S1_TEXTBOOK_ID ||
    textbookId === G1_SHENZHEN_MATH_S1_TEXTBOOK_ID ||
    textbookId === G1_SHENZHEN_MATH_S2_TEXTBOOK_ID
  )
}
