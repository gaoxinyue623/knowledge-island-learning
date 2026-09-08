import {
  rewardEventStoragePayloadSchema,
  REWARD_EVENT_STORAGE_KEY,
} from '@/services/reward/rewardEventStorage'
import { readThinkingProgress } from '@/services/thinking/thinkingProgressStorage'
import { thinkingMissions } from '@/data/thinking/islands'
import type { RewardEvent } from '@/types/reward'
import type { PetLearningSource, PetSourceKind } from './petPolicy'
import { petDay, PET_THINKING_POINTS } from './petPolicy'

export interface PetSourceStorage {
  getItem(key: string): string | null
}
const labels: Record<RewardEvent['type'], { kind: PetSourceKind; title: string }> = {
  lesson_completed: { kind: 'lesson', title: '完成课程' },
  assessment_completed: { kind: 'assessment', title: '完成练习' },
  knowledge_mastered: { kind: 'mastery', title: '掌握知识点' },
  review_completed: { kind: 'review', title: '完成复习' },
  wrong_question_resolved: { kind: 'correction', title: '解决错题' },
}
export function petSourceFromReward(event: RewardEvent): PetLearningSource | null {
  if (
    event.provenance.isSampleDerived ||
    ['SAMPLE', 'UNVERIFIED', 'REJECTED'].includes(event.provenance.verificationStatus ?? '')
  )
    return null
  if (!Number.isFinite(Date.parse(event.occurredAt)) || !event.reward.knowledgeEnergy) return null
  const { kind, title } = labels[event.type]
  const content = event.knowledgePointId
    ? [event.textbookId ?? '', event.knowledgePointId]
    : [event.sourceId]
  const day = kind === 'review' || kind === 'correction' ? petDay(event.occurredAt) : ''
  return {
    id: JSON.stringify([kind, ...content, day]),
    profileId: event.profileId,
    kind,
    title,
    amount: event.reward.knowledgeEnergy,
    occurredAt: new Date(event.occurredAt).toISOString(),
  }
}
export function collectPetSources(
  storage: PetSourceStorage,
  profileId: string,
): { sources: PetLearningSource[]; warnings: string[] } {
  const sources: PetLearningSource[] = [],
    warnings: string[] = []
  try {
    const raw = storage.getItem(REWARD_EVENT_STORAGE_KEY)
    if (raw !== null) {
      const data = rewardEventStoragePayloadSchema.parse(JSON.parse(raw))
      for (const event of data.events) {
        if (event.profileId !== profileId) continue
        const source = petSourceFromReward(event)
        if (source) sources.push(source)
      }
    }
  } catch {
    warnings.push('课程奖励记录暂时无法读取，相关积分暂未结算，原记录未修改。')
  }
  const thinking = readThinkingProgress(storage, profileId)
  if (!thinking.writable) warnings.push('思维进度暂时无法读取，相关积分暂未结算，原记录未修改。')
  else
    for (const record of thinking.data.records) {
      const mission = thinkingMissions.find((item) => item.id === record.missionId)!
      for (const puzzleId of record.completedPuzzleIds) {
        const puzzle = mission.puzzles.find((item) => item.id === puzzleId)!
        sources.push({
          id: JSON.stringify(['thinking', puzzleId]),
          profileId,
          kind: 'thinking',
          title: `${mission.title} · ${puzzle.title}`,
          amount: PET_THINKING_POINTS,
        })
      }
    }
  return { sources, warnings }
}
