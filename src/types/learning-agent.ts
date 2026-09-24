import type { QuestionGenerationTelemetry } from './llm'
import type { MathQuestionConstraints } from '@/services/learning-agent/mathConstraints'
import type {
  ContentBlock,
  DailyLearningPlan,
  ExerciseTemplate,
  KnowledgePoint,
  LearningEvidence,
  LearningHistoryRecord,
  LearningRecommendation,
  MasteryRecord,
  Question,
  QuestionAttempt,
  QuestionAnswerDraft,
  QuestionKnowledgePoint,
  QuestionSession,
  ReviewQueueItem,
  StudentCurriculumProfile,
  WrongQuestionRecord,
  RegionTextbookRelation,
  StrategyMapNode,
  KnowledgeRelation,
  LearningMapProgressRecord,
} from '@/types'
import type { DomainLearningMapSourceInput } from '@/services/learning-map/curriculumSource'

export type LearningAction =
  'NEXT' | 'REINFORCE' | 'REVIEW' | 'REMEDIATE' | 'CHALLENGE' | 'SIMPLIFY' | 'CONTINUE'
export type LearningErrorCode =
  | 'UNKNOWN'
  | 'CARELESS_ERROR'
  | 'CONCEPT_CONFUSION'
  | 'CALCULATION_ERROR'
  | 'BORROWING_ERROR'
  | 'CARRYING_ERROR'
  | 'PLACE_VALUE_ERROR'
  | 'UNIT_ERROR'
  | 'FORMULA_ERROR'
  | 'READING_COMPREHENSION_ERROR'
  | 'INCOMPLETE_REASONING'
export interface LearningErrorPattern {
  domain: 'GENERAL' | KnowledgePoint['subjectId']
  category: string
  code: LearningErrorCode | (string & {})
  confidence: number
}
export interface KnowledgePointLearningState {
  knowledgePointId: string
  /** Projection only: authoritative MasteryRecord score / 100. */
  masteryScore: number
  attemptCount: number
  correctCount: number
  incorrectCount: number
  correctRate: number
  recentCorrectRate: number
  consecutiveCorrect: number
  consecutiveIncorrect: number
  lastStudiedAt?: string
  weaknessSignals: string[]
  errorPatterns: LearningErrorPattern[]
  confidence: number
}
export interface StudentKnowledgeState {
  profileId: string
  textbookId: string
  knowledgePoints: KnowledgePointLearningState[]
  strongestKnowledgePoints: string[]
  weakestKnowledgePoints: string[]
  reviewCandidates: string[]
  remediationCandidates: string[]
  challengeCandidates: string[]
  generatedAt: string
}
export interface AgentCurriculumContext {
  regionId: string
  grade: string
  semester: string
  subject: DomainLearningMapSourceInput['subject']['code']
  subjectId: string
  publisher: string
  textbookId: string
}
/** Existing facts, supplied by a read-only repository adapter or an isolated simulation. */
export interface LearningAgentSnapshot {
  profile: StudentCurriculumProfile
  curriculum: DomainLearningMapSourceInput
  regionTextbookRelations: RegionTextbookRelation[]
  dataset: 'profile' | 'demo'
  progress: LearningMapProgressRecord[]
  masteryRecords: MasteryRecord[]
  sessions: QuestionSession[]
  evidence: LearningEvidence[]
  questions: Question[]
  mappings: QuestionKnowledgePoint[]
  wrongBook: WrongQuestionRecord[]
  reviewQueue: ReviewQueueItem[]
  history: LearningHistoryRecord[]
  dailyPlan: DailyLearningPlan | null
  currentKnowledgePointId?: string
  templates: ExerciseTemplate[]
}
export interface LearningAgentContext {
  profileId: string
  curriculum: AgentCurriculumContext
  dataset: LearningAgentSnapshot['dataset']
  currentLearning: { unitId: string; lessonId: string; knowledgePointId: string }
  knowledgeState: StudentKnowledgeState
  recentAttempts: QuestionAttempt[]
  recentLearningEvidence: LearningEvidence[]
  wrongBookSummary: WrongQuestionRecord[]
  reviewQueueSummary: ReviewQueueItem[]
  learningHistorySummary: LearningHistoryRecord[]
  strategyRecommendations: LearningRecommendation
  dailyPlanContext: DailyLearningPlan | null
  mapNodes: StrategyMapNode[]
  knowledgeRelations: KnowledgeRelation[]
}
export interface LearningDecisionReason {
  code: string
  message: string
  evidenceType: 'MASTERY' | 'ATTEMPT' | 'REVIEW_QUEUE' | 'STRATEGY' | 'CURRICULUM'
  evidenceRef?: string
  weight?: number
}
export interface QuestionMix {
  directPractice: number
  variationPractice: number
  wrongQuestionVariation: number
  application: number
  review: number
}
export type SupplementKind =
  | 'CONCEPT_EXPLANATION'
  | 'EXAMPLE'
  | 'GUIDED_PRACTICE'
  | 'HINT'
  | 'SUMMARY'
  | 'REMEDIATION_EXPLANATION'
