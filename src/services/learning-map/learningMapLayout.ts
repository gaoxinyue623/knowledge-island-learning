import type {
  KnowledgeMapNode,
  LearningMapPosition,
  LearningMapSize,
  LessonMapSection,
  UnitIsland,
} from '@/types'

const CANVAS_WIDTH = 1000
const HORIZONTAL_PADDING = 40
const UNIT_GAP = 42
const UNIT_MIN_HEIGHT = 220

function positionLesson(lesson: LessonMapSection, y: number): LessonMapSection {
  return {
    ...lesson,
    position: { x: 92, y },
    nodes: lesson.nodes.map((node, index, nodes) => {
      const availableWidth = 690
      const step = nodes.length > 1 ? Math.min(154, availableWidth / (nodes.length - 1)) : 0
      const centeredStart =
        260 + (availableWidth - step * Math.max(nodes.length - 1, 0)) / 2 - availableWidth / 2
      const x = 260 + centeredStart + index * step
      const yOffset = index % 2 === 0 ? 4 : -4
      return {
        ...node,
        position: { x, y: y + yOffset },
      }
    }),
  }
}

function unitHeight(unit: UnitIsland): number {
  return Math.max(UNIT_MIN_HEIGHT, 86 + unit.lessons.length * 72)
}

export interface LearningMapLayoutResult {
  islands: UnitIsland[]
  canvasSize: LearningMapSize
}

/**
 * Stable presentation-only layout. The same sorted curriculum creates the
 * same logical coordinates; no viewport pixels or random values are stored.
 */
export function buildLearningMapLayout(islands: UnitIsland[]): LearningMapLayoutResult {
  let nextY = 42
  const layoutedIslands = islands.map((island) => {
    const height = unitHeight(island)
    const positionedLessons = island.lessons.map((lesson, index) =>
      positionLesson(lesson, nextY + 112 + index * 72),
    )
    const layouted: UnitIsland = {
      ...island,
      position: { x: HORIZONTAL_PADDING, y: nextY },
      size: { width: CANVAS_WIDTH - HORIZONTAL_PADDING * 2, height },
      lessons: positionedLessons,
    }
    nextY += height + UNIT_GAP
    return layouted
  })

  return {
    islands: layoutedIslands,
    canvasSize: {
      width: CANVAS_WIDTH,
      height: Math.max(680, nextY - UNIT_GAP + 42),
    },
  }
}

export function samePosition(left: LearningMapPosition, right: LearningMapPosition): boolean {
  return left.x === right.x && left.y === right.y
}

export function flattenKnowledgeNodes(islands: UnitIsland[]): KnowledgeMapNode[] {
  return islands.flatMap((island) => island.lessons.flatMap((lesson) => lesson.nodes))
}
