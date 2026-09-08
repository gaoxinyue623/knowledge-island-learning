import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { goldenMathPepG3S1Package } from '../src/data/curriculum/verified/math/pep/g3-s1'
import { importCurriculumPackage } from '../src/services/curriculum'

const result = importCurriculumPackage(goldenMathPepG3S1Package)
const outputDirectory = resolve(process.cwd(), 'doc/curriculum')
mkdirSync(outputDirectory, { recursive: true })
const jsonPath = resolve(outputDirectory, 'curriculum-verification-report.json')
const markdownPath = resolve(outputDirectory, 'CURRICULUM_VERIFICATION_REPORT.md')

const jsonArtifact = {
  success: result.success,
  imported: result.imported,
  errors: result.errors,
  warnings: result.warnings,
  report: result.report,
}

function markdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function formatIssue(issue: (typeof result.report.issues)[number]): string {
  const location = [issue.entityType, issue.entityId, issue.field].filter(Boolean).join('.')
  return `| ${issue.severity} | ${markdownCell(issue.code)} | ${markdownCell(location || 'package')} | ${markdownCell(issue.message)} |`
}

const issueRows = result.report.issues.length
  ? result.report.issues.map(formatIssue).join('\n')
  : '| info | NONE | package | 未发现结构性问题。 |'

const markdown = `# 知识岛｜PHASE 6 课程验证报告

> 本报告由 \`npm run curriculum:review\` 生成。当前验证对象是三年级数学上册 PEP 的 Golden Sample Framework；它是待核验导入框架，不是真实教材数据，也不代表教材事实已获确认。

## 结果

| 项目 | 值 |
| --- | --- |
| textbookId | ${result.report.textbookId} |
| textbookIdentityKey | ${result.report.textbookIdentityKey} |
| verificationStatus | ${result.report.verificationStatus} |
| finalResult | ${result.report.finalResult} |
| samplePollution | ${result.report.samplePollution} |
| knowledgeDag | ${result.report.knowledgeDag} |
| errors | ${result.report.summary.errorCount} |
| warnings | ${result.report.summary.warningCount} |
| infos | ${result.report.summary.infoCount} |

## 完整性统计

| 实体 | 总数 | 有效数 |
| --- | ---: | ---: |
| textbook | ${result.report.completeness.textbook ? 1 : 0} | ${result.report.completeness.textbook ? 1 : 0} |
| units | ${result.report.completeness.units.total} | ${result.report.completeness.units.valid} |
| lessons | ${result.report.completeness.lessons.total} | ${result.report.completeness.lessons.valid} |
| knowledgePoints | ${result.report.completeness.knowledgePoints.total} | ${result.report.completeness.knowledgePoints.valid} |
| lessonKnowledgePoints | ${result.report.completeness.mappings.total} | ${result.report.completeness.mappings.valid} |
| knowledgeRelations | ${result.report.completeness.relations.total} | ${result.report.completeness.relations.valid} |

## 问题与待人工审核项

| 严重级别 | 代码 | 位置 | 说明 |
| --- | --- | --- | --- |
${issueRows}

正式进入 REVIEWED 前仍需补充可靠教材来源、准确书名/版次/年份/ISBN、目录与课次核验、知识点语义映射、来源版权和人工审核记录。
`

writeFileSync(jsonPath, `${JSON.stringify(jsonArtifact, null, 2)}\n`, 'utf8')
writeFileSync(markdownPath, markdown, 'utf8')

console.log(`Curriculum review: ${result.report.finalResult}`)
console.log(`JSON: ${jsonPath}`)
console.log(`Markdown: ${markdownPath}`)
if (!result.success) process.exitCode = 1
