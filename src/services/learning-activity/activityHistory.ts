import { z } from 'zod'

export const ACTIVITY_HISTORY_CHANGED = 'knowledge-island:activity-history'
const activitySchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  contentId: z.string().min(1),
  contentVersion: z.string().min(1),
  kind: z.enum(['quest', 'thinking']),
  title: z.string(),
  subject: z.enum(['CHINESE', 'MATH', 'ENGLISH', 'THINKING']),
  occurredAt: z.string().datetime(),
  completedCount: z.number().int().nonnegative(),
  mistakeCount: z.number().int().nonnegative(),
  href: z.string().startsWith('/'),
})
export const activityHistoryPayloadSchema = z.object({ version: z.literal(1), records: z.array(activitySchema) })
export type LearningActivity = z.infer<typeof activitySchema>
interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export const activityHistoryKey = (profileId: string) =>
  `knowledge-island.activities.v1:${encodeURIComponent(profileId)}`

export function readActivityHistory(
  profileId: string,
  storage: Storage = window.localStorage,
): LearningActivity[] {
  const raw = storage.getItem(activityHistoryKey(profileId))
  if (!raw) return []
  const records = activityHistoryPayloadSchema.parse(JSON.parse(raw)).records
  if (records.some((record) => record.profileId !== profileId))
    throw new Error('活动档案不匹配，原记录已保留。')
  return records.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function recordLearningActivity(
  record: LearningActivity,
  storage: Storage = window.localStorage,
): void {
  const item = activitySchema.parse(record)
  const records = readActivityHistory(item.profileId, storage)
  if (records.some((existing) => existing.id === item.id)) return
  storage.setItem(
    activityHistoryKey(item.profileId),
    JSON.stringify({ version: 1, records: [...records, item] }),
  )
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACTIVITY_HISTORY_CHANGED))
}
