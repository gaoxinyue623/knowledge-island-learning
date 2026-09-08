import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import {
  freshQuestProgress,
  saveQuestProgress,
} from '@/services/content-expansion/questProgressStorage'
import {
  SPACED_REVIEW_DELAYS_DAYS,
  createSpacedReviewService,
  createReviewLaunchHref,
  spacedReviewService,
} from '@/services/student-growth/spacedReview'
import type { ReadingPracticeQuest } from '@/types/reading-quest'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { lessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import { resolveCurrentQuestRevision } from '@/services/student-growth/currentQuestResolver'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const courseHref =
  '/knowledge-point/kp-1?textbookId=book-1&unitId=unit-1&lessonId=lesson-1&knowledgePointId=kp-1#knowledge-challenges'
const base = {
  profileId: 'student-a',
  questId: 'quest-1',
  contentRevision: 'revision-1',
  courseHref,
  title: '认识十以内的数',
  subject: 'MATH' as const,
  stages: [{ stageId: 'stage-1', prompt: '数一数有几个', firstAttempt: 'independent' as const }],
}

afterEach(() => vi.restoreAllMocks())

it('keeps a current course revision when practice and appendix blocks are present', async () => {
  const subject = productionCurriculumIndex.subjects.find((item) => item.code === 'CHINESE')!
  const textbook = productionCurriculumIndex.textbooks.find((book) => book.subjectId === subject.id)!
  const unit = productionCurriculumIndex.units.find((item) => item.textbookVersionId === textbook.id)!
  const lesson = productionCurriculumIndex.lessons.find((item) => item.unitId === unit.id)!
  const relation = productionCurriculumIndex.lessonKnowledgePointRelations.find((item) => item.lessonId === lesson.id)!
  const context = { textbookId: textbook.id, unitId: unit.id, lessonId: lesson.id, knowledgePointId: relation.knowledgePointId }
  const href = `/knowledge-point/${relation.knowledgePointId}?${new URLSearchParams(context)}`
  const baseline = await resolveCurrentQuestRevision(href)
  expect(baseline).not.toBeNull()
  const original = await lessonPlayerRepository.getLessonPlayerSource(context, 'profile')
  const source = original.source!
  const first = source.blocks[0]!
  vi.spyOn(lessonPlayerRepository, 'getLessonPlayerSource').mockResolvedValue({
    ...original,
    source: {
      ...source,
      blocks: [...source.blocks,
        { ...first, id: 'excluded-practice', stepType: 'practice', block: { type: 'TEXT', text: '不会进入课文的练习答案。' } },
        { ...first, id: 'excluded-appendix', block: { type: 'TEXT', text: '附录：不会进入课文的词语。' } },
      ],
    },
  })
  expect(await resolveCurrentQuestRevision(href)).toEqual(baseline)
})

const reviewQuest = {
  id: 'review-quest',
  subject: 'MATH',
  stages: [
    {
      id: 'review-stage',
      kind: 'question',
      title: '数一数',
      hint: '慢慢数。',
      explanation: '一共有三个。',
      question: {
        id: 'review-question',
        questionType: 'singleChoice',
        stem: [{ type: 'TEXT', text: '一共有几个？' }],
        options: [],
        answerRule: { ruleType: 'SINGLE_OPTION', correctOptionKey: 'A' },
      },
    },
  ],
} as unknown as ReadingPracticeQuest

const evidenceQuest = {
  ...reviewQuest,
  id: 'evidence-quest',
  textbookId: 'G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE',
  lessonId: 'G1_SHENZHEN_MATH_S1_LESSON_01',
  knowledgePointId: 'G1_SHENZHEN_MATH_S1_KP_01',
  stages: [
    {
      ...reviewQuest.stages[0],
      question: {
        ...reviewQuest.stages[0].question,
        questionType: 'calculation',
        answerRule: { ruleType: 'NUMERIC', value: 2, tolerance: 0 },
      },
    },
  ],
} as unknown as ReadingPracticeQuest

describe('spaced review evidence', () => {
  it('schedules independent evidence at the documented 1/3/7 day intervals', () => {
    const service = createSpacedReviewService(new MemoryStorage())
    service.record({ ...base, attemptId: 'one', completedAt: '2026-09-01T10:00:00.000Z' })
    expect(service.listDue('student-a', new Date('2026-09-02T09:59:59.999Z'))).toHaveLength(0)
    expect(service.listDue('student-a', new Date('2026-09-02T10:00:00.000Z'))[0]?.nextDueAt).toBe(
      '2026-09-02T10:00:00.000Z',
    )
    service.record({ ...base, attemptId: 'two', completedAt: '2026-09-02T10:00:00.000Z' })
    expect(service.listDue('student-a', new Date('2026-09-05T09:59:59.999Z'))).toHaveLength(0)
    expect(service.listDue('student-a', new Date('2026-09-05T10:00:00.000Z'))[0]?.nextDueAt).toBe(
      '2026-09-05T10:00:00.000Z',
    )
    service.record({ ...base, attemptId: 'three', completedAt: '2026-09-05T10:00:00.000Z' })
    expect(service.listDue('student-a', new Date('2026-09-12T10:00:00.000Z'))[0]?.nextDueAt).toBe(
      '2026-09-12T10:00:00.000Z',
    )
    expect(SPACED_REVIEW_DELAYS_DAYS).toEqual([1, 3, 7])
  })

  it('does not upgrade a round after a first error or hint, and ignores duplicate same-day rounds', () => {
    const service = createSpacedReviewService(new MemoryStorage())
    service.record({
      ...base,
      attemptId: 'assisted',
      completedAt: '2026-09-01T10:00:00.000Z',
      stages: [{ ...base.stages[0], firstAttempt: 'hint_used' }],
    })
    expect(service.listDue('student-a', new Date('2026-09-30T10:00:00.000Z'))).toHaveLength(0)
    service.record({ ...base, attemptId: 'one', completedAt: '2026-09-02T10:00:00.000Z' })
    service.record({ ...base, attemptId: 'same-day', completedAt: '2026-09-02T16:00:00.000Z' })
    expect(service.listDue('student-a', new Date('2026-09-03T16:00:00.000Z'))[0]?.completedIndependentRounds).toBe(1)
  })

  it('keeps profiles isolated and never carries a changed revision forward', () => {
    const service = createSpacedReviewService(new MemoryStorage())
    service.record({ ...base, attemptId: 'one', completedAt: '2026-09-01T10:00:00.000Z' })
    service.record({ ...base, profileId: 'student-b', attemptId: 'other', completedAt: '2026-09-01T10:00:00.000Z' })
    expect(service.listDue('student-b', new Date('2026-09-02T10:00:00.000Z'))).toHaveLength(1)
    expect(
      service.listDue('student-a', new Date('2026-09-02T10:00:00.000Z'), {
        'quest-1': 'revision-2',
      }),
    ).toHaveLength(0)
  })

  it('resets to a one-day check after assistance and only advances after the prior check was due', () => {
    const service = createSpacedReviewService(new MemoryStorage())
    service.record({ ...base, attemptId: 'one', completedAt: '2026-09-01T10:00:00.000Z' })
    service.record({ ...base, attemptId: 'early', completedAt: '2026-09-01T18:00:00.000Z' })
    expect(service.listDue('student-a', new Date('2026-09-02T10:00:00.000Z'))[0]?.completedIndependentRounds).toBe(1)
    service.record({
      ...base,
      attemptId: 'helped',
      completedAt: '2026-09-02T10:00:00.000Z',
      stages: [{ ...base.stages[0], firstAttempt: 'hint_used', usedHint: true }],
    })
    expect(service.listDue('student-a', new Date('2026-09-03T10:00:00.000Z'))[0]?.completedIndependentRounds).toBe(0)
  })

  it('fails closed for damaged records and storage failures', () => {
    const storage = new MemoryStorage()
    const service = createSpacedReviewService(storage)
    storage.setItem('knowledge-island.spaced-review.v1:student-a', '{bad')
    expect(service.listDue('student-a', new Date())).toEqual([])
    expect(service.getLastWarning()).toContain('无法读取')
    const broken = { getItem: () => null, setItem: () => { throw new Error('full') } }
    const unavailable = createSpacedReviewService(broken)
    expect(unavailable.record({ ...base, attemptId: 'cannot-save', completedAt: '2026-09-01T10:00:00.000Z' })).toBe(false)
    expect(unavailable.getLastWarning()).toContain('无法保存')
  })

  it('only launches an internal knowledge-point review and creates a new review attempt', () => {
    const href = createReviewLaunchHref(courseHref, 'attempt-1')
    expect(href).toContain('reviewAttempt=attempt-1')
    expect(href).toContain('#knowledge-challenges')
    expect(createReviewLaunchHref('https://example.test/steal', 'attempt-1')).toBeNull()
    expect(createReviewLaunchHref('/lesson?x=1', 'attempt-1')).toBeNull()
  })

  it('opens a new review attempt instead of the completed foundation summary', () => {
    const progress = freshQuestProgress('student-review', reviewQuest)
    progress.passedIds = ['review-stage']
    progress.completedStageIds = ['review-stage']
    progress.summaryVisible = true
    progress.completedAt = '2026-09-01T10:00:00.000Z'
    expect(saveQuestProgress(localStorage, progress, reviewQuest)).toBeNull()
    window.history.replaceState(
      {},
      '',
      '/knowledge-point/kp-1?reviewAttempt=attempt-1#knowledge-challenges',
    )
    const wrapper = mount(ReadingQuest, {
      props: { quest: reviewQuest, profileId: 'student-review', reviewAttemptId: 'attempt-1' },
    })
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.text()).not.toContain('这一轮，全部通过了')
    wrapper.unmount()
  })

  it('does not reuse a review progress slot when the attempt identity changes in place', async () => {
    const firstAttemptQuest = { ...reviewQuest, id: 'review-quest:review:first' }
    const progress = freshQuestProgress('student-review-switch', firstAttemptQuest)
    progress.passedIds = ['review-stage']
    progress.completedStageIds = ['review-stage']
    expect(saveQuestProgress(localStorage, progress, firstAttemptQuest)).toBeNull()
    const wrapper = mount(ReadingQuest, {
      props: { quest: reviewQuest, profileId: 'student-review-switch', reviewAttemptId: 'first' },
    })
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    await wrapper.setProps({ reviewAttemptId: 'second' })
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    wrapper.unmount()
  })

  it('records a newly completed current round once, with the catalog subject', async () => {
    const profileId = 'student-new-evidence'
    localStorage.removeItem(`knowledge-island.spaced-review.v1:${profileId}`)
    const wrapper = mount(ReadingQuest, { props: { quest: evidenceQuest, profileId } })
    await wrapper.find('input[inputmode="numeric"]').setValue('2')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('检查答案'))!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('查看闯关小结'))!
      .trigger('click')
    await flushPromises()
    expect(spacedReviewService.listEvidence(profileId)).toEqual([
      expect.objectContaining({ subject: 'MATH', questId: 'evidence-quest' }),
    ])
    wrapper.unmount()
  })

  it('does not turn an old completed summary into new evidence', async () => {
    const profileId = 'student-old-summary'
    localStorage.removeItem(`knowledge-island.spaced-review.v1:${profileId}`)
    const progress = freshQuestProgress(profileId, evidenceQuest)
    progress.passedIds = ['review-stage']
    progress.completedStageIds = ['review-stage']
    progress.summaryVisible = true
    progress.completedAt = '2026-09-01T10:00:00.000Z'
    expect(saveQuestProgress(localStorage, progress, evidenceQuest)).toBeNull()
    const wrapper = mount(ReadingQuest, { props: { quest: evidenceQuest, profileId } })
    await flushPromises()
    expect(spacedReviewService.listEvidence(profileId)).toEqual([])
    wrapper.unmount()
  })
})
