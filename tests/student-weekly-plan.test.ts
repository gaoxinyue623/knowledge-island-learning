import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import WeeklyPlanCard from '@/components/weekly-plan/WeeklyPlanCard.vue'
import { sameWeeklyTask } from '@/services/weekly-plan/weeklyPlanService'
import {
  buildWeeklyPlanId,
  createWeeklyPlanStorage,
  defaultWeeklyPlan,
  getLocalWeekStartDateKey,
  listWeeklyPlanCarryOvers,
  resolveWeeklyPlan,
  taskReferenceFrom,
  updateWeeklyPlanDay,
  type WeeklyPlanEvidenceReader,
} from '@/services/weekly-plan'
import type { DailyLearningPlan, DailyLearningTask, LearningHistoryRecord } from '@/types'

function memoryStorage(initial = new Map<string, string>()) {
  return {
    getItem: (key: string) => initial.get(key) ?? null,
    setItem: (key: string, value: string) => initial.set(key, value),
  }
}

function task(overrides: Partial<DailyLearningTask> = {}): DailyLearningTask {
  return {
    id: 'daily-task:STUDENT_A:2026-09-08:continue_learning:session-a',
    profileId: 'STUDENT_A',
    type: 'continue_learning',
    subject: 'MATH',
    textbookId: 'TEXTBOOK_A',
    knowledgePointId: 'KP_A',
    lessonId: 'LESSON_A',
    sourceId: 'session-a',
    title: '继续学习：认识数字',
    status: 'pending',
    priority: 1,
    action: {
      type: 'lesson',
      launchContext: {
        textbookId: 'TEXTBOOK_A',
        unitId: 'UNIT_A',
        lessonId: 'LESSON_A',
        knowledgePointId: 'KP_A',
      },
    },
    ...overrides,
  }
}

function plan(tasks: DailyLearningTask[]): DailyLearningPlan {
  return {
    id: 'daily-plan:STUDENT_A:2026-09-08',
    profileId: 'STUDENT_A',
    dateKey: '2026-09-08',
    textbookContextKey: 'MATH=TEXTBOOK_A',
    textbookIds: { CHINESE: null, MATH: 'TEXTBOOK_A', ENGLISH: null },
    dataset: 'profile',
    tasks,
    progress: { completed: 0, total: tasks.length, percentage: 0 },
    status: 'not_started',
    generatedAt: '2026-09-08T08:00:00.000Z',
    policyVersion: 'DAILY_PLAN_V1',
  }
}

function evidence(overrides: Partial<WeeklyPlanEvidenceReader> = {}): WeeklyPlanEvidenceReader {
  return {
    history: () => [],
    lessons: () => [],
    assessments: () => [],
    reviewQueue: () => [],
    wrongBook: () => [],
    warning: () => null,
    ...overrides,
  }
}

