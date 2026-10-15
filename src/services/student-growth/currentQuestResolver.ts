import { thinkingMissions } from '@/data/thinking/islands'
import { readThinkingProgress } from '@/services/thinking/thinkingProgressStorage'
import { practiceResumeHref } from './practiceResume'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { readingStories } from '@/data/reading-islands'
import { createStoryPractice } from '@/services/reading-islands/readingStoryAdapter'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { accountStorage } from '@/services/account/storage'
import { readLearningContinuations, type LearningContinuation } from './learningContinuations'
import {
  QUEST_PROGRESS_PREFIX,
  questProgressSchema,
  readQuestProgress,
} from '@/services/content-expansion/questProgressStorage'
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

function readableBlocks(
  source: Awaited<ReturnType<typeof lessonPlayerRepository.getLessonPlayerSource>>['source'],
): LessonContentBlockViewModel[] {
  if (!source) return []
  return source.blocks.map((record) => ({
    id: record.id,
    type: record.stepType,
    title: record.title,
    isReadingPrompt: record.isReadingPrompt,
    isAuthorNote: record.isAuthorNote,
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
  if (!source || !bundle || source.context.knowledgePointId !== context.knowledgePointId)
    return null
  const text = questReadingText(readableBlocks(source))
  const quest = createReadingQuest({ bundle, title: source.lesson.title, text })
  return quest ? { questId: quest.id, contentRevision: questContentRevision(quest) } : null
}

/** Resolve navigation against current content, including legacy progress without an index. */
export async function listResumablePractice(
  profileId: string,
  textbookIds: readonly string[],
): Promise<LearningContinuation[]> {
  const indexed = readLearningContinuations(profileId)
  const candidates = new Map(indexed.map((entry) => [entry.questId, entry]))
  for (let i = 0; i < accountStorage.length; i++) {
    const storageKey = accountStorage.key(i)
    if (!storageKey?.startsWith(QUEST_PROGRESS_PREFIX)) continue
    try {
      const data = questProgressSchema.parse(
        JSON.parse(accountStorage.getItem(storageKey) ?? 'null'),
      )
      if (
        data.profileId !== profileId ||
        data.summaryVisible ||
        data.reviewIds ||
        data.questId.includes(':review:') ||
        (!data.passedIds.length && !data.mistakeIds.length && !data.helpedIds.length) ||
        candidates.has(data.questId)
      )
        continue
      const textbook = productionCurriculumIndex.textbooks.find(
        (item) => textbookIds.includes(item.id) && data.questId.includes(item.id + ':'),
      )
      const kp =
        textbook &&
        productionCurriculumIndex.knowledgePoints.find(
          (item) =>
            data.questId.includes(item.id) &&
            productionCurriculumIndex.lessonKnowledgePointRelations.some(
              (relation) =>
                relation.knowledgePointId === item.id &&
                productionCurriculumIndex.lessons.some(
                  (lesson) =>
                    lesson.id === relation.lessonId &&
                    productionCurriculumIndex.units.some(
                      (unit) => unit.id === lesson.unitId && unit.textbookVersionId === textbook.id,
                    ),
                ),
            ),
        )
      const relation =
        kp &&
        productionCurriculumIndex.lessonKnowledgePointRelations.find(
          (item) => item.knowledgePointId === kp.id,
        )
      const lesson =
        relation && productionCurriculumIndex.lessons.find((item) => item.id === relation.lessonId)
      const story = readingStories.find((item) => data.questId === createStoryPractice(item).id)
      const href =
        kp && textbook && lesson
          ? `/knowledge-point/${encodeURIComponent(kp.id)}?${new URLSearchParams({ textbookId: textbook.id, unitId: lesson.unitId, lessonId: lesson.id, knowledgePointId: kp.id })}#knowledge-challenges`
          : story
            ? `/reading-islands/${story.id}#reading-challenges`
            : null
      if (href)
        candidates.set(data.questId, {
          questId: data.questId,
          title: lesson?.title ?? story?.title ?? '课后闯关',
          href,
          contentRevision: data.contentRevision,
          completed: data.passedIds.length,
          total: 100,
          finished: false,
          updatedAt: '1970-01-01T00:00:00.000Z',
        })
    } catch {
      /* Preserve unreadable legacy records; they cannot define current tasks. */
    }
  }
  const resolved = await Promise.all(
    [...candidates.values()].map(async (entry) => {
      try {
        const url = new URL(entry.href, 'https://knowledge-island.local')
        const story = readingStories.find((item) => url.pathname === '/reading-islands/' + item.id)
        let quest = story ? createStoryPractice(story) : null
        if (!story) {
          const context = launchContextFromHref(entry.href)
          if (!context || !textbookIds.includes(context.textbookId)) return null
          const [sourceResult, bundle] = await Promise.all([
            lessonPlayerRepository.getLessonPlayerSource(context, 'profile'),
            contentExpansionRepository.getBundle(context.knowledgePointId, 'profile'),
          ])
          if (!sourceResult.source || !bundle) return null
          const text = questReadingText(readableBlocks(sourceResult.source))
          const title = sourceResult.source.lesson.title
          const choices = [
            createReadingQuest({ bundle, title, text }),
            ...[0, 1, 2].map((variant) => createTrainingQuest({ bundle, title, text, variant })),
          ]
          quest = choices.find((candidate) => candidate?.id === entry.questId) ?? null
        }
        if (
          !quest ||
          quest.id !== entry.questId ||
          questContentRevision(quest) !== entry.contentRevision
        )
          return null
        const saved = readQuestProgress(accountStorage, profileId, quest)
        if (!saved.writable || saved.data.summaryVisible) return null
        return {
          ...entry,
          href: practiceResumeHref(entry.href, quest),
          completed: saved.data.passedIds.length,
          total: quest.stages.length,
        }
      } catch {
        return null
      }
    }),
  )
  const thinking = readThinkingProgress(accountStorage, profileId)
  if (thinking.writable)
    for (const progress of thinking.data.records) {
      const mission = thinkingMissions.find(
        (item) => item.id === progress.missionId && item.version === progress.contentVersion,
      )
      if (
        !mission ||
        !progress.completedPuzzleIds.length ||
        progress.completedPuzzleIds.length >= mission.puzzles.length
      )
        continue
      resolved.push({
        questId: 'thinking:' + mission.id,
        title: mission.title,
        href: `/thinking-islands/${mission.islandId}/${mission.id}`,
        contentRevision: 'thinking:' + mission.version,
        completed: progress.completedPuzzleIds.length,
        total: mission.puzzles.length,
        finished: false,
        updatedAt: '1970-01-01T00:00:00.000Z',
      })
    }
  return resolved
    .filter((item): item is LearningContinuation => item !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
