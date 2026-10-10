import type { Question } from '../../src/types'
import { reviewedAiSources, plainText } from '../../src/services/formal-ai/reviewedSources'
import {
  questionDifficulty,
  difficultyLevel,
} from '../../src/services/learning-agent/questionSelection'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { productionCurriculumIndex as catalog } from '../../src/data/curriculum/production'
import {
  arithmeticAllowed,
  arithmeticScope,
  type AiContext,
} from '../../src/services/formal-ai/contract'
import { LLMRuntime } from '../../src/services/llm/runtime'
import { readLLMConfig } from './config'
import { OpenAICompatibleLLMProvider } from './openAICompatibleProvider'
import type { LLMUsageRecord } from '../../src/types/llm'

export class FormalAiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
export function resolveAiTopic(input: Pick<AiContext, 'textbookId' | 'knowledgePointId'>) {
  const book = catalog.textbooks.find((b) => b.id === input.textbookId)
  const point = catalog.knowledgePoints.find((p) => p.id === input.knowledgePointId)
  const scope = arithmeticScope(input.knowledgePointId)
  const unitIds = new Set(
    catalog.units.filter((u) => u.textbookVersionId === input.textbookId).map((u) => u.id),
  )
  const lessons = new Set(catalog.lessons.filter((l) => unitIds.has(l.unitId)).map((l) => l.id))
  const linked = catalog.lessonKnowledgePointRelations.some(
    (r) => r.knowledgePointId === input.knowledgePointId && lessons.has(r.lessonId),
  )
  if (
    !book ||
    !point ||
    !linked ||
    book.verificationStatus !== 'REVIEWED' ||
    point.verificationStatus !== 'REVIEWED' ||
    book.needsVerification ||
    point.needsVerification ||
    (!scope && !reviewedAiSources(input.textbookId, input.knowledgePointId).length)
  )
    throw new FormalAiError(
      422,
      'AI_TOPIC_UNSUPPORTED',
      '这个知识点暂未开放 AI 练习，请使用已审核练习。',
    )
  return { title: point.name, scope }
}
export interface GeneratedArithmeticBatch {
  title: string
  model: string
  source: 'REAL_LLM'
  validation: 'AUTO_VALIDATED'
  questions: Array<{
    id: string
    stem: string
    answer?: number
    explanation: string
    kind?: Question['questionType']
    sourceQuestion?: Question
    options?: Array<{ value: string; label: string }>
    difficulty?: number
  }>
  usage: Pick<LLMUsageRecord, 'inputTokens' | 'outputTokens' | 'totalTokens' | 'latencyMs'>
}
export type FormalGenerator = (
  input: AiContext & { difficulty?: number },
) => Promise<GeneratedArithmeticBatch>
export function formalAiConfigured(env: Record<string, string | undefined>) {
  if (env.FORMAL_AI_ENABLED !== 'true') return false
  const config = readLLMConfig(env)
  if (!config.adapter) throw new Error('FORMAL_AI_REQUIRES_REAL_MODEL')
  new LLMRuntime(new OpenAICompatibleLLMProvider(config.adapter), {
    ...config.runtime,
    timeoutMs: Math.min(config.runtime.timeoutMs ?? 30000, 45000),
    maxRetries: 0,
  })
  return true
}
const generatedSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            left: z.number().int().min(0).max(100),
            right: z.number().int().min(0).max(100),
            operation: z.enum(['+', '-']),
            answer: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .length(3),
  })
  .strict()

