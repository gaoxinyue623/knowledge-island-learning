import { afterEach } from 'vitest'

// jsdom exposes an unavailable Storage object for opaque origins. The product
// deliberately fails closed when storage is unavailable, but browser-facing
// tests need a deterministic local store for their persistence contracts.
function ensureLocalStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const storage = window.localStorage
    const probe = `__vitest_storage_probe__${Date.now()}`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return
  } catch {
    const values = new Map<string, string>()
    const storage = Object.create(
      typeof Storage === 'undefined' ? Object.prototype : Storage.prototype,
    ) as Storage & { _values?: Map<string, string> }
    storage._values = values
    const memoryMethods = {
      getItem(this: typeof storage, key: string) {
        return this._values!.get(key) ?? null
      },
      setItem(this: typeof storage, key: string, value: string) {
        this._values!.set(key, String(value))
      },
      removeItem(this: typeof storage, key: string) {
        this._values!.delete(key)
      },
      clear(this: typeof storage) {
        this._values!.clear()
      },
      key(this: typeof storage, index: number) {
        return [...this._values!.keys()][index] ?? null
      },
    }
    if (typeof Storage !== 'undefined')
      for (const [name, method] of Object.entries(memoryMethods))
        Object.defineProperty(Storage.prototype, name, { configurable: true, value: method })
    Object.defineProperty(storage, 'length', { configurable: true, get: () => values.size })
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  }
}

ensureLocalStorage()

afterEach(() => {
  if (typeof document !== 'undefined') document.body.innerHTML = ''
})
