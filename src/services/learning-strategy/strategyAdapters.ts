import type {
  Id,
  KnowledgeRelation,
  KnowledgeMapNode,
  LearningMapConnection,
  LearningMapViewModel,
  StrategyMapNode,
} from '@/types'

/** Flatten the existing map view without changing its state or progress. */
export function toStrategyMapNodes(viewModel: LearningMapViewModel): StrategyMapNode[] {
  return viewModel.islands.flatMap((island) =>
    island.lessons.flatMap((lesson) =>
      lesson.nodes.map((node) => toStrategyMapNode(node, viewModel.textbook.id)),
    ),
  )
}

export function toStrategyMapNode(node: KnowledgeMapNode, textbookId?: Id): StrategyMapNode {
  return {
    id: node.id,
    knowledgePointId: node.knowledgePointId,
    status: node.status,
    progress: node.progress,
    ...(textbookId ? { textbookId } : {}),
    title: node.title,
    mapNodeId: node.id,
    sort: node.sort,
    prerequisiteKnowledgePointIds: node.prerequisites,
    isSample: node.isSample,
    verificationStatus: node.verificationStatus,
  }
}

/**
 * Convert the map's visual connection projection back to strategy relations.
 * The projection is already resolved by the map service; strategy only reads
 * it and never uses it to unlock or mutate nodes.
 */
export function toStrategyKnowledgeRelations(viewModel: LearningMapViewModel): KnowledgeRelation[] {
  const nodesById = new Map(toStrategyMapNodes(viewModel).map((node) => [node.id, node]))

  return viewModel.connections.flatMap((connection) => {
    const from = nodesById.get(connection.fromNodeId)
    const to = nodesById.get(connection.toNodeId)
    if (!from || !to) return []
    return [
      {
        id: connection.id,
        sourceKnowledgePointId: from.knowledgePointId,
        targetKnowledgePointId: to.knowledgePointId,
        relationType: connection.relationType,
        textbookId: viewModel.textbook.id,
        isSample: viewModel.flags.isDemo || from.isSample || to.isSample,
        verificationStatus: viewModel.flags.isUnverified ? 'UNVERIFIED' : from.verificationStatus,
      },
    ]
  })
}

/** Keep the relation adapter usable for callers that already have map pieces. */
export function toStrategyRelation(
  relation: LearningMapConnection,
  nodesById: ReadonlyMap<Id, KnowledgeMapNode>,
  textbookId?: Id,
): KnowledgeRelation | null {
  const from = nodesById.get(relation.fromNodeId)
  const to = nodesById.get(relation.toNodeId)
  if (!from || !to) return null
  return {
    id: relation.id,
    sourceKnowledgePointId: from.knowledgePointId,
    targetKnowledgePointId: to.knowledgePointId,
    relationType: relation.relationType,
    ...(textbookId ? { textbookId } : {}),
  }
}
