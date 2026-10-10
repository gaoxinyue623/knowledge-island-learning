import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  gradeThreeChineseSyncQuestions as questions,
  gradeThreeChineseSyncMappings as mappings,
  gradeThreeChineseSyncPractices as practices,
  gradeThreeChineseSyncSource as source,
  chineseSyncSourceSheet as sheet,
  chineseSyncPracticeFor,
  chineseSyncPracticeForLesson,
} from '@/data/curriculum/grade-3/chinese-pep-upper/synchronousExercises'
import {
  gradeThreeChineseDefinitions as lessons,
  gradeThreeChineseQuestions as previous,
} from '@/data/curriculum/grade-3/chinese-pep-upper'
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
  selectAccount('g3-sync-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 3 Chinese unit synchronous exercises', () => {
  it('releases all eight complete sheets and preserves the 84 text-specific exercises', async () => {
    expect(questions).toHaveLength(179)
    expect(new Set(questions.map((q) => q.id)).size).toBe(179)
    expect(previous).toHaveLength(84)
    expect(practices.map((p) => p.targetCount)).toEqual([27, 35, 19, 22, 18, 24, 17, 17])
    expect(practices.reduce((n, p) => n + p.autoCount, 0)).toBe(146)
    expect(practices.reduce((n, p) => n + p.manualCount, 0)).toBe(33)
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    expect(catalog.contentSources.find((s) => s.id === source.id)).toMatchObject(source)
    expect(catalog.sourceReferences.find((s) => s.id === source.id)?.verifiedBy).toContain('Codex')
    for (const q of questions) {
      expect(validateQuestion(q).issues, q.id).toEqual([])
      expect(q.releaseApprovalId).toBe(source.releaseApprovalId)
      expect(mappings.find((m) => m.questionId === q.id)?.knowledgePointId).toBe(q.knowledgePointId)
    }
    for (const [i, p] of practices.entries()) {
      expect(validatePracticeSet(p).success).toBe(true)
      const bundle = await contentExpansionRepository.getBundle(p.knowledgePointId, 'profile')
      expect(bundle?.practiceSets).toEqual([p])
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

  it('retains corrections, alternative answers and supplementary boundaries', () => {
    const seeds = sheet.units.flatMap((u) => u.questions)
    expect(seeds.every((q) => q.originalStem && q.originalReference)).toBe(true)
    const corrections = seeds.filter((q) => 'adjustment' in q)
    expect(corrections).toHaveLength(12)
    for (const [original, changed, answer] of [
      ['jìng ān', 'ān jìng', '安静'],
      ['jìng xiá', 'xiǎo jìng', '小径'],
      ['è dù', 'jī è', '饥饿'],
    ]) {
      const seed = seeds.find((q) => q.originalStem.includes(original!))!
      expect(seed.stem).toContain(changed)
      expect(seed.reference).toBe(answer)
    }
    const penalty = seeds.find((q) => q.originalStem.startsWith('fá zhàn'))!
    expect(penalty.originalReference).toBe('处罚')
    expect(penalty.reference).toBe('罚站')
    expect(seeds.find((q) => q.originalStem === '层（___）林（___）')?.stem).toBe(
      '层（___）尽（___）',
    )
    expect(seeds.find((q) => q.originalStem === '（___）光（___）色')?.stem).toBe(
      '流（___）溢（___）',
    )
    const supplementary = seeds.filter((q) => 'scope' in q && q.scope === 'SUPPLEMENTARY')
    expect(supplementary).toHaveLength(3)
    for (const seed of supplementary) {
      const q = questions.find((q) => q.explanation.summary[0]?.text?.includes(seed.reference))!
      expect(q.stem[0]?.text).toContain('拓展')
    }
    const rock = questions.find((q) => q.stem[0]?.text?.includes('海底礁石'))!
    expect(validateQuestionAnswer(rock, { type: 'fillBlank', values: ['岩石'] }).status).toBe(
      'correct',
    )
    expect(validateQuestionAnswer(rock, { type: 'fillBlank', values: ['严实'] }).status).toBe(
      'incorrect',
    )
    const colors = questions.find((q) => q.stem[0]?.text?.includes('片段中描写的颜色有'))!
    expect(colors.answerRule.ruleType).toBe('MANUAL_REVIEW')
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
      totalQuestions: 179,
      submittedQuestions: 179,
      correctCount: 146,
      incorrectCount: 0,
      manualReviewCount: 33,
      percentage: 100,
      maxScore: 146,
    })
    const extracted = extractLearningEvidenceFromQuestionSession({
      studentProfileId: 'g3-sync-child',
      session,
      attempts: session.attempts,
      questions,
      mappings,
      policy: DEFAULT_MASTERY_POLICY,
    })
    expect(extracted.evidence).toEqual([])
    expect(extracted.diagnostics.filter((s) => s.includes('UNIT_SYNC_SCOPE_IGNORED'))).toHaveLength(
      146,
    )
    expect(extracted.diagnostics.filter((s) => s.includes('MANUAL_REVIEW_IGNORED'))).toHaveLength(
      33,
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

  it('resolves all 52 lesson entries while requiring a canonical matching assessment route', () => {
    for (const lesson of lessons) {
      const c = {
        ...context(),
        unitId: lesson.unitId,
        lessonId: lesson.lessonId,
        knowledgePointId: lesson.knowledgePointId,
      }
      expect(chineseSyncPracticeForLesson(c)?.unitId).toBe(lesson.unitId)
      expect(chineseSyncPracticeForLesson({ ...c, lessonId: 'wrong' })).toBeNull()
    }
    expect(chineseSyncPracticeFor(context(), practices[0]!.id)).toBe(practices[0])
    for (const key of ['textbookId', 'unitId', 'lessonId', 'knowledgePointId'])
      expect(chineseSyncPracticeFor({ ...context(), [key]: 'wrong' }, practices[0]!.id)).toBeNull()
    for (const id of ['', 'unknown', practices[1]!.id])
      expect(chineseSyncPracticeFor(context(), id)).toBeNull()
    expect(chineseSyncPracticeForLesson(null)).toBeNull()
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
    await store.setAnswerDraft({ type: 'fillBlank', values: ['早晨'] })
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
    selectAccount('other-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
    selectAccount('g3-sync-parent')
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

  it.each(['reading-02', 'writing-1'])(
    'opens the same unit sheet from a noncanonical lesson %s, hides solutions and reveals references after submission',
    async (key) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'g3-sync-child', displayName: '小岛同学' }
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
          { path: '/assessment', component: QuestionEnginePage },
          { path: '/learning-map', component: { template: '<p>地图</p>' } },
        ],
      })
      const d = lessons.find((d) => d.key === key)!
      const c = {
        ...context(),
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
        expect(wrapper.text()).toContain('24 题自动判分')
        expect(wrapper.text()).toContain('3 题对照参考答案')
        expect(wrapper.text()).not.toContain('本册核心句型')
        await wrapper
          .findAll('button')
          .find((b) => b.text() === '开始单元同步练习')!
          .trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query).toMatchObject({
          ...context(),
          practiceSetId: practices[0]!.id,
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
        expect(store.definition?.questionIds).toEqual(practices[0]!.fixedQuestionIds)
        expect(assessment.find('h1').text()).toBe(practices[0]!.title)
        expect(assessment.text()).toContain('zǎo chen')
        expect(assessment.text()).not.toContain('参考答案：早晨')
        await store.setAnswerDraft({ type: 'fillBlank', values: ['早晨'] })
        await store.submitAnswer()
        await flushPromises()
        expect(assessment.text()).toContain('参考答案：早晨')
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
          value: '大家向树林挥手，向河流问好，向蓝天微笑。',
        })
        await store.submitAnswer()
        await flushPromises()
        expect(store.currentAttempt?.result?.status).toBe('manual_review_required')
        expect(assessment.text()).toContain('我们向太阳微笑')
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
          correctCount: 24,
          manualReviewCount: 3,
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

  it.each(['', 'wrong', practices[1]!.id, [practices[0]!.id, practices[1]!.id]])(
    'blocks a malformed or cross-unit practice URL %j',
    async (practiceSetId) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/assessment', component: QuestionEnginePage }],
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
