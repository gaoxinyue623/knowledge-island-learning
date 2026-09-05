import type {
  KnowledgeMapNode,
  LearningMapPosition,
  LearningMapSize,
  LessonMapSection,
  UnitIsland,
} from '@/types'

/**
 * The map is laid out in logical coordinates and then rendered responsively.
 * Keep the cards wide enough for their labels and give every row its own
 * vertical lane so the map remains readable when a curriculum has many
 * lessons (the Grade 1 pilot currently has 45).
 */
export const LEARNING_MAP_LAYOUT = {
  canvasWidth: 1200,
  horizontalPadding: 48,
  unitGap: 56,
  unitContentTop: 192,
  unitBottomPadding: 44,
  lessonWidth: 500,
  lessonHeight: 240,
  lessonRowGap: 44,
  lessonColumnGap: 24,
  lessonSidePadding: 40,
  nodeCenterY: 136,
} as const

const CANVAS_WIDTH = LEARNING_MAP_LAYOUT.canvasWidth
const HORIZONTAL_PADDING = LEARNING_MAP_LAYOUT.horizontalPadding
const UNIT_GAP = LEARNING_MAP_LAYOUT.unitGap

function positionLesson(lesson: LessonMapSection, x: number, y: number): LessonMapSection {
  const availableNodeWidth = LEARNING_MAP_LAYOUT.lessonWidth - 140
  const nodeStep =
    lesson.nodes.length > 1
      ? Math.min(145, availableNodeWidth / Math.max(lesson.nodes.length - 1, 1))
      : 0
  const nodeStart =
    LEARNING_MAP_LAYOUT.lessonWidth / 2 - (nodeStep * Math.max(lesson.nodes.length - 1, 0)) / 2

  return {
    ...lesson,
    position: { x, y },
    nodes: lesson.nodes.map((node, index, nodes) => {
      const nodeX = x + nodeStart + index * nodeStep
      const row = Math.floor(index / 4)
      const column = index % 4
      const rowNodeStep =
        nodes.length > 4
          ? Math.min(132, availableNodeWidth / Math.max(Math.min(nodes.length, 4) - 1, 1))
          : nodeStep
      const rowNodeStart =
        LEARNING_MAP_LAYOUT.lessonWidth / 2 -
        (rowNodeStep * Math.max(Math.min(nodes.length, 4) - 1, 0)) / 2
      const resolvedX = nodes.length > 4 ? x + rowNodeStart + column * rowNodeStep : nodeX
      return {
        ...node,
        position: {
          x: resolvedX,
          y: y + LEARNING_MAP_LAYOUT.nodeCenterY + row * 54,
        },
      }
    }),
  }
}

function unitHeight(unit: UnitIsland): number {
  const rowCount = Math.max(1, Math.ceil(unit.lessons.length / 2))
  return (
    LEARNING_MAP_LAYOUT.unitContentTop +
    rowCount * LEARNING_MAP_LAYOUT.lessonHeight +
    Math.max(0, rowCount - 1) * LEARNING_MAP_LAYOUT.lessonRowGap +
    LEARNING_MAP_LAYOUT.unitBottomPadding
  )
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
    const positionedLessons = island.lessons.map((lesson, index) => {
      const row = Math.floor(index / 2)
      const itemsInRow = Math.min(2, island.lessons.length - row * 2)
      const column = itemsInRow === 1 ? 0.5 : index % 2
      const contentWidth = CANVAS_WIDTH - HORIZONTAL_PADDING * 2
      const totalLessonWidth =
        LEARNING_MAP_LAYOUT.lessonWidth * 2 + LEARNING_MAP_LAYOUT.lessonColumnGap
      const sidePadding = Math.max(
        LEARNING_MAP_LAYOUT.lessonSidePadding,
        (contentWidth - totalLessonWidth) / 2,
      )
      const x =
        HORIZONTAL_PADDING +
        (itemsInRow === 1
          ? (contentWidth - LEARNING_MAP_LAYOUT.lessonWidth) / 2
          : sidePadding +
            column * (LEARNING_MAP_LAYOUT.lessonWidth + LEARNING_MAP_LAYOUT.lessonColumnGap))
      const y =
        nextY +
        LEARNING_MAP_LAYOUT.unitContentTop +
        row * (LEARNING_MAP_LAYOUT.lessonHeight + LEARNING_MAP_LAYOUT.lessonRowGap)
      return positionLesson(lesson, x, y)
    })
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
