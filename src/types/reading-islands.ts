import { z } from 'zod'

const text = z.string().trim().min(1)
const evidence = z.array(z.number().int().positive()).min(1)
const choice = z
  .object({
    prompt: text,
    options: z.array(text).min(3).max(5),
    answers: z.array(text).min(1),
    hint: text,
    explanation: text,
    evidence,
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.options).size !== value.options.length ||
      new Set(value.answers).size !== value.answers.length ||
      value.answers.length >= value.options.length ||
      value.answers.some((answer) => !value.options.includes(answer))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Options must have unique, supported answers and distractors.',
      })
    }
  })

export const READING_ISLANDS_SOURCE = {
  id: 'READING_ISLANDS_ORIGINAL_V1',
  authorship: 'AI_ASSISTED_ORIGINAL',
  textbookDerived: false,
  humanReviewed: false,
} as const

export const readingStorySchema = z
  .object({
    id: text.regex(/^(zh|en)-[a-z-]+$/),
    language: z.enum(['chinese', 'english']),
    level: z.enum(['starter', 'growing']),
    title: text,
    subtitle: text.optional(),
    theme: text,
    description: text,
    beforeReading: text,
    paragraphs: z.array(text).min(3),
    translations: z.array(text).optional(),
    vocabulary: z.array(z.object({ word: text, meaning: text })).length(4),
    detail: choice,
    sequence: z.object({ events: z.array(text).min(3).max(4), evidence, hint: text }),
    reasoning: choice,
    wordPractice: z.object({
      prompt: text,
      answer: text,
      tiles: z.array(text).min(3),
      evidence,
      hint: text,
      explanation: text,
    }),
    transfer: choice,
    sentence: z.object({ chunks: z.array(text).min(3).max(5), meaning: text, evidence }).optional(),
    expression: z.object({
      prompt: text,
      frame: text,
      sample: text,
      checklist: z.array(text).length(3),
    }),
  })
  .superRefine((story, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message })
    if (story.detail.answers.length !== 1 || story.transfer.answers.length !== 1)
      issue('Detail and transfer need one answer.')
    if (story.reasoning.answers.length < 2) issue('Reasoning is an explicit multiple-choice task.')
    if (
      new Set(story.vocabulary.map((v) => v.word)).size !== 4 ||
      new Set(story.vocabulary.map((v) => v.meaning)).size !== 4
    )
      issue('Vocabulary matches must be unambiguous.')
    if (new Set(story.sequence.events).size !== story.sequence.events.length)
      issue('Sequence cards must be unique.')
    const refs = [
      story.detail,
      story.sequence,
      story.reasoning,
      story.wordPractice,
      story.transfer,
      ...(story.sentence ? [story.sentence] : []),
    ]
    if (refs.some((task) => task.evidence.some((n) => n > story.paragraphs.length)))
      issue('Evidence must refer to a paragraph in this story.')
    if (story.language === 'english') {
      if (
        !story.translations ||
        story.translations.length !== story.paragraphs.length ||
        !story.sentence
      )
        issue('English stories need paired translations and sentence practice.')
      if (story.paragraphs.some((p) => /\p{Script=Han}/u.test(p)))
        issue('English text and translation must remain separate.')
      const bank = [...story.wordPractice.tiles]
      for (const letter of story.wordPractice.answer) {
        const at = bank.indexOf(letter)
        if (at < 0) {
          issue('Spelling bank must contain every required letter.')
          break
        }
        bank.splice(at, 1)
      }
      if (story.sentence && new Set(story.sentence.chunks).size !== story.sentence.chunks.length)
        issue('Sentence chunks must be unique.')
    } else if (!story.wordPractice.tiles.includes(story.wordPractice.answer))
      issue('Word choice needs an answer tile.')
  })

export type ReadingStory = z.infer<typeof readingStorySchema>
export type ReadingLanguage = ReadingStory['language']
export type ReadingLevel = ReadingStory['level']

export const readingLevels: Record<ReadingLevel, { label: string; description: string }> = {
  starter: { label: '轻松起步', description: '短句、线索清楚，适合初读或亲子共读' },
  growing: { label: '阅读进阶', description: '故事更长，多想一步，尝试独立表达' },
}
