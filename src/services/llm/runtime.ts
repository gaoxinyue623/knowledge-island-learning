import type {
  LLMProvider,
  LLMRuntimeConfig,
  LLMStructuredRequest,
  LLMStructuredResult,
  LLMTraceEvent,
  LLMUsageRecord,
  LLMPricingResolver,
} from '@/types/llm'
import { LLMError, asLLMError } from './errors'
import { validateStructured } from './structuredOutput'

export const DEFAULT_LLM_RUNTIME_CONFIG: LLMRuntimeConfig = {
  timeoutMs: 30000,
  maxRetries: 2,
  backoffMs: 250,
  maxBackoffMs: 2000,
}
export interface RuntimeObservation {
  promptId: string
  promptVersion: string
  schemaVersion: string
  repairCount: number
  onUsage: (usage: LLMUsageRecord) => void
  onEvent: (event: LLMTraceEvent) => void
}
export class LLMRuntime {
  readonly config: LLMRuntimeConfig
  constructor(
    readonly provider: LLMProvider,
    config: Partial<LLMRuntimeConfig> = {},
    private readonly timing = {
      now: () => Date.now(),
      sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    },
    private readonly pricing?: LLMPricingResolver,
  ) {
    this.config = { ...DEFAULT_LLM_RUNTIME_CONFIG, ...config }
    const c = this.config
    if (
      !Number.isInteger(c.maxRetries) ||
      c.maxRetries < 0 ||
      c.maxRetries > 2 ||
      !Number.isFinite(c.timeoutMs) ||
      c.timeoutMs < 1 ||
      c.timeoutMs > 60000 ||
      !Number.isFinite(c.backoffMs) ||
      c.backoffMs < 0 ||
      !Number.isFinite(c.maxBackoffMs) ||
      c.maxBackoffMs < c.backoffMs ||
      c.maxBackoffMs > 5000
    )
      throw new LLMError('CONFIG_ERROR')
  }
  async generateStructured<T>(
    request: LLMStructuredRequest<T>,
    observation: RuntimeObservation,
  ): Promise<LLMStructuredResult<T>> {
    const emit = (event: string, data: Record<string, unknown> = {}) =>
      observation.onEvent({
        event,
        at: new Date(this.timing.now()).toISOString(),
        data: {
          requestId: request.requestId,
          promptId: observation.promptId,
          promptVersion: observation.promptVersion,
          schemaVersion: observation.schemaVersion,
          ...data,
        },
      })
    emit('LLM_REQUEST_CREATED')
    for (let retry = 0; retry <= this.config.maxRetries; retry++) {
      const start = this.timing.now(),
        controller = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined
      let result: LLMStructuredResult<T> | undefined
      try {
        emit('LLM_REQUEST_STARTED', { retryCount: retry, provider: this.provider.providerId })
        const timeoutMs = request.timeoutMs ?? this.config.timeoutMs
        if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000)
          throw new LLMError('CONFIG_ERROR')
        result = await Promise.race([
          this.provider.generateStructured({ ...request, signal: controller.signal }),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              reject(new LLMError('TIMEOUT', true))
              controller.abort()
            }, timeoutMs)
          }),
        ])
        emit('LLM_RESPONSE_RECEIVED')
        result.data = validateStructured(result.data, request, result.usage)
        emit('STRUCTURED_OUTPUT_PARSED')
        this.record(request, observation, start, retry, result)
        return result
      } catch (raw) {
        const error = asLLMError(raw)
        if (error.type === 'STRUCTURED_OUTPUT_ERROR' || error.type === 'INVALID_RESPONSE') {
          if (!result) emit('LLM_RESPONSE_RECEIVED')
          emit('STRUCTURED_OUTPUT_INVALID', { errorType: error.type })
        }
        this.record(request, observation, start, retry, result, error)
        if (
          !error.transient ||
          !['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT', 'MODEL_ERROR'].includes(error.type) ||
          retry === this.config.maxRetries
        )
          throw error
      } finally {
        if (timer) clearTimeout(timer)
      }
      await this.timing.sleep(
        Math.min(this.config.maxBackoffMs, this.config.backoffMs * 2 ** retry),
      )
    }
    throw new LLMError('UNKNOWN')
  }
  private record<T>(
    request: LLMStructuredRequest<T>,
    observation: RuntimeObservation,
    start: number,
    retryCount: number,
    result?: LLMStructuredResult<T>,
    error?: LLMError,
  ) {
    const usage: LLMUsageRecord = {
      requestId: request.requestId,
      provider: this.provider.providerId,
      model: this.provider.model,
      promptId: observation.promptId,
      promptVersion: observation.promptVersion,
      schemaVersion: observation.schemaVersion,
      ...result?.usage,
      ...error?.usage,
      latencyMs: Math.max(0, this.timing.now() - start),
      retryCount,
      repairCount: observation.repairCount,
      status: error ? 'FAILED' : 'SUCCESS',
      errorType: error?.type,
      createdAt: new Date(this.timing.now()).toISOString(),
      diagnostics: {
        promptCharacters: request.systemPrompt.length + request.userPrompt.length,
        outputTokenLimit: request.maxOutputTokens,
        ...result?.diagnostics,
        ...error?.diagnostics,
      },
    }
    try {
      usage.estimatedCost = this.pricing?.estimate(usage)
    } catch {
      /* Optional accounting cannot interrupt generation. */
    }
    observation.onUsage(usage)
  }
}
