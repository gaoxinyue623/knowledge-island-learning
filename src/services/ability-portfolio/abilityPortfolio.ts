import { productionCurriculumIndex } from '@/data/curriculum/production'
import {
  projectSpacedReviewEvidence,
  type SpacedReviewEvidence,
} from '@/services/student-growth/spacedReview'
import type { LearningHistoryRecord, SubjectCode } from '@/types'

export type AbilityPortfolioStatus = 'practiced' | 'consolidating' | 'mastered'
export interface AbilityPortfolioItem {
  id: string
  knowledgePointId: string
  title: string
  subject: SubjectCode
  status: AbilityPortfolioStatus
  representativePrompt?: string
  latestAt: string
  usedHint: boolean | null
  hadIncorrectAnswer: boolean | null
  courseHref?: string
  completedIndependentRounds: number
  history: LearningHistoryRecord[]
}

export interface AbilityPortfolioProjectionInput {
  profileId: string
  evidence: readonly SpacedReviewEvidence[]
  history: readonly LearningHistoryRecord[]
  currentRevisionByQuest: Readonly<Record<string, string | null>>
  now?: Date
}

function catalogSubject(textbookId: string): SubjectCode | null {
  const textbook = productionCurriculumIndex.textbooks.find((item) => item.id === textbookId)
  return textbook
    ? (productionCurriculumIndex.subjects.find((item) => item.id === textbook.subjectId)?.code ?? null)
    : null
}

/** Read-only, evidence-first projection. Old history proves practice, never mastery. */
export function projectAbilityPortfolio(input: AbilityPortfolioProjectionInput): AbilityPortfolioItem[] {
  const now = input.now ?? new Date()
  const profileHistory = input.history.filter(record => record.profileId === input.profileId &&
    !record.provenance.isSampleDerived &&
    (record.type === 'lesson_completed' || record.type === 'assessment_completed'))
  const active = input.evidence.filter(
    (item) =>
      item.profileId === input.profileId &&
      input.currentRevisionByQuest[item.questId] === item.contentRevision,
  )
  const byQuest = new Map<string, SpacedReviewEvidence[]>()
  for (const item of active) byQuest.set(item.questId, [...(byQuest.get(item.questId) ?? []), item])
  const result: AbilityPortfolioItem[] = []
  const evidencedKnowledgePoints = new Set<string>()
  for (const attempts of byQuest.values()) {
    const schedule = projectSpacedReviewEvidence(attempts, now)
    if (!schedule) continue
    const latest = schedule.latest
    const context = new URL(latest.courseHref, 'https://knowledge-island.local')
    const knowledgePointId = context.searchParams.get('knowledgePointId')
    if (!knowledgePointId) continue
    evidencedKnowledgePoints.add(knowledgePointId)
    const usedHint = latest.stages.some((stage) => stage.usedHint)
    const hadIncorrectAnswer = latest.stages.some((stage) => stage.hadIncorrectAnswer)
    result.push({
      id: `${latest.questId}:${latest.contentRevision}`,
      knowledgePointId,
      title: latest.title,
      subject: latest.subject,
      status:
        schedule.completedIndependentRounds >= 3 && !schedule.needsSupport
          ? 'mastered'
          : 'consolidating',
      representativePrompt: latest.stages[0]?.prompt,
      latestAt: latest.completedAt,
      usedHint,
      hadIncorrectAnswer,
      courseHref: latest.courseHref,
      completedIndependentRounds: schedule.completedIndependentRounds,
      history: profileHistory.filter((record) => record.knowledgePointId === knowledgePointId),
    })
  }
  const historyByKnowledgePoint = new Map<string, LearningHistoryRecord[]>()
  for (const record of profileHistory)
    historyByKnowledgePoint.set(record.knowledgePointId, [
      ...(historyByKnowledgePoint.get(record.knowledgePointId) ?? []),
      record,
    ])
  for (const [knowledgePointId, records] of historyByKnowledgePoint) {
    if (evidencedKnowledgePoints.has(knowledgePointId)) continue
    const latest = [...records].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0]!
    const subject = catalogSubject(latest.textbookId)
    if (!subject) continue
    result.push({
      id: `history:${knowledgePointId}`,
      knowledgePointId,
      title: productionCurriculumIndex.knowledgePoints.find(point => point.id === knowledgePointId)?.name ?? '已完成的课程',
      subject,
      status: 'practiced',
      latestAt: latest.occurredAt,
      usedHint: null,
      hadIncorrectAnswer: null,
      completedIndependentRounds: 0,
      history: records,
    })
  }
  return result.sort((left, right) => right.latestAt.localeCompare(left.latestAt))
}
