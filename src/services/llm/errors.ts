import type { LLMErrorType, LLMTokenUsage, LLMTransportDiagnostics } from '@/types/llm'

/** Canned messages only. Never attach upstream HTTP bodies, headers or credentials. */
export class LLMError extends Error {
  constructor(
    readonly type: LLMErrorType,
    readonly transient = false,
    readonly usage: LLMTokenUsage = {},
    /** Local-only salvage input. Never included in usage, trace, JSON or server responses. */
    invalidData?: unknown,
    readonly diagnostics?: LLMTransportDiagnostics,
  ) {
    super(type)
    Object.defineProperty(this, 'invalidData', { value: invalidData, enumerable: false })
  }
  declare readonly invalidData?: unknown
}
export function asLLMError(error: unknown): LLMError {
  if (error instanceof LLMError) return error
  return new LLMError('UNKNOWN')
}
