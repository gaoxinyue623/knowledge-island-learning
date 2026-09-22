import type { ExerciseTemplate } from '@/types'
import type {
  ContentGenerationRequest,
  ContentGeneratorProvider,
  GeneratedContentSupplement,
  GeneratedQuestionBatch,
  QuestionGenerationRequest,
  QuestionGeneratorProvider,
} from '@/types/learning-agent'
import { generateExerciseInstances } from '@/services/exercise-template/exerciseGenerator'
import { exerciseInstanceToQuestionViewModel } from '@/services/exercise-template/generatedQuestionAdapter'
import { validateQuestionMix } from './learningPlanner'

export const MOCK_GENERATOR = {
  provider: 'MOCK',
  model: 'exercise-template-v1',
  promptVersion: 'AGENT_SUPPLEMENT_V1',
}
export function templateDifficulty(value: number): ExerciseTemplate['difficulty'] {
  return value < 0.25 ? 'L1' : value < 0.4 ? 'L2' : value < 0.65 ? 'L3' : value < 0.8 ? 'L4' : 'L5'
}
export function difficultyLevel(value: number): 'FOUNDATION' | 'STANDARD' | 'ADVANCED' {
  return value < 0.4 ? 'FOUNDATION' : value < 0.65 ? 'STANDARD' : 'ADVANCED'
}
export function buildMockContentBlocks(
  request: ContentGenerationRequest,
): GeneratedContentSupplement['blocks'] {
  const labels = {
    CONCEPT_EXPLANATION: '概念说明：先找出题目中的数量与运算关系。',
    EXAMPLE: '例题引导：观察一题的已知条件，再检查结果。',
    GUIDED_PRACTICE: '分步练习：读题，选择方法，计算，最后检查。',
    HINT: '提示：先读清题目，再检查每一步。',
    SUMMARY: '小结：说一说你用了什么方法，以及怎样检查。',
    REMEDIATION_EXPLANATION: '补救引导：回到前置知识，完成基础练习后再继续。',
  }
  return request.kinds.map((kind) => ({ type: 'TEXT', text: labels[kind] }))
}
export class MockQuestionGenerator implements QuestionGeneratorProvider {
  constructor(private readonly templates: readonly ExerciseTemplate[]) {}
  async generate(request: QuestionGenerationRequest): Promise<GeneratedQuestionBatch> {
    if (
      !Number.isInteger(request.count) ||
      request.count < 1 ||
      request.count > 100 ||
      !validateQuestionMix(request.constraints.questionMix)
    )
      throw new Error('GENERATION_REQUEST_INVALID')
    if (request.constraints.questionMix.directPractice !== 1)
      throw new Error('MOCK_QUESTION_MIX_UNSUPPORTED')
    const template = [...this.templates]
      .sort((a, b) => a.id.localeCompare(b.id))
      .find(
        (t) =>
          request.constraints.templateIds.includes(t.id) &&
          request.targetKnowledgePoints.includes(t.knowledgePointId),
      )
    if (!template || request.curriculum.subject !== 'MATH')
      throw new Error('MOCK_TEMPLATE_UNAVAILABLE')
    const adjusted = {
      ...template,
      difficulty: templateDifficulty(request.difficulty),
    } as ExerciseTemplate
    const questions = generateExerciseInstances(adjusted, request.seed, request.count).map(
      (instance) => ({
        ...exerciseInstanceToQuestionViewModel(instance),
        id: `${request.requestId}:${instance.id}`,
        status: 'AI_GENERATED' as const,
        verificationStatus: 'SAMPLE' as const,
        needsVerification: true,
        isSample: true,
        sourceId: `agent-template:${template.id}`,
        tags: ['AI_GENERATED_SUPPLEMENT', `template:${template.id}`],
        gradeId: request.curriculum.grade,
        semesterId: request.curriculum.semester,
        subjectId: request.curriculum.subjectId,
        textbookVersionId: request.curriculum.textbookId,
      }),
    )
    // Option ownership changes with the request-scoped question identity.
    for (const q of questions)
      q.options = q.options?.map((o) => ({ ...o, id: `${q.id}:${o.optionKey}`, questionId: q.id }))
    const mappings = questions.map((q) => ({
      id: `agent-mapping:${q.id}`,
      questionId: q.id,
      knowledgePointId: template.knowledgePointId,
      relationType: 'PRIMARY' as const,
      weight: 1,
      order: 1,
      isPrimary: true,
      sourceId: q.sourceId,
      status: 'DRAFT' as const,
      needsVerification: true,
      isSample: true,
      verificationStatus: 'SAMPLE' as const,
    }))
    return {
      batchId: `batch:${request.requestId}`,
      requestId: request.requestId,
      questions,
      mappings,
      validation: { status: 'GENERATED', checks: [] },
      generator: { ...MOCK_GENERATOR },
      createdAt: request.createdAt,
    }
  }
}
export class MockContentGenerator implements ContentGeneratorProvider {
  async generate(request: ContentGenerationRequest): Promise<GeneratedContentSupplement> {
    return {
      id: `supplement:${request.requestId}`,
      requestId: request.requestId,
      sourceType: 'AI_GENERATED_SUPPLEMENT',
      curriculum: { ...request.curriculum },
      lessonId: request.lessonId,
      knowledgePointId: request.knowledgePointId,
      difficulty: request.difficulty,
      kinds: [...request.kinds],
      blocks: buildMockContentBlocks(request),
      generator: { ...MOCK_GENERATOR },
      promptVersion: MOCK_GENERATOR.promptVersion,
      generatedAt: request.createdAt,
      validationStatus: 'GENERATED',
    }
  }
}
