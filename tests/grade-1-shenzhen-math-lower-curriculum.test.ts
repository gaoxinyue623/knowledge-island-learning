import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import LowerMathVisual from '@/components/knowledge-point/LowerMathVisual.vue'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import { productionConfig } from '@/config/production'
import {
  curriculumData,
  G1_PEP_CHINESE_GRADE_ID,
  G2_PEP_CHINESE_GRADE_ID,
  G1_SHENZHEN_REGION_ID,
  G1_PEP_CHINESE_GUANGDONG_REGION_ID,
  G1_PEP_CHINESE_HUBEI_REGION_ID,
  G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
} from '@/data/curriculum'
import {
  gradeOneShenzhenMathLowerCurriculum as book,
  gradeOneShenzhenMathLowerDefinitions as definitions,
  G1_SHENZHEN_MATH_S2_TEXTBOOK_ID as bookId,
} from '@/data/curriculum/grade-1/math-bnu-lower'
import { G1_SHENZHEN_MATH_S1_TEXTBOOK_ID as upperId } from '@/data/curriculum/grade-1/math-bnu-upper'
import { candidateG1ShenzhenMathLowerContentExpansionBundles as bundles } from '@/data/content-expansion/g1-shenzhen-math-lower'
import { makeNumberGrid, TANGRAM_PIECES } from '@/data/content-expansion/math-lower-visuals'
import { isMathPilotTextbook } from '@/data/curriculum/pilot'
import { MockCurriculumService } from '@/services/adapters/mock/curriculumMockAdapter'
import { StaticContentExpansionRepository } from '@/services/content-expansion/contentExpansionRepository'
import { createLowerMathQuest } from '@/services/content-expansion/lowerMathQuest'
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
  semesterId: 'SEMESTER_LOWER',
}
const questAt = (lesson: number) => createLowerMathQuest(bundles[lesson - 1]!)!
const stageAt = (lesson: number, stage = 1) =>
  questAt(lesson).stages[stage - 1] as QuestQuestionStage
afterEach(() => resetCurriculumStoreDependencies())

