import { z } from 'zod'

const id = z.string().min(1).max(200)
export const aiContextSchema = z
  .object({ profileId: id, textbookId: id, knowledgePointId: id })
  .strict()
export const aiCreateSchema = aiContextSchema
  .extend({ requestId: z.string().uuid(), difficulty: z.number().min(0).max(1).optional() })
  .strict()
export const aiAnswerValueSchema = z.union([
  z.number().finite().min(-10000).max(10000),
  z.string().min(1).max(500),
  z.array(z.string().min(1).max(200)).min(1).max(20),
])
export const aiAnswerSchema = z
  .object({ questionId: z.string().uuid(), answer: aiAnswerValueSchema })
  .strict()
export const aiSessionSchema = aiContextSchema.extend({
  id: z.string().uuid(),
  title: z.string(),
  source: z.literal('REAL_LLM'),
  validation: z.literal('AUTO_VALIDATED'),
  model: z.string(),
  createdAt: z.string().datetime(),
  completed: z.boolean(),
  questions: z
    .array(
      z.object({
        id: z.string().uuid(),
        stem: z.string(),
        kind: z
          .enum(['singleChoice', 'multipleChoice', 'trueFalse', 'fillBlank', 'calculation'])
          .optional(),
        options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
        blankCount: z.number().int().min(1).max(20).optional(),
        review: z
          .object({ correct: z.boolean(), answer: aiAnswerValueSchema, at: z.string() })
          .optional(),
        feedback: z
          .object({
            answer: aiAnswerValueSchema,
            expected: z.union([z.number(), z.string()]),
            correct: z.boolean(),
            explanation: z.string(),
          })
          .optional(),
      }),
    )
    .min(1)
    .max(3),
})
export type AiContext = z.infer<typeof aiContextSchema>
export type AiSession = z.infer<typeof aiSessionSchema>

export interface ArithmeticScope {
  operations: Array<'+' | '-'>
  left: [number, number]
  right: [number, number]
  maxResult: number
  carrying?: boolean
  borrowing?: boolean
  leftMultiple?: number
  rightMultiple?: number
}
const rules: Record<string, ArithmeticScope> = {}
function add(prefix: string, number: number, rule: ArithmeticScope) {
  rules[`${prefix}_KP_${String(number).padStart(2, '0')}`] = rule
}
const g2 = 'G2_SHENZHEN_MATH_S1',
  upper = 'G1_SHENZHEN_MATH_S1',
  lower = 'G1_SHENZHEN_MATH_S2'
add(g2, 1, { operations: ['+'], left: [10, 89], right: [1, 9], maxResult: 99 })
add(g2, 2, { operations: ['+'], left: [10, 79], right: [10, 79], maxResult: 99, carrying: true })
add(g2, 3, { operations: ['-'], left: [11, 99], right: [1, 9], maxResult: 99, borrowing: true })
add(g2, 4, { operations: ['-'], left: [20, 99], right: [10, 89], maxResult: 99 })
add(g2, 5, { operations: ['-'], left: [100, 100], right: [10, 99], maxResult: 99 })
add(g2, 7, { operations: ['+', '-'], left: [10, 99], right: [1, 89], maxResult: 100 })
add(upper, 22, { operations: ['+'], left: [0, 9], right: [0, 9], maxResult: 10 })
add(upper, 23, { operations: ['-'], left: [1, 10], right: [0, 9], maxResult: 10 })
add(lower, 2, { operations: ['+'], left: [10, 19], right: [1, 9], maxResult: 20, carrying: false })
for (const [kp, operand] of [
  [3, 9],
  [4, 8],
  [5, 7],
  [6, 6],
])
  add(lower, kp!, {
    operations: ['+'],
    left: [operand!, operand!],
    right: [1, 9],
    maxResult: 20,
    carrying: true,
  })
for (const [kp, operand] of [
  [11, 9],
  [12, 8],
  [13, 7],
  [14, 6],
])
  add(lower, kp!, {
    operations: ['-'],
    left: [11, 18],
    right: [operand!, operand!],
    maxResult: 20,
    borrowing: true,
  })
add(lower, 24, {
  operations: ['+', '-'],
  left: [10, 90],
  right: [10, 90],
  maxResult: 100,
  leftMultiple: 10,
  rightMultiple: 10,
})
add(lower, 25, { operations: ['+'], left: [10, 89], right: [1, 9], maxResult: 99, carrying: false })
add(lower, 26, {
  operations: ['-'],
  left: [11, 99],
  right: [1, 9],
  maxResult: 99,
  borrowing: false,
})
add(lower, 27, {
  operations: ['+', '-'],
  left: [11, 89],
  right: [10, 80],
  maxResult: 99,
  rightMultiple: 10,
})
add(lower, 28, {
  operations: ['+'],
  left: [10, 89],
  right: [10, 89],
  maxResult: 99,
  carrying: false,
})
add(lower, 29, {
  operations: ['-'],
  left: [20, 99],
  right: [10, 89],
  maxResult: 99,
  borrowing: false,
})
add(lower, 38, { operations: ['+', '-'], left: [1, 19], right: [1, 19], maxResult: 20 })
add(lower, 39, {
  operations: ['+', '-'],
  left: [10, 99],
  right: [1, 89],
  maxResult: 100,
  carrying: false,
  borrowing: false,
})

/** Explicit production arithmetic coverage; all other topics keep their reviewed exercises. */
export function arithmeticScope(knowledgePointId: string): ArithmeticScope | null {
  return Object.hasOwn(rules, knowledgePointId) ? structuredClone(rules[knowledgePointId]!) : null
}
export function arithmeticAllowed(
  scope: ArithmeticScope,
  left: number,
  right: number,
  operation: '+' | '-',
) {
  const answer = operation === '+' ? left + right : left - right
  return (
    Number.isInteger(left) &&
    Number.isInteger(right) &&
    scope.operations.includes(operation) &&
    left >= scope.left[0] &&
    left <= scope.left[1] &&
    right >= scope.right[0] &&
    right <= scope.right[1] &&
    answer >= 0 &&
    answer <= scope.maxResult &&
    (!scope.leftMultiple || left % scope.leftMultiple === 0) &&
    (!scope.rightMultiple || right % scope.rightMultiple === 0) &&
    (operation !== '+' ||
      scope.carrying === undefined ||
      (left % 10) + (right % 10) >= 10 === scope.carrying) &&
    (operation !== '-' ||
      scope.borrowing === undefined ||
      left % 10 < right % 10 === scope.borrowing)
  )
}
