import type {
  ContentGeneratorProvider,
  LearningAgentResult,
  LearningAgentSource,
  LearningPlannerConfig,
  QuestionGeneratorProvider,
} from '@/types/learning-agent'
import { buildAgentContext } from './contextBuilder'
import { LearningPlanner } from './learningPlanner'
import {
  buildGenerationRequests,
  ContentGenerationService,
  QuestionGenerationService,
} from './generationServices'
import { MockContentGenerator, MockQuestionGenerator } from './generators'
import { DEFAULT_LEARNING_PLANNER_CONFIG, stableId } from './plannerConfig'
import { finishValidation } from './generatedQuestionValidator'

export interface LearningOrchestratorOptions {
  now?: string
  seed?: string
  questionProvider?: QuestionGeneratorProvider
  contentProvider?: ContentGeneratorProvider
  config?: LearningPlannerConfig
}
/** Coordinates services only; contains no mastery, planning, grading or publication rules. */
export class LearningOrchestrator {
  constructor(private readonly source: LearningAgentSource) {}
  async prepareNextLearningTask(
    profileId: string,
    textbookId: string,
    options: LearningOrchestratorOptions = {},
  ): Promise<LearningAgentResult> {
    const now = options.now ?? new Date().toISOString(),
      seed = options.seed ?? 'phase17'
    const result: LearningAgentResult = {
      status: 'BLOCKED',
      context: null,
      studentStateSummary: null,
      decision: null,
      activityPlan: null,
      generatedResources: { questions: [], mappings: [], content: [] },
      validation: { status: 'GENERATED', checks: [] },
      trace: { traceId: stableId('agent-trace', [profileId, textbookId, now, seed]), events: [] },
    }
    const event = (name: string, data: Record<string, unknown> = {}) =>
      result.trace.events.push({
        sequence: result.trace.events.length + 1,
        event: name,
        at: now,
        data,
      })
    try {
      if (!Number.isFinite(Date.parse(now))) throw new Error('AGENT_TIME_INVALID')
      event('BUILD_CONTEXT', { profileId, textbookId })
      const raw = await this.source.load(profileId, textbookId)
      const config = options.config ?? DEFAULT_LEARNING_PLANNER_CONFIG
      const planner = new LearningPlanner(config)
      const { context, snapshot } = buildAgentContext(raw, profileId, textbookId, now, config)
      result.context = context
      result.studentStateSummary = context.knowledgeState
      event('LOAD_MASTERY', { count: snapshot.masteryRecords.length })
      event('LOAD_RECENT_ATTEMPTS', { count: context.recentAttempts.length })
      event('LOAD_REVIEW_QUEUE', { ids: context.reviewQueueSummary.map((r) => r.id) })
      event('BUILD_STUDENT_STATE', {
        knowledgePoints: context.knowledgeState.knowledgePoints.length,
      })
      event('STRATEGY_RECOMMEND', {
        version: context.strategyRecommendations.strategyVersion,
        type: context.strategyRecommendations.type,
        diagnostics: context.strategyRecommendations.diagnostics,
      })
      const decision = planner.plan(context)
      result.decision = decision
      result.activityPlan = decision.recommendedActivity
      event(`PLANNER_${decision.action}`, {
        decisionId: decision.decisionId,
        target: decision.targetKnowledgePointId,
        reasons: decision.reasons,
        evidenceRefs: decision.evidenceRefs,
      })
      event('CREATE_ACTIVITY_PLAN', { plan: decision.recommendedActivity })
      const requests = buildGenerationRequests(context, decision, snapshot, seed)
      event('GENERATION_REQUEST', { questions: requests.questions, content: requests.content })
      const questions = await new QuestionGenerationService(
        options.questionProvider ?? new MockQuestionGenerator(snapshot.templates),
      ).generate(requests.questions, snapshot)
      result.questionGeneration = questions.batch.telemetry
      for (const entry of questions.batch.telemetry?.events ?? [])
        result.trace.events.push({ ...entry, sequence: result.trace.events.length + 1 })
      event('GENERATE_QUESTIONS', {
        batchId: questions.batch.batchId,
        generator: questions.batch.generator,
        count: questions.batch.questions?.length,
      })
      event('VALIDATE_QUESTIONS', { validation: questions.validation })
      const content = await new ContentGenerationService(
        options.contentProvider ?? new MockContentGenerator(),
      ).generate(requests.content, snapshot)
      event('GENERATE_CONTENT', { id: content.content.id, generator: content.content.generator })
      event('VALIDATE_CONTENT', { validation: content.validation })
      result.validation = finishValidation([
        ...questions.validation.checks,
        ...content.validation.checks,
      ])
      if (result.validation.status === 'VALID') {
        // Foundation resources are for isolated development simulation only.
        if (context.dataset !== 'demo') {
          result.validation = finishValidation([
            ...result.validation.checks,
            {
              stage: 'PUBLICATION',
              status: 'REQUIRES_REVIEW',
              code: 'AGENT_PRODUCTION_DELIVERY_DISABLED',
            },
          ])
        } else {
          result.generatedResources = {
            questions: questions.batch.questions,
            mappings: questions.batch.mappings,
            content: [content.content],
          }
          result.status = 'READY'
        }
      }
      event(result.status, {
        validationStatus: result.validation.status,
        activity: result.status === 'READY' ? result.activityPlan : null,
      })
    } catch (error) {
      // Keep failure diagnostics, but do not persist provider payloads or arbitrary exception text.
      const code =
        error instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(error.message)
          ? error.message
          : 'AGENT_DEPENDENCY_FAILED'
      result.validation = finishValidation([
        ...result.validation.checks,
        { stage: 'ORCHESTRATION', status: 'FAIL', code },
      ])
      event('BLOCKED', { code })
    }
    return result
  }
}
