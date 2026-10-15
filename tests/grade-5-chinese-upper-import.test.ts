import correction from '@/data/curriculum/grade-5/chinese-pep-upper/reading-19-image-correction.json'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G5_PEP_CHINESE_S1_TEXTBOOK_ID as book,
  gradeFiveChineseSource as supplied,
  G5_PEP_CHINESE_CONTENT_SOURCE_ID as originalSource,
  G5_ASTRONAUT_IMAGE_SOURCE_ID as imageSource,
  G5_PEP_CHINESE_LITERACY_SOURCE_ID as literacySourceId,
  gradeFiveChineseLiteracySource as literacy,
  gradeFiveChineseDefinitions as definitions,
  gradeFiveChineseCurriculum as imported,
  gradeFiveChineseQuestions as questions,
  gradeFiveChineseBundles as bundles,
  gradeFiveChineseReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-5/chinese-pep-upper'
import {
  G5_CHINESE_IMPORT_APPROVAL as approval,
  G5_CHINESE_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeFiveChineseApproval'
import {
  productionCurriculumData,
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { curriculumService } from '@/services/runtime'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { validateQuestion } from '@/services/validation/questionValidation'
import { correctAnswerDraft, QuestionEngineAdapter } from '@/services/question-engine'
import { reviewedAiSources, supportsAiPractice } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic } from '../server/llm/formalGeneration'
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
import LessonContentRenderer from '@/components/lesson-player/LessonContentRenderer.vue'
import TextbookCoverage from '@/components/curriculum/TextbookCoverage.vue'

const context = (d = definitions.find((d) => d.number === 1)!) => ({
  textbookId: book,
  unitId: d.unitId,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  source: 'lesson_practice' as const,
})
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('g5-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 5 upper Chinese eight units and literacy appendices', () => {
  it('preserves original sections and replaces incomplete appendices with the supplied images', () => {
    const raw = readFileSync('src/data/curriculum/grade-5/chinese-pep-upper/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
    expect(supplied.sourceSha256).toBe(
      '39a7436c368a9d3ee9b43781d134922cc654195a8d4c8296fbef8a25fdd9689b',
    )
    expect(imported.units.map((u) => u.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(definitions).toHaveLength(57)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 25 }, (_, i) => i + 1),
    )
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      3, 10, 14, 19, 21, 25,
    ])
    expect(definitions.filter((d) => d.kind === 'example').map((d) => d.title)).toEqual([
      '鲸',
      '风向袋的制作',
    ])
    expect(definitions.filter((d) => d.kind === 'introduction')).toHaveLength(8)
    expect(readingOnly).toHaveLength(30)
    expect(imported.textbooks[0]).toMatchObject({
      semesterId: 'SEMESTER_UPPER',
      createdAt: importedAt,
    })
    expect(imported.textbooks[0]?.editionYear).toBeUndefined()
    for (const d of definitions) {
      expect(
        d.kind === 'appendix'
          ? readFileSync(
              'src/data/curriculum/grade-5/chinese-pep-upper/literacy-source-text.md',
              'utf8',
            )
          : d.number === 19
            ? correction.text
            : raw.toString(),
      ).toContain(d.text)
      expect(d.text).not.toContain('需要我**单独生成')
      const c = imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
      expect(c.body.suppliedText).toBe(d.text)
      expect(c.sourceId).toBe(
        d.kind === 'appendix' ? literacySourceId : d.number === 19 ? imageSource : originalSource,
      )
      expect(d.questions).toHaveLength(['reading', 'example'].includes(d.kind) ? 3 : 0)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
    }
    // Reassemble all educational body lines: no paragraphs or embedded garden headings are lost.
    const ignored =
      /^(?:#{1,4} (?:部编版|第[一二三四五六七八]单元|单元导语|\d|口语交际|习作|语文园地|快乐读书吧|鲸$|风向袋的制作|识字表|写字表|词语表)|> |---$|需要我)/
    const bodies = [...supplied.lessons, ...definitions].map((d) => d.text).join('\n')
    for (const line of raw
      .toString()
      .split('\n')
      .filter((line) => line.trim() && !ignored.test(line)))
      expect(bodies).toContain(line)
    expect(definitions.find((d) => d.number === 1)?.title).toBe('1 桂花雨')
    expect(definitions.find((d) => d.number === 22)?.title).toBe('22 白鹭')
    expect(definitions.find((d) => d.number === 21)?.text).toContain('（略读）')
    expect(definitions.find((d) => d.number === 19)?.sourceNote).toContain('作者按图片确认为刘洋')
    expect(definitions.some((d) => d.key === 'garden-5')).toBe(false)
    for (const key of ['literacy-recognition', 'literacy-writing', 'literacy-words']) {
      const d = definitions.find((d) => d.key === key)!
      expect(d.unit).toBe(9)
      expect(d.text.match(/语文园地/g)).toHaveLength(2)
    }
    expect(definitions.find((d) => d.key === 'literacy-recognition')?.sourceNote).toContain(
      '200个生字和9个蓝色多音字条目',
    )
    expect(definitions.find((d) => d.key === 'literacy-writing')?.sourceNote).toContain('220个字')
  })

  it('passes release readiness and preserves independent source attribution', () => {
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    expect(catalog.textbooks.filter((b) => b.id === book)).toHaveLength(1)
    expect(
      catalog.questions.filter(
        (q) => q.textbookVersionId === book && !q.tags.includes('comprehensive-only'),
      ),
    ).toHaveLength(81)
    expect(mvpCurriculumScope.readingOnlyKnowledgePointIds).toEqual(
      expect.arrayContaining(readingOnly),
    )
    for (const source of imported.sources) {
      expect(catalog.contentSources.find((s) => s.id === source.id)).toMatchObject({
        releaseApprovalId: approval,
        verifiedAt: source.verifiedAt,
      })
      expect(catalog.sourceReferences.find((s) => s.id === source.id)?.verifiedBy).toContain(
        'Codex',
      )
    }
  })

  it('offers grade five upper to every account and shows eight readable units and an appendix island', async () => {
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['g5-a', 'g5-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_5',
        semesterId: 'SEMESTER_UPPER',
        regionId: 'unknown-region',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
      const curriculum = (await curriculumService.getLearningMapCurriculum(book))!
      const map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
      expect(map.islands).toHaveLength(9)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(57)
      for (const d of definitions) {
        const content = await repo.getByKnowledgePoint(d.knowledgePointId)
        expect(content?.blocks.map((b) => b.block.text).join('\n\n')).toContain(
          d.text.replaceAll('**', '').replace(/^#{2,4} /gm, ''),
        )
      }
    }
    const wrapper = mount(TextbookCoverage, { props: { gradeId: null, semesterId: null } })
    try {
      await flushPromises()
      const buttons = wrapper
        .findAll('button')
        .filter((b) => b.attributes('aria-label')?.startsWith('五年级'))
      const upper = buttons.find((b) => b.attributes('aria-label')?.startsWith('五年级上册'))!
      const lower = buttons.find((b) => b.attributes('aria-label')?.startsWith('五年级下册'))!
      expect(upper.attributes('disabled')).toBeUndefined()
      expect(lower.attributes('disabled')).toBeUndefined()
      await upper.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_5', semesterId: 'SEMESTER_UPPER' }],
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('automatically confirms the sole Chinese book without requiring unimported subjects', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g5-child', displayName: '小岛同学' }
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_5', semesterId: 'SEMESTER_UPPER' })
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
      await vi.waitFor(() => expect(store.selectedTextbooks.CHINESE).toBe(book))
      const button = wrapper.findAll('button').find((b) => b.text().includes('确认教材'))!
      expect(button.attributes('disabled')).toBeUndefined()
      await button.trigger('click')
      await flushPromises()
      expect(curriculumProfileRepository.load()).toMatchObject({
        gradeId: 'GRADE_5',
        semesterId: 'SEMESTER_UPPER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G5_BNU_MATH_S1_USER_OUTLINE',
        englishTextbookVersionId: 'G5_SHANGHAI_ENGLISH_S1_2022',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps all 81 graded questions solvable and confines reading/AI/training to supported texts', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.gradeId).toBe('GRADE_5')
      expect(q.semesterId).toBe('SEMESTER_UPPER')
      expect(checkQuestAnswer(q, correctAnswerDraft(q))).toBe('correct')
      for (const option of q.options!) {
        expect(checkQuestAnswer(q, { type: 'singleChoice', optionId: option.id })).toBe(
          option.optionKey ===
            ('correctOptionKey' in q.answerRule ? q.answerRule.correctOptionKey : '')
            ? 'correct'
            : 'incorrect',
        )
      }
    }
    for (const d of definitions) {
      const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
      const input = { bundle, title: d.title, text: d.text }
      const quest = createReadingQuest(input)
      const loaded = await adapter.loadAssessment(context(d), { dataset: 'profile' })
      if (d.questions.length) {
        expect(quest?.stages).toHaveLength(3)
        expect(loaded.questions).toHaveLength(3)
        expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(3)
        expect(
          resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }),
        ).toBeTruthy()
        for (const variant of [0, 1, 2])
          expect(createTrainingQuest({ ...input, variant })?.stages).toHaveLength(9)
      } else {
        expect(quest).toBeNull()
        expect(createTrainingQuest(input)).toBeNull()
        expect(loaded.questions).toEqual([])
        expect(supportsAiPractice(book, d.knowledgePointId)).toBe(false)
      }
      expect(
        createReadingQuest({
          ...input,
          bundle: { ...bundle, textbookId: 'G4_PEP_CHINESE_S1_USER_IMPORTED' },
        }),
      ).toBeNull()
    }
  })

  it('feeds grade-five Agent context and balanced papers with separate original open-response assessment tasks', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_5', semesterId: 'SEMESTER_UPPER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g5-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g5-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(57)
    const prepared = buildAgentContext(
      snapshot,
      'g5-child',
      book,
      '2026-10-09T01:34:37Z',
      DEFAULT_LEARNING_PLANNER_CONFIG,
    )
    const plan = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(prepared.context)
    expect(plan.textbookId).toBe(book)
    expect(definitions.some((d) => d.knowledgePointId === plan.targetKnowledgePointId)).toBe(true)
    const map = buildLearningMapViewModel(
      (await curriculumService.getLearningMapCurriculum(book))!,
      [],
      { dataset: 'profile' },
    )
    for (const paper of buildAssessmentPapers(map)) {
      expect(paper.questions).toHaveLength(57)
      expect(paper.coveredPoints).toBe(57)
    }
  })

  it('keeps grade four and five and same-title passages separate', async () => {
    const upperId = 'G4_PEP_CHINESE_S1_USER_IMPORTED'
    const upper = await curriculumService.getLearningMapCurriculum(upperId)
    expect(upper?.knowledgePoints).toHaveLength(52)
    const lowerIds = new Set(definitions.map((d) => d.knowledgePointId))
    expect(upper?.knowledgePoints.every((d) => !lowerIds.has(d.id))).toBe(true)
    const example = definitions.find((d) => d.number === 7)!
    expect(() =>
      resolveAiTopic({ textbookId: upperId, knowledgePointId: example.knowledgePointId }),
    ).toThrow()
    expect(reviewedAiSources(upperId, example.knowledgePointId)).toEqual([])
    expect(catalog.textbooks.find((b) => b.id === upperId)?.semesterId).toBe('SEMESTER_UPPER')
  })

  it('resumes answers for this account and book only', async () => {
    const options = { dataset: 'profile' as const, studentId: 'same-child' }
    const store = useQuestionEngineStore()
    await store.loadAssessment(context(), options)
    await store.setAnswerDraft(correctAnswerDraft(store.questions[0]!))
    await store.submitAnswer()
    const id = store.session?.id
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.id).toBe(id)
    expect(useQuestionEngineStore().session?.attempts).toHaveLength(1)
    selectAccount('other-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
  })

  it.each([
    'reading-01',
    'reading-04',
    'reading-07',
    'reading-19',
    'reading-21',
    'reading-24',
    'reading-25',
    'example-whale',
    'example-windsock',
    'oral-1',
    'writing-5',
    'introduction-3',
    'garden-7',
    'reading-bar-3',
    'literacy-recognition',
    'literacy-writing',
    'literacy-words',
  ])('shows supplied content and appropriate practice availability for %s', async (key) => {
    const d = definitions.find((d) => d.key === key)!,
      pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g5-child', displayName: '小岛同学' }
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
      await vi.waitFor(() => expect(wrapper.text()).toContain(d.sourceNote))
      expect(wrapper.text()).toContain('五年级上册已接入附件提供的八个单元')
      if (key === 'reading-19') {
        expect(wrapper.text()).toContain('本文作者刘洋，选作课文时有改动。')
        expect(wrapper.text()).toContain('2022年6月1日于问天阁')
        expect(wrapper.text()).toContain('会认字（附件所列）')
        expect(wrapper.text()).not.toContain('从太空望向地球，我们的家园那么美丽')
        const content = catalog.contents.find(
          (item) => item.knowledgePointId === d.knowledgePointId,
        )!
        expect(content.currentVersion).toBe(2)
        expect(content.body.author).toBe('刘洋')
        for (const image of correction.images) {
          expect(createHash('sha256').update(readFileSync(image.path)).digest('hex')).toBe(
            image.sha256,
          )
        }
        expect(
          createHash('sha256')
            .update(
              readFileSync(
                'src/data/curriculum/grade-5/chinese-pep-upper/reading-19-image-source.txt',
              ),
            )
            .digest('hex'),
        ).toBe(correction.sourceSha256)
        const active = catalog.questions.filter(
          (question) => question.knowledgePointId === d.knowledgePointId,
        )
        expect(active).toHaveLength(3)
        expect(
          active.every((question) => question.questionVersion === 2 && question.id.endsWith('_R2')),
        ).toBe(true)
        expect(
          catalog.questions.some((question) => question.id === `${d.knowledgePointId}_Q1`),
        ).toBe(false)
      }
      const table = literacy.tables.find((table) => table.key === d.key)
      if (table) {
        const entries = table.groups.flatMap((group) => group.entries)
        const player = wrapper.getComponent(LessonContentRenderer)
        for (const presentation of ['reading', 'steps'] as const) {
          const renderer = mount(LessonContentRenderer, {
            props: { ...player.props(), presentation },
          })
          try {
            expect(
              renderer.findAll('.literacy-table__entry').map((entry) => {
                const clone = entry.element.cloneNode(true) as Element
                clone.querySelectorAll('rt, rp').forEach((node) => node.remove())
                return clone.textContent?.trim()
              }),
            ).toEqual(entries.map((entry) => (typeof entry === 'string' ? entry : entry.character)))
            expect(renderer.findAll('rt').map((rt) => rt.text())).toEqual(
              entries.filter((entry) => typeof entry !== 'string').map((entry) => entry.pinyin),
            )
            expect(renderer.findAll('.literacy-table__entry--polyphonic')).toHaveLength(
              table.polyphonicCount,
            )
            expect(
              renderer
                .findAll('.literacy-table__source-page img')
                .map((img) => img.attributes('src')),
            ).toEqual(table.sourcePages.map((page) => page.url))
          } finally {
            renderer.unmount()
          }
        }
      } else {
        for (const paragraph of d.text
          .replaceAll('**', '')
          .replace(/^#{2,4} /gm, '')
          .split(/\n\n+/))
          expect(wrapper.text()).toContain(paragraph)
      }
      await vi.waitFor(() =>
        expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(
          Boolean(d.questions.length),
        ),
      )
      if (!d.questions.length) {
        expect(wrapper.text()).toContain(
          d.kind === 'appendix' ? '这是全册字词附录' : '本栏目供阅读、交流和写作',
        )
        expect(wrapper.text()).not.toContain('正式练习题正在准备中')
      }
    } finally {
      wrapper.unmount()
    }
  })
})
