import { z } from 'zod'
import { accountStorage } from '@/services/account/storage'
const entrySchema = z
  .object({
    contentId: z.string().min(1).max(400),
    title: z.string().min(1).max(200),
    prompt: z.string().max(2000),
    response: z.string().max(2000),
    submitted: z.boolean(),
    updatedAt: z.string().datetime(),
    comment: z.string().max(1000).default(''),
    reviewedAt: z.string().datetime().optional(),
  })
  .strict()
export type ExpressionReview = z.infer<typeof entrySchema>
const payloadSchema = z
  .object({ profileId: z.string().min(1), entries: z.array(entrySchema).max(1000) })
  .strict()
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>
const key = (profileId: string) =>
  `knowledge-island.parent-comments.v1:${encodeURIComponent(profileId)}`
export function readExpressionReviews(
  profileId: string,
  storage: Storage = accountStorage,
): ExpressionReview[] {
  const raw = storage.getItem(key(profileId))
  if (!raw) return []
  const data = payloadSchema.parse(JSON.parse(raw))
  if (data.profileId !== profileId) throw new Error('表达记录不属于当前学习档案。')
  return data.entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
export function saveExpression(
  profileId: string,
  input: Pick<ExpressionReview, 'contentId' | 'title' | 'prompt' | 'response' | 'submitted'>,
  storage: Storage = accountStorage,
): void {
  const entries = readExpressionReviews(profileId, storage)
  const previous = entries.find((entry) => entry.contentId === input.contentId)
  const unchanged = previous?.response === input.response && previous.submitted === input.submitted
  const entry = entrySchema.parse({
    ...input,
    updatedAt: new Date().toISOString(),
    comment: unchanged ? (previous?.comment ?? '') : '',
    ...(unchanged && previous?.reviewedAt ? { reviewedAt: previous.reviewedAt } : {}),
  })
  storage.setItem(
    key(profileId),
    JSON.stringify({
      profileId,
      entries: [entry, ...entries.filter((item) => item.contentId !== input.contentId)].slice(
        0,
        1000,
      ),
    }),
  )
}
/** Called from the parent-confirmed report; a comment is never an automatic score. */
export function saveParentComment(
  profileId: string,
  contentId: string,
  comment: string,
  storage: Storage = accountStorage,
): void {
  const entries = readExpressionReviews(profileId, storage)
  const entry = entries.find((item) => item.contentId === contentId && item.submitted)
  if (!entry) throw new Error('请先让孩子提交这次表达。')
  const replacement = entrySchema.parse({
    ...entry,
    comment: comment.trim(),
    reviewedAt: new Date().toISOString(),
  })
  storage.setItem(
    key(profileId),
    JSON.stringify({
      profileId,
      entries: entries.map((item) => (item.contentId === contentId ? replacement : item)),
    }),
  )
}
