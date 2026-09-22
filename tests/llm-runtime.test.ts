// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createServer } from 'node:http'
import { LLMRuntime } from '@/services/llm/runtime'
import { LLMError } from '@/services/llm/errors'
import { MockLLMProvider } from '@/services/llm/mockProvider'
import type { LLMStructuredRequest, LLMTraceEvent, LLMUsageRecord } from '@/types/llm'
import { OpenAICompatibleLLMProvider } from '../server/llm/openAICompatibleProvider'
import { readLLMConfig, rejectClientLLMKey } from '../server/llm/config'

const schema = z.strictObject({ answer: z.number() })
const request: LLMStructuredRequest<z.infer<typeof schema>> = {
  requestId: 'opaque-id',
  systemPrompt: 'JSON only',
  userPrompt: 'calculate',
  schema,
  jsonSchema: z.toJSONSchema(schema),
  schemaName: 'answer',
}
const config = {
  baseURL: 'https://compatible.example/v1',
  apiKey: 'TEST_SECRET_SENTINEL',
  model: 'configured-model',
  nativeStructuredOutput: true,
}
function observer() {
  const usage: LLMUsageRecord[] = [],
    events: LLMTraceEvent[] = []
  return {
    usage,
    events,
    context: {
      promptId: 'question-generation.user.v1',
      promptVersion: '1',
      schemaVersion: 'v1',
      repairCount: 0,
      onUsage: (u: LLMUsageRecord) => usage.push(u),
      onEvent: (e: LLMTraceEvent) => events.push(e),
    },
  }
}
const response = (content = '{"answer":25}', finish = 'stop') =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content }, finish_reason: finish }],
      usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 },
    }),
  )

