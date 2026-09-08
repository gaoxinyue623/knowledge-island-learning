import { z } from 'zod'

/**
 * Product pacing rule, not a claim about how memory works for every learner.
 * One independent round earns the next check after 1 day, then 3 and 7 days.
 */
export const SPACED_REVIEW_DELAYS_DAYS = [1, 3, 7] as const
export const SPACED_REVIEW_STORAGE_PREFIX = 'knowledge-island.spaced-review.v1:'

export interface SpacedReviewStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const stageSchema = z
  .object({
    stageId: z.string().min(1),
    prompt: z.string().min(1).max(2000),
    firstAttempt: z.enum(['independent', 'incorrect', 'hint_used']),
    usedHint: z.boolean().default(false),
    hadIncorrectAnswer: z.boolean().default(false),
  })
  .strict()
const evidenceSchema = z
  .object({
    attemptId: z.string().min(1),
    profileId: z.string().min(1),
    questId: z.string().min(1),
    contentRevision: z.string().min(1),
    courseHref: z.string().min(1),
    title: z.string().min(1),
    subject: z.enum(['CHINESE', 'MATH', 'ENGLISH']),
    completedAt: z.string().datetime(),
    stages: z.array(stageSchema).min(1).max(100),
  })
  .strict()
const payloadSchema = z
  .object({ schemaVersion: z.literal(1), attempts: z.array(evidenceSchema).max(1000) })
  .strict()

export type SpacedReviewEvidence = z.infer<typeof evidenceSchema>
export interface SpacedReviewDue {
  questId: string
  contentRevision: string
  courseHref: string
  title: string
  subject: SpacedReviewEvidence['subject']
  nextDueAt: string
  completedIndependentRounds: number
}
export const spacedReviewEvidenceSchema = evidenceSchema
export const spacedReviewPayloadSchema = payloadSchema

function key(profileId: string): string {
  return SPACED_REVIEW_STORAGE_PREFIX + encodeURIComponent(profileId)
}

function dayKey(value: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const field = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value
  return `${field('year')}-${field('month')}-${field('day')}`
}

function isIndependent(attempt: SpacedReviewEvidence): boolean {
  return attempt.stages.every(
    (stage) =>
      stage.firstAttempt === 'independent' && !stage.usedHint && !stage.hadIncorrectAnswer,
  )
}

function addDays(occurredAt: string, days: number): string {
  const value = new Date(occurredAt)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString()
}

