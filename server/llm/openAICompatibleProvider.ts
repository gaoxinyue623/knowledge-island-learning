import { z } from 'zod'
import type { LLMProvider, LLMStructuredRequest, LLMStructuredResult } from '../../src/types/llm'
import { LLMError } from '../../src/services/llm/errors'
import { parseStructured } from '../../src/services/llm/structuredOutput'
import type { OpenAICompatibleConfig } from './config'

const envelope = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable(),
          refusal: z.string().nullable().optional(),
          reasoning_content: z.string().nullable().optional(),
        }),
        finish_reason: z.string().nullable(),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative().optional(),
      completion_tokens: z.number().int().nonnegative().optional(),
      total_tokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
})
export class OpenAICompatibleLLMProvider implements LLMProvider {
  readonly providerId = 'OPENAI_COMPATIBLE'
  readonly model: string
  readonly capabilities: { nativeStructuredOutput: boolean }
  constructor(
    private readonly config: OpenAICompatibleConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.model = config.model
    this.capabilities = { nativeStructuredOutput: config.nativeStructuredOutput }
  }
  async generateStructured<T>(request: LLMStructuredRequest<T>): Promise<LLMStructuredResult<T>> {
    const start = Date.now()
    let response: Response
    try {
      response = await this.fetcher(`${this.config.baseURL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        signal: request.signal,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            {
              role: 'user',
              content: this.capabilities.nativeStructuredOutput
                ? request.userPrompt
                : `${request.userPrompt}\nReturn only one JSON object, no Markdown. Obey this JSON Schema:\n${JSON.stringify(request.jsonSchema)}`,
            },
          ],
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxOutputTokens ?? 4096,
          ...(this.config.thinkingMode ? { thinking: { type: this.config.thinkingMode } } : {}),
          ...(this.capabilities.nativeStructuredOutput
            ? {
                response_format: {
                  type: 'json_schema',
                  json_schema: {
                    name: request.schemaName,
                    strict: true,
                    schema: request.jsonSchema,
                  },
                },
              }
            : {}),
        }),
      })
    } catch {
      throw new LLMError(request.signal?.aborted ? 'TIMEOUT' : 'NETWORK_ERROR', true)
    }
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined)
      const code = response.status
      throw new LLMError(
        code === 401 || code === 403
          ? 'AUTH_ERROR'
          : code === 429
            ? 'RATE_LIMIT'
            : code === 408
              ? 'TIMEOUT'
              : 'MODEL_ERROR',
        code === 429 || code === 408 || [500, 502, 503, 504].includes(code),
        {},
        undefined,
        { httpStatus: code },
      )
    }
    let responseBytes = 0
    let raw: unknown
    try {
      const reader = response.body?.getReader()
      if (!reader) throw new LLMError('INVALID_RESPONSE')
      const chunks: Uint8Array[] = []
      let length = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          length += value.length
          responseBytes = length
          if (length > 262144) throw new LLMError('INVALID_RESPONSE')
          chunks.push(value)
        }
      } finally {
        await reader.cancel().catch(() => undefined)
      }
      raw = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch (error) {
      if (error instanceof LLMError) throw error
      if (request.signal?.aborted) throw new LLMError('TIMEOUT', true)
      if (error instanceof TypeError) throw new LLMError('NETWORK_ERROR', true)
      throw new LLMError('INVALID_RESPONSE')
    }
    const parsed = envelope.safeParse(raw)
    if (!parsed.success) throw new LLMError('INVALID_RESPONSE')
    const answer = parsed.data.choices[0]!,
      tokens = parsed.data.usage
    const usage = {
      inputTokens: tokens?.prompt_tokens,
      outputTokens: tokens?.completion_tokens,
      totalTokens: tokens?.total_tokens,
    }
    const diagnostics = {
      httpStatus: response.status,
      responseBytes,
      contentCharacters: answer.message.content?.length ?? 0,
      reasoningCharacters: answer.message.reasoning_content?.length ?? 0,
      finishReason: (['stop', 'length', 'content_filter'].includes(answer.finish_reason ?? '')
        ? answer.finish_reason
        : 'other') as 'stop' | 'length' | 'content_filter' | 'other',
    }
    if (
      answer.message.refusal ||
      answer.finish_reason !== 'stop' ||
      answer.message.content === null
    )
      throw new LLMError('INVALID_RESPONSE', false, usage, undefined, diagnostics)
    let data: T
    try {
      data = parseStructured(answer.message.content, request, usage)
    } catch (error) {
      if (error instanceof LLMError)
        throw new LLMError(error.type, error.transient, error.usage, error.invalidData, {
          ...diagnostics,
          ...error.diagnostics,
        })
      throw new LLMError('UNKNOWN')
    }
    return {
      diagnostics,
      requestId: request.requestId,
      provider: this.providerId,
      model: this.model,
      data,
      usage,
      latencyMs: Date.now() - start,
      finishReason: 'stop',
      rawResponseAvailable: false,
      createdAt: new Date().toISOString(),
    }
  }
}
