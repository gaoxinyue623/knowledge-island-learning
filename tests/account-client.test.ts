import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import { IDBFactory } from 'fake-indexeddb'
const remote = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('@/services/pet/petCloud', async () => ({
  ...(await vi.importActual('@/services/pet/petCloud')),
  petCloudRequest: remote.request,
}))
import {
  accountStorage,
  accountSessionStorage,
  accountPetDatabaseName,
  pointerKey,
  selectAccount,
} from '@/services/account/storage'
import {
  accountState,
  captureAccountSnapshot,
  hasLegacyData,
  initializeAccount,
  syncAccount,
  prepareAccountRestore,
  applyAccountRestore,
  resolveAccountConflict,
} from '@/services/account/accountService'
import { accountPets } from '@/services/account/pets'
import {
  canonicalSnapshot,
  safeAccountReturn,
  type AccountCloud,
  type AccountSnapshot,
} from '@/services/account/contract'
import { freshPetAccount } from '@/services/pet/petPolicy'
import { profileArchiveRegistry } from '@/services/profile-archive/profileArchiveRegistry'
import { isAccountDataKey } from '@/services/account/contract'
import { PetCloudError } from '@/services/pet/petCloud'
const studentKey = 'knowledge-island.student.v1'
const initial = (name: string): AccountSnapshot => ({
  schemaVersion: 1,
  entries: [{ key: studentKey, value: JSON.stringify({ name }) }],
  pets: [freshPetAccount(name)],
})
let clouds: Map<string, AccountCloud>, session: string | null
async function cloud(snapshot: AccountSnapshot, revision = 1): Promise<AccountCloud> {
  const bytes = await webcrypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalSnapshot(snapshot)),
  )
  return {
    revision,
    digest: Buffer.from(bytes).toString('hex'),
    snapshot,
    updatedAt: new Date().toISOString(),
  }
}
beforeEach(() => {
  selectAccount(null)
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('crypto', webcrypto)
  clouds = new Map()
  session = null
  Object.assign(accountState, {
    username: null,
    ready: false,
    error: '',
    sync: 'idle',
    conflict: null,
    lastSaved: '',
  })
  remote.request.mockReset().mockImplementation(async (path, method, body, username) => {
    if (path === 'session') return { username: session }
    if (path !== 'account/data') throw new Error('unexpected request')
    if (username !== session) throw new PetCloudError(409, '账号已切换', 'SESSION_CHANGED')
    if (method === 'GET') return { data: clouds.get(username) ?? null }
    const old = clouds.get(username)
    const next = await cloud(body.snapshot, (old?.revision ?? 0) + 1)
    if (old?.digest === next.digest) return { data: old }
    if ((old?.revision ?? 0) !== body.expectedRevision)
      throw new PetCloudError(409, '记录冲突', 'ACCOUNT_REVISION_CONFLICT')
    clouds.set(username, next)
    return { data: next }
  })
})
afterEach(() => {
  selectAccount(null)
  vi.unstubAllGlobals()
})
describe('account data lifecycle', () => {
  it('refreshes a changed conflict before allowing the user to replace either version', async () => {
    session = 'parent_a'
    clouds.set(session, await cloud(initial('baseline')))
    await initializeAccount()
    accountStorage.setItem(studentKey, '{"name":"local-edit"}')
    clouds.set(session, await cloud(initial('remote-edit'), 2))
    await syncAccount()
    const latest = await cloud(initial('newest-remote'), 3)
    clouds.set(session, latest)
    await expect(resolveAccountConflict('local')).rejects.toThrow('云端又有更新')
    expect(accountState.conflict?.revision).toBe(3)
    expect(clouds.get(session)).toEqual(latest)
    expect(accountStorage.getItem(studentKey)).toContain('local-edit')
  })
  it('includes every persistent learning archive section and excludes session credentials', () => {
    for (const section of profileArchiveRegistry) {
      if (section.keyKind !== 'indexeddb')
        expect(isAccountDataKey(section.key('learner-a')), section.kind).toBe(true)
    }
    expect(isAccountDataKey('knowledge-island.student.v1:another-child')).toBe(true)
    expect(isAccountDataKey('knowledge-island.curriculum-profile:another-child')).toBe(true)
    expect(isAccountDataKey('ki_session')).toBe(false)
    expect(isAccountDataKey('ki.account:parent_b:v1:knowledge-island.student.v1')).toBe(false)
  })
  it('refuses a backup restore when another device changed the account after preview', async () => {
    session = 'parent_a'
    clouds.set(session, await cloud(initial('current')))
    await initializeAccount()
    const draft = await prepareAccountRestore(JSON.stringify(initial('backup')))
    const newer = await cloud(initial('remote'), 2)
    clouds.set(session, newer)
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await expect(applyAccountRestore(draft)).rejects.toThrow('记录冲突')
    expect(accountStorage.getItem(studentKey)).toContain('current')
    expect(clouds.get(session)).toEqual(newer)
    click.mockRestore()
  })

  it('isolates local storage, session checkpoints, and IndexedDB across accounts', async () => {
    selectAccount('parent_a')
    accountStorage.setItem(studentKey, '{"name":"A"}')
    accountSessionStorage.setItem('checkpoint', 'A')
    await accountPets(accountPetDatabaseName('knowledge-island.pet.v1'), [
      freshPetAccount('child-a'),
    ])
    selectAccount('parent_b')
    expect(accountStorage.getItem(studentKey)).toBeNull()
    expect(accountSessionStorage.getItem('checkpoint')).toBeNull()
    expect(await accountPets(accountPetDatabaseName('knowledge-island.pet.v1'))).toEqual([])
    accountStorage.setItem(studentKey, '{"name":"B"}')
    selectAccount('parent_a')
    expect(accountStorage.getItem(studentKey)).toBe('{"name":"A"}')
    expect(accountSessionStorage.getItem('checkpoint')).toBe('A')
    expect((await captureAccountSnapshot()).pets[0]?.profileId).toBe('child-a')
  })
  it('restores cloud records including original learner IDs and pets on a fresh device', async () => {
    session = 'parent_a'
    clouds.set(session, await cloud(initial('original-child')))
    await initializeAccount()
    expect(accountState.ready).toBe(true)
    expect(accountStorage.getItem(studentKey)).toBe('{"name":"original-child"}')
    expect((await captureAccountSnapshot()).pets[0]?.profileId).toBe('original-child')
    expect(accountState.sync).toBe('saved')
  })
  it('claims legacy data once, preserving the old original and keeping the second account empty', async () => {
    localStorage.setItem(studentKey, '{"name":"old-child"}')
    await accountPets('knowledge-island.pet.v1', [freshPetAccount('old-child')])
    expect(hasLegacyData()).toBe(true)
    session = 'parent_a'
    await initializeAccount(true)
    expect(accountState.ready).toBe(true)
    expect(clouds.get(session)?.snapshot.pets[0]?.profileId).toBe('old-child')
    expect(localStorage.getItem(studentKey)).toBe('{"name":"old-child"}')
    expect(hasLegacyData()).toBe(false)
    session = 'parent_b'
    await initializeAccount(true)
    expect(accountStorage.getItem(studentKey)).toBeNull()
    expect(clouds.has('parent_b')).toBe(false)
  })
  it('never overwrites a nonempty cloud account with legacy records', async () => {
    localStorage.setItem(studentKey, '{"name":"old-child"}')
    session = 'parent_a'
    const original = await cloud(initial('cloud-child'))
    clouds.set(session, original)
    await initializeAccount(true)
    expect(accountState.ready).toBe(false)
    expect(accountState.error).toContain('已有记录')
    expect(clouds.get(session)).toEqual(original)
    expect(hasLegacyData()).toBe(true)
  })
  it('retries locally saved changes after network failure and survives reinitialization', async () => {
    session = 'parent_a'
    await initializeAccount()
    accountStorage.setItem(studentKey, '{"name":"offline-progress"}')
    remote.request.mockRejectedValueOnce(new Error('网络中断'))
    await syncAccount()
    expect(accountState.sync).toBe('pending')
    expect(accountStorage.getItem(studentKey)).toContain('offline-progress')
    await syncAccount()
    expect(accountState.sync).toBe('saved')
    accountStorage.setItem(studentKey, '{"name":"newer-progress"}')
    await initializeAccount()
    expect(accountState.ready).toBe(true)
    expect(clouds.get(session)?.snapshot.entries[0]?.value).toContain('newer-progress')
  })
  it('holds conflicting edits on both devices without silently replacing either', async () => {
    session = 'parent_a'
    clouds.set(session, await cloud(initial('baseline')))
    await initializeAccount()
    accountStorage.setItem(studentKey, '{"name":"local-edit"}')
    const newer = await cloud(initial('remote-edit'), 2)
    clouds.set(session, newer)
    await syncAccount()
    expect(accountState.sync).toBe('conflict')
    expect(accountStorage.getItem(studentKey)).toContain('local-edit')
    expect(clouds.get(session)).toEqual(newer)
    await initializeAccount()
    expect(accountState.conflict?.revision).toBe(2)
    expect(accountStorage.getItem(studentKey)).toContain('local-edit')
  })
  it('blocks stale tab writes after an atomic restore changes the namespace', () => {
    selectAccount('parent_a')
    localStorage.setItem(pointerKey('parent_a'), 'new-generation')
    expect(() => accountStorage.setItem(studentKey, '{}')).toThrow('另一个页面更新')
  })
  it('does not upload another account data when the cookie changed elsewhere', async () => {
    session = 'parent_a'
    await initializeAccount()
    accountStorage.setItem(studentKey, '{"name":"A"}')
    session = 'parent_b'
    await syncAccount()
    expect(accountState.username).toBeNull()
    expect(accountState.ready).toBe(false)
    expect(clouds.has('parent_b')).toBe(false)
  })
  it('allows only same-app post-login navigation', () => {
    for (const path of [
      'https://evil.test',
      '//evil.test',
      '/\\evil.test',
      '/login',
      '/register?next=x',
      '/\n/evil.test',
    ])
      expect(safeAccountReturn(path)).toBe('/home')
    expect(safeAccountReturn('/knowledge-point/one?textbookId=a')).toBe(
      '/knowledge-point/one?textbookId=a',
    )
  })
})
