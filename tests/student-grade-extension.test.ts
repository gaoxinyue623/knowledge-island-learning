import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { gradeExtensionLessons } from '@/data/grade-extension/gradeExtensionLessons'
import { createGradeExtensionQuest } from '@/services/grade-extension/gradeExtensionQuest'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import { checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { validateQuestion } from '@/services/validation/questionValidation'
import { freshQuestProgress, saveQuestProgress } from '@/services/content-expansion/questProgressStorage'
import { questPetSource } from '@/services/pet/petQuestRewards'

describe('grade three original extension lessons', () => {
  it('does not turn unreviewed supplemental completions into curriculum pet rewards', () => {
    const data = new Map<string, string>()
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
    for (const lesson of gradeExtensionLessons) {
      for (const variant of [0, 1]) {
        const quest = createGradeExtensionQuest(lesson.id, variant)!
        const progress = freshQuestProgress('extension-child', quest)
        progress.passedIds = quest.stages.map(stage => stage.id)
        progress.completedStageIds = [...progress.passedIds]
        progress.activeStageId = progress.passedIds.at(-1)!
        progress.summaryVisible = true
        expect(saveQuestProgress(storage, progress, quest)).toBeNull()
        expect(questPetSource(storage, progress.profileId, quest)).toBeNull()
      }
    }
  })

  it('varies correct option positions while keeping every answer grounded in its option text', () => {
    const positions = new Set<string>()
    for (const lesson of gradeExtensionLessons) for (const variant of [0, 1]) {
      const quest = createGradeExtensionQuest(lesson.id, variant)!
      for (const stage of quest.stages) if (stage.kind === 'question' && stage.question.answerRule.ruleType === 'SINGLE_OPTION') {
        positions.add(stage.question.answerRule.correctOptionKey)
        expect(stage.question.options?.some(option => option.optionKey === stage.question.answerRule.correctOptionKey)).toBe(true)
      }
    }
    expect(positions).toEqual(new Set(['A', 'B', 'C']))
  })
  it('offers nine complete project-original lessons across the three subjects', () => {
    expect(gradeExtensionLessons).toHaveLength(9)
    expect(new Set(gradeExtensionLessons.map((lesson) => lesson.subject))).toEqual(
      new Set(['CHINESE', 'MATH', 'ENGLISH']),
    )
    for (const lesson of gradeExtensionLessons) {
      expect(lesson.sourceType).toBe('项目原创')
      expect(lesson.teacherReviewStatus).toBe('暂未教师校审')
      expect(lesson.body.trim().length).toBeGreaterThan(40)
      expect(lesson.objective).toBeTruthy()
    }
  })

  it('creates two deterministic, genuinely distinct, scorable variants for every lesson', () => {
    for (const lesson of gradeExtensionLessons) {
      const first = createGradeExtensionQuest(lesson.id, 0)!
      const second = createGradeExtensionQuest(lesson.id, 1)!
      expect(first).toEqual(createGradeExtensionQuest(lesson.id, 0))
      expect(first.id).not.toBe(second.id)
      expect(first.stages).toHaveLength(3)
      expect(second.stages).toHaveLength(3)
      expect(JSON.stringify(first.stages)).not.toBe(JSON.stringify(second.stages))
      for (const stage of [...first.stages, ...second.stages]) {
        expect(stage.kind).toBe('question')
        if (stage.kind !== 'question') continue
        const report = validateQuestion(stage.question, { sourceIds: new Set(['grade-extension:original:v1']) })
        expect(report.valid, report.issues.join('; ')).toBe(true)
        expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe('correct')
      }
    }
  })

  it('keeps arithmetic and language evidence independently checkable', () => {
    const multiplication = createGradeExtensionQuest('g3-math-market-groups', 0)!
    const first = multiplication.stages[0]
    expect(first?.kind === 'question' && first.question.answerRule).toMatchObject({
      ruleType: 'NUMERIC', value: 24,
    })
    const reading = createGradeExtensionQuest('g3-chinese-rainy-window', 0)!
    const evidence = reading.stages.map((stage) => (stage.kind === 'question' ? stage.explanation : '')).join(' ')
    expect(evidence).toContain('小乐没有伞')
    expect(evidence).toContain('雨')
  })

  it('passes the active learning profile to the reused quest progress boundary', async () => {
    const quest = createGradeExtensionQuest('g3-math-market-groups', 0)!
    const wrapper = mount(ReadingQuest, { props: { quest, profileId: 'grade-extension-child-a' } })
    await wrapper.get('input[inputmode="numeric"]').setValue('24')
    await wrapper.get('input[inputmode="numeric"]').trigger('keydown.enter')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    await wrapper.setProps({ profileId: 'grade-extension-child-b' })
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    wrapper.unmount()
  })
})
