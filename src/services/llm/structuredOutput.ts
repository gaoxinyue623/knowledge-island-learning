import type { LLMStructuredRequest, LLMTokenUsage } from '@/types/llm'
import { LLMError } from './errors'

export function validateStructured<T>(
  data: unknown,
  request: LLMStructuredRequest<T>,
  usage = {} as LLMTokenUsage,
): T {
  const parsed = request.schema.safeParse(data)
  if (!parsed.success) throw new LLMError('STRUCTURED_OUTPUT_ERROR', false, usage, data)
  return parsed.data
}
export function parseStructured<T>(
  text: string,
  request: LLMStructuredRequest<T>,
  usage: LLMTokenUsage,
): T {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new LLMError('STRUCTURED_OUTPUT_ERROR', false, usage)
  }
  return validateStructured(data, request, usage)
}
