import type { LearningPlannerConfig } from '@/types/learning-agent'
export const DEFAULT_LEARNING_PLANNER_CONFIG: LearningPlannerConfig = {
  algorithmVersion: 'LEARNING_PLANNER_V1',
  lowMastery: 0.45,
  lowRecentRate: 0.4,
  consecutiveErrors: 2,
  prerequisiteThreshold: 0.45,
  nextMastery: 0.85,
  nextRecentRate: 0.8,
  challengeMastery: 0.9,
  challengeRecentRate: 0.9,
  minimumAttempts: 3,
  minimumConfidence: 0.5,
  recentWindow: 10,
  questionCount: 5,
  difficulty: {
    NEXT: 0.5,
    REINFORCE: 0.35,
    REVIEW: 0.4,
    REMEDIATE: 0.2,
    CHALLENGE: 0.85,
    SIMPLIFY: 0.15,
    CONTINUE: 0.4,
  },
}
export function assertPlannerConfig(config: LearningPlannerConfig): void {
  for (const value of [
    config.lowMastery,
    config.lowRecentRate,
    config.prerequisiteThreshold,
    config.nextMastery,
    config.nextRecentRate,
    config.challengeMastery,
    config.challengeRecentRate,
    config.minimumConfidence,
    ...Object.values(config.difficulty),
  ]) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('PLANNER_CONFIG_RANGE')
  }
  for (const value of [
    config.consecutiveErrors,
    config.minimumAttempts,
    config.recentWindow,
    config.questionCount,
  ])
    if (!Number.isInteger(value) || value < 1 || value > 100)
      throw new Error('PLANNER_CONFIG_COUNT')
}
export function stableId(prefix: string, value: unknown): string {
  let hash = 2166136261
  for (const char of JSON.stringify(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `${prefix}:${(hash >>> 0).toString(16)}`
}
