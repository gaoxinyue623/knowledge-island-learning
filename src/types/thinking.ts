import { z } from 'zod'

const id = z.string().min(1).max(100)
export const thinkingTokenSchema = z.object({
  label: z.string().min(1),
  shape: z
    .enum(['circle', 'square', 'triangle', 'diamond', 'up', 'right', 'down', 'left'])
    .optional(),
  color: z.enum(['mint', 'gold', 'coral', 'blue']).optional(),
})
const card = z.object({
  id,
  label: z.string().min(1),
  tokens: z.array(thinkingTokenSchema).optional(),
})
const base = {
  id,
  title: z.string().min(1),
  prompt: z.string().min(1),
  hints: z.array(z.string().min(1)).length(2),
  explanation: z.string().min(1),
  tokens: z.array(thinkingTokenSchema).optional(),
  columns: z.number().int().min(1).max(4).optional(),
}
export const thinkingPuzzleSchema = z.discriminatedUnion('kind', [
  z.object({
    ...base,
    kind: z.literal('switches'),
    initial: z.array(z.boolean()).min(3).max(6),
    target: z.array(z.boolean()).min(3).max(6),
    switches: z
      .array(card.extend({ affects: z.array(z.number().int().min(0).max(5)).min(1) }))
      .min(2)
      .max(6),
    maxMoves: z.number().int().min(1).max(6),
  }),
  z.object({
    ...base,
    kind: z.literal('sudoku'),
    givens: z.array(z.number().int().min(0).max(4)).length(16),
  }),
  z.object({
    ...base,
    kind: z.literal('pick'),
    options: z.array(card).min(2),
    correctIds: z.array(id).min(1),
  }),
  z.object({
    ...base,
    kind: z.literal('order'),
    cards: z.array(card).min(3),
    before: z.array(z.tuple([id, id])).min(1),
  }),
  z.object({
    ...base,
    kind: z.literal('assign'),
    people: z.array(card).length(3),
    items: z.array(card).length(3),
    clues: z
      .array(z.object({ personId: id, itemId: id, relation: z.enum(['is', 'is-not']) }))
      .min(2),
  }),
  z.object({
    ...base,
    kind: z.literal('path'),
    rows: z.number().int().min(3).max(5),
    columns: z.number().int().min(3).max(5),
    start: z.number().int().nonnegative(),
    goal: z.number().int().nonnegative(),
    blocked: z.array(z.number().int().nonnegative()),
    via: z.array(z.number().int().nonnegative()),
    maxSteps: z.number().int().min(1).max(24),
  }),
  z.object({
    ...base,
    kind: z.literal('pack'),
    items: z
      .array(card.extend({ cost: z.number().int().min(1).max(20) }))
      .min(3)
      .max(8),
    target: z.number().int().min(2).max(30),
    count: z.number().int().min(1).max(8).optional(),
  }),
])
export type ThinkingToken = z.infer<typeof thinkingTokenSchema>
export type ThinkingPuzzle = z.infer<typeof thinkingPuzzleSchema>
export type ThinkingDraft = string[] | Record<string, string> | number[]
export interface ThinkingMission {
  id: string
  sourceId: typeof THINKING_SOURCE.id
  islandId: string
  version: number
  title: string
  level: '入门' | '进阶' | '挑战'
  description: string
  suggestedGrades?: string
  puzzles: ThinkingPuzzle[]
}
export interface ThinkingIsland {
  id: string
  title: string
  subtitle: string
  description: string
  color: string
  softColor: string
  skill: string
}

export const THINKING_SOURCE = {
  id: 'THINKING_ISLANDS_ORIGINAL_V1',
  authorship: 'AI_ASSISTED_ORIGINAL',
  textbookDerived: false,
  humanReviewed: false,
} as const
