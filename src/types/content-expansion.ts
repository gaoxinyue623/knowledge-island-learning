import type { Id, VerificationStatus } from './domain'
import type { LearningContent } from './lesson-player'

/** Small, serializable content tree used by generated exercise prompts. */
export interface StructuredContent {
  blocks: Array<{
    type: 'text' | 'formula' | 'hint'
    value: string
  }>
}

export type ActivityDifficulty = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export type InteractiveActivityType =
  | 'drag_classify'
  | 'drag_match'
  | 'sort_order'
  | 'number_line'
  | 'build_object'
  | 'select_region'
  | 'connect_pairs'
  | 'fill_container'
  | 'simulation'
  | 'step_operation'
  | 'observe_discover'
  | 'timed_challenge'

export type SupportedInteractiveActivityType =
  'drag_match' | 'drag_classify' | 'sort_order' | 'number_line' | 'select_region' | 'simulation'

export type ActivityStatus = 'idle' | 'in_progress' | 'completed' | 'unsupported' | 'error'

export type ActivityCompletionPolicy = 'all_items' | 'target_reached' | 'manual_check'

export interface DragMatchConfig {
  sources: Array<{ id: string; label?: string; imageKey?: string }>
  targets: Array<{ id: string; label?: string; imageKey?: string }>
  matches: Array<{ sourceId: string; targetId: string }>
}

export interface DragClassifyConfig {
  items: Array<{ id: string; label: string }>
  groups: Array<{ id: string; label: string }>
  answers: Array<{ itemId: string; groupId: string }>
}

export interface SortOrderConfig {
  items: Array<{ id: string; label: string }>
  correctOrder: string[]
}

export interface NumberLineConfig {
  min: number
  max: number
  start: number
  operations: Array<{ direction: 'forward' | 'backward'; steps: number }>
  target: number
}

export interface SelectRegionConfig {
  assetKey: string
  coordinateSystem: 'normalized'
  regions: Array<{
    id: string
    label?: string
    x: number
    y: number
    width: number
    height: number
  }>
  targetRegionIds: string[]
}

export type SimulationConfig =
  | {
      templateKey: 'number_line_walk'
      parameters: { min: number; max: number; start: number; target: number }
    }
  | {
      templateKey: 'shape_builder'
      parameters: {
        targetShape: 'circle' | 'triangle' | 'square' | 'rectangle'
        availablePieces: number
      }
    }
  | {
      templateKey: 'compare_towers'
      parameters: { leftCount: number; rightCount: number; target: 'left' | 'right' | 'same' }
    }

export interface BuildObjectConfig {
  pieces: Array<{ id: string; label: string }>
  targetDescription: string
}

export interface ConnectPairsConfig {
  left: Array<{ id: string; label: string }>
  right: Array<{ id: string; label: string }>
  connections: Array<{ leftId: string; rightId: string }>
}

export interface FillContainerConfig {
  itemLabel: string
  capacity: number
  targetCount: number
}

export interface StepOperationConfig {
  steps: Array<{ id: string; label: string }>
  correctOrder: string[]
}

export interface ObserveDiscoverConfig {
  observation: string
  question: string
}

export interface TimedChallengeConfig {
  timeLimitSeconds: number
  prompt: string
}

export type InteractiveActivityConfig =
  | DragClassifyConfig
  | DragMatchConfig
  | SortOrderConfig
  | NumberLineConfig
  | BuildObjectConfig
  | SelectRegionConfig
  | ConnectPairsConfig
  | FillContainerConfig
  | SimulationConfig
  | StepOperationConfig
  | ObserveDiscoverConfig
  | TimedChallengeConfig

export type InteractiveActivity = {
  [T in InteractiveActivityType]: {
    id: Id
    knowledgePointId: Id
    activityType: T
    title: string
    instruction: string
    difficulty: ActivityDifficulty
    config: T extends 'drag_classify'
      ? DragClassifyConfig
      : T extends 'drag_match'
        ? DragMatchConfig
        : T extends 'sort_order'
          ? SortOrderConfig
          : T extends 'number_line'
            ? NumberLineConfig
            : T extends 'build_object'
              ? BuildObjectConfig
              : T extends 'select_region'
                ? SelectRegionConfig
                : T extends 'connect_pairs'
                  ? ConnectPairsConfig
                  : T extends 'fill_container'
                    ? FillContainerConfig
                    : T extends 'simulation'
                      ? SimulationConfig
                      : T extends 'step_operation'
                        ? StepOperationConfig
                        : T extends 'observe_discover'
                          ? ObserveDiscoverConfig
                          : TimedChallengeConfig
    learningGoal: string
    completionPolicy: ActivityCompletionPolicy
    sourceId: Id
    verificationStatus: VerificationStatus
    isSample: boolean
    sort: number
  }
}[InteractiveActivityType]

export interface ActivityResult {
  activityId: Id
  status: Extract<ActivityStatus, 'completed' | 'unsupported' | 'error'>
  attempts: number
  completedAt?: string
}

export interface ActivityProgress {
  profileId: Id
  activityId: Id
  status: ActivityStatus
  attempts: number
  updatedAt: string
  completedAt?: string
}

export interface ActivityProgressStoragePayload {
  schemaVersion: 1
  progress: ActivityProgress[]
}

