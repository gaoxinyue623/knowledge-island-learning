export type Id = string

export type StructuralStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export type ContentStatus =
  'DRAFT' | 'AI_GENERATED' | 'REVIEWED' | 'VERIFIED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'

export type VerificationStatus = 'SAMPLE' | 'UNVERIFIED' | 'VERIFIED' | 'REVIEWED' | 'REJECTED'

export interface VerificationMetadata {
  isSample: boolean
  needsVerification: boolean
  verificationStatus: VerificationStatus
}

export type SemesterCode = 'UPPER' | 'LOWER'
export type SubjectCode = 'CHINESE' | 'MATH' | 'ENGLISH'
export type RegionLevel = 'COUNTRY' | 'PROVINCE' | 'CITY' | 'DISTRICT'
export type RegionTextbookUsageType = 'DEFAULT' | 'SUPPORTED' | 'OPTIONAL'
export type DifficultyLevel = 'FOUNDATION' | 'STANDARD' | 'ADVANCED'

export interface Grade {
  id: Id
  code: string
  name: string
  sortOrder: number
  status: StructuralStatus
}

export interface Semester {
  id: Id
  code: SemesterCode
  name: string
  sortOrder: number
  status: StructuralStatus
}

export interface Subject {
  id: Id
  code: SubjectCode
  name: string
  themeKey: string
  status: StructuralStatus
}

export interface Region {
  id: Id
  code: string
  name: string
  parentRegionId?: Id
  level: RegionLevel
  status: StructuralStatus
  verificationStatus?: VerificationStatus
}

export interface Publisher {
  id: Id
  /** Stable catalog code when an authoritative source provides one. */
  code?: string
  name: string
  shortName?: string
  officialName: string
  status: StructuralStatus
  sourceId: Id
  needsVerification: boolean
  verificationStatus?: VerificationStatus
}

export type ContentSourceType =
  | 'TEXTBOOK'
  | 'CURRICULUM_STANDARD'
  | 'TEACHER_CREATED'
  | 'AI_GENERATED'
  | 'PUBLIC_RESOURCE'
  | 'LICENSED_RESOURCE'

export type SourceCopyrightStatus = 'UNKNOWN' | 'PENDING' | 'CLEARED' | 'RESTRICTED'

export interface ContentSource {
  id: Id
  sourceType: ContentSourceType
  title: string
  publisher?: string
  edition?: string
  sourceRef?: string
  sourceVersion?: string
  copyrightStatus: SourceCopyrightStatus
  license?: string
  attribution?: string
  verifiedAt?: string
  notes?: string
  verificationStatus?: VerificationStatus
}

export interface TextbookVersion {
  id: Id
  subjectId: Id
  gradeId: Id
  semesterId: Id
  publisherId: Id
  versionName: string
  editionYear?: string | number
  curriculumStandard?: string | Id
  sourceId: Id
  status: StructuralStatus
  needsVerification: boolean
  verificationStatus?: VerificationStatus
  createdAt: string
  updatedAt: string
}

export interface RegionTextbookRelation {
  id: Id
  regionId: Id
  textbookVersionId: Id
  usageType: RegionTextbookUsageType
  effectiveFrom: string
  effectiveTo?: string
  sourceId: Id
  status: StructuralStatus
  needsVerification: boolean
  verificationStatus?: VerificationStatus
}

export interface GradeScope {
  minGrade: number
  maxGrade: number
  explicitGradeIds?: Id[]
}

export interface Unit {
  id: Id
  textbookVersionId: Id
  code: string
  title: string
  subtitle?: string
  sortOrder: number
  sceneKey?: string
  status: StructuralStatus
  needsVerification: boolean
  sourceId: Id
  verificationStatus?: VerificationStatus
}

export interface Lesson {
  id: Id
  unitId: Id
  code: string
  title: string
  sortOrder: number
  status: StructuralStatus
  needsVerification: boolean
  sourceId: Id
  verificationStatus?: VerificationStatus
}

export interface KnowledgePoint {
  id: Id
  code: string
  name: string
  subjectId: Id
  gradeScope: GradeScope
  description: string
  learningObjective: string[]
  abilityTags: string[]
  difficultyLevel: DifficultyLevel
  parentKnowledgePointId?: Id
  status: StructuralStatus
  needsVerification: boolean
  sourceId: Id
  verificationStatus?: VerificationStatus
}

