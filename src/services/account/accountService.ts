import { createUuid } from '@/utils/uuid'
import { sha256Hex } from '@/utils/sha256'
import { reactive } from 'vue'
import { z } from 'zod'
import { PetCloudError, petCloudRequest } from '../pet/petCloud'
import {
  accountCloudSchema,
  accountSnapshotSchema,
  canonicalSnapshot,
  isAccountDataKey,
  type AccountCloud,
  type AccountSnapshot,
} from './contract'
import {
  ACCOUNT_CHANGED,
  AUTH_CHANGED_KEY,
  accountGeneration,
  accountOwner,
  accountPetDatabaseName,
  accountStorage,
  dataPrefix,
  pointerKey,
  selectAccount,
} from './storage'
import { accountPets } from './pets'

const PET_DB = 'knowledge-island.pet.v1'
let safeNavigation = false
export function navigateAccount(path: string) {
  safeNavigation = true
  window.location.replace(path)
}
const LEGACY_CLAIM = 'ki.legacy-account-owner.v1'
export const accountState = reactive({
  username: null as string | null,
  ready: false,
  error: '',
  sync: 'idle' as 'idle' | 'saving' | 'saved' | 'pending' | 'conflict',
  lastSaved: '',
  conflict: null as AccountCloud | null,
})
const metaKey = (username: string) => `ki.sync-meta:${username}:${accountGeneration()}`
const metaSchema = z.object({
  revision: z.number().int().nonnegative(),
  digest: z.string(),
  updatedAt: z.string(),
})
function metadata(username: string) {
  const raw = window.localStorage.getItem(metaKey(username))
  if (!raw) return { revision: 0, digest: '', updatedAt: '' }
  return metaSchema.parse(JSON.parse(raw))
}
function remember(username: string, cloud: AccountCloud) {
  window.localStorage.setItem(
    metaKey(username),
    JSON.stringify({ revision: cloud.revision, digest: cloud.digest, updatedAt: cloud.updatedAt }),
  )
  accountState.lastSaved = cloud.updatedAt
}
async function digest(snapshot: AccountSnapshot) {
  const bytes = new TextEncoder().encode(canonicalSnapshot(snapshot))
  const subtle = globalThis.crypto?.subtle
  if (typeof subtle?.digest === 'function') {
    const hash = await subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return sha256Hex(bytes)
}
export async function captureAccountSnapshot(legacy = false): Promise<AccountSnapshot> {
  const storage = legacy ? window.localStorage : accountStorage
  const entries: AccountSnapshot['entries'] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith('knowledge-island.profile-') && key.includes('journal'))
      throw new Error('学习档案正在切换或恢复，请完成后再同步。')
    if (key && isAccountDataKey(key)) {
      const value = storage.getItem(key)
      if (value !== null) entries.push({ key, value })
    }
  }
  const pets = await accountPets(legacy ? PET_DB : accountPetDatabaseName(PET_DB))
  return accountSnapshotSchema.parse({ schemaVersion: 1, entries, pets })
}
const nonempty = (snapshot: AccountSnapshot) =>
  snapshot.entries.length > 0 || snapshot.pets.length > 0
