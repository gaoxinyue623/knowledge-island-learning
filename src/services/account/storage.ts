// The selected account is held in memory, never treated as authentication.
// Authentication always comes from the server's HttpOnly session.
let owner: string | null = null
let generation = 'legacy'
export const ACCOUNT_CHANGED = 'ki-account-data-changed'
export const AUTH_CHANGED_KEY = 'ki.auth-change.v1'
export const pointerKey = (username: string) => `ki.account-generation:${username}`
export const dataPrefix = (username: string, id: string) => `ki.account:${username}:${id}:`
export function accountOwner() {
  return owner
}
export function selectAccount(username: string | null): void {
  owner = username
  generation = username ? (window.localStorage.getItem(pointerKey(username)) ?? 'v1') : 'legacy'
}
export function accountGeneration() {
  return generation
}
export function assertAccountStorageCurrent(): void {
  if (owner && (window.localStorage.getItem(pointerKey(owner)) ?? 'v1') !== generation)
    throw new Error('账号记录已在另一个页面更新，请刷新后继续。')
}
export function notifyAccountChange(): void {
  if (owner && typeof window !== 'undefined') window.dispatchEvent(new Event(ACCOUNT_CHANGED))
}
export function accountPetDatabaseName(base: string): string {
  assertAccountStorageCurrent()
  return owner ? `${base}:${owner}:${generation}` : base
}
function scoped(storage: () => Storage, persistent: boolean): Storage {
  const prefix = () => (owner ? dataPrefix(owner, generation) : '')
  const keys = () => {
    assertAccountStorageCurrent()
    const source = storage(),
      start = prefix(),
      found: string[] = []
    for (let i = 0; i < source.length; i++) {
      const key = source.key(i)
      if (key && (start ? key.startsWith(start) : key.startsWith('knowledge-island.')))
        found.push(start ? key.slice(start.length) : key)
    }
    return found
  }
  return {
    get length() {
      return keys().length
    },
    key(index: number) {
      return keys()[index] ?? null
    },
    getItem(key: string) {
      assertAccountStorageCurrent()
      return storage().getItem(prefix() + key)
    },
    setItem(key: string, value: string) {
      assertAccountStorageCurrent()
      const target = prefix() + key
      if (storage().getItem(target) === value) return
      storage().setItem(target, value)
      if (persistent) notifyAccountChange()
    },
    removeItem(key: string) {
      assertAccountStorageCurrent()
      storage().removeItem(prefix() + key)
      if (persistent) notifyAccountChange()
    },
    clear() {
      for (const key of keys()) this.removeItem(key)
    },
  }
}
export const accountStorage = scoped(() => window.localStorage, true)
export const accountSessionStorage = scoped(() => window.sessionStorage, false)
