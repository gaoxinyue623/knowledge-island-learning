// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { createPetServer } from '../server/petServer'
const origin = 'https://learning.example',
  password = 'Password-long-123',
  newPassword = 'Password-new-456'
let app: ReturnType<typeof createPetServer>, directory: string, base: string, time: number
async function start() {
  app = createPetServer({
    databasePath: join(directory, 'data.sqlite'),
    origins: [origin],
    env: { FEEDBACK_ADMIN_ACCOUNTS: 'operator' },
    now: () => time,
  })
  await new Promise<void>((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}/api/pet/`
}
async function call(
  path: string,
  cookie = '',
  username = 'parent_a',
  body?: unknown,
  method = body ? 'POST' : 'GET',
) {
  return fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-Knowledge-Island': 'pet-v2',
      'X-Pet-Account': username,
      Cookie: cookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}
async function login(username = 'parent_a', secret = password, register = false) {
  const res = await call(register ? 'register' : 'login', '', username, {
    username,
    password: secret,
  })
  expect(res.status).toBe(200)
  return res.headers.get('set-cookie')!.split(';')[0]!
}
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'ki-security-'))
  time = Date.now()
  await start()
})
afterEach(async () => {
  await app.close()
  rmSync(directory, { recursive: true, force: true })
})
describe('account security and parent confirmation', () => {
  it('migrates existing sessions without losing login and hashes recovery codes at rest', async () => {
    const cookie = await login('parent_a', password, true)
    await app.close()
    const db = new DatabaseSync(join(directory, 'data.sqlite'))
    db.exec('DROP TABLE session_details; PRAGMA user_version=4')
    db.close()
    await start()
    const status = await (await call('security', cookie)).json()
    expect(status.sessions).toHaveLength(1)
    expect(status.sessions[0].current).toBe(true)
    expect(status.sessions[0].device).toContain('升级前')
    expect(JSON.stringify(status)).not.toContain(cookie.split('=')[1])
    const { code } = await (
      await call('security/recovery-code', cookie, 'parent_a', { password })
    ).json()
    const read = new DatabaseSync(join(directory, 'data.sqlite'))
    const hash = read.prepare('SELECT code_hash FROM account_recovery').get()!.code_hash
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toBe(code.replaceAll('-', ''))
    read.close()
  })
  it('recovers only once, revokes all old sessions and preserves account data', async () => {
    const a = await login('parent_a', password, true),
      b = await login()
    const snapshot = { schemaVersion: 1, entries: [], pets: [] }
    expect(
      (await call('account/data', a, 'parent_a', { expectedRevision: 0, snapshot }, 'PUT')).status,
    ).toBe(200)
    const { code } = await (
      await call('security/recovery-code', a, 'parent_a', { password })
    ).json()
    const results = await Promise.all([
      call('recover', '', '', { username: 'parent_a', code, newPassword }),
      call('recover', '', '', { username: 'parent_a', code, newPassword }),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([200, 400])
    expect((await call('security', a)).status).toBe(401)
    expect((await call('security', b)).status).toBe(401)
    expect((await call('login', '', '', { username: 'parent_a', password })).status).toBe(401)
    const restored = await login('parent_a', newPassword)
    expect((await (await call('account/data', restored)).json()).data.snapshot).toEqual(snapshot)
    expect((await (await call('security', restored)).json()).recoveryEnabled).toBe(false)
  })
  it('invalidates replaced codes and does not allow another account to use a recovery code', async () => {
    const a = await login('parent_a', password, true)
    await login('parent_b', password, true)
    const first = await (await call('security/recovery-code', a, 'parent_a', { password })).json()
    const second = await (await call('security/recovery-code', a, 'parent_a', { password })).json()
    expect(
      (await call('recover', '', '', { username: 'parent_a', code: first.code, newPassword }))
        .status,
    ).toBe(400)
    expect(
      (await call('recover', '', '', { username: 'parent_b', code: second.code, newPassword }))
        .status,
    ).toBe(400)
    expect(
      (await call('security/recovery-code', a, 'parent_a', { password: 'wrong-password' })).status,
    ).toBe(403)
    expect((await call('security/recovery-code', a, 'parent_b', { password })).status).toBe(409)
    expect(
      (
        await call('recover', '', '', {
          username: 'parent_a',
          code: second.code.toLowerCase(),
          newPassword,
        })
      ).status,
    ).toBe(200)
  })
  it('changes password, rotates current cookie and revokes old codes and other devices', async () => {
    const a = await login('parent_a', password, true),
      b = await login()
    const { code } = await (
      await call('security/recovery-code', a, 'parent_a', { password })
    ).json()
    const changed = await call('security/password', a, 'parent_a', { password, newPassword })
    expect(changed.status).toBe(200)
    const next = changed.headers.get('set-cookie')!.split(';')[0]!
    expect(next).not.toBe(a)
    expect((await call('security', a)).status).toBe(401)
    expect((await call('security', b)).status).toBe(401)
    expect((await call('security', next)).status).toBe(200)
    expect(
      (await call('recover', '', '', { username: 'parent_a', code, newPassword })).status,
    ).toBe(400)
    const c = await login('parent_a', newPassword)
    expect(
      (await call('security/revoke-others', next, 'parent_a', { password: newPassword })).status,
    ).toBe(200)
    expect((await call('security', c)).status).toBe(401)
    expect((await call('security', next)).status).toBe(200)
  })
  it('keeps parent confirmation session scoped, expiring after 15 minutes and explicitly lockable', async () => {
    const a = await login('parent_a', password, true),
      b = await login()
    expect((await (await call('parent-access', a)).json()).unlocked).toBe(false)
    expect((await call('parent-access', a, 'parent_a', { password: 'bad-password' })).status).toBe(
      403,
    )
    expect((await (await call('parent-access', a, 'parent_a', { password })).json()).until).toBe(
      time + 900_000,
    )
    expect((await (await call('parent-access', b)).json()).unlocked).toBe(false)
    expect((await (await call('parent-access', a)).json()).unlocked).toBe(true)
    time += 900_001
    expect((await (await call('parent-access', a)).json()).unlocked).toBe(false)
    await call('parent-access', a, 'parent_a', { password })
    await call('parent-access', a, 'parent_a', undefined, 'DELETE')
    expect((await (await call('parent-access', a)).json()).unlocked).toBe(false)
  })
  it('throttles recovery attempts and rejects untrusted origins', async () => {
    for (let index = 0; index < 5; index++)
      expect(
        (await call('recover', '', '', { username: 'parent_a', code: 'A'.repeat(48), newPassword }))
          .status,
      ).toBe(400)
    expect(
      (await call('recover', '', '', { username: 'parent_a', code: 'A'.repeat(48), newPassword }))
        .status,
    ).toBe(429)
    const res = await fetch(base + 'recover', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
    })
    expect(res.status).toBe(403)
  })
})
describe('feedback workflow', () => {
  it('isolates feedback, deduplicates retries, authorizes operators and returns versioned replies', async () => {
    const a = await login('parent_a', password, true),
      b = await login('parent_b', password, true),
      admin = await login('operator', password, true)
    const input = {
      id: randomUUID(),
      category: 'ai',
      message: '第二道题的答案似乎不正确',
      page: '/assessment',
      contentId: '第一单元',
    }
    const first = await (await call('feedback', a, 'parent_a', input)).json()
    expect(first.ticket.status).toBe('received')
    expect((await (await call('feedback', a, 'parent_a', input)).json()).ticket.id).toBe(input.id)
    expect((await (await call('feedback', a)).json()).tickets).toHaveLength(1)
    expect((await (await call('feedback', b, 'parent_b')).json()).tickets).toHaveLength(0)
    expect((await call('feedback', b, 'parent_b', input)).status).toBe(409)
    expect((await call('feedback/manage', a)).status).toBe(403)
    expect((await call('feedback/manage', admin, 'operator')).status).toBe(403)
    await call('parent-access', admin, 'operator', { password })
    expect((await (await call('feedback/manage', admin, 'operator')).json()).tickets).toHaveLength(
      1,
    )
    const update = {
      id: input.id,
      revision: 1,
      status: 'resolved',
      reply: '已修正题目解析，谢谢反馈。',
    }
    expect((await call('feedback/manage', admin, 'operator', update)).status).toBe(200)
    expect((await call('feedback/manage', admin, 'operator', update)).status).toBe(409)
    expect((await (await call('feedback', a)).json()).tickets[0]).toMatchObject({
      status: 'resolved',
      revision: 2,
      reply: update.reply,
    })
    time += 900_001
    expect(
      (await call('feedback/manage', admin, 'operator', { ...update, revision: 2 })).status,
    ).toBe(403)
    await app.close()
    await start()
    expect((await (await call('feedback', a)).json()).tickets[0].reply).toBe(update.reply)
  })
  it('rejects client status changes, private query strings and empty feedback', async () => {
    const a = await login('parent_a', password, true)
    const input = {
      id: randomUUID(),
      category: 'content',
      message: '题目无法打开',
      page: '/lesson',
      contentId: '',
    }
    expect((await call('feedback', a, 'parent_a', { ...input, status: 'resolved' })).status).toBe(
      400,
    )
    expect(
      (await call('feedback', a, 'parent_a', { ...input, page: '/lesson?token=secret' })).status,
    ).toBe(400)
    expect((await call('feedback', a, 'parent_a', { ...input, message: '     ' })).status).toBe(400)
  })
})
