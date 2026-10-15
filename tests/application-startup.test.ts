import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencies = vi.hoisted(() => ({
  initialize: vi.fn(),
  sync: vi.fn(),
  ready: vi.fn(),
  use: vi.fn(),
  mount: vi.fn(),
}))
vi.mock('vue', () => ({
  createApp: () => ({ use: dependencies.use, mount: dependencies.mount }),
}))
vi.mock('@/App.vue', () => ({ default: {} }))
vi.mock('@/router', () => ({ default: { isReady: dependencies.ready } }))
vi.mock('@/stores/pinia', () => ({ pinia: {} }))
vi.mock('@/services/account/accountService', () => ({
  initializeAccount: dependencies.initialize,
  startAccountSync: dependencies.sync,
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  dependencies.initialize.mockResolvedValue(undefined)
  dependencies.ready.mockResolvedValue(undefined)
  document.body.innerHTML = '<div id="app"><p role="status">正在打开你的小岛…</p></div>'
})

describe('application startup recovery', () => {
  it('preserves loading feedback until the first route and its catalog are ready', async () => {
    let resolveRoute!: () => void
    dependencies.ready.mockReturnValue(new Promise<void>((resolve) => (resolveRoute = resolve)))
    await import('@/main')
    await flushPromises()
    expect(dependencies.mount).not.toHaveBeenCalled()
    expect(document.querySelector('[role="status"]')?.textContent).toContain('正在打开')
    resolveRoute()
    await flushPromises()
    expect(dependencies.mount).toHaveBeenCalledWith('#app')
    expect(dependencies.sync).toHaveBeenCalledOnce()
  })

  it('provides a reload action if the first page fails without clearing saved records', async () => {
    localStorage.setItem('startup-record', 'keep')
    dependencies.ready.mockRejectedValue(new Error('failed to load a route chunk'))
    await import('@/main')
    await flushPromises()
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('学习记录仍会保留')
    expect(document.querySelector('button')?.textContent).toBe('重新打开小岛')
    expect(dependencies.mount).not.toHaveBeenCalled()
    expect(dependencies.sync).not.toHaveBeenCalled()
    expect(localStorage.getItem('startup-record')).toBe('keep')
    localStorage.removeItem('startup-record')
  })
})
