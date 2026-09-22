import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { rejectClientLLMKey } from './llm/config'

/** Match development env precedence without depending on Vite at server runtime. */
export function loadAgentEnvironment(
  root = process.cwd(),
  environment: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  const loaded: Record<string, string | undefined> = {}
  for (const file of ['.env', '.env.local', '.env.development', '.env.development.local']) {
    try {
      Object.assign(loaded, parseEnv(readFileSync(resolve(root, file), 'utf8')))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw new Error('AGENT_ENV_LOAD_FAILED')
    }
  }
  const env = { ...loaded, ...environment }
  rejectClientLLMKey(env)
  return env
}

export function agentConnectionConfig(env: Record<string, string | undefined>) {
  const host = env.AGENT_API_HOST ?? '127.0.0.1'
  const port = Number(env.AGENT_API_PORT ?? 8788)
  if (!['localhost', '127.0.0.1', '::1'].includes(host))
    throw new Error('AGENT_HOST_MUST_BE_LOOPBACK')
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('AGENT_PORT_INVALID')
  const origins = (
    env.AGENT_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (!origins.length || origins.some((value) => {
    try {
      const url = new URL(value)
      return url.origin !== value || url.protocol !== 'http:' ||
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    } catch {
      return true
    }
  })) throw new Error('AGENT_ORIGINS_MUST_BE_LOOPBACK')
  return { host, port, origins, target: `http://${host === '::1' ? '[::1]' : host}:${port}` }
}
