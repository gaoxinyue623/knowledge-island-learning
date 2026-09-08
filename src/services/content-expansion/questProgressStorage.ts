import { z } from 'zod'
import type { ReadingPracticeQuest } from '@/types/reading-quest'

export const QUEST_PROGRESS_PREFIX = 'knowledge-island.quest.v1:'
export const QUEST_CHOICE_PREFIX = 'knowledge-island.quest-choice.v1:'
export interface QuestStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
const ids = z.array(z.string().min(1)).max(100)
export const questProgressSchema = z
  .object({
    schemaVersion: z.literal(1),
    profileId: z.string().min(1).max(200),
    questId: z.string().min(1),
    contentRevision: z.string().min(1),
    passedIds: ids,
    mistakeIds: ids,
    helpedIds: ids,
    completedStageIds: ids,
    reviewIds: ids.nullable(),
    activeStageId: z.string().nullable(),
    summaryVisible: z.boolean(),
    attemptId: z.string().optional(),
    completedAt: z.string().datetime().optional(),
    // Written only by newly completed rounds that explicitly qualify for evidence.
    evidenceVersion: z.literal(1).optional(),
  })
  .strict()
export type QuestProgress = z.infer<typeof questProgressSchema>

// Include prompts, rules, options and provenance: changed content must not inherit old passes.
export function questContentRevision(quest: ReadingPracticeQuest): string {
  let hash = 2166136261
  const content = JSON.stringify(quest, (key, value) =>
    key === 'legacyContentRevision' ? undefined : value,
  )
  for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619)
  return `${content.length}:${(hash >>> 0).toString(16)}`
}
export function questProgressKey(profileId: string, questId: string): string {
  return QUEST_PROGRESS_PREFIX + encodeURIComponent(profileId) + ':' + encodeURIComponent(questId)
}
export function browserQuestStorage(): QuestStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
export function freshQuestProgress(profileId: string, quest: ReadingPracticeQuest): QuestProgress {
  return {
    schemaVersion: 1,
    profileId,
    questId: quest.id,
    contentRevision: questContentRevision(quest),
    passedIds: [],
    mistakeIds: [],
    helpedIds: [],
    completedStageIds: [],
    reviewIds: null,
    activeStageId: quest.stages[0]?.id ?? null,
    summaryVisible: false,
  }
}

function validProgress(
  data: QuestProgress,
  profileId: string,
  quest: ReadingPracticeQuest,
): boolean {
  if (data.profileId !== profileId || data.questId !== quest.id) return false
  const all = quest.stages.map((stage) => stage.id)
  const round = all.filter((id) => !data.reviewIds || data.reviewIds.includes(id))
  const lists = [
    data.passedIds,
    data.mistakeIds,
    data.helpedIds,
    data.completedStageIds,
    data.reviewIds ?? [],
  ]
  if (
    lists.some((list) => new Set(list).size !== list.length || list.some((id) => !all.includes(id)))
  )
    return false
  if (data.reviewIds && !data.reviewIds.length) return false
  if ([...data.passedIds, ...data.mistakeIds, ...data.helpedIds].some((id) => !round.includes(id)))
    return false
  if (data.passedIds.some((id) => !data.completedStageIds.includes(id))) return false
  // Only a consecutive prefix can be passed; stored navigation cannot unlock later stages.
  if (!round.slice(0, data.passedIds.length).every((id) => data.passedIds.includes(id)))
    return false
  const index = data.activeStageId === null ? -1 : round.indexOf(data.activeStageId)
  if (round.length && (index < 0 || index > data.passedIds.length)) return false
  return !data.summaryVisible || (round.length > 0 && data.passedIds.length === round.length)
}

export function readQuestProgress(
  storage: QuestStorage | undefined,
  profileId: string,
  quest: ReadingPracticeQuest,
) {
  const fresh = freshQuestProgress(profileId, quest)
  try {
    if (!storage) throw new Error('Storage unavailable')
    const raw = storage.getItem(questProgressKey(profileId, quest.id))
    if (raw === null) return { data: fresh, warning: null, writable: true, resumed: false }
    const data = questProgressSchema.parse(JSON.parse(raw))
    if (data.profileId !== profileId || data.questId !== quest.id) throw new Error('Scope mismatch')
    if (
      data.contentRevision !== fresh.contentRevision &&
      data.contentRevision !==
        (quest as ReadingPracticeQuest & { legacyContentRevision?: string }).legacyContentRevision
    ) {
      return {
        data: fresh,
        warning: '题目已更新，这一组从第一关开始。',
        writable: true,
        resumed: false,
      }
    }
    data.contentRevision = fresh.contentRevision
    if (!validProgress(data, profileId, quest)) throw new Error('Invalid progression')
    return { data, warning: null, writable: true, resumed: data.completedStageIds.length > 0 }
  } catch {
    return {
      data: fresh,
      warning: '暂时无法读取闯关记录。原记录已保留，本次可以练习，但暂不保存。',
      writable: false,
      resumed: false,
    }
  }
}

export function saveQuestProgress(
  storage: QuestStorage | undefined,
  data: QuestProgress,
  quest: ReadingPracticeQuest,
): string | null {
  try {
    if (
      !storage ||
      data.contentRevision !== questContentRevision(quest) ||
      !validProgress(data, data.profileId, quest)
    )
      throw new Error('Invalid progress')
    storage.setItem(
      questProgressKey(data.profileId, data.questId),
      JSON.stringify(questProgressSchema.parse(data)),
    )
    return null
  } catch {
    return '本次进度暂时没能保存。可以继续练习，请先不要关闭页面。'
  }
}

const choiceSchema = z
  .object({
    schemaVersion: z.literal(1),
    profileId: z.string().min(1),
    questId: z.string().min(1),
    mode: z.enum(['foundation', 'training']),
    variant: z.number().int().min(0).max(9),
  })
  .strict()
type QuestChoice = z.infer<typeof choiceSchema>
const choiceKey = (profileId: string, questId: string) =>
  QUEST_CHOICE_PREFIX + encodeURIComponent(profileId) + ':' + encodeURIComponent(questId)
export function readQuestChoice(profileId: string, questId: string) {
  const data: QuestChoice = { schemaVersion: 1, profileId, questId, mode: 'foundation', variant: 0 }
  try {
    const storage = browserQuestStorage()
    if (!storage) throw new Error('Storage unavailable')
    const raw = storage.getItem(choiceKey(profileId, questId))
    if (raw === null) return { data, writable: true }
    const choice = choiceSchema.parse(JSON.parse(raw))
    if (choice.profileId !== profileId || choice.questId !== questId)
      throw new Error('Scope mismatch')
    return { data: choice, writable: true }
  } catch {
    return { data, writable: false }
  }
}
export function saveQuestChoice(data: QuestChoice): boolean {
  try {
    const storage = browserQuestStorage()
    if (!storage) return false
    storage.setItem(
      choiceKey(data.profileId, data.questId),
      JSON.stringify(choiceSchema.parse(data)),
    )
    return true
  } catch {
    return false
  }
}
