import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import EarlyMathVisual from '@/components/knowledge-point/EarlyMathVisual.vue'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { productionConfig } from '@/config/production'
import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G2_PEP_CHINESE_GRADE_ID,
  G1_SHENZHEN_REGION_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
} from '@/data/curriculum'
import {
  gradeOneShenzhenMathUpperCurriculum as book,
  gradeOneShenzhenMathUpperDefinitions as definitions,
  G1_SHENZHEN_MATH_S1_TEXTBOOK_ID as bookId,
} from '@/data/curriculum/grade-1/math-bnu-upper'
import { G2_SHENZHEN_MATH_S1_TEXTBOOK_ID } from '@/data/curriculum/grade-2/math-bnu-upper'
import { candidateG1ShenzhenMathUpperContentExpansionBundles as bundles } from '@/data/content-expansion/g1-shenzhen-math-upper'
import { isMathPilotTextbook } from '@/data/curriculum/pilot'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import { createEarlyMathQuest } from '@/services/content-expansion/earlyMathQuest'
import {
  createReadingQuest,
  checkQuestAnswer,
  emptyQuestDraft,
} from '@/services/content-expansion/readingQuest'
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
  gradeId: G1_PEP_CHINESE_GRADE_ID,
  semesterId: 'SEMESTER_UPPER',
}
afterEach(() => resetCurriculumStoreDependencies())
const stageAt = (lesson: number, stage = 1) =>
  createEarlyMathQuest(bundles[lesson - 1]!)!.stages[stage - 1] as QuestQuestionStage

