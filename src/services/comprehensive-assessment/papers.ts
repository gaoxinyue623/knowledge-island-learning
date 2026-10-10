import { productionCurriculumIndex } from '@/data/curriculum/production'
import type { LearningMapViewModel, Question } from '@/types'

export interface AssessmentPaper {
  id: string
  title: string
  questions: Question[]
  coveredPoints: number
  totalPoints: number
}

/** Stable, balanced papers; only released questions from this exact textbook are eligible. */
export function buildAssessmentPapers(
  model: LearningMapViewModel,
  unitId?: string,
  index = productionCurriculumIndex,
): AssessmentPaper[] {
  const nodes = model.islands
    .filter((island) => !unitId || island.unitId === unitId)
    .flatMap((island) => island.lessons.flatMap((lesson) => lesson.nodes))
  // Open projects remain in the learning map but are not scored exam objectives.
  const openPoints = new Set(
    index.knowledgePoints.filter((p) => p.abilityTags.includes('开放实践')).map((p) => p.id),
  )
  const points = [...new Set(nodes.map((node) => node.knowledgePointId))].filter(
    (id) => !openPoints.has(id),
  )
  const supported = new Set([
    'singleChoice',
    'multipleChoice',
    'trueFalse',
    'fillBlank',
    'calculation',
    'shortAnswer',
  ])
  const eligible = index.questions.filter(
    (q) =>
      q.textbookVersionId === model.textbook.id &&
      supported.has(q.questionType) &&
      !q.tags.includes('unit-sync-only'),
  )
  const eligibleById = new Map(eligible.map((q) => [q.id, q]))
  const byPoint = new Map<string, Map<string, Question>>()
  for (const mapping of index.questionKnowledgePoints) {
    const question = eligibleById.get(mapping.questionId)
    if (!question) continue
    const pool = byPoint.get(mapping.knowledgePointId) ?? new Map<string, Question>()
    pool.set(question.id, question)
    byPoint.set(mapping.knowledgePointId, pool)
  }
  const pools = points.map((point) =>
    [...(byPoint.get(point)?.values() ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
  )
  if (!pools.some((pool) => pool.length)) return []
  const rounds =
    model.textbook.subject === 'ENGLISH'
      ? Math.max(2, Math.ceil((unitId ? 12 : 24) / Math.max(1, points.length)))
      : unitId
        ? 2
        : 1
  return ['A', 'B', 'C'].map((label, variant) => {
    const selected = new Map<string, Question>()
    // Cover every point before adding balanced rounds; space the three starts across the pool.
    for (let round = 0; round < rounds; round++) {
      for (const pool of pools) {
        for (let offset = 0; offset < pool.length; offset++) {
          const question =
            pool[(Math.floor((variant * pool.length) / 3) + round + offset) % pool.length]!
          if (!selected.has(question.id)) {
            selected.set(question.id, question)
            break
          }
        }
      }
    }
    const questions = [...selected.values()]
    return {
      id: `comprehensive:v2:${model.textbook.id}:${unitId ?? 'final'}:${label}`,
      title: `${unitId ? '单元综合测验' : '期末综合测验'} · ${label}卷`,
      questions,
      totalPoints: points.length,
      coveredPoints: pools.filter((pool) => pool.some((q) => selected.has(q.id))).length,
    }
  })
}

export function scopeCompleted(model: LearningMapViewModel, unitId?: string): boolean {
  const lessons = model.islands
    .filter((island) => !unitId || island.unitId === unitId)
    .flatMap((island) => island.lessons)
  return (
    lessons.length > 0 &&
    lessons.every(
      (lesson) =>
        lesson.nodes.length > 0 &&
        lesson.nodes.every((node) => ['completed', 'mastered', 'perfect'].includes(node.status)),
    )
  )
}
