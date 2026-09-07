import { createReadingQuest } from './readingQuest'
import { createMathTrainingQuest } from './mathTrainingQuest'
import { createLanguageTrainingQuest } from './languageTrainingQuest'

export function createTrainingQuest(
  input: Parameters<typeof createReadingQuest>[0] & { variant?: number },
) {
  // The existing projection owns source/context guards; training cannot bypass them.
  const base = createReadingQuest(input)
  if (!base) return null
  return base.subject === 'MATH'
    ? createMathTrainingQuest(base, input.variant ?? 0)
    : createLanguageTrainingQuest(base, input.title, input.text, input.variant ?? 0)
}
