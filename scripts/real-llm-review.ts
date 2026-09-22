import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { applyHumanReview } from './llm/humanReview'
import type { RealLLMEvaluationReport } from '../src/services/learning-agent/realLLMEvaluation'

try {
  const [reportPath, reviewPath] = process.argv.slice(2)
  if (!reportPath || !reviewPath)
    throw new Error('Usage: npm run llm:review -- REPORT.json HUMAN-REVIEW.json')
  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as RealLLMEvaluationReport
  const form = JSON.parse(readFileSync(reviewPath, 'utf8'))
  const reviewed = applyHumanReview(report, form)
  const output = reportPath.replace(/\.json$/, '') + '.reviewed.json'
  if (existsSync(output)) throw new Error('REVIEWED_REPORT_ALREADY_EXISTS')
  writeFileSync(
    output,
    JSON.stringify({ ...reviewed, reviewer: form.reviewer, reviewedAt: form.reviewedAt }, null, 2),
    { mode: 0o600, flag: 'wx' },
  )
  console.log(JSON.stringify({ acceptanceStatus: reviewed.acceptanceStatus, reportPath: output }))
} catch (error) {
  console.error(error instanceof Error ? error.message : 'HUMAN_REVIEW_INVALID')
  process.exitCode = 1
}
