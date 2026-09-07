import type { PlaneShape } from '@/types/reading-quest'

// Seven non-overlapping polygons tile a 4-by-4 square. Labels are piece identities,
// not answers; both the illustration and exercise projection use this geometry.
export const TANGRAM_PIECES: readonly {
  id: number
  shape: PlaneShape
  points: readonly (readonly [number, number])[]
  color: string
  labelPosition: readonly [number, number]
}[] = [
  {
    id: 1,
    shape: 'triangle',
    points: [
      [0, 0],
      [4, 0],
      [2, 2],
    ],
    color: '#c1deed',
    labelPosition: [2, 0.65],
  },
  {
    id: 2,
    shape: 'triangle',
    points: [
      [0, 0],
      [2, 2],
      [0, 4],
    ],
    color: '#e9cb91',
    labelPosition: [0.65, 2],
  },
  {
    id: 3,
    shape: 'triangle',
    points: [
      [2, 4],
      [4, 2],
      [4, 4],
    ],
    color: '#bed7b7',
    labelPosition: [3.35, 3.35],
  },
  {
    id: 4,
    shape: 'triangle',
    points: [
      [2, 2],
      [3, 1],
      [3, 3],
    ],
    color: '#d1b6db',
    labelPosition: [2.65, 2],
  },
  {
    id: 5,
    shape: 'square',
    points: [
      [1, 3],
      [2, 2],
      [3, 3],
      [2, 4],
    ],
    color: '#f1c4a6',
    labelPosition: [2, 3],
  },
  {
    id: 6,
    shape: 'triangle',
    points: [
      [0, 4],
      [1, 3],
      [2, 4],
    ],
    color: '#abc9d6',
    labelPosition: [1, 3.65],
  },
  {
    id: 7,
    shape: 'parallelogram',
    points: [
      [3, 1],
      [4, 0],
      [4, 2],
      [3, 3],
    ],
    color: '#dcdba6',
    labelPosition: [3.5, 1.5],
  },
]

export const PLANE_SHAPES: PlaneShape[] = [
  'square',
  'rectangle',
  'triangle',
  'circle',
  'parallelogram',
]
export const PLANE_LABELS: Record<PlaneShape, string> = {
  square: '正方形',
  rectangle: '长方形',
  triangle: '三角形',
  circle: '圆',
  parallelogram: '非直角的平行四边形',
}

export function makeNumberGrid(
  shift: number,
  blankIndex: number,
): { cells: (number | null)[]; answer: number } {
  const complete = Array.from(
    { length: 9 },
    (_, i) => ((Math.floor(i / 3) + (i % 3) + shift) % 3) + 1,
  )
  const answer = complete[blankIndex]!
  return { cells: complete.map((n, i) => (i === blankIndex ? null : n)), answer }
}
