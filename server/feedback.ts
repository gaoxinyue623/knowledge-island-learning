import type { DatabaseSync } from 'node:sqlite'
import { feedbackInput, feedbackUpdate, feedbackTicket } from '../src/services/feedback/contract'
import { SecurityError } from './accountSecurity'

export function createFeedback(db: DatabaseSync, now: () => number) {
  db.exec(`CREATE TABLE IF NOT EXISTS feedback_tickets (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id), category TEXT NOT NULL,
    message TEXT NOT NULL, page TEXT NOT NULL, content_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received', reply TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT REFERENCES users(id)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS feedback_owner ON feedback_tickets(user_id,sequence);`)
  const select =
    'SELECT sequence,id,category,message,page,content_id AS contentId,status,reply,created_at AS createdAt,updated_at AS updatedAt,revision FROM feedback_tickets'
  function ticket(id: string, userId: string) {
    return feedbackTicket.parse(db.prepare(`${select} WHERE id=? AND user_id=?`).get(id, userId))
  }
  return {
    list(userId: string) {
      return db
        .prepare(`${select} WHERE user_id=? ORDER BY sequence DESC LIMIT 100`)
        .all(userId)
        .map((row) => feedbackTicket.parse(row))
    },
    listAll(before: string | null) {
      if (before && !/^[1-9]\d{0,14}$/.test(before))
        throw new SecurityError(400, 'INVALID_CURSOR', '翻页位置无效。')
      return db
        .prepare(`${select} WHERE sequence<? ORDER BY sequence DESC LIMIT 50`)
        .all(before ? Number(before) : Number.MAX_SAFE_INTEGER)
        .map((row) => feedbackTicket.parse(row))
    },
    create(userId: string, raw: unknown) {
      const result = feedbackInput.safeParse(raw)
      if (!result.success)
        throw new SecurityError(
          400,
          'INVALID_FEEDBACK',
          '请选择反馈类型，填写 5～2000 字的问题描述。',
        )
      const input = result.data
      const previous = db.prepare('SELECT user_id FROM feedback_tickets WHERE id=?').get(input.id)
      if (previous) {
        if (previous.user_id !== userId)
          throw new SecurityError(409, 'FEEDBACK_CONFLICT', '提交标识已使用，请刷新后重试。')
        const saved = ticket(input.id, userId)
        if (
          saved.message !== input.message ||
          saved.category !== input.category ||
          saved.page !== input.page ||
          saved.contentId !== input.contentId
        )
          throw new SecurityError(
            409,
            'FEEDBACK_CONFLICT',
            '这份反馈已提交，请刷新列表查看；新增问题请重新提交。',
          )
        return saved
      }
      if (
        Number(
          db.prepare('SELECT COUNT(*) AS total FROM feedback_tickets WHERE user_id=?').get(userId)!
            .total,
        ) >= 100
      )
        throw new SecurityError(
          429,
          'FEEDBACK_LIMIT',
          '此账号已达到反馈数量上限，请先查看已有反馈。',
        )
      const date = new Date(now()).toISOString()
      db.prepare(
        'INSERT INTO feedback_tickets(id,user_id,category,message,page,content_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      ).run(
        input.id,
        userId,
        input.category,
        input.message,
        input.page,
        input.contentId,
        date,
        date,
      )
      return ticket(input.id, userId)
    },
    update(operatorId: string, raw: unknown) {
      const result = feedbackUpdate.safeParse(raw)
      if (!result.success) throw new SecurityError(400, 'INVALID_FEEDBACK', '请填写处理结果。')
      const input = result.data
      const owner = db.prepare('SELECT user_id FROM feedback_tickets WHERE id=?').get(input.id)
      if (!owner) throw new SecurityError(404, 'NOT_FOUND', '反馈不存在。')
      const changed = db
        .prepare(
          'UPDATE feedback_tickets SET status=?,reply=?,updated_at=?,updated_by=?,revision=revision+1 WHERE id=? AND revision=?',
        )
        .run(
          input.status,
          input.reply,
          new Date(now()).toISOString(),
          operatorId,
          input.id,
          input.revision,
        )
      if (!changed.changes)
        throw new SecurityError(409, 'FEEDBACK_CONFLICT', '其他管理员已更新，请刷新后重试。')
      return ticket(input.id, String(owner.user_id))
    },
  }
}
