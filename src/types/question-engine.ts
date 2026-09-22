import type { LearningErrorPattern } from './learning-agent'
import type {
  ContentBlock,
  Id,
  Question,
  QuestionExplanation,
  QuestionHint,
  QuestionKnowledgePoint,
  QuestionMedia,
  QuestionOption,
  QuestionType,
  VerificationStatus,
} from './domain'

export type AssessmentSource = 'lesson_practice' | 'wrong_book' | 'dev'

export interface AssessmentLaunchContext {
  textbookId: Id
  unitId: Id
  lessonId: Id
  knowledgePointId: Id
  source: AssessmentSource
}

export type AssessmentMode = 'practice'

export interface AssessmentDefinition {
  id: Id
  knowledgePointId: Id
  questionIds: Id[]
  mode: AssessmentMode
}

export type QuestionSessionStatus = 'not_started' | 'in_progress' | 'completed'

export type QuestionAnswerDraft =
  | { type: 'singleChoice'; optionId?: Id }
  | { type: 'multipleChoice'; optionIds: Id[] }
  | { type: 'trueFalse'; value?: boolean }
  | { type: 'fillBlank'; values: string[] }
  | { type: 'calculation'; value: string }
  | { type: 'shortAnswer'; value: string }

export type QuestionAttemptStatus = 'correct' | 'incorrect' | 'manual_review_required'

export interface QuestionAttemptResult {
  status: QuestionAttemptStatus
  score: number
  maxScore: number
  feedback?: string
}

export interface QuestionAttempt {
  /** Optional deterministic analysis, separate from grading and mastery. */
  errorPatterns?: LearningErrorPattern[]
  questionId: Id
  answer: QuestionAnswerDraft
  submitted: boolean
  result?: QuestionAttemptResult
  submittedAt?: string
  questionVersion?: number
}

export interface QuestionSession {
  id: Id
  assessmentId: Id
  textbookId: Id
  unitId: Id
  lessonId: Id
  knowledgePointId: Id
  questionIds: Id[]
  currentQuestionIndex: number
  status: QuestionSessionStatus
  attempts: QuestionAttempt[]
  startedAt?: string
  updatedAt?: string
  completedAt?: string
}

export interface QuestionOptionViewModel extends QuestionOption {
  isSelected: boolean
  isCorrect?: boolean
}

export interface QuestionMediaViewModel extends QuestionMedia {
  url?: string
  mimeType?: string
  mediaType?: string
  altText?: string | null
  transcript?: string | null
  isAvailable: boolean
}

export interface QuestionViewModel {
  id: Id
  type: QuestionType
  stem: ContentBlock[]
  options: QuestionOptionViewModel[]
  media: QuestionMediaViewModel[]
  answerDraft: QuestionAnswerDraft
  submitted: boolean
  result?: QuestionAttemptResult
  explanation: QuestionExplanation
  hints: QuestionHint[]
  correctAnswerText?: string
  isSample: boolean
  verificationStatus?: VerificationStatus
  questionVersion?: number
}

export interface AssessmentResultSummary {
  totalQuestions: number
  submittedQuestions: number
  correctCount: number
  incorrectCount: number
  manualReviewCount: number
  score: number
  maxScore: number
  percentage: number | null
  scorableQuestions: number
}

export type QuestionEngineStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'not_available'
  | 'invalid_context'
  | 'unsupported_question'
  | 'error'
  | 'completed'

export type QuestionEngineDataset = 'profile' | 'demo' | 'golden'

export type QuestionEngineDemoState =
  'full' | 'empty' | 'error' | 'not_available' | 'sample' | 'unverified' | 'completed' | 'resume'

export type QuestionEngineLoadIssue =
  | 'INVALID_CONTEXT'
  | 'QUESTION_EMPTY'
  | 'QUESTION_NOT_AVAILABLE'
  | 'UNSUPPORTED_QUESTION'
  | 'NOT_AVAILABLE'
  | 'ERROR'

export interface QuestionEngineFlags {
  isSample: boolean
  isUnverified: boolean
  isDemo: boolean
}

export interface QuestionEngineSessionViewModel {
  id: Id
  status: QuestionSessionStatus
  currentQuestionIndex: number
  answeredCount: number
  totalQuestions: number
  progress: number
}

export interface QuestionEngineViewModel {
  context: AssessmentLaunchContext
  definition: AssessmentDefinition
  session: QuestionEngineSessionViewModel
  currentQuestion: QuestionViewModel | null
  resultSummary?: AssessmentResultSummary
  flags: QuestionEngineFlags
  status: QuestionEngineStatus
  diagnostics: string[]
}

export interface QuestionEngineLoadResult {
  definition: AssessmentDefinition | null
  questions: Question[]
  questionKnowledgePoints?: QuestionKnowledgePoint[]
  issue?: QuestionEngineLoadIssue
  message?: string
  flags?: QuestionEngineFlags
  diagnostics?: string[]
}

export interface QuestionEngineLoadOptions {
  dataset?: QuestionEngineDataset
  demoState?: QuestionEngineDemoState
  studentId?: Id
  /** Optional stable discriminator for a new review session. */
  sessionScope?: Id
  /** Optional question to focus when launching a review session. */
  initialQuestionId?: Id
  /** Optional single-question scope used by a WrongBook retry session. */
  reviewQuestionId?: Id
}

export interface QuestionEngineContextValidation {
  valid: boolean
  code?: 'INVALID_CONTEXT'
  issues: string[]
}
