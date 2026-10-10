import { G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID } from './grade-4/english-shanghai-upper-2022'
import { G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID } from './grade-5/english-shanghai-lower'
import { G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID } from './grade-6/english-shanghai-lower'
import { G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID } from './grade-6/english-shanghai-upper-2022'
import { G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID } from './grade-5/english-shanghai-upper-2022'
import { G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID } from './grade-4/english-shanghai-lower-2022'
import { G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID } from './grade-3/english-shanghai-lower-2022'
import { G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID } from './grade-3/english-shanghai-upper-2022'
import { G6_BNU_MATH_S2_TEXTBOOK_ID } from './grade-6/math-bnu-lower-2013'
import { G6_BNU_MATH_S1_TEXTBOOK_ID } from './grade-6/math-bnu-upper-2022'
import { G5_BNU_MATH_S2_TEXTBOOK_ID } from './grade-5/math-bnu-lower-2013'
import { G5_BNU_MATH_S1_TEXTBOOK_ID } from './grade-5/math-bnu-upper'
import { G4_BNU_MATH_S2_TEXTBOOK_ID } from './grade-4/math-bnu-lower'
import { G4_BNU_MATH_S1_TEXTBOOK_ID } from './grade-4/math-bnu-upper-2022'
import { G3_BNU_MATH_S2_TEXTBOOK_ID } from './grade-3/math-bnu-lower-2022'
import { G3_BNU_MATH_S1_TEXTBOOK_ID } from './grade-3/math-bnu-upper-2022'
import { G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID } from './grade-6/chinese-pep-lower-2019'
import { G5_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-5/chinese-pep-lower'
import { G5_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-5/chinese-pep-upper'
import { G6_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-6/chinese-pep-upper'
import { G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID } from './grade-6/chinese-pep-upper-2019'
import { G4_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-4/chinese-pep-lower'
import { G4_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-4/chinese-pep-upper'
import { G3_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-3/chinese-pep-lower'
import { G3_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-3/chinese-pep-upper'
import { G1_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-1/chinese-pep-upper'
import { G1_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-1/chinese-pep-lower'
import { G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID } from './grade-1/english-shanghai-upper'
import { G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID } from './grade-1/english-shanghai-lower'
import { G1_PEP_CHINESE_GRADE_ID } from './grade-1/chinese-pep-upper'
import { G2_PEP_CHINESE_GRADE_ID, G2_PEP_CHINESE_S1_TEXTBOOK_ID } from './grade-2/chinese-pep-upper'
import { G2_PEP_CHINESE_S2_TEXTBOOK_ID } from './grade-2/chinese-pep-lower'
import { G2_REVISED_CHINESE_TEXTBOOK_ID } from './grade-2/chinese-pep-lower-revised'
import { G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID } from './grade-2/shenzhen-english-lower'
import { G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID } from './grade-2/english-shanghai-upper'
import { G2_SHENZHEN_MATH_S1_TEXTBOOK_ID } from './grade-2/math-bnu-upper'
import { G1_SHENZHEN_MATH_S1_TEXTBOOK_ID } from './grade-1/math-bnu-upper'
import { G1_SHENZHEN_MATH_S2_TEXTBOOK_ID } from './grade-1/math-bnu-lower'
import { G2_BNU_MATH_S2_TEXTBOOK_IDS } from './grade-2/bnu-lower'

const CHINESE_PILOT_TEXTBOOK_IDS = new Set([
  G1_PEP_CHINESE_S1_TEXTBOOK_ID,
  G1_PEP_CHINESE_S2_TEXTBOOK_ID,
  G2_PEP_CHINESE_S1_TEXTBOOK_ID,
  G2_PEP_CHINESE_S2_TEXTBOOK_ID,
  G2_REVISED_CHINESE_TEXTBOOK_ID,
  G3_PEP_CHINESE_S1_TEXTBOOK_ID,
  G3_PEP_CHINESE_S2_TEXTBOOK_ID,
  G4_PEP_CHINESE_S1_TEXTBOOK_ID,
  G4_PEP_CHINESE_S2_TEXTBOOK_ID,
  G5_PEP_CHINESE_S1_TEXTBOOK_ID,
  G6_PEP_CHINESE_S1_TEXTBOOK_ID,
  G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID,
  G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID,
  G5_PEP_CHINESE_S2_TEXTBOOK_ID,
])

const CHINESE_PILOT_GRADE_IDS = new Set([
  G1_PEP_CHINESE_GRADE_ID,
  G2_PEP_CHINESE_GRADE_ID,
  'GRADE_3',
  'GRADE_4',
  'GRADE_5',
  'GRADE_6',
])

/** Locally entered PEP Chinese textbooks; selection is not region-restricted. */
export function isChinesePilotTextbook(textbookId: string | null | undefined): boolean {
  return textbookId ? CHINESE_PILOT_TEXTBOOK_IDS.has(textbookId) : false
}

/** Grades whose Chinese pilot only requires a Chinese textbook in onboarding. */
export function isChinesePilotGrade(gradeId: string | null | undefined): boolean {
  return gradeId ? CHINESE_PILOT_GRADE_IDS.has(gradeId) : false
}

const ENGLISH_PILOT_TEXTBOOK_IDS = new Set([
  G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  G3_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
  G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
  G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
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
    textbookId === G3_BNU_MATH_S1_TEXTBOOK_ID ||
    textbookId === G4_BNU_MATH_S2_TEXTBOOK_ID ||
    textbookId === G5_BNU_MATH_S1_TEXTBOOK_ID ||
    textbookId === G5_BNU_MATH_S2_TEXTBOOK_ID ||
    textbookId === G6_BNU_MATH_S1_TEXTBOOK_ID ||
    textbookId === G6_BNU_MATH_S2_TEXTBOOK_ID ||
    textbookId === G4_BNU_MATH_S1_TEXTBOOK_ID ||
    textbookId === G3_BNU_MATH_S2_TEXTBOOK_ID ||
    textbookId === G2_SHENZHEN_MATH_S1_TEXTBOOK_ID ||
    textbookId === G1_SHENZHEN_MATH_S1_TEXTBOOK_ID ||
    textbookId === G1_SHENZHEN_MATH_S2_TEXTBOOK_ID ||
    G2_BNU_MATH_S2_TEXTBOOK_IDS.some((id) => id === textbookId)
  )
}
