import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createPetServer } from './petServer'
import { loadAgentEnvironment } from './learningAgentConfig'
const env = loadAgentEnvironment()
const port = Number(env.PET_API_PORT ?? 8787)
const databasePath = resolve(env.PET_DATABASE_PATH ?? '.data/knowledge-island.sqlite')
const origins = (env.PET_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
const production = env.NODE_ENV === 'production'
if (production && (!env.PET_ALLOWED_ORIGINS || origins.some((o) => !o.startsWith('https://'))))
  throw new Error('生产环境必须显式设置 HTTPS PET_ALLOWED_ORIGINS。')
mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 })
const app = createPetServer({ databasePath, origins, secureCookies: production, env })
app.server.listen(port, env.PET_API_HOST ?? '127.0.0.1', () => {
  console.info(`知识岛宠物 API 已启动，端口 ${port}`)
})
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void app.close().then(() => process.exit(0))
  })
