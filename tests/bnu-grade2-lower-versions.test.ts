import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  bnuMathLowerCurriculum as added,
  bnuMathLowerLessons as definitions,
  bnuMathLowerQuestions,
  bnuMathLowerBundles,
  G2_BNU_MATH_S2_2013_TEXTBOOK_ID as oldBook,
  G2_BNU_MATH_S2_2024_TEXTBOOK_ID as newBook,
} from '@/data/curriculum/grade-2/bnu-lower'
import {
  BNU_MATH_LOWER_IMPORT_APPROVAL,
  BNU_MATH_LOWER_IMPORTED_AT,
} from '@/data/curriculum/production/bnuMathLowerApproval'
import {
  productionCurriculumIndex as catalog,
  productionCurriculumData,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { curriculumService } from '@/services/runtime'
import {
  QuestionEngineAdapter,
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { validateQuestion } from '@/services/validation/questionValidation'
import { questionSchema } from '@/services/validation/schemas'
import { reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic, createFormalGenerator } from '../server/llm/formalGeneration'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { selectAccount } from '@/services/account/storage'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import TextbookVersionSelector from '@/components/curriculum/TextbookVersionSelector.vue'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('edition_parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
const context = (d: (typeof definitions)[number]) => ({
  textbookId: d.textbookId,
  unitId: d.unitId,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  source: 'lesson_practice' as const,
})

describe('independent BNU grade 2 lower textbook versions', () => {
  it('preserves edition-specific contents, all supplied chapters, practices and independent IDs', () => {
    const old = definitions.filter((d) => d.textbookId === oldBook)
    const revised = definitions.filter((d) => d.textbookId === newBook)
    expect(old).toHaveLength(41)
    expect(revised).toHaveLength(37)
    expect(old.map((d) => d.title)).toEqual(
      expect.arrayContaining([
        '分苹果',
        '东南西北',
        '辨认方向',
        '练习一',
        '练习二',
        '练习三',
        '练习四',
        '练习五',
        '奥运开幕',
        '1分有多长',
        '淘气的作息时间',
        '上学时间',
        '“重复”的奥妙',
        '最喜欢的水果',
      ]),
    )
    expect(revised.map((d) => d.title)).toEqual(
      expect.arrayContaining([
        '谁的得分高',
        '去军营',
        '星星合唱队',
        '校园一角',
        '小蜗牛慢慢爬',
        '蜗牛的家',
        '分松果',
        '福建土楼',
        '数说西藏',
        '图形王国',
        '百变七巧板',
        '鱼菜共生',
        '美丽滇池',
        '怎样分组',
        '分扣子',
        '参加趣味运动会',
        '发现身体上的尺子',
        '有趣的推理',
      ]),
    )
    expect(
      revised.some((d) =>
        ['东南西北', '辨认方向', '奥运开幕', '1分有多长', '淘气的作息时间'].includes(d.title),
      ),
    ).toBe(false)
    const oldIds = new Set(
      old.flatMap((d) => [d.lessonId, d.knowledgePointId, ...d.questions.map((q) => q.id)]),
    )
    expect(
      revised
        .flatMap((d) => [d.lessonId, d.knowledgePointId, ...d.questions.map((q) => q.id)])
        .some((id) => oldIds.has(id)),
    ).toBe(false)
    expect(added.units.filter((u) => u.textbookVersionId === oldBook)).toHaveLength(11)
    expect(added.units.filter((u) => u.textbookVersionId === newBook)).toHaveLength(11)
    for (const source of catalog.contentSources.filter((s) => s.id.startsWith('G2_BNU_MATH_S2_'))) {
      expect(source.releaseApprovalId).toBe(BNU_MATH_LOWER_IMPORT_APPROVAL)
      expect(source.verifiedAt).toBe(BNU_MATH_LOWER_IMPORTED_AT)
    }
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    expect(catalog.textbooks).toHaveLength(40)
    expect(catalog.knowledgePoints).toHaveLength(1245)
  })

  it('loads all lessons, formal practice and reviewed AI sources for both accounts', async () => {
    const content = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['edition_parent', 'second_parent']) {
      selectAccount(account)
      for (const book of [oldBook, newBook]) {
        const map = (await curriculumService.getLearningMapCurriculum(book))!
        const view = buildLearningMapViewModel(map, [], { dataset: 'profile' })
        expect(flattenKnowledgeNodes(view.islands).length).toBe(book === oldBook ? 41 : 37)
      }
      for (const d of definitions) {
        const learning = (await content.getByKnowledgePoint(d.knowledgePointId))!
        expect(learning.contentStatus).toBe('PUBLISHED')
        expect(learning.blocks).toHaveLength(5)
        expect(learning.blocks.map((b) => b.block.text).join('\n')).toContain('原创例子与解法')
        const assessment = await new QuestionEngineAdapter().loadAssessment(context(d), {
          dataset: 'profile',
        })
        expect(assessment.definition?.questionIds).toEqual(d.questions.map((q) => q.id))
        expect(assessment.questions).toHaveLength(3)
        expect(reviewedAiSources(d.textbookId, d.knowledgePointId)).toHaveLength(3)
        expect(
          resolveAiTopic({ textbookId: d.textbookId, knowledgePointId: d.knowledgePointId }).title,
        ).toBe(d.title)
        expect(() =>
          resolveAiTopic({
            textbookId: d.textbookId === oldBook ? newBook : oldBook,
            knowledgePointId: d.knowledgePointId,
          }),
        ).toThrow()
      }
    }
  })

  it('validates every question and all 702 correct/incorrect option paths', () => {
    expect(bnuMathLowerQuestions).toHaveLength(234)
    for (const q of bnuMathLowerQuestions) {
      expect(questionSchema.safeParse(q).success).toBe(true)
      expect(validateQuestion(q).valid).toBe(true)
      expect(q.answerRule.ruleType).toBe('SINGLE_OPTION')
      if (q.answerRule.ruleType !== 'SINGLE_OPTION') throw new Error('single choice expected')
      for (const option of q.options!) {
        expect(
          validateQuestionAnswer(q, { type: 'singleChoice', optionId: option.id }).status,
        ).toBe(option.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect')
      }
    }
    // Exercise the misconception boundaries using independently stated answers.
    for (const [key, answer] of [
      ['boats', '6条'],
      ['continuous-borrow', '225'],
      ['place-value', '3个千和5个十'],
      ['chain-sub', '47'],
      ['logic', '绿卡'],
    ] as const) {
      const q = definitions.find((d) => d.topicKey === key)!.questions[0]!
      const option = q.options!.find((o) => o.content[0]?.text === answer)!
      expect(option).toBeTruthy()
      expect(validateQuestionAnswer(q, { type: 'singleChoice', optionId: option.id }).status).toBe(
        'correct',
      )
    }
  })

  it('makes chapter practice and review solvable while rejecting mismatched versions', () => {
    for (const bundle of bnuMathLowerBundles) {
      const d = definitions.find((d) => d.knowledgePointId === bundle.knowledgePointId)!
      const input = { bundle, title: d.title, text: String(d.content.body.summary) }
      const base = createReadingQuest(input)!
      expect(base.stages).toHaveLength(3)
      for (const v of [0, 1, 2]) {
        const review = createTrainingQuest({ ...input, variant: v })!
        expect(review.stages).toHaveLength(3)
        expect(review.sourceId).toBe(bundle.learningContent.sourceId)
        for (const stage of review.stages) {
          if (stage.kind !== 'question') throw new Error('question expected')
          expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
            'correct',
          )
        }
      }
      expect(
        createReadingQuest({
          ...input,
          bundle: { ...bundle, textbookId: bundle.textbookId === oldBook ? newBook : oldBook },
        }),
      ).toBeNull()
    }
  })

  it('requires a version choice, persists it, and retains the other subject when switching', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_2', semesterId: 'SEMESTER_LOWER' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/onboarding/textbooks', component: TextbookConfirmPage },
        { path: '/onboarding/character', component: { template: '<p>角色</p>' } },
      ],
    })
    await router.push('/onboarding/textbooks')
    const wrapper = mount(TextbookConfirmPage, {
      global: {
        plugins: [router],
        stubs: { CurriculumPageFrame: { template: '<main><slot /></main>' }, teleport: true },
      },
    })
    try {
      await flushPromises()
      const cards = wrapper.findAllComponents(TextbookCard)
      const math = cards.find((c) => c.props('subjectCode') === 'MATH')!
      expect(math.props('candidateCount')).toBe(2)
      expect(store.mathTextbookVersionId).toBeNull()
      await math.get('.textbook-card__change').trigger('click')
      const selector = wrapper.getComponent(TextbookVersionSelector)
      expect(selector.text()).toContain('2013旧版')
      expect(selector.text()).toContain('2024新课标改版')
      await selector
        .findAll('button')
        .find((b) => b.text().includes('2013旧版'))!
        .trigger('click')
      const selectedChinese = store.availableTextbooks!.chinese.availableTextbooks[0]!.id
      store.selectTextbook('CHINESE', selectedChinese)
      await store.confirmCurriculum('local-profile')
      expect(curriculumProfileRepository.load()?.mathTextbookVersionId).toBe(oldBook)
      store.beginEdit()
      await store.resolveTextbooks()
      store.selectTextbook('MATH', newBook)
      await store.confirmCurriculum('local-profile')
      expect(curriculumProfileRepository.load()).toMatchObject({
        mathTextbookVersionId: newBook,
        chineseTextbookVersionId: selectedChinese,
      })
      setActivePinia(createPinia())
      expect(useCurriculumStore().mathTextbookVersionId).toBe(newBook)
      const oldQuestion = definitions.find((d) => d.textbookId === oldBook)!.questions[0]!
      const newContext = context(definitions.find((d) => d.textbookId === newBook)!)
      const blocked = await new QuestionEngineAdapter().loadAssessment(newContext, {
        dataset: 'profile',
        selectedQuestionIds: [oldQuestion.id],
      })
      expect(blocked.definition).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it.each([oldBook, newBook])(
    'actually invokes the provider contract to arrange reviewed items from %s',
    async (book) => {
      const d = definitions.find((d) => d.textbookId === book)!
      const fetcher = vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      selections: d.questions.map((q) => ({
                        sourceId: q.id,
                        optionOrder: q.options!.map((o) => o.optionKey).reverse(),
                      })),
                    }),
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: { total_tokens: 10 },
            }),
            { status: 200 },
          ),
      )
      vi.stubGlobal('fetch', fetcher)
      const result = await createFormalGenerator({
        FORMAL_AI_ENABLED: 'true',
        LLM_PROVIDER: 'OPENAI_COMPATIBLE',
        LLM_BASE_URL: 'https://model.example/v1',
        LLM_API_KEY: 'test-key',
        LLM_MODEL: 'test-model',
      })({ profileId: 'student', textbookId: book, knowledgePointId: d.knowledgePointId })
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(result.questions.map((q) => q.sourceQuestion?.id)).toEqual(
        d.questions.map((q) => q.id),
      )
      expect(result.questions.every((q) => q.sourceQuestion?.textbookVersionId === book)).toBe(true)
    },
  )
})