describe('Shenzhen G1 BNU math lower integration', () => {
  it('preserves supplied chapter order, adds 40 unique nodes and validates the merged graph', () => {
    expect(book.units.map((u) => u.title)).toEqual([
      '第一单元 · 20以内数与加法',
      '第二单元 · 图形大变身（一）',
      '综合实践 · 设计教室装饰图',
      '第三单元 · 20以内数与减法',
      '第四单元 · 100以内数的认识',
      '数学好玩 · 填数游戏',
      '第五单元 · 100以内数加与减（一）',
      '第六单元 · 有趣的平面图形（一）',
      '综合实践 · 画数学连环画',
      '总复习 · 数学方法串起来',
    ])
    for (const records of [
      definitions,
      book.lessons,
      book.knowledgePoints,
      book.courseContents,
      bundles,
    ])
      expect(records).toHaveLength(40)
    expect(new Set(definitions.map((d) => d.knowledgePointId)).size).toBe(40)
    expect(book.textbooks[0]).toMatchObject({
      id: bookId,
      gradeId: context.gradeId,
      semesterId: 'SEMESTER_LOWER',
    })
    expect(isMathPilotTextbook(bookId)).toBe(true)
    const report = validateCurriculumData(curriculumData)
    expect(report.valid, report.errors.join('; ')).toBe(true)
  })

  it('offers math and English across regions while isolating grade and semester', async () => {
    const result = await service.resolveAvailableTextbooks(context)
    expect(result.math.availableTextbooks.map((t) => t.id)).toEqual([bookId])
    expect(result.english.availableTextbooks.map((t) => t.id)).toEqual([
      G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
    ])
    for (const other of [
      { ...context, regionId: G1_PEP_CHINESE_GUANGDONG_REGION_ID },
      { ...context, regionId: G1_PEP_CHINESE_HUBEI_REGION_ID },
    ])
      expect(
        (await service.resolveAvailableTextbooks(other)).math.availableTextbooks.map((b) => b.id),
      ).toEqual([bookId])
    expect(
      (await service.resolveAvailableTextbooks({ ...context, gradeId: G2_PEP_CHINESE_GRADE_ID }))
        .math.availableTextbooks,
    ).toEqual([])
    expect(
      (
        await service.resolveAvailableTextbooks({ ...context, semesterId: 'SEMESTER_UPPER' })
      ).math.availableTextbooks.map((t) => t.id),
    ).toEqual([upperId])
  })

  it('allows math-only or existing English-only profiles and resets textbook choices across semesters', async () => {
    setActivePinia(createPinia())
    configureCurriculumStore({ curriculumService: service })
    const store = useCurriculumStore()
    store.setContext(context)
    await store.resolveTextbooks()
    expect(store.draftIsComplete).toBe(false)
    expect(store.selectTextbook('MATH', upperId)).toBe(false)
    expect(store.selectTextbook('MATH', bookId)).toBe(true)
    expect(store.draftIsComplete).toBe(true)
    store.setProfile({
      ...context,
      studentId: 'lower-test',
      chineseTextbookVersionId: null,
      mathTextbookVersionId: null,
      englishTextbookVersionId: G1_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
      confirmedAt: '2026-09-05T00:00:00Z',
      source: 'USER_CONFIRMED',
    })
    expect(store.isComplete).toBe(true)
    expect(store.mathTextbookVersionId).toBeNull()
    store.selectSemester('SEMESTER_UPPER')
    expect(store.mathTextbookVersionId).toBeNull()
    await store.resolveTextbooks()
    expect(store.selectTextbook('MATH', bookId)).toBe(false)
    expect(store.selectTextbook('MATH', upperId)).toBe(true)
    store.selectSemester('SEMESTER_LOWER')
    expect(store.mathTextbookVersionId).toBeNull()
  })

  it('loads 10 islands, 40 lessons and 40 investigations through existing repositories', async () => {
    const source = await service.getLearningMapCurriculum(bookId)
    const map = buildLearningMapViewModel(source!)
    expect(map.islands).toHaveLength(10)
    expect(flattenKnowledgeNodes(map.islands)).toHaveLength(40)
    const repository = new MockLearningContentRepository({ accessPolicy })
    for (const [i, d] of definitions.entries()) {
      const content = await repository.getByKnowledgePoint(d.knowledgePointId)
      expect(content?.lessonId).toBe(d.lessonId)
      expect(content?.blocks[0]?.block.text).toContain(d.explanation)
      expect(bundles[i]!.extensionActivities).toHaveLength(1)
      expect(validateExtensionActivity(bundles[i]!.extensionActivities[0]).success).toBe(true)
    }
  })

  it('separates the user outline from original exercises without promoting the production guard', async () => {
    expect(book.sources[0]!.notes).toContain('非逐页课本全文')
    expect(book.textbooks[0]!.verificationStatus).toBe('UNVERIFIED')
    const repository = new StaticContentExpansionRepository()
    for (const b of bundles) {
      expect((await repository.getBundle(b.knowledgePointId, 'candidate'))?.textbookId).toBe(bookId)
      expect(await repository.getBundle(b.knowledgePointId, 'profile')).toBeNull()
      expect(b.learningContent.isSample).toBe(false)
      expect(b.learningContent.sourceId).not.toBe(book.courseContents[0]!.sourceId)
    }
    const original = productionConfig.allowUnreviewedQuestions
    try {
      productionConfig.allowUnreviewedQuestions = false
      expect(createLowerMathQuest(bundles[0]!)).toBeNull()
    } finally {
      productionConfig.allowUnreviewedQuestions = original
    }
    for (const changes of [
      { textbookId: upperId },
      { unitId: 'OTHER' },
      { lessonId: 'OTHER' },
      { knowledgePointId: 'OTHER' },
    ])
      expect(createLowerMathQuest({ ...bundles[0]!, ...changes })).toBeNull()
    for (const changes of [
      { sourceId: 'OTHER' },
      { isSample: true },
      { lessonId: 'OTHER' },
      { knowledgePointId: 'OTHER' },
    ])
      expect(
        createLowerMathQuest({
          ...bundles[0]!,
          learningContent: { ...bundles[0]!.learningContent, ...changes },
        }),
      ).toBeNull()
  })
})