describe('Shenzhen grade 1 BNU math upper integration', () => {
  it('maps the five units, introduction, two projects, games and review in supplied order', () => {
    expect(book.units.map((u) => u.title)).toEqual([
      '我上学啦',
      '第一单元 · 生活中的数',
      '第二单元 · 5以内数加与减',
      '综合实践 · 介绍我的教室',
      '第三单元 · 整理与分类',
      '第四单元 · 10以内数加与减',
      '数学好玩 · 一起做游戏',
      '第五单元 · 有趣的立体图形',
      '综合实践 · 记录我的一天',
      '总复习 · 我会用数学',
    ])
    expect(definitions).toHaveLength(35)
    for (const records of [
      book.lessons,
      book.knowledgePoints,
      book.courseContents,
      book.lessonKnowledgePointRelations,
    ])
      expect(records).toHaveLength(35)
    expect(isMathPilotTextbook(bookId)).toBe(true)
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
  })

  it('offers the book across regions while isolating grade and semester', async () => {
    expect(
      (await service.resolveAvailableTextbooks(context)).math.availableTextbooks.map((b) => b.id),
    ).toEqual([bookId])
    const g2 = await service.resolveAvailableTextbooks({
      ...context,
      gradeId: G2_PEP_CHINESE_GRADE_ID,
    })
    expect(g2.math.availableTextbooks.map((b) => b.id)).toEqual([G2_SHENZHEN_MATH_S1_TEXTBOOK_ID])
    for (const other of [
      { ...context, regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID },
      { ...context, regionId: G1_PEP_CHINESE_HUBEI_REGION_ID },
    ])
      expect(
        (await service.resolveAvailableTextbooks(other)).math.availableTextbooks.map((b) => b.id),
      ).toEqual([bookId])
    expect(
      (
        await service.resolveAvailableTextbooks({ ...context, semesterId: 'SEMESTER_LOWER' })
      ).math.availableTextbooks.map((b) => b.id),
    ).toEqual(['G1_SHENZHEN_BNU_MATH_S2_2024_CANDIDATE'])
  })

  it('accepts G1 math or existing English-only selection, resets on grade and semester changes', async () => {
    setActivePinia(createPinia())
    configureCurriculumStore({ curriculumService: service })
    const store = useCurriculumStore()
    store.setContext(context)
    await store.resolveTextbooks()
    expect(store.draftIsComplete).toBe(false)
    expect(store.selectTextbook('MATH', G2_SHENZHEN_MATH_S1_TEXTBOOK_ID)).toBe(false)
    expect(store.selectTextbook('MATH', bookId)).toBe(true)
    expect(store.draftIsComplete).toBe(true)
    store.setProfile({
      ...context,
      studentId: 'g1-test',
      chineseTextbookVersionId: null,
      mathTextbookVersionId: null,
      englishTextbookVersionId: G1_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID,
      confirmedAt: '2026-09-05T00:00:00Z',
      source: 'USER_CONFIRMED',
    })
    expect(store.isComplete).toBe(true)
    store.selectGrade(G2_PEP_CHINESE_GRADE_ID)
    expect(store.mathTextbookVersionId).toBeNull()
    await store.resolveTextbooks()
    expect(store.selectTextbook('MATH', bookId)).toBe(false)
    store.selectSemester('SEMESTER_LOWER')
    expect(store.draftIsComplete).toBe(false)
  })

  it('loads 35 lesson explanations and 10 islands through the existing map and lesson boundaries', async () => {
    const source = await service.getLearningMapCurriculum(bookId)
    expect(source?.textbook.subject).toBe('MATH')
    const map = buildLearningMapViewModel(source!)
    expect(map.islands).toHaveLength(10)
    expect(flattenKnowledgeNodes(map.islands)).toHaveLength(35)
    const repository = new MockLearningContentRepository({ accessPolicy })
    for (const d of definitions) {
      const content = await repository.getByKnowledgePoint(d.knowledgePointId)
      expect(content?.lessonId).toBe(d.lessonId)
      expect(content?.blocks[0]?.block.text).toContain(d.explanation)
    }
  })

  it('separates user-outline source, original practice and production review', async () => {
    expect(book.sources[0]!.notes).toContain('非逐页课本全文')
    expect(book.textbooks[0]!.verificationStatus).toBe('UNVERIFIED')
    const repository = new StaticContentExpansionRepository()
    for (const b of bundles) {
      expect((await repository.getBundle(b.knowledgePointId, 'candidate'))?.textbookId).toBe(bookId)
      expect(b.learningContent.isSample).toBe(false)
      expect(b.learningContent.sourceId).not.toBe(book.courseContents[0]!.sourceId)
      expect(validateExtensionActivity(b.extensionActivities[0]).success).toBe(true)
      expect(await repository.getBundle(b.knowledgePointId, 'profile')).toBeNull()
    }
    const original = productionConfig.allowUnreviewedQuestions
    try {
      productionConfig.allowUnreviewedQuestions = false
      expect(createEarlyMathQuest(bundles[0]!)).toBeNull()
    } finally {
      productionConfig.allowUnreviewedQuestions = original
    }
    for (const changes of [
      { textbookId: 'OTHER' },
      { unitId: 'OTHER' },
      { lessonId: 'OTHER' },
      { knowledgePointId: 'OTHER' },
    ])
      expect(createEarlyMathQuest({ ...bundles[0]!, ...changes })).toBeNull()
    for (const changes of [
      { isSample: true },
      { sourceId: 'OTHER' },
      { knowledgePointId: 'OTHER' },
      { lessonId: 'OTHER' },
    ])
      expect(
        createEarlyMathQuest({
          ...bundles[0]!,
          learningContent: { ...bundles[0]!.learningContent, ...changes },
        }),
      ).toBeNull()
  })

  it('uses whole/part meaning and pose-dependent solids, without claiming orientation tricks', () => {
    expect(definitions[18]!.explanation).toContain('不只记问号在上面还是下面')
    expect(definitions[27]!.explanation).toContain('摆放方式')
    expect(definitions[26]!.explanation).toContain('有的长方体也有正方形的面')
    expect(definitions[30]!.discoveryAnswer).toContain('不要求计算时刻或时长')
  })
})

