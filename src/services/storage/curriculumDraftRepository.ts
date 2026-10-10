import { z } from 'zod'
import { accountOwner, accountSessionStorage } from '@/services/account/storage'
import type { StudentCurriculumProfile } from '@/types'

const key = 'knowledge-island.curriculum-draft.v1'
const id = z.string().min(1).max(200).nullable()
const draftSchema = z.object({
  regionId: id,
  gradeId: id,
  semesterId: id,
  textbooks: z.object({ CHINESE: id, MATH: id, ENGLISH: id }),
  selectionTouched: z.array(z.enum(['CHINESE', 'MATH', 'ENGLISH'])).default([]),
})
const payloadSchema = z.object({
  version: z.literal(1),
  profileBasis: z.string(),
  draft: draftSchema,
})
type CurriculumDraft = z.infer<typeof draftSchema>

// A tab's unfinished choices survive reload/login, scoped to the authenticated
// account. A different confirmed/active child profile invalidates the draft.
export const curriculumDraftRepository = {
  load(profile: StudentCurriculumProfile | null): CurriculumDraft | null {
    if (!accountOwner()) return null
    try {
      const raw = accountSessionStorage.getItem(key)
      if (!raw) return null
      const parsed = payloadSchema.safeParse(JSON.parse(raw))
      if (parsed.success && parsed.data.profileBasis === JSON.stringify(profile))
        return parsed.data.draft
      this.clear()
    } catch {
      this.clear()
    }
    return null
  },
  save(draft: CurriculumDraft, profile: StudentCurriculumProfile | null) {
    if (!accountOwner()) return
    try {
      accountSessionStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          profileBasis: JSON.stringify(profile),
          draft,
        }),
      )
    } catch {
      // Storage may be unavailable; keep the current in-memory flow usable.
    }
  },
  clear() {
    try {
      accountSessionStorage.removeItem(key)
    } catch {
      /* best effort */
    }
  },
}