describe('student weekly plan', () => {
  // The component reads the current week; keep it aligned with these dated fixtures.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-08T08:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())
  it('does not complete review or wrong-question tasks from an unrelated lesson completion', () => {
    const history: LearningHistoryRecord = {
      id: 'history', profileId: 'STUDENT_A', type: 'lesson_completed', sourceId: 'different-session',
      textbookId: 'TEXTBOOK_A', unitId: 'UNIT_A', lessonId: 'LESSON_A', knowledgePointId: 'KP_A',
      occurredAt: '2026-09-08T10:00:00.000Z', provenance: { isSampleDerived: false },
    }
    for (const action of [
      { type: 'review_queue' as const, reviewQueueItemId: 'review-a' },
      { type: 'wrong_question' as const, wrongQuestionId: 'wrong-a' },
      { type: 'assessment' as const, launchContext: { textbookId: 'TEXTBOOK_A', unitId: 'UNIT_A', lessonId: 'LESSON_A', knowledgePointId: 'KP_A', source: 'lesson' as const } },
    ]) {
      const weekly = updateWeeklyPlanDay(defaultWeeklyPlan('STUDENT_A', '2026-09-07'), 1,
        { targetCount: 1, tasks: [task({ action })] }, new Date('2026-09-08T08:00:00Z'))
      const result = resolveWeeklyPlan(weekly, plan([]), evidence({ history: () => [history] }))
      expect(result.days[1]?.taskReferences[0]?.status).toBe('pending')
    }
  })

  it('reconciles a changed daily task ID without selecting the same learning task twice', async () => {
    const original = task()
    const wrapper = mount(WeeklyPlanCard, { props: { profileId: 'STUDENT_A', dailyPlan: plan([original]) } })
    await wrapper.get('input[value="1"]').setValue()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.setProps({ dailyPlan: plan([task({ id: 'refreshed-id' })]) })
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.findAll('.weekly-plan-card__selected li')).toHaveLength(1)
    await wrapper.get('input[type="checkbox"]').setValue(false)
    expect(wrapper.findAll('.weekly-plan-card__selected li')).toHaveLength(0)
    wrapper.unmount()
  })
  it('uses local calendar Mondays across a Sunday/Monday boundary', () => {
    expect(getLocalWeekStartDateKey(new Date(2026, 8, 6, 23, 59))).toBe('2026-08-31')
    expect(getLocalWeekStartDateKey(new Date(2026, 8, 7, 0, 1))).toBe('2026-09-07')
    expect(buildWeeklyPlanId('STUDENT_A', '2026-09-07')).toBe('weekly-plan:STUDENT_A:2026-09-07')
  })

  it('persists profile-isolated plans and permits intentional rest days', () => {
    const storage = createWeeklyPlanStorage(memoryStorage())
    const alice = defaultWeeklyPlan('ALICE', '2026-09-07', new Date('2026-09-07T09:00:00Z'))
    const bob = defaultWeeklyPlan('BOB', '2026-09-07', new Date('2026-09-07T09:00:00Z'))
    storage.save(alice)
    storage.save(bob)
    expect(storage.load('ALICE', '2026-09-07').value?.profileId).toBe('ALICE')
    expect(storage.load('BOB', '2026-09-07').value?.profileId).toBe('BOB')
    expect(alice.days.filter((day) => day.targetCount === 0)).not.toHaveLength(0)
  })

  it('preserves corrupt content and reports it instead of silently overwriting', () => {
    const values = new Map([['weekly', '{not-json']])
    const storage = createWeeklyPlanStorage(memoryStorage(values), 'weekly')
    const result = storage.load('STUDENT_A', '2026-09-07')
    expect(result.value).toBeNull()
    expect(result.warning).toContain('原有内容已保留')
    const saved = storage.save(defaultWeeklyPlan('STUDENT_A', '2026-09-07'))
    expect(saved.warning).toContain('原有内容已保留')
    expect(values.get('weekly')).toBe('{not-json')
  })

  it('reports a storage write failure explicitly', () => {
    const storage = createWeeklyPlanStorage({ getItem: () => null, setItem: () => { throw new Error('quota') } })
    expect(storage.save(defaultWeeklyPlan('STUDENT_A', '2026-09-07')).warning).toContain('无法保存')
  })

  it('refreshes a past task from actual completion evidence even when today has a different task id', () => {
    const initial = task()
    const weekly = updateWeeklyPlanDay(
      defaultWeeklyPlan('STUDENT_A', '2026-09-07', new Date('2026-09-07T08:00:00Z')),
      0,
      { targetCount: 1, tasks: [initial] },
      new Date('2026-09-07T08:10:00Z'),
    )
    const current = task({ id: 'daily-task:STUDENT_A:2026-09-08:continue_learning:session-a' })
    const resolved = resolveWeeklyPlan(
      weekly,
      plan([current]),
      evidence({
        lessons: () => [
          {
            id: 'lesson-session:STUDENT_A:TEXTBOOK_A:UNIT_A:LESSON_A:KP_A',
            textbookId: 'TEXTBOOK_A',
            unitId: 'UNIT_A',
            lessonId: 'LESSON_A',
            knowledgePointId: 'KP_A',
            status: 'completed',
            currentStepIndex: 2,
            completedStepIds: ['step-a'],
            completedAt: '2026-09-08T09:00:00.000Z',
          },
        ],
      }),
    )
    expect(resolved.days[0]?.taskReferences[0]?.status).toBe('completed')
  })

  it('keeps a past incomplete task as an optional continuation, never as accumulated debt', () => {
    const weekly = updateWeeklyPlanDay(
      defaultWeeklyPlan('STUDENT_A', '2026-09-07', new Date('2026-09-07T08:00:00Z')),
      0,
      { targetCount: 1, tasks: [task()] },
      new Date('2026-09-07T08:10:00Z'),
    )
    const resolved = resolveWeeklyPlan(weekly, plan([]), evidence())
    const taskView = resolved.days[0]?.taskReferences[0]
    expect(taskView?.status).toBe('pending')
    expect(taskView?.canContinue).toBe(true)
  })

  it('keeps completed selections when the target changes and exposes old-week continuations', () => {
    const priorWeek = updateWeeklyPlanDay(
      defaultWeeklyPlan('STUDENT_A', '2026-08-31', new Date('2026-08-31T08:00:00Z')),
      0,
      { targetCount: 1, tasks: [task()] },
      new Date('2026-08-31T08:10:00Z'),
    )
    const changedTarget = updateWeeklyPlanDay(priorWeek, 0, { targetCount: 0 })
    expect(changedTarget.days[0]?.taskReferences).toHaveLength(1)
    expect(changedTarget.days[0]?.targetCount).toBe(1)
    const storage = createWeeklyPlanStorage(memoryStorage())
    storage.save(priorWeek)
    const carryOver = listWeeklyPlanCarryOvers(
      'STUDENT_A',
      '2026-09-07',
      plan([]),
      evidence(),
      storage,
    )
    expect(carryOver.warning).toBeNull()
    expect(carryOver.value).toHaveLength(1)
    expect(carryOver.value[0]?.canContinue).toBe(true)
  })

  it('renders a rest day and emits an existing task action without marking it complete', async () => {
    const wrapper = mount(WeeklyPlanCard, { props: { profileId: 'STUDENT_A', dailyPlan: plan([task()]) } })
    expect(wrapper.text()).toContain('周二 · 2026-09-08')
    await wrapper.get('input[value="0"]').setValue()
    expect(wrapper.text()).toContain('今天安排休息')
    await wrapper.findAll('.weekly-plan-card__day')[1]?.trigger('click')
    await wrapper.get('input[value="1"]').setValue()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.findAll('.app-button').at(-1)?.trigger('click')
    expect(wrapper.emitted('open-task')?.[0]?.[0]).toMatchObject({ status: 'pending', title: '继续学习：认识数字' })
    expect(wrapper.text()).toContain('待继续')
  })

  it('does not read or save a plan without a resolved learning profile', () => {
    const wrapper = mount(WeeklyPlanCard, { props: { profileId: '', dailyPlan: null } })
    expect(wrapper.text()).toContain('请选择学习档案')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('keeps an individual selected reference action immutable', () => {
    const source = task()
    const reference = taskReferenceFrom(source, '2026-09-08T08:00:00.000Z')
    if (reference.action.type === 'lesson') reference.action.launchContext.lessonId = 'CHANGED'
    expect(source.action.type === 'lesson' && source.action.launchContext.lessonId).toBe('LESSON_A')
  })

  it('matches older references when a refreshed task adds optional lesson metadata', () => {
    const reference = taskReferenceFrom(task({ lessonId: undefined }), '2026-09-08T08:00:00.000Z')
    expect(sameWeeklyTask(reference, task({ id: 'refreshed' }))).toBe(true)
    expect(sameWeeklyTask({ ...reference, lessonId: 'OTHER' }, task())).toBe(false)
    expect(sameWeeklyTask(reference, task({ sourceId: 'different' }))).toBe(false)
  })
})
