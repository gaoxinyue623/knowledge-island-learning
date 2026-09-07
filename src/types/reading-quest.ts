import type { InteractiveActivity, Question, VerificationStatus } from '@/types'

interface QuestStageBase {
  id: string
  title: string
  hint: string
  explanation: string
  visual?: MathQuestVisual
  trainingBand?: 'foundation' | 'reasoning' | 'transfer'
  context?: string
  hints?: string[]
}

export type SolidShape = 'cube' | 'cuboid' | 'cylinder' | 'sphere'
export type PlaneShape = 'square' | 'rectangle' | 'triangle' | 'circle' | 'parallelogram'

export type LowerMathQuestVisual =
  | { type: 'ten-bridge'; a: number; b: number; operation: 'add' | 'subtract' }
  | { type: 'abacus'; value: number; places: 2 | 3 }
  | { type: 'number-grid'; cells: (number | null)[] }
  | { type: 'column-calculation'; a: number; b: number; operation: 'add' | 'subtract' }
  | { type: 'plane-cards'; shapes: PlaneShape[]; rotated?: boolean }
  | { type: 'paper-change'; mode: 'stamp' | 'join' | 'fold' }
  | { type: 'tangram' }

export type EarlyMathQuestVisual =
  | { type: 'counters'; first: number; second?: number; removed?: number }
  | { type: 'part-whole'; total: number; known: number }
  | { type: 'queue'; labels: string[] }
  | { type: 'classification' }
  | { type: 'classroom' }
  | { type: 'solids'; shapes: SolidShape[] }

export type MathQuestVisual =
  | EarlyMathQuestVisual
  | LowerMathQuestVisual
  | { type: 'place-value'; value: number }
  | { type: 'array'; rows: number; columns: number }
  | { type: 'ruler'; start: number; end: number; max: number }
  | { type: 'motion'; mode: 'translation' | 'rotation' | 'reflection' }
  | { type: 'route'; first: number; second: number; direct: number }

export interface QuestQuestionStage extends QuestStageBase {
  kind: 'question'
  question: Question
  tiles?: string[]
  tileMode?: 'word' | 'letters' | 'characters' | 'sequence'
}

export interface QuestActivityStage extends QuestStageBase {
  kind: 'activity'
  activity: Extract<InteractiveActivity, { activityType: 'drag_match' | 'sort_order' }>
  sourceLabel?: string
  targetLabel?: string
}

export type ReadingQuestStage = QuestQuestionStage | QuestActivityStage

export interface ReadingPracticeQuest {
  id: string
  stages: ReadingQuestStage[]
  subject?: 'MATH'
  training?: { variantIndex: number; variantCount: number }
}

export interface ReadingQuest extends ReadingPracticeQuest {
  textbookId: string
  lessonId: string
  knowledgePointId: string
  sourceId: string
  isSample: boolean
  verificationStatus: VerificationStatus
}
