import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { createTtsGenerator, TtsError } from './tts/volcengine'

async function main() {
  const { values } = parseArgs({
    options: {
      text: { type: 'string' },
      file: { type: 'string' },
      'confirm-cost': { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })
  if (values.help) {
    console.log(
      'npm run tts:generate -- --text "Hello!" --confirm-cost\n或 --file 英文纯文本文件（最多2000字符）。新音频可能计费，结果保存在 .tts-cache。',
    )
    return
  }
  if (!values['confirm-cost'])
    throw new TtsError('未调用服务。确认可能计费后，添加 --confirm-cost。', 400)
  if (Boolean(values.text) === Boolean(values.file))
    throw new TtsError('请仅提供 --text 或 --file。', 400)
  const text = values.file ? await readFile(values.file, 'utf8') : values.text
  const result = await createTtsGenerator(process.cwd())(text)
  console.log(`${result.cached ? '复用缓存' : '已生成'}：${result.path}`)
}
main().catch((error) => {
  console.error(
    error instanceof TtsError ? error.message : '参数或文件无法读取。请检查输入；未输出敏感配置。',
  )
  process.exitCode = 1
})
