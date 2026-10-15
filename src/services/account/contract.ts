import { z } from 'zod'
import { validatePetAccount } from '../pet/petPolicy'

const fixedKeys = new Set([
  'agent-launches.v1',
  'agent-runs.v1',
  'student.v1',
  'curriculum-profile',
  'family-profiles.v1',
  'preferences.v1',
  'parent-report-preferences',
  'lesson-sessions',
  'question-sessions',
  'mastery-records',
  'learning-evidence',
  'learning-history',
  'wrong-book',
  'review-queue',
  'reward-events',
  'knowledge-energy',
  'growth',
  'achievements',
  'daily-learning-plans',
  'interactive-activity-progress',
  'weekly-learning-plans',
  'learning-map-progress',
])
const prefixes = [
  'continuations.v1:',
  'parent-comments.v1:',
  'school-progress.v1:',
  'ai-signals.v1:',
  'student.v1:',
  'curriculum-profile:',
  'learning-map-progress.v2:',
  'quest.v1:',
  'quest-choice.v1:',
  'activities.v1:',
  'thinking.v1:',
  'spaced-review.v1:',
  'pet-stories.v1:',
]
export function isAccountDataKey(key: string): boolean {
  if (!key.startsWith('knowledge-island.')) return false
  const suffix = key.slice('knowledge-island.'.length)
  return fixedKeys.has(suffix) || prefixes.some((prefix) => suffix.startsWith(prefix))
}
export const accountSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    entries: z
      .array(
        z
          .object({
            key: z.string().min(1).max(1000).refine(isAccountDataKey),
            value: z
              .string()
              .max(4 * 1024 * 1024)
              .refine((raw) => {
                try {
                  const v: unknown = JSON.parse(raw)
                  return v !== null && typeof v === 'object'
                } catch {
                  return false
                }
              }),
          })
          .strict(),
      )
      .max(4000),
    pets: z
      .array(
        z.unknown().transform((value, context) => {
          try {
            const id = (value as { profileId?: unknown })?.profileId
            if (typeof id !== 'string') throw new Error('invalid')
            return validatePetAccount(value, id)
          } catch {
            context.addIssue({ code: 'custom', message: '宠物记录格式不正确' })
            return z.NEVER
          }
        }),
      )
      .max(100),
  })
  .strict()
  .superRefine((snapshot, context) => {
    if (
      new Set(snapshot.entries.map((e) => e.key)).size !== snapshot.entries.length ||
      new Set(snapshot.pets.map((p) => p.profileId)).size !== snapshot.pets.length
    )
      context.addIssue({ code: 'custom', message: '记录编号重复' })
    if (JSON.stringify(snapshot).length > 6 * 1024 * 1024)
      context.addIssue({ code: 'custom', message: '账号记录超过同步容量，请先导出备份' })
  })
export type AccountSnapshot = z.infer<typeof accountSnapshotSchema>
export const accountWriteSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    snapshot: accountSnapshotSchema,
  })
  .strict()
export const accountCloudSchema = z
  .object({
    revision: z.number().int().positive(),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    updatedAt: z.string().datetime(),
    snapshot: accountSnapshotSchema,
  })
  .strict()
export type AccountCloud = z.infer<typeof accountCloudSchema>
export function canonicalSnapshot(snapshot: AccountSnapshot): string {
  return JSON.stringify({
    schemaVersion: 1,
    entries: [...snapshot.entries].sort((a, b) => a.key.localeCompare(b.key, 'en')),
    pets: [...snapshot.pets].sort((a, b) => a.profileId.localeCompare(b.profileId, 'en')),
  })
}
export function safeAccountReturn(value: unknown): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !Array.from(value).some((character) => character.charCodeAt(0) < 32) &&
    !/^\/(login|register|recover)([/?#]|$)/.test(value)
    ? value
    : '/home'
}
