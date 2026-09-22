import type { z } from 'zod'

export type LLMErrorType =
  | 'CONFIG_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'MODEL_ERROR'
  | 'INVALID_RESPONSE'
  | 'STRUCTURED_OUTPUT_ERROR'
  | 'SCHEMA_ERROR'
  | 'UNKNOWN'
export interface LLMProviderCapabilities {
  nativeStructuredOutput: boolean
}
export interface LLMTokenUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}
export interface LLMStructuredRequest<T> {
  requestId: string
  model?: string
  systemPrompt: string
  userPrompt: string
  schema: z.ZodType<T>
  jsonSchema: Record<string, unknown>
  schemaName: string
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
  signal?: AbortSignal
  metadata?: Record<string, unknown>
}
export interface LLMTransportDiagnostics {
  httpStatus?: number
  finishReason?: 'stop' | 'length' | 'content_filter' | 'other'
  responseBytes?: number
  contentCharacters?: number
  reasoningCharacters?: number
  promptCharacters?: number
  outputTokenLimit?: number
}
export interface LLMStructuredResult<T> {
  diagnostics?: LLMTransportDiagnostics
  requestId: string
  provider: string
  model: string
  data: T
  usage: LLMTokenUsage
  latencyMs: number
  finishReason?: string
  rawResponseAvailable: boolean
  createdAt: string
}
export interface LLMProvider {
  readonly providerId: string
  readonly model: string
  readonly capabilities: LLMProviderCapabilities
  generateStructured<T>(request: LLMStructuredRequest<T>): Promise<LLMStructuredResult<T>>
}
export interface LLMRuntimeConfig {
  timeoutMs: number
  maxRetries: number
  backoffMs: number
  maxBackoffMs: number
}
export interface LLMUsageRecord extends LLMTokenUsage {
  diagnostics?: LLMTransportDiagnostics
  requestId: string
  provider: string
  model: string
  promptId: string
  promptVersion: string
  schemaVersion: string
  latencyMs: number
  retryCount: number
  repairCount: number
  status: 'SUCCESS' | 'FAILED'
  errorType?: LLMErrorType
  estimatedCost?: number
  createdAt: string
}
export interface LLMPricingResolver {
  estimate(record: LLMUsageRecord): number | undefined
}
export interface LLMTraceEvent {
  event: string
  at: string
  data: Record<string, unknown>
}
export type QuestionGeneratorMode = 'MOCK' | 'REAL_LLM'
export interface QuestionGenerationTelemetry {
  mode: QuestionGeneratorMode
  fallbackUsed: boolean
  fallbackReason?: string
  repairCount: number
  status: 'READY' | 'REJECTED' | 'FALLBACK'
  usage: LLMUsageRecord[]
  events: LLMTraceEvent[]
  attempts?: GenerationAttemptAudit[]
  origins?: Record<string, 'REAL_LLM' | 'MOCK'>
  chunkCount?: number
}

/** Numeric diagnostics only: no model payloads, prompts or secrets. */
export interface GenerationAttemptAudit {
  failedItems?: Array<{
    stem: string | null
    expectedAnswer?: number
    difficulty?: number
    errors: string[]
  }>
  attempt: number
  requested: number
  received: number
  accepted: number
  schemaValid: number
  mathCorrect: number
  knowledgeMatch: number
  constraintValid: number
  exactDuplicates: number
  normalizedDuplicates: number
  errors: string[]
  terminal: boolean
}
