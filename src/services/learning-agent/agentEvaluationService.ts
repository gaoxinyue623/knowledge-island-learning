import type { LearningAction, LearningAgentResult } from '@/types/learning-agent'
export interface AgentEvaluationCase {
  id: string
  expected: LearningAction | 'BLOCKED'
  result: LearningAgentResult
}
export class AgentEvaluationService {
  evaluate(cases: readonly AgentEvaluationCase[]) {
    const results = cases.map((test) => {
      const actual = test.result.decision?.action ?? 'BLOCKED'
      const expectedMatch =
        test.expected === 'BLOCKED'
          ? test.result.status === 'BLOCKED'
          : actual === test.expected && test.result.status === 'READY'
      const blockedResourcesEmpty =
        test.result.status === 'READY' ||
        (test.result.generatedResources.questions.length === 0 &&
          test.result.generatedResources.content.length === 0)
      const traceComplete = test.result.trace.events.at(-1)?.event === test.result.status
      const explainable =
        !test.result.decision ||
        (test.result.decision.reasons.length > 0 && test.result.decision.evidenceRefs.length > 0)
      const validReady = test.result.status !== 'READY' || test.result.validation.status === 'VALID'
      return {
        id: test.id,
        expected: test.expected,
        actual,
        status: test.result.status,
        passed:
          expectedMatch && blockedResourcesEmpty && traceComplete && explainable && validReady,
        checks: { expectedMatch, blockedResourcesEmpty, traceComplete, explainable, validReady },
      }
    })
    return {
      algorithmVersion: 'AGENT_EVALUATION_V1',
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      results,
    }
  }
}
