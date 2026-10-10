import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  gradeFiveBnuUnitTestQuestions as questions,
  gradeFiveBnuUnitTestMappings as mappings,
  gradeFiveBnuUnitTestPractices as practices,
  gradeFiveBnuUnitTestSources as sources,
  gradeFiveBnuUnitTestSheet as sheet,
  gradeFiveBnuUnitTestPracticeFor,
  gradeFiveBnuUnitTestPracticeForLesson,
} from '@/data/curriculum/grade-5/math-bnu-upper/unit-tests'
import {
  gradeFiveBnuMathLessons as lessons,
  gradeFiveBnuMathQuestions as previous,
} from '@/data/curriculum/grade-5/math-bnu-upper'
import {
  productionCurriculumData,
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { validateQuestion } from '@/services/validation/questionValidation'
import { validatePracticeSet } from '@/services/validation/contentExpansionValidation'
import { contentExpansionRepository } from '@/services/content-expansion'
import {
  QuestionEngineAdapter,
  createQuestionSession,
  buildAssessmentResultSummary,
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine'
import { reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { selectAgentQuestions } from '@/services/learning-agent/questionSelection'
import { DEFAULT_MASTERY_POLICY } from '@/services/mastery/masteryPolicy'
import { extractLearningEvidenceFromQuestionSession } from '@/services/mastery/evidenceExtractor'
import { selectAccount } from '@/services/account/storage'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { useStudentStore } from '@/stores/studentStore'
import QuestionEnginePage from '@/pages/QuestionEnginePage.vue'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import type { AssessmentLaunchContext, LearningAgentSnapshot, LearningDecision } from '@/types'

const context = (i = 0): AssessmentLaunchContext => {
  const p = practices[i]!
  return {
    textbookId: p.textbookId,
    unitId: p.unitId,
    lessonId: p.lessonId,
    knowledgePointId: p.knowledgePointId,
    source: 'lesson_practice',
  }
}
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('g3-lower-sync-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 5 BNU mathematics upper unit tests', () => {
  it('releases all 11 papers and preserves the 81 lesson questions', async () => {
    expect(questions).toHaveLength(97)
    expect(new Set(questions.map((q) => q.id)).size).toBe(97)
    expect(previous).toHaveLength(81)
    expect(practices.map((p) => p.targetCount)).toEqual([13, 15, 3, 12, 9, 13, 2, 9, 10, 9, 2])
    expect(practices.reduce((n, p) => n + p.autoCount, 0)).toBe(73)
    expect(practices.reduce((n, p) => n + p.manualCount, 0)).toBe(24)
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    for (const source of sources) {
      expect(catalog.contentSources.find((s) => s.id === source.id)).toMatchObject(source)
      expect(catalog.sourceReferences.find((s) => s.id === source.id)?.verifiedBy).toContain(
        'Codex',
      )
    }
    for (const q of questions) {
      expect(validateQuestion(q).issues, q.id).toEqual([])
      expect(q.releaseApprovalId).toBe(sources[0]!.releaseApprovalId)
      expect(mappings.find((m) => m.questionId === q.id)?.knowledgePointId).toBe(q.knowledgePointId)
    }
    for (const [i, p] of practices.entries()) {
      expect(validatePracticeSet(p).success).toBe(true)
      const bundle = await contentExpansionRepository.getBundle(p.knowledgePointId, 'profile')
      expect(bundle?.practiceSets).toContainEqual(p)
      const adapter = new QuestionEngineAdapter()
      const loaded = await adapter.loadAssessment(context(i), {
        dataset: 'profile',
        selectedQuestionIds: p.fixedQuestionIds,
      })
      expect(loaded.questions.map((q) => q.id)).toEqual(p.fixedQuestionIds)
      expect(loaded.definition?.questionIds).toEqual(p.fixedQuestionIds)
      expect(
        (await adapter.loadAssessment(context(i), { dataset: 'profile' })).questions,
      ).toHaveLength(3)
      expect(reviewedAiSources(p.textbookId, p.knowledgePointId)).toHaveLength(3)
    }
  })

  it('checks every canonical answer and rejects wrong words, missing blanks, choices and booleans', () => {
    for (const q of questions) {
      const expected = q.questionType === 'shortAnswer' ? 'manual_review_required' : 'correct'
      expect(validateQuestionAnswer(q, correctAnswerDraft(q)).status, q.id).toBe(expected)
      if (q.answerRule.ruleType === 'TEXT_BLANKS') {
        for (const [i, b] of q.answerRule.blanks.entries())
          for (const answer of b.acceptedAnswers) {
            const draft = correctAnswerDraft(q)
            if (draft.type === 'fillBlank') {
              draft.values[i] = answer
              expect(validateQuestionAnswer(q, draft).status).toBe('correct')
            }
          }
        expect(
          validateQuestionAnswer(q, {
            type: 'fillBlank',
            values: q.answerRule.blanks.map(() => '错误答案'),
          }).status,
        ).toBe('incorrect')
        expect(validateQuestionAnswer(q, { type: 'fillBlank', values: [] }).status).toBe(
          'incorrect',
        )
      } else if (q.answerRule.ruleType === 'SINGLE_OPTION') {
        for (const o of q.options!)
          expect(validateQuestionAnswer(q, { type: 'singleChoice', optionId: o.id }).status).toBe(
            o.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect',
          )
      } else if (q.answerRule.ruleType === 'BOOLEAN') {
        expect(
          validateQuestionAnswer(q, { type: 'trueFalse', value: !q.answerRule.correctValue })
            .status,
        ).toBe('incorrect')
      } else if (q.answerRule.ruleType === 'NUMERIC') {
        expect(
          validateQuestionAnswer(q, { type: 'calculation', value: String(q.answerRule.value + 1) })
            .status,
        ).toBe('incorrect')
      } else {
        expect(
          validateQuestionAnswer(q, {
            type: 'shortAnswer',
            value: '我用自己的话表达，与参考答案措辞不同。',
          }),
        ).toMatchObject({ status: 'manual_review_required', score: 0, maxScore: 0 })
      }
    }
  })

  it('archives exact source sections and repairs formulas, missing geometry and probability conditions', () => {
    const raw = readFileSync('src/data/curriculum/grade-5/math-bnu-upper/unit-tests/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(sheet.sourceSha256)
    expect(raw).toEqual(readFileSync('src/data/curriculum/grade-5/math-bnu-upper/source-text.md'))
    for (const p of sheet.papers) expect(raw.toString()).toContain(p.sourceText)
    expect(sheet.notice).toContain('不换算为100分')
    const seeds = sheet.papers.flatMap((p) => p.questions)
    const restored = seeds.find((q) => q.originalStem === '$6(x=)13.2$')!
    expect(restored.stem).toContain('6x＝13.2')
    expect(restored.kind).toBe('shortAnswer')
    expect(
      seeds.find((q) => q.originalStem === '正方形有（）条对称轴，长方形有（）条对称轴。')!.stem,
    ).toContain('长和宽不相等')
    expect(seeds.find((q) => q.originalStem === '抛硬币，正反面可能性相等。')!.stem).toContain(
      '理想均匀硬币',
    )
    const all = questions.map((q) => q.stem[0]!.text!).join('\n')
    expect(raw.toString()).toContain('3.06(3.06(')
    expect(all).not.toContain('3.06(3.06(')
    expect(all).toContain('A（1，1）')
    expect(all).toContain('除以同一个')
  })
  it('checks independently calculated values and repairs ambiguous answer formats', () => {
    for (const [fragment, value] of [
      ['0.3×4', 1.2],
      ['0.2×0.6', 0.12],
      ['1.1×5', 5.5],
      ['0.25×8', 2],
      ['0.7×0.7', 0.49],
      ['一根彩带', 4],
      ['∠1＝38°', 80],
      ['橙子每千克', 29.4],
      ['菜地底12米', 480],
    ] as const) {
      const q = questions.find((q) => q.stem[0]!.text!.includes(fragment))!
      expect(validateQuestionAnswer(q, { type: 'calculation', value: String(value) }).status).toBe(
        'correct',
      )
    }
    const comparison = questions.find((q) => q.stem[0]!.text!.includes('3.60'))!
    expect(
      validateQuestionAnswer(comparison, { type: 'fillBlank', values: ['<', '>'] }).status,
    ).toBe('correct')
    const formula = questions.find((q) => q.stem[0]!.text!.includes('b×b简写'))!
    expect(
      validateQuestionAnswer(formula, { type: 'fillBlank', values: ['b^2', '3m'] }).status,
    ).toBe('correct')
    expect(
      validateQuestionAnswer(formula, { type: 'fillBlank', values: ['2b', 'm^3'] }).status,
    ).toBe('incorrect')
    const animals = questions.find((q) => q.stem[0]!.text!.includes('共10个头'))!
    expect(validateQuestionAnswer(animals, { type: 'fillBlank', values: ['6', '4'] }).status).toBe(
      'correct',
    )
  })

  it('counts open answers separately and never treats a unit sheet as mastery of its navigation lesson', () => {
    const session = createQuestionSession(context(), {
      id: 'unit-sync',
      knowledgePointId: context().knowledgePointId,
      questionIds: questions.map((q) => q.id),
      mode: 'practice',
    })
    session.status = 'completed'
    session.attempts = questions.map((q) => ({
      questionId: q.id,
      answer: correctAnswerDraft(q),
      submitted: true,
      result: validateQuestionAnswer(q, correctAnswerDraft(q)),
    }))
    expect(buildAssessmentResultSummary(session, questions)).toMatchObject({
      totalQuestions: 97,
      submittedQuestions: 97,
      correctCount: 73,
      incorrectCount: 0,
      manualReviewCount: 24,
      percentage: 100,
      maxScore: 73,
    })
    const extracted = extractLearningEvidenceFromQuestionSession({
      studentProfileId: 'g3-lower-sync-child',
      session,
      attempts: session.attempts,
      questions,
      mappings,
      policy: DEFAULT_MASTERY_POLICY,
    })
    expect(extracted.evidence).toEqual([])
    expect(extracted.diagnostics.filter((s) => s.includes('UNIT_SYNC_SCOPE_IGNORED'))).toHaveLength(
      73,
    )
    expect(extracted.diagnostics.filter((s) => s.includes('MANUAL_REVIEW_IGNORED'))).toHaveLength(
      24,
    )
  })

  it('does not select whole-unit or supplementary questions for a single-lesson Agent recommendation', () => {
    const snapshot = {
      questions: [...previous, ...questions],
      mappings: [...catalog.questionKnowledgePoints],
      sessions: [],
    } as unknown as LearningAgentSnapshot
    const decision = {
      difficulty: 0.4,
      textbookId: context().textbookId,
      targetKnowledgePointId: context().knowledgePointId,
      recommendedActivity: { estimatedQuestionCount: 20 },
    } as LearningDecision
    const selected = selectAgentQuestions(snapshot, decision)
    expect(selected.selectedQuestionIds).toHaveLength(3)
    expect(selected.selectedQuestionIds.every((id) => previous.some((q) => q.id === id))).toBe(true)
  })

  it('resolves all 27 lesson routes, omits units without supplied papers and rejects crossed contexts', () => {
    expect(lessons).toHaveLength(27)
    for (const d of lessons) {
      const c = {
        ...context(),
        textbookId: d.textbookId,
        unitId: d.unitId,
        lessonId: d.lessonId,
        knowledgePointId: d.knowledgePointId,
      }
      const expected =
        practices.find((p) => p.textbookId === d.textbookId && p.unitId === d.unitId) ?? null
      expect(gradeFiveBnuUnitTestPracticeForLesson(c)).toBe(expected)
      expect(gradeFiveBnuUnitTestPracticeForLesson({ ...c, lessonId: 'wrong' })).toBeNull()
    }
    expect(gradeFiveBnuUnitTestPracticeFor(context(), practices[0]!.id)).toBe(practices[0])
    for (const key of ['textbookId', 'unitId', 'lessonId', 'knowledgePointId'])
      expect(
        gradeFiveBnuUnitTestPracticeFor({ ...context(), [key]: 'wrong' }, practices[0]!.id),
      ).toBeNull()
    for (const id of ['', 'unknown', practices[1]!.id, practices[6]!.id])
      expect(gradeFiveBnuUnitTestPracticeFor(context(), id)).toBeNull()
    expect(gradeFiveBnuUnitTestPracticeForLesson(null)).toBeNull()
  })

  it('resumes fixed sheet answers separately from ordinary lessons and other accounts', async () => {
    const p = practices[0]!,
      options = {
        dataset: 'profile' as const,
        studentId: 'same-child',
        selectedQuestionIds: p.fixedQuestionIds,
        sessionScope: p.id,
      }
    const store = useQuestionEngineStore()
    await store.loadAssessment(context(), options)
    await store.setAnswerDraft(correctAnswerDraft(store.questions[0]!))
    await store.submitAnswer()
    await store.goNext()
    const id = store.session!.id
    setActivePinia(createPinia())
    const resumed = useQuestionEngineStore()
    await resumed.loadAssessment(context(), options)
    expect(resumed.session?.id).toBe(id)
    expect(resumed.currentQuestionIndex).toBe(1)
    expect(resumed.session?.attempts[0]?.result?.status).toBe('correct')
    await resumed.loadAssessment(context(), {
      ...options,
      selectedQuestionIds: undefined,
      sessionScope: undefined,
    })
    expect(resumed.session?.attempts).toEqual([])
    expect(resumed.questions).toHaveLength(3)
    await resumed.loadAssessment(context(6), {
      ...options,
      selectedQuestionIds: practices[6]!.fixedQuestionIds,
      sessionScope: practices[6]!.id,
    })
    expect(resumed.session?.attempts).toEqual([])
    expect(resumed.questions).toHaveLength(2)
    selectAccount('other-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
    selectAccount('g3-lower-sync-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toHaveLength(1)
  })

  it('allows an explicit wrong-book retry without putting the whole sheet into ordinary lesson practice', async () => {
    const q = questions[0]!,
      adapter = new QuestionEngineAdapter()
    const retry = await adapter.loadAssessment(context(), {
      dataset: 'profile',
      reviewQuestionId: q.id,
      initialQuestionId: q.id,
    })
    expect(retry.questions.map((q) => q.id)).toEqual([q.id])
    expect(
      (await adapter.loadAssessment(context(), { dataset: 'profile' })).questions,
    ).toHaveLength(3)
    expect(
      (
        await adapter.loadAssessment(context(1), { dataset: 'profile', reviewQuestionId: q.id })
      ).questions.some((item) => item.id === q.id),
    ).toBe(false)
  })

  it.each(['decimal-mix', 'equation-use'])(
    'opens the same unit sheet from a noncanonical lesson %s, hides solutions and reveals references after submission',
    async (key) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'g3-lower-sync-child', displayName: '小岛同学' }
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
          { path: '/assessment', component: QuestionEnginePage },
          { path: '/learning-map', component: { template: '<p>地图</p>' } },
          { path: '/lesson', component: { template: '<p>课文</p>' } },
        ],
      })
      const d = lessons.find((d) => d.topicKey === key)!
      const p = practices.find((p) => p.textbookId === d.textbookId && p.unitId === d.unitId)!
      const paperIndex = practices.indexOf(p)
      const c = {
        ...context(paperIndex),
        unitId: d.unitId,
        lessonId: d.lessonId,
        knowledgePointId: d.knowledgePointId,
      }
      await router.push({
        path: `/knowledge-point/${d.knowledgePointId}`,
        query: { ...c, mapNodeId: 'origin-node' },
      })
      const stubs = {
        AppShell: { template: '<main><slot /></main>' },
        FormalAiPractice: true,
        ReadingEntry: true,
        QuestTraining: true,
        LessonReadingPanel: true,
      }
      const wrapper = mount(KnowledgePointDetailPage, {
        global: { plugins: [pinia, router], stubs },
      })
      try {
        await vi.waitFor(() => expect(wrapper.text()).toContain('开始单元同步练习'))
        expect(wrapper.text()).toContain(`${p.autoCount} 题自动判分`)
        expect(wrapper.text()).toContain(`${p.manualCount} 题对照参考答案`)
        expect(wrapper.text()).not.toContain('本册核心句型')
        await wrapper
          .findAll('button')
          .find((b) => b.text() === '开始单元同步练习')!
          .trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query).toMatchObject({
          ...context(paperIndex),
          practiceSetId: p.id,
        })
        expect(router.currentRoute.value.query.mapNodeId).toBeUndefined()
      } finally {
        wrapper.unmount()
      }
      const assessment = mount(QuestionEnginePage, {
        global: { plugins: [pinia, router], stubs: { AppShell: stubs.AppShell } },
      })
      try {
        await vi.waitFor(() => expect(useQuestionEngineStore().status).toBe('ready'))
        const store = useQuestionEngineStore()
        expect(store.definition?.questionIds).toEqual(p.fixedQuestionIds)
        expect(assessment.find('h1').text()).toBe(p.title)
        expect(assessment.text()).toContain('不换算为100分')
        expect(assessment.text()).not.toContain('参考答案：')
        await store.setAnswerDraft(correctAnswerDraft(store.questions[0]!))
        await store.submitAnswer()
        await flushPromises()
        expect(assessment.text()).toContain('参考答案：')
        const manual = store.questions.find((q) => q.questionType === 'shortAnswer')!
        const idx = store.questions.findIndex((q) => q.id === manual.id)
        for (let i = store.currentQuestionIndex; i < idx; i++) {
          if (!store.currentQuestion?.submitted) {
            await store.setAnswerDraft(correctAnswerDraft(store.questions[i]!))
            await store.submitAnswer()
          }
          await store.goNext()
        }
        await store.setAnswerDraft({
          type: 'shortAnswer',
          value: '已在纸上列式，写出计算过程。',
        })
        await store.submitAnswer()
        await flushPromises()
        expect(store.currentAttempt?.result?.status).toBe('manual_review_required')
        expect(assessment.text()).toContain('本题由老师或家长核对过程，不自动判分。')
        while (store.currentQuestionIndex < store.questions.length - 1) {
          await store.goNext()
          await store.setAnswerDraft(
            correctAnswerDraft(store.questions[store.currentQuestionIndex]!),
          )
          await store.submitAnswer()
        }
        await flushPromises()
        await assessment
          .findAll('button')
          .find((b) => b.text() === '完成本次练习')!
          .trigger('click')
        await vi.waitFor(() => expect(assessment.text()).toContain('单元复习记录已保存'))
        expect(store.status).toBe('completed')
        expect(store.viewModel?.resultSummary).toMatchObject({
          correctCount: p.autoCount,
          manualReviewCount: p.manualCount,
          percentage: 100,
        })
        await assessment.find('.question-engine__back').trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.path).toBe(`/knowledge-point/${d.knowledgePointId}`)
        expect(router.currentRoute.value.query).toMatchObject({
          lessonId: d.lessonId,
          knowledgePointId: d.knowledgePointId,
        })
        expect(router.currentRoute.value.query.assessmentCompleted).toBeUndefined()
      } finally {
        assessment.unmount()
      }
    },
  )

  it.each(['', 'wrong', practices[6]!.id, [practices[0]!.id, practices[1]!.id]])(
    'blocks a malformed or cross-unit practice URL %j',
    async (practiceSetId) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/assessment', component: QuestionEnginePage },
          { path: '/lesson', component: { template: '<p>课文</p>' } },
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
      } finally {
        wrapper.unmount()
      }
    },
  )
})
