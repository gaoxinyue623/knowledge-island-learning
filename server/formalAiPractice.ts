import { reviewedAiSources } from '../src/services/formal-ai/reviewedSources'
import type { QuestionAnswerDraft } from '../src/types'
import {
  correctAnswerText,
  isQuestionAnswerComplete,
  validateQuestionAnswer,
} from '../src/services/question-engine/answerValidator'
import type { AiLearningSignal } from '../src/services/formal-ai/signals'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import {
  aiAnswerSchema,
  aiContextSchema,
  aiCreateSchema,
  type AiContext,
  type AiSession,
} from '../src/services/formal-ai/contract'
import {
  FormalAiError,
  resolveAiTopic,
  type FormalGenerator,
  type GeneratedArithmeticBatch,
} from './llm/formalGeneration'

interface Row {
  id: string
  user_id: string
  profile_id: string
  textbook_id: string
  knowledge_point_id: string
  request_id: string
  state: 'pending' | 'ready' | 'failed'
  batch: string | null
  answers: string
  reviews: string
  difficulty: number | null
  created_at: number
}
interface Answer {
  questionId: string
  answer: number | string | string[]
  at?: string
  correct?: boolean
}
export function createFormalAiPractice(
  db: DatabaseSync,
  generate: FormalGenerator,
  now = Date.now,
) {
  db.exec(`CREATE TABLE IF NOT EXISTS ai_practice_sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), profile_id TEXT NOT NULL,
    textbook_id TEXT NOT NULL, knowledge_point_id TEXT NOT NULL, request_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('pending','ready','failed')), batch TEXT, answers TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(user_id, request_id)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS ai_practice_created ON ai_practice_sessions(created_at);
  CREATE INDEX IF NOT EXISTS ai_practice_owner_time ON ai_practice_sessions(user_id, created_at);
  CREATE INDEX IF NOT EXISTS ai_practice_context ON ai_practice_sessions(user_id, profile_id, textbook_id, knowledge_point_id, created_at);`)
  if (
    !db
      .prepare('PRAGMA table_info(ai_practice_sessions)')
      .all()
      .some((c) => c.name === 'reviews')
  )
    db.exec("ALTER TABLE ai_practice_sessions ADD COLUMN reviews TEXT NOT NULL DEFAULT '[]'")
  if (
    !db
      .prepare('PRAGMA table_info(ai_practice_sessions)')
      .all()
      .some((c) => c.name === 'difficulty')
  )
    db.exec('ALTER TABLE ai_practice_sessions ADD COLUMN difficulty REAL')
  let active = 0
  function publicSession(row: Row): AiSession {
    const batch = JSON.parse(row.batch!) as GeneratedArithmeticBatch
    const answers = JSON.parse(row.answers) as Answer[]
    const reviews = JSON.parse(row.reviews) as Answer[]
    return {
      id: row.id,
      profileId: row.profile_id,
      textbookId: row.textbook_id,
      knowledgePointId: row.knowledge_point_id,
      title: batch.title,
      source: batch.source,
      validation: batch.validation,
      model: batch.model,
      createdAt: new Date(row.created_at).toISOString(),
      completed: answers.length === batch.questions.length,
      questions: batch.questions.map((q) => {
        const a = answers.find((a) => a.questionId === q.id)
        const review = reviews.find((a) => a.questionId === q.id)
        return {
          id: q.id,
          stem: q.stem,
          ...(q.sourceQuestion
            ? {
                kind: q.sourceQuestion.questionType as
                  'singleChoice' | 'multipleChoice' | 'trueFalse' | 'fillBlank' | 'calculation',
                options:
                  q.sourceQuestion.questionType === 'trueFalse'
                    ? [
                        { value: 'true', label: '正确' },
                        { value: 'false', label: '错误' },
                      ]
                    : q.options,
                blankCount:
                  q.sourceQuestion.answerRule.ruleType === 'TEXT_BLANKS'
                    ? q.sourceQuestion.answerRule.blanks.length
                    : undefined,
              }
            : {}),
          ...(review
            ? {
                review: {
                  answer: review.answer,
                  correct: scoreAnswer(q, review.answer).correct,
                  at: review.at!,
                },
              }
            : {}),
          ...(a
            ? {
                feedback: {
                  answer: a.answer,
                  expected: scoreAnswer(q, a.answer).expected,
                  correct: scoreAnswer(q, a.answer).correct,
                  explanation: q.explanation,
                },
              }
            : {}),
        }
      }),
    }
  }
  function scoreAnswer(q: GeneratedArithmeticBatch['questions'][number], answer: Answer['answer']) {
    if (!q.sourceQuestion) {
      if (typeof answer !== 'number' || !Number.isInteger(answer))
        throw new FormalAiError(400, 'AI_ANSWER_INVALID', '请输入整数答案。')
      return { correct: answer === q.answer, expected: q.answer! }
    }
    const source = q.sourceQuestion
    let draft: QuestionAnswerDraft
    if (source.questionType === 'singleChoice' && typeof answer === 'string')
      draft = {
        type: 'singleChoice',
        optionId: source.options?.find((o) => o.optionKey === answer)?.id,
      }
    else if (
      source.questionType === 'multipleChoice' &&
      Array.isArray(answer) &&
      new Set(answer).size === answer.length &&
      answer.every((k) => source.options?.some((o) => o.optionKey === k))
    )
      draft = {
        type: 'multipleChoice',
        optionIds: answer.map((k) => source.options!.find((o) => o.optionKey === k)!.id),
      }
    else if (source.questionType === 'trueFalse' && (answer === 'true' || answer === 'false'))
      draft = { type: 'trueFalse', value: answer === 'true' }
    else if (
      source.questionType === 'fillBlank' &&
      (typeof answer === 'string' || Array.isArray(answer))
    )
      draft = { type: 'fillBlank', values: typeof answer === 'string' ? [answer] : answer }
    else if (source.questionType === 'calculation' && typeof answer === 'number')
      draft = { type: 'calculation', value: String(answer) }
    else throw new FormalAiError(400, 'AI_ANSWER_INVALID', '答案类型与题目不一致。')
    if (!isQuestionAnswerComplete(source, draft))
      throw new FormalAiError(400, 'AI_ANSWER_INVALID', '请先完成答案。')
    return {
      correct: validateQuestionAnswer(source, draft).status === 'correct',
      expected: correctAnswerText(source) ?? '请查看教材解析',
    }
  }
  function ready(row: Row) {
    if (row.state === 'pending')
      throw new FormalAiError(409, 'AI_PENDING', '题目仍在生成，请稍后重试；不会重复扣除出题次数。')
    if (row.state !== 'ready')
      throw new FormalAiError(502, 'AI_GENERATION_FAILED', '上次出题未完成，请重新出题。')
    return publicSession(row)
  }
  function expirePending() {
    db.prepare(
      "UPDATE ai_practice_sessions SET state='failed', updated_at=? WHERE state='pending' AND created_at<?",
    ).run(now(), now() - 120000)
  }
  return {
    get(userId: string, sessionId: string, profileId: string) {
      const row = db
        .prepare('SELECT * FROM ai_practice_sessions WHERE id=? AND user_id=? AND profile_id=?')
        .get(sessionId, userId, profileId) as unknown as Row | undefined
      if (!row)
        throw new FormalAiError(404, 'AI_SESSION_NOT_FOUND', '这组练习不存在或不属于当前档案。')
      return ready(row)
    },
    latest(userId: string, input: unknown) {
      const parsed = aiContextSchema.safeParse(input)
      if (!parsed.success) throw new FormalAiError(400, 'AI_INPUT_INVALID', '练习入口信息不完整。')
      const { profileId, textbookId, knowledgePointId } = parsed.data
      expirePending()
      const row = db
        .prepare(
          `SELECT * FROM ai_practice_sessions WHERE user_id=? AND profile_id=? AND textbook_id=? AND knowledge_point_id=? AND state='ready' ORDER BY created_at DESC, rowid DESC LIMIT 1`,
        )
        .get(userId, profileId, textbookId, knowledgePointId) as unknown as Row | undefined
      if (!row) return null
      // Keep historical snapshots accessible by ID, but do not resume retired textbook questions.
      const batch = JSON.parse(row.batch!) as GeneratedArithmeticBatch
      const sources = reviewedAiSources(textbookId, knowledgePointId)
      if (
        batch.questions.some(
          (q) =>
            q.sourceQuestion &&
            !sources.some(
              (source) =>
                source.id === q.sourceQuestion!.id &&
                source.questionVersion === q.sourceQuestion!.questionVersion &&
                source.sourceId === q.sourceQuestion!.sourceId,
            ),
        )
      )
        return null
      return publicSession(row)
    },
    async create(userId: string, input: unknown) {
      const parsed = aiCreateSchema.safeParse(input)
      if (!parsed.success) throw new FormalAiError(400, 'AI_INPUT_INVALID', '出题请求格式不正确。')
      const { requestId, profileId, textbookId, knowledgePointId } = parsed.data
      resolveAiTopic(parsed.data)
      expirePending()
      const previous = db
        .prepare('SELECT * FROM ai_practice_sessions WHERE user_id=? AND request_id=?')
        .get(userId, requestId) as unknown as Row | undefined
      if (previous) {
        if (
          previous.profile_id !== profileId ||
          previous.textbook_id !== textbookId ||
          previous.knowledge_point_id !== knowledgePointId ||
          previous.difficulty !== (parsed.data.difficulty ?? null)
        )
          throw new FormalAiError(
            409,
            'AI_REQUEST_CONFLICT',
            '出题请求与原练习不一致，请重新进入。',
          )
        return ready(previous)
      }
      // Reservations count even if generation fails, and survive process restarts.
      const recent = db
        .prepare(
          'SELECT created_at, state FROM ai_practice_sessions WHERE user_id=? AND created_at>?',
        )
        .all(userId, now() - 86400000) as Array<{ created_at: number; state: string }>
      if (active >= 2 || recent.some((r) => r.state === 'pending'))
        throw new FormalAiError(429, 'AI_BUSY', '正在生成另一组题，请稍后再试。')
      const globalDaily = db
        .prepare('SELECT COUNT(*) AS total FROM ai_practice_sessions WHERE created_at>?')
        .get(now() - 86400000) as { total: number }
      if (globalDaily.total >= 300)
        throw new FormalAiError(
          429,
          'AI_SERVICE_QUOTA',
          '今天的 AI 出题服务额度已用完，请先完成已有练习。',
        )
      if (recent.length >= 30 || recent.filter((r) => r.created_at > now() - 3600000).length >= 10)
        throw new FormalAiError(
          429,
          'AI_QUOTA',
          '本账号本小时或今天的 AI 出题次数已用完，请先完成已有练习。',
        )
      const id = randomUUID(),
        timestamp = now()
      db.prepare(
        `INSERT INTO ai_practice_sessions(id,user_id,profile_id,textbook_id,knowledge_point_id,request_id,state,created_at,updated_at,difficulty) VALUES(?,?,?,?,?,?,'pending',?,?,?)`,
      ).run(
        id,
        userId,
        profileId,
        textbookId,
        knowledgePointId,
        requestId,
        timestamp,
        timestamp,
        parsed.data.difficulty ?? null,
      )
      active++
      try {
        const context: AiContext & { difficulty?: number } = {
          profileId,
          textbookId,
          knowledgePointId,
          ...(parsed.data.difficulty === undefined ? {} : { difficulty: parsed.data.difficulty }),
        }
        const batch = await generate(context)
        db.prepare(
          "UPDATE ai_practice_sessions SET state='ready',batch=?,updated_at=? WHERE id=?",
        ).run(JSON.stringify(batch), now(), id)
        return ready(
          db.prepare('SELECT * FROM ai_practice_sessions WHERE id=?').get(id) as unknown as Row,
        )
      } catch (error) {
        db.prepare("UPDATE ai_practice_sessions SET state='failed',updated_at=? WHERE id=?").run(
          now(),
          id,
        )
        if (error instanceof FormalAiError) throw error
        throw new FormalAiError(
          502,
          'AI_GENERATION_FAILED',
          'AI 出题暂时没有完成，请稍后重试，或继续已审核练习。',
        )
      } finally {
        active--
      }
    },
    learning(userId: string, input: unknown): AiLearningSignal[] {
      const parsed = z
        .object({
          profileId: aiContextSchema.shape.profileId,
          textbookId: aiContextSchema.shape.textbookId.optional(),
        })
        .strict()
        .safeParse(input)
      if (!parsed.success) throw new FormalAiError(400, 'AI_INPUT_INVALID', '学习档案信息不完整。')
      const rows = db
        .prepare(
          "SELECT * FROM ai_practice_sessions WHERE user_id=? AND profile_id=? AND state='ready' AND (? IS NULL OR textbook_id=?) ORDER BY created_at DESC LIMIT 200",
        )
        .all(
          userId,
          parsed.data.profileId,
          parsed.data.textbookId ?? null,
          parsed.data.textbookId ?? null,
        ) as unknown as Row[]
      return rows
        .flatMap((row) => {
          const batch = JSON.parse(row.batch!) as GeneratedArithmeticBatch,
            answers = JSON.parse(row.answers) as Answer[],
            reviews = JSON.parse(row.reviews) as Answer[]
          return answers.flatMap((a) => {
            const q = batch.questions.find((q) => q.id === a.questionId)!
            const review = reviews.find((r) => r.questionId === a.questionId)
            return [a, ...(review ? [review] : [])].map((attempt, i) => ({
              id: `ai:${row.id}:${q.id}:${i}`,
              sessionId: row.id,
              questionId: q.id,
              profileId: row.profile_id,
              textbookId: row.textbook_id,
              knowledgePointId: row.knowledge_point_id,
              correct: scoreAnswer(q, attempt.answer).correct,
              occurredAt: attempt.at ?? new Date(row.created_at).toISOString(),
              difficulty: q.difficulty ?? 3,
              stem: q.stem,
              answer: Array.isArray(attempt.answer)
                ? attempt.answer.join('、')
                : String(attempt.answer),
              expected: String(scoreAnswer(q, attempt.answer).expected),
              explanation: q.explanation,
              resolved:
                scoreAnswer(q, a.answer).correct ||
                Boolean(review && scoreAnswer(q, review.answer).correct),
            }))
          })
        })
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
    },
    answer(userId: string, sessionId: string, input: unknown, reviewing = false) {
      const parsed = aiAnswerSchema
        .extend({ profileId: aiContextSchema.shape.profileId })
        .strict()
        .safeParse(input)
      if (!parsed.success)
        throw new FormalAiError(400, 'AI_ANSWER_INVALID', '请提交与题目匹配的有效答案。')
      // Synchronous transaction prevents simultaneous submissions overwriting each other.
      db.exec('BEGIN IMMEDIATE')
      try {
        const row = db
          .prepare('SELECT * FROM ai_practice_sessions WHERE id=? AND user_id=? AND profile_id=?')
          .get(sessionId, userId, parsed.data.profileId) as unknown as Row | undefined
        if (!row)
          throw new FormalAiError(404, 'AI_SESSION_NOT_FOUND', '这组练习不存在或不属于当前账号。')
        ready(row)
        const batch = JSON.parse(row.batch!) as GeneratedArithmeticBatch
        if (!batch.questions.some((q) => q.id === parsed.data.questionId))
          throw new FormalAiError(400, 'AI_QUESTION_INVALID', '题目与这组练习不匹配。')
        const answers = JSON.parse(reviewing ? row.reviews : row.answers) as Answer[]
        const q = batch.questions.find((q) => q.id === parsed.data.questionId)!
        const checked = scoreAnswer(q, parsed.data.answer)
        if (
          reviewing &&
          !(JSON.parse(row.answers) as Answer[]).some(
            (a) => a.questionId === q.id && !scoreAnswer(q, a.answer).correct,
          )
        )
          throw new FormalAiError(400, 'AI_REVIEW_INVALID', '只有已提交的错题可以在这里再练。')
        const previous = answers.find((a) => a.questionId === parsed.data.questionId)
        if (
          previous &&
          (!reviewing || scoreAnswer(q, previous.answer).correct) &&
          JSON.stringify(previous.answer) !== JSON.stringify(parsed.data.answer)
        )
          throw new FormalAiError(409, 'AI_ALREADY_ANSWERED', '这道题已经提交，请继续下一题。')
        if (!previous || (reviewing && !scoreAnswer(q, previous.answer).correct)) {
          const next = {
            questionId: parsed.data.questionId,
            answer: parsed.data.answer,
            at: new Date(now()).toISOString(),
            correct: checked.correct,
          }
          if (previous) answers.splice(answers.indexOf(previous), 1, next)
          else answers.push(next)
        }
        const column = reviewing ? 'reviews' : 'answers'
        row[column] = JSON.stringify(answers)
        db.prepare(`UPDATE ai_practice_sessions SET ${column}=?,updated_at=? WHERE id=?`).run(
          row[column],
          now(),
          row.id,
        )
        db.exec('COMMIT')
        return publicSession(row)
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
