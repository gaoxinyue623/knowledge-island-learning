import type { QuestionGeneratorMode } from '@/types/llm'
import { DevQuestionGeneratorClient } from './devQuestionGeneratorClient'
import type {
  LearningAgentResult,
  LearningAgentSnapshot,
  AnswerAnalysisResult,
} from '@/types/learning-agent'
import { productionConfig } from '@/config/production'
import { LearningOrchestrator } from './learningOrchestrator'
import { AnswerAnalyzer } from './answerAnalyzer'
import { parseArithmetic, questionText } from './deterministicAnswerValidator'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import { createQuestionSession } from '@/services/question-engine/questionEngineAdapter'
import { rebuildMasteryFromEvidence } from '@/services/mastery/masteryEngine'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery/masteryPolicy'
import { projectSimulationFacts } from './simulationFactProjection'
import { stableId } from './plannerConfig'

export type SimulationAnswerMode =
  'CORRECT' | 'INCORRECT' | 'BORROWING_ERROR' | 'CARRYING_ERROR' | 'REPEATED_FAILURE'
/** Entirely in memory. No production repository or browser storage write capability. */
export class LearningAgentSimulation {
  snapshot: LearningAgentSnapshot
  lastAnalysis: AnswerAnalysisResult[] = []
  private consumed = new Set<string>()
  constructor(snapshot: LearningAgentSnapshot) {
    if (!productionConfig.devRoutes || snapshot.dataset !== 'demo')
      throw new Error('AGENT_SIMULATION_DISABLED')
    this.snapshot = structuredClone(snapshot)
  }
  run(now: string, seed = 'phase17', mode: QuestionGeneratorMode = 'MOCK') {
    return new LearningOrchestrator({
      load: async () => structuredClone(this.snapshot),
    }).prepareNextLearningTask(
      this.snapshot.profile.studentId,
      this.snapshot.curriculum.textbook.id,
      {
        now,
        seed,
        questionProvider:
          mode === 'REAL_LLM' ? new DevQuestionGeneratorClient(this.snapshot) : undefined,
      },
    )
  }
  async answer(
    task: LearningAgentResult,
    mode: SimulationAnswerMode,
    now: string,
  ): Promise<AnswerAnalysisResult[]> {
    if (
      task.status !== 'READY' ||
      !task.decision ||
      !task.context ||
      task.context.dataset !== 'demo' ||
      task.context.profileId !== this.snapshot.profile.studentId ||
      task.decision.textbookId !== this.snapshot.curriculum.textbook.id
    )
      throw new Error('AGENT_TASK_NOT_READY')
    const taskKey = task.generatedResources.questions.map((q) => q.id).join('|')
    if (this.consumed.has(taskKey)) return this.lastAnalysis
    const point = task.decision.targetKnowledgePointId
    const node = task.context.mapNodes.find(
      (n) => n.knowledgePointId === point && n.status !== 'locked',
    )!
    const questions = task.generatedResources.questions
    if (mode === 'BORROWING_ERROR' || mode === 'CARRYING_ERROR') {
      const eligible = questions.some((q) => {
        const c = parseArithmetic(questionText(q))
        return (
          c &&
          (mode === 'BORROWING_ERROR'
            ? c.operator === '-' && c.left % 10 < c.right % 10
            : c.operator === '+' && (c.left % 10) + (c.right % 10) >= 10)
        )
      })
      if (!eligible)
        throw new Error('本批没有对应的退位或进位题。请切换知识点或提高模拟掌握度后重新生成。')
    }
    const session = createQuestionSession(
      {
        textbookId: task.decision.textbookId,
        unitId: node.unitId!,
        lessonId: node.lessonId!,
        knowledgePointId: point,
        source: 'dev',
      },
      {
        id: task.decision.decisionId,
        knowledgePointId: point,
        questionIds: questions.map((q) => q.id),
        mode: 'practice',
      },
      this.snapshot.profile.studentId,
      stableId('simulation', taskKey),
    )
    session.status = 'completed'
    session.completedAt = now
    session.updatedAt = now
    const workings = new Map<string, { tensResult: number; onesResult: number }>()
    session.attempts = questions.map((q) => {
      let answer = correctAnswerDraft(q)
      const c = parseArithmetic(questionText(q))
      if (c && answer.type === 'calculation' && mode !== 'CORRECT') {
        let value = c.result + 1
        if (mode === 'BORROWING_ERROR' && c.operator === '-' && c.left % 10 < c.right % 10) {
          value = c.result + 10
          workings.set(q.id, {
            tensResult: Math.floor(c.left / 10) - Math.floor(c.right / 10),
            onesResult: (c.left % 10) + 10 - (c.right % 10),
          })
        } else if (
          mode === 'CARRYING_ERROR' &&
          c.operator === '+' &&
          (c.left % 10) + (c.right % 10) >= 10
        ) {
          value = c.result - 10
          workings.set(q.id, {
            tensResult: Math.floor(c.left / 10) + Math.floor(c.right / 10),
            onesResult: (c.left + c.right) % 10,
          })
        }
        answer = { type: 'calculation', value: String(value) }
      }
      return { questionId: q.id, answer, submitted: true, submittedAt: now }
    })
    const analyzer = new AnswerAnalyzer(),
      analyses: AnswerAnalysisResult[] = []
    for (const attempt of session.attempts) {
      const q = questions.find((q) => q.id === attempt.questionId)!
      const analysis = await analyzer.analyze({
        question: q,
        expectedAnswer: q.answerRule,
        studentAnswer: attempt.answer,
        knowledgePoints: task.generatedResources.mappings.filter((m) => m.questionId === q.id),
        attemptContext: {
          profileId: this.snapshot.profile.studentId,
          session,
          subject: task.context.curriculum.subject,
          dataset: 'demo',
          working: workings.get(q.id),
        },
      })
      attempt.result = {
        status: analysis.status,
        score: analysis.score ?? 0,
        maxScore: analysis.score === null ? 0 : 1,
      }
      attempt.errorPatterns = analysis.errorPatterns
      analyses.push(analysis)
    }
    this.snapshot.sessions.push(session)
    this.snapshot.questions = [
      ...new Map([...this.snapshot.questions, ...questions].map((q) => [q.id, q])).values(),
    ]
    this.snapshot.mappings = [
      ...new Map(
        [...this.snapshot.mappings, ...task.generatedResources.mappings].map((m) => [m.id, m]),
      ).values(),
    ]
    this.snapshot.evidence = [
      ...new Map(
        [...this.snapshot.evidence, ...analyses.flatMap((a) => a.evidence)].map((e) => [e.id, e]),
      ).values(),
    ]
    for (const id of new Set(analyses.flatMap((a) => a.affectedKnowledgePoints))) {
      const previous = this.snapshot.masteryRecords.find((r) => r.knowledgePointId === id)
      const record = rebuildMasteryFromEvidence(
        this.snapshot.profile.studentId,
        id,
        this.snapshot.evidence.filter((e) => e.knowledgePointId === id),
        previous,
        DEFAULT_MASTERY_POLICY,
        now,
      )
      this.snapshot.masteryRecords = [
        ...this.snapshot.masteryRecords.filter((r) => r.knowledgePointId !== id),
        record,
      ]
    }
    projectSimulationFacts(this.snapshot, session, task, now)
    this.snapshot.currentKnowledgePointId = point
    this.consumed.add(taskKey)
    this.lastAnalysis = analyses
    return analyses
  }
}
