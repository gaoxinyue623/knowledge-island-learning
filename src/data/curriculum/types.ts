import type { ContentSource, Id, QuestionAnswerRule, QuestionBase, QuestionOption } from '@/types'

/**
 * SAMPLE records are deliberately richer than the domain interfaces so the
 * development data can be blocked from production publishing.
 */
export type SampleRecord<T> = T & {
  isSample: true
  needsVerification: true
  verificationStatus: 'SAMPLE'
}

export type SampleContentSource = ContentSource & {
  isSample: true
  needsVerification: true
  verificationStatus: 'SAMPLE'
}

export interface SampleQuestion extends QuestionBase {
  answerRule: QuestionAnswerRule
  options?: QuestionOption[]
  draggableItems?: Array<{ itemKey: string; label: string }>
  targets?: Array<{ targetKey: string; label: string }>
  subQuestionIds?: Id[]
  isSample: true
  verificationStatus: 'SAMPLE'
}

export interface SampleRecordStatus {
  isSample: boolean
  needsVerification: boolean
  status: string
}
