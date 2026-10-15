import { isChinesePilotTextbook } from '@/data/curriculum/pilot'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import {
  G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID as book,
  gradeSixChinese2019LowerSource as source,
  gradeSixChinese2019LowerDefinitions as definitions,
  gradeSixChinese2019LowerCurriculum as curriculum,
  gradeSixChinese2019LowerQuestions as questions,
  gradeSixChinese2019LowerBundles as bundles,
  gradeSixChinese2019LowerReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-6/chinese-pep-lower-2019'
import {
  G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID as otherBook,
  gradeSixChinese2019Definitions as otherDefinitions,
} from '@/data/curriculum/grade-6/chinese-pep-upper-2019'
import {
  productionCurriculumData,
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { curriculumService } from '@/services/runtime'
import { selectAccount } from '@/services/account/storage'
import { useStudentStore } from '@/stores/studentStore'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { QuestionEngineAdapter, correctAnswerDraft } from '@/services/question-engine'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { supportsAiPractice, reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic } from '../server/llm/formalGeneration'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { buildAssessmentPapers } from '@/services/comprehensive-assessment/papers'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
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
  selectAccount('g6-2019-parent')
  setActivePinia(createPinia())
})
afterEach(() => selectAccount(null))

describe('independent 2019 grade six lower Chinese', () => {
  it('preserves the supplied text, exact sequence, word lists and source boundaries', () => {
    const raw = readFileSync('src/data/curriculum/grade-6/chinese-pep-lower-2019/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(source.sourceSha256)
    expect(definitions).toHaveLength(40)
    expect(curriculum.units).toHaveLength(8)
    expect(definitions.filter((d) => d.number).map((d) => d.number)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1),
    )
    expect(curriculum.textbooks[0]).toMatchObject({
      editionYear: 2019,
      semesterId: 'SEMESTER_LOWER',
      versionName: '统编（人教版）语文六年级下册·2019版',
    })
    expect(definitions.filter((d) => d.kind === 'recitation')).toHaveLength(10)
    expect(definitions.filter((d) => d.kind === 'appendix')).toHaveLength(8)
    expect(
      definitions.filter((d) => d.key.startsWith('vocabulary')).flatMap((d) => d.terms),
    ).toHaveLength(231)
    expect(definitions.find((d) => d.key === 'writing-characters')!.terms).toHaveLength(112)
    expect(
      definitions.find((d) => d.key === 'vocabulary-1')!.terms.filter((t) => t === '猜想'),
    ).toHaveLength(2)
    expect(definitions.find((d) => d.key === 'vocabulary-6')!.terms).toContain('十年树木，百年树人')
    expect(definitions.find((d) => d.number === 5)!.text).toContain('梗概：')
    expect(definitions.find((d) => d.number === 5)!.text).toContain('**节选（节选片段原文）**')
    expect(definitions.find((d) => d.number === 14)!.text).toContain('两小儿辩日')
    expect(definitions.find((d) => d.number === 14)!.text).not.toContain('关尹子教射')
    expect(definitions.find((d) => d.number === 17)!.title).toContain('他们那时候多有趣啊')
    expect(definitions.some((d) => d.key === 'farewell')).toBe(false)
    expect(isChinesePilotTextbook(book)).toBe(true)
    for (const d of definitions) {
      expect(raw.toString()).toContain(d.suppliedText)
      expect(
        curriculum.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!.body
          .suppliedText,
      ).toBe(d.text)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
    }
  })
  it('isolates the 2019 source from the existing 2024 lower and both upper editions', () => {
    for (const id of [
      otherBook,
      'G6_PEP_CHINESE_S1_USER_IMPORTED',
      'G6_PEP_CHINESE_2019_S1_USER_IMPORTED',
    ])
      expect(catalog.textbooks.some((b) => b.id === id)).toBe(true)
    for (const d of definitions) {
      expect(d.knowledgePointId).toMatch(/^G6_PEP_CHINESE_2019_S2_KP_/)
      expect(otherDefinitions.some((other) => other.knowledgePointId === d.knowledgePointId)).toBe(
        false,
      )
      expect(reviewedAiSources(otherBook, d.knowledgePointId)).toEqual([])
      const b = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
      expect(
        createReadingQuest({
          bundle: { ...b, textbookId: otherBook },
          title: d.title,
          text: d.text,
        }),
      ).toBeNull()
    }
    expect(definitions.find((d) => d.number === 1)!.text).not.toBe(
      otherDefinitions.find((d) => d.number === 1)!.text,
    )
  })
  it('releases every provided node and makes the lower edition visible to any account', async () => {
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    expect(catalog.textbooks.filter((b) => b.id === book)).toHaveLength(1)
    for (const account of ['parent-one', 'parent-two']) {
      selectAccount(account)
      const available = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_6',
        semesterId: 'SEMESTER_LOWER',
        regionId: 'unlisted',
      })
      expect(available.chinese.availableTextbooks.map((b) => b.id)).toEqual(
        expect.arrayContaining([book]),
      )
      const map = buildLearningMapViewModel(
        (await curriculumService.getLearningMapCurriculum(book))!,
        [],
        { dataset: 'profile' },
      )
      expect(map.islands).toHaveLength(8)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(40)
      for (const paper of buildAssessmentPapers(map)) {
        expect(paper.questions).toHaveLength(40)
        expect(paper.questions.every((q) => q.textbookVersionId === book)).toBe(true)
      }
    }
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const d of definitions) {
      const content = await repo.getByKnowledgePoint(d.knowledgePointId)
      expect(content).toBeTruthy()
      if (d.text)
        expect(content!.blocks.map((b) => b.block.text).join('\n\n')).toContain(
          d.text.replaceAll('**', '').replace(/^#{2,4} /gm, ''),
        )
    }
    const wrapper = mount(TextbookCoverage, { props: { gradeId: null, semesterId: null } })
    await flushPromises()
    try {
      const button = wrapper
        .findAll('button')
        .find((b) => b.attributes('aria-label')?.startsWith('六年级下册'))!
      expect(button.attributes('disabled')).toBeUndefined()
      await button.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_6', semesterId: 'SEMESTER_LOWER' }],
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('scores 51 text-grounded questions and excludes open tasks from AI and formal practice', async () => {
    expect(questions).toHaveLength(51)
    expect(readingOnly).toHaveLength(23)
    const adapter = new QuestionEngineAdapter()
    for (const d of definitions) {
      const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
      const input = { bundle, title: d.title, text: d.text }
      const loaded = await adapter.loadAssessment(context(d), { dataset: 'profile' })
      if (d.questions.length) {
        expect(createReadingQuest(input)!.stages).toHaveLength(3)
        expect(createTrainingQuest(input)!.stages).toHaveLength(9)
        expect(loaded.questions).toHaveLength(3)
        expect(
          resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }),
        ).toBeTruthy()
      } else {
        expect(createReadingQuest(input)).toBeNull()
        expect(createTrainingQuest(input)).toBeNull()
        expect(loaded.questions).toEqual([])
        expect(supportsAiPractice(book, d.knowledgePointId)).toBe(false)
      }
    }
    for (const q of questions) {
      expect(q.semesterId).toBe('SEMESTER_LOWER')
      expect(checkQuestAnswer(q, correctAnswerDraft(q))).toBe('correct')
      for (const option of q.options!)
        expect(checkQuestAnswer(q, { type: 'singleChoice', optionId: option.id })).toBe(
          option.optionKey ===
            ('correctOptionKey' in q.answerRule ? q.answerRule.correctOptionKey : '')
            ? 'correct'
            : 'incorrect',
        )
    }
  })

  it('keeps lower edition answer histories separate and resumes the original account', async () => {
    const d = definitions.find((d) => d.number === 1)!
    const u = otherDefinitions.find((u) => u.number === 1)!
    const options = { dataset: 'profile' as const, studentId: 'same-student' }
    const upperContext = {
      ...context(d),
      textbookId: otherBook,
      unitId: u.unitId,
      lessonId: u.lessonId,
      knowledgePointId: u.knowledgePointId,
    }
    const store = useQuestionEngineStore()
    await store.loadAssessment(upperContext, options)
    await store.setAnswerDraft(correctAnswerDraft(store.questions[0]!))
    await store.submitAnswer()
    const upperSession = store.session!.id
    await store.loadAssessment(context(d), options)
    expect(store.session!.attempts).toEqual([])
    expect(store.session!.id).not.toBe(upperSession)
    await store.loadAssessment(upperContext, options)
    expect(store.session!.id).toBe(upperSession)
    expect(store.session!.attempts).toHaveLength(1)
    selectAccount('other-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(upperContext, options)
    expect(useQuestionEngineStore().session!.attempts).toEqual([])
  })

  it.each([
    1,
    5,
    14,
    17,
    'example-1',
    'recitation-10',
    ...definitions.filter((d) => d.kind === 'appendix').map((d) => d.key),
  ])(
    'shows complete supplied or referenced text and practice boundaries for lesson %s',
    async (number) => {
      const d = definitions.find((d) =>
        typeof number === 'string' ? d.key === number : d.number === number,
      )!
      const pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'lower-child', displayName: '小岛同学' }
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
        expect(wrapper.text()).toContain('2019版六年级下册')
        expect(wrapper.text()).toContain(d.sourceNote)
        for (const paragraph of d.text
          .replaceAll('**', '')
          .replace(/^#{2,4} /gm, '')
          .split(/\n\n+/))
          expect(wrapper.text()).toContain(paragraph)
        expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(
          Boolean(d.questions.length),
        )
        if (d.kind === 'appendix') {
          expect(wrapper.text()).toContain('这是全册字词附录')
          expect(wrapper.text()).not.toContain('正式练习题正在准备中')
          expect(wrapper.text()).not.toContain('完整教材原文将在获得授权并完成审核后接入')
        }
      } finally {
        wrapper.unmount()
      }
    },
  )
})
