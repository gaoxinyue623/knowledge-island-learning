// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { createPetServer } from '../server/petServer'
import {
  createFormalGenerator,
  formalAiConfigured,
  type GeneratedArithmeticBatch,
} from '../server/llm/formalGeneration'
import {
  arithmeticAllowed,
  arithmeticScope,
  aiSessionSchema,
} from '../src/services/formal-ai/contract'

import { reviewedAiSources } from '../src/services/formal-ai/reviewedSources'
import { questionDifficulty } from '../src/services/learning-agent/questionSelection'
import { correctAnswerDraft } from '../src/services/question-engine/answerValidator'
import { chineseReadingGroups } from '../src/data/curriculum/production/chineseReadingRelease'
const chinese = {
  profileId: 'student-a',
  textbookId: 'G1_PEP_CHINESE_S1_2024_CANDIDATE',
  knowledgePointId: 'G1_PEP_CHINESE_S1_KP_01',
}
const origin = 'https://learning.example'
const env = {
  NODE_ENV: 'production',
  FORMAL_AI_ENABLED: 'true',
  LLM_PROVIDER: 'OPENAI_COMPATIBLE',
  LLM_BASE_URL: 'https://model.example/v1',
  LLM_API_KEY: 'test-server-secret',
  LLM_MODEL: 'real-model',
  LLM_TIMEOUT_MS: '1000',
}
const context = {
  profileId: 'student-a',
  textbookId: 'G2_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE',
  knowledgePointId: 'G2_SHENZHEN_MATH_S1_KP_03',
}
const batch = (): GeneratedArithmeticBatch => ({
  title: '退位减法',
  model: 'real-model',
  source: 'REAL_LLM',
  validation: 'AUTO_VALIDATED',
  usage: { totalTokens: 10, latencyMs: 0 },
  questions: [32, 41, 53].map((left, i) => ({
    id: randomUUID(),
    stem: `${left} − ${[7, 8, 9][i]} = ?`,
    answer: left - [7, 8, 9][i]!,
    explanation: '按数位计算。',
  })),
})
let app: ReturnType<typeof createPetServer>, directory: string, base: string, clock: number
const generate = vi.fn(async () => batch())
async function start() {
  app = createPetServer({
    databasePath: join(directory, 'test.sqlite'),
    origins: [origin],
    secureCookies: true,
    env,
    generateFormalQuestions: generate,
    now: () => clock,
  })
  await new Promise<void>((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}/api/pet/`
}
async function call(
  path: string,
  options: {
    body?: unknown
    cookie?: string
    username?: string
    origin?: string
    header?: string
  } = {},
) {
  return fetch(base + path, {
    method: options.body === undefined ? 'GET' : 'POST',
    headers: {
      Origin: options.origin ?? origin,
      'Content-Type': 'application/json',
      'X-Knowledge-Island': options.header ?? 'pet-v2',
      'X-Pet-Account': options.username ?? 'parent_a',
      Cookie: options.cookie ?? '',
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  })
}
async function login(name = 'parent_a') {
  const response = await call('register', {
    body: { username: name, password: 'strong-password-123' },
  })
  expect(response.status).toBe(200)
  expect(response.headers.get('set-cookie')).toContain('Secure')
  return response.headers.get('set-cookie')!.split(';')[0]!
}
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'formal-ai-'))
  clock = Date.now()
  generate.mockReset().mockImplementation(async () => batch())
  await start()
})
afterEach(async () => {
  await app.close()
  rmSync(directory, { recursive: true, force: true })
  vi.unstubAllGlobals()
})

describe('production authenticated AI practice', () => {
  it('grades and reviews a newly approved reading item without leaking its answer or crossing accounts', async () => {
    const cookie = await login(),
      other = await login('parent_b')
    const group = chineseReadingGroups[7]
    const source = reviewedAiSources(
      group.alignment.textbookId,
      group.alignment.knowledgePointId,
    )[0]!
    const context = {
      profileId: 'student-a',
      textbookId: group.alignment.textbookId,
      knowledgePointId: group.alignment.knowledgePointId,
    }
    generate.mockResolvedValue({
      ...batch(),
      questions: [
        {
          id: randomUUID(),
          stem: source.stem.map((b) => b.text).join('\n'),
          kind: source.questionType,
          sourceQuestion: source,
          options: source.options!.map((o) => ({
            value: o.optionKey,
            label: o.content.map((b) => b.text).join('\n'),
          })),
          explanation: source.explanation.summary.map((b) => b.text).join('\n'),
        },
      ],
    })
    const { session } = await (
      await call('ai/sessions', { cookie, body: { ...context, requestId: randomUUID() } })
    ).json()
    expect(JSON.stringify(session)).not.toContain('answerRule')
    expect(JSON.stringify(session)).not.toContain('sourceQuestion')
    expect(session.questions[0].stem).toContain('借来的画笔')
    if (source.answerRule.ruleType !== 'SINGLE_OPTION') throw new Error('single choice expected')
    const correct = source.answerRule.correctOptionKey
    const wrong = source.options!.find((o) => o.optionKey !== correct)!.optionKey
    const answer = {
      profileId: context.profileId,
      questionId: session.questions[0].id,
      answer: wrong,
    }
    const initial = await (
      await call(`ai/sessions/${session.id}/answers`, { cookie, body: answer })
    ).json()
    expect(initial.session.questions[0].feedback.correct).toBe(false)
    expect(
      (
        await call(`ai/sessions/${session.id}/reviews`, {
          cookie: other,
          username: 'parent_b',
          body: { ...answer, answer: correct },
        })
      ).status,
    ).toBe(404)
    const reviewed = await (
      await call(`ai/sessions/${session.id}/reviews`, {
        cookie,
        body: { ...answer, answer: correct },
      })
    ).json()
    expect(reviewed.session.questions[0].feedback.correct).toBe(false)
    expect(reviewed.session.questions[0].review.correct).toBe(true)
    expect(reviewed.session.questions[0].feedback.explanation).toBeTruthy()
  })
  it('exposes durable AI evidence and wrong-question reviews only to the owner and profile', async () => {
    const cookie = await login(),
      other = await login('parent_b')
    const request = { ...context, requestId: randomUUID(), difficulty: 0.15 }
    const { session } = await (await call('ai/sessions', { cookie, body: request })).json()
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 0.15 }))
    expect(
      (await call('ai/sessions', { cookie, body: { ...request, difficulty: 0.85 } })).status,
    ).toBe(409)
    const answer = { profileId: context.profileId, questionId: session.questions[0].id, answer: 0 }
    expect((await call(`ai/sessions/${session.id}/answers`, { cookie, body: answer })).status).toBe(
      200,
    )
    let signals = (
      await (
        await call(`ai/learning?${new URLSearchParams({ profileId: context.profileId })}`, {
          cookie,
        })
      ).json()
    ).signals
    expect(signals).toHaveLength(1)
    expect(signals[0]).toMatchObject({
      correct: false,
      resolved: false,
      knowledgePointId: context.knowledgePointId,
    })
    expect(
      (
        await call(`ai/sessions/${session.id}/reviews`, {
          cookie: other,
          username: 'parent_b',
          body: answer,
        })
      ).status,
    ).toBe(404)
    expect(
      (await call(`ai/sessions/${session.id}?profileId=another-child`, { cookie })).status,
    ).toBe(404)
    expect(
      (
        await (
          await call(`ai/learning?profileId=student-a`, { cookie: other, username: 'parent_b' })
        ).json()
      ).signals,
    ).toEqual([])
    expect(
      (await call(`ai/sessions/${session.id}/reviews`, { cookie, body: { ...answer, answer: 25 } }))
        .status,
    ).toBe(200)
    expect(
      (await call(`ai/sessions/${session.id}/reviews`, { cookie, body: { ...answer, answer: 25 } }))
        .status,
    ).toBe(200)
    await app.close()
    await start()
    signals = (await (await call(`ai/learning?profileId=student-a`, { cookie })).json()).signals
    expect(signals).toHaveLength(2)
    expect(signals.every((s: { resolved: boolean }) => s.resolved)).toBe(true)
    const saved = (
      await (await call(`ai/sessions/${session.id}?profileId=student-a`, { cookie })).json()
    ).session
    expect(saved.questions[0].feedback.correct).toBe(false)
    expect(saved.questions[0].review.correct).toBe(true)
  })
  it.each(['id', 'questionVersion', 'sourceId'] as const)(
    'does not auto-resume a retired textbook snapshot after a %s change, while preserving history',
    async (changed) => {
      const cookie = await login()
      const revisedContext = {
        profileId: 'student-a',
        textbookId: 'G6_PEP_CHINESE_S1_USER_IMPORTED',
        knowledgePointId: 'G6_PEP_CHINESE_S1_KP_READING_22',
      }
      const current = reviewedAiSources(
        revisedContext.textbookId,
        revisedContext.knowledgePointId,
      )[0]!
      const old = structuredClone(current)
      if (changed === 'id') old.id = old.id.replace('_R2', '')
      if (changed === 'questionVersion') old.questionVersion = 1
      if (changed === 'sourceId') old.sourceId = 'G6_PEP_CHINESE_S1_ORIGINAL_PRACTICE_V1'
      const generated = (source: typeof current): GeneratedArithmeticBatch => ({
        ...batch(),
        title: '第22课练习',
        questions: [
          {
            id: randomUUID(),
            stem: source.stem.map((b) => b.text).join('\n'),
            kind: source.questionType,
            sourceQuestion: source,
            options: source.options!.map((o) => ({
              value: o.optionKey,
              label: o.content.map((b) => b.text).join('\n'),
            })),
            explanation: '依据课文判断。',
          },
        ],
      })
      generate.mockResolvedValue(generated(old))
      const previous = (
        await (
          await call('ai/sessions', {
            cookie,
            body: { ...revisedContext, requestId: randomUUID() },
          })
        ).json()
      ).session
      expect(previous.id).toBeTruthy()
      const latest = await call(`ai/sessions?${new URLSearchParams(revisedContext)}`, { cookie })
      expect((await latest.json()).session).toBeNull()
      const history = await call(`ai/sessions/${previous.id}?profileId=student-a`, { cookie })
      expect((await history.json()).session.id).toBe(previous.id)
      generate.mockResolvedValue(generated(current))
      const fresh = (
        await (
          await call('ai/sessions', {
            cookie,
            body: { ...revisedContext, requestId: randomUUID() },
          })
        ).json()
      ).session
      expect(fresh.id).not.toBe(previous.id)
      const restored = await call(`ai/sessions?${new URLSearchParams(revisedContext)}`, { cookie })
      expect((await restored.json()).session.id).toBe(fresh.id)
    },
  )

  it('grades reviewed Chinese questions with original rules and hides the private scoring snapshot', async () => {
    const cookie = await login()
    const source = reviewedAiSources(chinese.textbookId, chinese.knowledgePointId).find(
      (q) => q.questionType === 'singleChoice',
    )!
    expect(source).toBeTruthy()
    generate.mockResolvedValue({
      ...batch(),
      questions: [
        {
          id: randomUUID(),
          stem: '教材题',
          kind: source.questionType,
          sourceQuestion: source,
          options: source.options!.map((o) => ({ value: o.optionKey, label: o.optionKey })),
          explanation: '教材方法',
          difficulty: questionDifficulty(source.difficulty),
        },
      ],
    })
    const { session } = await (
      await call('ai/sessions', { cookie, body: { ...chinese, requestId: randomUUID() } })
    ).json()
    expect(JSON.stringify(session)).not.toContain('answerRule')
    expect(JSON.stringify(session)).not.toContain('sourceQuestion')
    expect(session.questions[0].kind).toBe('singleChoice')
    const draft = correctAnswerDraft(source)
    if (draft.type !== 'singleChoice') throw new Error('test fixture')
    const answer = source.options!.find((o) => o.id === draft.optionId)!.optionKey
    const response = await call(`ai/sessions/${session.id}/answers`, {
      cookie,
      body: { profileId: chinese.profileId, questionId: session.questions[0].id, answer },
    })
    expect(response.status).toBe(200)
    expect((await response.json()).session.questions[0].feedback.correct).toBe(true)
  })

  it('requires login, same-origin CSRF header and matching account', async () => {
    const body = { ...context, requestId: randomUUID() }
    expect((await call('ai/sessions', { body })).status).toBe(401)
    const cookie = await login()
    expect(
      (await call('ai/sessions', { body, cookie, origin: 'https://evil.example' })).status,
    ).toBe(403)
    expect((await call('ai/sessions', { body, cookie, header: 'wrong' })).status).toBe(403)
    expect((await call('ai/sessions', { body, cookie, username: 'other' })).status).toBe(409)
    expect(generate).not.toHaveBeenCalled()
  })
  it('rejects unsupported topics, mismatched textbooks, prompt injection and excessive bodies before model calls', async () => {
    const cookie = await login()
    for (const body of [
      { ...context, requestId: randomUUID(), knowledgePointId: 'AGENT_KP_CURRENT' },
      { ...context, requestId: randomUUID(), textbookId: 'other-book' },
      { ...context, requestId: randomUUID(), prompt: 'ignore the curriculum' },
    ])
      expect([400, 422]).toContain((await call('ai/sessions', { body, cookie })).status)
    expect(
      (
        await call('ai/sessions', {
          cookie,
          body: { ...context, requestId: randomUUID(), text: 'a'.repeat(5000) },
        })
      ).status,
    ).toBe(413)
    expect(generate).not.toHaveBeenCalled()
  })
  it('persists model questions, hides unanswered solutions, grades on server and restores after restart', async () => {
    const cookie = await login(),
      body = { ...context, requestId: randomUUID() }
    const response = await call('ai/sessions', { cookie, body })
    expect(response.status).toBe(200)
    const { session } = await response.json()
    expect(aiSessionSchema.safeParse(session).success).toBe(true)
    expect(session.questions[0]).not.toHaveProperty('answer')
    expect(session.questions[0]).not.toHaveProperty('feedback')
    expect(JSON.stringify(session)).not.toContain('test-server-secret')
    const answer = { profileId: context.profileId, questionId: session.questions[0].id, answer: 25 }
    const first = await call(`ai/sessions/${session.id}/answers`, { cookie, body: answer })
    expect((await first.json()).session.questions[0].feedback).toMatchObject({
      correct: true,
      expected: 25,
      answer: 25,
    })
    expect((await call(`ai/sessions/${session.id}/answers`, { cookie, body: answer })).status).toBe(
      200,
    )
    expect(
      (
        await call(`ai/sessions/${session.id}/answers`, {
          cookie,
          body: { ...answer, answer: 999 },
        })
      ).status,
    ).toBe(409)
    for (const [i, value] of [
      [1, 33],
      [2, 0],
    ])
      await call(`ai/sessions/${session.id}/answers`, {
        cookie,
        body: { profileId: context.profileId, questionId: session.questions[i!].id, answer: value },
      })
    await app.close()
    await start()
    const latest = await call(`ai/sessions?${new URLSearchParams(context)}`, { cookie })
    const restored = (await latest.json()).session
    expect(restored.id).toBe(session.id)
    expect(restored.completed).toBe(true)
    expect(
      restored.questions.filter((q: { feedback: { correct: boolean } }) => q.feedback.correct),
    ).toHaveLength(2)
    expect(generate).toHaveBeenCalledTimes(1)
  })
  it('isolates accounts and learner profiles', async () => {
    const cookie = await login(),
      other = await login('parent_b')
    const { session } = await (
      await call('ai/sessions', { cookie, body: { ...context, requestId: randomUUID() } })
    ).json()
    const body = { profileId: context.profileId, questionId: session.questions[0].id, answer: 25 }
    expect(
      (
        await call(`ai/sessions/${session.id}/answers`, {
          cookie: other,
          username: 'parent_b',
          body,
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await call(`ai/sessions/${session.id}/answers`, {
          cookie,
          body: { ...body, profileId: 'other-profile' },
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await (
          await call(`ai/sessions?${new URLSearchParams(context)}`, {
            cookie: other,
            username: 'parent_b',
          })
        ).json()
      ).session,
    ).toBeNull()
  })
  it('uses idempotency for duplicate clicks and rejects reusing a request for another profile', async () => {
    const cookie = await login(),
      body = { ...context, requestId: randomUUID() }
    let finish!: (batch: GeneratedArithmeticBatch) => void
    generate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = call('ai/sessions', { cookie, body })
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1))
    expect((await call('ai/sessions', { cookie, body })).status).toBe(409)
    expect(
      (await call('ai/sessions', { cookie, body: { ...body, requestId: randomUUID() } })).status,
    ).toBe(429)
    finish(batch())
    const first = (await (await pending).json()).session
    const second = (await (await call('ai/sessions', { cookie, body })).json()).session
    expect(second.id).toBe(first.id)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(
      (await call('ai/sessions', { cookie, body: { ...body, profileId: 'other' } })).status,
    ).toBe(409)
  })
  it('does not disclose generated questions after the parent logs out mid-request', async () => {
    const cookie = await login()
    let finish!: (batch: GeneratedArithmeticBatch) => void
    generate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = call('ai/sessions', { cookie, body: { ...context, requestId: randomUUID() } })
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1))
    await call('logout', { cookie, body: {} })
    finish(batch())
    expect((await pending).status).toBe(401)
  })
  it('caps aggregate model spending even for a newly registered account', async () => {
    await login()
    const cookie = await login('parent_b')
    const db = new DatabaseSync(join(directory, 'test.sqlite'))
    const user = db.prepare("SELECT id FROM users WHERE username='parent_a'").get()!.id
    const insert = db.prepare(
      "INSERT INTO ai_practice_sessions(id,user_id,profile_id,textbook_id,knowledge_point_id,request_id,state,created_at,updated_at) VALUES(?,?,?,?,?,?,'failed',?,?)",
    )
    db.exec('BEGIN')
    for (let i = 0; i < 300; i++)
      insert.run(
        randomUUID(),
        user,
        'student',
        context.textbookId,
        context.knowledgePointId,
        randomUUID(),
        clock,
        clock,
      )
    db.exec('COMMIT')
    db.close()
    const response = await call('ai/sessions', {
      cookie,
      username: 'parent_b',
      body: { ...context, requestId: randomUUID() },
    })
    expect(response.status).toBe(429)
    expect((await response.json()).code).toBe('AI_SERVICE_QUOTA')
    expect(generate).not.toHaveBeenCalled()
  })
  it('retains rate limits after a restart and never returns mock success on provider failure', async () => {
    const cookie = await login()
    generate.mockRejectedValue(new Error('private-provider-payload'))
    for (let i = 0; i < 10; i++) {
      const response = await call('ai/sessions', {
        cookie,
        body: { ...context, requestId: randomUUID() },
      })
      expect(response.status).toBe(502)
      expect(await response.text()).not.toContain('private-provider-payload')
    }
    await app.close()
    await start()
    expect(
      (await call('ai/sessions', { cookie, body: { ...context, requestId: randomUUID() } })).status,
    ).toBe(429)
    clock += 3600001
    generate.mockResolvedValue(batch())
    expect(
      (await call('ai/sessions', { cookie, body: { ...context, requestId: randomUUID() } })).status,
    ).toBe(200)
  })
})

describe('formal model output validation', () => {
  it('requires an explicitly enabled real model and validates timeout configuration at startup', () => {
    expect(formalAiConfigured({})).toBe(false)
    expect(() => formalAiConfigured({ FORMAL_AI_ENABLED: 'true', LLM_PROVIDER: 'MOCK' })).toThrow(
      'FORMAL_AI_REQUIRES_REAL_MODEL',
    )
    expect(() => formalAiConfigured({ ...env, LLM_TIMEOUT_MS: 'NaN' })).toThrow('CONFIG_ERROR')
  })
  function provider(data: unknown) {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(data) }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
          { status: 200 },
        ),
    )
    vi.stubGlobal('fetch', fetcher)
    return fetcher
  }
  it.each(chineseReadingGroups)(
    'arranges all three approved items for $title through the model',
    async (group) => {
      const sources = reviewedAiSources(
        group.alignment.textbookId,
        group.alignment.knowledgePointId,
      )
      expect(sources).toHaveLength(3)
      const fetcher = provider({
        selections: sources.map((q) => ({
          sourceId: q.id,
          optionOrder: q.options!.map((o) => o.optionKey).reverse(),
        })),
      })
      const result = await createFormalGenerator(env)({
        profileId: 'student-a',
        textbookId: group.alignment.textbookId,
        knowledgePointId: group.alignment.knowledgePointId,
      })
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(result.source).toBe('REAL_LLM')
      expect(result.questions).toHaveLength(3)
      for (const item of result.questions) {
        const original = sources.find((q) => q.id === item.sourceQuestion?.id)!
        expect(original).toBeTruthy()
        expect(item.sourceQuestion?.answerRule).toEqual(original.answerRule)
        expect(item.stem).toBe(original.stem.map((b) => b.text).join('\n'))
        expect(item.options?.map((o) => o.value)).toEqual(
          original.options!.map((o) => o.optionKey).reverse(),
        )
      }
    },
  )
  it('calls the model to arrange reviewed Chinese items and rejects invented IDs or altered option sets', async () => {
    const candidates = reviewedAiSources(chinese.textbookId, chinese.knowledgePointId)
      .sort(
        (a, b) =>
          Math.abs(questionDifficulty(a.difficulty) - 3) -
            Math.abs(questionDifficulty(b.difficulty) - 3) || a.id.localeCompare(b.id),
      )
      .slice(0, 3)
    const selections = candidates.map((q) => ({
      sourceId: q.id,
      optionOrder: (q.options ?? []).map((o) => o.optionKey).reverse(),
    }))
    const fetcher = provider({ selections })
    const result = await createFormalGenerator(env)(chinese)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(
      result.questions.every(
        (q) => q.sourceQuestion && candidates.some((c) => c.id === q.sourceQuestion!.id),
      ),
    ).toBe(true)
    expect(result.source).toBe('REAL_LLM')
    provider({ selections: [{ ...selections[0], sourceId: 'invented' }, ...selections.slice(1)] })
    await expect(createFormalGenerator(env)(chinese)).rejects.toThrow()
    provider({
      selections: selections.map((s, i) => (i === 0 ? { ...s, optionOrder: ['invented'] } : s)),
    })
    await expect(createFormalGenerator(env)(chinese)).rejects.toThrow()
  })
  it('enforces the requested arithmetic difficulty band instead of accepting harder items', async () => {
    provider({
      questions: [
        { left: 32, right: 7, operation: '-', answer: 25 },
        { left: 41, right: 8, operation: '-', answer: 33 },
        { left: 53, right: 9, operation: '-', answer: 44 },
      ],
    })
    await expect(createFormalGenerator(env)({ ...context, difficulty: 0.85 })).rejects.toThrow(
      '未通过检查',
    )
  })
  it('generates under production configuration and sends no learner identity to the provider', async () => {
    const fetcher = provider({
      questions: [
        { left: 32, right: 7, operation: '-', answer: 25 },
        { left: 41, right: 8, operation: '-', answer: 33 },
        { left: 53, right: 9, operation: '-', answer: 44 },
      ],
    })
    const result = await createFormalGenerator(env)(context)
    expect(result.source).toBe('REAL_LLM')
    expect(result.questions).toHaveLength(3)
    const payload = JSON.parse(
      (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    )
    expect(JSON.stringify(payload)).not.toContain(context.profileId)
    expect(JSON.stringify(payload)).not.toContain('test-server-secret')
  })
  it.each([
    [
      { left: 32, right: 7, operation: '-', answer: 26 },
      { left: 41, right: 8, operation: '-', answer: 33 },
      { left: 53, right: 9, operation: '-', answer: 44 },
    ],
    [
      { left: 32, right: 7, operation: '-', answer: 25 },
      { left: 32, right: 7, operation: '-', answer: 25 },
      { left: 53, right: 9, operation: '-', answer: 44 },
    ],
    [
      { left: 32, right: 1, operation: '-', answer: 31 },
      { left: 41, right: 8, operation: '-', answer: 33 },
      { left: 53, right: 9, operation: '-', answer: 44 },
    ],
    [{ left: 132, right: 7, operation: '-', answer: 125 }],
  ])(
    'rejects wrong answers, duplicates, wrong borrowing and out-of-range output',
    async (...questions) => {
      provider({ questions })
      await expect(createFormalGenerator(env)(context)).rejects.toThrow()
    },
  )
  it('enforces fixed operands and non-carrying rules', () => {
    expect(arithmeticAllowed(arithmeticScope('G1_SHENZHEN_MATH_S2_KP_03')!, 8, 6, '+')).toBe(false)
    expect(arithmeticAllowed(arithmeticScope('G1_SHENZHEN_MATH_S2_KP_03')!, 9, 6, '+')).toBe(true)
    expect(arithmeticAllowed(arithmeticScope('G1_SHENZHEN_MATH_S2_KP_28')!, 38, 25, '+')).toBe(
      false,
    )
  })
})
