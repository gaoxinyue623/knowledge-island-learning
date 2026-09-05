import type { AchievementListOptions, AchievementRepository, AchievementUnlock, Id } from '@/types'

import { achievementStorage } from './achievementStorage'
import type { AchievementStorage } from './achievementStorage'

function clone(unlock: AchievementUnlock): AchievementUnlock {
  return { ...unlock, provenance: { ...unlock.provenance } }
}

function matches(unlock: AchievementUnlock, options: AchievementListOptions): boolean {
  return options.includeSample !== false || !unlock.provenance.isSampleDerived
}

function sortUnlocks(left: AchievementUnlock, right: AchievementUnlock): number {
  return (
    right.unlockedAt.localeCompare(left.unlockedAt) ||
    left.achievementId.localeCompare(right.achievementId) ||
    left.id.localeCompare(right.id)
  )
}

export function buildAchievementUnlockId(
  profileId: Id,
  achievementId: Id,
  isSampleDerived: boolean,
): Id {
  return `achievement-unlock:${profileId}:${achievementId}:${isSampleDerived ? 'sample' : 'formal'}`
}

export function createAchievementRepository(
  storage: AchievementStorage = achievementStorage,
): AchievementRepository {
  function all(): AchievementUnlock[] {
    return storage.load().unlocks
  }

  function write(unlocks: readonly AchievementUnlock[]): void {
    storage.save({ schemaVersion: 1, unlocks: [...unlocks] })
  }

  return {
    listUnlocks(profileId, options = {}) {
      return all()
        .filter((unlock) => unlock.profileId === profileId && matches(unlock, options))
        .sort(sortUnlocks)
        .map(clone)
    },
    getUnlock(profileId, achievementId, options = {}) {
      const unlock = all().find(
        (candidate) =>
          candidate.profileId === profileId &&
          candidate.achievementId === achievementId &&
          matches(candidate, options),
      )
      return unlock ? clone(unlock) : null
    },
    recordUnlock(unlock) {
      const unlocks = all()
      const existing = unlocks.find((candidate) => candidate.id === unlock.id)
      if (existing) return clone(existing)
      write([...unlocks, clone(unlock)])
      return clone(unlock)
    },
    clearDemoAchievements(profileId) {
      write(
        all().filter(
          (unlock) =>
            !unlock.provenance.isSampleDerived ||
            (profileId !== undefined && unlock.profileId !== profileId),
        ),
      )
    },
    getLastWarning() {
      return storage.getLastWarning()
    },
  }
}

export const achievementRepository = createAchievementRepository()
