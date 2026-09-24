import { z } from 'zod'
import { createAgentScenario, simulationQuestion } from '../../src/data/learning-agent/scenarios'
import { AIQuestionGenerator } from '../../src/services/learning-agent/aiQuestionGenerator'
import { LLMRuntime } from '../../src/services/llm/runtime'
import { LLMError } from '../../src/services/llm/errors'
import { arithmeticSummary } from '../../src/services/llm/questionPromptBuilder'
import type { LLMProvider } from '../../src/types/llm'
import { templateDifficulty } from '../../src/services/learning-agent/generators'
import type { QuestionGenerationRequest } from '../../src/types/learning-agent'
import { readLLMConfig } from './config'
import { OpenAICompatibleLLMProvider } from './openAICompatibleProvider'

const ids = z.array(z.string().min(1).max(300)).max(100)
const inputSchema = z.strictObject({
  request: z.strictObject({
    requestId: z.string().min(1).max(1000),
    profileId: z.literal('AGENT_STUDENT'),
    curriculum: z.strictObject({
      regionId: z.literal('AGENT_REGION'),
      grade: z.literal('AGENT_G2'),
      semester: z.literal('AGENT_S1'),
      subject: z.literal('MATH'),
      subjectId: z.literal('AGENT_MATH'),
      publisher: z.literal('AGENT_PUBLISHER'),
      textbookId: z.literal('AGENT_TEXTBOOK'),
    }),
    targetKnowledgePoints: z
      .array(z.enum(['AGENT_KP_BASE', 'AGENT_KP_CURRENT', 'AGENT_KP_NEXT']))
      .length(1),
    difficulty: z.number().min(0).max(1),
    count: z.number().int().min(1).max(100),
    allowedQuestionTypes: z
      .array(z.enum(['calculation', 'singleChoice']))
      .min(1)
      .max(2),
    constraints: z.strictObject({
      templateIds: ids,
      maxTextLength: z.number().int().min(100).max(2000),
      questionMix: z.strictObject({
        directPractice: z.literal(1),
        variationPractice: z.literal(0),
        wrongQuestionVariation: z.literal(0),
        application: z.literal(0),
        review: z.literal(0),
      }),
      math: z
        .strictObject({
          minNumber: z.number().int().min(0).max(100),
          maxNumber: z.number().int().min(0).max(100),
          allowedOperations: z
            .array(z.enum(['+', '-']))
            .min(1)
            .max(2),
          requireCarrying: z.boolean().optional(),
          requireBorrowing: z.boolean().optional(),
          minLargestOperand: z.number().int().min(0).max(100).optional(),
          maxLargestOperand: z.number().int().min(0).max(100).optional(),
        })
        .optional(),
    }),
    weaknessSignals: z.array(z.string().max(80)).max(20),
    errorPatterns: z
      .array(
        z.strictObject({
          domain: z.string().max(80),
          category: z.string().max(80),
          code: z.string().max(80),
          confidence: z.number().min(0).max(1),
        }),
      )
      .max(20),
    recentQuestionRefs: ids,
    avoidQuestionRefs: ids,
    // Decisions and private evidence are unnecessary for generation.
    generationReason: z.array(z.never()).length(0),
    seed: z.string().max(160),
    createdAt: z.iso.datetime(),
  }),
  recentSummaries: z.array(z.string().max(100)).max(100),
})
export async function generateDevQuestions(
  input: unknown,
  env: Record<string, string | undefined>,
) {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) throw new LLMError('SCHEMA_ERROR')
  const request: QuestionGenerationRequest = parsed.data.request
  const snapshot = createAgentScenario('A')
  const validTemplates = snapshot.templates.filter(
    (t) =>
      t.knowledgePointId === request.targetKnowledgePoints[0] &&
      t.difficulty === templateDifficulty(request.difficulty),
  )
  if (
    !request.allowedQuestionTypes.includes('calculation') ||
    !request.constraints.templateIds.length ||
    request.constraints.templateIds.some((id) => !validTemplates.some((t) => t.id === id)) ||
    (request.constraints.math &&
      request.constraints.math.minNumber > request.constraints.math.maxNumber)
  )
    throw new LLMError('SCHEMA_ERROR')
  // Trusted catalog only; browser cannot submit curriculum, snapshots, prompts, endpoints or keys.
  for (const [index, text] of parsed.data.recentSummaries.entries()) {
    const summary = arithmeticSummary(text)
    if (!summary) throw new LLMError('SCHEMA_ERROR')
    const q = simulationQuestion(`llm-recent-${index}`)
    q.stem = [{ type: 'FORMULA', text: summary }]
    snapshot.questions.push(q)
    request.avoidQuestionRefs.push(q.id)
  }
  let runtime: LLMRuntime
  try {
    const config = readLLMConfig(env)
    if (!config.adapter) throw new LLMError('CONFIG_ERROR')
    runtime = new LLMRuntime(new OpenAICompatibleLLMProvider(config.adapter), config.runtime)
  } catch {
    // Preserve sanitized CONFIG_ERROR telemetry; the live endpoint never fills with Mock.
    const unavailable: LLMProvider = {
      providerId: 'OPENAI_COMPATIBLE',
      model: 'unconfigured',
      capabilities: { nativeStructuredOutput: false },
      async generateStructured() {
        throw new LLMError('CONFIG_ERROR')
      },
    }
    runtime = new LLMRuntime(unavailable)
  }
  return new AIQuestionGenerator(runtime, snapshot, 5, '6', undefined, false).generate(request)
}
