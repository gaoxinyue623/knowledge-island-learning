import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import {
  G3_PEP_CHINESE_S2_TEXTBOOK_ID as book,
  G3_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID as textSource,
  G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID as practiceSource,
  gradeThreeChineseLowerSource as supplied,
  gradeThreeChineseLowerDefinitions as allDefinitions,
  gradeThreeChineseLowerCurriculum as imported,
  gradeThreeChineseLowerQuestions as questions,
  gradeThreeChineseLowerBundles as bundles,
} from '@/data/curriculum/grade-3/chinese-pep-lower'
import {
  G3_PEP_CHINESE_S1_TEXTBOOK_ID as upperBook,
  gradeThreeChineseQuestions as upperQuestions,
} from '@/data/curriculum/grade-3/chinese-pep-upper'
import {
  G3_CHINESE_LOWER_IMPORT_APPROVAL as approval,
  G3_CHINESE_LOWER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeThreeChineseLowerApproval'
import {
  productionCurriculumData,
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { curriculumService } from '@/services/runtime'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { contentExpansionRepository } from '@/services/content-expansion'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { validateQuestion } from '@/services/validation/questionValidation'
import { QuestionEngineAdapter, correctAnswerDraft } from '@/services/question-engine'
import { reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { createFormalGenerator, resolveAiTopic } from '../server/llm/formalGeneration'
import { selectAccount } from '@/services/account/storage'
import { useStudentStore } from '@/stores/studentStore'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { RuntimeLearningAgentSource } from '@/services/learning-agent/runtimeSource'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'
import { buildAssessmentPapers } from '@/services/comprehensive-assessment/papers'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'

const attachmentSha256 = '5751772ae05775d5316fb22686fe3ee850ed52f12558f250940819203c13f29f'
const definitions = allDefinitions.filter((d) => d.kind !== 'appendix')
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
  selectAccount('g3-lower-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('attachment supplied grade 3 lower Chinese', () => {
  it('preserves attachment bytes and all supplied texts, without inventing missing columns or a publication year', () => {
    const raw = readFileSync('src/data/curriculum/grade-3/chinese-pep-lower/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(attachmentSha256)
    expect(supplied.sourceSha256).toBe(attachmentSha256)
    expect(imported.textbooks[0]?.editionYear).toBeUndefined()
    expect(imported.units).toHaveLength(8)
    expect(definitions).toHaveLength(29)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 27 }, (_, i) => i + 1),
    )
    expect(definitions.filter((d) => d.kind === 'example')).toHaveLength(2)
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      4, 8, 11, 15, 21, 27,
    ])
    expect(definitions.filter((d) => !['reading', 'example'].includes(d.kind))).toEqual([])
    for (const d of definitions) {
      expect(raw.toString()).toContain(d.text)
      expect(d.text).not.toContain('需要吗？')
      expect(
        imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)?.body
          .suppliedText,
      ).toBe(d.text)
      expect(d.questions).toHaveLength(3)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
    }
    const bee = definitions.find((d) => d.number === 10)!,
      sun = definitions.find((d) => d.number === 23)!
    expect(bee.title).toBe('10 蜜蜂')
    expect(bee.originalHeading).toContain('石拱桥')
    expect(bee.importNotes.join()).toContain('蜜蜂')
    expect(sun.title).toBe('23 太阳')
    expect(sun.originalHeading).toContain('海底世界')
    expect(definitions.filter((d) => d.title.endsWith('海底世界'))).toHaveLength(1)
    expect(definitions.find((d) => d.number === 6)!.text).not.toContain('会摇尾巴的狼')
    expect(definitions.find((d) => d.number === 6)!.importNotes.join()).toContain('会摇尾巴的狼')
    expect(definitions.find((d) => d.number === 16)!.sourceNote).toContain('不补写结局')
  })

  it('passes release readiness and retains independent source approval and reviewer', () => {
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    expect(
      catalog.questions.filter(
        (q) =>
          q.textbookVersionId === book &&
          !q.tags.includes('unit-sync-only') &&
          !q.tags.includes('comprehensive-only'),
      ),
    ).toHaveLength(87)
    for (const id of [textSource, practiceSource]) {
      expect(catalog.contentSources.find((s) => s.id === id)).toMatchObject({
        releaseApprovalId: approval,
        verifiedAt: importedAt,
        verificationStatus: 'REVIEWED',
      })
      expect(catalog.sourceReferences.find((s) => s.id === id)?.verifiedBy).toContain('Codex')
    }
    expect(catalog.textbooks.find((b) => b.id === upperBook)).toBeTruthy()
    expect(upperQuestions).toHaveLength(84)
  })

  it('offers the same lower book to every account and builds eight islands with 32 readable nodes', async () => {
    const repository = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['parent-a', 'parent-b']) {
      selectAccount(account)
      for (const regionId of [undefined, 'unknown-region']) {
        const books = await curriculumService.resolveAvailableTextbooks({
          gradeId: 'GRADE_3',
          semesterId: 'SEMESTER_LOWER',
          regionId,
        })
        expect(books.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
      }
      const curriculum = (await curriculumService.getLearningMapCurriculum(book))!
      const map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
      expect(map.islands).toHaveLength(8)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(32)
      for (const d of definitions) {
        const lesson = await repository.getByKnowledgePoint(d.knowledgePointId)
        expect(lesson?.blocks.map((b) => b.block.text).join('\n\n')).toContain(
          d.text.replaceAll('**', '').replace(/^#### /gm, ''),
        )
        expect(
          await contentExpansionRepository.getBundle(d.knowledgePointId, 'profile'),
        ).toBeTruthy()
      }
    }
  })

  it('automatically selects the sole Chinese edition and confirms it without other subjects, preserving account separation', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g3-lower-child', displayName: '小岛同学' }
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_3', semesterId: 'SEMESTER_LOWER' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/onboarding/textbook-confirm', component: TextbookConfirmPage },
        { path: '/onboarding/character', component: { template: '<p>角色</p>' } },
        { path: '/onboarding/grade', component: { template: '<p>年级</p>' } },
        { path: '/achievements', component: { template: '<p>成就</p>' } },
      ],
    })
    await router.push('/onboarding/textbook-confirm')
    const wrapper = mount(TextbookConfirmPage, { global: { plugins: [pinia, router] } })
    try {
      await vi.waitFor(() =>
        expect(
          wrapper
            .findAllComponents(TextbookCard)
            .find((c) => c.props('subjectCode') === 'CHINESE')
            ?.props('candidateCount'),
        ).toBe(1),
      )
      expect(store.selectedTextbooks.CHINESE).toBe(book)
      const button = wrapper.findAll('button').find((b) => b.text().includes('确认教材'))!
      expect(button.attributes('disabled')).toBeUndefined()
      await button.trigger('click')
      await flushPromises()
      expect(curriculumProfileRepository.load()).toMatchObject({
        gradeId: 'GRADE_3',
        semesterId: 'SEMESTER_LOWER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G3_BNU_MATH_S2_2022_REVISED',
        englishTextbookVersionId: 'G3_SHANGHAI_ENGLISH_S2_2022',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('validates every question and all choice paths, and rejects an upper-volume or cross-lesson context', async () => {
    expect(questions).toHaveLength(87)
    for (const d of definitions) {
      const loaded = await new QuestionEngineAdapter().loadAssessment(context(d), {
        dataset: 'profile',
      })
      expect(loaded.questions).toHaveLength(3)
      expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(3)
      for (const q of loaded.questions) {
        expect(validateQuestion(q).issues, q.id).toEqual([])
        expect(q).toMatchObject({
          gradeId: 'GRADE_3',
          semesterId: 'SEMESTER_LOWER',
          textbookVersionId: book,
          sourceId: practiceSource,
        })
        for (const option of q.options!)
          expect(checkQuestAnswer(q, { type: 'singleChoice', optionId: option.id })).toBe(
            option.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect',
          )
      }
    }
    expect(() =>
      resolveAiTopic({ textbookId: upperBook, knowledgePointId: definitions[0]!.knowledgePointId }),
    ).toThrow()
    expect(
      (
        await new QuestionEngineAdapter().loadAssessment(
          { ...context(), lessonId: definitions[1]!.lessonId },
          { dataset: 'profile' },
        )
      ).issue,
    ).toBe('INVALID_CONTEXT')
  })

  it('creates three-question reading quests and all training variants only in their exact lower context', () => {
    for (const [i, d] of definitions.entries()) {
      const bundle = bundles[i]!,
        input = { bundle, title: d.title, text: d.text }
      expect(createReadingQuest(input)?.stages).toHaveLength(3)
      for (const variant of ['warmup', 'practice', 'challenge'] as const)
        expect(createTrainingQuest({ ...input, variant })?.stages).toHaveLength(9)
      expect(
        createReadingQuest({ ...input, bundle: { ...bundle, textbookId: upperBook } }),
      ).toBeNull()
      expect(createReadingQuest({ ...input, bundle: { ...bundle, unitId: 'wrong' } })).toBeNull()
    }
  })

  it('restores lower answers separately from upper-volume and another account', async () => {
    const options = { dataset: 'profile' as const, studentId: 'g3-child' }
    const store = useQuestionEngineStore()
    await store.loadAssessment(context(), options)
    await store.setAnswerDraft(correctAnswerDraft(questions[0]!))
    await store.submitAnswer()
    await store.goNext()
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().currentQuestionIndex).toBe(1)
    const upper = upperQuestions[0]!
    await useQuestionEngineStore().loadAssessment(
      {
        textbookId: upperBook,
        unitId: 'G3_PEP_CHINESE_S1_UNIT_01',
        lessonId: 'G3_PEP_CHINESE_S1_LESSON_READING_01',
        knowledgePointId: upper.knowledgePointId!,
        source: 'lesson_practice',
      },
      options,
    )
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
    selectAccount('another-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
  })

  it('loads the actual lower Agent snapshot, plans a reading target and supplies balanced comprehensive papers', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_3', semesterId: 'SEMESTER_LOWER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g3-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g3-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(32)
    expect(snapshot.curriculum.semester.code).toBe('LOWER')
    const prepared = buildAgentContext(
      snapshot,
      'g3-child',
      book,
      '2026-10-08T09:33:39Z',
      DEFAULT_LEARNING_PLANNER_CONFIG,
    )
    const plan = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(prepared.context)
    expect(plan.textbookId).toBe(book)
    expect(definitions.some((d) => d.knowledgePointId === plan.targetKnowledgePointId)).toBe(true)
    const curriculum = (await curriculumService.getLearningMapCurriculum(book))!,
      map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
    for (const paper of buildAssessmentPapers(map)) {
      expect(paper.questions).toHaveLength(32)
      expect(paper.coveredPoints).toBe(32)
      expect(paper.questions.every((q) => q.textbookVersionId === book)).toBe(true)
    }
    for (const unit of imported.units)
      for (const paper of buildAssessmentPapers(map, unit.id)) {
        const count = new Set(
          map.islands
            .filter((i) => i.unitId === unit.id)
            .flatMap((i) => i.lessons.flatMap((l) => l.nodes.map((n) => n.knowledgePointId))),
        ).size
        expect(paper.questions).toHaveLength(count * 2)
        expect(paper.coveredPoints).toBe(count)
      }
  })

  it.each([1, 10, 16, 23])(
    'shows actual lesson %i with source limits and the reading-practice entry',
    async (number) => {
      const d = definitions.find((d) => d.number === number)!,
        pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'g3-child', displayName: '小岛同学' }
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
          { path: '/assessment', component: { template: '<p>练习</p>' } },
          { path: '/lesson', component: { template: '<p>课文</p>' } },
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
            LessonReadingPanel: true,
          },
        },
      })
      try {
        await vi.waitFor(() => expect(wrapper.text()).toContain(d.sourceNote))
        expect(wrapper.text()).toContain(d.title)
        expect(wrapper.text()).toContain('本册按附件提供的单元顺序与文本学习')
        expect(wrapper.findAll('button').some((b) => b.text().includes('开始正式练习'))).toBe(true)
        expect(wrapper.text()).not.toContain('标题已导入，正文待补充')
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('passes the model compilation contract for all 29 texts using only their own approved questions', async () => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const request = JSON.parse(JSON.parse(String(init?.body)).messages[1].content)
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  selections: request.sources
                    .slice(0, 3)
                    .map((q: { sourceId: string; optionKeys: string[] }) => ({
                      sourceId: q.sourceId,
                      optionOrder: [...q.optionKeys].reverse(),
                    })),
                }),
              },
              finish_reason: 'stop',
            },
          ],
          usage: { total_tokens: 10 },
        }),
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetcher)
    const generate = createFormalGenerator({
      FORMAL_AI_ENABLED: 'true',
      LLM_PROVIDER: 'OPENAI_COMPATIBLE',
      LLM_BASE_URL: 'https://model.example/v1',
      LLM_API_KEY: 'test-key',
      LLM_MODEL: 'test-model',
    })
    for (const d of definitions) {
      const batch = await generate({
        profileId: 'g3-child',
        textbookId: book,
        knowledgePointId: d.knowledgePointId,
      })
      expect(batch.questions).toHaveLength(3)
      expect(
        batch.questions.every(
          (q) =>
            q.sourceQuestion?.textbookVersionId === book &&
            q.sourceQuestion.knowledgePointId === d.knowledgePointId,
        ),
      ).toBe(true)
    }
    expect(fetcher).toHaveBeenCalledTimes(29)
  })
})
