import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID as book,
  G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID as textSource,
  G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID as practiceSource,
  gradeThreeEnglishUpperCurriculum as added,
  gradeThreeEnglishUpperDefinitions as definitions,
  gradeThreeEnglishUpperQuestions as questions,
  gradeThreeEnglishUpperBundles as bundles,
  gradeThreeEnglishUpperSource as supplied,
} from '@/data/curriculum/grade-3/english-shanghai-upper-2022'
import { G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID as upperBook } from '@/data/curriculum/grade-2/english-shanghai-upper'
import {
  G3_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL as approval,
  G3_SHANGHAI_ENGLISH_UPPER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeThreeEnglishUpperApproval'
import {
  productionCurriculumIndex as catalog,
  productionCurriculumData,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { isEnglishPilotTextbook } from '@/data/curriculum/pilot'
import { curriculumService } from '@/services/runtime'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { buildEnglishReadingSegments } from '@/services/lesson-player/englishReading'
import {
  QuestionEngineAdapter,
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { validateQuestion } from '@/services/validation/questionValidation'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic, createFormalGenerator } from '../server/llm/formalGeneration'
import { selectAccount } from '@/services/account/storage'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import type { LessonContentBlockViewModel } from '@/types'

const context = (d: (typeof definitions)[number]) => ({
  textbookId: book,
  unitId: d.unitId,
  lessonId: d.lessonId,
  knowledgePointId: d.knowledgePointId,
  source: 'lesson_practice' as const,
})
const textFor = (index: number) =>
  (added.courseContents[index]!.body.blocks as { text: string }[]).map((b) => b.text).join('\n')
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('english_parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Shanghai-Oxford grade 3 upper English import', () => {
  it('retains every supplied bilingual section, 53 words and eight sentence patterns without inventing absent columns', () => {
    const source = readFileSync(
      resolve('src/data/curriculum/grade-3/english-shanghai-upper-2022/source-text.md'),
      'utf8',
    )
    expect(createHash('sha256').update(source).digest('hex')).toBe(supplied.sourceSha256)
    expect(definitions).toHaveLength(10)
    expect(definitions.flatMap((d) => d.sections)).toHaveLength(10)
    expect(definitions.flatMap((d) => d.words)).toHaveLength(53)
    expect(added.units).toHaveLength(10)
    expect(added.lessons).toHaveLength(10)
    for (const [index, d] of definitions.entries()) {
      const displayed = textFor(index)
      for (const section of d.sections) {
        expect(source).toContain(section.english)
        expect(source).toContain(section.chinese)
        expect(displayed).toContain(section.english)
        expect(displayed).toContain(section.chinese)
      }
      for (const word of d.words) expect(displayed).toContain(`${word.english} ${word.chinese}`)
      expect(source).toContain(d.sentencePattern)
      expect(displayed).toContain(d.sentencePattern)
    }
    expect(added.courseContents.map((c) => c.body.suppliedPage)).toEqual([
      5, 15, 25, 35, 45, 55, 65, 75, 85, 87,
    ])
    expect(supplied.sourceNote).toContain('未对照出版社原书')
    expect(definitions[1]!.aliases.map((w) => w.english)).toEqual(['grandpa', 'grandma'])
    expect(added.sources.map((s) => s.sourceType)).toEqual(['TEXTBOOK', 'AI_GENERATED'])
    for (const id of [textSource, practiceSource]) {
      expect(catalog.contentSources.find((s) => s.id === id)).toMatchObject({
        releaseApprovalId: approval,
        verifiedAt: importedAt,
      })
    }
    expect(isEnglishPilotTextbook(book)).toBe(true)
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
  })

  it('makes the released book, full lesson text, map and formal questions readable in either account without region filtering', async () => {
    const repository = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['english_parent', 'second_english_parent']) {
      selectAccount(account)
      for (const regionId of [undefined, 'region-without-any-mapping']) {
        const available = await curriculumService.resolveAvailableTextbooks({
          gradeId: 'GRADE_3',
          semesterId: 'SEMESTER_UPPER',
          regionId,
        })
        expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([book])
      }
      const map = (await curriculumService.getLearningMapCurriculum(book))!
      const view = buildLearningMapViewModel(map, [], { dataset: 'profile' })
      expect(map.textbook).toMatchObject({ subject: 'ENGLISH', semester: 1 })
      expect(view.islands).toHaveLength(10)
      expect(flattenKnowledgeNodes(view.islands)).toHaveLength(10)
      for (const [index, d] of definitions.entries()) {
        const lesson = (await repository.getByKnowledgePoint(d.knowledgePointId))!
        expect(lesson.contentStatus).toBe('PUBLISHED')
        expect(lesson.blocks).toHaveLength(d.sections.length + (d.kind === 'project' ? 1 : 3))
        expect(lesson.blocks.map((b) => b.block.text).join('\n')).toBe(textFor(index))
        const assessment = await new QuestionEngineAdapter().loadAssessment(context(d), {
          dataset: 'profile',
        })
        expect(assessment.questions).toHaveLength(d.kind === 'project' ? 0 : 3)
        expect(assessment.questions.every((q) => q.textbookVersionId === book)).toBe(true)
        expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(
          d.kind === 'project' ? 0 : 3,
        )
        if (d.kind === 'project') continue
        expect(
          resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }).title,
        ).toBe(d.title)
        expect(() =>
          resolveAiTopic({ textbookId: upperBook, knowledgePointId: d.knowledgePointId }),
        ).toThrow()
      }
    }
  })

  it('projects clean English speech, preserving story/chant roles and phrases while omitting translations and prompts', () => {
    for (const [index, d] of definitions.entries()) {
      const blocks = (added.courseContents[index]!.body.blocks as { text: string }[]).map(
        (b, i): LessonContentBlockViewModel => ({
          id: String(i),
          content: b.text,
          type: 'concept',
          sort: i,
          isSample: false,
        }),
      )
      const segments = buildEnglishReadingSegments(blocks)
      expect(segments.length).toBeGreaterThan(d.kind === 'project' ? 0 : 10)
      expect(segments.every((s) => !/\p{Script=Han}/u.test(s.text))).toBe(true)
      expect(segments.some((s) => s.section === 'story')).toBe(d.kind !== 'project')
      expect(segments.some((s) => s.section === 'chant')).toBe(
        d.sections.some((s) => s.kind === 'chant'),
      )
      for (const word of d.words)
        expect(segments.some((s) => s.section === 'words' && s.text === word.english)).toBe(true)
      expect(
        segments.some((s) => /^(Communicate|Think|Extend|Story|Listen|Chant)[:\s]*$/i.test(s.text)),
      ).toBe(false)
      expect(segments.some((s) => /…|_{2,}|\.{3}/.test(s.text))).toBe(false)
    }
  })

  it('grades all 72 choice paths and keeps personal oral responses out of automatic scoring', () => {
    expect(questions).toHaveLength(24)
    for (const q of questions) {
      expect(validateQuestion(q).valid).toBe(true)
      if (q.answerRule.ruleType !== 'SINGLE_OPTION') throw new Error('single choice expected')
      for (const option of q.options!) {
        expect(
          validateQuestionAnswer(q, { type: 'singleChoice', optionId: option.id }).status,
        ).toBe(option.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect')
      }
    }
    for (const bundle of bundles) {
      expect(bundle.extensionActivities[0]!.referenceAnswer).toContain('不自动判分')
      expect(bundle.learningContent).toMatchObject({ releaseApprovalId: approval })
    }
    const correct = questions.find(
      (q) => q.knowledgePointId.endsWith('08') && q.tags.includes('story'),
    )!
    expect(correct.options!.find((o) => o.content[0]?.text === 'a card')?.optionKey).toBe(
      correct.answerRule.ruleType === 'SINGLE_OPTION' ? correct.answerRule.correctOptionKey : '',
    )
  })

  it('provides scoped base practice plus three solvable spelling, matching and sentence training rounds', () => {
    for (const [index, bundle] of bundles.entries()) {
      const input = { bundle, title: definitions[index]!.title, text: textFor(index) }
      const base = createReadingQuest(input)!
      if (definitions[index]!.kind === 'project') {
        expect(base).toBeNull()
        expect(createTrainingQuest(input)).toBeNull()
        continue
      }
      expect(base.subject).toBe('ENGLISH')
      expect(base.sourceId).toBe(practiceSource)
      expect(base.stages).toHaveLength(3)
      for (const v of [0, 1, 2]) {
        const round = createTrainingQuest({ ...input, variant: v })!
        expect(round.stages).toHaveLength(9)
        expect(round.stages.some((s) => s.kind === 'question' && s.tiles?.length)).toBe(true)
        expect(
          round.stages.some(
            (s) => s.kind === 'activity' && s.activity.activityType === 'drag_match',
          ),
        ).toBe(true)
        for (const stage of [...base.stages, ...round.stages])
          if (stage.kind === 'question') {
            expect(validateQuestion(stage.question).valid).toBe(true)
            expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
              'correct',
            )
          }
      }
      expect(
        createReadingQuest({ ...input, bundle: { ...bundle, textbookId: upperBook } }),
      ).toBeNull()
      expect(
        createReadingQuest({
          ...input,
          bundle: { ...bundle, unitId: definitions[(index + 1) % 10]!.unitId },
        }),
      ).toBeNull()
    }
  })

  it('shows the single English edition already selected and persists it through account reloads', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_3', semesterId: 'SEMESTER_UPPER' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/onboarding/textbooks', component: TextbookConfirmPage }],
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
      const english = wrapper
        .findAllComponents(TextbookCard)
        .find((c) => c.props('subjectCode') === 'ENGLISH')!
      expect(english.props('candidateCount')).toBe(1)
      expect(english.props('selected')).toBe(true)
      expect(english.text()).toContain('三年级上册')
      expect(store.englishTextbookVersionId).toBe(book)
      store.selectTextbook('CHINESE', store.availableTextbooks!.chinese.availableTextbooks[0]!.id)
      const saved = await store.confirmCurriculum('english-student')
      expect(saved?.englishTextbookVersionId).toBe(book)
      selectAccount('second_english_parent')
      setActivePinia(createPinia())
      expect(useCurriculumStore().curriculumProfile).toBeNull()
      selectAccount('english_parent')
      setActivePinia(createPinia())
      expect(useCurriculumStore().englishTextbookVersionId).toBe(book)
      expect(curriculumProfileRepository.load()?.englishTextbookVersionId).toBe(book)
    } finally {
      wrapper.unmount()
    }
  })

  it('calls the model contract with all eight units and retains the correct reviewed source questions', async () => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      const request = JSON.parse(body.messages[1].content)
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
    for (const d of definitions.filter((d) => d.kind !== 'project')) {
      const result = await generate({
        profileId: 'english-student',
        textbookId: book,
        knowledgePointId: d.knowledgePointId,
      })
      expect(result.questions).toHaveLength(3)
      expect(
        result.questions.every(
          (q) =>
            q.sourceQuestion?.textbookVersionId === book &&
            q.sourceQuestion?.knowledgePointId === d.knowledgePointId,
        ),
      ).toBe(true)
    }
    expect(fetcher).toHaveBeenCalledTimes(8)
  })
})

