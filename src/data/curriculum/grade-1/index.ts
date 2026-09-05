export * from './chinese-pep-upper'
export * from './chinese-pep-lower'
export * from './english-shanghai-upper'
export * from './english-shanghai-lower'

import { G1_PEP_CHINESE_S1_TEXTBOOK_ID } from './chinese-pep-upper'
import { G1_PEP_CHINESE_S2_TEXTBOOK_ID } from './chinese-pep-lower'

/** User-facing Grade 1 PEP Chinese pilot textbooks (upper and lower volumes). */
export function isG1PepChinesePilotTextbook(textbookId: string | null | undefined): boolean {
  return (
    textbookId === G1_PEP_CHINESE_S1_TEXTBOOK_ID || textbookId === G1_PEP_CHINESE_S2_TEXTBOOK_ID
  )
}
