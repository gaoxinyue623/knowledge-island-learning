import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID as book,
  G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID as textSource,
  G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID as practiceSource,
  gradeFiveEnglishLowerCurriculum as added,
  gradeFiveEnglishLowerDefinitions as definitions,
  gradeFiveEnglishLowerQuestions as questions,
  gradeFiveEnglishLowerBundles as bundles,
  gradeFiveEnglishLowerSource as supplied,
  gradeFiveEnglishLowerSupplement as supplement,
  G5_SHANGHAI_ENGLISH_S2_SUPPLEMENT_SOURCE_ID as supplementSource,
} from '@/data/curriculum/grade-5/english-shanghai-lower'
import { G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID as upperBook } from '@/data/curriculum/grade-5/english-shanghai-upper-2022'
import {
  G5_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL as approval,
  G5_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeFiveEnglishLowerApproval'
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

describe('Shanghai-Oxford grade 5 lower English import', () => {
  it('preserves the original source and all lesson IDs while releasing the 2013 supplement', () => {
    const source = readFileSync(
      resolve('src/data/curriculum/grade-5/english-shanghai-lower/source-text.md'),
      'utf8',
    )
    const newSource = readFileSync(
      resolve('src/data/curriculum/grade-5/english-shanghai-lower/supplement-source.md'),
      'utf8',
    )
    expect(createHash('sha256').update(source).digest('hex')).toBe(supplied.sourceSha256)
    expect(createHash('sha256').update(newSource).digest('hex')).toBe(supplement.sourceSha256)
    expect(definitions).toHaveLength(23)
    expect(definitions.flatMap((d) => d.sections)).toHaveLength(23)
    expect(definitions.flatMap((d) => d.words)).toHaveLength(90)
    expect(added.units).toHaveLength(5)
    expect(added.lessons).toHaveLength(23)
    expect(supplement.nodes.map((n) => n.number).sort((a, b) => a - b)).toEqual([
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    ])
    for (const [index, d] of definitions.entries()) {
      const original = supplied.units[index]!
      expect(d.number).toBe(original.number)
      expect(d.page).toBe(original.page)
      expect(d.moduleNumber).toBe(original.moduleNumber)
      expect(d.lessonId).toBe(
        `G5_SHANGHAI_ENGLISH_S2_LESSON_${String(original.number).padStart(2, '0')}`,
      )
      expect(d.knowledgePointId).toBe(
        `G5_SHANGHAI_ENGLISH_S2_KP_${String(original.number).padStart(2, '0')}`,
      )
      expect(d.words).toEqual(original.words)
      expect(d.questions).toEqual(original.questions)
      if (d.kind === 'unit') expect(d.sections).toEqual(original.sections)
      const displayed = textFor(index)
      for (const section of d.sections) {
        expect(displayed).toContain(section.english)
        expect(displayed).toContain(section.chinese)
      }
      for (const word of d.words)
        expect(displayed).toContain(`${word.english} ${word.phonetic} ${word.chinese}`)
      for (const pattern of d.sentencePattern.split('\n'))
        expect(source + newSource).toContain(pattern)
      expect(displayed).toContain(d.sentencePattern)
      expect(d.missingSections).toEqual([])
      expect(added.courseContents[index]!.currentVersion).toBe(d.revision)
      expect(added.courseContents[index]!.body.sourceNote).toContain('2013由用户明确确认')
      expect(displayed).not.toContain('未注明年份')
      expect(displayed).not.toContain('正文尚未提供')
      expect(displayed).not.toContain('仅提供栏目名称')
    }
    expect(added.courseContents.map((c) => c.body.suppliedPage)).toEqual([
      2, 8, 14, 20, 22, 24, 30, 36, 42, 44, 46, 52, 58, 64, 66, 68, 74, 80, 86, 88, 91, 94, 94,
    ])
    expect(added.textbooks[0]).toMatchObject({
      id: book,
      editionYear: 2013,
      updatedAt: supplement.updatedAt,
    })
    expect(added.textbooks[0]!.versionName).toContain('2013版')
    expect(definitions.filter((d) => d.sounds)).toHaveLength(12)
    expect(definitions.filter((d) => d.sentencePattern)).toHaveLength(12)
    expect(definitions.find((d) => d.number === 1)!.sounds).toBe('ar (car), ue (blue), oo (school)')
    expect(added.units.map((u) => u.title)).toEqual([
      'Module 1 Changes and differences',
      'Module 2 Work and play',
      'Module 3 Things we do',
      'Module 4 Things we enjoy',
      '册末附录',
    ])
    expect(added.units[4]!.subtitle).not.toContain('未提供')
    for (const id of [textSource, practiceSource]) {
      expect(catalog.contentSources.find((s) => s.id === id)).toMatchObject({
        releaseApprovalId: approval,
        verifiedAt: importedAt,
      })
    }
    expect(catalog.contentSources.find((s) => s.id === supplementSource)).toMatchObject({
      sourceType: 'TEXTBOOK',
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      verifiedAt: supplement.updatedAt,
    })
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
          gradeId: 'GRADE_5',
          semesterId: 'SEMESTER_LOWER',
          regionId,
        })
        expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([book])
      }
      const map = (await curriculumService.getLearningMapCurriculum(book))!
      const view = buildLearningMapViewModel(map, [], { dataset: 'profile' })
      expect(map.textbook).toMatchObject({ subject: 'ENGLISH', semester: 2 })
      expect(view.islands).toHaveLength(5)
      expect(flattenKnowledgeNodes(view.islands)).toHaveLength(23)
      for (const [index, d] of definitions.entries()) {
        const lesson = (await repository.getByKnowledgePoint(d.knowledgePointId))!
        expect(lesson.contentStatus).toBe('PUBLISHED')
        expect(lesson.blocks).toHaveLength(
          d.sections.length +
            (d.number === 2 ? 1 : 0) +
            1 +
            Number(d.words.length > 0) +
            Number(!!d.sounds) +
            Number(!!d.sentencePattern) +
            Number(d.kind === 'unit') +
            Number(d.missingSections.length > 0) +
            Number(d.notes.length > 0),
        )
        const publishedBlocks = lesson.blocks.map((b) => b.block.text)
        if (d.number === 2) {
          expect(publishedBlocks.slice(0, -1).join('\n')).toBe(
            textFor(index).replace(
              'Sally: Why, Sally?',
              '来稿待核对句：Sally: Why, Sally?\nSally: Why?',
            ),
          )
          expect(publishedBlocks.at(-1)).toContain('项目校正参考表达')
        } else expect(publishedBlocks.join('\n')).toBe(textFor(index))
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
      expect(segments.length).toBeGreaterThan(d.kind === 'unit' ? 10 : -1)
      expect(segments.every((s) => !s.text.includes('/'))).toBe(true)
      expect(segments.every((s) => !/\p{Script=Han}/u.test(s.text))).toBe(true)
      expect(segments.some((s) => s.section === 'story')).toBe(d.number === 12)
      expect(segments.some((s) => s.section === 'chant')).toBe(
        d.sections.some((s) => s.kind === 'chant'),
      )
      for (const word of d.words)
        expect(segments.some((s) => s.section === 'words' && s.text === word.english)).toBe(true)
      expect(
        segments.some(
          (s) =>
            s.section !== 'words' &&
            /^(Communicate|Think|Extend|Story|Listen|Chant)[:\s]*$/i.test(s.text),
        ),
      ).toBe(false)
      expect(segments.some((s) => /…|_{2,}|\.{3}/.test(s.text))).toBe(false)
    }
  })

  it('grades all 108 choice paths and keeps personal oral responses out of automatic scoring', () => {
    expect(questions).toHaveLength(36)
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
      (q) => q.knowledgePointId.endsWith('12') && q.tags.includes('story'),
    )!
    expect(
      correct.options!.find((o) => o.content[0]?.text === 'He knocks it down.')?.optionKey,
    ).toBe(
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
          bundle: {
            ...bundle,
            unitId: definitions.find((d) => d.unitId !== bundle.unitId)!.unitId,
          },
        }),
      ).toBeNull()
    }
  })

  it('shows the single English edition already selected and persists it through account reloads', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_5', semesterId: 'SEMESTER_LOWER' })
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
      expect(english.text()).toContain('五年级下册')
      expect(english.text()).toContain('2013版')
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

  it('calls the model contract with all twelve units and retains the correct reviewed source questions', async () => {
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
    expect(fetcher).toHaveBeenCalledTimes(12)
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
      const displayed = wrapper.text().replace(/\s+/g, ' ')
      for (const section of d.sections)
        for (const paragraph of [section.english, section.chinese].flatMap((text) =>
          text.split(/\n\n+/),
        ))
          expect(displayed).toContain(
            (d.number === 2
              ? paragraph.replace(
                  'Sally: Why, Sally?',
                  '来稿待核对句：Sally: Why, Sally?\nSally: Why?',
                )
              : paragraph
            ).replace(/\s+/g, ' '),
          )
      expect(wrapper.text()).toContain('2013版')
      expect(wrapper.text()).toContain(d.page ? `用户标注第${d.page}页` : '用户附加综合练习')
      expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(
        d.kind === 'unit',
      )
      const sync = wrapper.findAll('button').find((b) => b.text() === '开始单元同步练习')
      expect(!!sync).toBe(d.kind === 'unit')
      if (sync) {
        await sync.trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query.practiceSetId).toBe(
          `${d.knowledgePointId}_SYNC_PRACTICE_V1`,
        )
      }
      if (d.kind === 'directory') {
        expect(wrapper.text()).not.toContain('正文尚未提供')
        expect(wrapper.text()).not.toContain('先听读，再完成单词拼写')
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

it('keeps modules ordered and excludes directory-only nodes and projects from generated exams', async () => {
  const model = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
  expect(model.islands.map((i) => i.lessons.length)).toEqual([5, 5, 5, 4, 4])
  expect(model.islands[0]!.lessons.map((l) => l.title)).toEqual([
    'Unit 1 Tidy up!',
    'Unit 2 Our new home',
    'Unit 3 In the future',
    'Revision 1 复习1',
    'Project 1 项目1',
  ])
  expect(buildAssessmentPapers(model, model.islands[4]!.unitId)).toEqual([])
  for (const d of definitions.filter((d) => d.kind !== 'unit')) {
    expect(catalog.questions.some((q) => q.knowledgePointId === d.knowledgePointId)).toBe(false)
    expect(
      added.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!.body
        .missingSections,
    ).toEqual(d.missingSections)
  }
  for (const paper of buildAssessmentPapers(model)) {
    expect(paper.totalPoints).toBe(12)
    expect(paper.coveredPoints).toBe(12)
    expect(paper.questions.length).toBeGreaterThanOrEqual(24)
  }
  for (const island of model.islands.slice(0, 4)) {
    const papers = buildAssessmentPapers(model, island.unitId)
    expect(papers).toHaveLength(3)
    expect(
      papers.every((p) => p.totalPoints === 3 && p.coveredPoints === 3 && p.questions.length >= 12),
    ).toBe(true)
  }
})

import {
  gradeFiveEnglishLowerUnitTestQuestions as syncQuestions,
  gradeFiveEnglishLowerUnitTestPractices as practices,
  gradeFiveEnglishLowerUnitTestSheet as sheet,
} from '@/data/curriculum/grade-5/english-shanghai-lower/unit-tests'
import {
  synchronousPracticeFor,
  synchronousPracticeForLesson,
} from '@/services/curriculum/synchronousPractice'
it('retains all supplied exercises in twelve isolated sets, grades all answers, and rejects cross-book contexts', async () => {
  expect(syncQuestions).toHaveLength(24)
  expect(practices.map((p) => p.targetCount)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
  const raw = readFileSync(
    resolve('src/data/curriculum/grade-5/english-shanghai-lower/source-text.md'),
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

it('preserves raw errors while giving corrections and ambiguous choices explicit conditions', () => {
  expect(
    catalog.questions.filter(
      (q) => q.textbookVersionId === book && q.tags.includes('comprehensive-only'),
    ),
  ).toHaveLength(270)
  for (const [unit, answer] of [
    [4, 'am'],
    [10, 'is'],
  ] as const) {
    const seed = sheet.papers[unit - 1]!.questions[0]!
    expect(seed.originalReference).toBe('shtu')
    expect(seed.reference).toBe('A. ' + answer)
    expect(seed.adjustment).toContain('shtu')
  }
  const affirmative = sheet.papers[2]!.questions[0]!
  expect(affirmative.originalStem).toBe('I ____ (will / won’t) be tall in the future.')
  expect(affirmative.stem).toContain('肯定预测')
  const plan = sheet.papers[9]!.questions[1]!
  expect(plan.stem).toContain('be going to')
  expect(plan.adjustment).toContain('均可构成合法句子')
  const displayed = definitions.findIndex((d) => d.number === 7)
  expect(textFor(displayed)).toContain('主课文顺序是先到校门见面')
})

it('speaks all list predictions, dialogue roles and ellipsis pauses without pronunciation metadata', () => {
  const speech = (number: number) => {
    const i = definitions.findIndex((d) => d.number === number)
    return buildEnglishReadingSegments(
      (added.courseContents[i]!.body.blocks as { text: string }[]).map((b, sort) => ({
        id: String(sort),
        content: b.text,
        type: 'concept',
        sort,
        isSample: false,
      })),
    )
  }
  const future = speech(3)
  for (const sentence of [
    'You will not wear glasses.',
    'You will have big and beautiful eyes.',
    'You will live in Beijing.',
    'You will be a teacher.',
    'You will love your job.',
  ])
    expect(future.some((s) => s.text === sentence)).toBe(true)
  expect(speech(1).some((s) => s.speaker === 'Sally' && s.text === 'Whose cap is this?')).toBe(true)
  expect(speech(4).some((s) => s.speaker === 'Ms Guo')).toBe(true)
  expect(speech(9).some((s) => s.speaker === 'Kitty' && s.text === 'Ah')).toBe(true)
  expect(speech(10).some((s) => s.text.includes('I’m going to invent something myself.'))).toBe(
    true,
  )
  expect(speech(3).every((s) => !s.text.startsWith('•'))).toBe(true)
  expect(speech(1).some((s) => s.text.includes('ar (car)'))).toBe(false)
  for (const number of [13, 15, 17]) expect(speech(number)).toEqual([])
  for (const [number, words] of [
    [10, ['chair', 'shop']],
    [11, ['star', 'wall']],
    [12, ['think', 'this']],
  ] as const) {
    for (const word of words)
      expect(speech(number).some((s) => s.section === 'words' && s.text === word)).toBe(true)
    expect(speech(number).every((s) => !s.text.includes('/'))).toBe(true)
  }
  const wordLists = [...speech(20), ...speech(21)].map((s) => s.text)
  for (const word of [
    'dining room',
    'school gate',
    'meeting room',
    'toothache',
    'myself',
    'through',
  ])
    expect(wordLists).toContain(word)
  expect(speech(23).map((s) => s.text)).toEqual([
    'Sanya',
    'Chinese New Year',
    'the Dragon Boat Festival',
    'the Mid-Autumn Festival',
    'the Double Ninth Festival',
  ])
  expect(speech(22).some((s) => s.text === 'What are you going to do?')).toBe(true)
  expect(speech(22).every((s) => !/…|_{2,}/.test(s.text))).toBe(true)
})

it('replaces outdated project topics and displays all supplied review tasks and appendix words', () => {
  const content = (number: number) => textFor(definitions.findIndex((d) => d.number === number))
  for (const [number, title, oldTopic] of [
    [14, 'Our changes', '制作未来的自己海报'],
    [16, 'My holiday plan', '制作阅读海报'],
    [18, 'Our Open Day', '制作健康小贴士海报'],
  ] as const) {
    expect(content(number)).toContain(title)
    expect(content(number)).not.toContain(oldTopic)
  }
  for (const number of [14, 16, 18, 19]) {
    const bundle = bundles.find((b) => b.knowledgePointId.endsWith(String(number)))!
    expect(bundle.extensionActivities).toHaveLength(1)
    expect(bundle.extensionActivities[0]!.referenceAnswer).toBe('作品没有唯一答案，不自动判分。')
    expect(bundle.extensionActivities[0]!.sourceId).toBe(supplementSource)
  }
  expect(content(19)).toContain('Chinese festivals / Great inventions')
  expect(content(19)).toContain('Choose one festival or invention.')
  for (const [number, task] of [
    [13, '词汇、句型配对；看图问答；语音朗读练习'],
    [15, '对话补全；周末、假期情景口头表达；语音辨音'],
    [17, '情景角色扮演；看图选句子；语音单词分类'],
  ] as const) {
    expect(content(number)).toContain(task)
    expect(content(number)).toContain('用户提供提要与任务')
  }
  const raw = readFileSync(
    resolve('src/data/curriculum/grade-5/english-shanghai-lower/supplement-source.md'),
    'utf8',
  )
  for (const [number, part] of [
    [20, 'Word list 1'],
    [21, 'Word list 2'],
  ] as const) {
    const appendix = raw.split('### ' + part)[1]!.split('###')[0]!
    for (const line of appendix.split('\n').filter((l) => /^Unit\d+ /.test(l))) {
      const [unit, ...rest] = line.split(' ')
      expect(content(number)).toContain(unit! + ' 单词')
      expect(content(number)).toContain(rest.join(' '))
    }
  }
  for (const line of raw
    .split('### Daily expressions')[1]!
    .split('###')[0]!
    .split('\n')
    .filter((l) => l.startsWith('- ')))
    expect(content(22)).toContain(line)
  expect(content(23)).toContain('the Double Ninth Festival')
})
