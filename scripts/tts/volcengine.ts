import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseEnv } from 'node:util'

export class TtsError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message)
  }
}
export interface TtsConfig {
  key: string
  resource: string
  speaker: string
}
export async function readTtsConfig(root: string): Promise<TtsConfig> {
  let env: Record<string, string | undefined>
  try {
    env = parseEnv(await readFile(join(root, '.env.tts.local'), 'utf8'))
  } catch {
    throw new TtsError('请检查本地 .env.tts.local 配置文件。', 503)
  }
  const config = {
    key: env.VOLC_TTS_API_KEY?.trim(),
    resource: env.VOLC_TTS_RESOURCE_ID?.trim(),
    speaker: env.VOLC_TTS_SPEAKER?.trim(),
  }
  if (
    !config.key ||
    !config.resource ||
    !config.speaker ||
    Object.values(config).some((v) => typeof v !== 'string' || /[\r\n]/.test(v))
  )
    throw new TtsError('请填写语音密钥、资源 ID 和音色 ID。', 503)
  return config as TtsConfig
}
export function ttsText(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > 2000 ||
    [...value].some((char) => char.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(char))
  )
    throw new TtsError('朗读文本须为 1–2000 个字符。', 400)
  return value.trim()
}
export function audioCacheKey(text: string, config: TtsConfig) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        version: 1,
        text,
        resource: config.resource,
        speaker: config.speaker,
        format: 'mp3',
        sampleRate: 24000,
      }),
    )
    .digest('hex')
}
function isMp3(audio: Buffer) {
  return (
    audio.length >= 4 &&
    audio.length <= 10 * 1024 * 1024 &&
    (audio.subarray(0, 3).toString('ascii') === 'ID3' ||
      (audio[0] === 0xff && (audio[1]! & 0xe0) === 0xe0))
  )
}
export async function decodeAudio(response: Response): Promise<Buffer> {
  if (!response.ok)
    throw new TtsError(`豆包请求失败（HTTP ${response.status}），请检查额度、密钥和音色权限。`)
  if (!response.body) throw new TtsError('豆包未返回音频。')
  const reader = response.body.getReader(),
    decoder = new TextDecoder()
  const chunks: Buffer[] = []
  let pending = '',
    received = 0,
    finished = false
  function consume(line: string) {
    line = line.trim()
    if (!line || line.startsWith(':') || line.startsWith('event:')) return
    if (line.startsWith('data:')) line = line.slice(5).trim()
    let frame: { code?: number; data?: string }
    try {
      frame = JSON.parse(line)
    } catch {
      throw new TtsError('豆包返回的数据格式不正确。')
    }
    if (!frame || typeof frame !== 'object' || ![0, 20000000].includes(frame.code ?? -1))
      throw new TtsError('豆包合成未成功，请检查资源与音色是否匹配、额度和服务权限。')
    if (frame.data) {
      if (
        typeof frame.data !== 'string' ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(frame.data)
      )
        throw new TtsError('豆包音频分片不完整。')
      chunks.push(Buffer.from(frame.data, 'base64'))
    }
    if (frame.code === 20000000) finished = true
  }
  try {
    while (!finished) {
      const { done, value } = await reader.read()
      if (done) {
        pending += decoder.decode()
        if (pending.trim()) consume(pending)
        break
      }
      received += value.byteLength
      if (received > 12 * 1024 * 1024) throw new TtsError('音频响应过大，请缩短文本。')
      pending += decoder.decode(value, { stream: true })
      let newline: number
      while ((newline = pending.indexOf('\n')) >= 0) {
        consume(pending.slice(0, newline))
        pending = pending.slice(newline + 1)
        if (finished) break
      }
    }
    if (!finished || !chunks.length) throw new TtsError('音频没有完整生成，请手动重试。')
    const audio = Buffer.concat(chunks)
    if (!isMp3(audio)) throw new TtsError('豆包没有返回可识别的 MP3 音频。')
    return audio
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export function createTtsGenerator(root: string, fetcher: typeof fetch = fetch) {
  const pending = new Map<string, Promise<{ audio: Buffer; path: string; cached: boolean }>>()
  let starts: number[] = []
  return async (input: unknown) => {
    const text = ttsText(input),
      config = await readTtsConfig(root)
    const key = audioCacheKey(text, config),
      directory = join(root, '.tts-cache'),
      path = join(directory, `${key}.mp3`)
    try {
      const audio = await readFile(path)
      if (isMp3(audio)) return { audio, path, cached: true }
    } catch {
      /* A missing cache does not imply a paid request has already succeeded. */
    }
    const existing = pending.get(key)
    if (existing) return existing
    starts = starts.filter((t) => Date.now() - t < 60000)
    if (pending.size >= 2 || starts.length >= 20)
      throw new TtsError('生成请求较多，请稍后再试。', 429)
    starts.push(Date.now())
    const job = (async () => {
      const controller = new AbortController(),
        timeout = setTimeout(() => controller.abort(), 45000)
      try {
        const response = await fetcher(
          'https://openspeech.bytedance.com/api/v3/tts/unidirectional',
          {
            method: 'POST',
            redirect: 'error',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': config.key,
              'X-Api-Resource-Id': config.resource,
              'X-Api-Request-Id': randomUUID(),
            },
            body: JSON.stringify({
              req_params: {
                text,
                speaker: config.speaker,
                audio_params: { format: 'mp3', sample_rate: 24000 },
              },
            }),
          },
        )
        const audio = await decodeAudio(response)
        await mkdir(directory, { recursive: true, mode: 0o700 })
        const temporary = join(directory, `${key}.${randomUUID()}.tmp`)
        try {
          await writeFile(temporary, audio, { mode: 0o600, flag: 'wx' })
          await rename(temporary, path)
        } finally {
          await rm(temporary, { force: true }).catch(() => {})
        }
        return { audio, path, cached: false }
      } catch (error) {
        if (error instanceof TtsError) throw error
        throw new TtsError('豆包生成超时、网络不可用或缓存写入失败；请检查后手动重试。')
      } finally {
        clearTimeout(timeout)
        pending.delete(key)
      }
    })()
    pending.set(key, job)
    return job
  }
}
