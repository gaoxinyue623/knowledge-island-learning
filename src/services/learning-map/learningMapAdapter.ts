import type {
  Id,
  KnowledgeMapNode,
  LearningMapConnection,
  LearningMapCurriculumKnowledgeRelation,
  LearningMapCurriculumSource,
  LearningMapProgressRecord,
  LearningMapViewModel,
  LessonMapSection,
  UnitIsland,
} from '@/types'

import { getKnowledgeVisual, getUnitTheme } from '@/data/learning-map/visualRegistry'
import { buildLearningMapLayout, flattenKnowledgeNodes } from './learningMapLayout'
import {
  computeKnowledgeProgress,
  computeLessonProgress,
  computeUnitProgress,
  isCompletedNodeStatus,
} from './learningMapProgress'
import { findCurrentNodeId, resolveNodeStates } from './learningMapUnlock'

function mapNodeId(textbookId: Id, mappingId: Id): Id {
  return `learning-map:${textbookId}:knowledge:${mappingId}`
}

function mapRecordStatus(
  source: LearningMapCurriculumSource,
  record: {
    isSample: boolean
    verificationStatus?: LearningMapCurriculumSource['verificationStatus']
  },
) {
  return record.verificationStatus ?? source.verificationStatus
}

function addDiagnostic(
  diagnostics: LearningMapViewModel['diagnostics'],
  code: string,
  message: string,
  severity: 'warning' | 'error',
  entityId?: Id,
) {
  diagnostics.push({ code, message, severity, entityId })
}

function buildPrerequisiteIndex(
  relations: LearningMapCurriculumKnowledgeRelation[],
  knowledgePointIds: ReadonlySet<Id>,
  diagnostics: LearningMapViewModel['diagnostics'],
): ReadonlyMap<Id, Id[]> {
  const result = new Map<Id, Id[]>()
  for (const relation of relations) {
    if (relation.relationType !== 'prerequisite') continue
    if (!knowledgePointIds.has(relation.sourceKnowledgePointId)) {
      addDiagnostic(
        diagnostics,
        'MISSING_PREREQUISITE_SOURCE',
        `前置关系 ${relation.id} 的源知识点不存在，已忽略。`,
        'warning',
        relation.id,
      )
      continue
    }
    if (!knowledgePointIds.has(relation.targetKnowledgePointId)) {
      addDiagnostic(
        diagnostics,
        'MISSING_PREREQUISITE_TARGET',
        `前置关系 ${relation.id} 的目标知识点不存在，已忽略。`,
        'warning',
        relation.id,
      )
      continue
    }
    const current = result.get(relation.targetKnowledgePointId) ?? []
    if (!current.includes(relation.sourceKnowledgePointId)) {
      current.push(relation.sourceKnowledgePointId)
    }
    result.set(relation.targetKnowledgePointId, current)
  }
  return result
}

function buildIslands(
  source: LearningMapCurriculumSource,
  diagnostics: LearningMapViewModel['diagnostics'],
): UnitIsland[] {
  const knowledgePoints = new Map(
    source.knowledgePoints.map((knowledgePoint) => [knowledgePoint.id, knowledgePoint]),
  )
  const lessonsByUnitId = new Map<Id, typeof source.lessons>()
  for (const lesson of source.lessons) {
    const lessons = lessonsByUnitId.get(lesson.unitId) ?? []
    lessons.push(lesson)
    lessonsByUnitId.set(lesson.unitId, lessons)
  }
  const mappingsByLessonId = new Map<Id, typeof source.lessonKnowledgePoints>()
  for (const mapping of source.lessonKnowledgePoints) {
    const mappings = mappingsByLessonId.get(mapping.lessonId) ?? []
    mappings.push(mapping)
    mappingsByLessonId.set(mapping.lessonId, mappings)
  }
  const prerequisiteIndex = buildPrerequisiteIndex(
    source.knowledgeRelations,
    new Set(knowledgePoints.keys()),
    diagnostics,
  )

  return [...source.units]
    .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
    .map((unit, unitIndex) => {
      const lessons = [...(lessonsByUnitId.get(unit.id) ?? [])]
        .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
        .map((lesson, lessonIndex): LessonMapSection => {
          const nodes = [...(mappingsByLessonId.get(lesson.id) ?? [])]
            .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
            .flatMap((mapping, nodeIndex): KnowledgeMapNode[] => {
              const knowledgePoint = knowledgePoints.get(mapping.knowledgePointId)
              if (!knowledgePoint) {
                addDiagnostic(
                  diagnostics,
                  'MISSING_KNOWLEDGE_POINT',
                  `课次 ${lesson.title} 的映射 ${mapping.id} 指向不存在的知识点，已忽略。`,
                  'warning',
                  mapping.id,
                )
                return []
              }
              const isSample = source.isSample || mapping.isSample || knowledgePoint.isSample
              return [
                {
                  id: mapNodeId(source.textbook.id, mapping.id),
                  type: 'knowledge',
                  mappingId: mapping.id,
                  knowledgePointId: knowledgePoint.id,
                  lessonId: lesson.id,
                  unitId: unit.id,
                  title: knowledgePoint.name,
                  shortTitle: knowledgePoint.shortTitle,
                  status: 'locked',
                  progress: 0,
                  position: { x: 0, y: 0 },
                  visual: getKnowledgeVisual(source.textbook.subject, lessonIndex, nodeIndex),
                  prerequisites: prerequisiteIndex.get(knowledgePoint.id) ?? [],
                  isSample,
                  verificationStatus: mapRecordStatus(source, knowledgePoint),
                  role: mapping.role,
                  weight: mapping.weight,
                  sort: mapping.sort,
                },
              ]
            })
          return {
            id: `learning-map:${source.textbook.id}:lesson:${lesson.id}`,
            lessonId: lesson.id,
            unitId: unit.id,
            title: lesson.title,
            status: 'locked',
            progress: 0,
            nodes,
            position: { x: 0, y: 0 },
            sort: lesson.sort,
          }
        })
      return {
        id: `learning-map:${source.textbook.id}:unit:${unit.id}`,
        unitId: unit.id,
        title: unit.title,
        subtitle: unit.subtitle,
        status: 'locked',
        progress: 0,
        lessons,
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        theme: getUnitTheme(source.textbook.subject, unitIndex),
        sort: unit.sort,
      }
    })
}

