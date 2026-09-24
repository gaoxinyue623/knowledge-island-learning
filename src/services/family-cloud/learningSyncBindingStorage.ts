export interface LearningSyncBinding {
  profileId: string
  username: string
  cloudProfileId: string
  revision: number
  enabled: boolean
  updatedAt: string
}

const prefix = 'knowledge-island.learning-sync-binding.v1:'

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function key(profileId: string): string {
  return `${prefix}${encodeURIComponent(profileId)}`
}

function valid(value: unknown): value is LearningSyncBinding {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LearningSyncBinding>
  return Boolean(
    typeof item.profileId === 'string' &&
      item.profileId.length > 0 &&
      typeof item.username === 'string' &&
      item.username.length > 0 &&
      typeof item.cloudProfileId === 'string' &&
      item.cloudProfileId.length > 0 &&
      typeof item.revision === 'number' &&
      Number.isInteger(item.revision) &&
      item.revision > 0 &&
      item.enabled === true &&
      typeof item.updatedAt === 'string' &&
      Number.isFinite(Date.parse(item.updatedAt)),
  )
}

export function loadLearningSyncBinding(profileId: string): LearningSyncBinding | null {
  if (!profileId) return null
  const target = storage()
  if (!target) return null
  try {
    const raw = target.getItem(key(profileId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!valid(parsed) || parsed.profileId !== profileId) {
      target.removeItem(key(profileId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveLearningSyncBinding(binding: LearningSyncBinding): boolean {
  if (!valid(binding)) return false
  const target = storage()
  if (!target) return false
  try {
    target.setItem(key(binding.profileId), JSON.stringify(binding))
    return true
  } catch {
    return false
  }
}

export function clearLearningSyncBinding(profileId: string): void {
  const target = storage()
  if (!target || !profileId) return
  try {
    target.removeItem(key(profileId))
  } catch {
    // Best effort cleanup.
  }
}
