import type { ReadingPracticeQuest, ReadingQuest } from '@/types/reading-quest'
import {
  readQuestProgress,
  type QuestStorage,
} from '@/services/content-expansion/questProgressStorage'
import { readingStories } from '@/data/reading-islands'
import { createStoryPractice } from '@/services/reading-islands/readingStoryAdapter'
import { petService } from './petService'
import { PET_ACCOUNT_CHANGED } from './petNotifications'
import { PET_QUEST_POINTS, type PetLearningSource } from './petPolicy'

export function questPetSource(
  storage: QuestStorage,
  profileId: string,
  quest: ReadingPracticeQuest,
): PetLearningSource | null {
  const progress = readQuestProgress(storage, profileId, quest)
  if (
    !progress.writable ||
    !quest.stages.length ||
    !quest.stages.every((stage) => progress.data.completedStageIds.includes(stage.id))
  )
    return null
  if (
    quest.stages.some((stage) => {
      const content = stage.kind === 'question' ? stage.question : stage.activity
      return (
        content.isSample ||
        content.verificationStatus === 'REJECTED' ||
        content.verificationStatus === 'SAMPLE'
      )
    })
  )
    return null
  // These are participation rewards for validated closed tasks, not formal mastery evidence.
  const curriculum = quest as Partial<ReadingQuest>
  if (
    curriculum.isSample ||
    curriculum.verificationStatus === 'REJECTED' ||
    curriculum.verificationStatus === 'SAMPLE'
  )
    return null
  let scope: string[], title: string
  if (
    curriculum.textbookId &&
    curriculum.knowledgePointId &&
    curriculum.sourceId &&
    curriculum.isSample === false
  ) {
    scope = ['quest', curriculum.textbookId, curriculum.knowledgePointId]
    title = '完成整组课后闯关'
  } else {
    const story = readingStories.find((story) => createStoryPractice(story).id === quest.id)
    if (!story) return null
    scope = ['quest', 'story', story.id]
    title = `阅读练习 · ${story.title}`
  }
  return { id: JSON.stringify(scope), profileId, kind: 'quest', title, amount: PET_QUEST_POINTS }
}
const pending = new Map<string, Promise<void>>()
export function settleQuestPetReward(
  profileId: string,
  quest: ReadingPracticeQuest,
): Promise<void> {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/dev/'))
    return Promise.resolve()
  let source: PetLearningSource | null
  try {
    source = questPetSource(window.localStorage, profileId, quest)
  } catch {
    return Promise.resolve()
  }
  if (!source) return Promise.resolve()
  const key = JSON.stringify([profileId, source.id])
  if (pending.has(key)) return pending.get(key)!
  const promise = petService
    .run(profileId, undefined, undefined, [source])
    .then(() => {
      window.dispatchEvent(new CustomEvent(PET_ACCOUNT_CHANGED, { detail: profileId }))
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('knowledge-island.pet')
        channel.postMessage(profileId)
        channel.close()
      }
    })
    .finally(() => {
      pending.delete(key)
    })
  pending.set(key, promise)
  return promise
}
