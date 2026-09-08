// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { profileArchiveSectionKinds } from '../src/services/profile-archive/profileArchiveSchema'
import { createPetServer } from '../server/petServer'
import { validatePortableArchive } from '../src/services/profile-archive/portableArchiveValidator'

let app: ReturnType<typeof createPetServer>
let directory: string
let url: string
let time: number
const origin = 'http://localhost:5173'

function archive(sourceProfileId = 'student-a') {
  return {
    format: 'knowledge-island.student-profile',
    formatVersion: 1,
    exportedAt: '2026-09-08T00:00:00.000Z',
    sourceProfileId,
    sections: profileArchiveSectionKinds.map((kind) => ({
      kind,
      schemaVersion: kind === 'pet-account' ? 2 : 1,
      data: kind === 'student-profile'
        ? { version: 1, profile: { id: sourceProfileId, displayName: '小学生' }, characterId: 'default-character' }
        : null,
    })),
  }
}

async function start() {
  app = createPetServer({ databasePath: join(directory, 'test.sqlite'), origins: [origin], now: () => time })
  await new Promise<void>((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  url = `http://127.0.0.1:${(app.server.address() as { port: number }).port}/api/pet/`
}

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'family-cloud-'))
  time = Date.parse('2026-09-08T00:00:00.000Z')
  await start()
})

afterEach(async () => { await app.close(); rmSync(directory, { recursive: true, force: true }) })

async function request(path: string, method = 'GET', body?: unknown, cookie = '', username = 'parent_a', includeCsrf = true) {
  return fetch(url + path, {
    method,
    headers: {
      'Content-Type': 'application/json', Origin: origin, Cookie: cookie,
      ...(includeCsrf ? { 'X-Knowledge-Island': 'pet-v2' } : {}),
      'X-Pet-Account': username,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

async function register(username = 'parent_a') {
  const response = await request('register', 'POST', { username, password: 'strong-password-123' })
  expect(response.status).toBe(200)
  return response.headers.get('set-cookie')!.split(';')[0]!
}

describe('family cloud API', () => {
  it('builds a portable archive fixture', () => {
    const result = validatePortableArchive(archive())
    expect(result, result.ok ? '' : result.issue).toMatchObject({ ok: true })
  })
  it('isolates accounts and exposes only metadata from list', async () => {
    const firstCookie = await register()
    const created = await request('family/profiles', 'POST', { label: '第一份', archive: archive() }, firstCookie)
    expect(created.status, await created.text()).toBe(200)
    const metadata = await (await request('family/profiles', 'GET', undefined, firstCookie)).json()
    expect(metadata.profiles[0]).toMatchObject({ label: '第一份', revision: 1 })
    expect(metadata.profiles[0]).not.toHaveProperty('archive')
    const id = metadata.profiles[0].cloudProfileId as string
    const secondCookie = await register('parent_b')
    expect((await request(`family/profiles/${id}`, 'GET', undefined, secondCookie, 'parent_b')).status).toBe(404)
  })

  it('rejects missing authentication, csrf, malformed archive and session-account changes', async () => {
    expect((await request('family/profiles')).status).toBe(401)
    const cookie = await register()
    expect((await request('family/profiles', 'POST', { label: 'x', archive: archive() }, cookie, 'parent_a', false)).status).toBe(403)
    expect((await request('family/profiles', 'POST', { label: 'x', archive: { nope: true } }, cookie)).status).toBe(400)
    expect((await request('family/profiles', 'GET', undefined, cookie, 'other_parent')).status).toBe(409)
  })

  it('uses transaction CAS without changing the remote archive on a stale update', async () => {
    const cookie = await register()
    const created = await (await request('family/profiles', 'POST', { label: '第一份', archive: archive() }, cookie)).json()
    const id = created.cloudProfileId as string
    const next = archive()
    next.exportedAt = '2026-09-08T01:00:00.000Z'
    const updated = await request(`family/profiles/${id}`, 'PUT', { expectedRevision: 1, archive: next }, cookie)
    expect(updated.status).toBe(200)
    const stale = await request(`family/profiles/${id}`, 'PUT', { expectedRevision: 1, archive: archive('student-b') }, cookie)
    expect(stale.status).toBe(409)
    expect(await stale.json()).toMatchObject({ code: 'REVISION_CONFLICT', details: { currentRevision: 2 } })
    expect(await (await request(`family/profiles/${id}`, 'GET', undefined, cookie)).json()).toMatchObject({ revision: 2, archive: next })
  })
})
