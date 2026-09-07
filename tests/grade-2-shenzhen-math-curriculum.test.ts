import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import MathQuestVisual from '@/components/knowledge-point/MathQuestVisual.vue'
import { productionConfig } from '@/config/production'
import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_SHENZHEN_REGION_ID,
  G2_PEP_CHINESE_GRADE_ID,
  G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
  G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
} from '@/data/curriculum'
import {
  gradeTwoShenzhenMathUpperCurriculum as book,
  gradeTwoShenzhenMathUpperDefinitions as definitions,
  G2_SHENZHEN_MATH_S1_TEXTBOOK_ID as bookId,
  multiplicationChant,
} from '@/data/curriculum/grade-2/math-bnu-upper'
import { candidateG2ShenzhenMathUpperContentExpansionBundles as bundles } from '@/data/content-expansion/g2-shenzhen-math-upper'
import { isMathPilotTextbook, isPilotTextbook } from '@/data/curriculum/pilot'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import { createMathQuest } from '@/services/content-expansion/mathQuest'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { validateCurriculumData } from '@/services/validation'
import { validateQuestion } from '@/services/validation/questionValidation'
import {
  validateInteractiveActivity,
  validateExtensionActivity,
} from '@/services/validation/contentExpansionValidation'
import { correctAnswerDraft } from '@/services/question-engine/answerValidator'
import {
  configureCurriculumStore,
  resetCurriculumStoreDependencies,
  useCurriculumStore,
} from '@/stores/curriculumStore'
import type { QuestQuestionStage } from '@/types/reading-quest'

const accessPolicy = {
  allowSampleCurriculum: false,
  allowUnreviewedCurriculum: true,
  allowSampleLearningContent: false,
  allowUnreviewedLearningContent: true,
}
const service = new MockCurriculumService({ accessPolicy })
const context = {
  regionId: G1_SHENZHEN_REGION_ID,
  gradeId: G2_PEP_CHINESE_GRADE_ID,
  semesterId: 'SEMESTER_UPPER',
}
afterEach(() => resetCurriculumStoreDependencies())

