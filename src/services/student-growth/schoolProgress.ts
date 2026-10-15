import { z } from 'zod'
import { accountStorage } from '@/services/account/storage'
const schema = z
  .object({
    profileId: z.string().min(1),
    textbookId: z.string().min(1),
    nodeId: z.string().min(1),
  })
  .strict()
const key = (profileId: string, textbookId: string) =>
  `knowledge-island.school-progress.v1:${encodeURIComponent(profileId)}:${encodeURIComponent(textbookId)}`
export function readSchoolProgress(profileId: string, textbookId: string): string | null {
  const raw = accountStorage.getItem(key(profileId, textbookId))
  if (!raw) return null
  const value = schema.parse(JSON.parse(raw))
  if (value.profileId !== profileId || value.textbookId !== textbookId)
    throw new Error('学校进度不属于当前学习档案。')
  return value.nodeId
}
/** A family's bookmark, never evidence of completion or mastery. */
export function saveSchoolProgress(profileId: string, textbookId: string, nodeId: string): void {
  if (!nodeId) {
    accountStorage.removeItem(key(profileId, textbookId))
    return
  }
  const value = schema.parse({ profileId, textbookId, nodeId })
  accountStorage.setItem(key(profileId, textbookId), JSON.stringify(value))
}
