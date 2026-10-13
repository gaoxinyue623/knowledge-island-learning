import type { MathQuestVisual } from '@/types/reading-quest'

// Exact IDs keep companion diagrams out of unrelated lessons and unit-test items.
const comparison: MathQuestVisual = {
  type: 'practice-diagram',
  diagram: {
    kind: 'grid',
    columns: 6,
    rows: 6,
    marked: [
      [2, 4],
      [4, 2],
    ],
    labels: true,
  },
}
export const legacyMathQuestionVisuals: ReadonlyMap<string, MathQuestVisual> = new Map([
  ['G2_BNU_MATH_S2_2024_KP_05_Q2', { type: 'practice-diagram', diagram: { kind: 'viewpoints' } }],
  ['G6_BNU_MATH_S1_2022_KP_19_Q2', comparison],
  ['G6_BNU_MATH_S1_2022_KP_18_SYNC_V1_06', comparison],
  ['G4_BNU_MATH_S1_2022_KP_12_SYNC_V1_04', comparison],
  [
    'G4_BNU_MATH_S1_2022_KP_25_Q3',
    {
      type: 'practice-diagram',
      diagram: { kind: 'grid', columns: 6, rows: 6, marked: [[2, 3]], labels: true },
    },
  ],
])