export function createFormalGenerator(env: Record<string, string | undefined>): FormalGenerator {
  return async (input) => {
    if (!formalAiConfigured(env))
      throw new FormalAiError(503, 'AI_DISABLED', 'AI 练习暂未开启，可以先做已审核练习。')
    const { title, scope } = resolveAiTopic(input)
    const config = readLLMConfig(env)
    const runtime = new LLMRuntime(new OpenAICompatibleLLMProvider(config.adapter!), {
      ...config.runtime,
      timeoutMs: Math.min(config.runtime.timeoutMs ?? 30000, 45000),
      maxRetries: 0,
    })
    let usage: GeneratedArithmeticBatch['usage'] = { latencyMs: 0 }
    if (!scope) return generateReviewedBatch(input, title, runtime)
    const allowedPairs: Array<{ left: number; right: number; operation: '+' | '-' }> = []
    for (const operation of scope.operations)
      for (let left = scope.left[0]; left <= scope.left[1]; left++)
        for (let right = scope.right[0]; right <= scope.right[1]; right++)
          if (arithmeticAllowed(scope, left, right, operation))
            allowedPairs.push({ left, right, operation })
    const pairKeys = new Set<string>()
    const uniquePairs = allowedPairs.filter((q) => {
      const key =
        q.operation === '+'
          ? `${Math.min(q.left, q.right)}+${Math.max(q.left, q.right)}`
          : `${q.left}-${q.right}`
      if (pairKeys.has(key)) return false
      pairKeys.add(key)
      return true
    })
    allowedPairs.splice(0, allowedPairs.length, ...uniquePairs)
    allowedPairs.sort((a, b) => a.left + a.right - (b.left + b.right))
    const band =
      input.difficulty === undefined
        ? allowedPairs
        : input.difficulty < 0.35
          ? allowedPairs.slice(0, Math.max(3, Math.ceil(allowedPairs.length * 0.4)))
          : input.difficulty > 0.65
            ? allowedPairs.slice(-Math.max(3, Math.ceil(allowedPairs.length * 0.4)))
            : allowedPairs
    const allowed = new Set(band.map((q) => `${q.left}:${q.operation}:${q.right}`))
    const result = await runtime.generateStructured(
      {
        requestId: randomUUID(),
        schema: generatedSchema,
        jsonSchema: z.toJSONSchema(generatedSchema),
        schemaName: 'formal_arithmetic_v1',
        systemPrompt:
          '你是小学数学出题老师。生成恰好三道不同的计算题。严格服从给定数值范围、运算与进退位约束。只输出符合 JSON Schema 的数据。不要生成故事、姓名、链接或额外文字。',
        userPrompt: JSON.stringify({
          topic: title,
          rules: scope,
          preferredPairs:
            input.difficulty === undefined
              ? undefined
              : band
                  .filter((_, i) => i % Math.max(1, Math.floor(band.length / 80)) === 0)
                  .slice(0, 100),
          difficulty: input.difficulty,
          pairInstruction:
            input.difficulty === undefined
              ? undefined
              : '优先从preferredPairs中选择三道不同题，不得超出这些数值的难度分段。',
          instructions:
            'left/right 是闭区间。maxResult 限制结果且结果不得小于0。carrying/borrowing=true 必须进位/退位，false 禁止；Multiple 表示必须是该数的整数倍。answer 必须是准确的计算结果。',
          variationSeed: randomUUID(),
        }),
        maxOutputTokens: 4096,
      },
      {
        promptId: 'formal-arithmetic',
        promptVersion: '1',
        schemaVersion: '1',
        repairCount: 0,
        onEvent: () => {},
        onUsage: (record) => {
          usage = {
            inputTokens: record.inputTokens,
            outputTokens: record.outputTokens,
            totalTokens: record.totalTokens,
            latencyMs: record.latencyMs,
          }
        },
      },
    )
    const seen = new Set<string>()
    const questions = result.data.questions.map((q) => {
      const answer = q.operation === '+' ? q.left + q.right : q.left - q.right
      const fingerprint =
        q.operation === '+'
          ? `${Math.min(q.left, q.right)}+${Math.max(q.left, q.right)}`
          : `${q.left}-${q.right}`
      if (
        !arithmeticAllowed(scope, q.left, q.right, q.operation) ||
        !allowed.has(`${q.left}:${q.operation}:${q.right}`) ||
        answer !== q.answer ||
        seen.has(fingerprint)
      )
        throw new FormalAiError(
          502,
          'AI_VALIDATION_FAILED',
          '这次生成的题目未通过检查，请重新出题。',
        )
      seen.add(fingerprint)
      const sign = q.operation === '+' ? '＋' : '－'
      const explanation =
        q.operation === '+' && (q.left % 10) + (q.right % 10) >= 10
          ? `个位 ${q.left % 10}＋${q.right % 10}＝${(q.left % 10) + (q.right % 10)}，满十向十位进 1；${q.left}${sign}${q.right}＝${answer}。`
          : q.operation === '-' && q.left % 10 < q.right % 10
            ? `个位 ${q.left % 10} 不够减 ${q.right % 10}，向高位借 1 个十再减；${q.left}${sign}${q.right}＝${answer}。`
            : `${q.left}${sign}${q.right}＝${answer}。按数位计算，再检查结果。`
      return {
        difficulty: input.difficulty === undefined ? 3 : difficultyLevel(input.difficulty),
        id: randomUUID(),
        stem: `${q.left} ${sign} ${q.right} = ?`,
        answer,
        explanation,
      }
    })
    return {
      title,
      model: result.model,
      source: 'REAL_LLM',
      validation: 'AUTO_VALIDATED',
      questions,
      usage,
    }
  }
}

