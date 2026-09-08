import type { MVPReleaseGateInput, MVPReleaseGateReport } from '@/types'

export function evaluateMVPReleaseGate(input: MVPReleaseGateInput): MVPReleaseGateReport {
  const checks: Record<string, 'PASS' | 'FAIL'> = {}
  const required = {
    engineering: ['build', 'lint'],
    qa: ['runtimeSmoke'],
    regression: ['tests'],
    documentation: ['releaseNotes'],
  } as const
  for (const [group, names] of Object.entries(required)) {
    const values = input[group as keyof typeof required]
    for (const name of names) checks[`${group}.${name}`] = values[name] === true ? 'PASS' : 'FAIL'
  }
  const addChecks = (group: string, values: Record<string, boolean>) => {
    for (const [name, value] of Object.entries(values))
      checks[`${group}.${name}`] = value ? 'PASS' : 'FAIL'
  }
  checks['curriculum.readiness'] = input.readiness.status === 'PASS' ? 'PASS' : 'FAIL'
  checks['curriculum.sampleLeak'] = input.readiness.sampleLeak.passed ? 'PASS' : 'FAIL'
  checks['content.coverage'] = input.readiness.content.passed ? 'PASS' : 'FAIL'
  checks['questions.coverage'] = input.readiness.questions.passed ? 'PASS' : 'FAIL'
  checks['production.config'] =
    input.config.isProduction &&
    !input.config.allowSampleCurriculum &&
    !input.config.allowUnreviewedCurriculum &&
    !input.config.allowSampleLearningContent &&
    !input.config.allowUnreviewedLearningContent &&
    !input.config.allowSampleQuestions &&
    !input.config.allowUnreviewedQuestions &&
    !input.config.devRoutes
      ? 'PASS'
      : 'FAIL'
  addChecks('engineering', input.engineering)
  addChecks('qa', input.qa)
  addChecks('regression', input.regression)
  addChecks('documentation', input.documentation)

  const blockingIssues = [
    ...input.readiness.issues
      .filter((current) => current.severity === 'blocking')
      .map((current) => `${current.code}: ${current.message}`),
    ...Object.entries(checks)
      .filter(([, status]) => status === 'FAIL')
      .map(([name]) => `${name}: 未通过`),
  ]
  const limitations = [...new Set(input.limitations ?? [])]
  const decision =
    blockingIssues.length > 0
      ? 'NOT_READY'
      : limitations.length > 0
        ? 'READY_WITH_LIMITATIONS'
        : 'READY'
  return { decision, blockingIssues: [...new Set(blockingIssues)], limitations, checks }
}
