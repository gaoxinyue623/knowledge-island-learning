import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { productionCurriculumData, mvpCurriculumScope } from '../src/data/curriculum/production'
import { resolveProductionConfig } from '../src/config/production'
import {
  evaluateMVPReleaseGate,
  validateProductionReadiness,
} from '../src/services/production-readiness'

function check(args: string[]): boolean {
  const result = spawnSync('npm', args, { stdio: 'inherit', env: process.env })
  return result.status === 0
}
const build = check(['run', 'build'])
const lint = check(['run', 'lint'])
const tests = check(['run', 'test:run'])
const runtimeSmoke = check(['exec', '--', 'vitest', 'run', 'tests/release-runtime.test.ts'])
const readiness = validateProductionReadiness(productionCurriculumData, mvpCurriculumScope)
const gate = evaluateMVPReleaseGate({
  readiness,
  config: resolveProductionConfig({ isProduction: true }),
  engineering: { build, lint },
  qa: { runtimeSmoke },
  regression: { tests },
  documentation: { releaseNotes: existsSync('LOCAL_RELEASE_FIXES.md') },
  limitations: [
    '8 节导读、识字或拼音内容仅提供学习和互动，不计入自动判分测验覆盖。',
    '豆包语音仅限本地开发工具；当前正式版本提供设备语音。',
    '家长账号仅备份宠物，全站学习记录仍保存在本机。',
  ],
})

console.log(`MVP Release Decision: ${gate.decision}`)
console.log(`MVP Curriculum Scope: ${mvpCurriculumScope.id}`)
console.log(
  `Production records: ${readiness.curriculum.reviewedTextbookCount} textbooks, ${readiness.curriculum.reviewedUnitCount} units, ${readiness.curriculum.reviewedLessonCount} lessons, ${readiness.curriculum.reviewedKnowledgePointCount} knowledge points, ${readiness.content.reviewedContentCount} contents, ${readiness.questions.reviewedQuestionCount} questions`,
)
console.log(`Blocking issues: ${gate.blockingIssues.length}`)
console.log(`Limitations: ${gate.limitations.length}`)
for (const blockingIssue of gate.blockingIssues) console.log(`BLOCKING: ${blockingIssue}`)

if (gate.decision === 'NOT_READY') process.exitCode = 1
