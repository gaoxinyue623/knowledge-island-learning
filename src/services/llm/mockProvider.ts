import type { LLMProvider, LLMStructuredRequest, LLMStructuredResult } from '@/types/llm'
import { validateStructured } from './structuredOutput'

/** Scriptable structured provider for deterministic tests and local protocol evaluation. */
export class MockLLMProvider implements LLMProvider {
  readonly providerId = 'MOCK'
  readonly model = 'structured-fixture-v1'
  readonly capabilities = { nativeStructuredOutput: false }
  constructor(
    private readonly respond: (
      request: LLMStructuredRequest<unknown>,
    ) => unknown | Promise<unknown>,
  ) {}
  async generateStructured<T>(request: LLMStructuredRequest<T>): Promise<LLMStructuredResult<T>> {
    const start = Date.now()
    const data = validateStructured(await this.respond(request), request)
    return {
      requestId: request.requestId,
      provider: this.providerId,
      model: this.model,
      data,
      usage: {},
      latencyMs: Date.now() - start,
      rawResponseAvailable: false,
      createdAt: new Date().toISOString(),
    }
  }
}
