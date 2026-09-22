import { LLMError } from '../../src/services/llm/errors'
import type { LLMRuntimeConfig } from '../../src/types/llm'

export interface OpenAICompatibleConfig {
  baseURL: string
  apiKey: string
  model: string
  nativeStructuredOutput: boolean
  thinkingMode?: 'disabled'
}
export function rejectClientLLMKey(env: Record<string, string | undefined>) {
  if (env.VITE_LLM_API_KEY) throw new LLMError('CONFIG_ERROR')
}
export function readLLMConfig(env: Record<string, string | undefined>): {
  provider: 'MOCK' | 'OPENAI_COMPATIBLE'
  adapter?: OpenAICompatibleConfig
  runtime: Partial<LLMRuntimeConfig>
} {
  rejectClientLLMKey(env)
  const provider = env.LLM_PROVIDER || 'MOCK'
  if (provider !== 'MOCK' && provider !== 'OPENAI_COMPATIBLE') throw new LLMError('CONFIG_ERROR')
  const runtime = {
    timeoutMs: Number(env.LLM_TIMEOUT_MS || 30000),
    maxRetries: Number(env.LLM_MAX_RETRIES || 2),
    backoffMs: 250,
    maxBackoffMs: 2000,
  }
  if (provider === 'MOCK') return { provider, runtime }
  const baseURL = env.LLM_BASE_URL ?? '',
    apiKey = env.LLM_API_KEY ?? '',
    model = env.LLM_MODEL ?? ''
  let url: URL
  try {
    url = new URL(baseURL)
  } catch {
    throw new LLMError('CONFIG_ERROR')
  }
  if (
    !model.trim() ||
    !apiKey.trim() ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !['http:', 'https:'].includes(url.protocol) ||
    (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  )
    throw new LLMError('CONFIG_ERROR')
  if (
    env.LLM_NATIVE_STRUCTURED_OUTPUT &&
    !['true', 'false'].includes(env.LLM_NATIVE_STRUCTURED_OUTPUT)
  )
    throw new LLMError('CONFIG_ERROR')
  if (env.LLM_THINKING_MODE && env.LLM_THINKING_MODE !== 'disabled')
    throw new LLMError('CONFIG_ERROR')
  return {
    provider,
    adapter: {
      baseURL,
      apiKey,
      model,
      nativeStructuredOutput: env.LLM_NATIVE_STRUCTURED_OUTPUT !== 'false',
      ...(env.LLM_THINKING_MODE === 'disabled' ? { thinkingMode: 'disabled' as const } : {}),
    },
    runtime,
  }
}
