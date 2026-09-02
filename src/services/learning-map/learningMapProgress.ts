import type {
  Id,
  KnowledgeMapNode,
  LearningMapProgressRecord,
  LearningMapProgressSummary,
  LearningNodeStatus,
  LessonMapSection,
  UnitIsland,
} from '@/types'

export const COMPLETED_NODE_STATUSES: ReadonlySet<LearningNodeStatus> = new Set([
  'completed',
  'mastered',
  'perfect',
])

export function isCompletedNodeStatus(status: LearningNodeStatus): boolean {
  return COMPLETED_NODE_STATUSES.has(status)
}

export function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
}

export function buildProgressIndex(
  records: LearningMapProgressRecord[],
): ReadonlyMap<Id, LearningMapProgressRecord> {
  return new Map(records.map((record) => [record.nodeId, record]))
}

export function computeKnowledgeProgress(nodes: KnowledgeMapNode[]): LearningMapProgressSummary {
  const totalNodes = nodes.length
  const completedNodes = nodes.filter((node) => isCompletedNodeStatus(node.status)).length
  return {
    completedNodes,
    totalNodes,
    percentage: totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100),
  }
}

export function computeLessonProgress(lesson: LessonMapSection): LearningMapProgressSummary {
  return computeKnowledgeProgress(lesson.nodes)
}

export function computeUnitProgress(unit: UnitIsland): LearningMapProgressSummary {
  const totalLessons = unit.lessons.length
  const completedLessons = unit.lessons.filter((lesson) =>
    isCompletedNodeStatus(lesson.status),
  ).length
  return {
    completedNodes: completedLessons,
    totalNodes: totalLessons,
    percentage: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
  }
}
