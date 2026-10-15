import illustration from '@/data/curriculum/grade-4/chinese-pep-lower/luhua-illustration.json'
import {
  luhuaIllustrationAsset,
  luhuaIllustrationSource,
} from '@/data/curriculum/grade-4/chinese-pep-lower/luhua-illustration'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G4_PEP_CHINESE_S2_TEXTBOOK_ID as book,
  gradeFourChineseLowerSource as supplied,
  gradeFourLuhuaCorrection as correction,
  G4_LUHUA_IMAGE_SOURCE_ID as imageSource,
  G4_LUHUA_PRACTICE_SOURCE_ID as revisedPracticeSource,
  G4_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID as previousPracticeSource,
  G4_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID as originalSource,
  gradeFourChineseLowerDefinitions as definitions,
  gradeFourChineseLowerCurriculum as imported,
  gradeFourChineseLowerQuestions as questions,
  gradeFourChineseLowerBundles as bundles,
  gradeFourChineseLowerReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-4/chinese-pep-lower'
import {
  G4_CHINESE_LOWER_IMPORT_APPROVAL as approval,
  G4_CHINESE_LOWER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeFourChineseLowerApproval'
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
import TextbookCoverage from '@/components/curriculum/TextbookCoverage.vue'

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
  selectAccount('g4-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 4 lower Chinese eight units and literacy appendices', () => {
  it('preserves all supplied passages, nested columns, appendix groups and evidence while marking source defects', () => {
    const raw = readFileSync('src/data/curriculum/grade-4/chinese-pep-lower/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
    expect(supplied.sourceSha256).toBe(
      '5abb685db96560489d5182ac330e71838f69e6cca994638c37dadc12673a5fac',
    )
    expect(imported.units.map((u) => u.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(imported.units.at(-1)?.title).toBe('全册附录：字词表')
    expect(definitions).toHaveLength(53)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1),
    )
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      4, 8, 12, 20, 21, 25, 28,
    ])
    expect(definitions.filter((d) => d.kind === 'example').map((d) => d.title)).toEqual([
      '颐和园',
      '七月的天山',
    ])
    expect(readingOnly).toHaveLength(23)
    expect(imported.textbooks[0]).toMatchObject({
      semesterId: 'SEMESTER_LOWER',
      createdAt: importedAt,
    })
    expect(imported.textbooks[0]?.editionYear).toBeUndefined()
    for (const d of definitions) {
      expect(d.number === 21 ? correction.text : raw.toString()).toContain(d.text)
      expect(d.text).not.toContain('我可以继续生成')
      const content = imported.courseContents.find(
        (c) => c.knowledgePointId === d.knowledgePointId,
      )!
      expect(content.body.suppliedText).toBe(d.text)
      expect(content.sourceId).toBe(d.number === 21 ? imageSource : originalSource)
      expect(d.questions).toHaveLength(['reading', 'example'].includes(d.kind) ? 3 : 0)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
    }
    const shoes = definitions.find((d) => d.number === 21)!
    expect(shoes.text).toContain('仅仅过了三天，就只剩下十一双了')
    expect(shoes.sourceNote).not.toContain('数量表述不一致')
    expect(shoes.optional).toBe(true)
    expect(definitions.find((d) => d.key === 'garden-7')?.sourceNote).toContain('未见顿号')
    expect(definitions.find((d) => d.number === 4)?.text).not.toContain('口语交际')
    expect(definitions.find((d) => d.key === 'garden-1')?.text).not.toContain('快乐读书吧')
    expect(definitions.find((d) => d.key === 'reading-bar-1')?.text).toContain('十万个为什么')
    expect(definitions.find((d) => d.key === 'integrated-3')?.text).toContain('诗歌朗诵会')
    for (const d of definitions.filter((d) => d.kind === 'appendix')) {
      expect(d.unit).toBe(9)
      expect(d.text.match(/^## 第.+单元$/gm)).toHaveLength(8)
    }
    expect(definitions.find((d) => d.key === 'literacy-recognition')?.text).toContain('扒、扒')
  })

  it('replaces the entire Luhua passage from six images and retires incompatible questions and quest progress', async () => {
    const root = 'src/data/curriculum/grade-4/chinese-pep-lower/'
    const raw = readFileSync(root + 'sources/luhua-shoes/transcription.txt')
    expect(raw.toString().trim()).toBe(correction.text)
    expect(createHash('sha256').update(raw).digest('hex')).toBe(correction.transcriptionSha256)
    expect(correction.images).toHaveLength(6)
    for (const source of correction.images)
      expect(
        createHash('sha256')
          .update(readFileSync(root + source.path))
          .digest('hex'),
      ).toBe(source.sha256)
    expect(correction.sections).toHaveLength(4)
    expect(correction.sections.join('\n\n')).toBe(correction.text)
    const d = definitions.find((d) => d.number === 21)!
    expect(d.title).toBe('21* 芦花鞋')
    expect(d.text).toContain('第一百零一双是为青铜编的')
    expect(d.text).toContain('一共九个人，都拿了芦花鞋，其中一个人拿了两双')
    expect(d.text).toContain('他没有因为他们的眼神里闪现出来的那份欣喜而涨价')
    expect(d.text).toContain('他笑了笑，掉头朝那个人追了过去')
    expect(d.text).not.toContain('城里人把钱给了青铜，拿着芦花鞋走了')
    expect(d.text).not.toContain('葵花，等着他回去')
    const content = imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
    expect(content.currentVersion).toBe(3)
    expect(content.body.readingPrompt).toBe(correction.readingPrompt)
    expect(content.body.authorNote).toContain('曹文轩')
    const active = questions.filter((q) => q.knowledgePointId === d.knowledgePointId)
    expect(active).toHaveLength(3)
    expect(
      active.every(
        (q) =>
          q.questionVersion === 2 && q.sourceId === revisedPracticeSource && q.id.endsWith('_R2'),
      ),
    ).toBe(true)
    for (const index of [1, 2, 3])
      expect(catalog.questions.some((q) => q.id === `${d.knowledgePointId}_Q${index}`)).toBe(false)
    const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
    const quest = createReadingQuest({ bundle, title: d.title, text: d.text })!
    expect(quest.id).toContain(':v2:')
    expect(
      createReadingQuest({
        bundle: {
          ...bundle,
          learningContent: {
            ...bundle.learningContent,
            sourceId: previousPracticeSource,
            currentVersion: 1,
          },
        },
        title: d.title,
        text: d.text,
      }),
    ).toBeNull()
    const loaded = await new QuestionEngineAdapter().loadAssessment(context(d), {
      dataset: 'profile',
    })
    expect(loaded.questions.map((q) => q.id)).toEqual(active.map((q) => q.id))
    expect(reviewedAiSources(book, d.knowledgePointId).map((q) => q.id)).toEqual(
      active.map((q) => q.id),
    )
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
    ).toHaveLength(90)
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

  it('offers grade four lower to every account and shows eight readable units and an appendix island', async () => {
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['g4-a', 'g4-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_4',
        semesterId: 'SEMESTER_LOWER',
        regionId: 'unknown-region',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
      const curriculum = (await curriculumService.getLearningMapCurriculum(book))!
      const map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
      expect(map.islands).toHaveLength(9)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(53)
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
        .filter((b) => b.attributes('aria-label')?.startsWith('四年级'))
      const upper = buttons.find((b) => b.attributes('aria-label')?.startsWith('四年级上册'))!
      const lower = buttons.find((b) => b.attributes('aria-label')?.startsWith('四年级下册'))!
      expect(upper.attributes('disabled')).toBeUndefined()
      expect(lower.attributes('disabled')).toBeUndefined()
      await lower.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_4', semesterId: 'SEMESTER_LOWER' }],
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('automatically confirms the sole Chinese book without requiring unimported subjects', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g4-child', displayName: '小岛同学' }
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_4', semesterId: 'SEMESTER_LOWER' })
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
        gradeId: 'GRADE_4',
        semesterId: 'SEMESTER_LOWER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G4_BNU_MATH_S2_USER_OUTLINE',
        englishTextbookVersionId: 'G4_SHANGHAI_ENGLISH_S2_2022',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps all 90 graded questions solvable and confines reading/AI/training to supported texts', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.gradeId).toBe('GRADE_4')
      expect(q.semesterId).toBe('SEMESTER_LOWER')
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

  it('feeds grade-four Agent context and balanced papers with separate original open-response assessment tasks', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_4', semesterId: 'SEMESTER_LOWER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g4-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g4-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(53)
    const prepared = buildAgentContext(
      snapshot,
      'g4-child',
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
      expect(paper.questions).toHaveLength(53)
      expect(paper.coveredPoints).toBe(53)
    }
  })

  it('keeps upper and lower textbooks and same-title passages separate', async () => {
    const upperId = 'G4_PEP_CHINESE_S1_USER_IMPORTED'
    const upper = await curriculumService.getLearningMapCurriculum(upperId)
    expect(upper?.knowledgePoints).toHaveLength(52)
    const lowerIds = new Set(definitions.map((d) => d.knowledgePointId))
    expect(upper?.knowledgePoints.every((d) => !lowerIds.has(d.id))).toBe(true)
    const example = definitions.find((d) => d.key === 'example-palace')!
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
    'reading-21',
    'reading-24',
    'reading-28',
    'example-palace',
    'example-tianshan',
    'oral-1',
    'writing-5',
    'integrated-3',
    'garden-7',
    'reading-bar-1',
    'literacy-recognition',
    'literacy-writing',
    'literacy-words',
  ])('shows supplied content and appropriate practice availability for %s', async (key) => {
    const d = definitions.find((d) => d.key === key)!,
      pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g4-child', displayName: '小岛同学' }
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
      expect(wrapper.text()).toContain('四年级下册已接入附件提供的八个单元')
      if (key === 'reading-21') {
        const image = wrapper.find(`img[src="${illustration.url}"]`)
        expect(image.exists()).toBe(true)
        expect(image.attributes('alt')).toContain('少年青铜背着布袋')
        expect(wrapper.text()).toContain('AI生成配套素材')
        expect(
          catalog.mediaAssets.find((asset) => asset.id === luhuaIllustrationAsset.id),
        ).toBeDefined()
        expect(
          catalog.contentSources.find((source) => source.id === luhuaIllustrationSource.id),
        ).toMatchObject({ sourceType: 'AI_GENERATED' })
        const bytes = readFileSync(`public${illustration.url}`)
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(illustration.sha256)
      }
      for (const paragraph of d.text
        .replaceAll('**', '')
        .replace(/^#{2,4} /gm, '')
        .split(/\n\n+/))
        expect(wrapper.text()).toContain(paragraph)
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
