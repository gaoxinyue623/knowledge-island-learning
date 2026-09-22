import type {
  LearningAgentContext,
  LearningAgentSnapshot,
  LearningPlannerConfig,
} from '@/types/learning-agent'
import { CurriculumResolver } from './curriculumResolver'
import { StudentKnowledgeStateBuilder } from './studentKnowledgeStateBuilder'
import { buildLearningMapSourceFromDomain } from '@/services/learning-map/curriculumSource'
import { buildLearningMapViewModel } from '@/services/learning-map/learningMapAdapter'
import { toStrategyKnowledgeRelations } from '@/services/learning-strategy/strategyAdapters'
import { learningStrategyService } from '@/services/learning-strategy/learningStrategyService'
import { isQuestionRecordReadable } from '@/services/curriculum/accessPolicy'

export function scopeAgentSnapshot(input: LearningAgentSnapshot): LearningAgentSnapshot {
  const s = structuredClone(input),
    profileId = s.profile.studentId,
    textbookId = s.curriculum.textbook.id
  const demo = s.dataset === 'demo',
    ids = new Set(s.curriculum.knowledgePoints.map((k) => k.id))
  const sourceAllowed = (p: { isSampleDerived: boolean; verificationStatus?: string }) =>
    demo || (!p.isSampleDerived && p.verificationStatus === 'REVIEWED')
  s.questions = s.questions.filter(
    (q) =>
      (!q.textbookVersionId || q.textbookVersionId === textbookId) &&
      isQuestionRecordReadable(q, {
        allowSampleCurriculum: demo,
        allowUnreviewedCurriculum: demo,
        allowSampleQuestions: demo,
        allowUnreviewedQuestions: demo,
      }),
  )
  const questions = new Set(s.questions.map((q) => q.id))
  s.mappings = s.mappings.filter(
    (m) =>
      questions.has(m.questionId) &&
      ids.has(m.knowledgePointId) &&
      (demo || (!m.isSample && m.verificationStatus === 'REVIEWED')),
  )
  s.sessions = s.sessions.filter(
    (session) =>
      session.id.startsWith(`question-session:${profileId}:`) &&
      session.textbookId === textbookId &&
      ids.has(session.knowledgePointId),
  )
  s.masteryRecords = s.masteryRecords.filter(
    (m) =>
      m.studentProfileId === profileId &&
      ids.has(m.knowledgePointId) &&
      Number.isFinite(m.masteryScore) &&
      m.masteryScore >= 0 &&
      m.masteryScore <= 100 &&
      Number.isFinite(m.confidence) &&
      m.confidence >= 0 &&
      m.confidence <= 1 &&
      (demo || (!m.isSampleDerived && m.evidenceSourceStatus === 'REVIEWED')),
  )
  const sessionIds = new Set(s.sessions.map((session) => session.id))
  s.evidence = s.evidence.filter(
    (e) =>
      e.studentProfileId === profileId &&
      ids.has(e.knowledgePointId) &&
      e.source.questionSessionId &&
      sessionIds.has(e.source.questionSessionId) &&
      questions.has(e.source.questionId) &&
      (demo || (!e.metadata?.isSample && e.metadata?.sourceVerificationStatus === 'REVIEWED')),
  )
  s.wrongBook = s.wrongBook.filter(
    (w) =>
      w.profileId === profileId &&
      (w.textbookId === textbookId || w.textbookIds?.includes(textbookId)) &&
      w.knowledgePointIds.some((id) => ids.has(id)) &&
      sourceAllowed(w.provenance),
  )
  s.reviewQueue = s.reviewQueue.filter(
    (r) =>
      r.profileId === profileId &&
      r.textbookId === textbookId &&
      ids.has(r.knowledgePointId) &&
      sourceAllowed(r.provenance),
  )
  s.history = s.history.filter(
    (h) =>
      h.profileId === profileId &&
      h.textbookId === textbookId &&
      ids.has(h.knowledgePointId) &&
      sourceAllowed(h.provenance),
  )
  if (
    s.dailyPlan?.profileId !== profileId ||
    s.dailyPlan.dataset !== s.dataset ||
    !Object.values(s.dailyPlan.textbookIds).includes(textbookId)
  )
    s.dailyPlan = null
  return s
}
export function buildAgentContext(
  snapshot: LearningAgentSnapshot,
  profileId: string,
  textbookId: string,
  now: string,
  config: LearningPlannerConfig,
): { context: LearningAgentContext; snapshot: LearningAgentSnapshot } {
  const curriculum = new CurriculumResolver().resolve(snapshot, profileId, textbookId, now)
  const scoped = scopeAgentSnapshot(snapshot)
  const map = buildLearningMapViewModel(
    buildLearningMapSourceFromDomain(scoped.curriculum),
    scoped.progress,
    { dataset: scoped.dataset },
  )
  const mapNodes = map.islands.flatMap((unit) =>
    unit.lessons.flatMap((lesson) =>
      lesson.nodes.map((node) => ({
        id: node.id,
        knowledgePointId: node.knowledgePointId,
        status: node.status,
        textbookId,
        unitId: unit.unitId,
        lessonId: lesson.lessonId,
        sort: node.sort,
        isSample: node.isSample,
        verificationStatus: node.verificationStatus,
      })),
    ),
  )
  const current = scoped.currentKnowledgePointId
    ? mapNodes.find(
        (n) => n.knowledgePointId === scoped.currentKnowledgePointId && n.status !== 'locked',
      )
    : (mapNodes.find((n) => n.status === 'learning') ??
      mapNodes.find((n) => n.status === 'available') ??
      mapNodes.find((n) => n.status !== 'locked'))
  if (!current) throw new Error('AGENT_NO_AVAILABLE_KNOWLEDGE_POINT')
  const knowledgeRelations = toStrategyKnowledgeRelations(map)
  const knowledgeState = new StudentKnowledgeStateBuilder().build(scoped, now, config)
  const recentAttempts = scoped.sessions
    .flatMap((s) =>
      s.attempts.filter(
        (a) =>
          s.questionIds.includes(a.questionId) &&
          scoped.mappings.some((m) => m.questionId === a.questionId),
      ),
    )
    .sort(
      (a, b) =>
        (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '') ||
        a.questionId.localeCompare(b.questionId),
    )
    .slice(-50)
  const strategyRecommendations = learningStrategyService.resolve({
    studentProfileId: profileId,
    currentTextbookId: textbookId,
    currentKnowledgePointId: current.knowledgePointId,
    mapNodes,
    knowledgeRelations,
    masteryRecords: scoped.masteryRecords,
    learningEvidence: scoped.evidence,
    questionHistory: recentAttempts,
    dataset: scoped.dataset,
  })
  return {
    snapshot: scoped,
    context: {
      profileId,
      curriculum,
      dataset: scoped.dataset,
      currentLearning: {
        knowledgePointId: current.knowledgePointId,
        lessonId: current.lessonId,
        unitId: current.unitId,
      },
      knowledgeState,
      recentAttempts,
      recentLearningEvidence: [...scoped.evidence]
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
        .slice(-50),
      wrongBookSummary: scoped.wrongBook,
      reviewQueueSummary: scoped.reviewQueue,
      learningHistorySummary: scoped.history,
      strategyRecommendations,
      dailyPlanContext: scoped.dailyPlan,
      mapNodes,
      knowledgeRelations,
    },
  }
}
