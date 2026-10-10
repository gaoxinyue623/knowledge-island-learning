import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  shenzhenEnglishSyncQuestions as questions,
  shenzhenEnglishSyncMappings as mappings,
  shenzhenEnglishSyncPractices as practices,
  shenzhenEnglishSyncSource as source,
  englishSyncSourceSheet,
  englishSyncPracticeFor,
} from '@/data/curriculum/grade-2/shenzhen-english-lower/synchronousExercises'
import { shenzhenEnglishLowerQuestions as previous } from '@/data/curriculum/grade-2/shenzhen-english-lower'
import { validateQuestion } from '@/services/validation/questionValidation'
import { validatePracticeSet } from '@/services/validation/contentExpansionValidation'
import { contentExpansionRepository } from '@/services/content-expansion'
import {
  QuestionEngineAdapter,
  createQuestionSession,
  buildAssessmentResultSummary,
  correctAnswerDraft,
  validateQuestionAnswer,
  isQuestionAnswerComplete,
} from '@/services/question-engine'
import { reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery/masteryPolicy'
import { extractLearningEvidenceFromQuestionSession } from '@/services/mastery/evidenceExtractor'
import { selectAccount } from '@/services/account/storage'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { useStudentStore } from '@/stores/studentStore'
import QuestionEnginePage from '@/pages/QuestionEnginePage.vue'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import type { AssessmentLaunchContext, Question } from '@/types'

function context(index = 0): AssessmentLaunchContext {
  const p = practices[index]!
  return {
    textbookId: p.textbookId,
    unitId: p.unitId,
    lessonId: p.lessonId,
    knowledgePointId: p.knowledgePointId,
    source: 'lesson_practice',
  }
}
function wordQuestion(word: string) {
  return questions.find(
    (q) =>
      q.answerRule.ruleType === 'TEXT_BLANKS' &&
      q.answerRule.blanks[0]?.acceptedAnswers.includes(word),
  )!
}
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('sync-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('supplied Shenzhen English synchronous exercises', () => {
  it('releases all 60 supplied exercises as six fixed sets, retaining the existing 18 questions', async () => {
    expect(questions).toHaveLength(60)
    expect(new Set(questions.map((q) => q.id)).size).toBe(60)
    expect(previous).toHaveLength(18)
    expect(previous.some((q) => questions.some((s) => s.id === q.id))).toBe(false)
    expect(practices.map((p) => p.targetCount)).toEqual([12, 9, 9, 11, 9, 10])
    expect(practices.map((p) => p.manualCount)).toEqual([1, 1, 1, 1, 1, 1])
    expect(englishSyncSourceSheet.corePatterns).toHaveLength(6)
    expect(source.notes).toContain('用户')
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.releaseApprovalId).toBe(source.releaseApprovalId)
      expect(mappings.find((m) => m.questionId === q.id)).toMatchObject({
        knowledgePointId: q.knowledgePointId,
        sourceId: source.id,
        status: 'ACTIVE',
      })
    }
    for (const [index, p] of practices.entries()) {
      expect(validatePracticeSet(p).success).toBe(true)
      const bundle = await contentExpansionRepository.getBundle(p.knowledgePointId, 'profile')
      expect(bundle?.practiceSets).toEqual([p])
      const assessment = await new QuestionEngineAdapter().loadAssessment(context(index), {
        dataset: 'profile',
        selectedQuestionIds: p.fixedQuestionIds,
      })
      expect(assessment.definition?.questionIds).toEqual(p.fixedQuestionIds)
      expect(assessment.questions.map((q) => q.id)).toEqual(p.fixedQuestionIds)
      const pool = reviewedAiSources(p.textbookId, p.knowledgePointId)
      expect(pool).toHaveLength(p.autoCount + 3)
      expect(pool.every((q) => q.answerRule.ruleType !== 'MANUAL_REVIEW')).toBe(true)
    }
    expect(validatePracticeSet({ ...practices[0], fixedQuestionIds: [] }).success).toBe(false)
  })

  it('grades all supplied canonical answers and rejects wrong options, words, boolean values and missing blanks', () => {
    for (const q of questions) {
      const result = validateQuestionAnswer(q, correctAnswerDraft(q))
      if (q.questionType === 'shortAnswer') {
        expect(result).toMatchObject({ status: 'manual_review_required', score: 0, maxScore: 0 })
        expect(isQuestionAnswerComplete(q, { type: 'shortAnswer', value: '   ' })).toBe(false)
        expect(
          validateQuestionAnswer(q, { type: 'shortAnswer', value: 'My hero is my dad.' }).status,
        ).toBe('manual_review_required')
      } else {
        expect(result.status, q.id).toBe('correct')
        if (q.answerRule.ruleType === 'SINGLE_OPTION') {
          const key = q.answerRule.correctOptionKey
          for (const option of q.options!)
            expect(
              validateQuestionAnswer(q, { type: 'singleChoice', optionId: option.id }).status,
            ).toBe(option.optionKey === key ? 'correct' : 'incorrect')
        } else if (q.answerRule.ruleType === 'BOOLEAN') {
          expect(
            validateQuestionAnswer(q, { type: 'trueFalse', value: !q.answerRule.correctValue })
              .status,
          ).toBe('incorrect')
        } else if (q.answerRule.ruleType === 'TEXT_BLANKS') {
          expect(
            validateQuestionAnswer(q, {
              type: 'fillBlank',
              values: q.answerRule.blanks.map(() => 'not-an-answer'),
            }).status,
          ).toBe('incorrect')
          expect(validateQuestionAnswer(q, { type: 'fillBlank', values: [] }).status).toBe(
            'incorrect',
          )
        }
      }
    }
    const twoBlanks = questions.find(
      (q) => q.answerRule.ruleType === 'TEXT_BLANKS' && q.answerRule.blanks.length === 2,
    )!
    expect(
      validateQuestionAnswer(twoBlanks, { type: 'fillBlank', values: ['CAN', 'run'] }).status,
    ).toBe('correct')
    expect(isQuestionAnswerComplete(twoBlanks, { type: 'fillBlank', values: ['Can'] })).toBe(false)
  })

  it('tolerates English input formatting while preserving spelling, plural and Chinese meaning checks', () => {
    for (const input of ['fish balls', '  FISH   BALLS  ', 'ＦＩＳＨ　ＢＡＬＬＳ'])
      expect(
        validateQuestionAnswer(wordQuestion('fish balls'), { type: 'fillBlank', values: [input] })
          .status,
      ).toBe('correct')
    expect(
      validateQuestionAnswer(wordQuestion('paper-cutting'), {
        type: 'fillBlank',
        values: ['Paper–Cutting'],
      }).status,
    ).toBe('correct')
    expect(
      validateQuestionAnswer(wordQuestion('Who is your hero?'), {
        type: 'fillBlank',
        values: [' WHO  IS YOUR HERO ? '],
      }).status,
    ).toBe('correct')
    for (const input of ['fish ball', 'fish', 'fish bowls'])
      expect(
        validateQuestionAnswer(wordQuestion('fish balls'), { type: 'fillBlank', values: [input] })
          .status,
      ).toBe('incorrect')
    for (const input of ['谎言', '说谎', '谎言；说谎'])
      expect(
        validateQuestionAnswer(wordQuestion('谎言'), { type: 'fillBlank', values: [input] }).status,
      ).toBe('correct')
    expect(
      validateQuestionAnswer(wordQuestion('谎言'), { type: 'fillBlank', values: ['诚实'] }).status,
    ).toBe('incorrect')
    const existingPolicy: Question = {
      ...wordQuestion('fish balls'),
      answerRule: {
        ruleType: 'TEXT_BLANKS',
        blanks: [
          { blankId: '1', acceptedAnswers: ['fish balls'], normalization: 'CASE_INSENSITIVE' },
        ],
      },
    }
    expect(
      validateQuestionAnswer(existingPolicy, { type: 'fillBlank', values: ['fish   balls'] })
        .status,
    ).toBe('incorrect')
    const ambiguity = questions.find((q) =>
      q.stem.some((b) => b.text?.includes('We should be honest')),
    )!
    expect(ambiguity.stem[0]?.text).toContain('表示原因')
    expect(
      englishSyncSourceSheet.units[5]!.questions.find((q) => 'originalStem' in q)?.originalStem,
    ).toContain('We should be honest')
  })

  it('excludes six open responses from accuracy and mastery evidence instead of marking them wrong', async () => {
    const loaded = await new QuestionEngineAdapter().loadAssessment(context(), {
      dataset: 'profile',
    })
    const session = createQuestionSession(context(), {
      ...loaded.definition!,
      questionIds: questions.map((q) => q.id),
    })
    session.status = 'completed'
    session.attempts = questions.map((q) => ({
      questionId: q.id,
      answer: correctAnswerDraft(q),
      submitted: true,
      result: validateQuestionAnswer(q, correctAnswerDraft(q)),
    }))
    expect(buildAssessmentResultSummary(session, questions)).toMatchObject({
      totalQuestions: 60,
      submittedQuestions: 60,
      correctCount: 54,
      incorrectCount: 0,
      manualReviewCount: 6,
      percentage: 100,
      maxScore: 54,
    })
    const evidence = extractLearningEvidenceFromQuestionSession({
      studentProfileId: 'sync-child',
      session,
      attempts: session.attempts,
      questions,
      mappings,
      policy: DEFAULT_MASTERY_POLICY,
    })
    expect(evidence.evidence).toHaveLength(54)
    expect(evidence.diagnostics.filter((s) => s.includes('MANUAL_REVIEW_IGNORED'))).toHaveLength(6)
  })

  it('requires matching textbook, unit, lesson, knowledge point and a nonempty known practice ID', () => {
    expect(englishSyncPracticeFor(context(), practices[0]!.id)).toBe(practices[0])
    for (const key of ['textbookId', 'unitId', 'lessonId', 'knowledgePointId'])
      expect(englishSyncPracticeFor({ ...context(), [key]: 'wrong' }, practices[0]!.id)).toBeNull()
    for (const id of ['', 'unknown', practices[1]!.id])
      expect(englishSyncPracticeFor(context(), id)).toBeNull()
    expect(englishSyncPracticeFor(null)).toBeNull()
  })

  it('resumes answers in the same account and keeps both other accounts and standard practice sessions separate', async () => {
    const p = practices[0]!
    const options = {
      dataset: 'profile' as const,
      studentId: 'same-child-id',
      selectedQuestionIds: p.fixedQuestionIds,
      sessionScope: p.id,
    }
    const first = useQuestionEngineStore()
    await first.loadAssessment(context(), options)
    await first.setAnswerDraft({ type: 'fillBlank', values: ['RICE'] })
    await first.submitAnswer()
    await first.goNext()
    const id = first.session!.id
    setActivePinia(createPinia())
    const resumed = useQuestionEngineStore()
    await resumed.loadAssessment(context(), options)
    expect(resumed.session!.id).toBe(id)
    expect(resumed.currentQuestionIndex).toBe(1)
    expect(resumed.session?.attempts[0]).toMatchObject({
      submitted: true,
      answer: { values: ['RICE'] },
      result: { status: 'correct' },
    })
    await resumed.loadAssessment(context(), {
      ...options,
      selectedQuestionIds: undefined,
      sessionScope: undefined,
    })
    expect(resumed.session?.attempts).toEqual([])
    selectAccount('another-sync-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
    selectAccount('sync-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toHaveLength(1)
  })

  it('offers the fixed practice on the actual lesson detail page and opens only its supplied questions', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'sync-child', displayName: '小岛同学' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
        { path: '/assessment', component: QuestionEnginePage },
        { path: '/learning-map', component: { template: '<p>学习地图</p>' } },
      ],
    })
    await router.push({ path: `/knowledge-point/${context().knowledgePointId}`, query: context() })
    const stubs = {
      AppShell: { template: '<main><slot /></main>' },
      FormalAiPractice: true,
      ReadingEntry: true,
      QuestTraining: true,
      LessonReadingPanel: true,
    }
    const wrapper = mount(KnowledgePointDetailPage, { global: { plugins: [pinia, router], stubs } })
    try {
      await vi.waitFor(() => expect(wrapper.text()).toContain('开始单元同步练习'))
      expect(wrapper.text()).toContain('11 题自动判分')
      expect(wrapper.text()).toContain('本册核心句型')
      await wrapper
        .findAll('button')
        .find((b) => b.text() === '开始单元同步练习')!
        .trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.query.practiceSetId).toBe(practices[0]!.id)
    } finally {
      wrapper.unmount()
    }
    const assessment = mount(QuestionEnginePage, {
      global: { plugins: [pinia, router], stubs: { AppShell: stubs.AppShell } },
    })
    try {
      await vi.waitFor(() => expect(useQuestionEngineStore().status).toBe('ready'))
      const store = useQuestionEngineStore()
      expect(store.definition?.questionIds).toEqual(practices[0]!.fixedQuestionIds)
      expect(assessment.text()).toContain('米饭')
      expect(assessment.text()).not.toContain('参考答案：rice')
      for (const q of store.questions) {
        await store.setAnswerDraft(
          q.questionType === 'shortAnswer'
            ? { type: 'shortAnswer', value: 'I like cake and bread.' }
            : correctAnswerDraft(q),
        )
        expect(await store.submitAnswer()).toBe(true)
        if (q.questionType !== 'shortAnswer') await store.goNext()
      }
      await flushPromises()
      expect(store.currentQuestion?.submitted).toBe(true)
      expect(store.currentAttempt?.result?.status).toBe('manual_review_required')
      expect(assessment.text()).toContain('I like congee and baozi.')
    } finally {
      assessment.unmount()
    }
  })

  it.each(
    ['', 'invalid-id', practices[1]!.id, [practices[0]!.id, practices[1]!.id]].map(
      (practiceSetId) => ({ practiceSetId }),
    ),
  )(
    'blocks a malformed or cross-unit practice route: $practiceSetId',
    async ({ practiceSetId }) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/assessment', component: QuestionEnginePage },
          { path: '/lesson', component: { template: '<p>课程</p>' } },
        ],
      })
      await router.push({ path: '/assessment', query: { ...context(), practiceSetId } })
      const wrapper = mount(QuestionEnginePage, {
        global: {
          plugins: [pinia, router],
          stubs: { AppShell: { template: '<main><slot /></main>' } },
        },
      })
      try {
        await flushPromises()
        expect(wrapper.text()).toContain('这组同步练习与当前教材或单元不匹配')
        expect(useQuestionEngineStore().session).toBeNull()
        expect(useQuestionEngineStore().currentQuestion).toBeNull()
      } finally {
        wrapper.unmount()
      }
    },
  )
})
