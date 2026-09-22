import type {
  HumanReviewSample,
  RealLLMEvaluationReport,
} from '../../src/services/learning-agent/realLLMEvaluation'

export const HUMAN_REVIEW_FIELDS = [
  'review',
  'ageAppropriate',
  'ambiguity',
  'targetTraining',
  'difficultyReasonable',
  'naturalLanguage',
  'explanationCorrect',
  'withinCurriculum',
] as const
const decisions = new Set(['PASS', 'NEEDS_REVISION', 'REJECT'])

/** Import only a person's explicit review, bound to the exact candidate questions. Never calls an LLM. */
export function applyHumanReview(
  report: RealLLMEvaluationReport,
  input: unknown,
): RealLLMEvaluationReport {
  if (!input || typeof input !== 'object') throw new Error('HUMAN_REVIEW_INVALID')
  const form = input as Record<string, unknown>
  if (
    typeof form.reviewer !== 'string' ||
    !form.reviewer.trim() ||
    typeof form.reviewedAt !== 'string' ||
    !Number.isFinite(Date.parse(form.reviewedAt)) ||
    form.model !== report.model ||
    form.provider !== report.provider ||
    JSON.stringify(form.promptVersions) !== JSON.stringify(report.promptVersions) ||
    !Array.isArray(form.samples)
  )
    throw new Error('HUMAN_REVIEW_IDENTITY_OR_VERSION_INVALID')
  const original = report.humanReview.samples
  if (
    original.length < 40 ||
    form.samples.length !== original.length ||
    !'ABCDEFGH'.split('').every((id) => original.filter((s) => s.scenarioId === id).length >= 5)
  )
    throw new Error('HUMAN_REVIEW_COVERAGE_INCOMPLETE')
  const seen = new Set<string>()
  const reviewed: HumanReviewSample[] = form.samples.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('HUMAN_REVIEW_INVALID')
    const row = raw as HumanReviewSample
    const prior = original.find((s) => s.sampleId === row.sampleId)
    if (
      !prior ||
      seen.has(row.sampleId) ||
      HUMAN_REVIEW_FIELDS.some((key) => !decisions.has(row[key] ?? ''))
    )
      throw new Error('HUMAN_REVIEW_INCOMPLETE')
    seen.add(row.sampleId)
    // Editing content or reusing another prompt's review cannot approve this candidate.
    for (const [key, value] of Object.entries(prior)) {
      if (
        HUMAN_REVIEW_FIELDS.includes(key as (typeof HUMAN_REVIEW_FIELDS)[number]) ||
        key === 'reviewerNotes'
      )
        continue
      if (JSON.stringify(row[key as keyof HumanReviewSample]) !== JSON.stringify(value))
        throw new Error('HUMAN_REVIEW_CONTENT_CHANGED')
    }
    return {
      ...prior,
      ...Object.fromEntries(HUMAN_REVIEW_FIELDS.map((key) => [key, row[key]])),
      reviewerNotes: typeof row.reviewerNotes === 'string' ? row.reviewerNotes.slice(0, 2000) : '',
    }
  })
  const result = structuredClone(report)
  result.humanReview.samples = reviewed
  result.humanReview.status = 'COMPLETE'
  const quality = result.gates.quality
  quality.ageAppropriate =
    reviewed.filter((s) => s.ageAppropriate === 'PASS').length / reviewed.length >= 0.9
  quality.ambiguity =
    reviewed.filter((s) => s.ambiguity !== 'PASS').length / reviewed.length <= 0.01
  quality.humanReviewClear = reviewed.every((s) =>
    HUMAN_REVIEW_FIELDS.every((key) => s[key] === 'PASS'),
  )
  if (reviewed.some((s) => s.withinCurriculum === 'REJECT'))
    result.gates.blocking.outOfScopeReadyZero = false
  if (reviewed.some((s) => s.explanationCorrect === 'REJECT'))
    result.gates.blocking.invalidReadyZero = false
  for (const [key, passed] of Object.entries(result.gates.blocking))
    if (!passed && !result.failures.includes(`BLOCKING:${key}`))
      result.failures.push(`BLOCKING:${key}`)
  for (const [key, passed] of Object.entries(quality))
    if (passed === false && !result.failures.includes(`QUALITY:${key}`))
      result.failures.push(`QUALITY:${key}`)
  if (Object.values(result.gates.blocking).some((p) => !p)) result.acceptanceStatus = 'FAIL'
  else if (report.acceptanceStatus !== 'FAIL' && report.coverageComplete)
    result.acceptanceStatus =
      Object.values(quality).every((p) => p === true) &&
      !result.failures.some((failure) => failure.startsWith('QUALITY:SCENARIO_'))
        ? 'PASS'
        : 'CONDITIONAL_PASS'
  return result
}