describe('Shenzhen BNU grade 2 math upper curriculum', () => {
  it('registers the eight chapters, game, two projects and review in supplied order', () => {
    expect(book.units).toHaveLength(12)
    expect(book.units.map((u) => u.title)).toEqual([
      '第一单元 · 100以内数加与减（二）',
      '数学好玩 · 猜数游戏',
      '第二单元 · 测量（一）',
      '第三单元 · 数一数与乘法',
      '第四单元 · 乘法口诀（一）',
      '综合实践 · 画校园路线图',
      '第五单元 · 分一分与除法',
      '第六单元 · 图形的运动（一）',
      '第七单元 · 乘法口诀（二）',
      '第八单元 · 乘除法的应用（一）',
      '综合实践 · 参加欢乐购物活动',
      '总复习 · 数学探险回顾',
    ])
    expect(definitions).toHaveLength(49)
    for (const collection of [
      book.lessons,
      book.knowledgePoints,
      book.courseContents,
      book.lessonKnowledgePointRelations,
    ])
      expect(collection).toHaveLength(49)
    expect(book.lessons[0]?.title).toBe('图书角 · 两位数加一位数')
    expect(isMathPilotTextbook(bookId)).toBe(true)
    expect(isPilotTextbook(bookId)).toBe(true)
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
  })

  it('resolves grade 2 upper math across regions without mixing grade or volume', async () => {
    const result = await service.resolveAvailableTextbooks(context)
    expect(result.math.availableTextbooks.map((b) => b.id)).toEqual([bookId])
    expect(result.english.availableTextbooks.map((b) => b.id)).toEqual([
      G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
    ])
    for (const other of [
      { ...context, regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID },
      { ...context, regionId: G1_PEP_CHINESE_HUBEI_REGION_ID },
    ]) {
      expect(
        (await service.resolveAvailableTextbooks(other)).math.availableTextbooks.map((b) => b.id),
      ).toEqual([bookId])
    }
    expect(
      (await service.resolveAvailableTextbooks({ ...context, semesterId: 'SEMESTER_LOWER' })).math
        .availableTextbooks,
    ).toEqual([])
    const gradeOne = await service.resolveAvailableTextbooks({
      ...context,
      gradeId: G1_PEP_CHINESE_GRADE_ID,
    })
    expect(gradeOne.math.availableTextbooks.map((b) => b.id)).toEqual([
      G1_SHENZHEN_MATH_S1_TEXTBOOK_ID,
    ])
  })

  it('lets a learner select math without breaking existing English-only profiles', async () => {
    setActivePinia(createPinia())
    configureCurriculumStore({ curriculumService: service })
    const store = useCurriculumStore()
    store.setContext(context)
    await store.resolveTextbooks()
    expect(store.draftIsComplete).toBe(false)
    expect(store.selectTextbook('MATH', bookId)).toBe(true)
    expect(store.draftIsComplete).toBe(true)
    expect(store.selectTextbook('ENGLISH', bookId)).toBe(false)
    store.setProfile({
      ...context,
      studentId: 'math-test-profile',
      chineseTextbookVersionId: null,
      mathTextbookVersionId: null,
      englishTextbookVersionId: G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      confirmedAt: '2026-09-05T00:00:00Z',
      source: 'USER_CONFIRMED',
    })
    expect(store.isComplete).toBe(true)
    store.selectGrade(G1_PEP_CHINESE_GRADE_ID)
    expect(store.draftIsComplete).toBe(false)
    expect(store.mathTextbookVersionId).toBeNull()
  })

  it('builds 49 real lesson nodes and loads each lesson explanation', async () => {
    const source = await service.getLearningMapCurriculum(bookId)
    expect(source?.textbook.subject).toBe('MATH')
    const map = buildLearningMapViewModel(source!)
    expect(map.islands).toHaveLength(12)
    expect(flattenKnowledgeNodes(map.islands)).toHaveLength(49)
    const repository = new MockLearningContentRepository({ accessPolicy })
    for (const d of definitions) {
      const content = await repository.getByKnowledgePoint(d.knowledgePointId)
      expect(content?.lessonId).toBe(d.lessonId)
      expect(content?.blocks[0]?.block.text).toContain(d.explanation)
    }
  })

  it('keeps supplied outline provenance distinct from original exercises and production', async () => {
    expect(book.sources[0]?.notes).toContain('非逐页课本全文')
    expect(book.textbooks[0]?.verificationStatus).toBe('UNVERIFIED')
    for (const b of bundles) {
      expect(b.learningContent.isSample).toBe(false)
      expect(b.learningContent.sourceId).not.toBe(book.courseContents[0]?.sourceId)
      expect(validateExtensionActivity(b.extensionActivities[0]).success).toBe(true)
    }
    const repository = new StaticContentExpansionRepository()
    expect(
      (await repository.getBundle(definitions[0]!.knowledgePointId, 'candidate'))?.textbookId,
    ).toBe(bookId)
    const original = productionConfig.allowUnreviewedQuestions
    try {
      productionConfig.allowUnreviewedQuestions = false
      expect(createMathQuest(bundles[0]!)).toBeNull()
    } finally {
      productionConfig.allowUnreviewedQuestions = original
    }
    expect(createMathQuest({ ...bundles[0]!, textbookId: 'OTHER_BOOK' })).toBeNull()
    const sample = structuredClone(bundles[0]!)
    sample.learningContent.isSample = true
    expect(createMathQuest(sample)).toBeNull()
  })

  it('corrects the two supplied ambiguities without changing the learning algorithms', () => {
    expect(definitions.find((d) => d.title === '倍的认识 · 求几倍')?.explanation).toContain(
      '答句可以写',
    )
    expect(definitions.find((d) => d.title === '乘法的意义 · 乘数与积')?.explanation).toContain(
      '3×5＝15或5×3＝15',
    )
    expect(multiplicationChant(5)).toBe(
      '一五得五，二五一十，三五十五，四五二十，五五二十五，五六三十，五七三十五，五八四十，五九四十五',
    )
    expect(multiplicationChant(9)).toContain('九九八十一')
    expect(multiplicationChant(3)).toContain('三六十八')
  })
})