/** Keeps review links inside the application's existing knowledge-point surface. */
export function createReviewLaunchHref(courseHref: string, attemptId: string): string | null {
  if (!attemptId || !/^\/knowledge-point\/[^/?#]+(?:\?[^#]*)?(?:#knowledge-challenges)?$/.test(courseHref))
    return null
  try {
    const url = new URL(courseHref, 'https://knowledge-island.local')
    if (url.origin !== 'https://knowledge-island.local' || !url.pathname.startsWith('/knowledge-point/'))
      return null
    url.searchParams.set('reviewAttempt', attemptId)
    url.hash = 'knowledge-challenges'
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

export function createSpacedReviewService(storage: SpacedReviewStorage | undefined) {
  let lastWarning: string | null = null

  function load(profileId: string): SpacedReviewEvidence[] | null {
    lastWarning = null
    try {
      if (!storage) throw new Error('Storage unavailable')
      const raw = storage.getItem(key(profileId))
      if (!raw) return []
      const payload = payloadSchema.parse(JSON.parse(raw))
      if (payload.attempts.some((attempt) => attempt.profileId !== profileId)) throw new Error('Scope')
      return payload.attempts
    } catch {
      lastWarning = '间隔复习记录暂时无法读取，原记录已保留，本次不会据此安排复习。'
      return null
    }
  }

  function record(input: SpacedReviewEvidence): boolean {
    const evidence = evidenceSchema.safeParse(input)
    const stagesValid = evidence.success && new Set(evidence.data.stages.map((stage) => stage.stageId)).size === evidence.data.stages.length && evidence.data.stages.every((stage) =>
      stage.firstAttempt === 'independent'
        ? !stage.usedHint && !stage.hadIncorrectAnswer
        : stage.firstAttempt === 'hint_used'
          ? stage.usedHint && !stage.hadIncorrectAnswer
          : stage.hadIncorrectAnswer,
    )
    if (!evidence.success || !stagesValid || !createReviewLaunchHref(input.courseHref, 'check')) {
      lastWarning = '本次复习证据格式无效，未写入记录。'
      return false
    }
    const records = load(evidence.data.profileId)
    if (!records) return false
    if (records.some((record) => record.attemptId === evidence.data.attemptId)) return true
    if (records.length >= 1000) {
      lastWarning = '间隔复习记录已达到本设备容量上限，原记录已保留，本次未写入。'
      return false
    }
    try {
      storage!.setItem(
        key(evidence.data.profileId),
        JSON.stringify({ schemaVersion: 1, attempts: [...records, evidence.data] }),
      )
      lastWarning = null
      return true
    } catch {
      lastWarning = '间隔复习记录暂时无法保存，本次练习仍可继续。'
      return false
    }
  }

  function listEvidence(profileId: string): SpacedReviewEvidence[] {
    return (load(profileId) ?? []).map((record) => ({
      ...record,
      stages: record.stages.map((stage) => ({ ...stage })),
    }))
  }

  function listDue(
    profileId: string,
    now = new Date(),
    revisionByQuest: Readonly<Record<string, string | null>> = {},
  ): SpacedReviewDue[] {
    const records = load(profileId)
    if (!records) return []
    const latestRevisionByQuest = new Map<string, string>()
    for (const record of [...records].sort((left, right) => left.completedAt.localeCompare(right.completedAt)))
      latestRevisionByQuest.set(record.questId, record.contentRevision)
    const groups = new Map<string, SpacedReviewEvidence[]>()
    for (const record of records) {
      const requestedRevision = revisionByQuest[record.questId]
      if (requestedRevision === null) continue
      const expectedRevision = requestedRevision ?? latestRevisionByQuest.get(record.questId)
      if (record.contentRevision !== expectedRevision) continue
      const groupKey = `${record.questId}:${record.contentRevision}`
      groups.set(groupKey, [...(groups.get(groupKey) ?? []), record])
    }
    const due: SpacedReviewDue[] = []
    for (const attempts of groups.values()) {
      const days = new Map<string, SpacedReviewEvidence[]>()
      for (const attempt of [...attempts].sort((left, right) => left.completedAt.localeCompare(right.completedAt)))
        days.set(dayKey(attempt.completedAt), [...(days.get(dayKey(attempt.completedAt)) ?? []), attempt])
      let independentLevel = 0
      let nextDueAt: string | null = null
      let last: SpacedReviewEvidence | null = null
      for (const dayAttempts of days.values()) {
        const completion = dayAttempts[dayAttempts.length - 1]!
        const independentlyCompleted = dayAttempts.every(isIndependent)
        last = completion
        if (!independentlyCompleted) {
          independentLevel = 0
          nextDueAt = addDays(completion.completedAt, SPACED_REVIEW_DELAYS_DAYS[0])
          continue
        }
        if (nextDueAt && new Date(completion.completedAt) < new Date(nextDueAt)) continue
        independentLevel = Math.min(independentLevel + 1, SPACED_REVIEW_DELAYS_DAYS.length)
        nextDueAt = addDays(
          completion.completedAt,
          SPACED_REVIEW_DELAYS_DAYS[independentLevel - 1]!,
        )
      }
      if (!last || !nextDueAt) continue
      if (new Date(nextDueAt) > now) continue
      due.push({
        questId: last.questId,
        contentRevision: last.contentRevision,
        courseHref: last.courseHref,
        title: last.title,
        subject: last.subject,
        nextDueAt,
        completedIndependentRounds: independentLevel,
      })
    }
    return due.sort((left, right) => left.nextDueAt.localeCompare(right.nextDueAt))
  }

  return { record, listEvidence, listDue, getLastWarning: () => lastWarning }
}

function browserStorage(): SpacedReviewStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export const spacedReviewService = createSpacedReviewService(browserStorage())
