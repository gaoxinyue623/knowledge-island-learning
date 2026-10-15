import recognition from '@/data/curriculum/grade-6/chinese-pep-upper/recognition-supplement.json'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G6_PEP_CHINESE_S1_TEXTBOOK_ID as book,
  gradeSixChineseSource as supplied,
  gradeSixChineseLesson22Correction as correction,
  G6_CHINESE_LESSON22_CONTENT_SOURCE_ID as imageSource,
  G6_CHINESE_LESSON22_PRACTICE_SOURCE_ID as revisedPracticeSource,
  gradeSixChineseDefinitions as definitions,
  gradeSixChineseCurriculum as imported,
  gradeSixChineseQuestions as questions,
  gradeSixChineseBundles as bundles,
  gradeSixChineseReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-6/chinese-pep-upper'
import {
  G6_CHINESE_IMPORT_APPROVAL as approval,
  G6_CHINESE_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeSixChineseApproval'
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
  selectAccount('g6-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 6 upper Chinese eight units and literacy appendices', () => {
  it('接入八单元28篇带拼音认读表并保留独立出处', () => {
    const source = readFileSync(
      'src/data/curriculum/grade-6/chinese-pep-upper/recognition-source.md',
    )
    expect(createHash('sha256').update(source).digest('hex')).toBe(recognition.sourceSha256)
    const d = definitions.find((d) => d.key === 'literacy-recognition')!
    expect(d.text.match(/### 第/g)).toHaveLength(8)
    expect(d.text.match(/^\d+\. /gm)).toHaveLength(28)
    for (const word of ['璀璨cuǐ càn', '豁huō', '叉chǎ', '卡qiǎ', '耙pá', '绷běng', '臧zāng'])
      expect(d.text).toContain(word)
    expect(d.questions).toHaveLength(0)
    expect(d.unit).toBe(9)
    const content = imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
    expect(content.sourceId).toBe('G6_PEP_CHINESE_S1_RECOGNITION_USER_TEXT_V1')
    expect(content.body.missingSections).toEqual([])
  })

  it('preserves all supplied bodies, nested materials and literacy entries and retains the original import archive', () => {
    const raw = readFileSync('src/data/curriculum/grade-6/chinese-pep-upper/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
    expect(supplied.sourceSha256).toBe(
      'b05d3c0f24ea695963d709535e2ce10449d065eae05b4a6075910ea178a02fbd',
    )
    expect(imported.units.map((u) => u.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(definitions).toHaveLength(53)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 26 }, (_, i) => i + 1),
    )
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      7, 10, 13, 17, 18, 22, 26,
    ])
    expect(definitions.filter((d) => d.kind === 'example').map((d) => d.title)).toEqual([
      '爸爸的计划',
      '小站',
    ])
    expect(readingOnly).toHaveLength(25)
    expect(imported.textbooks[0]).toMatchObject({
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      createdAt: importedAt,
    })
    expect(imported.textbooks[0]?.editionYear).toBe(2022)
    for (const d of definitions) {
      if (d.number !== 22 && d.key !== 'literacy-recognition')
        expect(raw.toString()).toContain(d.text)
      expect(
        imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)?.body
          .suppliedText,
      ).toBe(d.text)
      expect(d.questions).toHaveLength(['reading', 'example'].includes(d.kind) ? 3 : 0)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
    }
    const bodies = supplied.lessons.map((d) => d.text).join('\n')
    const ignored =
      /^(?:#{1,5} (?:义务教育|第[一二三四五六七八]单元|\d|口语交际|习作|语文园地|快乐读书吧|例文$|爸爸的计划$|小站$)|> |---$|第八单元$|\d+\*? |口语交际：|习作：|语文园地[七八]$|快乐读书吧：|附录：|一、会写字|二、词语表)/
    for (const line of raw
      .toString()
      .split('\n')
      .filter((line) => line.trim() && !ignored.test(line)))
      expect(bodies).toContain(line)
    expect(definitions.find((d) => d.number === 10)?.text).toContain('#### 材料四')
    expect(definitions.find((d) => d.number === 20)?.text).toContain('#### 曹冲称象')
    expect(definitions.find((d) => d.number === 3)?.text).toContain('西江月·夜行黄沙道中')
    expect(definitions.some((d) => d.key === 'literacy-recognition')).toBe(true)
    expect(definitions.filter((d) => d.kind === 'appendix').map((d) => d.unit)).toEqual([9, 9, 9])
    expect(definitions.find((d) => d.key === 'literacy-writing')?.text.split('、')).toHaveLength(
      191,
    )
    expect(definitions.find((d) => d.key === 'literacy-words')?.text.split('、')).toHaveLength(101)
    expect(definitions.find((d) => d.number === 21)?.sourceNote).toContain('不作为钟表构造知识')
    expect(definitions.find((d) => d.number === 9)?.sourceNote).toContain('不作为最新科学结论')
  })

  it('uses all three image pages for lesson 22, retires stale questions and preserves every other lesson', () => {
    const root = 'src/data/curriculum/grade-6/chinese-pep-upper/'
    const transcription = readFileSync(root + 'lesson-22-transcription.md')
    expect(createHash('sha256').update(transcription).digest('hex')).toBe(
      correction.transcriptionSha256,
    )
    expect(correction.images).toHaveLength(3)
    for (const page of correction.images)
      expect(
        createHash('sha256')
          .update(readFileSync(root + page.path))
          .digest('hex'),
      ).toBe(page.sha256)
    const d = definitions.find((d) => d.number === 22)!
    expect(d.title).toBe('22* 他们那时候多有趣啊')
    expect(d.text).toBe(
      transcription.toString().split('## 课文\n\n')[1]!.split('\n\n## 教材脚注')[0],
    )
    expect(d.text).toContain('在2155年5月17日这一天')
    expect(d.text).toContain('可现在她比以往任何时候都更憎恶它')
    expect(d.text).toContain('我可不想让一个陌生人到我家里来教我功课')
    expect(d.text).toContain('我们把1/2和1/4这两个分数加在一起')
    expect(d.text.endsWith('她想，他们那时候多有趣啊！')).toBe(true)
    expect(d.text).not.toContain('分数的加减运算')
    expect(d.sourceNote).not.toContain('开头尚未提供')
    const content = imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
    expect(content).toMatchObject({
      currentVersion: 2,
      sourceId: imageSource,
      updatedAt: correction.updatedAt,
    })
    expect(content.body).toMatchObject({
      missingSections: [],
      readingPrompt: correction.readingPrompt,
      authorNote: correction.authorNote,
    })
    const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
    const input = { bundle, title: d.title, text: d.text }
    expect(createReadingQuest(input)?.id).toContain(':v2:')
    expect(
      createReadingQuest({
        ...input,
        bundle: { ...bundle, learningContent: { ...bundle.learningContent, currentVersion: 1 } },
      }),
    ).toBeNull()
    expect(
      createReadingQuest({
        ...input,
        bundle: {
          ...bundle,
          learningContent: {
            ...bundle.learningContent,
            sourceId: 'G6_PEP_CHINESE_S1_ORIGINAL_PRACTICE_V1',
          },
        },
      }),
    ).toBeNull()
    const revised = questions.filter((q) => q.knowledgePointId === d.knowledgePointId)
    expect(revised).toHaveLength(3)
    for (const q of revised) {
      expect(q.questionVersion).toBe(2)
      expect(q.id).toMatch(/_R2$/)
      expect(q.sourceId).toBe(revisedPracticeSource)
    }
    expect(reviewedAiSources(book, d.knowledgePointId).map((q) => q.id)).toEqual(
      revised.map((q) => q.id),
    )
    for (const other of definitions.filter((d) => d.number !== 22)) {
      if (other.key === 'literacy-recognition') continue
      const original = supplied.lessons.find((original) => original.key === other.key)!
      expect(other.text).toBe(original.text)
      if (other.kind !== 'appendix') expect(other).toMatchObject(original)
      expect(other.revision).toBe(1)
    }
    expect(
      questions
        .filter((q) => q.knowledgePointId !== d.knowledgePointId)
        .every((q) => q.questionVersion === 1 && !q.id.endsWith('_R2')),
    ).toBe(true)
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
    ).toHaveLength(84)
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

  it('offers grade six upper to every account and shows eight readable units and an appendix island', async () => {
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['g6-a', 'g6-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_6',
        semesterId: 'SEMESTER_UPPER',
        regionId: 'unknown-region',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual(
        expect.arrayContaining([book, 'G6_PEP_CHINESE_2019_S1_USER_IMPORTED']),
      )
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
        .filter((b) => b.attributes('aria-label')?.startsWith('六年级'))
      const upper = buttons.find((b) => b.attributes('aria-label')?.startsWith('六年级上册'))!
      const lower = buttons.find((b) => b.attributes('aria-label')?.startsWith('六年级下册'))!
      expect(upper.attributes('disabled')).toBeUndefined()
      expect(lower.attributes('disabled')).toBeUndefined()
      await upper.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' }],
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('confirms the existing 2022 edition after an explicit version choice', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g6-child', displayName: '小岛同学' }
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' })
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
      await vi.waitFor(() => expect(store.resolutionStatus.CHINESE).toBe('NEEDS_CONFIRMATION'))
      store.selectTextbook('CHINESE', book)
      await flushPromises()
      expect(store.selectedTextbooks.CHINESE).toBe(book)
      const button = wrapper.findAll('button').find((b) => b.text().includes('确认教材'))!
      expect(button.attributes('disabled')).toBeUndefined()
      await button.trigger('click')
      await flushPromises()
      expect(curriculumProfileRepository.load()).toMatchObject({
        gradeId: 'GRADE_6',
        semesterId: 'SEMESTER_UPPER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G6_BNU_MATH_S1_2022_USER_OUTLINE',
        englishTextbookVersionId: 'G6_SHANGHAI_ENGLISH_S1_2022',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps all 84 graded questions solvable and confines reading/AI/training to supported texts', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.gradeId).toBe('GRADE_6')
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
          bundle: { ...bundle, textbookId: 'G5_PEP_CHINESE_S1_USER_IMPORTED' },
        }),
      ).toBeNull()
    }
  })

  it('feeds grade-six Agent context and balanced papers with separate original open-response assessment tasks', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g6-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g6-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(53)
    const prepared = buildAgentContext(
      snapshot,
      'g6-child',
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

  it('keeps grade five and six and same-title passages separate', async () => {
    const upperId = 'G5_PEP_CHINESE_S1_USER_IMPORTED'
    const upper = await curriculumService.getLearningMapCurriculum(upperId)
    expect(upper?.knowledgePoints).toHaveLength(57)
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
    'reading-03',
    'reading-10',
    'reading-20',
    'reading-21',
    'reading-22',
    'reading-26',
    'example-plan',
    'example-station',
    'oral-7',
    'writing-5',
    'garden-7',
    'reading-bar-8',
    'literacy-recognition',
    'literacy-writing',
    'literacy-words',
  ])('shows supplied content and appropriate practice availability for %s', async (key) => {
    const d = definitions.find((d) => d.key === key)!,
      pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g6-child', displayName: '小岛同学' }
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
      expect(wrapper.text()).toContain('六年级上册2022版已接入附件提供的八个单元')
      if (d.number === 22) {
        expect(wrapper.text()).toContain(correction.readingPrompt)
        expect(wrapper.text()).toContain(correction.authorNote)
        expect(wrapper.text()).not.toContain('开头尚缺')
        expect(wrapper.text()).not.toContain('续完')
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
