import type { MasteryPolicy } from '@/types'

/**
 * First deterministic baseline. The map includes the future 1..5 difficulty
 * scale; the current Question domain normalizes its three levels to 1, 3, 5.
 */
export const DEFAULT_MASTERY_POLICY: MasteryPolicy = {
  weakThreshold: 40,
  masteredThreshold: 80,
  minimumEvidenceForMastery: 3,
  minimumConfidenceForMastery: 0.5,
  confidenceEvidenceTarget: 5,
  difficultyWeights: {
    1: 0.8,
    2: 0.9,
    3: 1,
    4: 1.1,
    5: 1.2,
  },
  algorithmVersion: 'MASTERY_V1',
}

export function cloneMasteryPolicy(policy: MasteryPolicy = DEFAULT_MASTERY_POLICY): MasteryPolicy {
  return {
    ...policy,
    difficultyWeights: { ...policy.difficultyWeights },
  }
}
