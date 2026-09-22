import { describe, expect, it } from 'vitest'
import { applyHumanReview, HUMAN_REVIEW_FIELDS } from '../scripts/llm/humanReview'
import {
  buildEvaluationReport,
  type HumanReviewSample,
} from '@/services/learning-agent/realLLMEvaluation'

function candidate() {
  const report = buildEvaluationReport([], {
    provider: 'test',
    model: 'test',
    batchCount: 5,
    batchSize: 20,
  })
  report.coverageComplete = true
  report.acceptanceStatus = 'INCONCLUSIVE'
  report.failures = []
  for (const key of Object.keys(report.gates.blocking) as Array<keyof typeof report.gates.blocking>)
    report.gates.blocking[key] = true
  for (const key of Object.keys(report.gates.quality) as Array<keyof typeof report.gates.quality>)
    report.gates.quality[key] = true
  report.humanReview.samples = Array.from({ length: 40 }, (_, i): HumanReviewSample => ({
    scenarioId: 'ABCDEFGH'[Math.floor(i / 5)]!,
    sampleId: `sample-${i}`,
    questionId: `q-${i}`,
    source: 'REAL_LLM_ONLY',
    stem: '12 - 3 = ?',
    expectedAnswer: 9,
    explanation: '从 12 中去掉 3，还剩 9。',
    difficulty: 'FOUNDATION',
    requestedDifficulty: 0.2,
    target: '借位减法',
    review: 'PENDING',
    ageAppropriate: 'PENDING',
    ambiguity: 'PENDING',
    targetTraining: 'PENDING',
    difficultyReasonable: 'PENDING',
    naturalLanguage: 'PENDING',
    explanationCorrect: 'PENDING',
    withinCurriculum: 'PENDING',
  }))
  const form = {
    provider: report.provider,
    model: report.model,
    promptVersions: report.promptVersions,
    reviewer: 'test-person',
    reviewedAt: '2026-09-18T08:00:00Z',
    samples: structuredClone(report.humanReview.samples),
  }
  for (const sample of form.samples) for (const field of HUMAN_REVIEW_FIELDS) sample[field] = 'PASS'
  return { report, form }
}

describe('human review import (synthetic fixtures, never actual review decisions)', () => {
  it('requires all fields and binds approval to unchanged question content and prompt version', () => {
    const { report, form } = candidate()
    form.samples[0]!.explanationCorrect = 'PENDING'
    expect(() => applyHumanReview(report, form)).toThrow('HUMAN_REVIEW_INCOMPLETE')
    form.samples[0]!.explanationCorrect = 'PASS'
    form.samples[0]!.expectedAnswer = 10
    expect(() => applyHumanReview(report, form)).toThrow('HUMAN_REVIEW_CONTENT_CHANGED')
    form.samples[0]!.expectedAnswer = 9
    form.promptVersions = ['old-prompt']
    expect(() => applyHumanReview(report, form)).toThrow('HUMAN_REVIEW_IDENTITY_OR_VERSION_INVALID')
  })
  it('promotes only complete evidence and treats explicit curriculum rejection as blocking', () => {
    const { report, form } = candidate()
    expect(applyHumanReview(report, form).acceptanceStatus).toBe('PASS')
    report.coverageComplete = false
    expect(applyHumanReview(report, form).acceptanceStatus).toBe('INCONCLUSIVE')
    report.coverageComplete = true
    form.samples[0]!.withinCurriculum = 'REJECT'
    expect(applyHumanReview(report, form).acceptanceStatus).toBe('FAIL')
    expect(report.humanReview.status).toBe('PENDING')
  })
  it('cannot hide a negative detailed review behind an overall PASS', () => {
    const { report, form } = candidate()
    form.samples[0]!.naturalLanguage = 'NEEDS_REVISION'
    expect(applyHumanReview(report, form).acceptanceStatus).toBe('CONDITIONAL_PASS')
  })
})
