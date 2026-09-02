import type { ContentBlock, ContentStatus, Id, MediaType, VerificationStatus } from './domain'
import type { LessonLaunchContext } from './learning-map'

/**
 * LessonPlayer is a presentation and session layer. It deliberately does not
 * contain question, answer, scoring, or mastery concepts.
 */
export type LessonPlayerStatus =
  'idle' | 'loading' | 'ready' | 'completed' | 'empty' | 'error' | 'not_available'

export type LessonSessionStatus = 'not_started' | 'in_progress' | 'completed'

export type LessonStepType =
  'intro' | 'concept' | 'explanation' | 'example' | 'media' | 'interactive' | 'practice' | 'summary'

export interface LessonStep {
  id: Id
  type: LessonStepType
  title?: string
  contentBlockIds: Id[]
  estimatedSeconds?: number
  required: boolean
  sort: number
}

export interface LessonSession {
  id: Id
  textbookId: Id
  unitId: Id
  lessonId: Id
  knowledgePointId: Id
  status: LessonSessionStatus
  currentStepIndex: number
  completedStepIds: Id[]
  startedAt?: string
  updatedAt?: string
  completedAt?: string
}

export interface LessonContentInteractionItem {
  id: Id
  label: string
  description?: string
}

export type LessonContentInteractionKind =
  'TOGGLE' | 'REVEAL' | 'TIMER' | 'DRAG_OBSERVE' | 'STEP_DEMO' | 'ORDERING_DEMO'

/** Non-scoring interaction data. It cannot represent an answer or result. */
export interface LessonContentInteraction {
  kind: LessonContentInteractionKind
  prompt: string
  items?: LessonContentInteractionItem[]
  revealText?: string
  processSteps?: string[]
  durationSeconds?: number
}

/**
 * A semantic lesson block wraps the existing ContentBlock payload. The
 * wrapper supplies stable identity and presentation metadata without
 * creating a second atomic content protocol.
 */
export interface LessonContentBlockRecord {
  id: Id
  block: ContentBlock
  stepType: LessonStepType | string
  title?: string
  paragraphs?: string[]
  bullets?: string[]
  highlights?: string[]
  interaction?: LessonContentInteraction
  mediaAssetIds?: Id[]
  sort: number
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export interface LearningContent {
  id: Id
  lessonId: Id
  knowledgePointId: Id
  title: string
  learningGoals: string[]
  steps: LessonStep[]
  blocks: LessonContentBlockRecord[]
  sourceId: Id
  status: ContentStatus
  currentVersion: number
  isSample: boolean
  verificationStatus?: VerificationStatus
  contentStatus?: ContentStatus
  createdAt?: string
  updatedAt?: string
}

export interface LessonPlayerSource {
  context: LessonLaunchContext
  textbook: {
    id: Id
    title: string
  }
  unit: {
    id: Id
    title: string
  }
  lesson: {
    id: Id
    title: string
  }
  knowledgePoint: {
    id: Id
    name: string
    description?: string
  }
  mapping: {
    id: Id
    lessonId: Id
    knowledgePointId: Id
  }
  learningGoals: string[]
  steps: LessonStep[]
  blocks: LessonContentBlockRecord[]
  mediaAssets: LessonMediaAsset[]
  sourceId?: Id
  isSample: boolean
  verificationStatus?: VerificationStatus
  contentIsSample: boolean
  contentVerificationStatus?: VerificationStatus
  contentStatus?: ContentStatus
  isDemo?: boolean
}

export interface LessonMediaAsset {
  id: Id
  mediaType: MediaType
  url: string
  mimeType: string
  width: number | null
  height: number | null
  durationSeconds: number | null
  altText: string | null
  transcript: string | null
  isAvailable: boolean
}

export interface MediaViewModel extends LessonMediaAsset {
  fallbackText: string
}

export interface InteractiveContentViewModel {
  kind: LessonContentInteractionKind
  prompt: string
  items: LessonContentInteractionItem[]
  revealText?: string
  processSteps: string[]
  durationSeconds?: number
}

export interface LessonContentBlockViewModel {
  id: Id
  type: LessonStepType | string
  title?: string
  content?: string
  paragraphs?: string[]
  bullets?: string[]
  highlights?: string[]
  media?: MediaViewModel[]
  interaction?: InteractiveContentViewModel
  isSample: boolean
  verificationStatus?: VerificationStatus
  sort: number
}

export interface LessonStepViewModel extends LessonStep {
  contentBlocks: LessonContentBlockViewModel[]
  isCompleted: boolean
}

export interface LessonPlayerSessionViewModel {
  id: Id
  status: LessonSessionStatus
  currentStepIndex: number
  completedStepIds: Id[]
  completedCount: number
  totalCount: number
  progress: number
  startedAt?: string
  updatedAt?: string
  completedAt?: string
}

export interface LessonPlayerViewModel {
  context: LessonLaunchContext
  textbook: { id: Id; title: string }
  unit: { id: Id; title: string }
  lesson: { id: Id; title: string }
  knowledgePoint: { id: Id; name: string; description?: string }
  learningGoals: string[]
  steps: LessonStepViewModel[]
  currentStepIndex: number
  currentStep?: LessonStepViewModel
  session: LessonPlayerSessionViewModel
  status: LessonPlayerStatus
  flags: {
    isSample: boolean
    isUnverified: boolean
    isDemo: boolean
    isContentAvailable: boolean
  }
  diagnostics: string[]
}

export type LessonPlayerDataset = 'profile' | 'golden' | 'demo'

export type LessonPlayerDemoState =
  'full' | 'empty' | 'error' | 'not_available' | 'sample' | 'unverified' | 'completed' | 'resume'

export type LessonPlayerLoadIssue =
  'INVALID_CONTEXT' | 'CONTENT_NOT_AVAILABLE' | 'CONTENT_EMPTY' | 'NOT_AVAILABLE' | 'ERROR'

export interface LessonPlayerLoadResult {
  source: LessonPlayerSource | null
  issue?: LessonPlayerLoadIssue
  message?: string
}

export interface LessonLaunchContextValidation {
  valid: boolean
  code?: 'INVALID_CONTEXT'
  issues: string[]
}

export interface LessonSessionStoragePayload {
  schemaVersion: 1
  sessions: LessonSession[]
}

export interface LessonSessionOwnerOptions {
  studentId?: Id
}

export interface LessonPlayerLoadOptions extends LessonSessionOwnerOptions {
  dataset?: LessonPlayerDataset
  demoState?: LessonPlayerDemoState
}

export interface LessonContentRepository {
  getByKnowledgePoint(knowledgePointId: Id): Promise<LearningContent | null>
}

export interface LessonPlayerRepository {
  getLessonPlayerSource(
    context: LessonLaunchContext,
    dataset?: LessonPlayerDataset,
    options?: Pick<LessonPlayerLoadOptions, 'demoState'>,
  ): Promise<LessonPlayerLoadResult>
}

export interface LessonPlayerAdapterOptions {
  status?: LessonPlayerStatus
  diagnostics?: string[]
}

export interface LessonCompletionMapOptions {
  dataset?: LessonPlayerDataset
}
