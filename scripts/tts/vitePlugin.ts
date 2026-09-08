import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createTtsGenerator, TtsError } from './volcengine'

export function localTtsRequestAllowed(req: IncomingMessage) {
  try {
    const host = req.headers.host ?? ''
    const origin = new URL(req.headers.origin ?? '')
    return (
      ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) &&
      origin.protocol === 'http:' &&
      origin.host === host &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') &&
      req.headers['x-knowledge-tts'] === '1' &&
      req.headers['content-type'] === 'application/json'
    )
  } catch {
    return false
  }
}
export function ttsMiddleware(generate: ReturnType<typeof createTtsGenerator>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/tts/doubao') return next()
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    try {
      if (req.method !== 'POST' || !localTtsRequestAllowed(req))
        throw new TtsError('仅允许本机页面主动请求语音。', 403)
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        const bytes = Buffer.from(chunk)
        size += bytes.length
        if (size > 12000) throw new TtsError('请求过大。', 413)
        chunks.push(bytes)
      }
      let input: { text?: unknown }
      try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        throw new TtsError('请求格式不正确。', 400)
      }
      const result = await generate(input?.text)
      if (res.destroyed) return
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('X-TTS-Cache', result.cached ? 'hit' : 'miss')
      res.end(result.audio)
    } catch (error) {
      if (res.destroyed) return
      res.statusCode = error instanceof TtsError ? error.status : 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          message: error instanceof TtsError ? error.message : '本地语音服务暂不可用。',
        }),
      )
    }
  }
}
export function localTtsPlugin(): Plugin {
  return {
    name: 'knowledge-local-tts',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(ttsMiddleware(createTtsGenerator(server.config.root)))
    },
  }
}
