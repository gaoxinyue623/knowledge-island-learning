import projects from '@/data/curriculum/grade-4/english-shanghai-upper-2022/projects-supplement.json'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G4_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID as book,
  G4_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID as textSource,
  G4_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID as practiceSource,
  gradeFourEnglishUpperCurriculum as added,
  gradeFourEnglishUpperDefinitions as definitions,
  gradeFourEnglishUpperQuestions as questions,
  gradeFourEnglishUpperBundles as bundles,
  gradeFourEnglishUpperSource as supplied,
} from '@/data/curriculum/grade-4/english-shanghai-upper-2022'
import { G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID as upperBook } from '@/data/curriculum/grade-4/english-shanghai-lower-2022'
import {
  G4_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL as approval,
  G4_SHANGHAI_ENGLISH_UPPER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeFourEnglishUpperApproval'
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

describe('Shanghai-Oxford grade 4 upper English import', () => {
  it('接入两个完整Project，区分任务、示范和词汇来源', () => {
    const raw = readFileSync(
      'src/data/curriculum/grade-4/english-shanghai-upper-2022/projects-source.md',
    )
    expect(createHash('sha256').update(raw).digest('hex')).toBe(projects.sourceSha256)
    const ds = definitions.filter((d) => d.kind === 'project')
    expect(ds.map((d) => d.page)).toEqual([81, 83])
    expect(ds.flatMap((d) => d.words)).toHaveLength(11)
    for (const d of ds) {
      expect(d.sections.map((s) => s.title)).toEqual([
        'Think（想一想）',
        'Make（制作任务）',
        'Introduce（示范介绍）',
        'Share（课堂分享）',
      ])
      expect(d.questions).toHaveLength(0)
      const c = added.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
      expect(c.sourceId).toBe('G4_SHANGHAI_ENGLISH_S1_PROJECTS_USER_TEXT_V1')
      expect(c.body.activityOnly).toBe(true)
      expect(c.body.missingSections).toEqual([])
      expect(c.body.sourceNote).not.toContain('未提供Project')
    }
    expect(ds[0]!.text).toContain('I can go shopping in the supermarket.')
    expect(ds[1]!.text).toContain('Vote for your favourite party plan.')
  })

  it('retains every supplied bilingual section, 42 words and eight sentence patterns without inventing absent columns', () => {
    const source = readFileSync(
      resolve('src/data/curriculum/grade-4/english-shanghai-upper-2022/source-text.md'),
      'utf8',
    )
    expect(createHash('sha256').update(source).digest('hex')).toBe(supplied.sourceSha256)
    expect(definitions).toHaveLength(11)
    expect(definitions.flatMap((d) => d.sections)).toHaveLength(17)
    expect(definitions.filter((d) => d.kind !== 'project').flatMap((d) => d.words)).toHaveLength(42)
    expect(added.units).toHaveLength(11)
    expect(added.lessons).toHaveLength(11)
    for (const [index, d] of definitions.entries()) {
      const activeSource =
        d.kind === 'project'
          ? readFileSync(
              'src/data/curriculum/grade-4/english-shanghai-upper-2022/projects-source.md',
              'utf8',
            )
          : source
      const displayed = textFor(index)
      for (const section of d.sections) {
        expect(activeSource).toContain(section.english)
        if (d.kind !== 'review') expect(activeSource).toContain(section.chinese)
        for (const line of section.english.split('\n')) expect(displayed).toContain(line)
        expect(displayed).toContain(section.chinese)
      }
      for (const word of d.words)
        expect(displayed).toContain(`${word.english} ${word.phonetic} ${word.chinese}`)
      expect(activeSource).toContain(d.sentencePattern)
      expect(displayed).toContain(d.sentencePattern)
    }
    expect(added.courseContents.map((c) => c.body.suppliedPage)).toEqual([
      1,
      11,
      21,
      31,
      41,
      51,
      61,
      71,
      null,
      81,
      83,
    ])
    expect(supplied.sourceNote).toContain('未对照出版社原书')
    expect(definitions.filter((d) => d.sounds).map((d) => d.sounds)).toEqual([
      'a',
      'i',
      'e',
      'o',
      'u',
      'a, e',
      'i, o',
      'u',
    ])
    expect(definitions.filter((d) => d.kind === 'project')).toHaveLength(2)
    expect(added.sources.map((s) => s.sourceType)).toEqual(['TEXTBOOK', 'TEXTBOOK', 'AI_GENERATED'])
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
          gradeId: 'GRADE_4',
          semesterId: 'SEMESTER_UPPER',
          regionId,
        })
        expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([book])
      }
      const map = (await curriculumService.getLearningMapCurriculum(book))!
      const view = buildLearningMapViewModel(map, [], { dataset: 'profile' })
      expect(map.textbook).toMatchObject({ subject: 'ENGLISH', semester: 1 })
      expect(view.islands).toHaveLength(11)
      expect(flattenKnowledgeNodes(view.islands)).toHaveLength(11)
      for (const [index, d] of definitions.entries()) {
        const lesson = (await repository.getByKnowledgePoint(d.knowledgePointId))!
        expect(lesson.contentStatus).toBe('PUBLISHED')
        expect(lesson.blocks).toHaveLength(
          d.sections.length +
            (d.kind !== 'unit' ? 1 + Number(d.words.length > 0) : 4) +
            Number(d.readingWords.length > 0) +
            Number(d.notes.length > 0),
        )
        expect(lesson.blocks.map((b) => b.block.text).join('\n')).toBe(textFor(index))
        const assessment = await new QuestionEngineAdapter().loadAssessment(context(d), {
          dataset: 'profile',
        })
        expect(assessment.questions).toHaveLength(d.kind !== 'unit' ? 0 : 3)
        expect(assessment.questions.every((q) => q.textbookVersionId === book)).toBe(true)
        expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(d.kind !== 'unit' ? 0 : 3)
        if (d.kind !== 'unit') continue
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
      expect(segments.length).toBeGreaterThan(
        d.kind === 'review' ? -1 : d.kind === 'project' ? 0 : 10,
      )
      expect(segments.every((s) => !s.text.includes('/'))).toBe(true)
      expect(segments.every((s) => !/\p{Script=Han}/u.test(s.text))).toBe(true)
      expect(segments.some((s) => s.section === 'story')).toBe(d.kind === 'unit')
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
      if (bundle.extensionActivities.length)
        expect(bundle.extensionActivities[0]!.referenceAnswer).toContain('不自动判分')
      expect(bundle.learningContent).toMatchObject({ releaseApprovalId: approval })
    }
    const correct = questions.find(
      (q) => q.knowledgePointId.endsWith('08') && q.tags.includes('story'),
    )!
    expect(correct.options!.find((o) => o.content[0]?.text === 'The internet.')?.optionKey).toBe(
      correct.answerRule.ruleType === 'SINGLE_OPTION' ? correct.answerRule.correctOptionKey : '',
    )
  })

  it('provides scoped base practice plus three solvable spelling, matching and sentence training rounds', () => {
    for (const [index, bundle] of bundles.entries()) {
      const input = { bundle, title: definitions[index]!.title, text: textFor(index) }
      const base = createReadingQuest(input)!
      if (definitions[index]!.kind !== 'unit') {
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
        expect(
          round.stages.some(
            (s) =>
              (s.kind === 'question' && s.tiles?.length) ||
              (s.kind === 'activity' && s.activity.activityType === 'sort_order'),
          ),
        ).toBe(true)
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
    store.setContext({ gradeId: 'GRADE_4', semesterId: 'SEMESTER_UPPER' })
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
      expect(english.text()).toContain('四年级上册')
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
    for (const d of definitions.filter((d) => d.kind === 'unit')) {
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
      for (const line of d.sections[0]!.english.split('\n')) expect(wrapper.text()).toContain(line)
      expect(wrapper.text()).toContain(d.sections[0]!.chinese)
      expect(wrapper.text()).toContain(d.page ? `用户标注第${d.page}页` : '用户附加综合练习')
      expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(
        d.kind === 'unit',
      )
      const sync = wrapper.findAll('button').find((b) => b.text() === '开始单元同步练习')
      expect(!!sync).toBe(d.kind !== 'project')
      if (sync) {
        await sync.trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query.practiceSetId).toBe(
          `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
        )
      }
      if (d.kind === 'project') {
        expect(wrapper.text()).toContain('作品没有唯一答案，不自动判分')
        expect(wrapper.text()).not.toContain('先听读，再完成单词拼写')
      }
    } finally {
      wrapper.unmount()
    }
  },
)

it('excludes projects and the separate review sheet from generated exam objectives', async () => {
  const model = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
  for (const d of definitions.filter((d) => d.kind !== 'unit')) {
    expect(buildAssessmentPapers(model, d.unitId)).toEqual([])
    expect(
      catalog.questions.some(
        (q) => q.knowledgePointId === d.knowledgePointId && !q.tags.includes('unit-sync-only'),
      ),
    ).toBe(false)
  }
  for (const paper of buildAssessmentPapers(model)) {
    expect(paper.totalPoints).toBe(8)
    expect(paper.coveredPoints).toBe(8)
    expect(paper.questions.length).toBeGreaterThanOrEqual(24)
  }
})

import {
  gradeFourEnglishUpperUnitTestQuestions as syncQuestions,
  gradeFourEnglishUpperUnitTestPractices as practices,
  gradeFourEnglishUpperUnitTestSheet as sheet,
} from '@/data/curriculum/grade-4/english-shanghai-upper-2022/unit-tests'
import {
  synchronousPracticeFor,
  synchronousPracticeForLesson,
} from '@/services/curriculum/synchronousPractice'
it('retains all supplied exercises in nine isolated sets, grades all answers, and rejects cross-book contexts', async () => {
  expect(syncQuestions).toHaveLength(22)
  expect(practices.map((p) => p.targetCount)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 6])
  const raw = readFileSync(
    resolve('src/data/curriculum/grade-4/english-shanghai-upper-2022/source-text.md'),
    'utf8',
  )
  for (const paper of sheet.papers) expect(raw).toContain(paper.sourceText)
  for (const q of syncQuestions) {
    expect(validateQuestion(q).valid).toBe(true)
    expect(validateQuestionAnswer(q, correctAnswerDraft(q)).status).toBe('correct')
    if (q.answerRule.ruleType === 'SINGLE_OPTION') {
      for (const o of q.options!)
        expect(validateQuestionAnswer(q, { type: 'singleChoice', optionId: o.id }).status).toBe(
          o.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect',
        )
    }
    expect(q.tags).toContain('unit-sync-only')
  }
  for (const p of practices) {
    expect(synchronousPracticeFor(p, p.id)?.id).toBe(p.id)
    expect(synchronousPracticeForLesson(p)?.id).toBe(p.id)
    for (const key of ['textbookId', 'unitId', 'lessonId', 'knowledgePointId'] as const) {
      expect(synchronousPracticeFor({ ...p, [key]: 'wrong' }, p.id)).toBeNull()
      expect(synchronousPracticeForLesson({ ...p, [key]: 'wrong' })).toBeNull()
    }
    const assessment = await new QuestionEngineAdapter().loadAssessment(
      { ...p, source: 'lesson_practice' },
      { dataset: 'profile', selectedQuestionIds: p.fixedQuestionIds },
    )
    expect(assessment.questions.map((q) => q.id)).toEqual(p.fixedQuestionIds)
  }
})

it('preserves original material and makes corrections visible without teaching the disputed sentence as speech or knowledge', () => {
  const plant = definitions[5]!
  expect(plant.sections[0]!.english).toContain('It doesn’t have fruit.')
  expect(textFor(5)).toContain('来稿待核对句：It doesn’t have fruit.')
  expect(textFor(5)).toContain('向日葵会形成果实')
  expect(textFor(5)).toContain('https://www.kew.org/plants/sunflower')
  const project = (n: number) =>
    buildEnglishReadingSegments(
      (added.courseContents[n]!.body.blocks as { text: string }[]).map((b, i) => ({
        id: String(i),
        content: b.text,
        type: 'concept',
        sort: i,
        isSample: false,
      })),
    )
  expect(project(5).some((s) => s.text.includes('doesn’t have fruit'))).toBe(false)
  expect(project(2).map((s) => s.text)).toContain('1,3,5 are odd numbers.')
  expect(project(2).map((s) => s.text)).toContain('2,4,6 are even numbers.')
  expect(project(1).some((s) => s.text === 'hive' && s.section === 'words')).toBe(true)
  expect(sheet.papers[4]!.questions[1]).toMatchObject({
    originalStem: 'It ____ snow in Guangdong. (doesn’t / don’t)',
  })
  expect(sheet.papers[4]!.questions[1]!.stem).toContain('here')
  expect(sheet.papers[5]!.questions[1]!.stem).toContain('只判断句法')
  expect(sheet.papers[8]!.questions[5]).toMatchObject({
    originalReference: 'A. It’s',
    reference: 'A. It lives',
  })
  expect(questions.some((q) => q.stem.some((b) => b.text?.includes('没有果实')))).toBe(false)
})
it('retains 42 core words with a separately attributed reading word and three distinct animal-unit papers', async () => {
  expect(definitions.filter((d) => d.kind !== 'project').flatMap((d) => d.words)).toHaveLength(42)
  expect(definitions.flatMap((d) => d.readingWords)).toEqual([{ english: 'hive', chinese: '蜂巢' }])
  expect(textFor(1)).toContain('核心单词补充（从本课Reading双语文本整理）')
  expect(
    catalog.questions.filter(
      (q) => q.textbookVersionId === book && q.tags.includes('comprehensive-only'),
    ),
  ).toHaveLength(129)
  const model = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
  const papers = buildAssessmentPapers(model, definitions[1]!.unitId)
  expect(papers).toHaveLength(3)
  expect(
    new Set(
      papers.map((p) =>
        p.questions
          .map((q) => q.id)
          .sort()
          .join('|'),
      ),
    ).size,
  ).toBe(3)
  for (const p of papers) expect(p.questions.length).toBeGreaterThanOrEqual(12)
})
