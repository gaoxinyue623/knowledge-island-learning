import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { DatabaseSync } from 'node:sqlite'
import { z } from 'zod'
import { PetDataError, validatePetAccount, summarizePet } from '../src/services/pet/petPolicy'
import { extendsPetHistory } from '../src/services/pet/petBackup'
const derive = promisify(scrypt)
const credentials = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]{4,32}$/),
    password: z.string().min(10).max(128),
  })
  .strict()
const backupInput = z
  .object({
    profileId: z.string().min(1).max(200),
    label: z.string().trim().min(1).max(40),
    revision: z.number().int().min(0),
    account: z.unknown(),
  })
  .strict()
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}
const hash = (token: string) => createHash('sha256').update(token).digest('hex')
const sessionAge = 7 * 24 * 3600
export function createPetServer(options: {
  databasePath: string
  origins: string[]
  secureCookies?: boolean
  now?: () => number
}) {
  const db = new DatabaseSync(options.databasePath)
  const version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
  if (version > 1) {
    db.close()
    throw new Error('后端数据库版本较新，已停止启动并保留数据。')
  }
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS pet_backups (user_id TEXT NOT NULL REFERENCES users(id), profile_id TEXT NOT NULL, label TEXT NOT NULL, revision INTEGER NOT NULL, account TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id, profile_id)) STRICT; PRAGMA user_version = 1;`)
  const now = options.now ?? Date.now
  const limits = new Map<string, { count: number; until: number }>()
  let hashing = 0
  function limit(key: string, maximum = 15) {
    for (const [k, v] of limits) if (v.until <= now()) limits.delete(k)
    const item = limits.get(key) ?? { count: 0, until: now() + 60_000 }
    item.count++
    limits.set(key, item)
    if (item.count > maximum || limits.size > 10000)
      throw new HttpError(429, '操作过于频繁，请稍后再试。')
  }
  function send(res: ServerResponse, status: number, data: unknown) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    res.end(JSON.stringify(data))
  }
  async function body(req: IncomingMessage) {
    if (!req.headers['content-type']?.startsWith('application/json'))
      throw new HttpError(415, '请求需要使用 JSON。')
    let size = 0
    const chunks: Buffer[] = []
    for await (const part of req) {
      size += part.length
      if (size > 4 * 1024 * 1024) throw new HttpError(413, '备份过大，本机记录仍保留。')
      chunks.push(part)
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
    } catch {
      throw new HttpError(400, '请求格式无法识别。')
    }
  }
  function cookie(req: IncomingMessage) {
    return (
      req.headers.cookie
        ?.split(';')
        .map((p) => p.trim())
        .find((p) => p.startsWith('ki_session='))
        ?.slice(11) ?? ''
    )
  }
  function currentUser(req: IncomingMessage) {
    return db
      .prepare(
        'SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires > ?',
      )
      .get(hash(cookie(req)), now()) as { id: string; username: string } | undefined
  }
  function issueSession(req: IncomingMessage, res: ServerResponse, userId: string) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ? OR expires <= ?').run(
      hash(cookie(req)),
      now(),
    )
    const token = randomBytes(32).toString('base64url')
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(
      hash(token),
      userId,
      now() + sessionAge * 1000,
    )
    res.setHeader(
      'Set-Cookie',
      `ki_session=${token}; HttpOnly; SameSite=Strict; Path=/api/pet; Max-Age=${sessionAge}${options.secureCookies ? '; Secure' : ''}`,
    )
  }
  async function handle(req: IncomingMessage, res: ServerResponse) {
    try {
      const path = new URL(req.url ?? '/', 'http://localhost').pathname
      if (!path.startsWith('/api/pet/')) throw new HttpError(404, '接口不存在。')
      const origin = req.headers.origin
      // No CORS credentials: the frontend and API must share a public origin.
      if (origin && !options.origins.includes(origin))
        throw new HttpError(403, '请求来源不受支持。')
      if (req.method !== 'GET' && (!origin || req.headers['x-knowledge-island'] !== 'pet-v2'))
        throw new HttpError(403, '请从知识岛页面操作。')
      if (path === '/api/pet/health' && req.method === 'GET') return send(res, 200, { ok: true })
      if (path === '/api/pet/register' || path === '/api/pet/login') {
        if (req.method !== 'POST') throw new HttpError(405, '请求方法不受支持。')
        limit(`auth:${req.socket.remoteAddress ?? 'unknown'}`)
        const input = credentials.safeParse(await body(req))
        if (!input.success)
          throw new HttpError(
            400,
            '账号使用 4～32 位小写字母、数字或下划线，密码为 10～128 个字符。',
          )
        if (hashing >= 4) throw new HttpError(429, '登录繁忙，请稍后重试。')
        hashing++
        try {
          const existing = db
            .prepare('SELECT * FROM users WHERE username = ?')
            .get(input.data.username) as
            { id: string; username: string; salt: string; password_hash: string } | undefined
          const salt = existing?.salt ?? randomBytes(16).toString('hex')
          const passwordHash = (await derive(input.data.password, salt, 64)) as Buffer
          let userId: string
          if (path.endsWith('/register')) {
            if (
              existing ||
              db.prepare('SELECT id FROM users WHERE username = ?').get(input.data.username)
            )
              throw new HttpError(409, '这个账号暂不可用，请换一个或登录。')
            userId = randomUUID()
            db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(
              userId,
              input.data.username,
              salt,
              passwordHash.toString('hex'),
            )
          } else {
            if (
              !existing ||
              !timingSafeEqual(passwordHash, Buffer.from(existing.password_hash, 'hex'))
            )
              throw new HttpError(401, '账号或密码不正确。')
            userId = existing.id
          }
          issueSession(req, res, userId)
          return send(res, 200, { username: input.data.username })
        } finally {
          hashing--
        }
      }
      const user = currentUser(req)
      if (path === '/api/pet/session' && req.method === 'GET')
        return send(res, 200, { username: user?.username ?? null })
      if (!user) throw new HttpError(401, '请先登录家长账号。')
      if (req.headers['x-pet-account'] !== user.username)
        throw new HttpError(409, '登录账号已变化，请重新登录后再操作。', 'SESSION_CHANGED')
      limit(`user:${user.id}`, 120)
      if (path === '/api/pet/logout' && req.method === 'POST') {
        db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash(cookie(req)))
        res.setHeader(
          'Set-Cookie',
          `ki_session=; HttpOnly; SameSite=Strict; Path=/api/pet; Max-Age=0${options.secureCookies ? '; Secure' : ''}`,
        )
        return send(res, 200, { ok: true })
      }
      if (path === '/api/pet/backups' && req.method === 'GET') {
        const rows = db
          .prepare(
            'SELECT profile_id, label, revision, updated_at FROM pet_backups WHERE user_id = ? ORDER BY updated_at DESC',
          )
          .all(user.id)
        return send(res, 200, {
          backups: rows.map((r) => ({
            profileId: r.profile_id,
            label: r.label,
            revision: r.revision,
            updatedAt: r.updated_at,
          })),
        })
      }
      if (path === '/api/pet/backup' && req.method === 'GET') {
        const profileId = new URL(req.url!, 'http://localhost').searchParams.get('profileId') ?? ''
        const row = db
          .prepare('SELECT * FROM pet_backups WHERE user_id = ? AND profile_id = ?')
          .get(user.id, profileId)
        if (!row) throw new HttpError(404, '尚无这份备份。')
        const account = validatePetAccount(JSON.parse(String(row.account)), profileId)
        return send(res, 200, {
          profileId,
          label: row.label,
          revision: row.revision,
          updatedAt: row.updated_at,
          account,
        })
      }
      if (path === '/api/pet/backup' && req.method === 'PUT') {
        const input = backupInput.safeParse(await body(req))
        if (!input.success) throw new HttpError(400, '备份格式无法识别。')
        const { profileId, label, revision } = input.data
        const account = validatePetAccount(input.data.account, profileId)
        if (!summarizePet(account).name) throw new HttpError(400, '先领养伙伴，再备份小屋。')
        db.exec('BEGIN IMMEDIATE')
        try {
          const current = db
            .prepare(
              'SELECT revision, account FROM pet_backups WHERE user_id = ? AND profile_id = ?',
            )
            .get(user.id, profileId)
          if (current && JSON.stringify(account) === String(current.account)) {
            db.exec('COMMIT')
            return send(res, 200, { revision: current.revision })
          }
          if (Number(current?.revision ?? 0) !== revision)
            throw new HttpError(409, '云端已有更新，请刷新备份后再试。双方记录均保留。')
          if (
            current &&
            !extendsPetHistory(
              validatePetAccount(JSON.parse(String(current.account)), profileId),
              account,
            )
          )
            throw new HttpError(
              409,
              '本机与云端记录不同，不能覆盖。请恢复较新的备份，或另存为独立备份。',
            )
          if (
            !current &&
            Number(
              db
                .prepare('SELECT COUNT(*) AS count FROM pet_backups WHERE user_id = ?')
                .get(user.id)!.count,
            ) >= 20
          )
            throw new HttpError(400, '此账号已有 20 份备份，请更新已有备份。')
          db.prepare(
            'INSERT INTO pet_backups VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, profile_id) DO UPDATE SET label = excluded.label, revision = excluded.revision, account = excluded.account, updated_at = excluded.updated_at',
          ).run(
            user.id,
            profileId,
            label,
            revision + 1,
            JSON.stringify(account),
            new Date(now()).toISOString(),
          )
          db.exec('COMMIT')
          return send(res, 200, { revision: revision + 1 })
        } catch (error) {
          db.exec('ROLLBACK')
          throw error
        }
      }
      throw new HttpError(404, '接口不存在。')
    } catch (error) {
      send(
        res,
        error instanceof HttpError ? error.status : error instanceof PetDataError ? 400 : 500,
        {
          ...(error instanceof HttpError && error.code ? { code: error.code } : {}),
          error:
            error instanceof HttpError || error instanceof PetDataError
              ? error.message
              : '服务暂时不可用，原记录已保留，请稍后重试。',
        },
      )
    }
  }
  const server = createServer((req, res) => {
    void handle(req, res)
  })
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  return {
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          db.close()
          if (error) reject(error)
          else resolve()
        })
        server.closeIdleConnections()
      }),
  }
}
