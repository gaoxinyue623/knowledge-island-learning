import type {
  LearningRecommendation,
  LearningStrategyInput,
  LearningStrategyOptions,
  ReviewRecommendation,
} from '@/types'
import { nextLearningResolver, reviewStrategy, strategyEngine } from './strategyEngine'

export interface LearningStrategyServiceContract {
  resolve(input: LearningStrategyInput, options?: LearningStrategyOptions): LearningRecommendation
  resolveReviews(
    input: LearningStrategyInput,
    options?: LearningStrategyOptions,
  ): ReviewRecommendation[]
}

/** Read-only application service for the PHASE 11 strategy layer. */
export class LearningStrategyService implements LearningStrategyServiceContract {
  resolve(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): LearningRecommendation {
    return strategyEngine.resolve(input, options)
  }

  resolveReviews(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): ReviewRecommendation[] {
    return reviewStrategy.resolve(input, options)
  }

  resolveNext(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): LearningRecommendation {
    return nextLearningResolver.resolve(input, options)
  }

  /** Alias for callers that prefer the full domain name in orchestration code. */
  resolveLearningStrategy(
    input: LearningStrategyInput,
    options: LearningStrategyOptions = {},
  ): LearningRecommendation {
    return this.resolve(input, options)
  }
}

export const learningStrategyService = new LearningStrategyService()