import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import { useStudentStore } from '@/stores/studentStore'
import { buildAssessmentPapers } from '@/services/comprehensive-assessment/papers'

it.each(definitions.map((d) => d.number))(
  'renders bilingual lesson/project %s with the right practice availability',
  async (number) => {
    const d = definitions.find((d) => d.number === number)!
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'english-child', displayName: '小岛同学' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
        { path: '/assessment', component: { template: '<p>练习</p>' } },
        { path: '/lesson', component: { template: '<p>学习</p>' } },
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
      expect(wrapper.text()).toContain(d.sections[0]!.english)
      expect(wrapper.text()).toContain(d.sections[0]!.chinese)
      expect(wrapper.text()).toContain(`用户标注第${d.page}页`)
      expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(
        d.kind !== 'project',
      )
      if (d.kind === 'project') {
        expect(wrapper.text()).toContain('作品没有唯一答案，不自动判分')
        expect(wrapper.text()).not.toContain('先听读，再完成单词拼写')
      }
    } finally {
      wrapper.unmount()
    }
  },
)

it('excludes the two open projects from unit and final exam objectives and accepts taught vocabulary aliases', async () => {
  const model = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
  for (const d of definitions.filter((d) => d.kind === 'project')) {
    expect(buildAssessmentPapers(model, d.unitId)).toEqual([])
    expect(catalog.questions.some((q) => q.knowledgePointId === d.knowledgePointId)).toBe(false)
  }
  for (const paper of buildAssessmentPapers(model)) {
    expect(paper.totalPoints).toBe(8)
    expect(paper.coveredPoints).toBe(8)
    expect(paper.questions.length).toBeGreaterThanOrEqual(24)
  }
  const grandpa = catalog.questions.find(
    (q) =>
      q.textbookVersionId === book &&
      q.questionType === 'fillBlank' &&
      q.stem[0]?.text?.includes('爷爷/外公'),
  )!
  for (const answer of ['grandfather', 'grandpa'])
    expect(validateQuestionAnswer(grandpa, { type: 'fillBlank', values: [answer] }).status).toBe(
      'correct',
    )
})
