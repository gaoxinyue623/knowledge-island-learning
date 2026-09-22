import { createLearningAgentServer } from './learningAgentServer'
import { agentConnectionConfig, loadAgentEnvironment } from './learningAgentConfig'

const env = loadAgentEnvironment()
const { host, port, origins, target } = agentConnectionConfig(env)
const app = createLearningAgentServer({ env, origins })

app.server.listen(port, host, () => {
  console.info(`知识岛 Learning Agent API 已启动，地址 ${target}`)
})
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void app.close().then(() => process.exit(0))
  })
