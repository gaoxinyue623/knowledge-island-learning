// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPetServer } from '../server/petServer'
import { applyPetCommand, freshPetAccount, settlePetSources } from '../src/services/pet/petPolicy'
let app: ReturnType<typeof createPetServer>, directory: string, url: string, time: number
const origin = 'http://localhost:5173'
const now = '2026-09-07T02:00:00.000Z'
const account = () =>
  applyPetCommand(
    settlePetSources(
      freshPetAccount('child'),
      [
        {
          id: 'math',
          profileId: 'child',
          title: '完成数学课',
          amount: 60,
          kind: 'lesson',
          occurredAt: now,
        },
      ],
      now,
    ),
    { kind: 'adopt', name: '小芽' },
    'adopt',
    now,
  )
async function start() {
  app = createPetServer({
    databasePath: join(directory, 'test.sqlite'),
    origins: [origin],
    now: () => time,
  })
  await new Promise<void>((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  const address = app.server.address() as { port: number }
  url = `http://127.0.0.1:${address.port}/api/pet/`
}
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'pet-api-'))
  time = Date.parse(now)
  await start()
})
afterEach(async () => {
  await app.close()
  rmSync(directory, { recursive: true, force: true })
})
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  cookie = '',
  username = 'parent_a',
  requestOrigin = origin,
) {
  return fetch(url + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Knowledge-Island': 'pet-v2',
      'X-Pet-Account': username,
      Origin: requestOrigin,
      Cookie: cookie,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
async function register(username = 'parent_a') {
  const r = await request('register', 'POST', { username, password: 'strong-password-123' })
  expect(r.status).toBe(200)
  expect(r.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Strict')
  return r.headers.get('set-cookie')!.split(';')[0]!
}
const backupBody = (value = account(), revision = 0) => ({
  profileId: 'child',
  label: '小芽的家',
  revision,
  account: value,
})
describe('Node pet account and backup API', () => {
  it('requires login and trusted origin, expires and revokes sessions', async () => {
    expect((await request('backups')).status).toBe(401)
    expect((await request('register', 'POST', {}, '', '', 'https://foreign.test')).status).toBe(403)
    const cookie = await register()
    expect((await request('session', 'GET', undefined, cookie)).status).toBe(200)
    expect((await request('backups', 'GET', undefined, cookie, 'other_parent')).status).toBe(409)
    expect((await request('logout', 'POST', undefined, cookie)).status).toBe(200)
    expect((await request('backups', 'GET', undefined, cookie)).status).toBe(401)
    const login = await request('login', 'POST', {
      username: 'parent_a',
      password: 'strong-password-123',
    })
    expect(login.status).toBe(200)
    time += 8 * 86400000
    expect(
      (await request('backups', 'GET', undefined, login.headers.get('set-cookie')!.split(';')[0]))
        .status,
    ).toBe(401)
  })
  it('rejects bad credentials and missing CSRF headers', async () => {
    await register()
    expect(
      (await request('login', 'POST', { username: 'parent_a', password: 'incorrect-pass' })).status,
    ).toBe(401)
    expect(
      (await request('register', 'POST', { username: 'parent_a', password: 'strong-password-123' }))
        .status,
    ).toBe(409)
    expect(
      (
        await fetch(url + 'register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: origin },
          body: '{}',
        })
      ).status,
    ).toBe(403)
  })
  it('persists backups and sessions across server restart and isolates parent accounts', async () => {
    const cookie = await register()
    expect((await request('backup', 'PUT', backupBody(), cookie)).status).toBe(200)
    await app.close()
    await start()
    const downloaded = await request('backup?profileId=child', 'GET', undefined, cookie)
    expect(await downloaded.json()).toMatchObject({ account: account(), revision: 1 })
    const otherCookie = await register('parent_b')
    expect(
      (await request('backup?profileId=child', 'GET', undefined, otherCookie, 'parent_b')).status,
    ).toBe(404)
    expect(
      await (await request('backups', 'GET', undefined, otherCookie, 'parent_b')).json(),
    ).toEqual({ backups: [] })
  })
  it('accepts exact retries but rejects stale versions and divergent histories without data loss', async () => {
    const cookie = await register()
    expect((await request('backup', 'PUT', backupBody(), cookie)).status).toBe(200)
    expect(await (await request('backup', 'PUT', backupBody(), cookie)).json()).toEqual({
      revision: 1,
    })
    const apple = applyPetCommand(account(), { kind: 'buy', foodId: 'apple' }, 'apple', now)
    const bread = applyPetCommand(account(), { kind: 'buy', foodId: 'bread' }, 'bread', now)
    const competing = await Promise.all([
      request('backup', 'PUT', backupBody(apple, 1), cookie),
      request('backup', 'PUT', backupBody(bread, 1), cookie),
    ])
    expect(competing.map((r) => r.status).sort()).toEqual([200, 409])
    const remote = await (await request('backup?profileId=child', 'GET', undefined, cookie)).json()
    const loser = remote.account.events.at(-1).id === 'apple' ? bread : apple
    expect((await request('backup', 'PUT', backupBody(loser, 2), cookie)).status).toBe(409)
    expect(
      await (await request('backup?profileId=child', 'GET', undefined, cookie)).json(),
    ).toEqual(remote)
  })
  it('validates ledger arithmetic and profile scope before accepting a snapshot', async () => {
    const cookie = await register()
    const invalid = {
      ...account(),
      events: [{ ...account().events[0], amount: 61 }, ...account().events.slice(1)],
    }
    expect((await request('backup', 'PUT', backupBody(invalid), cookie)).status).toBe(400)
    expect(
      (await request('backup', 'PUT', { ...backupBody(), profileId: 'someone_else' }, cookie))
        .status,
    ).toBe(400)
    expect(await (await request('backups', 'GET', undefined, cookie)).json()).toEqual({
      backups: [],
    })
  })
  it('rate limits authentication attempts', async () => {
    for (let i = 0; i < 15; i++) await request('login', 'POST', {})
    expect((await request('login', 'POST', {})).status).toBe(429)
  })
})
