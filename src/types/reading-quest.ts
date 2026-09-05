import type { InteractiveActivity, Question, VerificationStatus } from '@/types'

interface QuestStageBase {
  id: string
  title: string
  hint: string
  explanation: string
  visual?: MathQuestVisual
}

export type MathQuestVisual =
  | { type: 'place-value'; value: number }
  | { type: 'array'; rows: number; columns: number }
  | { type: 'ruler'; start: number; end: number; max: number }
  | { type: 'motion'; mode: 'translation' | 'rotation' | 'reflection' }
  | { type: 'route'; first: number; second: number; direct: number }

export interface QuestQuestionStage extends QuestStageBase {
  kind: 'question'
  question: Question
  tiles?: string[]
  tileMode?: 'word' | 'letters'
}

export interface QuestActivityStage extends QuestStageBase {
  kind: 'activity'
  activity: Extract<InteractiveActivity, { activityType: 'drag_match' | 'sort_order' }>
  sourceLabel?: string
  targetLabel?: string
}

export type ReadingQuestStage = QuestQuestionStage | QuestActivityStage

export interface ReadingQuest {
  id: string
  textbookId: string
  lessonId: string
  knowledgePointId: string
  sourceId: string
  isSample: boolean
  verificationStatus: VerificationStatus
  stages: ReadingQuestStage[]
  subject?: 'MATH'
}
