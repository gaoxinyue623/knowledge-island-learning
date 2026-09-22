import type {
  GeneratedQuestionBatch,
  LearningAgentSnapshot,
  QuestionGenerationRequest,
  QuestionGeneratorProvider,
} from '@/types/learning-agent'
import { productionConfig } from '@/config/production'
import { recentQuestionSummaries } from '../llm/questionPromptBuilder'

/** Browser BFF adapter: no provider configuration, credentials or prompts cross this boundary. */
export class DevQuestionGeneratorClient implements QuestionGeneratorProvider {
  constructor(
    private readonly snapshot: LearningAgentSnapshot,
    private readonly fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {}
  async generate(request: QuestionGenerationRequest): Promise<GeneratedQuestionBatch> {
    if (!productionConfig.devRoutes || this.snapshot.dataset !== 'demo')
      throw new Error('AGENT_PRODUCTION_DELIVERY_DISABLED')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 600000)
    try {
      const response = await this.fetcher('/api/agent/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Knowledge-LLM': '1' },
        signal: controller.signal,
        body: JSON.stringify({
          request: { ...request, generationReason: [] },
          recentSummaries: recentQuestionSummaries(request, this.snapshot),
        }),
      })
      if (!response.ok) throw new Error('LLM_DEV_SERVICE_UNAVAILABLE')
      return (await response.json()) as GeneratedQuestionBatch
    } catch {
      throw new Error('LLM_DEV_SERVICE_UNAVAILABLE')
    } finally {
      clearTimeout(timer)
    }
  }
}
