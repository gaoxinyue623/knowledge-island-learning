// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { createLearningAgentServer } from '../server/learningAgentServer'
import { agentConnectionConfig, loadAgentEnvironment } from '../server/learningAgentConfig'

const apps: Array<ReturnType<typeof createLearningAgentServer>> = []
async function listen(app: ReturnType<typeof createLearningAgentServer>) {
  await new Promise<void>((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  const address = app.server.address() as { port: number }
  return `http://127.0.0.1:${address.port}`
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()))
})

describe('Learning Agent backend foundation', () => {
  it('loads ignored local configuration for the standalone process without exposing it to the browser', () => {
    const env = loadAgentEnvironment('/tmp/knowledge-island-agent-no-env', {
      LLM_PROVIDER: 'MOCK',
      AGENT_API_PORT: '8789',
    })
    expect(env.LLM_API_KEY).toBeUndefined()
    expect(agentConnectionConfig(env)).toMatchObject({
      host: '127.0.0.1',
      port: 8789,
      target: 'http://127.0.0.1:8789',
    })
  })

  it('rejects non-loopback standalone bindings and origins', () => {
    expect(() => agentConnectionConfig({ AGENT_API_HOST: '0.0.0.0' })).toThrow(
      'AGENT_HOST_MUST_BE_LOOPBACK',
    )
    expect(() =>
      agentConnectionConfig({ AGENT_ALLOWED_ORIGINS: 'https://example.com' }),
    ).toThrow('AGENT_ORIGINS_MUST_BE_LOOPBACK')
  })

  it('exposes a credential-free health contract without leaking the API key', async () => {
    const app = createLearningAgentServer({
      env: {
        LLM_PROVIDER: 'OPENAI_COMPATIBLE',
        LLM_BASE_URL: 'https://api.modelverse.cn/v1',
        LLM_API_KEY: 'SERVER_ONLY_SECRET',
        LLM_MODEL: 'model-name',
      },
    })
    apps.push(app)
    const response = await fetch(`${await listen(app)}/api/agent/health`)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      ok: true,
      service: 'learning-agent',
      provider: 'OPENAI_COMPATIBLE',
      model: 'model-name',
      configured: true,
    })
    expect(JSON.stringify(body)).not.toContain('SERVER_ONLY_SECRET')
  })

  it('keeps question generation local-only and rejects malformed requests', async () => {
    const origins: string[] = []
    const app = createLearningAgentServer({ env: {}, origins })
    apps.push(app)
    const base = await listen(app)
    origins.push(base)
    const headers = {
      Origin: base,
      'Content-Type': 'application/json',
      'X-Knowledge-LLM': '1',
    }
    expect(
      (await fetch(`${base}/api/agent/questions`, { method: 'POST', headers, body: '{}' })).status,
    ).toBe(400)
    expect(
      (
        await fetch(`${base}/api/agent/questions`, {
          method: 'POST',
          headers: { ...headers, Origin: 'https://evil.example' },
          body: '{}',
        })
      ).status,
    ).toBe(403)
    expect((await fetch(`${base}/api/unknown`)).status).toBe(404)
  })

  it('honors the development route kill switch', async () => {
    const app = createLearningAgentServer({ env: { VITE_ENABLE_DEV_ROUTES: 'false' } })
    apps.push(app)
    const base = await listen(app)
    expect((await fetch(`${base}/api/agent/health`)).status).toBe(200)
    expect(
      (
        await fetch(`${base}/api/agent/questions`, {
          method: 'POST',
          headers: {
            Origin: base,
            'Content-Type': 'application/json',
            'X-Knowledge-LLM': '1',
          },
          body: '{}',
        })
      ).status,
    ).toBe(403)
  })
})
