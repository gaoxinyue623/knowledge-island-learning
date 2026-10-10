import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { loadAgentEnvironment } from '../server/learningAgentConfig'

// Direct Node children share one lifecycle; a failed service stops the whole stack.
const env = loadAgentEnvironment()
if (env.NODE_ENV === 'production') throw new Error('dev:all 仅用于本地开发。')
const children: ChildProcess[] = []
let stopping = false
function stop(code: number) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) child.kill('SIGTERM')
  const deadline = setTimeout(() => {
    for (const child of children)
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }, 5000)
  deadline.unref()
}
function start(name: string, command: string, args: string[]) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...env, TSX_TSCONFIG_PATH: resolve('tsconfig.app.json') },
  })
  children.push(child)
  child.once('error', (error) => {
    console.error(`${name} 启动失败：${error.message}`)
    stop(1)
  })
  child.once('exit', (code, signal) => {
    if (!stopping) {
      console.error(`${name} 已退出 (${code ?? signal})，正在停止其他服务。`)
      stop(code || 1)
    }
  })
}
process.once('SIGINT', () => stop(0))
process.once('SIGTERM', () => stop(0))
start('家庭 API', process.execPath, ['--import', 'tsx', 'server/index.ts'])
start('Agent API', process.execPath, ['--import', 'tsx', 'server/learningAgentIndex.ts'])
if (env.AGENT_API_BACKEND === 'FASTAPI') start('FastAPI', 'python3', ['-m', 'python_agent'])
start('Vite', process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--host',
  '127.0.0.1',
  '--port',
  '5173',
  '--strictPort',
])
