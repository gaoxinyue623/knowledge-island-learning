import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'

export function localLLMRequestAllowed(req: IncomingMessage): boolean {
  try {
    const origin = new URL(req.headers.origin ?? '')
    return (
      req.method === 'POST' &&
      origin.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) &&
      origin.host === req.headers.host &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') &&
      req.headers['x-knowledge-llm'] === '1' &&
      req.headers['content-type'] === 'application/json'
    )
  } catch {
    return false
  }
}
export function llmMiddleware(generate: (input: unknown) => Promise<unknown>, enabled = true) {
  let active = 0
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/dev/learning-agent/questions') return next()
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    const reject = (status: number, code: string) => {
      res.statusCode = status
      res.end(JSON.stringify({ error: code }))
    }
    if (!enabled || !localLLMRequestAllowed(req)) return reject(403, 'LLM_DEV_ACCESS_DENIED')
    if (active >= 2) return reject(429, 'LLM_DEV_BUSY')
    active++
    const timer = setTimeout(() => {
      req.destroy()
    }, 10000)
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        const bytes = Buffer.from(chunk)
        size += bytes.length
        if (size > 65536) return reject(413, 'LLM_REQUEST_TOO_LARGE')
        chunks.push(bytes)
      }
      clearTimeout(timer)
      let input: unknown
      try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return reject(400, 'LLM_REQUEST_INVALID')
      }
      const result = await generate(input)
      if (!res.destroyed) res.end(JSON.stringify(result))
    } catch {
      if (!res.destroyed) reject(400, 'LLM_REQUEST_REJECTED')
    } finally {
      clearTimeout(timer)
      active--
    }
  }
}
export function localLLMPlugin(): Plugin {
  return {
    name: 'knowledge-local-llm',
    apply: 'serve',
    configureServer(server) {
      const env = {
        ...loadEnv(server.config.mode, server.config.root, ['LLM_', 'VITE_ENABLE_DEV_ROUTES']),
        ...process.env,
      }
      server.middlewares.use(
        llmMiddleware(
          async (input) => {
            const module = await server.ssrLoadModule('/server/llm/devGeneration.ts')
            return module.generateDevQuestions(input, env)
          },
          !server.config.isProduction && env.VITE_ENABLE_DEV_ROUTES !== 'false',
        ),
      )
    },
  }
}
