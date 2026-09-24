import type { MasteryRecord } from '@/types'
import type { LearningAgentSnapshot, LearningDecision } from '@/types/learning-agent'
import type { CompletedLearningTask } from './adaptiveLearningPlan'
import { buildAgentContext, scopeAgentSnapshot } from './contextBuilder'
import { questionText } from './deterministicAnswerValidator'
import { LearningPlanner } from './learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from './plannerConfig'

type MasterySummary = Pick<
  MasteryRecord,
  'masteryScore' | 'confidence' | 'state' | 'evidenceCount' | 'algorithmVersion'
>

export interface AdaptivePlanReport {
  completedTasks: number
  taskLimit: number
  totalAnswers: number
  correctAnswers: number
  incorrectAnswers: number
  /** Only evidence created during this plan, never the scenario's historical evidence. */
  evidenceCount: number
  masteryChanges: Array<{
    knowledgePointId: string
    name: string
    before: MasterySummary | null
    after: MasterySummary | null
    evidenceCount: number
  }>
  wrongAnswers: Array<{
    taskNumber: number
    questionId: string
    stem: string
    submittedAnswer: string
    expectedAnswer: string
    explanation: string
  }>
  recommendation: LearningDecision | null
  recommendationTargetName: string | null
  recommendationError: string | null
}

function masterySummary(record: MasteryRecord | undefined): MasterySummary | null {
  // No evidence is different from an observed score of zero.
  if (!record?.evidenceCount) return null
  return {
    masteryScore: record.masteryScore,
    confidence: record.confidence,
    state: record.state,
    evidenceCount: record.evidenceCount,
    algorithmVersion: record.algorithmVersion,
  }
}

/** Read-only projection of committed tasks; never generates questions or writes learning facts. */
export function buildAdaptivePlanReport(
  baseline: LearningAgentSnapshot,
  current: LearningAgentSnapshot,
  completed: readonly CompletedLearningTask[],
  taskLimit: number,
): AdaptivePlanReport | null {
  const latest = completed.at(-1)
  if (!latest) return null
  const before = scopeAgentSnapshot(baseline)
  const after = scopeAgentSnapshot(current)
  const analyses = completed.flatMap((row) => row.analyses)
  const oldEvidenceIds = new Set(before.evidence.map((item) => item.id))
  const committedIds = new Set(analyses.flatMap((item) => item.evidence.map((e) => e.id)))
  const evidence = [
    ...new Map(
      after.evidence
        .filter((e) => committedIds.has(e.id) && !oldEvidenceIds.has(e.id))
        .map((e) => [e.id, e]),
    ).values(),
  ]
  const practicedIds = new Set(analyses.flatMap((item) => item.affectedKnowledgePoints))
  const report: AdaptivePlanReport = {
    completedTasks: completed.length,
    taskLimit,
    totalAnswers: analyses.length,
    correctAnswers: analyses.filter((item) => item.correct === true).length,
    incorrectAnswers: analyses.filter((item) => item.correct === false).length,
    evidenceCount: evidence.length,
    masteryChanges: after.curriculum.knowledgePoints
      .filter((point) => practicedIds.has(point.id))
      .map((point) => ({
        knowledgePointId: point.id,
        name: point.name,
        before: masterySummary(before.masteryRecords.find((r) => r.knowledgePointId === point.id)),
        after: masterySummary(after.masteryRecords.find((r) => r.knowledgePointId === point.id)),
        evidenceCount: evidence.filter((e) => e.knowledgePointId === point.id).length,
      })),
    wrongAnswers: completed.flatMap((row, index) =>
      row.task.generatedResources.questions.flatMap((question, questionIndex) => {
        if (row.analyses[questionIndex]?.correct !== false) return []
        const answer = row.answers.find((a) => a.questionId === question.id)?.answer
        return [
          {
            taskNumber: index + 1,
            questionId: question.id,
            stem: questionText(question),
            submittedAnswer: answer?.type === 'calculation' ? answer.value : '—',
            expectedAnswer:
              question.answerRule.ruleType === 'NUMERIC' ? String(question.answerRule.value) : '—',
            explanation: question.explanation.summary.map((block) => block.text ?? '').join(' '),
          },
        ]
      }),
    ),
    recommendation: null,
    recommendationTargetName: null,
    recommendationError: null,
  }
  try {
    // Same context, time and planner as the next task, without invoking a provider.
    const { context } = buildAgentContext(
      after,
      after.profile.studentId,
      after.curriculum.textbook.id,
      latest.completedAt,
      DEFAULT_LEARNING_PLANNER_CONFIG,
    )
    report.recommendation = new LearningPlanner().plan(context)
    report.recommendationTargetName =
      after.curriculum.knowledgePoints.find(
        (point) => point.id === report.recommendation?.targetKnowledgePointId,
      )?.name ?? null
  } catch {
    // A recommendation failure must not invalidate an already committed submission.
    report.recommendationError = '暂时无法生成后续建议，已完成的作答与复盘仍保留。'
  }
  return report
}
