import type {
  LearningAgentDecisionResult,
  LearningAgentSource,
  LearningPlannerConfig,
} from '@/types/learning-agent'
import { buildAgentContext } from './contextBuilder'
import { LearningPlanner } from './learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG, stableId } from './plannerConfig'
import { RuntimeLearningAgentSource } from './runtimeSource'

export interface RuntimeDecisionOptions {
  now?: string
  config?: LearningPlannerConfig
}

const safeRuntimeCodes = new Set([
  'AGENT_PROFILE_NOT_FOUND',
  'AGENT_CATALOG_INCOMPLETE',
  'AGENT_CURRICULUM_CONTEXT_MISMATCH',
  'AGENT_CURRICULUM_GUARD',
  'AGENT_CATALOG_INACTIVE',
  'AGENT_CURRICULUM_REFERENCES',
  'AGENT_NO_AVAILABLE_KNOWLEDGE_POINT',
])

/**
 * Production read-only boundary. It computes the next action from the existing
 * profile facts but deliberately does not invoke a generator or write a fact.
 */
export class RuntimeLearningAgentDecisionService {
  constructor(private readonly source: LearningAgentSource) {}

  async prepare(
    profileId: string,
    textbookId: string,
    options: RuntimeDecisionOptions = {},
  ): Promise<LearningAgentDecisionResult> {
    const now = options.now ?? new Date().toISOString()
    const result: LearningAgentDecisionResult = {
      status: 'BLOCKED',
      context: null,
      studentStateSummary: null,
      decision: null,
      activityPlan: null,
      validation: { status: 'BLOCKED', checks: [] },
      trace: {
        traceId: stableId('agent-runtime-decision', [profileId, textbookId, now]),
        events: [],
      },
    }
    const event = (name: string, data: Record<string, unknown> = {}) =>
      result.trace.events.push({
        sequence: result.trace.events.length + 1,
        event: name,
        at: now,
        data,
      })
    const check = (stage: string, status: 'PASS' | 'FAIL', code: string) =>
      result.validation.checks.push({ stage, status, code })
    try {
      if (!profileId || !textbookId || !Number.isFinite(Date.parse(now))) {
        check('INPUT', 'FAIL', 'AGENT_RUNTIME_INPUT_INVALID')
        event('BLOCKED', { code: 'AGENT_RUNTIME_INPUT_INVALID' })
        return result
      }
      event('LOAD_RUNTIME_FACTS', { profileId, textbookId })
      const raw = await this.source.load(profileId, textbookId)
      if (raw.dataset !== 'profile') {
        check('DATASET', 'FAIL', 'AGENT_RUNTIME_PROFILE_DATA_REQUIRED')
        event('BLOCKED', { code: 'AGENT_RUNTIME_PROFILE_DATA_REQUIRED' })
        return result
      }
      check('DATASET', 'PASS', 'PROFILE_DATASET')
      const config = options.config ?? DEFAULT_LEARNING_PLANNER_CONFIG
      const { context, snapshot } = buildAgentContext(raw, profileId, textbookId, now, config)
      result.context = context
      result.studentStateSummary = context.knowledgeState
      event('BUILD_CONTEXT', { knowledgePoints: context.knowledgeState.knowledgePoints.length })
      const decision = new LearningPlanner(config).plan(context)
      result.decision = decision
      result.activityPlan = decision.recommendedActivity
      check('CONTEXT', 'PASS', 'AGENT_RUNTIME_CONTEXT_VALID')
      check('DECISION', 'PASS', 'AGENT_RUNTIME_DECISION_READY')
      event('PLANNER_DECISION', {
        action: decision.action,
        target: decision.targetKnowledgePointId,
        evidenceRefs: decision.evidenceRefs,
      })
      // Keep this boundary explicit: generation and delivery are separate flows.
      check('DELIVERY', 'PASS', 'AGENT_RUNTIME_READ_ONLY')
      event('READY', { action: decision.action, profileId: snapshot.profile.studentId })
      result.status = 'READY'
      result.validation.status = 'VALID'
    } catch (error) {
      const code =
        error instanceof Error && safeRuntimeCodes.has(error.message)
          ? error.message
          : 'AGENT_RUNTIME_DEPENDENCY_FAILED'
      check('RUNTIME', 'FAIL', code)
      event('BLOCKED', { code })
    }
    return result
  }
}

export const runtimeLearningAgentDecisionService = new RuntimeLearningAgentDecisionService(
  new RuntimeLearningAgentSource(),
)