describe('Math adventure exercise quality', () => {
  it('provides 392 deterministic stages with valid domain answers, source references and no source mutation', () => {
    const before = JSON.stringify(bundles)
    const allIds: string[] = []
    for (const bundle of bundles) {
      const quest = createMathQuest(bundle)!
      expect(quest).toEqual(createMathQuest(bundle))
      expect(
        createReadingQuest({ bundle, title: bundle.learningContent.title, text: '已加载知识讲解' }),
      ).toEqual(quest)
      expect(quest.stages).toHaveLength(8)
      expect(
        new Set(
          quest.stages.map((s) =>
            s.kind === 'question' ? s.question.questionType : s.activity.activityType,
          ),
        ).size,
      ).toBeGreaterThanOrEqual(5)
      for (const s of quest.stages) {
        allIds.push(s.id)
        expect(s.hint).toBeTruthy()
        expect(s.explanation).toBeTruthy()
        if (s.kind === 'question') {
          const report = validateQuestion(s.question, {
            sourceIds: new Set(curriculumData.sources.map((s) => s.id)),
          })
          expect(report.valid, report.issues.join('; ')).toBe(true)
          expect(checkQuestAnswer(s.question, correctAnswerDraft(s.question))).toBe('correct')
          if (s.question.answerRule.ruleType === 'NUMERIC') {
            expect(Number.isInteger(s.question.answerRule.value)).toBe(true)
            expect(Number(s.question.answerRule.value)).toBeGreaterThanOrEqual(0)
            expect(Number(s.question.answerRule.value)).toBeLessThanOrEqual(200)
          }
        } else expect(validateInteractiveActivity(s.activity).success, s.id).toBe(true)
      }
    }
    expect(allIds).toHaveLength(392)
    expect(new Set(allIds).size).toBe(392)
    expect(JSON.stringify(bundles)).toBe(before)
  })

  it.each([
    [0, 32],
    [1, 64],
    [2, 26],
    [3, 24],
    [4, 52],
    [7, 23],
    [9, 5],
    [11, 6],
    [12, 6],
    [13, 15],
    [14, 12],
  ])('computes the independent reference answer for lesson index %i', (index, answer) => {
    const stage = createMathQuest(bundles[index]!)!.stages[0] as QuestQuestionStage
    expect(stage.question.answerRule).toMatchObject({ ruleType: 'NUMERIC', value: answer })
    expect(
      checkQuestAnswer(stage.question, { type: 'calculation', value: String(answer + 1) }),
    ).toBe('incorrect')
  })

  it('accepts both multiplication orientations and rejects extra choices', () => {
    const i = definitions.findIndex((d) => d.title.startsWith('方阵'))
    const stage = createMathQuest(bundles[i]!)!.stages[1] as QuestQuestionStage
    expect(stage.question.answerRule.ruleType).toBe('MULTIPLE_OPTIONS')
    const correct = correctAnswerDraft(stage.question)
    expect(checkQuestAnswer(stage.question, correct)).toBe('correct')
    expect(
      checkQuestAnswer(stage.question, {
        type: 'multipleChoice',
        optionIds: stage.question.options!.map((o) => o.id),
      }),
    ).toBe('incorrect')
  })

  it('renders visual aids with textual alternatives and interactive regrouping', async () => {
    const wrapper = mount(MathQuestVisual, {
      props: { visual: { type: 'array', rows: 3, columns: 5 } },
    })
    expect(wrapper.findAll('.math-array span')).toHaveLength(15)
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('3行，每行5个圆点')
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.findAll('button')[1]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('.math-array span')).toHaveLength(15)
    wrapper.unmount()
    for (const bundle of bundles)
      for (const stage of createMathQuest(bundle)!.stages) {
        const v = stage.visual
        if (v?.type === 'ruler')
          expect(v.end > v.start && v.start >= 0 && v.end <= v.max).toBe(true)
        if (v?.type === 'array')
          expect(v.rows >= 1 && v.rows <= 9 && v.columns >= 1 && v.columns <= 9).toBe(true)
      }
  })

  it('uses a keypad, retries incorrect calculations, and isolates page-local progress by profile', async () => {
    const quest = createMathQuest(bundles[0]!)!
    const wrapper = mount(ReadingQuest, { props: { quest, profileId: 'child-A' } })
    const click = async (name: string) => {
      const button = wrapper.findAll('button').find((b) => b.text() === name)
      expect(button, name).toBeTruthy()
      await button!.trigger('click')
    }
    expect(wrapper.text()).toContain('学会一个方法')
    expect(wrapper.get('button[aria-label="第2关，方法侦探"]').attributes('disabled')).toBeDefined()
    await click('3')
    await click('1')
    await click('检查答案')
    expect(wrapper.text()).toContain('还差一点点')
    await click('退一格')
    await click('2')
    await click('检查答案')
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('1')
    expect(
      wrapper.get('button[aria-label="第2关，方法侦探"]').attributes('disabled'),
    ).toBeUndefined()
    await wrapper.setProps({ profileId: 'child-B' })
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.get('input[inputmode="numeric"]').element.value).toBe('')
    await wrapper.get('input[inputmode="numeric"]').setValue('３２')
    await wrapper.get('input[inputmode="numeric"]').trigger('keydown.enter')
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('1')
    await wrapper.setProps({ quest: createMathQuest(bundles[1]!)! })
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('0')
    wrapper.unmount()
  })
})
