export const ACTIVE_PROFILE_JOURNAL_KEY = 'knowledge-island.profile-activation-journal.v1'
export interface ActivationJournal { student: string | null; curriculum: string | null; registry: string | null }
export function isActivationBlocked(storage: Pick<Storage, 'getItem'>): boolean { return storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY) !== null }
export function recoverActiveProfileJournal(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): boolean {
  const raw = storage.getItem(ACTIVE_PROFILE_JOURNAL_KEY)
  if (!raw) return true
  try {
    const candidate = JSON.parse(raw) as unknown
    if (!candidate || typeof candidate !== 'object') return false
    const journal = candidate as Record<string, unknown>
    if (![journal.student, journal.curriculum, journal.registry].every((value) => value === null || typeof value === 'string')) return false
    const snapshot: ActivationJournal = {
      student: journal.student as string | null,
      curriculum: journal.curriculum as string | null,
      registry: journal.registry as string | null,
    }
    for (const [key, value] of [['knowledge-island.student.v1', snapshot.student], ['knowledge-island.curriculum-profile', snapshot.curriculum], ['knowledge-island.family-profiles.v1', snapshot.registry]] as const) {
      if (value === null) storage.removeItem(key)
      else if (typeof value === 'string') storage.setItem(key, value)
      else throw new Error('invalid journal')
    }
    storage.removeItem(ACTIVE_PROFILE_JOURNAL_KEY)
    return true
  } catch { return false }
}
