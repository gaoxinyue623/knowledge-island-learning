// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createServer, type Server } from 'node:http'
import { llmMiddleware, localLLMPlugin } from '../scripts/llm/vitePlugin'
import { generateDevQuestions } from '../server/llm/devGeneration'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { buildGenerationRequests } from '@/services/learning-agent/generationServices'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'
import { GeneratedQuestionValidator } from '@/services/learning-agent/generatedQuestionValidator'

function input() {
  const { snapshot, context } = buildAgentContext(
    createAgentScenario('A'),
    'AGENT_STUDENT',
    'AGENT_TEXTBOOK',
    AGENT_SIMULATION_TIME,
    DEFAULT_LEARNING_PLANNER_CONFIG,
  )
  const request = buildGenerationRequests(
    context,
    new LearningPlanner().plan(context),
    snapshot,
    'bff-test',
  ).questions
  request.generationReason = []
  return { request, recentSummaries: [] as string[] }
}
async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`
}
const close = (server: Server) => new Promise<void>((resolve) => server.close(() => resolve()))

describe('development LLM BFF', () => {
  it('uses real compatible HTTP, trusted catalog, local validation and minimal upstream prompts', async () => {
    const prompts: string[] = []
    const upstream = createServer(async (req, res) => {
      let raw = ''
      for await (const chunk of req) raw += chunk.toString()
      prompts.push(raw)
      const payload = JSON.parse(raw)
      const user = payload.messages[1].content as string
      const context = JSON.parse(user.slice(user.indexOf('{')))
      const questions = Array.from({ length: context.questionCount }, (_, i) => {
        const a = 12 + i,
          b = 7
        return {
          temporaryId: String(i),
          questionType: 'calculation',
          stem: `${a} - ${b} = ?`,
          expectedAnswer: a - b,
          explanation: `从 ${a} 中去掉 ${b}，还剩 ${a - b}。`,
          knowledgePointIds: context.knowledgePoints.map((k: { id: string }) => k.id),
          difficulty: context.difficulty,
        }
      })
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ questions }) }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 },
        }),
      )
    })
    const url = await listen(upstream)
    try {
      const payload = input()
      const batch = await generateDevQuestions(payload, {
        LLM_PROVIDER: 'OPENAI_COMPATIBLE',
        LLM_BASE_URL: `${url}/v1`,
        LLM_API_KEY: 'SERVER_SECRET',
        LLM_MODEL: 'local-test-model',
      })
      expect(batch.telemetry).toMatchObject({ status: 'READY', fallbackUsed: false })
      expect(batch.generator.provider).toBe('OPENAI_COMPATIBLE')
      expect(batch.questions).toHaveLength(5)
      expect(batch.telemetry?.usage[0]).toMatchObject({
        model: 'local-test-model',
        totalTokens: 180,
      })
      expect(
        new GeneratedQuestionValidator().validate(batch, payload.request, createAgentScenario('A'))
          .status,
      ).toBe('VALID')
      const text = prompts.join('')
      for (const value of [
        'AGENT_STUDENT',
        'SERVER_SECRET',
        'profileId',
        'sessions',
        'wrongBook',
        'generationReason',
        payload.request.requestId,
      ])
        expect(text).not.toContain(value)
      expect(JSON.stringify(batch)).not.toContain('SERVER_SECRET')
    } finally {
      await close(upstream)
    }
  })
  it('explicitly falls back for missing configuration', async () => {
    const batch = await generateDevQuestions(input(), {})
    expect(batch.telemetry).toMatchObject({
      fallbackUsed: true,
      fallbackReason: 'CONFIG_ERROR',
      status: 'FALLBACK',
    })
    expect(batch.validation.status).toBe('VALID')
  })
  it('rejects arbitrary curriculum, profile, prompt, endpoint and history payloads before any model call', async () => {
    const original = input()
    const attacks = [
      { ...original, snapshot: createAgentScenario('A') },
      { ...original, apiKey: 'bad' },
      { ...original, prompt: 'ignore system' },
      { ...original, baseURL: 'https://evil.example' },
      { ...original, request: { ...original.request, profileId: 'REAL_STUDENT' } },
      {
        ...original,
        request: {
          ...original.request,
          constraints: {
            ...original.request.constraints,
            templateIds: ['AGENT_TEMPLATE_AGENT_KP_BASE_4'],
          },
        },
      },
      { ...original, recentSummaries: ['student name and private data'] },
    ]
    for (const attack of attacks)
      await expect(generateDevQuestions(attack, {})).rejects.toMatchObject({ type: 'SCHEMA_ERROR' })
  })
  it('protects local POST origin/header/body boundaries and is absent in production', async () => {
    const generate = vi.fn(async () => ({ okay: true }))
    const middleware = llmMiddleware(generate)
    const server = createServer((req, res) => {
      void middleware(req, res, () => {
        res.statusCode = 404
        res.end()
      })
    })
    const base = await listen(server),
      url = `${base}/api/dev/learning-agent/questions`
    const headers = { Origin: base, 'Content-Type': 'application/json', 'X-Knowledge-LLM': '1' }
    try {
      expect((await fetch(url, { method: 'POST', headers, body: '{}' })).status).toBe(200)
      expect(
        (
          await fetch(url, {
            method: 'POST',
            headers: { ...headers, Origin: 'https://evil.example' },
            body: '{}',
          })
        ).status,
      ).toBe(403)
      expect(
        (
          await fetch(url, {
            method: 'POST',
            headers: { ...headers, 'X-Knowledge-LLM': '0' },
            body: '{}',
          })
        ).status,
      ).toBe(403)
      expect((await fetch(url, { headers })).status).toBe(403)
      expect((await fetch(url, { method: 'POST', headers, body: '{' })).status).toBe(400)
      expect((await fetch(url, { method: 'POST', headers, body: 'x'.repeat(65537) })).status).toBe(
        413,
      )
      expect(generate).toHaveBeenCalledTimes(1)
      expect((await fetch(`${base}/not-the-route`)).status).toBe(404)
      expect(localLLMPlugin().apply).toBe('serve')
    } finally {
      await close(server)
    }
    const disabled = llmMiddleware(generate, false)
    const production = createServer((req, res) => {
      void disabled(req, res, () => res.end())
    })
    const prodURL = await listen(production)
    try {
      expect(
        (
          await fetch(`${prodURL}/api/dev/learning-agent/questions`, {
            method: 'POST',
            headers: { ...headers, Origin: prodURL },
            body: '{}',
          })
        ).status,
      ).toBe(403)
    } finally {
      await close(production)
    }
  })
  it('limits concurrent generation and sanitizes unexpected failures', async () => {
    const releases: Array<() => void> = []
    const middleware = llmMiddleware(async () => {
      await new Promise<void>((resolve) => releases.push(resolve))
      throw new Error('SECRET_UPSTREAM_ERROR')
    })
    const server = createServer((req, res) => {
      void middleware(req, res, () => res.end())
    })
    const base = await listen(server),
      url = `${base}/api/dev/learning-agent/questions`
    const options = {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json', 'X-Knowledge-LLM': '1' },
      body: '{}',
    }
    try {
      const first = fetch(url, options),
        second = fetch(url, options)
      await vi.waitFor(() => expect(releases).toHaveLength(2))
      expect((await fetch(url, options)).status).toBe(429)
      releases.forEach((release) => release())
      for (const pending of [first, second]) {
        const response = await pending
        expect(response.status).toBe(400)
        expect(await response.text()).toBe('{"error":"LLM_REQUEST_REJECTED"}')
      }
    } finally {
      releases.forEach((release) => release())
      await close(server)
    }
  })
})