async function generateReviewedBatch(
  input: AiContext & { difficulty?: number },
  title: string,
  runtime: LLMRuntime,
): Promise<GeneratedArithmeticBatch> {
  const sources = reviewedAiSources(input.textbookId, input.knowledgePointId).sort(
    (a, b) =>
      Math.abs(questionDifficulty(a.difficulty) - difficultyLevel(input.difficulty ?? 0.4)) -
        Math.abs(questionDifficulty(b.difficulty) - difficultyLevel(input.difficulty ?? 0.4)) ||
      a.id.localeCompare(b.id),
  )
  const candidates = sources.slice(0, Math.max(3, Math.ceil(sources.length * 0.6)))
  const count = Math.min(3, candidates.length)
  const schema = z
    .object({
      selections: z
        .array(
          z.object({ sourceId: z.string(), optionOrder: z.array(z.string()).max(20) }).strict(),
        )
        .length(count),
    })
    .strict()
  let usage: GeneratedArithmeticBatch['usage'] = { latencyMs: 0 }
  const result = await runtime.generateStructured(
    {
      requestId: randomUUID(),
      schema,
      jsonSchema: z.toJSONSchema(schema),
      schemaName: 'reviewed_practice_v1',
      systemPrompt:
        '你是小学学习助教。根据给定已审核题目编排一组练习，选取不同sourceId并打乱选项顺序。保留教材事实，禁止编造题目或答案。只输出JSON。',
      userPrompt: JSON.stringify({
        title,
        count,
        difficulty: input.difficulty,
        seed: randomUUID(),
        sources: candidates.map((q) => ({
          sourceId: q.id,
          stem: plainText(q.stem),
          optionKeys: (q.options ?? []).map((o) => o.optionKey),
          difficulty: q.difficulty,
        })),
      }),
      maxOutputTokens: 2048,
    },
    {
      promptId: 'reviewed-practice',
      promptVersion: '1',
      schemaVersion: '1',
      repairCount: 0,
      onEvent: () => {},
      onUsage: (r) => {
        usage = {
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          totalTokens: r.totalTokens,
          latencyMs: r.latencyMs,
        }
      },
    },
  )
  const seen = new Set<string>()
  const questions = result.data.selections.map((item) => {
    const q = candidates.find((q) => q.id === item.sourceId)
    const keys = (q?.options ?? []).map((o) => o.optionKey)
    if (
      !q ||
      seen.has(item.sourceId) ||
      item.optionOrder.length !== keys.length ||
      new Set(item.optionOrder).size !== keys.length ||
      item.optionOrder.some((k) => !keys.includes(k))
    )
      throw new FormalAiError(
        502,
        'AI_VALIDATION_FAILED',
        '本次练习编排未通过审核题目检查，请重试。',
      )
    seen.add(item.sourceId)
    const options = item.optionOrder.map((key) => ({
      value: key,
      label: plainText(q.options!.find((o) => o.optionKey === key)!.content),
    }))
    return {
      id: randomUUID(),
      stem: plainText(q.stem),
      kind: q.questionType,
      sourceQuestion: q,
      options,
      difficulty: questionDifficulty(q.difficulty),
      explanation: plainText(q.explanation.summary) || '请对照教材中的方法，再检查自己的答案。',
    }
  })
  return {
    title,
    model: result.model,
    source: 'REAL_LLM',
    validation: 'AUTO_VALIDATED',
    questions,
    usage,
  }
}
