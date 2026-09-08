import type { StudentCurriculumProfile } from '@/types'

import { storagePayloadSchema } from '@/services/validation/schemas'
import { recoverActiveProfileJournal } from '@/services/family/activeProfileStorage'

export const curriculumProfileStorageKey = 'knowledge-island.curriculum-profile'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface CurriculumProfileRepository {
  load(): StudentCurriculumProfile | null
  save(profile: StudentCurriculumProfile): void
  clear(): void
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

export function createCurriculumProfileRepository(
  storage: StorageLike | null = getDefaultStorage(),
): CurriculumProfileRepository {
  const clearCorruptedPayload = () => {
    try {
      storage?.removeItem(curriculumProfileStorageKey)
    } catch {
      // A storage failure should still behave like an empty onboarding state.
    }
  }

  return {
    load() {
      if (!storage) return null
      try {
        if (!recoverActiveProfileJournal(storage)) return null
        const raw = storage.getItem(curriculumProfileStorageKey)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        const result = storagePayloadSchema.safeParse(parsed)
        if (!result.success) {
          clearCorruptedPayload()
          return null
        }
        return result.data.profile
      } catch {
        clearCorruptedPayload()
        return null
      }
    },
    save(profile) {
      if (!storage) return
      const payload = { schemaVersion: 1 as const, profile }
      const result = storagePayloadSchema.safeParse(payload)
      if (!result.success) throw new Error('课程档案格式无效，无法保存')
      storage.setItem(curriculumProfileStorageKey, JSON.stringify(result.data))
    },
    clear() {
      clearCorruptedPayload()
    },
  }
}

export const curriculumProfileRepository = createCurriculumProfileRepository()
