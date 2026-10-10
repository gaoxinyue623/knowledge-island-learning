import { z } from 'zod'
import { aiRequest, AiApiError } from './client'
import { accountOwner, accountGeneration, accountStorage } from '@/services/account/storage'
export const aiSignalSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  questionId: z.string(),
  profileId: z.string(),
  textbookId: z.string(),
  knowledgePointId: z.string(),
  correct: z.boolean(),
  occurredAt: z.string(),
  difficulty: z.number().min(1).max(5),
  stem: z.string(),
  answer: z.string(),
  expected: z.string(),
  explanation: z.string(),
  resolved: z.boolean(),
})
export type AiLearningSignal = z.infer<typeof aiSignalSchema>
const response = z.object({ signals: z.array(aiSignalSchema).max(3000) })
export async function readAiSignals(
  profileId: string,
  textbookId?: string,
): Promise<AiLearningSignal[]> {
  const owner = accountOwner(),
    generation = accountGeneration()
  if (!owner) return []
  const key = `knowledge-island.ai-signals.v1:${profileId}:${textbookId ?? 'all'}`
  try {
    const data = response.parse(
      await aiRequest(
        `ai/learning?${new URLSearchParams({ profileId, ...(textbookId ? { textbookId } : {}) })}`,
        { username: owner },
      ),
    )
    if (accountOwner() !== owner || accountGeneration() !== generation)
      throw new AiApiError('SESSION_CHANGED', '账号已切换，请重新进入学习。')
    accountStorage.setItem(key, JSON.stringify(data))
    return data.signals
  } catch (error) {
    if (accountOwner() !== owner || accountGeneration() !== generation)
      throw new AiApiError('SESSION_CHANGED', '账号已切换，请重新进入学习。')
    if (error && typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR') {
      const saved = accountStorage.getItem(key)
      if (saved) return response.parse(JSON.parse(saved)).signals
      return []
    }
    throw error
  }
}