export interface LearningActivityPlan {
  activityType: 'LESSON' | 'PRACTICE' | 'REVIEW' | 'REMEDIATION' | 'CHALLENGE'
  knowledgePointIds: string[]
  estimatedQuestionCount: number
  difficulty: number
  questionMix: QuestionMix
  contentRequirements: SupplementKind[]
}
export interface LearningDecision {
  decisionId: string
  profileId: string
  textbookId: string
  action: LearningAction
  targetKnowledgePointId: string
  sourceKnowledgePointId?: string
  difficulty: number
  confidence: number
  reasons: LearningDecisionReason[]
  evidenceRefs: string[]
  recommendedActivity: LearningActivityPlan
  algorithmVersion: string
  createdAt: string
}
export interface LearningPlannerConfig {
  algorithmVersion: string
  lowMastery: number
  lowRecentRate: number
  consecutiveErrors: number
  prerequisiteThreshold: number
  nextMastery: number
  nextRecentRate: number
  challengeMastery: number
  challengeRecentRate: number
  minimumAttempts: number
  minimumConfidence: number
  recentWindow: number
  questionCount: number
  difficulty: Record<LearningAction, number>
}
export type GenerationValidationStatus =
  'GENERATED' | 'VALIDATING' | 'VALID' | 'INVALID' | 'REQUIRES_REVIEW'
export interface GenerationValidation {
  status: GenerationValidationStatus
  checks: Array<{
    stage: string
    status: 'PASS' | 'FAIL' | 'REQUIRES_REVIEW'
    code: string
    resourceId?: string
  }>
}
export interface GeneratorMetadata {
  provider: string
  model: string
  promptVersion: string
}
export interface QuestionGenerationRequest {
  requestId: string
  profileId: string
  curriculum: AgentCurriculumContext
  targetKnowledgePoints: string[]
  difficulty: number
  count: number
  allowedQuestionTypes: Question['questionType'][]
  constraints: {
    templateIds: string[]
    questionMix: QuestionMix
    maxTextLength: number
    math?: MathQuestionConstraints
  }
  weaknessSignals: string[]
  errorPatterns: LearningErrorPattern[]
  recentQuestionRefs: string[]
  avoidQuestionRefs: string[]
  generationReason: LearningDecisionReason[]
  seed: string
  createdAt: string
}
export interface GeneratedQuestionBatch {
  telemetry?: QuestionGenerationTelemetry
  batchId: string
  requestId: string
  questions: Question[]
  mappings: QuestionKnowledgePoint[]
  validation: GenerationValidation
  generator: GeneratorMetadata
  createdAt: string
}
export interface ContentGenerationRequest {
  requestId: string
  profileId: string
  curriculum: AgentCurriculumContext
  lessonId: string
  knowledgePointId: string
  difficulty: number
  kinds: SupplementKind[]
  seed: string
  createdAt: string
}
export interface GeneratedContentSupplement {
  id: string
  requestId: string
  sourceType: 'AI_GENERATED_SUPPLEMENT'
  curriculum: AgentCurriculumContext
  lessonId: string
  knowledgePointId: string
  difficulty: number
  blocks: ContentBlock[]
  kinds: SupplementKind[]
  generator: GeneratorMetadata
  promptVersion: string
  generatedAt: string
  validationStatus: GenerationValidationStatus
}
export type LearningContentSourceType =
  'CURRICULUM_CONTENT' | GeneratedContentSupplement['sourceType']
export interface AnswerAnalysisRequest {
  question: Question
  expectedAnswer: Question['answerRule']
  studentAnswer: QuestionAnswerDraft
  knowledgePoints: QuestionKnowledgePoint[]
  attemptContext: {
    profileId: string
    session: QuestionSession
    subject: AgentCurriculumContext['subject']
    dataset: LearningAgentSnapshot['dataset']
    /** Optional student-observed intermediate result; never inferred by the model. */
    working?: { tensResult: number; onesResult: number }
  }
}
export interface AnswerAnalysisResult {
  correct: boolean | null
  score: number | null
  status: 'correct' | 'incorrect' | 'manual_review_required'
  errorPatterns: LearningErrorPattern[]
  affectedKnowledgePoints: string[]
  confidence: number
  explanation: string
  evidence: LearningEvidence[]
}
export interface QuestionGeneratorProvider {
  generate(request: QuestionGenerationRequest): Promise<GeneratedQuestionBatch>
}
export interface ContentGeneratorProvider {
  generate(request: ContentGenerationRequest): Promise<GeneratedContentSupplement>
}
export interface AnswerAnalyzerProvider {
  analyze(request: AnswerAnalysisRequest): Promise<AnswerAnalysisResult>
}
export interface LearningAgentTrace {
  traceId: string
  events: Array<{ sequence: number; event: string; at: string; data: Record<string, unknown> }>
}
export interface LearningAgentResult {
  questionGeneration?: QuestionGenerationTelemetry
  status: 'READY' | 'BLOCKED'
  context: LearningAgentContext | null
  studentStateSummary: StudentKnowledgeState | null
  decision: LearningDecision | null
  activityPlan: LearningActivityPlan | null
  /** Only validated, displayable resources; rejected payloads are not exposed. */
  generatedResources: {
    questions: Question[]
    mappings: QuestionKnowledgePoint[]
    content: GeneratedContentSupplement[]
  }
  validation: GenerationValidation
  trace: LearningAgentTrace
}
export interface LearningAgentDecisionResult {
  /** A decision is ready for a caller to review; no generated resource is implied. */
  status: 'READY' | 'BLOCKED'
  context: LearningAgentContext | null
  studentStateSummary: StudentKnowledgeState | null
  decision: LearningDecision | null
  activityPlan: LearningActivityPlan | null
  validation: {
    status: 'VALID' | 'BLOCKED'
    checks: Array<{ stage: string; status: 'PASS' | 'FAIL'; code: string }>
  }
  trace: LearningAgentTrace
}
export interface LearningAgentSource {
  load(profileId: string, textbookId: string): Promise<LearningAgentSnapshot>
}