function applyNodeStates(
  islands: UnitIsland[],
  progressRecords: LearningMapProgressRecord[],
): void {
  const nodes = flattenKnowledgeNodes(islands)
  const states = resolveNodeStates(nodes, progressRecords)
  for (const node of nodes) {
    const state = states.get(node.id)
    if (state) {
      node.status = state.status
      node.progress = state.progress
    }
  }
  for (const lesson of islands.flatMap((island) => island.lessons)) {
    const summary = computeLessonProgress(lesson)
    lesson.progress = summary.percentage
    lesson.status = containerStatus(lesson.nodes.map((node) => node.status))
  }
  for (const island of islands) {
    const summary = computeUnitProgress(island)
    island.progress = summary.percentage
    island.status = containerStatus(island.lessons.map((lesson) => lesson.status))
  }
}

function containerStatus(statuses: Array<KnowledgeMapNode['status']>): KnowledgeMapNode['status'] {
  if (statuses.length === 0) return 'locked'
  if (statuses.every((status) => isCompletedNodeStatus(status))) {
    const completedStatuses = new Set(statuses)
    if (completedStatuses.size === 1 && completedStatuses.has('perfect')) return 'perfect'
    if (completedStatuses.has('mastered') || completedStatuses.has('perfect')) return 'mastered'
    return 'completed'
  }
  if (statuses.some((status) => status === 'learning' || isCompletedNodeStatus(status))) {
    return 'learning'
  }
  if (statuses.some((status) => status === 'available')) return 'available'
  return 'locked'
}

function buildConnections(
  source: LearningMapCurriculumSource,
  nodes: KnowledgeMapNode[],
): LearningMapConnection[] {
  const firstNodeByKnowledgePointId = new Map<Id, KnowledgeMapNode>()
  for (const node of nodes) {
    if (!firstNodeByKnowledgePointId.has(node.knowledgePointId)) {
      firstNodeByKnowledgePointId.set(node.knowledgePointId, node)
    }
  }
  return source.knowledgeRelations.flatMap((relation) => {
    const from = firstNodeByKnowledgePointId.get(relation.sourceKnowledgePointId)
    const to = firstNodeByKnowledgePointId.get(relation.targetKnowledgePointId)
    if (!from || !to) return []
    return [
      {
        id: `learning-map:${source.textbook.id}:connection:${relation.id}`,
        fromNodeId: from.id,
        toNodeId: to.id,
        relationType: relation.relationType,
        status: relation.relationType === 'prerequisite' ? 'locked' : 'available',
      },
    ]
  })
}

function refreshConnectionStates(
  connections: LearningMapConnection[],
  nodes: KnowledgeMapNode[],
): void {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  for (const connection of connections) {
    const from = nodesById.get(connection.fromNodeId)
    const to = nodesById.get(connection.toNodeId)
    if (!from || !to) continue
    if (connection.relationType !== 'prerequisite') {
      connection.status = 'available'
    } else if (isCompletedNodeStatus(from.status) && isCompletedNodeStatus(to.status)) {
      connection.status = 'completed'
    } else if (isCompletedNodeStatus(from.status)) {
      connection.status = 'available'
    } else {
      connection.status = 'locked'
    }
  }
}

export interface BuildLearningMapOptions {
  dataset?: LearningMapViewModel['dataset']
  isReadOnly?: boolean
}

export function buildLearningMapViewModel(
  source: LearningMapCurriculumSource,
  progressRecords: LearningMapProgressRecord[] = [],
  options: BuildLearningMapOptions = {},
): LearningMapViewModel {
  const diagnostics: LearningMapViewModel['diagnostics'] = []
  const islands = buildIslands(source, diagnostics)
  const layout = buildLearningMapLayout(islands)
  const nodes = flattenKnowledgeNodes(layout.islands)
  const knownNodeIds = new Set(nodes.map((node) => node.id))
  for (const record of progressRecords) {
    if (!knownNodeIds.has(record.nodeId)) {
      addDiagnostic(
        diagnostics,
        'ORPHAN_PROGRESS',
        `进度记录 ${record.nodeId} 不再对应当前地图节点，已忽略。`,
        'warning',
        record.nodeId,
      )
    }
  }
  applyNodeStates(layout.islands, progressRecords)
  const connections = buildConnections(source, nodes)
  refreshConnectionStates(connections, nodes)
  const allNodes = flattenKnowledgeNodes(layout.islands)
  const progress = computeKnowledgeProgress(allNodes)
  const currentNodeId = findCurrentNodeId(allNodes)
  return {
    dataset: options.dataset ?? 'profile',
    textbook: source.textbook,
    progress,
    currentNodeId,
    islands: layout.islands,
    connections,
    canvasSize: layout.canvasSize,
    diagnostics,
    flags: {
      isDemo: options.dataset === 'demo',
      isUnverified: source.verificationStatus === 'UNVERIFIED',
      isReadOnly: options.isReadOnly,
    },
  }
}

export { mapNodeId }
