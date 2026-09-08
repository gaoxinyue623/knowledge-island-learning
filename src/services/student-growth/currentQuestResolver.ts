import { contentExpansionRepository } from '@/services/content-expansion'
import { createReadingQuest, questReadingText } from '@/services/content-expansion/readingQuest'
import { questContentRevision } from '@/services/content-expansion/questProgressStorage'
import { lessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import type { LessonContentBlockViewModel, LessonLaunchContext } from '@/types'

function launchContextFromHref(courseHref: string): LessonLaunchContext | null {
  try {
    const url = new URL(courseHref, 'https://knowledge-island.local')
    const knowledgePointId = decodeURIComponent(url.pathname.replace(/^\/knowledge-point\//, ''))
    const values = {
      textbookId: url.searchParams.get('textbookId'),
      unitId: url.searchParams.get('unitId'),
      lessonId: url.searchParams.get('lessonId'),
      knowledgePointId: url.searchParams.get('knowledgePointId'),
    }
    if (
      !knowledgePointId ||
      !Object.values(values).every((value): value is string => Boolean(value)) ||
      values.knowledgePointId !== knowledgePointId
    )
      return null
    return values as LessonLaunchContext
  } catch {
    return null
  }
}

function readableBlocks(source: Awaited<ReturnType<typeof lessonPlayerRepository.getLessonPlayerSource>>['source']): LessonContentBlockViewModel[] {
  if (!source) return []
  return source.blocks.map((record) => ({
    id: record.id,
    type: record.stepType,
    title: record.title,
    content: record.block.type === 'TEXT' ? record.block.text : undefined,
    paragraphs: record.paragraphs,
    bullets: record.bullets,
    highlights: record.highlights,
    isSample: record.isSample,
    verificationStatus: record.verificationStatus,
    sort: record.sort,
  }))
}

/** Resolves the currently readable course, so old evidence never defines a new revision. */
export async function resolveCurrentQuestRevision(courseHref: string): Promise<{
  questId: string
  contentRevision: string
} | null> {
  const context = launchContextFromHref(courseHref)
  if (!context) return null
  const [sourceResult, bundle] = await Promise.all([
    lessonPlayerRepository.getLessonPlayerSource(context, 'profile'),
    contentExpansionRepository.getBundle(context.knowledgePointId, 'profile'),
  ])
  const source = sourceResult.source
  if (!source || !bundle || source.context.knowledgePointId !== context.knowledgePointId) return null
  const text = questReadingText(readableBlocks(source))
  const quest = createReadingQuest({ bundle, title: source.lesson.title, text })
  return quest ? { questId: quest.id, contentRevision: questContentRevision(quest) } : null
}
