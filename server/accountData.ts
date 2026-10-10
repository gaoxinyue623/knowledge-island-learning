import { createHash } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import {
  accountWriteSchema,
  canonicalSnapshot,
  type AccountCloud,
} from '../src/services/account/contract'
export class AccountDataError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
export function createAccountData(db: DatabaseSync, now = Date.now) {
  db.exec(`CREATE TABLE IF NOT EXISTS account_data (
    user_id TEXT PRIMARY KEY REFERENCES users(id), revision INTEGER NOT NULL,
    digest TEXT NOT NULL, snapshot TEXT NOT NULL, updated_at TEXT NOT NULL
  ) STRICT;`)
  function read(userId: string): AccountCloud | null {
    const row = db
      .prepare('SELECT revision,digest,snapshot,updated_at FROM account_data WHERE user_id=?')
      .get(userId) as
      { revision: number; digest: string; snapshot: string; updated_at: string } | undefined
    return row
      ? {
          revision: row.revision,
          digest: row.digest,
          snapshot: JSON.parse(row.snapshot),
          updatedAt: row.updated_at,
        }
      : null
  }
  return {
    read,
    write(userId: string, input: unknown): AccountCloud {
      const parsed = accountWriteSchema.safeParse(input)
      if (!parsed.success)
        throw new AccountDataError(
          400,
          'ACCOUNT_DATA_INVALID',
          '账号记录格式或容量不符合要求，本机数据已保留。',
        )
      const snapshot = canonicalSnapshot(parsed.data.snapshot)
      const digest = createHash('sha256').update(snapshot).digest('hex')
      db.exec('BEGIN IMMEDIATE')
      try {
        const previous = read(userId)
        // Retrying an acknowledged-but-lost response must not create a conflict.
        if (previous?.digest === digest) {
          db.exec('COMMIT')
          return previous
        }
        if ((previous?.revision ?? 0) !== parsed.data.expectedRevision)
          throw new AccountDataError(
            409,
            'ACCOUNT_REVISION_CONFLICT',
            '另一个设备更新了记录，请选择要保留的数据，系统不会自动覆盖。',
          )
        const revision = (previous?.revision ?? 0) + 1
        const updatedAt = new Date(now()).toISOString()
        db.prepare(
          `INSERT INTO account_data VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET
          revision=excluded.revision,digest=excluded.digest,snapshot=excluded.snapshot,updated_at=excluded.updated_at`,
        ).run(userId, revision, digest, snapshot, updatedAt)
        db.exec('COMMIT')
        return { revision, digest, updatedAt, snapshot: JSON.parse(snapshot) }
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