describe('structured LLM runtime', () => {
  it('sends native schema to the configured endpoint and records sanitized usage', async () => {
    const fetcher = vi.fn(async () => response())
    const obs = observer()
    const result = await new LLMRuntime(
      new OpenAICompatibleLLMProvider(config, fetcher),
    ).generateStructured(request, obs.context)
    expect(result.data.answer).toBe(25)
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://compatible.example/v1/chat/completions')
    expect(init.redirect).toBe('error')
    const payload = JSON.parse(init.body as string)
    expect(payload.thinking).toBeUndefined()
    expect(payload.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: { strict: true, name: 'answer', schema: { additionalProperties: false } },
    })
    expect(obs.usage[0]).toMatchObject({
      inputTokens: 12,
      outputTokens: 5,
      totalTokens: 17,
      retryCount: 0,
      status: 'SUCCESS',
      model: 'configured-model',
    })
    expect(obs.usage[0].estimatedCost).toBeUndefined()
    expect(JSON.stringify([result, obs])).not.toContain(config.apiKey)
    expect(obs.events.map((e) => e.event)).toEqual([
      'LLM_REQUEST_CREATED',
      'LLM_REQUEST_STARTED',
      'LLM_RESPONSE_RECEIVED',
      'STRUCTURED_OUTPUT_PARSED',
    ])
  })
  it('sends thinking control only on explicit opt-in and records lengths without reasoning text', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: '{"answer":25}', reasoning_content: 'PRIVATE_REASONING' },
                finish_reason: 'stop',
              },
            ],
          }),
        ),
    )
    const obs = observer()
    await new LLMRuntime(
      new OpenAICompatibleLLMProvider({ ...config, thinkingMode: 'disabled' }, fetcher),
    ).generateStructured(request, obs.context)
    const init = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(JSON.parse(init.body as string).thinking).toEqual({ type: 'disabled' })
    expect(obs.usage[0].diagnostics?.reasoningCharacters).toBe('PRIVATE_REASONING'.length)
    expect(JSON.stringify(obs)).not.toContain('PRIVATE_REASONING')
    const env = {
      LLM_PROVIDER: 'OPENAI_COMPATIBLE',
      LLM_BASE_URL: config.baseURL,
      LLM_API_KEY: config.apiKey,
      LLM_MODEL: config.model,
      LLM_THINKING_MODE: 'disabled',
    }
    expect(readLLMConfig(env).adapter?.thinkingMode).toBe('disabled')
    expect(() => readLLMConfig({ ...env, LLM_THINKING_MODE: 'unsupported' })).toThrow()
  })
  it('supports JSON instructions without native response_format and validates locally', async () => {
    const fetcher = vi.fn(async () => response('{"answer":"wrong"}'))
    const obs = observer()
    await expect(
      new LLMRuntime(
        new OpenAICompatibleLLMProvider({ ...config, nativeStructuredOutput: false }, fetcher),
      ).generateStructured(request, obs.context),
    ).rejects.toMatchObject({ type: 'STRUCTURED_OUTPUT_ERROR' })
    const init = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(JSON.parse(init.body as string).response_format).toBeUndefined()
    expect(JSON.parse(init.body as string).messages[1].content).toContain('JSON Schema')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(obs.usage[0]).toMatchObject({ totalTokens: 17, errorType: 'STRUCTURED_OUTPUT_ERROR' })
  })
  it.each([
    [401, 'AUTH_ERROR', 1],
    [403, 'AUTH_ERROR', 1],
    [400, 'MODEL_ERROR', 1],
    [404, 'MODEL_ERROR', 1],
    [429, 'RATE_LIMIT', 3],
    [503, 'MODEL_ERROR', 3],
    [408, 'TIMEOUT', 3],
  ] as const)(
    'maps HTTP %i to %s and performs %i transport calls',
    async (status, errorType, calls) => {
      const fetcher = vi.fn(async () => new Response(`upstream ${config.apiKey}`, { status }))
      const sleep = vi.fn(async () => {})
      const obs = observer()
      await expect(
        new LLMRuntime(
          new OpenAICompatibleLLMProvider(config, fetcher),
          {},
          { now: Date.now, sleep },
        ).generateStructured(request, obs.context),
      ).rejects.toMatchObject({ type: errorType })
      expect(fetcher).toHaveBeenCalledTimes(calls)
      expect(sleep.mock.calls.map((c) => c[0])).toEqual(calls === 3 ? [250, 500] : [])
      expect(obs.usage).toHaveLength(calls)
      expect(JSON.stringify(obs)).not.toContain(config.apiKey)
    },
  )
  it('recovers transient network failures with bounded retry accounting', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('socket contains secret'))
      .mockResolvedValueOnce(response())
    const obs = observer()
    await new LLMRuntime(new OpenAICompatibleLLMProvider(config, fetcher), {
      backoffMs: 0,
    }).generateStructured(request, obs.context)
    expect(obs.usage.map((u) => u.status)).toEqual(['FAILED', 'SUCCESS'])
    expect(obs.usage[1].retryCount).toBe(1)
  })
  it('bounds even a non-cooperative provider and aborts the pending call', async () => {
    vi.useFakeTimers()
    try {
      let signal: AbortSignal | undefined
      const provider = new MockLLMProvider((req) => {
        signal = req.signal
        return new Promise(() => {})
      })
      const obs = observer()
      const pending = new LLMRuntime(provider, { timeoutMs: 30, maxRetries: 0 }).generateStructured(
        request,
        obs.context,
      )
      const rejection = expect(pending).rejects.toMatchObject({ type: 'TIMEOUT' })
      await vi.advanceTimersByTimeAsync(31)
      await rejection
      expect(signal?.aborted).toBe(true)
      expect(obs.usage[0].errorType).toBe('TIMEOUT')
    } finally {
      vi.useRealTimers()
    }
  })
  it.each(['```json\n{"answer":25}\n```', '{', '{"answer":25,"extra":true}'])(
    'rejects malformed or non-strict output without transport retry',
    async (content) => {
      const fetcher = vi.fn(async () => response(content))
      await expect(
        new LLMRuntime(new OpenAICompatibleLLMProvider(config, fetcher)).generateStructured(
          request,
          observer().context,
        ),
      ).rejects.toMatchObject({ type: 'STRUCTURED_OUTPUT_ERROR' })
      expect(fetcher).toHaveBeenCalledTimes(1)
    },
  )
  it.each(['length', 'content_filter', 'tool_calls'])(
    'rejects incomplete/refused finish %s',
    async (finish) => {
      await expect(
        new OpenAICompatibleLLMProvider(config, async () =>
          response('{"answer":25}', finish),
        ).generateStructured(request),
      ).rejects.toMatchObject({ type: 'INVALID_RESPONSE' })
    },
  )
  it('rejects refusal, malformed envelopes and oversized bodies without echoing content', async () => {
    for (const body of [
      JSON.stringify({ choices: [] }),
      JSON.stringify({
        choices: [{ message: { content: null, refusal: config.apiKey }, finish_reason: 'stop' }],
      }),
      'x'.repeat(262145),
    ]) {
      await expect(
        new OpenAICompatibleLLMProvider(config, async () => new Response(body)).generateStructured(
          request,
        ),
      ).rejects.toMatchObject({ type: 'INVALID_RESPONSE' })
    }
  })
  it('maps unknown errors without leaking them, and validates retry config', async () => {
    const obs = observer()
    await expect(
      new LLMRuntime(
        new MockLLMProvider(() => {
          throw new Error(config.apiKey)
        }),
      ).generateStructured(request, obs.context),
    ).rejects.toMatchObject({ type: 'UNKNOWN' })
    expect(JSON.stringify(obs)).not.toContain(config.apiKey)
    expect(() => new LLMRuntime(new MockLLMProvider(() => ({})), { maxRetries: 3 })).toThrow(
      'CONFIG_ERROR',
    )
    expect(() => new LLMRuntime(new MockLLMProvider(() => ({})), { timeoutMs: NaN })).toThrow(
      'CONFIG_ERROR',
    )
    expect(() => rejectClientLLMKey({ VITE_LLM_API_KEY: config.apiKey })).toThrow('CONFIG_ERROR')
    expect(() =>
      readLLMConfig({
        LLM_PROVIDER: 'OPENAI_COMPATIBLE',
        LLM_BASE_URL: 'http://remote.example',
        LLM_MODEL: 'm',
        LLM_API_KEY: 'x',
      }),
    ).toThrow('CONFIG_ERROR')
    expect(readLLMConfig({}).provider).toBe('MOCK')
    expect(() => {
      throw new LLMError('SCHEMA_ERROR')
    }).toThrow('SCHEMA_ERROR')
  })
  it('runs the compatible protocol against a local HTTP server', async () => {
    let received = ''
    const server = createServer(async (req, res) => {
      for await (const chunk of req) received += chunk.toString()
      res.setHeader('Content-Type', 'application/json')
      res.end(await response().text())
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    try {
      const address = server.address() as { port: number }
      const result = await new LLMRuntime(
        new OpenAICompatibleLLMProvider({
          ...config,
          baseURL: `http://127.0.0.1:${address.port}/v1`,
        }),
      ).generateStructured(request, observer().context)
      expect(result.data).toEqual({ answer: 25 })
      expect(JSON.parse(received).model).toBe(config.model)
      expect(received).not.toContain(config.apiKey)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