describe('G1 interactive math exercise quality', () => {
  it('generates 280 stable, varied stages with schema-valid, solvable answers and no bundle mutation', () => {
    const before = JSON.stringify(bundles)
    const ids: string[] = []
    for (const b of bundles) {
      const quest = createEarlyMathQuest(b)!
      expect(quest).toEqual(createEarlyMathQuest(b))
      expect(quest).toEqual(
        createReadingQuest({ bundle: b, title: b.learningContent.title, text: '知识讲解' }),
      )
      expect(quest.stages).toHaveLength(8)
      expect(
        new Set(
          quest.stages.map((s) =>
            s.kind === 'question' ? s.question.questionType : s.activity.activityType,
          ),
        ).size,
      ).toBeGreaterThanOrEqual(4)
      for (const s of quest.stages) {
        ids.push(s.id)
        expect(s.explanation).toBeTruthy()
        expect(s.hint).toBeTruthy()
        if (s.kind === 'question') {
          const result = validateQuestion(s.question, {
            sourceIds: new Set(curriculumData.sources.map((s) => s.id)),
            knowledgePointIds: new Set(book.knowledgePoints.map((k) => k.id)),
          })
          expect(result.valid, result.issues.join('; ')).toBe(true)
          expect(checkQuestAnswer(s.question, emptyQuestDraft(s.question))).toBe('incomplete')
          expect(checkQuestAnswer(s.question, correctAnswerDraft(s.question))).toBe('correct')
          expect(s.question.difficulty).toBe('FOUNDATION')
          expect(s.question.sourceId).toBe(b.learningContent.sourceId)
          if (s.question.answerRule.ruleType === 'NUMERIC')
            expect(s.question.answerRule.value).toBeGreaterThanOrEqual(0)
          if (s.question.answerRule.ruleType === 'NUMERIC')
            expect(s.question.answerRule.value).toBeLessThanOrEqual(10)
          if (s.tiles) expect(s.tiles.every((t) => /^(10|[0-9]|[＞＜＝])$/.test(t))).toBe(true)
          expect(s.question.stem[0]?.text).not.toMatch(/乘法|除法|进位|退位|时长|秒|×|÷/)
        } else {
          expect(validateInteractiveActivity(s.activity).success, s.id).toBe(true)
          if (s.activity.activityType === 'drag_match')
            expect(new Set(s.activity.config.targets.map((t) => t.label)).size).toBe(
              s.activity.config.targets.length,
            )
        }
        if (s.visual?.type === 'counters') {
          expect(s.visual.first + (s.visual.second ?? 0)).toBeLessThanOrEqual(10)
          expect(s.visual.first - (s.visual.removed ?? 0)).toBeGreaterThanOrEqual(0)
        }
      }
    }
    expect(ids).toHaveLength(280)
    expect(new Set(ids).size).toBe(280)
    expect(JSON.stringify(bundles)).toBe(before)
  })

  it.each([
    [2, 1, 4],
    [5, 1, 0],
    [9, 1, 5],
    [10, 1, 3],
    [11, 1, 4],
    [11, 3, 0],
    [17, 1, 4],
    [21, 1, 6],
    [24, 1, 7],
    [35, 7, 2],
  ])('checks independent numeric card answer for lesson %i stage %i', (lesson, stage, answer) => {
    const q = stageAt(lesson, stage).question
    expect(q.answerRule).toMatchObject({
      ruleType: 'TEXT_BLANKS',
      blanks: [{ blankId: 'answer', acceptedAnswers: [String(answer)] }],
    })
    expect(checkQuestAnswer(q, { type: 'fillBlank', values: [String(answer)] })).toBe('correct')
    expect(checkQuestAnswer(q, { type: 'fillBlank', values: [String(answer + 1)] })).toBe(
      'incorrect',
    )
  })

  it('keeps unit 2 operands, results, distractors and matching cards within 0–5', () => {
    for (const d of definitions.filter((d) => d.unitIndex === 2)) {
      const b = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
      for (const stage of createEarlyMathQuest(b)!.stages) {
        const texts =
          stage.kind === 'question'
            ? [
                ...stage.question.stem.map((x) => x.text ?? ''),
                ...(stage.tiles ?? []),
                ...(stage.question.options?.flatMap((o) => o.content.map((x) => x.text ?? '')) ??
                  []),
                stage.explanation,
              ]
            : [stage.activity.instruction, stage.explanation]
        const numbers = texts.join(' ').match(/\d+/g) ?? []
        expect(
          numbers.every((n) => Number(n) <= 5),
          JSON.stringify(texts),
        ).toBe(true)
      }
    }
  })

  it('requires all correct comparison choices, not extra or duplicate selections', () => {
    const q = stageAt(7, 2).question
    expect(q.answerRule.ruleType).toBe('MULTIPLE_OPTIONS')
    expect(
      checkQuestAnswer(q, { type: 'multipleChoice', optionIds: q.options!.map((o) => o.id) }),
    ).toBe('incorrect')
    expect(stageAt(7, 1).tiles).toEqual(expect.arrayContaining(['＞', '＜', '＝']))
    expect(stageAt(7, 8).question.answerRule).toMatchObject({
      blanks: [{ acceptedAnswers: ['＜'] }],
    })
  })

  it('lets counters be marked/unmarked, never counts removed or empty slots, and resets with visual', async () => {
    const wrapper = mount(EarlyMathVisual, {
      props: { visual: { type: 'counters', first: 5, removed: 2 } },
    })
    expect(wrapper.findAll('button')).toHaveLength(3)
    expect(wrapper.findAll('.is-removed')).toHaveLength(2)
    expect(wrapper.findAll('.early-ten-frame__empty')).toHaveLength(5)
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.get('[role="status"]').text()).toBe('已标记 1 个')
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.get('[role="status"]').text()).toBe('已标记 0 个')
    await wrapper.findAll('button')[1]!.trigger('click')
    await wrapper.setProps({ visual: { type: 'counters', first: 0 } })
    expect(wrapper.get('[role="status"]').text()).toBe('已标记 0 个')
    expect(wrapper.findAll('button')).toHaveLength(0)
    wrapper.unmount()
  })

  it('renders all six G1 aids with text alternatives including perspective solids', () => {
    const solids = mount(EarlyMathVisual, {
      props: { visual: { type: 'solids', shapes: ['cube', 'cuboid', 'cylinder', 'sphere'] } },
    })
    expect(solids.findAll('svg[role="img"]')).toHaveLength(4)
    expect(solids.findAll('svg[role="img"]')[0]!.attributes('aria-label')).toContain('立体透视图')
    solids.unmount()
    const grouping = mount(EarlyMathVisual, { props: { visual: { type: 'classification' } } })
    expect(grouping.text()).toContain('蓝色圆形')
    expect(grouping.text()).toContain('黄色正方形')
    grouping.unmount()
    const position = mount(EarlyMathVisual, { props: { visual: { type: 'classroom' } } })
    expect(position.get('[role="img"]').attributes('aria-label')).toContain(
      '下排从左到右：书包、课桌、椅子',
    )
    position.unmount()
    const queue = mount(EarlyMathVisual, {
      props: { visual: { type: 'queue', labels: ['小兔', '小猫'] } },
    })
    expect(queue.findAll('li').map((x) => x.text())).toEqual(['小兔', '小猫'])
    queue.unmount()
    const part = mount(EarlyMathVisual, {
      props: { visual: { type: 'part-whole', total: 10, known: 4 } },
    })
    expect(part.get('[role="img"]').attributes('aria-label')).toBe('总数10，一部分4，另一部分未知')
    part.unmount()
  })

  it('supports wrong-answer retry with number cards, and isolates counters, answers and progress by profile', async () => {
    const wrapper = mount(ReadingQuest, {
      props: { quest: createEarlyMathQuest(bundles[1]!)!, profileId: 'A' },
    })
    const click = async (text: string) => {
      const button = wrapper.findAll('button').find((b) => b.text() === text)
      expect(button, text).toBeTruthy()
      await button!.trigger('click')
    }
    await wrapper.get('.early-counter').trigger('click')
    expect(wrapper.get('.early-visual__count[role="status"]').text()).toContain('已标记 1 个')
    await click('5')
    await click('检查答案')
    expect(wrapper.text()).toContain('还差一点点')
    await click('清空，重新选')
    await click('4')
    await click('检查答案')
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('1')
    await wrapper.setProps({ profileId: 'B' })
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.get('.early-visual__count').text()).toBe('已标记 0 个')
    expect(wrapper.findAll('.reading-quest__answer-slot button')).toHaveLength(0)
    await wrapper.get('.early-counter').trigger('click')
    await wrapper.setProps({ quest: createEarlyMathQuest(bundles[3]!)! })
    expect(wrapper.get('.early-visual__count').text()).toBe('已标记 0 个')
    wrapper.unmount()
  })
})
