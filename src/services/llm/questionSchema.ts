import { z } from 'zod'

export const QUESTION_SCHEMA_VERSION = 'question-generation.v1'
/** Wire DTO only; adapted into the existing Question domain after validation. */
export const generatedQuestionItemSchema = z.strictObject({
  temporaryId: z.string().min(1).max(80),
  questionType: z.literal('calculation'),
  stem: z.string().min(1).max(200),
  expectedAnswer: z.number().finite(),
  explanation: z.string().min(1).max(500),
  knowledgePointIds: z.array(z.string().min(1).max(100)).min(1).max(4),
  difficulty: z.number().min(0).max(1),
})
export const generatedQuestionsSchema = z.strictObject({
  questions: z.array(generatedQuestionItemSchema).max(100),
})
export const generatedQuestionsJSONSchema = z.toJSONSchema(generatedQuestionsSchema) as Record<
  string,
  unknown
>
/** Constrain request-owned metadata at generation time; full local validation still runs. */
export function questionGenerationJSONSchema(difficulty: number, targets: string[], count: number) {
  return z.toJSONSchema(
    z.strictObject({
      questions: z
        .array(
          generatedQuestionItemSchema.extend({
            difficulty: z.literal(difficulty),
            knowledgePointIds: z.array(z.enum(targets as [string, ...string[]])).length(1),
          }),
        )
        .length(count),
    }),
  ) as Record<string, unknown>
}
export type GeneratedQuestionDTO = z.infer<typeof generatedQuestionItemSchema>
