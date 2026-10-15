import { z } from 'zod'
import { accountStorage } from '@/services/account/storage'

export const CONTINUATIONS_PREFIX = 'knowledge-island.continuations.v1:'
const entrySchema = z
  .object({
    questId: z.string().min(1),
    title: z.string().min(1).max(200),
    href: z
      .string()
      .max(2000)
      .refine(
        (href) =>
          /^\/(?:knowledge-point\/|reading-islands\/|thinking-islands\/)/.test(href) &&
          !href.includes('\\') &&
          !Array.from(href).some((character) => character.charCodeAt(0) < 32),
      ),
    contentRevision: z.string().min(1),
    completed: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    updatedAt: z.string().datetime(),
    finished: z.boolean().default(false),
  })
  .strict()
  .refine((entry) => entry.completed <= entry.total)
const payloadSchema = z
  .object({ profileId: z.string().min(1), entries: z.array(entrySchema).max(500) })
  .strict()
export type LearningContinuation = z.infer<typeof entrySchema>
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>
const key = (profileId: string) => CONTINUATIONS_PREFIX + encodeURIComponent(profileId)

export function readLearningContinuations(
  profileId: string,
  storage: Storage = accountStorage,
): LearningContinuation[] {
  const raw = storage.getItem(key(profileId))
  if (!raw) return []
  const payload = payloadSchema.parse(JSON.parse(raw))
  if (payload.profileId !== profileId) throw new Error('学习档案不匹配，原记录已保留。')
  return payload.entries
    .filter((entry) => !entry.finished)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Navigation metadata only: this never awards points or changes mastery. */
export function saveLearningContinuation(
  profileId: string,
  entry: LearningContinuation,
  storage: Storage = accountStorage,
): void {
  const parsed = entrySchema.parse(entry)
  const entries = readLearningContinuations(profileId, storage).filter(
    (item) => item.questId !== parsed.questId,
  )
  if (!parsed.finished) entries.unshift(parsed)
  storage.setItem(key(profileId), JSON.stringify({ profileId, entries: entries.slice(0, 500) }))
}