export type LessonKnowledgePointRelationType = 'CORE' | 'RELATED' | 'REVIEW' | 'EXTENSION'

export interface LessonKnowledgePointRelation {
  id: Id
  lessonId: Id
  knowledgePointId: Id
  relationType: LessonKnowledgePointRelationType
  order: number
  isPrimary: boolean
  sourceId: Id
  needsVerification: boolean
  status: StructuralStatus
  verificationStatus?: VerificationStatus
}

export type KnowledgePrerequisiteRelationType = 'REQUIRED' | 'RECOMMENDED'

export interface KnowledgePrerequisite {
  id: Id
  prerequisiteKnowledgePointId: Id
  dependentKnowledgePointId: Id
  relationType: KnowledgePrerequisiteRelationType
  sourceId: Id
  status: 'DRAFT' | 'VERIFIED' | 'ARCHIVED'
  needsVerification: boolean
  verificationStatus?: VerificationStatus
}

export type ContentBlockType = 'TEXT' | 'RICH_TEXT' | 'IMAGE' | 'AUDIO' | 'FORMULA'

export interface ContentBlock {
  type: ContentBlockType
  text?: string
  mediaAssetId?: Id
  altText?: string
}

export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'ANIMATION' | 'SVG'
export type CopyrightStatus = 'UNKNOWN' | 'PENDING' | 'CLEARED' | 'RESTRICTED'

export interface MediaAsset {
  id: Id
  mediaType: MediaType
  storageKey: string
  url: string
  mimeType: string
  width: number | null
  height: number | null
  durationSeconds: number | null
  altText: string | null
  transcript: string | null
  sourceId: Id
  copyrightStatus: CopyrightStatus
  license: string | null
  status: StructuralStatus
  version: number
  needsVerification: boolean
  verificationStatus?: VerificationStatus
  createdAt: string
  updatedAt: string
}

export type CourseContentType = 'TEXTBOOK' | 'EXTENSION' | 'REVIEW' | 'CHALLENGE'
export type CourseContentFormat =
  'TEXT' | 'RICH_TEXT' | 'IMAGE' | 'AUDIO' | 'ANIMATION' | 'INTERACTIVE'

export interface MediaAssetRef {
  mediaAssetId: Id
  usageType: 'BODY' | 'ILLUSTRATION' | 'AUDIO' | 'ANIMATION' | 'REFERENCE'
  order: number
}

export interface CourseContent {
  id: Id
  knowledgePointId: Id
  title: string
  contentType: CourseContentType
  contentFormat: CourseContentFormat
  body: Record<string, unknown>
  media?: MediaAssetRef[]
  difficulty?: DifficultyLevel
  sourceId: Id
  needsVerification: boolean
  status: ContentStatus
  currentVersion: number
  isSample: boolean
  verificationStatus?: VerificationStatus
  createdAt: string
  updatedAt: string
}

export type QuestionType =
  | 'singleChoice'
  | 'multipleChoice'
  | 'fillBlank'
  | 'trueFalse'
  | 'dragDrop'
  | 'matching'
  | 'sorting'
  | 'typing'
  | 'listening'
  | 'calculation'
  | 'shortAnswer'
  | 'reading'
  | 'sentenceOrdering'
  | 'speaking'

export type QuestionContentType = 'TEXTBOOK' | 'EXTENSION' | 'REVIEW' | 'CHALLENGE'

export type QuestionMediaUsage =
  'STEM' | 'OPTION' | 'HINT' | 'EXPLANATION' | 'AUDIO_PROMPT' | 'PASSAGE' | 'REFERENCE'

export interface QuestionMedia {
  mediaAssetId: Id
  usageType: QuestionMediaUsage
  order: number
}

export interface QuestionOption {
  id: Id
  questionId: Id
  optionKey: string
  content: ContentBlock[]
  media?: QuestionMedia[]
  sortOrder: number
}

export interface QuestionHint {
  id: Id
  order: number
  trigger: 'ON_REQUEST' | 'AFTER_WRONG' | 'AFTER_REPEATED_WRONG'
  content: ContentBlock[]
}

export interface QuestionExplanation {
  summary: ContentBlock[]
  steps: ContentBlock[][]
  misconceptionTags?: string[]
}

export interface QuestionDragDropItem {
  itemKey: string
  content: ContentBlock[]
}

export interface QuestionDragDropTarget {
  targetKey: string
  content: ContentBlock[]
}

