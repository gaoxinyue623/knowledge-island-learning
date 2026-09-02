import type { ContentSource, Question, QuestionKnowledgePoint } from '@/types'

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

export interface SampleQuestion extends Question {
  isSample: true
  verificationStatus: 'SAMPLE'
}

export type SampleQuestionKnowledgePoint = SampleRecord<QuestionKnowledgePoint>

export interface SampleRecordStatus {
  isSample: boolean
  needsVerification: boolean
  status: string
}
