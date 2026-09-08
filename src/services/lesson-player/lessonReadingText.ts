import type { LessonContentBlockViewModel } from '@/types'

export type LessonReadingSubject = 'CHINESE' | 'MATH' | 'ENGLISH' | 'UNKNOWN'

/**
 * Course launch data carries a textbook identity, not a presentation label. Keep
 * this mapping conservative: an unfamiliar identity must not be read with the
 * Chinese voice by accident.
 */
export function lessonReadingSubject(textbookId: string | undefined): LessonReadingSubject {
  const normalized = textbookId?.toUpperCase() ?? ''
  if (normalized.includes('CHINESE') || normalized.includes('语文')) return 'CHINESE'
  if (normalized.includes('ENGLISH') || normalized.includes('英语')) return 'ENGLISH'
  if (normalized.includes('MATH') || normalized.includes('数学')) return 'MATH'
  return 'UNKNOWN'
}

/**
 * Extract only static body copy already rendered for the current lesson step.
 * Interactive reveal copy and assessment answers live outside these fields and
 * therefore cannot be included before a student chooses to reveal them.
 */
export function lessonReadingText(blocks: readonly LessonContentBlockViewModel[]): string {
  const readableTypes = new Set(['intro', 'concept', 'explanation', 'example', 'summary'])
  const fragments = [...blocks]
    .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
    .filter((block) => readableTypes.has(block.type))
    .flatMap((block) => [
      block.title,
      block.content,
      ...(block.paragraphs ?? []),
      ...(block.bullets ?? []),
      ...(block.highlights ?? []),
    ])
  return fragments
    .filter((fragment): fragment is string => typeof fragment === 'string')
    .map((fragment) => fragment.trim())
    .filter(Boolean)
    .join('\n')
}

export function supportsChineseLessonReading(subject: LessonReadingSubject): boolean {
  return subject === 'CHINESE' || subject === 'MATH'
}