describe('Lower math exercise correctness and boundaries', () => {
  it('generates 320 deterministic varied schema-valid stages without mutating data', () => {
    const before = JSON.stringify(bundles)
    const ids: string[] = []
    for (const b of bundles) {
      const quest = createLowerMathQuest(b)!
      expect(quest).toEqual(createLowerMathQuest(b))
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
        expect(s.hint).toBeTruthy()
        expect(s.explanation).toBeTruthy()
        if (s.visual?.type === 'abacus') {
          expect(s.visual.places).toBe(s.visual.value === 100 ? 3 : 2)
        }
        if (s.kind === 'question') {
          const result = validateQuestion(s.question, {
            sourceIds: new Set(curriculumData.sources.map((s) => s.id)),
            knowledgePointIds: new Set(book.knowledgePoints.map((k) => k.id)),
          })
          expect(result.valid, result.issues.join('; ')).toBe(true)
          expect(checkQuestAnswer(s.question, emptyQuestDraft(s.question))).toBe('incomplete')
          expect(checkQuestAnswer(s.question, correctAnswerDraft(s.question))).toBe('correct')
          expect(s.question.sourceId).toBe(b.learningContent.sourceId)
          expect(s.question.difficulty).toBe('FOUNDATION')
          if (s.question.answerRule.ruleType === 'NUMERIC') {
            expect(s.question.answerRule.value).toBeGreaterThanOrEqual(0)
            expect(s.question.answerRule.value).toBeLessThanOrEqual(100)
          }
          if (s.tiles) expect(new Set(s.tiles).size).toBe(s.tiles.length)
        } else {
          expect(validateInteractiveActivity(s.activity).success, s.id).toBe(true)
          if (s.activity.activityType === 'drag_match')
            expect(new Set(s.activity.config.targets.map((t) => t.label)).size).toBe(
              s.activity.config.targets.length,
            )
        }
      }
    }
    expect(ids).toHaveLength(320)
    expect(new Set(ids).size).toBe(320)
    expect(JSON.stringify(bundles)).toBe(before)
  })

  it('checks independently calculated answers, including comparison questions with different unknowns', () => {
    const cases = [
      [1, 1, 14],
      [2, 1, 15],
      [3, 1, 14],
      [4, 1, 14],
      [5, 1, 12],
      [6, 1, 13],
      [11, 1, 6],
      [12, 1, 5],
      [13, 1, 7],
      [14, 1, 6],
      [15, 1, 8],
      [15, 3, 14],
      [16, 1, 9],
      [17, 1, 30],
      [18, 1, 100],
      [19, 1, 53],
      [22, 1, 3],
      [23, 1, 2],
      [24, 1, 50],
      [25, 1, 29],
      [26, 1, 21],
      [27, 1, 54],
      [28, 1, 59],
      [29, 1, 15],
      [30, 1, 27],
      [30, 2, 20],
      [30, 3, 4],
      [30, 7, 24],
      [30, 8, 23],
      [37, 1, 8],
      [38, 1, 15],
      [39, 1, 45],
    ]
    for (const [lesson, stage, expected] of cases) {
      const q = stageAt(lesson!, stage!).question
      if (q.questionType === 'calculation') {
        expect(q.answerRule, q.id).toMatchObject({ ruleType: 'NUMERIC', value: expected })
        expect(checkQuestAnswer(q, { type: 'calculation', value: String(expected) })).toBe(
          'correct',
        )
        expect(checkQuestAnswer(q, { type: 'calculation', value: String(expected! + 1) })).toBe(
          'incorrect',
        )
      } else {
        expect(q.answerRule, q.id).toMatchObject({
          ruleType: 'TEXT_BLANKS',
          blanks: [{ acceptedAnswers: [String(expected)] }],
        })
        expect(checkQuestAnswer(q, { type: 'fillBlank', values: [String(expected)] })).toBe(
          'correct',
        )
        expect(checkQuestAnswer(q, { type: 'fillBlank', values: [String(expected! + 1)] })).toBe(
          'incorrect',
        )
      }
    }
  })

  it('keeps unit 5 calculations, including matching and explanations, free of carry and borrow', () => {
    let checked = 0
    for (const [i, d] of definitions.entries()) {
      if (d.unitIndex !== 6) continue
      const text = JSON.stringify(questAt(i + 1).stages) + d.explanation
      for (const [, left, sign, right] of text.matchAll(/(\d+)([＋－])(\d+)/g)) {
        const a = Number(left),
          b = Number(right)
        checked++
        if (sign === '＋') {
          expect((a % 10) + (b % 10), left + sign + right).toBeLessThan(10)
          expect(a + b).toBeLessThanOrEqual(100)
        } else {
          expect(a % 10, left + sign + right).toBeGreaterThanOrEqual(b % 10)
          expect(a - b).toBeGreaterThanOrEqual(0)
        }
      }
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('bounds early arithmetic to 20 and makes bridge examples genuine carry/borrow problems', () => {
    for (const [i, d] of definitions.entries()) {
      if (![0, 3].includes(d.unitIndex) && d.family !== 'review20') continue
      for (const s of questAt(i + 1).stages) {
        if (s.kind === 'question' && s.question.answerRule.ruleType === 'NUMERIC')
          expect(s.question.answerRule.value).toBeLessThanOrEqual(20)
        if (s.kind === 'question' && s.tiles)
          for (const n of s.tiles.filter((n) => /^\d+$/.test(n)))
            expect(Number(n)).toBeLessThanOrEqual(20)
        if (s.visual?.type === 'ten-bridge') {
          const { a, b, operation } = s.visual
          if (operation === 'add') {
            expect(a).toBeLessThan(10)
            expect(b).toBeLessThan(10)
            expect(a + b).toBeGreaterThan(10)
            expect(a + b).toBeLessThanOrEqual(20)
          } else {
            expect(a).toBeGreaterThan(10)
            expect(a).toBeLessThan(20)
            expect(b).toBeGreaterThan(a % 10)
            expect(b).toBeLessThan(10)
          }
        }
      }
    }
    expect(stageAt(15, 6).question.answerRule).toMatchObject({
      ruleType: 'BOOLEAN',
      correctValue: false,
    })
    expect(stageAt(34, 6).question.answerRule).toMatchObject({
      ruleType: 'BOOLEAN',
      correctValue: false,
    })
    for (const d of definitions.filter((d) => d.unitIndex === 1))
      expect(d.explanation).not.toContain('必须记住图形名称')
  })

  it('has exactly one valid blank answer for every grid using row/column rules only', () => {
    for (let shift = 0; shift < 3; shift++)
      for (let blank = 0; blank < 9; blank++) {
        const { cells, answer } = makeNumberGrid(shift, blank)
        const solutions = [1, 2, 3].filter((candidate) => {
          const grid = cells.map((x) => x ?? candidate)
          return [0, 1, 2].every(
            (i) =>
              new Set(grid.slice(i * 3, i * 3 + 3)).size === 3 &&
              new Set([grid[i], grid[i + 3], grid[i + 6]]).size === 3,
          )
        })
        expect(solutions).toEqual([answer])
        expect(cells.filter((x) => x === null)).toHaveLength(1)
      }
    for (const lesson of [22, 23])
      for (const s of questAt(lesson).stages)
        if (s.visual?.type === 'number-grid') {
          expect([...(s as QuestQuestionStage).tiles!].sort()).toEqual(['1', '2', '3'])
          const blank = s.visual.cells.indexOf(null),
            row = Math.floor(blank / 3)
          const expected = [1, 2, 3].find(
            (n) =>
              !s.visual ||
              s.visual.type !== 'number-grid' ||
              !s.visual.cells.slice(row * 3, row * 3 + 3).includes(n),
          )!
          expect((s as QuestQuestionStage).question.answerRule).toMatchObject({
            blanks: [{ acceptedAnswers: [String(expected)] }],
          })
        }
  })
})

type Point = readonly [number, number]
function area(points: readonly Point[]) {
  return (
    Math.abs(
      points.reduce((sum, [x, y], i) => {
        const next = points[(i + 1) % points.length]!
        return sum + x * next[1] - y * next[0]
      }, 0),
    ) / 2
  )
}

describe('Lower math interactive diagrams', () => {
  it('preserves the exact seven-piece geometry, with full coverage and no interior overlap', () => {
    expect(TANGRAM_PIECES.map((p) => area(p.points)).sort((a, b) => a - b)).toEqual([
      1, 1, 2, 2, 2, 4, 4,
    ])
    expect(TANGRAM_PIECES.filter((p) => p.points.length === 3)).toHaveLength(5)
    for (const p of TANGRAM_PIECES) {
      expect(p.points.every(([x, y]) => x >= 0 && x <= 4 && y >= 0 && y <= 4)).toBe(true)
      if (p.shape === 'square') {
        const edges = p.points.map(([x, y], i) => {
          const next = p.points[(i + 1) % 4]!
          return [next[0] - x, next[1] - y] as const
        })
        expect(new Set(edges.map(([x, y]) => x * x + y * y)).size).toBe(1)
        expect(edges[0]![0] * edges[1]![0] + edges[0]![1] * edges[1]![1]).toBe(0)
      }
    }
    for (let x = 0.017; x < 4; x += 0.1)
      for (let y = 0.031; y < 4; y += 0.1) {
        const covering = TANGRAM_PIECES.filter((p) => {
          const crosses = p.points.map(([ax, ay], i) => {
            const [bx, by] = p.points[(i + 1) % p.points.length]!
            return (bx - ax) * (y - ay) - (by - ay) * (x - ax)
          })
          return crosses.every((n) => n > 0) || crosses.every((n) => n < 0)
        })
        expect(covering, `point ${x},${y}`).toHaveLength(1)
      }
    expect(questAt(36).stages[3]?.visual?.type).toBe('tangram')
  })

  it('keeps 9+5 counters unchanged during regrouping and removes exactly 9 from 15', async () => {
    const wrapper = mount(LowerMathVisual, {
      props: { visual: { type: 'ten-bridge', a: 9, b: 5, operation: 'add' } },
    })
    const counts = () =>
      wrapper.findAll('.lower-ten-frame').map((f) => f.findAll('.has-dot').length)
    expect(counts()).toEqual([9, 5])
    await wrapper.get('.lower-math-visual__tools button').trigger('click')
    expect(counts()).toEqual([10, 4])
    expect(wrapper.findAll('.has-dot.is-second')).toHaveLength(5)
    await wrapper.setProps({ visual: { type: 'ten-bridge', a: 15, b: 9, operation: 'subtract' } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    expect(counts()).toEqual([10, 5])
    await wrapper.get('button').trigger('click')
    expect(wrapper.findAll('.is-removed')).toHaveLength(9)
    expect(wrapper.findAll('.has-dot:not(.is-removed)')).toHaveLength(6)
    expect(wrapper.findAll('.lower-ten-frame')[1]!.findAll('.is-removed')).toHaveLength(0)
    wrapper.unmount()
  })

  it('shows zero placeholders, row/column labels, aligned digits and rotated shape descriptions', async () => {
    const wrapper = mount(LowerMathVisual, {
      props: { visual: { type: 'abacus', value: 100, places: 3 } },
    })
    expect(wrapper.findAll('.lower-abacus > div > span').map((x) => x.text())).toEqual([
      '1',
      '0',
      '0',
    ])
    expect(wrapper.findAll('.lower-abacus__rod i')).toHaveLength(1)
    await wrapper.setProps({ visual: { type: 'abacus', value: 50, places: 2 } })
    expect(wrapper.findAll('.lower-abacus > div > span').map((x) => x.text())).toEqual(['5', '0'])
    await wrapper.setProps({ visual: { type: 'number-grid', cells: makeNumberGrid(0, 4).cells } })
    expect(wrapper.findAll('td')).toHaveLength(9)
    expect(wrapper.get('.is-blank').attributes('aria-label')).toBe('第2行第2列：待填写')
    await wrapper.setProps({
      visual: { type: 'column-calculation', a: 34, b: 25, operation: 'add' },
    })
    expect(wrapper.findAll('th').map((x) => x.text())).toEqual(['运算', '十位', '个位'])
    expect(
      wrapper
        .findAll('tbody tr')[0]!
        .findAll('td')
        .map((x) => x.text()),
    ).toEqual(['', '3', '4'])
    expect(
      wrapper
        .findAll('tbody tr')[1]!
        .findAll('td')
        .map((x) => x.text()),
    ).toEqual(['＋', '2', '5'])
    await wrapper.setProps({
      visual: { type: 'plane-cards', shapes: ['square', 'parallelogram'], rotated: true },
    })
    expect(wrapper.findAll('svg[role="img"]')).toHaveLength(2)
    expect(
      wrapper.findAll('svg g').every((g) => g.attributes('transform')?.includes('rotate(35')),
    ).toBe(true)
    expect(wrapper.findAll('svg')[0]!.attributes('aria-label')).toContain('四边等长、四个直角')
    wrapper.unmount()
  })

  it('reassembles paper by moving, not resizing it, and resets when changing aid', async () => {
    const wrapper = mount(LowerMathVisual, {
      props: { visual: { type: 'paper-change', mode: 'join' } },
    })
    const areas = () =>
      wrapper.findAll('polygon').map((p) =>
        area(
          p
            .attributes('points')!
            .split(' ')
            .map((v) => v.split(',').map(Number) as [number, number]),
        ),
      )
    expect(areas()).toEqual([9800, 9800])
    await wrapper.get('button').trigger('click')
    expect(areas()).toEqual([9800, 9800])
    expect(wrapper.get('svg').attributes('aria-label')).toContain('没有空隙和重叠')
    await wrapper.setProps({ visual: { type: 'paper-change', mode: 'fold' } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('rect').attributes('width')).toBe('80')
    await wrapper.setProps({ visual: { type: 'tangram' } })
    expect(wrapper.findAll('polygon')).toHaveLength(7)
    expect(wrapper.get('summary').text()).toContain('形状线索')
    wrapper.unmount()
  })

  it('supports keypad retry and isolates visual assistance, answers and progress by profile/course', async () => {
    const wrapper = mount(ReadingQuest, { props: { quest: questAt(3), profileId: 'A' } })
    const click = async (label: string) => {
      const button = wrapper.findAll('button').find((b) => b.text() === label)
      expect(button, label).toBeTruthy()
      await button!.trigger('click')
    }
    await click('看看怎样凑十')
    await click('1')
    await click('3')
    await click('检查答案')
    expect(wrapper.text()).toContain('还差一点点')
    await click('清空')
    await click('1')
    await click('4')
    await click('检查答案')
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('1')
    await wrapper.setProps({ profileId: 'B' })
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.get('.lower-math-visual__tools button').attributes('aria-pressed')).toBe('false')
    await click('看看怎样凑十')
    await wrapper.setProps({ quest: questAt(11) })
    expect(wrapper.get('.lower-math-visual__tools button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[aria-label="本次闯关进度"]').attributes('aria-valuenow')).toBe('0')
    wrapper.unmount()
  })
})
