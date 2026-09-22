import type {
  LearningAction,
  LearningActivityPlan,
  LearningAgentContext,
  LearningDecision,
  LearningDecisionReason,
  LearningPlannerConfig,
  QuestionMix,
} from '@/types/learning-agent'
import { DEFAULT_LEARNING_PLANNER_CONFIG, assertPlannerConfig, stableId } from './plannerConfig'

export function validateQuestionMix(mix: QuestionMix): boolean {
  const keys = [
    'directPractice',
    'variationPractice',
    'wrongQuestionVariation',
    'application',
    'review',
  ] as const
  return (
    keys.every((k) => Number.isFinite(mix[k]) && mix[k] >= 0 && mix[k] <= 1) &&
    Math.abs(keys.reduce((sum, k) => sum + mix[k], 0) - 1) < 1e-8
  )
}
export function createActivityPlan(
  action: LearningAction,
  target: string,
  config: LearningPlannerConfig,
): LearningActivityPlan {
  // V1 mock supports direct template practice only. Never claim an unimplemented mix.
  const questionMix = {
    directPractice: 1,
    variationPractice: 0,
    wrongQuestionVariation: 0,
    application: 0,
    review: 0,
  }
  return {
    activityType:
      action === 'NEXT' || action === 'CONTINUE'
        ? 'LESSON'
        : action === 'REVIEW'
          ? 'REVIEW'
          : action === 'REMEDIATE'
            ? 'REMEDIATION'
            : action === 'CHALLENGE'
              ? 'CHALLENGE'
              : 'PRACTICE',
    knowledgePointIds: [target],
    estimatedQuestionCount: config.questionCount,
    difficulty: config.difficulty[action],
    questionMix,
    contentRequirements: [
      action === 'REMEDIATE'
        ? 'REMEDIATION_EXPLANATION'
        : action === 'SIMPLIFY'
          ? 'GUIDED_PRACTICE'
          : 'HINT',
    ],
  }
}
export class LearningDecisionEngine {
  create(
    context: LearningAgentContext,
    action: LearningAction,
    target: string,
    reasons: LearningDecisionReason[],
    config: LearningPlannerConfig,
  ): LearningDecision {
    if (
      !context.mapNodes.some(
        (n) =>
          n.knowledgePointId === target &&
          n.status !== 'locked' &&
          n.textbookId === context.curriculum.textbookId,
      )
    )
      throw new Error('AGENT_TARGET_NOT_AVAILABLE')
    const activity = createActivityPlan(action, target, config)
    const state = context.knowledgeState.knowledgePoints.find((p) => p.knowledgePointId === target)!
    const evidenceRefs = [
      ...new Set([
        ...reasons.flatMap((r) => (r.evidenceRef ? [r.evidenceRef] : [])),
        ...context.recentLearningEvidence
          .filter(
            (e) =>
              e.knowledgePointId === target ||
              e.knowledgePointId === context.currentLearning.knowledgePointId,
          )
          .map((e) => e.id),
      ]),
    ].sort()
    return {
      decisionId: stableId('agent-decision', [
        context.profileId,
        context.curriculum.textbookId,
        context.knowledgeState,
        action,
        target,
        reasons,
        config,
      ]),
      profileId: context.profileId,
      textbookId: context.curriculum.textbookId,
      action,
      targetKnowledgePointId: target,
      sourceKnowledgePointId: context.currentLearning.knowledgePointId,
      difficulty: activity.difficulty,
      confidence: state.confidence,
      reasons,
      evidenceRefs,
      recommendedActivity: activity,
      algorithmVersion: config.algorithmVersion,
      createdAt: context.knowledgeState.generatedAt,
    }
  }
}
export class LearningPlanner {
  constructor(readonly config: LearningPlannerConfig = DEFAULT_LEARNING_PLANNER_CONFIG) {
    assertPlannerConfig(config)
  }
  plan(context: LearningAgentContext): LearningDecision {
    const c = this.config,
      current = context.currentLearning.knowledgePointId
    const state = context.knowledgeState.knowledgePoints.find((p) => p.knowledgePointId === current)
    if (
      !state ||
      context.knowledgeState.profileId !== context.profileId ||
      context.knowledgeState.textbookId !== context.curriculum.textbookId
    )
      throw new Error('AGENT_STATE_CONTEXT_MISMATCH')
    const available = (id: string) =>
      context.mapNodes.some(
        (n) =>
          n.knowledgePointId === id &&
          n.status !== 'locked' &&
          n.textbookId === context.curriculum.textbookId,
      )
    const reason = (
      code: string,
      message: string,
      evidenceType: LearningDecisionReason['evidenceType'],
      evidenceRef?: string,
    ): LearningDecisionReason => ({ code, message, evidenceType, evidenceRef, weight: 1 })
    let action: LearningAction = 'CONTINUE',
      target = current
    let reasons = [
      reason('INSUFFICIENT_EVIDENCE', '继续当前知识点，收集更多学习证据。', 'MASTERY', current),
    ]
    const failure = state.consecutiveIncorrect >= c.consecutiveErrors
    const prerequisites = context.knowledgeRelations
      .filter((r) => r.relationType === 'prerequisite' && r.targetKnowledgePointId === current)
      .map((r) => ({
        relation: r,
        state: context.knowledgeState.knowledgePoints.find(
          (p) => p.knowledgePointId === r.sourceKnowledgePointId,
        ),
      }))
      .filter(
        (r) =>
          r.state &&
          r.state.masteryScore < c.prerequisiteThreshold &&
          available(r.state.knowledgePointId),
      )
      .sort(
        (a, b) =>
          a.state!.masteryScore - b.state!.masteryScore ||
          a.relation.id.localeCompare(b.relation.id),
      )
    const due = context.reviewQueueSummary
      .filter(
        (r) =>
          r.profileId === context.profileId &&
          r.textbookId === context.curriculum.textbookId &&
          r.status === 'active' &&
          r.dueAt &&
          Date.parse(r.dueAt) <= Date.parse(context.knowledgeState.generatedAt) &&
          available(r.knowledgePointId),
      )
      .sort(
        (a, b) =>
          a.dueAt!.localeCompare(b.dueAt!) || a.priority - b.priority || a.id.localeCompare(b.id),
      )[0]
    if (failure && prerequisites.length) {
      action = 'REMEDIATE'
      target = prerequisites[0].state!.knowledgePointId
      reasons = [
        reason(
          'PREREQUISITE_WEAKNESS',
          '当前知识点连续作答失败，先补充薄弱的前置知识。',
          'CURRICULUM',
          prerequisites[0].relation.id,
        ),
        reason(
          'CONSECUTIVE_ERRORS',
          `连续错误 ${state.consecutiveIncorrect} 次。`,
          'ATTEMPT',
          current,
        ),
      ]
    } else if (failure && state.recentCorrectRate < c.lowRecentRate) {
      action = 'SIMPLIFY'
      reasons = [
        reason(
          'CONSECUTIVE_ERRORS',
          `连续错误 ${state.consecutiveIncorrect} 次。`,
          'ATTEMPT',
          current,
        ),
        reason('RECENT_ERROR_RATE_HIGH', '近期正确率低于配置阈值，降低难度。', 'ATTEMPT', current),
      ]
    } else if (due) {
      action = 'REVIEW'
      target = due.knowledgePointId
      reasons = [reason('REVIEW_DUE', '已有复习任务到期。', 'REVIEW_QUEUE', due.id)]
    } else if (
      (state.attemptCount > 0 || state.confidence > 0) &&
      state.masteryScore < c.lowMastery
    ) {
      action = 'REINFORCE'
      reasons = [reason('LOW_MASTERY', '当前掌握度低于巩固阈值。', 'MASTERY', current)]
    } else if (state.attemptCount >= c.minimumAttempts && state.confidence >= c.minimumConfidence) {
      if (
        state.masteryScore >= c.challengeMastery &&
        state.recentCorrectRate >= c.challengeRecentRate
      ) {
        action = 'CHALLENGE'
        reasons = [
          reason('READY_FOR_CHALLENGE', '掌握度与近期正确率达到挑战阈值。', 'MASTERY', current),
        ]
      } else if (
        state.masteryScore >= c.nextMastery &&
        state.recentCorrectRate >= c.nextRecentRate
      ) {
        const next = context.strategyRecommendations.nextKnowledgePoint
        if (
          context.strategyRecommendations.type === 'PROCEED_TO_NEXT' &&
          next &&
          next.knowledgePointId !== current &&
          available(next.knowledgePointId)
        ) {
          action = 'NEXT'
          target = next.knowledgePointId
          reasons = [
            reason('HIGH_MASTERY', '已达到进入下一知识点的学习阈值。', 'MASTERY', current),
            reason(
              'STRATEGY_RECOMMENDATION',
              '采用 STRATEGY_V1 给出的可进入候选。',
              'STRATEGY',
              next.mapNodeId,
            ),
          ]
        }
      }
    }
    if (action === 'CONTINUE' && context.strategyRecommendations.type === 'REINFORCE') {
      action = 'REINFORCE'
      reasons = [reason('STRATEGY_RECOMMENDATION', '采用现有策略的巩固建议。', 'STRATEGY', current)]
    }
    return new LearningDecisionEngine().create(context, action, target, reasons, c)
  }
}
