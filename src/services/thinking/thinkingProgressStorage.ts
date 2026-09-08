import { z } from 'zod'
import { thinkingMissions } from '@/data/thinking/islands'

export const THINKING_PROGRESS_PREFIX = 'knowledge-island.thinking.v1:'
const recordSchema = z
  .object({
    missionId: z.string().min(1),
    contentVersion: z.number().int().positive(),
    completedPuzzleIds: z.array(z.string().min(1)).max(20),
  })
  .strict()
export const thinkingProgressSchema = z
  .object({
    schemaVersion: z.literal(1),
    profileId: z.string().min(1).max(200),
    records: z.array(recordSchema).max(100),
  })
  .strict()
export type ThinkingProgress = z.infer<typeof thinkingProgressSchema>
export interface ThinkingStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export function freshThinkingProgress(profileId: string): ThinkingProgress {
  return { schemaVersion: 1, profileId, records: [] }
}
export function thinkingProgressKey(profileId: string) {
  return THINKING_PROGRESS_PREFIX + encodeURIComponent(profileId)
}

export function readThinkingProgress(
  storage: Pick<ThinkingStorage, 'getItem'>,
  profileId: string,
): { data: ThinkingProgress; warning: string | null; writable: boolean } {
  const fallback = freshThinkingProgress(profileId)
  try {
    const raw = storage.getItem(thinkingProgressKey(profileId))
    if (raw === null) return { data: fallback, warning: null, writable: true }
    const data = thinkingProgressSchema.parse(JSON.parse(raw))
    if (
      data.profileId !== profileId ||
      new Set(data.records.map((r) => r.missionId)).size !== data.records.length
    )
      throw new Error('Invalid profile or duplicate mission')
    for (const record of data.records) {
      const mission = thinkingMissions.find(
        (m) => m.id === record.missionId && m.version === record.contentVersion,
      )
      if (
        !mission ||
        new Set(record.completedPuzzleIds).size !== record.completedPuzzleIds.length ||
        record.completedPuzzleIds.some((id) => !mission.puzzles.some((p) => p.id === id))
      )
        throw new Error('Unsupported content')
    }
    return { data, warning: null, writable: true }
  } catch {
    return {
      data: fallback,
      warning: '以前的思维训练记录暂时无法读取，已保留原记录。可以继续练习，本次暂不保存。',
      writable: false,
    }
  }
}

export function withSolvedThinkingPuzzle(
  data: ThinkingProgress,
  missionId: string,
  puzzleId: string,
): ThinkingProgress | null {
  const mission = thinkingMissions.find((m) => m.id === missionId)
  if (!mission?.puzzles.some((p) => p.id === puzzleId)) return null
  const existing = data.records.find((r) => r.missionId === missionId)
  if (existing?.completedPuzzleIds.includes(puzzleId)) return data
  const next = {
    missionId,
    contentVersion: mission.version,
    completedPuzzleIds: [...(existing?.completedPuzzleIds ?? []), puzzleId],
  }
  return { ...data, records: [...data.records.filter((r) => r.missionId !== missionId), next] }
}
