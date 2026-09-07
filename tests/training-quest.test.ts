import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QUEST_PROGRESS_PREFIX,
  QUEST_CHOICE_PREFIX,
} from '@/services/content-expansion/questProgressStorage'
import { memoryQuestStorage } from './helpers/questStorage'
import QuestTraining from '@/components/knowledge-point/QuestTraining.vue'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { curriculumData } from '@/data/curriculum'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import {
  createReadingQuest,
  checkQuestAnswer,
  emptyQuestDraft,
  questReadingText,
} from '@/services/content-expansion/readingQuest'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import { validateQuestion } from '@/services/validation/questionValidation'
import { validateInteractiveActivity } from '@/services/validation/contentExpansionValidation'
import { productionConfig } from '@/config/production'
import type { ContentBlock, ContentExpansionBundle } from '@/types'
import type { QuestQuestionStage } from '@/types/reading-quest'

const bundles = await new StaticContentExpansionRepository().listBundles('candidate')
function inputFor(bundle: ContentExpansionBundle) {
  const content = curriculumData.courseContents
    .filter((c) => c.knowledgePointId === bundle.knowledgePointId)
    .sort((a, b) => b.currentVersion - a.currentVersion || a.id.localeCompare(b.id))[0]!
  return {
    bundle,
    title: curriculumData.lessons.find((l) => l.id === bundle.lessonId)!.title,
    text: questReadingText(
      (content.body.blocks as ContentBlock[]).map((block, i) => ({
        id: String(i),
        sort: i,
        type: 'intro',
        content: block.text,
        isSample: false,
      })),
    ),
  }
}
const mathInput = inputFor(bundles.find((b) => b.knowledgePointId === 'G1_SHENZHEN_MATH_S2_KP_03')!)
const math = createTrainingQuest(mathInput)!
const questionAt = (index: number) => math.stages[index] as QuestQuestionStage
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!
enableAutoUnmount(afterEach)
beforeEach(() => vi.stubGlobal('localStorage', memoryQuestStorage()))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Strengthened training projection', () => {
  it('generates deterministic, source-scoped, schema-valid solvable rounds across the imported subjects', () => {
    const before = JSON.stringify(bundles)
    const ids = new Set<string>()
    const coverage: Record<string, number> = {}
    const missing: string[] = []
    for (const bundle of bundles) {
      const input = inputFor(bundle)
      const base = createReadingQuest(input)
      if (!base) continue
      const initial = createTrainingQuest(input)
      if (!initial) {
        missing.push(input.title)
        continue
      }
      coverage[base.textbookId] = (coverage[base.textbookId] ?? 0) + 1
      expect(initial).toEqual(createTrainingQuest(input))
      for (const variant of [0, 1, 2]) {
        const quest = createTrainingQuest({ ...input, variant })!
        expect(quest.stages, quest.id).toHaveLength(9)
        expect(quest.sourceId).toBe(base.sourceId)
        expect(quest.isSample).toBe(base.isSample)
        expect(quest.verificationStatus).toBe(base.verificationStatus)
        expect(quest.stages.map((s) => s.trainingBand)).toEqual([
          'foundation',
          'foundation',
          'foundation',
          'reasoning',
          'reasoning',
          'reasoning',
          'transfer',
          'transfer',
          'transfer',
        ])
        for (const stage of quest.stages) {
          expect(ids.has(stage.id), stage.id).toBe(false)
          ids.add(stage.id)
          expect(stage.title).toBeTruthy()
          expect(stage.explanation).toBeTruthy()
          expect(stage.hints?.length).toBeGreaterThanOrEqual(2)
          if (stage.kind === 'question') {
            const validation = validateQuestion(stage.question, {
              knowledgePointIds: new Set(curriculumData.knowledgePoints.map((k) => k.id)),
            })
            expect(validation.valid, `${stage.id}: ${validation.issues.join(';')}`).toBe(true)
            expect(stage.question.sourceId).toBe(bundle.learningContent.sourceId)
            expect(checkQuestAnswer(stage.question, emptyQuestDraft(stage.question))).toBe(
              'incomplete',
            )
            expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
              'correct',
            )
            if (stage.question.answerRule.ruleType === 'NUMERIC') {
              expect(stage.question.answerRule.value).toBeGreaterThanOrEqual(0)
              expect(stage.question.answerRule.value).toBeLessThanOrEqual(
                base.textbookId.includes('G1_SHENZHEN_BNU_MATH_S1') ? 10 : 100,
              )
            }
            if (stage.tiles && stage.question.answerRule.ruleType === 'TEXT_BLANKS') {
              const answer = stage.question.answerRule.blanks[0]!.acceptedAnswers[0]!
              const remaining = [...stage.tiles]
              const tokens =
                stage.tileMode === 'sequence'
                  ? answer.match(/\d+|[＋－＝]/g)!
                  : stage.tileMode === 'word'
                    ? [answer]
                    : [...answer]
              for (const token of tokens) {
                const i = remaining.indexOf(token)
                expect(i, `${stage.id} missing ${token}`).toBeGreaterThanOrEqual(0)
                remaining.splice(i, 1)
              }
            }
          } else {
            const result = validateInteractiveActivity(stage.activity)
            expect(result.success, `${stage.id}: ${JSON.stringify(result)}`).toBe(true)
            if (stage.activity.activityType === 'drag_match') {
              const { sources, targets, matches } = stage.activity.config
              expect(new Set(sources.map((s) => s.label)).size).toBe(sources.length)
              expect(new Set(targets.map((s) => s.label)).size).toBe(targets.length)
              expect(matches).toHaveLength(sources.length)
            } else {
              const { items, correctOrder } = stage.activity.config
              expect([...correctOrder].sort()).toEqual(items.map((i) => i.id).sort())
              expect(items.map((i) => i.id)).not.toEqual(correctOrder)
            }
          }
        }
      }
    }
    expect(Object.keys(coverage)).toHaveLength(11)
    expect(coverage['G1_SHENZHEN_BNU_MATH_S2_2024_CANDIDATE']).toBe(40)
    expect(missing).toEqual([])
    expect(Object.values(coverage).reduce((total, count) => total + count, 0)).toBe(348)
    expect(JSON.stringify(bundles)).toBe(before)
    console.info('Strengthened training coverage', coverage, 'warmup-only', missing)
  })

  it('changes actual math problems between three rounds and wraps deterministically', () => {
    const prompts = [0, 1, 2].map(
      (variant) =>
        (createTrainingQuest({ ...mathInput, variant })!.stages[0] as QuestQuestionStage).question
          .stem[0]!.text!,
    )
    expect(new Set(prompts).size).toBe(3)
    expect(createTrainingQuest({ ...mathInput, variant: 3 })).toEqual(math)
    expect(createTrainingQuest({ ...mathInput, variant: NaN })).toEqual(math)
  })

  it('keeps geometry scenarios on topic and rectangle clues unambiguous', () => {
    const solids = bundles
      .filter((b) => b.textbookId.includes('G1_SHENZHEN_BNU_MATH_S1'))
      .map(inputFor)
      .map((input) => createTrainingQuest(input))
      .filter((q) => q?.stages[6]?.context?.startsWith('积木工坊'))
    expect(solids.length).toBeGreaterThan(0)
    expect(solids.every((q) => !q!.stages[6]!.context!.includes('三角形'))).toBe(true)
    const shapes = bundles
      .filter((b) => b.textbookId.includes('G2_SHENZHEN_BNU_MATH_S1'))
      .map(inputFor)
      .map((input) => createTrainingQuest(input))
      .filter((q) => q?.stages[6]?.context?.startsWith('图案工作室'))
    expect(shapes).toHaveLength(4)
    expect(shapes.every((q) => JSON.stringify(q).includes('平移不能代替旋转'))).toBe(true)
    const planes = bundles
      .filter((b) => b.textbookId.includes('G1_SHENZHEN_BNU_MATH_S2'))
      .map(inputFor)
      .map((input) => createTrainingQuest({ ...input, variant: 2 }))
      .filter((q) => JSON.stringify(q?.stages[0]).includes('神秘图形线索'))
    expect(planes.length).toBeGreaterThan(0)
    expect(planes.every((q) => JSON.stringify(q!.stages[0]).includes('相邻两条边不一样长'))).toBe(
      true,
    )
  })

  it.each([0, 1, 2])(
    'independently checks addition, reverse problem and linked story answers in round %s',
    (variant) => {
      const q = createTrainingQuest({ ...mathInput, variant })!
      const first = q.stages[0] as QuestQuestionStage
      const [, left, right] = first.question.stem[0]!.text!.match(/^(\d+)＋(\d+)/)!
      const a = Number(left),
        b = Number(right)
      expect(first.question.answerRule).toMatchObject({ value: a + b })
      expect((q.stages[1] as QuestQuestionStage).question.answerRule).toMatchObject({
        value: a - 1,
      })
      expect((q.stages[7] as QuestQuestionStage).question.answerRule).toMatchObject({
        value: a + b - 2,
      })
      expect((q.stages[8] as QuestQuestionStage).question.answerRule).toMatchObject({
        value: a + b - 1,
      })
      expect(q.stages.slice(6).every((s) => s.context === q.stages[6]!.context)).toBe(true)
      expect(first.visual).toBeUndefined()
      expect(first.hints?.[0]).not.toContain(String(a + b))
    },
  )

  it('does not bypass source/context guards or mutate the foundational round', () => {
    const before = createReadingQuest(mathInput)
    createTrainingQuest(mathInput)
    expect(createReadingQuest(mathInput)).toEqual(before)
    expect(createTrainingQuest({ ...mathInput, bundle: null })).toBeNull()
    expect(createTrainingQuest({ ...mathInput, text: '' })).toBeNull()
    expect(
      createTrainingQuest({
        ...mathInput,
        bundle: { ...mathInput.bundle, textbookId: 'ANOTHER_MATH_BOOK' },
      }),
    ).toBeNull()
    const enabled = productionConfig.allowUnreviewedQuestions
    try {
      productionConfig.allowUnreviewedQuestions = false
      expect(createTrainingQuest(mathInput)).toBeNull()
    } finally {
      productionConfig.allowUnreviewedQuestions = enabled
    }
  })

  it('provides reasoning and transfer only when the Chinese text supports the seed', () => {
    const input = inputFor(
      bundles.find((b) => b.knowledgePointId === 'G2_PEP_CHINESE_S2_REVISED_KP_NOT_WEAKEST')!,
    )
    const q = createTrainingQuest(input)!
    expect((q.stages[4] as QuestQuestionStage).question.stem[0]!.text).toContain('为什么')
    expect(JSON.stringify(q.stages[6])).toContain('小盆栽')
    const changed = createTrainingQuest({
      ...input,
      text: '小鸟飞到树上，轻轻唱歌。小河流向远方，船儿向前行。孩子坐在教室里，认真读书。',
    })!
    expect(JSON.stringify(changed)).not.toContain('小盆栽')
    expect(JSON.stringify(changed)).not.toContain('萨沙')
  })

  it('propagates SAMPLE provenance and blocks it when sample questions are disabled', () => {
    const input = inputFor(bundles.find((b) => b.knowledgePointId === 'G1_PEP_CHINESE_S2_KP_01')!)
    input.bundle = {
      ...input.bundle,
      learningContent: {
        ...input.bundle.learningContent,
        isSample: true,
        verificationStatus: 'SAMPLE',
      },
    }
    const enabled = productionConfig.allowSampleQuestions
    try {
      productionConfig.allowSampleQuestions = true
      const quest = createTrainingQuest(input)!
      expect(quest.isSample).toBe(true)
      expect(quest.verificationStatus).toBe('SAMPLE')
      expect(
        quest.stages.every((s) =>
          s.kind === 'question'
            ? s.question.isSample && s.question.verificationStatus === 'SAMPLE'
            : s.activity.isSample && s.activity.verificationStatus === 'SAMPLE',
        ),
      ).toBe(true)
      productionConfig.allowSampleQuestions = false
      expect(createTrainingQuest(input)).toBeNull()
    } finally {
      productionConfig.allowSampleQuestions = enabled
    }
  })

  it('English spelling includes distracting letters and sentence ordering does not show the answer', () => {
    const input = inputFor(
      bundles.find(
        (b) => b.textbookId.includes('ENGLISH_S2') && b.knowledgePointId.endsWith('_01'),
      )!,
    )
    const q = createTrainingQuest(input)!
    const spelling = q.stages[0] as QuestQuestionStage
    if (spelling.question.answerRule.ruleType !== 'TEXT_BLANKS')
      throw new Error('Expected spelling')
    expect(spelling.tiles!.length).toBeGreaterThan(
      spelling.question.answerRule.blanks[0]!.acceptedAnswers[0]!.length,
    )
    const order = q.stages[5]!
    if (order.kind !== 'activity' || order.activity.activityType !== 'sort_order')
      throw new Error('Expected sentence construction')
    const full = order.activity.config.correctOrder
      .map((id) => order.activity.config.items.find((i) => i.id === id)!.label)
      .join(' ')
    expect(order.activity.instruction).not.toContain(full)
    expect(full).toBe('I see a frog.')
    expect(order.activity.instruction).toContain('用 本课句型 介绍你看见的一种动物')
    expect(q.stages[1]!.hint).not.toContain('数量和单位')
  })
})

