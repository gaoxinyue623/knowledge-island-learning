import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G4_PEP_CHINESE_S1_TEXTBOOK_ID as book,
  gradeFourChineseSource as supplied,
  gradeFourChineseSupplementSource as supplement,
  gradeFourChineseFinalSource as finalSupplement,
  gradeFourChineseTuoluoCorrection as tuoluoCorrection,
  G4_PEP_CHINESE_TUOLUO_SOURCE_ID as tuoluoSource,
  G4_PEP_CHINESE_FINAL_SOURCE_ID as finalSource,
  G4_PEP_CHINESE_SUPPLEMENT_SOURCE_ID as supplementSource,
  G4_PEP_CHINESE_CONTENT_SOURCE_ID as originalSource,
  G4_PEP_CHINESE_PEAS_SOURCE_ID as peasSource,
  gradeFourChineseDefinitions as definitions,
  gradeFourChineseCurriculum as imported,
  gradeFourChineseQuestions as questions,
  gradeFourChineseBundles as bundles,
  gradeFourChineseReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-4/chinese-pep-upper'
import {
  G4_CHINESE_IMPORT_APPROVAL as approval,
  G4_CHINESE_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeFourChineseApproval'
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

describe('grade 4 upper Chinese eight units and literacy appendices', () => {
  it('retains historical sources, applies image corrections, and grounds all original questions', () => {
    const raw = readFileSync('src/data/curriculum/grade-4/chinese-pep-upper/source-text.md')
    const sha = createHash('sha256').update(raw).digest('hex')
    expect(sha).toBe('10fa1fe70a02b8f9f351ff4b2d2f9b1661ac7c7dd22bf00737105fee24bc7fed')
    expect(supplied.sourceSha256).toBe(sha)
    const continuation = readFileSync(
      'src/data/curriculum/grade-4/chinese-pep-upper/units-3-5-source-text.md',
    )
    expect(createHash('sha256').update(continuation).digest('hex')).toBe(supplement.sourceSha256)
    expect(supplement.sourceSha256).toBe(
      'c241a0c2571865c14bbba6b0b87fcfb30568b21b779fb13958e504947d7ef656',
    )
    const finalRaw = readFileSync(
      'src/data/curriculum/grade-4/chinese-pep-upper/units-6-8-source-text.md',
    )
    expect(createHash('sha256').update(finalRaw).digest('hex')).toBe(finalSupplement.sourceSha256)
    expect(finalSupplement.sourceSha256).toBe(
      'f9d36bbd755d67316bef838cd3e03644348d33c890805f886a5dfe1bea650888',
    )
    const tuoluoRaw = readFileSync(
      'src/data/curriculum/grade-4/chinese-pep-upper/tuoluo-correction-source-text.md',
    )
    expect(createHash('sha256').update(tuoluoRaw).digest('hex')).toBe(tuoluoCorrection.sourceSha256)
    expect(imported.units.at(-1)?.title).toBe('全册附录：字词表')
    const appendices = definitions.filter((d) => d.kind === 'appendix')
    expect(appendices).toHaveLength(3)
    expect(appendices.every((d) => d.unit === 9 && d.questions.length === 0)).toBe(true)
    expect(appendices[0]?.text).toContain('bàn 辫')
    expect(appendices[0]?.sourceNote).toContain('需核对')
    expect(definitions.filter((d) => d.kind === 'example').map((d) => d.title)).toEqual([
      '我家的杏熟了',
      '小木船',
    ])
    expect(definitions.find((d) => d.key === 'writing-5')?.text).not.toContain('奶奶')
    expect(imported.textbooks[0]?.createdAt).toBe(importedAt)
    expect(imported.units.map((u) => u.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(definitions).toHaveLength(52)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27,
    ])
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      3, 7, 14, 19, 22, 26,
    ])
    expect(readingOnly).toHaveLength(23)
    expect(imported.textbooks[0]?.editionYear).toBeUndefined()
    expect(imported.textbooks[0]?.versionName).toContain('第一至第八单元及字词附录')
    for (const d of definitions) {
      expect(
        d.key === 'reading-04'
          ? readFileSync(
              'src/data/curriculum/grade-4/chinese-pep-upper/lesson-04-source-text.md',
              'utf8',
            ).replaceAll('## ', '')
          : d.key === tuoluoCorrection.key
            ? tuoluoRaw.toString()
            : d.unit <= 2
              ? raw.toString()
              : d.unit <= 5
                ? continuation.toString()
                : finalRaw.toString(),
      ).toContain(d.text)
      expect(d.text).not.toContain('要不要我把')
      expect(d.text).not.toContain('继续输出')
      expect(d.text).not.toContain('全部课文汇总完毕')
      expect(d.text).not.toContain('你想要哪一个')
      expect(
        imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)?.body
          .suppliedText,
      ).toBe(d.text)
      expect(d.questions).toHaveLength(['reading', 'example'].includes(d.kind) ? 3 : 0)
      expect(
        imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)?.sourceId,
      ).toBe(
        d.key === 'reading-04'
          ? peasSource
          : d.key === tuoluoCorrection.key
            ? tuoluoSource
            : d.unit >= 6
              ? finalSource
              : d.unit >= 3
                ? supplementSource
                : originalSource,
      )
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
    }
    const peas = definitions.find((d) => d.number === 4)!
    expect(peas.text).toContain('接下来的两粒说')
    expect(peas.text).not.toContain('其余的两粒')
    expect(peas.text).toContain('紫色的豌豆花')
    expect(peas.text).toContain('心里充满了感激')
    expect(peas.text).toContain('舒、适、揭、晓、滚、滑、擦、探、曾、沟、涨')
    expect(peas.sourceNote).toContain('五张教材图片')
    expect(peas.questions.every((q) => !q.stem.includes('几粒'))).toBe(true)
    expect(definitions.find((d) => d.key === 'garden-1')?.text).toContain('空山不见人')
    expect(definitions.find((d) => d.key === 'garden-2')?.text).toContain('不问不知')
  })

  it('restores all four image pages of Tuoluo with a separate V2 source and retains valid question IDs', () => {
    const current = definitions.find((d) => d.key === 'reading-22')!
    const original = finalSupplement.lessons.find((d) => d.key === 'reading-22')!
    const content = imported.courseContents.find(
      (c) => c.knowledgePointId === current.knowledgePointId,
    )!
    expect(tuoluoCorrection.sourceSha256).toBe(
      '907af4853e7259e9a2c95ab2c512eb8b8a45059263df9e979cbd241ad7a98285',
    )
    expect(original.text).toContain('姜辣手')
    expect(current).toMatchObject({
      title: '22* 陀螺',
      unit: original.unit,
      lessonId: 'G4_PEP_CHINESE_S1_LESSON_READING_22',
      knowledgePointId: 'G4_PEP_CHINESE_S1_KP_READING_22',
      revision: 2,
      importNotes: [],
    })
    expect(current.text).not.toContain('姜辣手')
    expect(current.text).not.toContain('小朋友们，都爱')
    expect(current.sourceNote).not.toContain('待核对')
    expect(tuoluoCorrection.bodyText.split('\n\n')).toHaveLength(13)
    expect(tuoluoCorrection.bodyText).not.toMatch(/[a-z]/i)
    for (const joined of [
      '这时你看吧，两只旋转的陀螺奋勇搏斗',
      '这消息曾使我一整天处于恍惚的状态',
      '终于无法避开，它们狠狠地撞上了！',
    ])
      expect(tuoluoCorrection.bodyText).toContain(joined)
    const anchors = [
      '在我的故乡',
      '做冰尜儿用的是木头',
      '抽冰尜儿的小伙伴们都爱比个高下',
      '我从小就不甘人后',
      '这种懊恼终于引起了长辈的注意',
      '叔叔的礼物不错！',
      '这只陀螺不是人工削出来的',
      '我的陀螺刚一露面',
      '然而世间许多事都是不可预料的',
      '奇怪的是，我的陀螺个头小',
      '这真是个辉煌的时刻！',
      '我的冰尜儿，木工随便旋出的小木头块',
      '这真应了一句古话：人不可貌相，海水不可斗量。',
    ]
    const positions = anchors.map((anchor) => tuoluoCorrection.bodyText.indexOf(anchor))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(current.text).toContain(tuoluoCorrection.readingPrompt)
    expect(current.text).toContain('① 本文作者高洪波，选作课文时有改动。')
    expect(tuoluoCorrection.recognitionCharacters).toEqual([
      { character: '钉', pinyin: 'dīng', polyphonic: true },
      { character: '质', pinyin: 'zhì', polyphonic: false },
      { character: '岳', pinyin: 'yuè', polyphonic: false },
      { character: '削', pinyin: 'xiāo', polyphonic: false },
      { character: '废', pinyin: 'fèi', polyphonic: false },
      { character: '骂', pinyin: 'mà', polyphonic: false },
      { character: '帅', pinyin: 'shuài', polyphonic: false },
      { character: '衅', pinyin: 'xìn', polyphonic: false },
      { character: '扭', pinyin: 'niǔ', polyphonic: false },
      { character: '彻', pinyin: 'chè', polyphonic: false },
      { character: '溃', pinyin: 'kuì', polyphonic: false },
      { character: '豪', pinyin: 'háo', polyphonic: false },
    ])
    expect(tuoluoCorrection.pronunciationNotes.flatMap((page) => page.entries)).toHaveLength(26)
    expect(tuoluoCorrection.sourceImages).toHaveLength(4)
    expect(content).toMatchObject({
      id: `${current.knowledgePointId}_CONTENT_V2`,
      sourceId: tuoluoSource,
      currentVersion: 2,
      body: {
        sourceScope: 'USER_PROVIDED_IMAGE_TRANSCRIPTION',
        textbookOriginalText: tuoluoCorrection.bodyText,
        author: '高洪波',
        originalSourceId: finalSource,
      },
    })
    expect(current.questions).toEqual(original.questions)
    expect(
      questions.filter((q) => q.knowledgePointId === current.knowledgePointId).map((q) => q.id),
    ).toEqual([
      'G4_PEP_CHINESE_S1_KP_READING_22_Q1',
      'G4_PEP_CHINESE_S1_KP_READING_22_Q2',
      'G4_PEP_CHINESE_S1_KP_READING_22_Q3',
    ])
    for (const question of current.questions)
      expect(tuoluoCorrection.bodyText).toContain(question.evidence)
    for (const unchanged of finalSupplement.lessons.filter((d) => d.key !== current.key))
      expect(definitions.find((d) => d.key === unchanged.key)?.text).toBe(unchanged.text)
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
    ).toHaveLength(87)
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

  it('offers grade four upper to every account and shows eight readable units and an appendix island', async () => {
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['g4-a', 'g4-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_4',
        semesterId: 'SEMESTER_UPPER',
        regionId: 'unknown-region',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
      const curriculum = (await curriculumService.getLearningMapCurriculum(book))!
      const map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
      expect(map.islands).toHaveLength(9)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(52)
      for (const d of definitions) {
        const content = await repo.getByKnowledgePoint(d.knowledgePointId)
        expect(content?.blocks.map((b) => b.block.text).join('\n\n')).toContain(
          d.text
            .replaceAll('**', '')
            .replace(/^#### /gm, '')
            .replaceAll('bàn 辫', 'biàn 辫')
            .replaceAll('qǐ 崛', 'jué 崛'),
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
      await upper.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_4', semesterId: 'SEMESTER_UPPER' }],
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
    store.setContext({ gradeId: 'GRADE_4', semesterId: 'SEMESTER_UPPER' })
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
        semesterId: 'SEMESTER_UPPER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G4_BNU_MATH_S1_2022_REVISED',
        englishTextbookVersionId: 'G4_SHANGHAI_ENGLISH_S1_2022',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps all 87 graded questions solvable and confines reading/AI/training to supported texts', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.gradeId).toBe('GRADE_4')
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
        createReadingQuest({ ...input, bundle: { ...bundle, textbookId: 'wrong' } }),
      ).toBeNull()
    }
  })

  it('feeds grade-four Agent context and balanced papers with separate original open-response assessment tasks', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_4', semesterId: 'SEMESTER_UPPER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g4-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g4-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(52)
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
      expect(paper.questions).toHaveLength(52)
      expect(paper.coveredPoints).toBe(52)
    }
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
    'reading-04',
    'writing-1',
    'garden-2',
    'reading-08',
    'reading-12',
    'reading-15',
    'example-apricot',
    'example-boat',
    'reading-bar-4',
    'garden-3',
    'reading-17',
    'reading-20',
    'reading-22',
    'reading-24',
    'reading-27',
    'garden-6',
    'garden-8',
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
      expect(wrapper.text()).toContain('四年级上册已接入第一至第八单元及字词附录')
      for (const paragraph of d.text
        .replaceAll('**', '')
        .replace(/^#### /gm, '')
        .split(/\n\n+/))
        expect(wrapper.text()).toContain(
          paragraph.replaceAll('bàn 辫', 'biàn 辫').replaceAll('qǐ 崛', 'jué 崛'),
        )
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
