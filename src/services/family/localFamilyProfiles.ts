export const FAMILY_PROFILE_REGISTRY_KEY = 'knowledge-island.family-profiles.v1'

export interface LocalFamilyProfile {
  id: string
  displayName: string
  characterId: string
  createdAt: string
}

export interface LocalFamilyProfileRegistry {
  schemaVersion: 1
  activeProfileId: string | null
  profiles: LocalFamilyProfile[]
}

export interface FamilyProfileStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function validProfile(value: unknown): value is LocalFamilyProfile {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['id', 'displayName', 'characterId', 'createdAt'].every(
    (key) => typeof item[key] === 'string' && Boolean(item[key]),
  )
}

export function parseLocalFamilyProfileRegistry(value: unknown): LocalFamilyProfileRegistry | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.profiles)) return null
  if (candidate.activeProfileId !== null && typeof candidate.activeProfileId !== 'string') return null
  if (!candidate.profiles.every(validProfile)) return null
  const profiles = candidate.profiles.map((profile) => ({ ...profile }))
  if (new Set(profiles.map((profile) => profile.id)).size !== profiles.length) return null
  if (candidate.activeProfileId && !profiles.some((profile) => profile.id === candidate.activeProfileId)) return null
  return { schemaVersion: 1, activeProfileId: candidate.activeProfileId, profiles }
}

export function createLocalFamilyProfileRepository(storage: FamilyProfileStorage | null) {
  function read(): LocalFamilyProfileRegistry | null {
    if (!storage) return null
    try {
      const raw = storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)
      return raw ? parseLocalFamilyProfileRegistry(JSON.parse(raw)) : null
    } catch {
      return null
    }
  }
  function write(registry: LocalFamilyProfileRegistry): boolean {
    if (!storage || !parseLocalFamilyProfileRegistry(registry)) return false
    try {
      storage.setItem(FAMILY_PROFILE_REGISTRY_KEY, JSON.stringify(registry))
      return true
    } catch {
      return false
    }
  }
  return {
    status(): 'absent' | 'valid' | 'invalid' {
      if (!storage) return 'absent'
      try {
        const raw = storage.getItem(FAMILY_PROFILE_REGISTRY_KEY)
        if (raw === null) return 'absent'
        return parseLocalFamilyProfileRegistry(JSON.parse(raw)) ? 'valid' : 'invalid'
      } catch { return 'invalid' }
    },
    read,
    write,
    ensureInitial(profile: LocalFamilyProfile): LocalFamilyProfileRegistry | null {
      const current = read()
      if (current) return current
      if (this.status() === 'invalid') return null
      const registry: LocalFamilyProfileRegistry = {
        schemaVersion: 1,
        activeProfileId: profile.id,
        profiles: [profile],
      }
      return write(registry) ? registry : null
    },
  }
}

function browserStorage(): FamilyProfileStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage }
  catch { return null }
}

export const localFamilyProfileRepository = createLocalFamilyProfileRepository(browserStorage())
