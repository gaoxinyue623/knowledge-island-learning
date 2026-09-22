import type {
  ContentGenerationRequest,
  ContentGeneratorProvider,
  GeneratedContentSupplement,
  GeneratedQuestionBatch,
  GenerationValidation,
  LearningAgentContext,
  LearningAgentSnapshot,
  LearningDecision,
  QuestionGenerationRequest,
  QuestionGeneratorProvider,
} from '@/types/learning-agent'
import { templateDifficulty } from './generators'
import { GeneratedQuestionValidator } from './generatedQuestionValidator'
import { GeneratedContentValidator } from './generatedContentValidator'

export function buildGenerationRequests(
  context: LearningAgentContext,
  decision: LearningDecision,
  snapshot: LearningAgentSnapshot,
  seed: string,
): { questions: QuestionGenerationRequest; content: ContentGenerationRequest } {
  const target = decision.targetKnowledgePointId
  const point = context.knowledgeState.knowledgePoints.find((k) => k.knowledgePointId === target)!
  const node = context.mapNodes.find((n) => n.knowledgePointId === target && n.status !== 'locked')!
  const common = {
    profileId: context.profileId,
    curriculum: context.curriculum,
    difficulty: decision.difficulty,
    seed,
    createdAt: decision.createdAt,
  }
  return {
    questions: {
      ...common,
      requestId: `${decision.decisionId}:questions:${seed}`,
      targetKnowledgePoints: [target],
      count: decision.recommendedActivity.estimatedQuestionCount,
      allowedQuestionTypes: ['calculation', 'singleChoice'],
      constraints: {
        templateIds: snapshot.templates
          .filter(
            (t) =>
              t.knowledgePointId === target &&
              t.difficulty === templateDifficulty(decision.difficulty),
          )
          .map((t) => t.id)
          .sort(),
        questionMix: decision.recommendedActivity.questionMix,
        maxTextLength: 2000,
      },
      weaknessSignals: point.weaknessSignals,
      errorPatterns: point.errorPatterns,
      recentQuestionRefs: [...new Set(context.recentAttempts.map((a) => a.questionId))].sort(),
      avoidQuestionRefs: [],
      generationReason: decision.reasons,
    },
    content: {
      ...common,
      requestId: `${decision.decisionId}:content:${seed}`,
      lessonId: node.lessonId!,
      knowledgePointId: target,
      kinds: decision.recommendedActivity.contentRequirements,
    },
  }
}
export class QuestionGenerationService {
  constructor(
    private readonly provider: QuestionGeneratorProvider,
    private readonly validator = new GeneratedQuestionValidator(),
  ) {}
  async generate(
    request: QuestionGenerationRequest,
    snapshot: LearningAgentSnapshot,
  ): Promise<{ batch: GeneratedQuestionBatch; validation: GenerationValidation }> {
    // Providers receive a copy: they cannot rewrite the request or trusted curriculum used by validation.
    const batch = await this.provider.generate(structuredClone(request))
    const validation = this.validator.validate(batch, request, snapshot)
    return { batch: { ...batch, validation }, validation }
  }
}
export class ContentGenerationService {
  constructor(
    private readonly provider: ContentGeneratorProvider,
    private readonly validator = new GeneratedContentValidator(),
  ) {}
  async generate(
    request: ContentGenerationRequest,
    snapshot: LearningAgentSnapshot,
  ): Promise<{ content: GeneratedContentSupplement; validation: GenerationValidation }> {
    const content = await this.provider.generate(structuredClone(request))
    const validation = this.validator.validate(content, request, snapshot)
    return { content: { ...content, validationStatus: validation.status }, validation }
  }
}
