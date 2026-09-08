import { z } from 'zod'
import type { SpacedReviewEvidence } from '@/services/student-growth/spacedReview'

/** Versioned, per-profile storage for story progress only. */
export const PET_STORY_STORAGE_PREFIX = 'knowledge-island.pet-stories.v1:'
export const petStorySchemaVersion = 1 as const

export interface PetStoryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const progressSchema = z.object({
  key: z.string().min(1),
  profileId: z.string().min(1),
  questId: z.string().min(1),
  contentRevision: z.string().min(1),
  openedAt: z.string().datetime(),
  expressionCompletedAt: z.string().datetime().optional(),
  discoveryCompletedAt: z.string().datetime().optional(),
}).strict().refine(record => record.key === `${record.questId}:${record.contentRevision}` &&
  (!record.expressionCompletedAt || record.expressionCompletedAt >= record.openedAt) &&
  (!record.discoveryCompletedAt || record.discoveryCompletedAt >= record.openedAt), 'Invalid story progression')

/** Exported for profile archive registration; callers must preserve this exact version. */
export const petStoryPayloadSchema = z.object({
  schemaVersion: z.literal(petStorySchemaVersion),
  records: z.array(progressSchema).max(500),
}).strict().refine(payload => new Set(payload.records.map(record => record.key)).size === payload.records.length, 'Duplicate story')

export type PetStoryProgress = z.infer<typeof progressSchema>

export interface PetStoryChapter {
  id: 'review' | 'expression' | 'discovery'
  title: string
  prompt: string
  completed: boolean
  selfReport: boolean
}

export interface PetStory {
  key: string
  title: string
  subject: SpacedReviewEvidence['subject']
  courseHref: string
  opened: boolean
  introduction: string
  chapters: PetStoryChapter[]
}

export function petStoryStorageKey(profileId: string): string {
  return `${PET_STORY_STORAGE_PREFIX}${encodeURIComponent(profileId)}`
}

function storyKey(questId: string, contentRevision: string): string {
  return `${questId}:${contentRevision}`
}

function latestEvidence(items: readonly SpacedReviewEvidence[]): SpacedReviewEvidence {
  return [...items].sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0]!
}

export function createPetStoryService(
  storage: PetStoryStorage | undefined,
  now: () => string = () => new Date().toISOString(),
) {
  let warning: string | null = null

  function load(profileId: string): PetStoryProgress[] {
    warning = null
    try {
      if (!storage) throw new Error('Storage unavailable')
      const raw = storage.getItem(petStoryStorageKey(profileId))
      if (!raw) return []
      const payload = petStoryPayloadSchema.parse(JSON.parse(raw))
      if (payload.records.some((record) => record.profileId !== profileId)) {
        throw new Error('Mismatched profile records')
      }
      return payload.records
    } catch {
      warning = '宠物故事进度暂时无法读取，原记录已保留。'
      return []
    }
  }

  function save(profileId: string, records: PetStoryProgress[]): boolean {
    try {
      if (!storage) throw new Error('Storage unavailable')
      const payload = petStoryPayloadSchema.parse({
        schemaVersion: petStorySchemaVersion,
        records,
      })
      storage.setItem(petStoryStorageKey(profileId), JSON.stringify(payload))
      warning = null
      return true
    } catch {
      warning = '宠物故事进度暂时无法保存，本次不会记作完成。'
      return false
    }
  }

  function open(profileId: string, evidence: SpacedReviewEvidence): boolean {
    const records = load(profileId)
    if (warning) return false
    if (!profileId || evidence.profileId !== profileId) {
      warning = '这份练习不属于当前学习档案。'
      return false
    }
    const key = storyKey(evidence.questId, evidence.contentRevision)
    if (records.some((record) => record.key === key)) return true

    return save(profileId, [...records, {
      key,
      profileId,
      questId: evidence.questId,
      contentRevision: evidence.contentRevision,
      openedAt: now(),
    }])
  }

  function selfReport(
    profileId: string,
    questId: string,
    contentRevision: string,
    chapter: 'expression' | 'discovery',
  ): boolean {
    const records = load(profileId)
    if (warning) return false
    const key = storyKey(questId, contentRevision)
    const index = records.findIndex((record) => record.key === key)
    if (index < 0) {
      warning = '请先打开这则故事，再记录自己的表达或发现。'
      return false
    }

    const timestampKey = chapter === 'expression'
      ? 'expressionCompletedAt'
      : 'discoveryCompletedAt'
    if (records[index]![timestampKey]) return true
    const updated = { ...records[index]!, [timestampKey]: now() }
    return save(profileId, records.map((record, recordIndex) => (
      recordIndex === index ? updated : record
    )))
  }

  function list(
    profileId: string,
    evidence: readonly SpacedReviewEvidence[],
    currentRevisionByQuest: Readonly<Record<string, string | null>>,
  ): PetStory[] {
    const progress = load(profileId)
    const evidenceByStory = new Map<string, SpacedReviewEvidence[]>()

    for (const item of evidence) {
      if (item.profileId !== profileId) continue
      if (currentRevisionByQuest[item.questId] !== item.contentRevision) continue
      const key = storyKey(item.questId, item.contentRevision)
      evidenceByStory.set(key, [...(evidenceByStory.get(key) ?? []), item])
    }

    return [...evidenceByStory.entries()].map(([key, items]) => {
      const representative = latestEvidence(items)
      const storyProgress = progress.find((record) => record.key === key)
      // A story review is only earned by a later evidence record, never by opening it.
      const reviewCompleted = Boolean(storyProgress && items.some((item) => (
        item.completedAt > storyProgress.openedAt
      )))

      return {
        key,
        title: representative.title,
        subject: representative.subject,
        courseHref: representative.courseHref,
        opened: Boolean(storyProgress),
        introduction: `团子准备把“${representative.title}”画进知识岛的旅行手册。它还缺一份解题方法、一段讲解和一个生活中的发现，想请你一起完成。`,
        chapters: [
          {
            id: 'review',
            title: '第一章 · 找回方法',
            prompt: `手册的第一张地图上写着：${representative.stages[0]?.prompt ?? '回到这道题，再试一次。'} 团子想知道你现在会怎么解决它。`,
            completed: reviewCompleted,
            selfReport: false,
          },
          {
            id: 'expression',
            title: '第二章 · 当一次小向导',
            prompt: `团子到了“${representative.title}”的小站。请用自己的话讲讲方法，再举一个例子，让它也能听懂。`,
            completed: Boolean(storyProgress?.expressionCompletedAt),
            selfReport: true,
          },
          {
            id: 'discovery',
            title: '第三章 · 带回新发现',
            prompt: `旅行手册还空着最后一页。在书本或生活中找一件与“${representative.title}”有关的事，写下来或说给身边的人听。`,
            completed: Boolean(storyProgress?.discoveryCompletedAt),
            selfReport: true,
          },
        ],
      }
    })
  }

  return { load, open, selfReport, list, getLastWarning: () => warning }
}

function browserStorage(): PetStoryStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export const petStoryService = createPetStoryService(browserStorage())
