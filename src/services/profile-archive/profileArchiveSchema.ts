import { z } from 'zod'

export const PROFILE_ARCHIVE_FORMAT = 'knowledge-island.student-profile' as const
export const PROFILE_ARCHIVE_FORMAT_VERSION = 1 as const

export const profileArchiveSectionKinds = [
  'student-profile', 'curriculum-profile', 'lesson-sessions', 'question-sessions',
  'mastery-records', 'learning-evidence', 'learning-history', 'wrong-book', 'review-queue',
  'reward-events', 'knowledge-energy', 'growth', 'achievements', 'daily-plans',
  'learning-map-progress', 'interactive-activity-progress', 'quest-progress', 'quest-choice',
  'activity-history', 'thinking-progress', 'pet-account', 'spaced-review', 'pet-story-progress',
  'weekly-plan',
] as const

export type ProfileArchiveSectionKind = (typeof profileArchiveSectionKinds)[number]
export type SectionPreviewStatus =
  | 'READY' | 'EMPTY' | 'REBUILD_REQUIRED' | 'INVALID' | 'UNSUPPORTED_VERSION' | 'MISSING_REQUIRED'

export const profileArchiveSectionSchema = z.object({
  kind: z.enum(profileArchiveSectionKinds),
  schemaVersion: z.number().int().positive(),
  data: z.unknown(),
}).strict()

export const studentProfileArchiveSchema = z.object({
  format: z.literal(PROFILE_ARCHIVE_FORMAT),
  formatVersion: z.literal(PROFILE_ARCHIVE_FORMAT_VERSION),
  exportedAt: z.string().datetime(),
  sourceProfileId: z.string().min(1),
  sections: z.array(profileArchiveSectionSchema).min(1).max(profileArchiveSectionKinds.length),
}).strict().superRefine((archive, ctx) => {
  const kinds = archive.sections.map((section) => section.kind)
  if (new Set(kinds).size !== kinds.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate archive section' })
})

export type StudentProfileArchive = z.infer<typeof studentProfileArchiveSchema>
export interface ArchiveSectionPreview {
  kind: ProfileArchiveSectionKind
  status: SectionPreviewStatus
  count: number
  message?: string
}
export interface ArchivePreview {
  source: { displayName: string; exportedAt: string; formatVersion: 1 }
  target: { mode: 'COPY'; proposedProfileId: string; proposedDisplayName: string }
  sections: ArchiveSectionPreview[]
  canRestore: boolean
  digest: string
}
