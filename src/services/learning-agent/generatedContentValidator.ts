import { z } from 'zod'
import type {
  ContentGenerationRequest,
  GeneratedContentSupplement,
  GenerationValidation,
  LearningAgentSnapshot,
} from '@/types/learning-agent'
import { validateContentBlocks } from '@/services/validation/contentBlockValidation'
import { buildMockContentBlocks, MOCK_GENERATOR } from './generators'
import { finishValidation, isSafePlainText } from './generatedQuestionValidator'

const schema = z.object({
  id: z.string().min(1),
  requestId: z.string(),
  sourceType: z.literal('AI_GENERATED_SUPPLEMENT'),
  curriculum: z.object({
    regionId: z.string(),
    grade: z.string(),
    semester: z.string(),
    subject: z.string(),
    subjectId: z.string(),
    publisher: z.string(),
    textbookId: z.string(),
  }),
  lessonId: z.string(),
  knowledgePointId: z.string(),
  difficulty: z.number().finite().min(0).max(1),
  blocks: z.array(z.unknown()).min(1).max(20),
  kinds: z.array(z.string()).min(1),
  generator: z.object({ provider: z.string(), model: z.string(), promptVersion: z.string() }),
  promptVersion: z.string(),
  generatedAt: z.string().datetime(),
  validationStatus: z.string(),
})
export class GeneratedContentValidator {
  validate(
    raw: unknown,
    request: ContentGenerationRequest,
    snapshot: LearningAgentSnapshot,
  ): GenerationValidation {
    const checks: GenerationValidation['checks'] = []
    const parsed = schema.safeParse(raw)
    checks.push({
      stage: 'CONTENT_SCHEMA',
      status: parsed.success ? 'PASS' : 'FAIL',
      code: 'CONTENT_SCHEMA',
    })
    if (!parsed.success) return finishValidation(checks)
    const content = raw as GeneratedContentSupplement
    const valid =
      content.requestId === request.requestId &&
      content.generatedAt === request.createdAt &&
      content.lessonId === request.lessonId &&
      content.knowledgePointId === request.knowledgePointId &&
      content.difficulty === request.difficulty &&
      Object.entries(request.curriculum).every(
        ([key, value]) => content.curriculum[key as keyof typeof content.curriculum] === value,
      ) &&
      request.profileId === snapshot.profile.studentId &&
      request.curriculum.textbookId === snapshot.curriculum.textbook.id &&
      snapshot.curriculum.lessonKnowledgePoints.some(
        (r) => r.lessonId === content.lessonId && r.knowledgePointId === content.knowledgePointId,
      )
    checks.push({
      stage: 'CONTENT_CURRICULUM',
      status: valid ? 'PASS' : 'FAIL',
      code: 'CONTENT_BINDING',
    })
    const safe =
      validateContentBlocks(content.blocks).valid &&
      content.blocks.every((b) => b.type === 'TEXT' && isSafePlainText(b.text ?? ''))
    checks.push({
      stage: 'CONTENT_SAFETY',
      status: safe ? 'PASS' : 'FAIL',
      code: 'CONTENT_PLAIN_TEXT',
    })
    const known =
      JSON.stringify(content.blocks) === JSON.stringify(buildMockContentBlocks(request)) &&
      JSON.stringify(content.kinds) === JSON.stringify(request.kinds) &&
      content.generator.provider === MOCK_GENERATOR.provider &&
      content.generator.model === MOCK_GENERATOR.model &&
      content.generator.promptVersion === MOCK_GENERATOR.promptVersion &&
      content.promptVersion === MOCK_GENERATOR.promptVersion
    checks.push({
      stage: 'CONTENT_SEMANTICS',
      status: known ? 'PASS' : 'REQUIRES_REVIEW',
      code: 'CURATED_SUPPLEMENT_CHECK',
    })
    return finishValidation(checks)
  }
}