/** Stage into a fresh namespace, then atomically select it. The old copy stays available. */
async function installSnapshot(username: string, snapshot: AccountSnapshot, cloud?: AccountCloud) {
  const valid = accountSnapshotSchema.parse(snapshot)
  const generation = createUuid()
  const prefix = dataPrefix(username, generation)
  for (const entry of valid.entries) window.localStorage.setItem(prefix + entry.key, entry.value)
  await accountPets(`${PET_DB}:${username}:${generation}`, valid.pets)
  if (cloud)
    window.localStorage.setItem(
      `ki.sync-meta:${username}:${generation}`,
      JSON.stringify({
        revision: cloud.revision,
        digest: cloud.digest,
        updatedAt: cloud.updatedAt,
      }),
    )
  window.localStorage.setItem(pointerKey(username), generation)
  selectAccount(username)
  if (cloud) accountState.lastSaved = cloud.updatedAt
}
async function readCloud(username: string): Promise<AccountCloud | null> {
  return z
    .object({ data: accountCloudSchema.nullable() })
    .parse(await petCloudRequest('account/data', 'GET', undefined, username)).data
}
async function writeCloud(username: string, revision: number, snapshot: AccountSnapshot) {
  return z
    .object({ data: accountCloudSchema })
    .parse(
      await petCloudRequest(
        'account/data',
        'PUT',
        { expectedRevision: revision, snapshot },
        username,
      ),
    ).data
}
export function hasLegacyData() {
  try {
    return (
      !window.localStorage.getItem(LEGACY_CLAIM) &&
      Boolean(window.localStorage.getItem('knowledge-island.student.v1'))
    )
  } catch {
    return false
  }
}
function failure(error: unknown) {
  accountState.error = error instanceof Error ? error.message : '账号同步暂时未完成，请重试。'
  accountState.sync = 'pending'
  if (
    error instanceof PetCloudError &&
    (error.status === 401 || error.code === 'SESSION_CHANGED')
  ) {
    accountState.username = null
    accountState.ready = false
    window.dispatchEvent(new Event('ki-session-expired'))
  }
}
export async function initializeAccount(migrateLegacy = false): Promise<void> {
  accountState.ready = false
  accountState.error = ''
  accountState.conflict = null
  try {
    const session = z
      .object({
        username: z
          .string()
          .regex(/^[a-z0-9_]{4,32}$/)
          .nullable(),
      })
      .parse(await petCloudRequest('session'))
    accountState.username = session.username
    selectAccount(session.username)
    if (!session.username) {
      accountState.ready = true
      return
    }
    const username = session.username
    const cloud = await readCloud(username)
    let local = await captureAccountSnapshot()
    const meta = metadata(username)
    if (migrateLegacy && hasLegacyData()) {
      if (cloud || nonempty(local))
        throw new Error(
          '此账号已有记录。旧记录仍完整保留，请在家庭档案中导出后单独导入，不能直接覆盖。',
        )
      local = await captureAccountSnapshot(true)
      await installSnapshot(username, local)
      // The old device data can be claimed by only one account.
      window.localStorage.setItem(LEGACY_CLAIM, username)
    }
    const localDigest = await digest(local)
    if (cloud) {
      if (localDigest === cloud.digest) remember(username, cloud)
      else if (!nonempty(local) || localDigest === meta.digest)
        await installSnapshot(username, cloud.snapshot, cloud)
      else if (cloud.revision === meta.revision)
        remember(username, await writeCloud(username, meta.revision, local))
      else {
        accountState.conflict = cloud
        accountState.sync = 'conflict'
        accountState.ready = true
        return
      }
    } else if (nonempty(local)) {
      const saved = await writeCloud(username, 0, local)
      remember(username, saved)
    }
    accountState.sync = cloud || nonempty(local) ? 'saved' : 'idle'
    accountState.ready = true
  } catch (error) {
    failure(error)
  }
}
export async function authenticate(
  mode: 'login' | 'register',
  username: string,
  password: string,
  migrate: boolean,
) {
  const authChangedValue = createUuid()
  await petCloudRequest(mode, 'POST', { username: username.trim().toLowerCase(), password })
  window.localStorage.setItem(AUTH_CHANGED_KEY, authChangedValue)
  await initializeAccount(migrate)
  if (!accountState.ready) throw new Error(accountState.error || '账号记录尚未读取，请重试。')
}
let inflight: Promise<void> | null = null
async function synchronize(): Promise<void> {
  const username = accountState.username
  if (!username || !accountState.ready || accountState.conflict || accountOwner() !== username)
    return
  const generation = accountGeneration()
  const snapshot = await captureAccountSnapshot()
  const localDigest = await digest(snapshot)
  const meta = metadata(username)
  if (localDigest === meta.digest || (!nonempty(snapshot) && !meta.revision)) {
    const cloud = await readCloud(username)
    if (cloud && cloud.digest !== localDigest) {
      accountState.conflict = cloud
      accountState.sync = 'conflict'
    } else accountState.sync = meta.revision ? 'saved' : 'idle'
    return
  }
  accountState.sync = 'saving'
  try {
    const saved = await writeCloud(username, meta.revision, snapshot)
    if (accountOwner() !== username || accountGeneration() !== generation) return
    remember(username, saved)
    accountState.error = ''
    // Changes made while uploading remain dirty and will be retried.
    accountState.sync =
      (await digest(await captureAccountSnapshot())) === saved.digest ? 'saved' : 'pending'
  } catch (error) {
    if (error instanceof PetCloudError && error.code === 'ACCOUNT_REVISION_CONFLICT') {
      accountState.conflict = await readCloud(username)
      accountState.sync = 'conflict'
    } else throw error
  }
}
export async function syncAccount(): Promise<void> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      if (navigator.locks)
        await navigator.locks.request(`ki-account-sync:${accountState.username}`, synchronize)
      else await synchronize()
    } catch (error) {
      failure(error)
    }
  })().finally(() => {
    inflight = null
  })
  return inflight
}
export function downloadAccountSnapshot(snapshot: AccountSnapshot, label = '知识岛账号备份') {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob),
    link = document.createElement('a')
  link.href = url
  link.download = `${label}-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  const revoke = URL.revokeObjectURL.bind(URL)
  setTimeout(() => revoke(url), 1000)
}
export async function resolveAccountConflict(choice: 'cloud' | 'local') {
  const username = accountState.username,
    cloud = accountState.conflict
  if (!username || !cloud) return
  const latest = await readCloud(username)
  if (!latest || latest.revision !== cloud.revision) {
    accountState.conflict = latest
    throw new Error('云端又有更新，已刷新版本，请重新选择。')
  }
  const local = await captureAccountSnapshot()
  downloadAccountSnapshot(choice === 'cloud' ? local : cloud.snapshot, '知识岛冲突记录备份')
  if (choice === 'cloud') await installSnapshot(username, cloud.snapshot, cloud)
  else remember(username, await writeCloud(username, cloud.revision, local))
  navigateAccount('/home')
}
export async function prepareAccountRestore(text: string) {
  const username = accountState.username
  if (!username) throw new Error('请先登录账号。')
  const snapshot = accountSnapshotSchema.parse(JSON.parse(text))
  const cloud = await readCloud(username)
  return { username, snapshot, revision: cloud?.revision ?? 0 }
}
export async function applyAccountRestore(
  draft: Awaited<ReturnType<typeof prepareAccountRestore>>,
) {
  if (draft.username !== accountState.username) throw new Error('账号已切换，请重新选择备份。')
  downloadAccountSnapshot(await captureAccountSnapshot(), '知识岛恢复前备份')
  const saved = await writeCloud(draft.username, draft.revision, draft.snapshot)
  await installSnapshot(draft.username, saved.snapshot, saved)
  navigateAccount('/home')
}
export async function reloadAfterAccountChange() {
  await syncAccount()
  // The pending local copy is durable and is uploaded during the next boot.
  navigateAccount(window.location.pathname + window.location.search)
}
export async function logoutAccount() {
  const username = accountState.username
  if (!username) {
    navigateAccount('/login')
    return
  }
  await syncAccount()
  if (accountState.sync === 'pending' || accountState.sync === 'saving' || accountState.conflict)
    throw new Error('仍有待同步记录，请先完成同步或处理冲突，再退出账号。')
  await petCloudRequest('logout', 'POST', undefined, username)
  selectAccount(null)
  accountState.username = null
  window.localStorage.setItem(AUTH_CHANGED_KEY, createUuid())
  navigateAccount('/login')
}
export function startAccountSync() {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    if (!accountState.username || !accountState.ready) return
    if (accountState.sync !== 'conflict') accountState.sync = 'pending'
    clearTimeout(timeout)
    timeout = setTimeout(() => void syncAccount(), 1200)
  }
  window.addEventListener(ACCOUNT_CHANGED, schedule)
  window.addEventListener('online', () => void syncAccount())
  window.addEventListener('focus', () => void syncAccount())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void syncAccount()
  })
  window.addEventListener('storage', (event) => {
    if (
      event.key === AUTH_CHANGED_KEY ||
      (accountState.username && event.key === pointerKey(accountState.username))
    ) {
      window.location.reload()
      return
    }
    if (
      event.key?.startsWith(
        accountState.username
          ? dataPrefix(accountState.username, accountGeneration())
          : 'ki.account:',
      )
    )
      schedule()
  })
  window.addEventListener('beforeunload', (event) => {
    if (
      !safeNavigation &&
      accountState.username &&
      ['pending', 'saving', 'conflict'].includes(accountState.sync)
    ) {
      event.preventDefault()
      event.returnValue = ''
    }
  })
  setInterval(() => void syncAccount(), 30000)
}
