import { gradeThreeBnuMathLessons as upperDefinitions } from '@/data/curriculum/grade-3/math-bnu-upper-2022'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import outline from '@/data/curriculum/grade-3/math-bnu-lower-2022/outlines.json'
import {
  G3_BNU_MATH_S2_TEXTBOOK_ID as book,
  gradeThreeBnuMathLowerCurriculum as added,
  gradeThreeBnuMathLowerLessons as definitions,
  gradeThreeBnuMathLowerQuestions as questions,
  gradeThreeBnuMathLowerBundles as bundles,
} from '@/data/curriculum/grade-3/math-bnu-lower-2022'
import {
  productionCurriculumData,
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { curriculumService } from '@/services/runtime'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { QuestionEngineAdapter, correctAnswerDraft } from '@/services/question-engine'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { supportsAiPractice, reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic } from '../server/llm/formalGeneration'
import { selectAccount } from '@/services/account/storage'
import { isMathPilotTextbook } from '@/data/curriculum/pilot'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useStudentStore } from '@/stores/studentStore'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
const context = (d = definitions[0]!) => ({
  textbookId: book,
  unitId: d.unitId,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  source: 'lesson_practice' as const,
})
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('math-parent')
  setActivePinia(createPinia())
})
afterEach(() => selectAccount(null))
describe('grade three BNU mathematics lower 2022 supplied outline', () => {
  it('preserves provided chapter order and page numbers with honest companion provenance', () => {
    expect(added.units).toHaveLength(11)
    expect(definitions).toHaveLength(22)
    expect(questions).toHaveLength(66)
    expect(outline.editions[0]!.chapters.map((c) => c.page)).toEqual([
      2, 20, 33, 43, 48, 67, 72, 74, 80, 86, 90,
    ])
    expect(added.textbooks[0]).toMatchObject({
      id: book,
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_LOWER',
      editionYear: 2022,
      publisherId: 'PUBLISHER_BNU',
    })
    expect(added.units.map((u) => u.title)).toEqual(
      outline.editions[0]!.chapters.map((c) => c.title),
    )
    for (const d of definitions) {
      expect(d.content.contentType).toBe('EXTENSION')
      expect(d.content.body.sourceScope).toBe('USER_OUTLINE_ORIGINAL_COMPANION')
      expect(String(d.content.body.suppliedOutline).length).toBeGreaterThan(10)
      expect(d.content.body.sourceNote).toContain('不冒充教材全文')
      expect(d.questions).toHaveLength(3)
      expect(
        d.questions.every((q) => q.gradeId === 'GRADE_3' && q.semesterId === 'SEMESTER_LOWER'),
      ).toBe(true)
    }
    expect(isMathPilotTextbook(book)).toBe(true)
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
  })
  it('makes the complete mathematics map available to different accounts without region restrictions', async () => {
    for (const account of ['math-first', 'math-second']) {
      selectAccount(account)
      const available = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_3',
        semesterId: 'SEMESTER_LOWER',
        regionId: 'unlisted',
      })
      expect(available.math.availableTextbooks.map((b) => b.id)).toContain(book)
      const map = buildLearningMapViewModel(
        (await curriculumService.getLearningMapCurriculum(book))!,
        [],
        { dataset: 'profile' },
      )
      expect(map.islands).toHaveLength(11)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(22)
    }
    expect(catalog.textbooks.some((b) => b.id === 'G3_BNU_MATH_S1_2022_REVISED')).toBe(true)
  })
  it('loads formal questions and three review variants, scoring every option and keeping AI sources in this book', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const d of definitions) {
      const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
      const input = { bundle, title: d.title, text: String(d.content.body.summary) }
      const base = createReadingQuest(input)!
      expect(base.subject).toBe('MATH')
      expect(base.stages).toHaveLength(3)
      const loaded = await adapter.loadAssessment(context(d), { dataset: 'profile' })
      expect(loaded.questions.map((q) => q.id)).toEqual(d.questions.map((q) => q.id))
      expect(supportsAiPractice(book, d.knowledgePointId)).toBe(true)
      expect(
        resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }),
      ).toBeTruthy()
      expect(reviewedAiSources('G3_BNU_MATH_S1_2022_REVISED', d.knowledgePointId)).toEqual([])
      for (const variant of [0, 1, 2]) {
        const quest = createTrainingQuest({ ...input, variant })!
        expect(quest.subject).toBe('MATH')
        expect(quest.stages).toHaveLength(9)
        for (const stage of quest.stages) {
          if (stage.kind !== 'question') throw new Error('Expected question')
          expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
            'correct',
          )
        }
      }
      for (const q of d.questions)
        for (const option of q.options!) {
          expect(checkQuestAnswer(q, { type: 'singleChoice', optionId: option.id })).toBe(
            option.optionKey ===
              ('correctOptionKey' in q.answerRule ? q.answerRule.correctOptionKey : '')
              ? 'correct'
              : 'incorrect',
          )
        }
      expect(
        createReadingQuest({
          ...input,
          bundle: { ...bundle, textbookId: 'G3_BNU_MATH_S1_2022_REVISED' },
        }),
      ).toBeNull()
      expect(
        createReadingQuest({
          ...input,
          bundle: { ...bundle, learningContent: { ...bundle.learningContent, currentVersion: 2 } },
        }),
      ).toBeNull()
    }
  })
  it('checks mathematical misconception boundaries against independent answers', () => {
    for (const [key, index, answer] of [
      ['mental-multiplication', 0, '69'],
      ['written-multiplication', 0, '322'],
      ['written-multiplication', 1, '230'],
      ['symmetry', 2, '4条'],
      ['rectangle-square-perimeter', 2, '6厘米'],
      ['joined-perimeter', 0, '12厘米'],
      ['joined-perimeter', 2, '24厘米'],
      ['animal-mass', 1, '500克'],
      ['division-method', 1, '24'],
      ['division-check', 0, '商13余1'],
      ['division-check', 2, '0'],
      ['division-use', 2, '7辆'],
      ['repeat-pattern', 0, '蓝'],
      ['tally-data', 0, '12票'],
      ['bar-chart', 2, '4人'],
      ['travel-plan', 0, '102元'],
    ] as const) {
      const q = definitions.find((d) => d.topicKey === key)!.questions[index]!
      const option = q.options!.find((o) => o.content[0]!.text === answer)!
      expect(option).toBeTruthy()
      expect(checkQuestAnswer(q, { type: 'singleChoice', optionId: option.id })).toBe('correct')
    }
  })
  it('keeps upper/lower practice histories and account progress separate', async () => {
    const u = upperDefinitions[0]!
    const upperContext = {
      textbookId: u.textbookId,
      unitId: u.unitId,
      lessonId: u.lessonId,
      knowledgePointId: u.knowledgePointId,
      source: 'lesson_practice' as const,
    }
    const options = { dataset: 'profile' as const, studentId: 'same-child' }
    const store = useQuestionEngineStore()
    await store.loadAssessment(upperContext, options)
    await store.setAnswerDraft(correctAnswerDraft(store.questions[0]!))
    await store.submitAnswer()
    const upperSession = store.session!.id
    await store.loadAssessment(context(), options)
    expect(store.session!.attempts).toEqual([])
    expect(store.session!.id).not.toBe(upperSession)
    await store.setAnswerDraft(correctAnswerDraft(store.questions[0]!))
    await store.submitAnswer()
    const lowerSession = store.session!.id
    await store.loadAssessment(upperContext, options)
    expect(store.session!.id).toBe(upperSession)
    expect(store.session!.attempts).toHaveLength(1)
    await store.loadAssessment(context(), options)
    expect(store.session!.id).toBe(lowerSession)
    expect(store.session!.attempts).toHaveLength(1)
    selectAccount('different-math-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session!.attempts).toEqual([])
  })
  it('auto-selects the single mathematics edition and persists it alongside Chinese', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_3', semesterId: 'SEMESTER_LOWER' })
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
      const card = wrapper
        .findAllComponents(TextbookCard)
        .find((c) => c.props('subjectCode') === 'MATH')!
      expect(card.props('candidateCount')).toBe(1)
      expect(store.mathTextbookVersionId).toBe(book)
      await store.confirmCurriculum('grade-three-child')
      expect(curriculumProfileRepository.load()?.mathTextbookVersionId).toBe(book)
      expect(curriculumProfileRepository.load()?.chineseTextbookVersionId).toBeTruthy()
    } finally {
      wrapper.unmount()
    }
  })
  it.each([
    'written-multiplication',
    'symmetry',
    'rotation',
    'joined-perimeter',
    'animal-mass',
    'division-check',
    'hands-on',
    'book-order',
    'repeat-pattern',
    'bar-chart',
    'travel-plan',
    'review',
  ])('renders the %s lesson as mathematics with supplied outline and practice', async (key) => {
    const d = definitions.find((d) => d.topicKey === key)!
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'math-child', displayName: '小岛同学' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
        { path: '/lesson', component: { template: '<p>学习</p>' } },
        { path: '/assessment', component: { template: '<p>练习</p>' } },
        { path: '/learning-map', component: { template: '<p>地图</p>' } },
      ],
    })
    await router.push({ path: `/knowledge-point/${d.knowledgePointId}`, query: context(d) })
    const wrapper = mount(KnowledgePointDetailPage, {
      global: {
        plugins: [pinia, router],
        stubs: {
          AppShell: { template: '<main><slot /></main>' },
          FormalAiPractice: true,
          ReadingEntry: true,
          QuestTraining: true,
        },
      },
    })
    try {
      await flushPromises()
      expect(wrapper.text()).toContain('2022新课标修订知识点整理')
      expect(wrapper.text()).toContain(String(d.content.body.suppliedOutline))
      expect(wrapper.text()).toContain(String(d.content.body.summary))
      expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(true)
      expect(wrapper.text()).not.toContain('完整教材原文将在获得授权并完成审核后接入')
    } finally {
      wrapper.unmount()
    }
  })
})