export interface QuestionMatchingItem {
  key: string
  content: ContentBlock[]
}

export interface QuestionSortingItem {
  itemKey: string
  content: ContentBlock[]
}

/** Sentence tokens intentionally remain a stable, plain-text structure. */
export interface QuestionSentenceToken {
  tokenKey: string
  text: string
  sortOrder: number
}

export interface QuestionBase {
  id: Id
  questionType: QuestionType
  stem: ContentBlock[]
  /**
   * Legacy compatibility field. New consumers must resolve the
   * QuestionKnowledgePoint relation instead of treating one question as
   * belonging to one knowledge point.
   */
  knowledgePointId?: Id
  difficulty: DifficultyLevel
  contentType: QuestionContentType
  sourceId: Id
  status: ContentStatus
  needsVerification: boolean
  estimatedSeconds: number
  tags: string[]
  media: QuestionMedia[]
  gradeId?: Id
  semesterId?: Id
  subjectId?: Id
  textbookVersionId?: Id
  snapshotAt?: string
  snapshotSource?: string
  questionVersion?: number
  hints: QuestionHint[]
  explanation: QuestionExplanation
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export interface SingleChoiceAnswerRule {
  ruleType: 'SINGLE_OPTION'
  correctOptionKey: string
}

export interface MultipleChoiceAnswerRule {
  ruleType: 'MULTIPLE_OPTIONS'
  correctOptionKeys: string[]
  selectionMode: 'EXACT_SET'
}

export interface FillBlankAnswerRule {
  ruleType: 'TEXT_BLANKS'
  blanks: Array<{
    blankId: string
    acceptedAnswers: string[]
    normalization?: 'NONE' | 'TRIM' | 'CASE_INSENSITIVE' | 'SIMPLIFIED_CHINESE'
  }>
}

export interface TrueFalseAnswerRule {
  ruleType: 'BOOLEAN'
  correctValue: boolean
}

export interface DragDropAnswerRule {
  ruleType: 'PLACEMENT'
  placements: Array<{ itemKey: string; targetKey: string }>
}

export interface MatchingAnswerRule {
  ruleType: 'PAIRS'
  pairs: Array<{ leftKey: string; rightKey: string }>
}

export interface SortingAnswerRule {
  ruleType: 'ORDERED_KEYS'
  orderedKeys: string[]
}

export interface TypingAnswerRule {
  ruleType: 'ACCEPTED_TEXT'
  acceptedAnswers: string[]
  normalization: 'NONE' | 'TRIM' | 'CASE_INSENSITIVE' | 'SIMPLIFIED_CHINESE'
}

export interface ListeningAnswerRule {
  ruleType: 'LISTENING_RESPONSE'
  acceptedOptionKeys?: string[]
  acceptedTexts?: string[]
  maxReplays?: number
}

export interface CalculationAnswerRule {
  ruleType: 'NUMERIC'
  value: number | string
  unit?: string
  tolerance?: number
}

export interface ReadingAnswerRule {
  ruleType: 'READING_SUB_QUESTIONS'
  subQuestionIds: Id[]
}

export interface SentenceOrderingAnswerRule {
  ruleType: 'ORDERED_TOKENS'
  orderedTokenKeys: string[]
}

export interface SpeakingAnswerRule {
  ruleType: 'SPEAKING_RUBRIC'
  referenceAudioMediaAssetId?: Id
  scoringMode: 'MANUAL_REVIEW' | 'FUTURE_SPEECH_API'
  rubric: string[]
}

export interface ShortAnswerAnswerRule {
  ruleType: 'MANUAL_REVIEW'
}

export type QuestionAnswerRule =
  | SingleChoiceAnswerRule
  | MultipleChoiceAnswerRule
  | FillBlankAnswerRule
  | TrueFalseAnswerRule
  | DragDropAnswerRule
  | MatchingAnswerRule
  | SortingAnswerRule
  | TypingAnswerRule
  | ListeningAnswerRule
  | CalculationAnswerRule
  | ReadingAnswerRule
  | SentenceOrderingAnswerRule
  | ShortAnswerAnswerRule
  | SpeakingAnswerRule

export interface Question extends QuestionBase {
  answerRule: QuestionAnswerRule
  options?: QuestionOption[]
  draggableItems?: QuestionDragDropItem[]
  targets?: QuestionDragDropTarget[]
  leftItems?: QuestionMatchingItem[]
  rightItems?: QuestionMatchingItem[]
  items?: QuestionSortingItem[]
  tokens?: QuestionSentenceToken[]
  subQuestionIds?: Id[]
}

export type QuestionKnowledgePointRelationType = 'PRIMARY' | 'SECONDARY'

/**
 * A question can cover more than one knowledge point. This relation is the
 * authoritative association consumed by Question Engine.
 */
export interface QuestionKnowledgePoint {
  id: Id
  questionId: Id
  knowledgePointId: Id
  relationType: QuestionKnowledgePointRelationType
  /** Normalized contribution weight; all mappings for one question sum to 1. */
  weight: number
  order: number
  isPrimary: boolean
  sourceId: Id
  status: StructuralStatus
  needsVerification: boolean
  isSample?: boolean
  verificationStatus?: VerificationStatus
}

export interface LearningMap {
  id: Id
  unitId: Id
  title: string
  themeKey: string
  status: StructuralStatus
  version: number
  sourceId?: Id
  verificationStatus?: VerificationStatus
}

export type MapNodeType =
  'START' | 'LESSON' | 'PRACTICE' | 'CHALLENGE' | 'REVIEW' | 'CHEST' | 'BOSS'

export interface MapNode {
  id: Id
  mapId: Id
  nodeType: MapNodeType
  title: string
  order: number
  position: Record<string, number>
  prerequisiteNodeIds?: Id[]
  knowledgePointIds?: Id[]
  contentIds?: Id[]
  questionPoolConfig?: Record<string, unknown>
  unlockRule: Record<string, unknown>
  completionRule: Record<string, unknown>
  perfectRule?: Record<string, unknown>
  rewardConfig: Record<string, unknown>
  status: StructuralStatus
  verificationStatus?: VerificationStatus
}

export interface StudentCurriculumProfile {
  studentId: Id
  regionId: Id
  gradeId: Id
  semesterId: Id
  chineseTextbookVersionId: Id | null
  mathTextbookVersionId: Id | null
  englishTextbookVersionId: Id | null
  confirmedAt: string | null
  source: 'USER_CONFIRMED' | 'SYSTEM_RECOMMENDED' | 'MANUAL_OVERRIDE'
}

export interface ResolveAvailableTextbooksInput {
  regionId: Id
  gradeId: Id
  semesterId: Id
}

export type TextbookResolutionStatus = 'AUTO_RESOLVED' | 'NEEDS_CONFIRMATION' | 'NOT_AVAILABLE'

export interface TextbookResolution {
  subjectId: Id
  recommendedTextbookId?: Id
  availableTextbooks: TextbookVersion[]
  resolutionStatus: TextbookResolutionStatus
}

export interface ResolveAvailableTextbooksOutput {
  chinese: TextbookResolution
  math: TextbookResolution
  english: TextbookResolution
}

export interface TextbookDisplay {
  textbook: TextbookVersion
  publisher: Publisher
}

export type MasteryEventType =
  | 'FIRST_CORRECT'
  | 'CORRECT'
  | 'CORRECT_AFTER_HINT'
  | 'WRONG'
  | 'REVIEW_CORRECT'
  | 'REVIEW_WRONG'
  | 'CHALLENGE_CORRECT'

/**
 * Legacy event contract retained for compatibility with the PHASE 2 data
 * model. PHASE 10 derives LearningEvidence from QuestionAttempt instead of
 * writing these events; no time-based mutation is attached to this model.
 */
export interface MasteryEvent {
  id: Id
  studentId: Id
  knowledgePointId: Id
  questionId?: Id
  mapNodeId?: Id
  eventType: MasteryEventType
  attemptId: Id
  hintCount: number
  occurredAt: string
  metadata?: Record<string, unknown>
}

/**
 * Legacy read model retained for migration compatibility. New PHASE 10
 * consumers use MasteryRecord from mastery.ts.
 */
export interface KnowledgeMastery {
  id: Id
  studentId: Id
  knowledgePointId: Id
  masteryScore: number
  totalAttempts: number
  correctCount: number
  firstCorrectCount: number
  hintCount: number
  wrongCount: number
  algorithmVersion: string
  lastLearnedAt?: string
  updatedAt: string
}

export interface KnowledgeEnergy {
  id: Id
  studentId: Id
  knowledgePointId: Id
  energy: number
  lastReviewAt?: string
  nextReviewAt?: string
  decayStage: number
  reviewIntervalStage: number
  updatedAt: string
}
