// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPetServer } from '../server/petServer'
import { freshPetAccount } from '../src/services/pet/petPolicy'
import { accountCloudSchema } from '../src/services/account/contract'
const origin = 'https://learning.example'
let app: ReturnType<typeof createPetServer>, directory: string, base: string
async function start() {
  app = createPetServer({
    databasePath: join(directory, 'data.sqlite'),
    origins: [origin],
    secureCookies: true,
    env: {},
  })
  await new Promise<void>((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}/api/pet/`
}
async function call(
  path: string,
  cookie = '',
  username = 'parent_a',
  body?: unknown,
  method = body ? 'PUT' : 'GET',
  customOrigin = origin,
) {
  return fetch(base + path, {
    method,
    headers: {
      Origin: customOrigin,
      'Content-Type': 'application/json',
      'X-Knowledge-Island': 'pet-v2',
      'X-Pet-Account': username,
      Cookie: cookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}
async function register(username = 'parent_a') {
  const response = await call(
    'register',
    '',
    username,
    { username, password: 'Password-long-123' },
    'POST',
  )
  expect(response.status).toBe(200)
  expect(response.headers.get('set-cookie')).toContain('HttpOnly')
  expect(response.headers.get('set-cookie')).toContain('Secure')
  return response.headers.get('set-cookie')!.split(';')[0]!
}
const snapshot = () => ({
  schemaVersion: 1,
  entries: [
    {
      key: 'knowledge-island.student.v1',
      value: JSON.stringify({ profile: { id: 'learner-a', displayName: '小岛' } }),
    },
    { key: 'knowledge-island.preferences.v1', value: JSON.stringify({ reducedMotion: true }) },
  ],
  pets: [freshPetAccount('learner-a')],
})
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ki-account-'))
  await start()
})
afterEach(async () => {
  await app.close()
  rmSync(directory, { recursive: true, force: true })
})
describe('account-owned learning data', () => {
  it('requires a valid session, matching account and trusted origin', async () => {
    expect((await call('account/data')).status).toBe(401)
    const cookie = await register()
    expect((await call('account/data', cookie, 'parent_b')).status).toBe(409)
    expect(
      (
        await call(
          'account/data',
          cookie,
          'parent_a',
          { expectedRevision: 0, snapshot: snapshot() },
          'PUT',
          'https://evil.test',
        )
      ).status,
    ).toBe(403)
  })
  it('isolates two accounts and restores learning data and pets after restart and login', async () => {
    const a = await register(),
      b = await register('parent_b')
    const result = await call('account/data', a, 'parent_a', {
      expectedRevision: 0,
      snapshot: snapshot(),
    })
    expect(result.status).toBe(200)
    const saved = (await result.json()).data
    expect(accountCloudSchema.safeParse(saved).success).toBe(true)
    expect(saved.revision).toBe(1)
    expect((await (await call('account/data', b, 'parent_b')).json()).data).toBeNull()
    expect((await call('logout', a, 'parent_a', {}, 'POST')).status).toBe(200)
    expect((await call('account/data', a)).status).toBe(401)
    await app.close()
    await start()
    const login = await call(
      'login',
      '',
      'parent_a',
      { username: 'PARENT_A', password: 'Password-long-123' },
      'POST',
    )
    expect(login.status).toBe(200)
    const cookie = login.headers.get('set-cookie')!.split(';')[0]!
    expect((await (await call('account/data', cookie)).json()).data).toEqual(saved)
  })
  it('deduplicates retries and rejects concurrent stale writes without losing existing progress', async () => {
    const cookie = await register(),
      first = snapshot()
    expect(
      (await call('account/data', cookie, 'parent_a', { expectedRevision: 0, snapshot: first }))
        .status,
    ).toBe(200)
    const retry = await call('account/data', cookie, 'parent_a', {
      expectedRevision: 0,
      snapshot: first,
    })
    expect((await retry.json()).data.revision).toBe(1)
    const second = { ...first, pets: [] }
    const third = { ...first, entries: [] }
    const writes = await Promise.all(
      [second, third].map((s) =>
        call('account/data', cookie, 'parent_a', { expectedRevision: 1, snapshot: s }),
      ),
    )
    expect(writes.map((r) => r.status).sort()).toEqual([200, 409])
    const stored = (await (await call('account/data', cookie)).json()).data
    expect(stored.revision).toBe(2)
  })
  it('rejects credentials keys, duplicates, invalid pets and extra owner identifiers', async () => {
    const cookie = await register()
    for (const data of [
      { ...snapshot(), entries: [{ key: 'ki.auth-token', value: '{}' }] },
      { ...snapshot(), entries: [snapshot().entries[0], snapshot().entries[0]] },
      { ...snapshot(), pets: [{ profileId: 'learner-a', balance: 99999 }] },
    ])
      expect(
        (await call('account/data', cookie, 'parent_a', { expectedRevision: 0, snapshot: data }))
          .status,
      ).toBe(400)
    expect(
      (
        await call('account/data', cookie, 'parent_a', {
          expectedRevision: 0,
          snapshot: snapshot(),
          userId: 'parent_b',
        })
      ).status,
    ).toBe(400)
    expect((await (await call('account/data', cookie)).json()).data).toBeNull()
  })
  it('rejects bad credentials and invalidates the replaced session on login', async () => {
    const cookie = await register()
    expect(
      (
        await call(
          'login',
          '',
          'parent_a',
          { username: 'parent_a', password: 'wrong-password-123' },
          'POST',
        )
      ).status,
    ).toBe(401)
    const response = await call(
      'login',
      cookie,
      'parent_a',
      { username: 'parent_a', password: 'Password-long-123' },
      'POST',
    )
    expect(response.status).toBe(200)
    expect((await call('account/data', cookie)).status).toBe(401)
  })
})
