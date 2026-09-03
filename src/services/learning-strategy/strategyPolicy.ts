import { DEFAULT_MASTERY_POLICY } from '@/services/mastery'
import type { MasteryPolicy } from '@/types'
import { STRATEGY_VERSION } from '@/types'

/**
 * Strategy consumes the PHASE 10 policy instead of maintaining a second set
 * of score thresholds. Only the strategy namespace is added here.
 */
export interface StrategyPolicy {
  strategyVersion: string
  masteryPolicy: MasteryPolicy
}

export const DEFAULT_STRATEGY_POLICY: StrategyPolicy = {
  strategyVersion: STRATEGY_VERSION,
  masteryPolicy: DEFAULT_MASTERY_POLICY,
}