export type ExerciseTemplateType =
  | 'addition_range'
  | 'subtraction_range'
  | 'compare_numbers'
  | 'missing_number'
  | 'number_order'
  | 'picture_count'
  | 'word_problem_simple'
  | 'equation_match'

export interface AdditionRangeConfig {
  minAddend: number
  maxAddend: number
  maxResult: number
  allowZero: boolean
  noCarry: boolean
  noDuplicatePair: boolean
}

export interface SubtractionRangeConfig {
  minMinuend: number
  maxMinuend: number
  minSubtrahend: number
  maxSubtrahend: number
  allowZero: boolean
  nonNegative: boolean
  noDuplicatePair: boolean
}

export interface CompareNumbersConfig {
  min: number
  max: number
  allowEqual: boolean
}

export interface MissingNumberConfig {
  operation: 'addition' | 'subtraction'
  min: number
  max: number
  maxResult: number
  excludeZero: boolean
}

export interface NumberOrderConfig {
  min: number
  max: number
  count: number
  direction: 'ascending' | 'descending'
}

export interface PictureCountConfig {
  minCount: number
  maxCount: number
  objectLabels: string[]
}

export interface WordProblemSimpleConfig {
  operation: 'addition' | 'subtraction'
  maxResult: number
  contexts: Array<{ subject: string; verb: '来了' | '走了' | '又有' | '还剩' }>
}

export interface EquationMatchConfig {
  maxNumber: number
  optionsPerQuestion: number
  operation: 'addition' | 'subtraction'
}

export type ExerciseTemplateConfig =
  | AdditionRangeConfig
  | SubtractionRangeConfig
  | CompareNumbersConfig
  | MissingNumberConfig
  | NumberOrderConfig
  | PictureCountConfig
  | WordProblemSimpleConfig
  | EquationMatchConfig

export type ExerciseTemplate = {
  [T in ExerciseTemplateType]: {
    id: Id
    knowledgePointId: Id
    templateType: T
    difficulty: ActivityDifficulty
    config: T extends 'addition_range'
      ? AdditionRangeConfig
      : T extends 'subtraction_range'
        ? SubtractionRangeConfig
        : T extends 'compare_numbers'
          ? CompareNumbersConfig
          : T extends 'missing_number'
            ? MissingNumberConfig
            : T extends 'number_order'
              ? NumberOrderConfig
              : T extends 'picture_count'
                ? PictureCountConfig
                : T extends 'word_problem_simple'
                  ? WordProblemSimpleConfig
                  : EquationMatchConfig
    sourceId: Id
    verificationStatus: VerificationStatus
    isSample: boolean
    version: number
  }
}[ExerciseTemplateType]

export type AnswerSpec =
  | { kind: 'numeric'; value: number }
  | { kind: 'text'; acceptedAnswers: string[] }
  | { kind: 'choice'; options: Array<{ key: string; label: string }>; correctKey: string }
  | { kind: 'ordered'; correctOrder: string[] }

export interface ExerciseDerivation {
  operator?: 'addition' | 'subtraction' | 'comparison' | 'ordering' | 'counting'
  operands?: number[]
  result?: number
}

export interface ExerciseInstance {
  id: Id
  templateId: Id
  seed: string
  index: number
  prompt: StructuredContent
  answerSpec: AnswerSpec
  explanation?: StructuredContent
  difficulty: ActivityDifficulty
  knowledgePointId: Id
  isSample: boolean
  verificationStatus: VerificationStatus
  derivation?: ExerciseDerivation
}

export interface GeneratedQuestionProvenance {
  marker: 'GENERATED_FROM_VERIFIED_TEMPLATE'
  templateId: Id
  seed: string
  index: number
}

export type PracticeMode = 'basic' | 'reinforce' | 'application'

export interface DifficultyRange {
  min: ActivityDifficulty
  max: ActivityDifficulty
}

export interface PracticeSet {
  id: Id
  knowledgePointId: Id
  title: string
  mode: PracticeMode
  templateIds: Id[]
  fixedQuestionIds?: Id[]
  targetCount: number
  difficultyRange: DifficultyRange
  sourceId: Id
  verificationStatus: VerificationStatus
  isSample: boolean
}

export interface ExtensionActivity {
  id: Id
  knowledgePointId: Id
  title: string
  instruction: string
  content: StructuredContent
  /** Optional self-authored reference thinking shown after a child submits. */
  referenceAnswer?: string
  sourceId: Id
  verificationStatus: VerificationStatus
  isSample: boolean
}

export interface Challenge {
  id: Id
  knowledgePointId: Id
  title: string
  instruction: string
  content: StructuredContent
  /** Optional self-authored reference thinking shown after a child submits. */
  referenceAnswer?: string
  sourceId: Id
  verificationStatus: VerificationStatus
  isSample: boolean
}

export interface ContentExpansionBundle {
  knowledgePointId: Id
  textbookId: Id
  unitId: Id
  lessonId: Id
  learningContent: LearningContent
  activities: InteractiveActivity[]
  exerciseTemplates: ExerciseTemplate[]
  practiceSets: PracticeSet[]
  extensionActivities: ExtensionActivity[]
  challenges: Challenge[]
}

export type ContentExpansionDataset = 'profile' | 'golden' | 'candidate' | 'demo'
