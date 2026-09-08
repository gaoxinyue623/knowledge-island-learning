// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type IncomingMessage } from 'node:http'
import {
  createTtsGenerator,
  decodeAudio,
  readTtsConfig,
  audioCacheKey,
  ttsText,
} from '../scripts/tts/volcengine'
import { localTtsRequestAllowed, ttsMiddleware } from '../scripts/tts/vitePlugin'
const roots: string[] = []
const mp3 = Buffer.from('ID3test-audio')
const fixture = `VOLC_TTS_API_KEY="test-only-key"\nVOLC_TTS_RESOURCE_ID="resource"\nVOLC_TTS_SPEAKER="english-speaker"`
async function root() {
  const path = await mkdtemp(join(tmpdir(), 'knowledge-tts-test-'))
  roots.push(path)
  await writeFile(join(path, '.env.tts.local'), fixture)
  return path
}
function frames(prefix = '') {
  return `${prefix}${JSON.stringify({ code: 0, data: mp3.toString('base64') })}\n${prefix}{"code":20000000}`
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true })))
  vi.restoreAllMocks()
})
describe('local Doubao synthesis', () => {
  it('loads only dedicated config, validates input and separates audio identities', async () => {
    const path = await root(),
      config = await readTtsConfig(path)
    expect(config.speaker).toBe('english-speaker')
    expect(audioCacheKey('Hi', config)).toBe(audioCacheKey('Hi', { ...config, key: 'rotated' }))
    expect(audioCacheKey('Hi', config)).not.toBe(
      audioCacheKey('Hi', { ...config, speaker: 'other' }),
    )
    for (const input of ['', null, {}, 'a'.repeat(2001)]) expect(() => ttsText(input)).toThrow()
    await writeFile(join(path, '.env.tts.local'), 'VOLC_TTS_API_KEY="test-only-key"')
    await expect(readTtsConfig(path)).rejects.toThrow('请填写')
  })
  it.each(['', 'data: '])('decodes arbitrarily split stream chunks (%s)', async (prefix) => {
    const bytes = new TextEncoder().encode(frames(prefix))
    const response = new Response(
      new ReadableStream({
        start(controller) {
          for (const byte of bytes) controller.enqueue(new Uint8Array([byte]))
          controller.close()
        },
      }),
    )
    expect(await decodeAudio(response)).toEqual(mp3)
  })
  it('rejects HTTP errors, malformed, missing completion, invalid or empty audio without echoing vendor details', async () => {
    for (const body of [
      'garbage',
      '{"code":55000000,"message":"SECRET"}',
      '{"code":0,"data":"@@"}',
      '{"code":20000000}',
      frames().split('\n')[0]!,
      '{"code":20000000,"data":"eA=="}',
    ]) {
      await expect(decodeAudio(new Response(body))).rejects.not.toThrow('SECRET')
    }
    await expect(decodeAudio(new Response('SECRET', { status: 401 }))).rejects.toThrow('HTTP 401')
  })
  it('caches atomically and shares concurrent requests without sending configuration to clients', async () => {
    const path = await root(),
      fetcher = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 10))
        return new Response(frames())
      })
    const generate = createTtsGenerator(path, fetcher)
    const [one, two] = await Promise.all([generate('Hello!'), generate('Hello!')])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(one.audio).toEqual(two.audio)
    expect(await readFile(one.path)).toEqual(mp3)
    expect((await generate('Hello!')).cached).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(await readdir(join(path, '.tts-cache'))).toEqual([one.path.split('/').at(-1)])
    await writeFile(one.path, 'corrupted')
    expect((await generate('Hello!')).cached).toBe(false)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('does not cache or automatically retry failures and uses configured headers', async () => {
    const path = await root(),
      fetcher = vi.fn(async () => new Response('{"code":55000000,"message":"secret"}'))
    await expect(createTtsGenerator(path, fetcher)('Hi')).rejects.toThrow('合成未成功')
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [, init] = (fetcher.mock.calls as unknown as [string, RequestInit][])[0]!
    expect(init.headers).toMatchObject({
      'X-Api-Key': 'test-only-key',
      'X-Api-Resource-Id': 'resource',
    })
    expect(JSON.parse(init.body as string).req_params).toMatchObject({
      text: 'Hi',
      speaker: 'english-speaker',
      audio_params: { format: 'mp3', sample_rate: 24000 },
    })
    expect(await readdir(path)).toEqual(['.env.tts.local'])
  })
  it('restricts middleware to explicit same-origin loopback requests', () => {
    const request = (origin: string, host = 'localhost:5173', remote = '127.0.0.1', marker = '1') =>
      ({
        headers: { origin, host, 'x-knowledge-tts': marker, 'content-type': 'application/json' },
        socket: { remoteAddress: remote },
      }) as IncomingMessage
    expect(localTtsRequestAllowed(request('http://localhost:5173'))).toBe(true)
    expect(localTtsRequestAllowed(request('http://evil.test'))).toBe(false)
    expect(localTtsRequestAllowed(request('http://localhost:5174'))).toBe(false)
    expect(
      localTtsRequestAllowed(request('http://localhost:5173', 'localhost:5173', '192.168.1.2')),
    ).toBe(false)
    expect(
      localTtsRequestAllowed(request('http://localhost:5173', 'localhost:5173', '127.0.0.1', '')),
    ).toBe(false)
  })
  it('serves MP3 from POST and rejects malformed, oversized and unmarked requests without invoking synthesis', async () => {
    const generate = vi.fn(async () => ({ audio: mp3, path: 'private', cached: true }))
    const middleware = ttsMiddleware(generate)
    const server = createServer((req, res) => {
      void middleware(req, res, () => {
        res.statusCode = 404
        res.end()
      })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as { port: number }).port,
      url = `http://127.0.0.1:${port}`
    const headers = { Origin: url, 'Content-Type': 'application/json', 'X-Knowledge-TTS': '1' }
    try {
      expect((await fetch(url + '/api/tts/doubao')).status).toBe(403)
      expect(
        (await fetch(url + '/api/tts/doubao', { method: 'POST', headers, body: 'invalid' })).status,
      ).toBe(400)
      expect(
        (await fetch(url + '/api/tts/doubao', { method: 'POST', headers, body: 'x'.repeat(12001) }))
          .status,
      ).toBe(413)
      expect(generate).not.toHaveBeenCalled()
      const response = await fetch(url + '/api/tts/doubao', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: 'Hello!' }),
      })
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
      expect(Buffer.from(await response.arrayBuffer())).toEqual(mp3)
      expect(generate).toHaveBeenCalledExactlyOnceWith('Hello!')
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
