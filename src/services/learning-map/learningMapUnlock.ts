import type { Id, KnowledgeMapNode, LearningMapProgressRecord, LearningNodeStatus } from '@/types'

import { buildProgressIndex, isCompletedNodeStatus, clampProgress } from './learningMapProgress'

export interface ResolvedNodeState {
  status: LearningNodeStatus
  progress: number
}

function completedKnowledgePointIds(
  nodes: KnowledgeMapNode[],
  records: ReadonlyMap<Id, LearningMapProgressRecord>,
): ReadonlySet<Id> {
  return new Set(
    nodes
      .filter((node) => {
        const record = records.get(node.id)
        return record ? isCompletedNodeStatus(record.status) : false
      })
      .map((node) => node.knowledgePointId),
  )
}

function statusFromRecord(
  node: KnowledgeMapNode,
  record: LearningMapProgressRecord | undefined,
  completedKnowledgePoints: ReadonlySet<Id>,
): ResolvedNodeState | null {
  if (!record) return null
  if (isCompletedNodeStatus(record.status)) {
    return { status: record.status, progress: Math.max(100, clampProgress(record.progress)) }
  }
  if (record.status === 'learning') {
    return { status: 'learning', progress: Math.max(1, clampProgress(record.progress)) }
  }
  if (
    record.status === 'available' &&
    node.prerequisites.every((prerequisiteId) => completedKnowledgePoints.has(prerequisiteId))
  ) {
    return { status: 'available', progress: clampProgress(record.progress) }
  }
  return null
}

/**
 * Deterministic map rule. Mastered/perfect are fixture states only in PHASE 7;
 * this function never derives either state from a score.
 */
export function resolveNodeStates(
  nodes: KnowledgeMapNode[],
  progressRecords: LearningMapProgressRecord[],
): ReadonlyMap<Id, ResolvedNodeState> {
  const records = buildProgressIndex(progressRecords)
  const resolved = new Map<Id, ResolvedNodeState>()

  for (const node of nodes) {
    const completedKnowledgePoints = completedKnowledgePointIds(nodes, records)
    const recordedState = statusFromRecord(node, records.get(node.id), completedKnowledgePoints)
    if (recordedState) {
      resolved.set(node.id, recordedState)
      continue
    }
    const unlocked = node.prerequisites.every((prerequisiteId) =>
      completedKnowledgePoints.has(prerequisiteId),
    )
    resolved.set(node.id, { status: unlocked ? 'available' : 'locked', progress: 0 })
  }

  return resolved
}

export function resolveNodeStatus(
  node: KnowledgeMapNode,
  nodes: KnowledgeMapNode[],
  progressRecords: LearningMapProgressRecord[],
): ResolvedNodeState {
  return (
    resolveNodeStates(nodes, progressRecords).get(node.id) ?? {
      status: 'locked',
      progress: 0,
    }
  )
}

export function findCurrentNodeId(nodes: KnowledgeMapNode[]): Id | undefined {
  return (
    nodes.find((node) => node.status === 'learning')?.id ??
    nodes.find((node) => node.status === 'available')?.id ??
    [...nodes].reverse().find((node) => isCompletedNodeStatus(node.status))?.id
  )
}