describe('Training interaction', () => {
  it('starts with warmup and remembers strengthened rounds without writing to mastery or history', async () => {
    const write = vi.spyOn(localStorage, 'setItem')
    const wrapper = mount(QuestTraining, {
      props: { ...mathInput, quest: createReadingQuest(mathInput)!, profileId: 'child-a' },
    })
    expect(wrapper.find('[aria-label="强化训练三个阶段"]').exists()).toBe(false)
    await wrapper.findAll('.quest-training__modes button')[1]!.trigger('click')
    expect(wrapper.find('[aria-label="强化训练三个阶段"]').exists()).toBe(true)
    const first = questionAt(0)
    if (first.question.answerRule.ruleType !== 'NUMERIC') throw new Error('Expected calculation')
    await wrapper
      .find('input[inputmode="numeric"]')
      .setValue(String(first.question.answerRule.value))
    await button(wrapper, '检查答案').trigger('click')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    await wrapper.findAll('.quest-training__modes button')[0]!.trigger('click')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    await wrapper.findAll('.quest-training__modes button')[1]!.trigger('click')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    await button(wrapper, '换一组强化题').trigger('click')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.text()).toContain('第 2 组')
    expect(write).toHaveBeenCalled()
    expect(
      write.mock.calls.every(
        ([key]) => key.startsWith(QUEST_PROGRESS_PREFIX) || key.startsWith(QUEST_CHOICE_PREFIX),
      ),
    ).toBe(true)
    wrapper.unmount()
    const reloaded = mount(QuestTraining, {
      props: { ...mathInput, quest: createReadingQuest(mathInput)!, profileId: 'child-a' },
    })
    expect(reloaded.text()).toContain('第 2 组')
    await button(reloaded, '换一组强化题').trigger('click')
    await button(reloaded, '换一组强化题').trigger('click')
    expect(reloaded.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    await reloaded.setProps({ profileId: 'new-child' })
    expect(reloaded.find('[aria-label="强化训练三个阶段"]').exists()).toBe(false)
  })

  it('gives classification questions a relevant first hint, not a numerical-units hint', () => {
    const input = inputFor(bundles.find((b) => b.knowledgePointId === 'G1_SHENZHEN_MATH_S1_KP_01')!)
    const quest = createTrainingQuest(input)!
    expect(quest.stages[0]!.hint).toContain('标准')
    expect(quest.stages[0]!.hint).not.toContain('数量和单位')
  })

  it('records hint-assisted completion separately from independent success', async () => {
    const stage = questionAt(0)
    const wrapper = mount(ReadingQuest, {
      props: { quest: { ...math, stages: [stage] }, profileId: 'hint-child' },
    })
    expect(wrapper.find('#quest-hint').exists()).toBe(false)
    await button(wrapper, '给我一点提示').trigger('click')
    expect(wrapper.find('#quest-hint').text()).toContain(stage.hints![0])
    expect(wrapper.find('#quest-hint').text()).not.toContain(stage.hints![1])
    await button(wrapper, '再给一步提示').trigger('click')
    expect(wrapper.find('#quest-hint').text()).toContain(stage.hints![1])
    const draft = correctAnswerDraft(stage.question)
    if (draft.type !== 'calculation') throw new Error('Expected number')
    await wrapper.find('input').setValue(draft.value)
    await button(wrapper, '检查答案').trigger('click')
    await button(wrapper, '查看闯关小结').trigger('click')
    expect(wrapper.text()).toContain('首次独立通过 0 关')
    expect(wrapper.text()).toContain('1 关使用过提示')
    wrapper.unmount()
  })

  it('builds an equation from number/operator tiles, supports correction and rejects a wrong operator', async () => {
    const stage = questionAt(5)
    const wrapper = mount(ReadingQuest, {
      props: { quest: { ...math, stages: [stage] }, profileId: 'builder-child' },
    })
    if (stage.question.answerRule.ruleType !== 'TEXT_BLANKS') throw new Error('Expected equation')
    const tokens = stage.question.answerRule.blanks[0]!.acceptedAnswers[0]!.match(/\d+|[＋－＝]/g)!
    const wrong = tokens.map((token) => (token === '＋' ? '－' : token))
    for (const token of wrong)
      await wrapper
        .findAll('.reading-quest__tiles button')
        .find((b) => b.text() === token && b.attributes('disabled') === undefined)!
        .trigger('click')
    await button(wrapper, '检查答案').trigger('click')
    expect(wrapper.text()).toContain('还差一点点')
    await button(wrapper, '清空，重新选').trigger('click')
    for (const token of tokens)
      await wrapper
        .findAll('.reading-quest__tiles button')
        .find((b) => b.text() === token && b.attributes('disabled') === undefined)!
        .trigger('click')
    await button(wrapper, '检查答案').trigger('click')
    expect(wrapper.text()).toContain('这一关通过啦')
    wrapper.unmount()
  })

  it('keeps rounds isolated across profiles and cannot skip to a later story question', async () => {
    const wrapper = mount(QuestTraining, {
      props: { ...mathInput, quest: createReadingQuest(mathInput)!, profileId: 'child-a' },
    })
    expect(wrapper.findAll('.reading-quest__trail button')[7]!.attributes('disabled')).toBeDefined()
    await wrapper.setProps({ profileId: 'child-b' })
    await flushPromises()
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.text()).not.toContain('这一关通过啦')
    wrapper.unmount()
  })
})
