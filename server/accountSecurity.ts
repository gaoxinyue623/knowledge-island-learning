import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { DatabaseSync } from 'node:sqlite'
import { z } from 'zod'

const derive = promisify(scrypt)
const password = z.string().min(10).max(128)
const proof = z.object({ password }).strict()
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export class SecurityError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success)
    throw new SecurityError(400, 'INVALID_INPUT', '请检查输入内容，密码需为 10～128 个字符。')
  return result.data
}
type User = { id: string; salt: string; password_hash: string }

export function createAccountSecurity(db: DatabaseSync, now: () => number) {
  db.exec(`CREATE TABLE IF NOT EXISTS account_recovery (
    user_id TEXT PRIMARY KEY REFERENCES users(id), code_hash TEXT NOT NULL, created_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS session_details (
    token_hash TEXT PRIMARY KEY REFERENCES sessions(token_hash) ON DELETE CASCADE,
    id TEXT NOT NULL UNIQUE, device TEXT NOT NULL, created_at TEXT NOT NULL, parent_until INTEGER NOT NULL DEFAULT 0
  ) STRICT;`)
  let hashing = 0
  async function calculate(value: string, salt: string) {
    if (hashing >= 4) throw new SecurityError(429, 'BUSY', '验证繁忙，请稍后重试。')
    hashing++
    try {
      return ((await derive(value, salt, 64)) as Buffer).toString('hex')
    } finally {
      hashing--
    }
  }
  async function verify(userId: string, raw: unknown) {
    const input = parse(proof, raw)
    const user = db.prepare('SELECT id,salt,password_hash FROM users WHERE id=?').get(userId) as
      User | undefined
    if (!user) throw new SecurityError(401, 'SESSION_EXPIRED', '登录已失效，请重新登录。')
    const actual = await calculate(input.password, user.salt)
    const current = db.prepare('SELECT password_hash FROM users WHERE id=?').get(userId)
    if (
      !current ||
      current.password_hash !== user.password_hash ||
      !timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(user.password_hash, 'hex'))
    )
      throw new SecurityError(403, 'PASSWORD_INVALID', '密码不正确，请重新输入家长账号密码。')
    return user
  }
  function live(userId: string, tokenHash: string) {
    if (
      !db
        .prepare('SELECT 1 FROM sessions WHERE user_id=? AND token_hash=? AND expires>?')
        .get(userId, tokenHash, now())
    )
      throw new SecurityError(401, 'SESSION_EXPIRED', '登录已失效，请重新登录。')
  }
  function track(tokenHash: string, device: string) {
    db.prepare(
      'INSERT INTO session_details(token_hash,id,device,created_at,parent_until) VALUES(?,?,?,?,0)',
    ).run(tokenHash, randomUUID(), device.slice(0, 200), new Date(now()).toISOString())
  }
  // Older authenticated sessions remain usable and get their own public identifier.
  for (const row of db
    .prepare(
      'SELECT token_hash FROM sessions WHERE token_hash NOT IN (SELECT token_hash FROM session_details)',
    )
    .all())
    track(String(row.token_hash), '升级前登录的设备')
  return {
    track,
    until(tokenHash: string) {
      return Number(
        db.prepare('SELECT parent_until FROM session_details WHERE token_hash=?').get(tokenHash)
          ?.parent_until ?? 0,
      )
    },
    unlocked(userId: string, tokenHash: string) {
      live(userId, tokenHash)
      return (
        Number(
          db.prepare('SELECT parent_until FROM session_details WHERE token_hash=?').get(tokenHash)
            ?.parent_until ?? 0,
        ) > now()
      )
    },
    async unlock(userId: string, tokenHash: string, input: unknown) {
      await verify(userId, input)
      live(userId, tokenHash)
      const until = now() + 15 * 60_000
      db.prepare('UPDATE session_details SET parent_until=? WHERE token_hash=?').run(
        until,
        tokenHash,
      )
      return { unlocked: true, until }
    },
    lock(tokenHash: string) {
      db.prepare('UPDATE session_details SET parent_until=0 WHERE token_hash=?').run(tokenHash)
    },
    status(userId: string, tokenHash: string) {
      return {
        recoveryEnabled: Boolean(
          db.prepare('SELECT 1 FROM account_recovery WHERE user_id=?').get(userId),
        ),
        sessions: db
          .prepare(
            `SELECT d.id,d.device,d.created_at AS createdAt,s.expires,d.token_hash=? AS current
          FROM sessions s JOIN session_details d USING(token_hash) WHERE s.user_id=? AND s.expires>? ORDER BY d.created_at DESC`,
          )
          .all(tokenHash, userId, now())
          .map((row) => ({ ...row, current: Boolean(row.current) })),
      }
    },
    async recoveryCode(userId: string, tokenHash: string, input: unknown) {
      await verify(userId, input)
      live(userId, tokenHash)
      const raw = randomBytes(24).toString('hex').toUpperCase()
      db.prepare(
        'INSERT INTO account_recovery VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,created_at=excluded.created_at',
      ).run(userId, hash(raw), new Date(now()).toISOString())
      return { code: raw.match(/.{8}/g)!.join('-') }
    },
    async changePassword(userId: string, tokenHash: string, raw: unknown) {
      const input = parse(z.object({ password, newPassword: password }).strict(), raw)
      const user = await verify(userId, { password: input.password })
      const salt = randomBytes(16).toString('hex')
      const next = await calculate(input.newPassword, salt)
      live(userId, tokenHash)
      db.exec('BEGIN IMMEDIATE')
      try {
        const changed = db
          .prepare('UPDATE users SET salt=?,password_hash=? WHERE id=? AND password_hash=?')
          .run(salt, next, userId, user.password_hash)
        if (!changed.changes)
          throw new SecurityError(409, 'PASSWORD_CHANGED', '密码已更新，请重新登录。')
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId)
        db.prepare('DELETE FROM account_recovery WHERE user_id=?').run(userId)
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
    async revokeOthers(userId: string, tokenHash: string, input: unknown) {
      await verify(userId, input)
      live(userId, tokenHash)
      db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(userId, tokenHash)
    },
    async recover(raw: unknown) {
      const input = parse(
        z
          .object({
            username: z
              .string()
              .trim()
              .toLowerCase()
              .regex(/^[a-z0-9_]{4,32}$/),
            code: z.string().min(48).max(80),
            newPassword: password,
          })
          .strict(),
        raw,
      )
      const normalized = input.code.replace(/[-\s]/g, '').toUpperCase()
      const row = db
        .prepare(
          'SELECT u.id,r.code_hash FROM users u JOIN account_recovery r ON r.user_id=u.id WHERE u.username=?',
        )
        .get(input.username) as { id: string; code_hash: string } | undefined
      const digest = hash(normalized)
      if (!row || !timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(row.code_hash, 'hex')))
        throw new SecurityError(400, 'RECOVERY_INVALID', '账号或恢复码不正确，或恢复码已经使用。')
      const salt = randomBytes(16).toString('hex'),
        next = await calculate(input.newPassword, salt)
      db.exec('BEGIN IMMEDIATE')
      try {
        if (
          !db
            .prepare('DELETE FROM account_recovery WHERE user_id=? AND code_hash=?')
            .run(row.id, digest).changes
        )
          throw new SecurityError(400, 'RECOVERY_INVALID', '恢复码已失效，请使用最新保存的恢复码。')
        db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(salt, next, row.id)
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.id)
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
