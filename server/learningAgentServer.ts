import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { readLLMConfig } from './llm/config'
import { generateDevQuestions } from './llm/devGeneration'

export interface LearningAgentServerOptions {
  env?: Record<string, string | undefined>
  origins?: string[]
  enabled?: boolean
  maxBodyBytes?: number
  maxConcurrent?: number
  bodyTimeoutMs?: number
}

export function localAgentRequestAllowed(
  req: IncomingMessage,
  origins: readonly string[],
): boolean {
  try {
    const origin = new URL(req.headers.origin ?? '')
    return (
      req.method === 'POST' &&
      origin.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) &&
      origin.host === req.headers.host &&
      origins.includes(origin.origin) &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') &&
      req.headers['x-knowledge-llm'] === '1' &&
      req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() === 'application/json'
    )
  } catch {
    return false
  }
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function readJSON(req: IncomingMessage, maxBytes: number, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    const cleanup = () => {
      clearTimeout(timer)
      req.off('data', onData)
      req.off('end', onEnd)
      req.off('error', onError)
      req.off('aborted', onError)
    }
    const fail = (code: string) => {
      cleanup()
      // Drain oversized/slow requests without retaining their body in memory.
      req.resume()
      reject(new Error(code))
    }
    const onError = () => fail('REQUEST_INVALID')
    const onData = (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) return fail('REQUEST_TOO_LARGE')
      chunks.push(chunk)
    }
    const onEnd = () => {
      cleanup()
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown)
      } catch {
        reject(new Error('REQUEST_INVALID'))
      }
    }
    const timer = setTimeout(() => fail('REQUEST_TIMEOUT'), timeoutMs)
    req.on('data', onData)
    req.once('end', onEnd)
    req.once('error', onError)
    req.once('aborted', onError)
  })
}

export function createLearningAgentServer(options: LearningAgentServerOptions = {}): {
  server: Server
  close: () => Promise<void>
} {
  const env = options.env ?? process.env
  const origins = options.origins ?? ['http://localhost:5173', 'http://127.0.0.1:5173']
  const enabled =
    options.enabled ?? (env.NODE_ENV !== 'production' && env.VITE_ENABLE_DEV_ROUTES !== 'false')
  const maxBodyBytes = options.maxBodyBytes ?? 64 * 1024
  const maxConcurrent = options.maxConcurrent ?? 2
  const bodyTimeoutMs = options.bodyTimeoutMs ?? 10000
  let active = 0
  const server = createServer(async (req, res) => {
    const path = req.url?.split('?')[0] ?? '/'
    if (path === '/api/agent/health' && req.method === 'GET') {
      let configured = false
      let provider = 'MOCK'
      let model: string | null = null
      try {
        const config = readLLMConfig(env)
        provider = config.provider
        model = config.adapter?.model ?? null
        configured = provider === 'MOCK' || !!config.adapter
      } catch {
        configured = false
      }
      return send(res, 200, { ok: true, service: 'learning-agent', enabled, configured, provider, model })
    }
    if (path !== '/api/agent/questions') return send(res, 404, { error: 'AGENT_NOT_FOUND' })
    if (!enabled || !localAgentRequestAllowed(req, origins))
      return send(res, 403, { error: 'AGENT_ACCESS_DENIED' })
    if (active >= maxConcurrent) return send(res, 429, { error: 'AGENT_BUSY' })
    active++
    try {
      let input: unknown
      try {
        input = await readJSON(req, maxBodyBytes, bodyTimeoutMs)
      } catch (error) {
        const code = error instanceof Error ? error.message : 'REQUEST_INVALID'
        const status = code === 'REQUEST_TOO_LARGE' ? 413 : code === 'REQUEST_TIMEOUT' ? 408 : 400
        res.setHeader('Connection', 'close')
        return send(res, status, { error: code })
      }
      try {
        return send(res, 200, await generateDevQuestions(input, env))
      } catch {
        return send(res, 400, { error: 'AGENT_REQUEST_REJECTED' })
      }
    } finally {
      active--
    }
  })
  return {
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}
