import { describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { memoryQuestStorage } from './helpers/questStorage'
import { legacyMathQuestionVisuals } from '@/services/content-expansion/math-practice/legacyDiagrams'
import { localQuestionVisuals } from '@/data/curriculum/production/localRelease'
import { approvedLocalBundles } from '@/data/content-expansion/localBundles'
import { productionCurriculumIndex as catalog } from '@/data/curriculum/production'
import { createReadingQuest } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { mathPracticeTopics } from '@/services/content-expansion/math-practice/topics'
import { mathPracticeItem } from '@/services/content-expansion/math-practice/items'
import { createMathConsolidationQuest } from '@/services/content-expansion/math-practice/quest'
import {
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine/answerValidator'
import { validateQuestion } from '@/services/validation/questionValidation'
import MathPracticeDiagram from '@/components/knowledge-point/MathPracticeDiagram.vue'
import type { MathPracticeDiagram as Diagram } from '@/types/math-practice'

const mathBundles = approvedLocalBundles.filter((bundle) => {
  const book = catalog.textbooks.find((item) => item.id === bundle.textbookId)
  return book?.subjectId === 'SUBJECT_MATH'
})
function inputFor(bundle: (typeof mathBundles)[number]) {
  const content = catalog.contents.find(
    (item) => item.knowledgePointId === bundle.knowledgePointId,
  )!
  const blocks = content.body.blocks as { text?: string }[]
  return {
    bundle,
    title: catalog.lessons.find((item) => item.id === bundle.lessonId)!.title,
    text: blocks.map((block) => block.text ?? '').join('\n'),
  }
}

describe('Per-lesson mathematics consolidation', () => {
  it('covers every released mathematics point and preserves the source and old foundation questions', () => {
    expect(mathBundles).toHaveLength(395)
    expect(mathPracticeTopics.size).toBe(271)
    for (const bundle of mathBundles) {
      const input = inputFor(bundle),
        base = createReadingQuest(input)!,
        training = createTrainingQuest(input)!
      expect(base, bundle.knowledgePointId).toBeTruthy()
      expect(training, bundle.knowledgePointId).toBeTruthy()
      expect(training.stages).toHaveLength(mathPracticeTopics.has(bundle.knowledgePointId) ? 9 : 12)
      expect(training.sourceId).toBe(base.sourceId)
      expect(training.knowledgePointId).toBe(bundle.knowledgePointId)
      expect(training.lessonId).toBe(bundle.lessonId)
      expect(training.textbookId).toBe(bundle.textbookId)
      if (mathPracticeTopics.has(bundle.knowledgePointId)) expect(base.stages).toHaveLength(3)
    }
  })
  it('generates 3 deterministic, independently identified, valid and solvable groups for all 271 sparse lessons', () => {
    const ids = new Set<string>(),
      diagrams: Diagram[] = []
    const before = JSON.stringify(approvedLocalBundles)
    for (const bundle of mathBundles.filter((item) =>
      mathPracticeTopics.has(item.knowledgePointId),
    )) {
      const input = inputFor(bundle)
      for (const variant of [0, 1, 2]) {
        const quest = createTrainingQuest({ ...input, variant })!
        expect(quest).toEqual(createTrainingQuest({ ...input, variant }))
        expect(quest.training).toEqual({ variantIndex: variant, variantCount: 3 })
        const signatures = new Set<string>()
        for (const stage of quest.stages) {
          expect(stage.kind).toBe('question')
          if (stage.kind !== 'question') continue
          expect(ids.has(stage.id)).toBe(false)
          ids.add(stage.id)
          expect(validateQuestion(stage.question).issues, stage.id).toEqual([])
          expect(
            validateQuestionAnswer(stage.question, correctAnswerDraft(stage.question)).status,
            stage.id,
          ).toBe('correct')
          expect(stage.question.knowledgePointId).toBe(bundle.knowledgePointId)
          expect(stage.question.sourceId).toBe(bundle.learningContent.sourceId)
          expect(stage.question.hints).toHaveLength(2)
          expect(stage.explanation).toBeTruthy()
          expect(stage.hints).toHaveLength(2)
          signatures.add(
            JSON.stringify([
              stage.question.stem,
              stage.visual,
              stage.question.answerRule,
              stage.question.options?.map((o) => o.content),
            ]),
          )
          if (stage.visual?.type === 'practice-diagram') diagrams.push(stage.visual.diagram)
          if (stage.question.answerRule.ruleType === 'NUMERIC') {
            expect(Number.isFinite(stage.question.answerRule.value)).toBe(true)
            expect(stage.question.answerRule.value).toBeGreaterThanOrEqual(0)
            expect(
              validateQuestionAnswer(stage.question, {
                type: 'calculation',
                value: String(Number(stage.question.answerRule.value) + 1),
              }).status,
            ).toBe('incorrect')
          }
        }
        expect(signatures.size, `${bundle.knowledgePointId}:${variant}`).toBe(9)
      }
    }
    expect(ids.size).toBe(271 * 27)
    expect(diagrams.length).toBeGreaterThan(2500)
    expect(JSON.stringify(approvedLocalBundles)).toBe(before)
  })
  it('keeps numerical variants different and rejects wrong lesson/book context', () => {
    const bundle = mathBundles.find(
      (item) => mathPracticeTopics.get(item.knowledgePointId)?.topicKey === 'decimal-add',
    )!
    const input = inputFor(bundle),
      base = createReadingQuest(input)!
    const first = createMathConsolidationQuest(base, 0)!,
      second = createMathConsolidationQuest(base, 1)!
    expect(first.stages.map((s) => (s.kind === 'question' ? s.question.stem : []))).not.toEqual(
      second.stages.map((s) => (s.kind === 'question' ? s.question.stem : [])),
    )
    expect(createMathConsolidationQuest({ ...base, lessonId: 'other' }, 0)).toBeNull()
    expect(createMathConsolidationQuest({ ...base, textbookId: 'other' }, 0)).toBeNull()
    expect(createMathConsolidationQuest(base, -1)?.training?.variantIndex).toBe(2)
    expect(createMathConsolidationQuest(base, NaN)?.training?.variantIndex).toBe(0)
  })
  it('binds diagrams to the exact conditions and renders each diagram kind with a descriptive accessible image', () => {
    const examples = new Map<string, Diagram>()
    for (const topic of mathPracticeTopics.values())
      for (let i = 0; i < 27; i++) {
        const item = mathPracticeItem(
          topic.topicKey,
          i,
          Number(topic.textbookId.match(/^G(\d)/)?.[1] ?? 2),
        )
        if (item.diagram) examples.set(item.diagram.kind, item.diagram)
        if (item.diagram?.kind === 'fraction')
          expect(item.diagram.shaded).toBeLessThanOrEqual(item.diagram.parts)
      }
    for (const diagram of examples.values()) {
      const wrapper = mount(MathPracticeDiagram, { props: { diagram } })
      expect(wrapper.find('svg[role="img"]').attributes('aria-label')).toBeTruthy()
      expect(wrapper.html()).not.toMatch(/NaN|undefined|Infinity/)
      wrapper.unmount()
    }
    const cone = mathPracticeItem('cone-volume', 0, 6)
    expect(cone.diagram?.kind).toBe('solid')
    if (cone.diagram?.kind === 'solid') expect(cone.diagram.baseArea).toBe(15)
    const wrapper = mount(MathPracticeDiagram, { props: { diagram: cone.diagram! } })
    expect(wrapper.text()).toContain('底面积 15 平方厘米')
    expect(wrapper.text()).not.toContain('半径')
    wrapper.unmount()
  })
  it('accepts equivalent fraction and decimal answers, including full-width fraction input; rejects zero denominators', () => {
    const bundle = mathBundles.find(
      (item) => mathPracticeTopics.get(item.knowledgePointId)?.topicKey === 'fraction-add',
    )!
    const question = createTrainingQuest(inputFor(bundle))!.stages.find(
      (stage) => stage.kind === 'question' && stage.question.answerRule.ruleType === 'NUMERIC',
    )!
    if (question.kind !== 'question' || question.question.answerRule.ruleType !== 'NUMERIC')
      throw new Error('numeric question required')
    const value = Number(question.question.answerRule.value)
    for (const fraction of [`${value * 8}/8`, `${value * 16}/16`])
      expect(
        validateQuestionAnswer(question.question, { type: 'calculation', value: fraction }).status,
      ).toBe('correct')
    const half = {
      ...question.question,
      answerRule: { ruleType: 'NUMERIC' as const, value: 0.5, tolerance: 0.000001 },
    }
    expect(validateQuestionAnswer(half, { type: 'calculation', value: '１／２' }).status).toBe(
      'correct',
    )
    expect(validateQuestionAnswer(half, { type: 'calculation', value: '1/0' }).status).toBe(
      'incorrect',
    )
  })
  it('has companion diagrams on all five pre-existing observation and coordinate questions', () => {
    for (const [id, visual] of legacyMathQuestionVisuals) {
      const question = catalog.questions.find((q) => q.id === id)
      expect(question, id).toBeTruthy()
      expect(localQuestionVisuals.get(id)).toEqual(visual)
      if (visual.type === 'practice-diagram') {
        const wrapper = mount(MathPracticeDiagram, { props: { diagram: visual.diagram } })
        expect(wrapper.find('svg[role="img"]').attributes('aria-label')).toBeTruthy()
        wrapper.unmount()
      }
    }
  })
  it('independently checks representative arithmetic, geometry, statistics and unit-conversion answers', () => {
    for (const [topic, value] of [
      ['written-multiply', 1443],
      ['decimal-add', 4],
      ['fraction-add', 0.5],
      ['fraction-mix', 0.375],
      ['fraction-divide', 2.5],
      ['triangle-angles', 97],
      ['parallelogram-area', 15],
      ['surface-area', 126],
      ['cone-volume', 15],
      ['percent-rates', 30],
      ['ratio-share', 10],
      ['scale', 50],
      ['displacement', 150],
      ['optimization', 5],
      ['average', 7],
      ['clock', 38],
    ] as const)
      expect(mathPracticeItem(topic, 0, 6).answer, topic).toBe(value)
  })
  it('lets the inline exercise accept decimals, equivalent fractions and answers longer than three digits', async () => {
    vi.stubGlobal('localStorage', memoryQuestStorage())
    try {
      for (const [topic, value] of [
        ['decimal-multiply', '3.36'],
        ['fraction-add', '1/2'],
        ['area-units', '50000'],
      ] as const) {
        const bundle = mathBundles.find(
          (b) => mathPracticeTopics.get(b.knowledgePointId)?.topicKey === topic,
        )!
        const quest = createTrainingQuest(inputFor(bundle))!
        const wrapper = mount(ReadingQuest, {
          props: { quest, profileId: `input-check-${topic}` },
          global: { stubs: { StudentReadAloud: true, ContentFeedbackLink: true } },
        })
        await wrapper.find('input#math-number-answer').setValue(value)
        await flushPromises()
        expect((wrapper.find('input#math-number-answer').element as HTMLInputElement).value).toBe(
          value,
        )
        const check = wrapper.findAll('button').find((b) => b.text() === '检查答案')!
        expect(check).toBeTruthy()
        await check.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('下一关')
        wrapper.unmount()
      }
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
