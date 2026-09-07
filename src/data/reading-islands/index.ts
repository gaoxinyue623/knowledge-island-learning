import {
  readingStorySchema,
  type ReadingLanguage,
  type ReadingLevel,
  type ReadingStory,
} from '@/types/reading-islands'
import { chineseReadingStories } from './chinese'
import { englishReadingStories } from './english'

export function validateReadingLibrary(input: readonly unknown[]) {
  const stories: ReadingStory[] = []
  const diagnostics: string[] = []
  const seen = new Set<string>()
  for (const [index, item] of input.entries()) {
    const result = readingStorySchema.safeParse(item)
    if (!result.success) {
      diagnostics.push(`reading-story:${index}: ${result.error.message}`)
    } else if (seen.has(result.data.id)) {
      diagnostics.push(`reading-story:${index}: duplicate ID ${result.data.id}`)
    } else {
      seen.add(result.data.id)
      stories.push(result.data)
    }
  }
  return { stories, diagnostics }
}

const library = validateReadingLibrary([...chineseReadingStories, ...englishReadingStories])
export const readingStories = library.stories
export const readingDiagnostics = library.diagnostics

export function findReadingStory(id: string): ReadingStory | undefined {
  return readingStories.find((story) => story.id === id)
}

export function filterReadingStories(input: {
  language?: ReadingLanguage | 'all'
  level?: ReadingLevel | 'all'
  search?: string
}) {
  const search = (input.search ?? '').trim().toLocaleLowerCase().slice(0, 100)
  return readingStories.filter(
    (story) =>
      (!input.language || input.language === 'all' || story.language === input.language) &&
      (!input.level || input.level === 'all' || story.level === input.level) &&
      (!search ||
        [
          story.title,
          story.subtitle,
          story.theme,
          story.description,
          ...story.vocabulary.map((v) => `${v.word} ${v.meaning}`),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(search)),
  )
}

export function readingLength(story: ReadingStory): string {
  const text = story.paragraphs.join(' ')
  return story.language === 'english'
    ? `${(text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length} 个英文词`
    : `${(text.match(/\p{Script=Han}/gu) ?? []).length} 字`
}
