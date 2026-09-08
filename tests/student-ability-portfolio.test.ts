import { describe, expect, it } from 'vitest'
import { projectAbilityPortfolio } from '@/services/ability-portfolio/abilityPortfolio'
import type { SpacedReviewEvidence } from '@/services/student-growth/spacedReview'
import type { LearningHistoryRecord } from '@/types'

const evidence = (id: string, at: string, assisted = false): SpacedReviewEvidence => ({
  attemptId: id, profileId: 'student-a', questId: 'quest-a', contentRevision: 'r1',
  courseHref: '/knowledge-point/kp?textbookId=G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE&unitId=G1_SHENZHEN_MATH_S1_UNIT_01&lessonId=G1_SHENZHEN_MATH_S1_LESSON_01&knowledgePointId=kp#knowledge-challenges',
  title: '十以内数', subject: 'MATH', completedAt: at,
  stages: [{ stageId: 's', prompt: '数一数', firstAttempt: assisted ? 'hint_used' : 'independent', usedHint: assisted, hadIncorrectAnswer: false }],
})

describe('ability portfolio projection', () => {
  it('does not promote old learning history beyond practiced', () => {
    const items = projectAbilityPortfolio({ profileId: 'student-a', evidence: [], currentRevisionByQuest: {}, history: [{ id: 'h', profileId: 'student-a', type: 'lesson_completed', textbookId: 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE', unitId: 'G1_SHENZHEN_MATH_S1_UNIT_01', lessonId: 'G1_SHENZHEN_MATH_S1_LESSON_01', knowledgePointId: 'G1_SHENZHEN_MATH_S1_KP_01', sourceId: 'x', occurredAt: '2026-09-01T00:00:00.000Z', provenance: { isSampleDerived: false } }] })
    expect(items[0]).toMatchObject({ status: 'practiced', subject: 'MATH' })
    expect(items[0]).toMatchObject({ usedHint: null, hadIncorrectAnswer: null })
    expect(items[0]?.title).not.toContain('G1_SHENZHEN')
  })
  it('requires three due independent rounds and demotes assisted evidence', () => {
    const base = { profileId: 'student-a', currentRevisionByQuest: { 'quest-a': 'r1' }, history: [] }
    expect(projectAbilityPortfolio({ ...base, evidence: [evidence('1', '2026-09-01T00:00:00.000Z'), evidence('2', '2026-09-02T00:00:00.000Z'), evidence('3', '2026-09-05T00:00:00.000Z')], now: new Date('2026-09-12T00:00:00.000Z') })[0]?.status).toBe('mastered')
    expect(projectAbilityPortfolio({ ...base, evidence: [evidence('1', '2026-09-01T00:00:00.000Z'), evidence('2', '2026-09-02T00:00:00.000Z', true)], now: new Date('2026-09-04T00:00:00.000Z') })[0]?.status).toBe('consolidating')
  })
  it('fails closed for a changed revision and keeps profiles isolated', () => {
    expect(projectAbilityPortfolio({ profileId: 'student-b', evidence: [evidence('1', '2026-09-01T00:00:00.000Z')], history: [], currentRevisionByQuest: { 'quest-a': 'r1' } })).toEqual([])
    expect(projectAbilityPortfolio({ profileId: 'student-a', evidence: [evidence('1', '2026-09-01T00:00:00.000Z')], history: [], currentRevisionByQuest: { 'quest-a': 'r2' } })).toEqual([])
  })
  it('never attaches another child history or unfinished sessions to evidence', () => {
    const history: LearningHistoryRecord = { id: 'h', profileId: 'student-b', type: 'lesson_completed', textbookId: 'book', unitId: 'unit', lessonId: 'lesson', knowledgePointId: 'kp', sourceId: 'source', occurredAt: '2026-09-01T00:00:00.000Z', provenance: { isSampleDerived: false } }
    const item = projectAbilityPortfolio({ profileId: 'student-a', evidence: [evidence('1', history.occurredAt)], currentRevisionByQuest: { 'quest-a': 'r1' }, history: [history, { ...history, profileId: 'student-a', type: 'lesson_started' }] })[0]
    expect(item?.history).toEqual([])
    expect(item?.status).toBe('consolidating')
    expect(item?.completedIndependentRounds).toBe(1)
  })
})
