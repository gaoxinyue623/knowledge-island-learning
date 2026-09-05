import { strategyShowcaseFixtures } from '@/data/learning-strategy'
import { learningStrategyService } from '@/services/learning-strategy'
import type { LearningRecommendation } from '@/types'

const strategyRecommendation = learningStrategyService.resolve(strategyShowcaseFixtures[0].input)

export const phase12DemoReviewQueueRecommendation: LearningRecommendation = {
  ...strategyRecommendation,
  studentProfileId: 'phase12-demo-profile',
  reviewRecommendations: strategyRecommendation.reviewRecommendations.map((review) => ({
    ...review,
    studentProfileId: 'phase12-demo-profile',
    knowledgePointId: 'DEMO_KP_01',
    mapNodeId: 'learning-map:DEMO_TEXTBOOK_MATH_G3_S1:knowledge:DEMO_LKP_01',
  })),
}
