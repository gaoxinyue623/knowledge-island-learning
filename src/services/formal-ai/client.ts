import { z } from 'zod'
import { accountOwner, accountGeneration } from '@/services/account/storage'
import { aiSessionSchema, type AiContext, type AiSession } from './contract'

export class AiApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
export async function aiRequest(
  path: string,
  options: { username?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<unknown> {
  const initialOwner = accountOwner(),
    initialGeneration = accountGeneration()
  if (options.username && initialOwner && initialOwner !== options.username)
    throw new AiApiError('SESSION_CHANGED', '账号已切换，请重新进入练习。')
  const controller = new AbortController()
  const abort = () => controller.abort()
  const timeout = setTimeout(abort, 70000)
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) abort()
  try {
    const response = await fetch(`/api/pet/${path}`, {
      method: options.body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Knowledge-Island': 'pet-v2',
        ...(options.username ? { 'X-Pet-Account': options.username } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    })
    const body: unknown = await response.json()
    if (
      initialOwner &&
      (accountOwner() !== initialOwner || accountGeneration() !== initialGeneration)
    )
      throw new AiApiError('SESSION_CHANGED', '账号记录已切换，请重新进入练习。')
    if (!response.ok) {
      const parsed = z.object({ code: z.string().optional(), error: z.string() }).safeParse(body)
      if (
        typeof window !== 'undefined' &&
        (response.status === 401 || (parsed.success && parsed.data.code === 'SESSION_CHANGED'))
      )
        window.dispatchEvent(new Event('ki-session-expired'))
      throw new AiApiError(
        response.status === 401
          ? 'AUTH_REQUIRED'
          : parsed.success
            ? (parsed.data.code ?? 'AI_REQUEST_FAILED')
            : 'AI_REQUEST_FAILED',
        parsed.success ? parsed.data.error : '请求未完成，请稍后重试。',
      )
    }
    return body
  } catch (error) {
    if (error instanceof AiApiError) throw error
    throw new AiApiError('NETWORK_ERROR', '连接暂时中断。重试会恢复同一次出题，请勿反复新建练习。')
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abort)
  }
}
export function parseAiSession(value: unknown, context: AiContext): AiSession {
  const result = z.object({ session: aiSessionSchema }).parse(value).session
  if (
    result.profileId !== context.profileId ||
    result.textbookId !== context.textbookId ||
    result.knowledgePointId !== context.knowledgePointId
  )
    throw new AiApiError('AI_CONTEXT_MISMATCH', '练习与当前学习档案不一致，请重新进入。')
  return result
}
