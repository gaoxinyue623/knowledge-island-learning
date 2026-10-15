import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID as book,
  G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID as textSource,
  G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID as practiceSource,
  gradeSixEnglishUpperCurriculum as added,
  gradeSixEnglishUpperDefinitions as definitions,
  gradeSixEnglishUpperQuestions as questions,
  gradeSixEnglishUpperBundles as bundles,
  gradeSixEnglishUpperSource as supplied,
  gradeSixEnglishUpperCommunicateSupplement as communicateSupplement,
  G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_SOURCE_ID as communicateSource,
  gradeSixEnglishUpperCommunicateCorrection as communicateCorrection,
  G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_CORRECTION_SOURCE_ID as correctionSource,
} from '@/data/curriculum/grade-6/english-shanghai-upper-2022'
import { G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID as otherBook } from '@/data/curriculum/grade-5/english-shanghai-upper-2022'
import { G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL as approval } from '@/data/curriculum/production/gradeSixEnglishUpperApproval'
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
import {
  createReadingQuest,
  checkQuestAnswer,
  englishPracticeFor,
} from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { validateQuestion } from '@/services/validation/questionValidation'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { reviewedAiSources } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic, createFormalGenerator } from '../server/llm/formalGeneration'
import { selectAccount } from '@/services/account/storage'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { useStudentStore } from '@/stores/studentStore'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import { buildAssessmentPapers } from '@/services/comprehensive-assessment/papers'
import { synchronousPracticeForLesson } from '@/services/curriculum/synchronousPractice'
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

it('preserves all supplied text, words, source scope, pages and missing audio', () => {
  const source = readFileSync(
    resolve('src/data/curriculum/grade-6/english-shanghai-upper-2022/source-text.md'),
    'utf8',
  )
  expect(createHash('sha256').update(source).digest('hex')).toBe(supplied.sourceSha256)
  expect(definitions).toHaveLength(11)
  expect(definitions.flatMap((d) => d.words)).toHaveLength(27)
  expect(definitions.flatMap((d) => d.readingWords)).toHaveLength(15)
  expect(supplied.wordLists.flatMap((d) => d.words)).toHaveLength(41)
  expect(added.courseContents.map((c) => c.body.suppliedPage)).toEqual([
    null,
    null,
    null,
    null,
    null,
    null,
    73,
    75,
    77,
    78,
    81,
  ])
  for (const [i, d] of definitions.entries()) {
    const displayed = textFor(i)
    for (const section of d.sections) {
      expect(displayed).toContain(section.english)
      expect(displayed).toContain(section.chinese)
      if (d.kind === 'unit') {
        expect(source).toContain(section.english)
        expect(source).toContain(section.chinese)
      }
    }
    for (const w of [...d.words, ...d.readingWords])
      expect(displayed).toContain(`${w.english} ${w.phonetic ? w.phonetic + ' ' : ''}${w.chinese}`)
    if (d.kind === 'unit') {
      expect(d.communicate).toHaveLength(3)
      for (const c of d.communicate) expect(displayed).toContain(c.title)
      for (const line of d.soundExamples.split('\n')) expect(displayed).toContain(line)
      expect(displayed).toContain(d.grammarNote)
      expect(added.courseContents[i]!.body.missingSections).toEqual(d.missingSections)
      expect(d.missingSections).toEqual([])
      expect(displayed).not.toContain('来稿仅提供活动标题')
    }
  }
  expect(definitions[4]!.words.find((w) => w.english === 'watch')?.phonetic).toBe('')
  expect(textFor(8).match(/☐ I can /g)).toHaveLength(24)
  expect(textFor(10)).toContain('heavy → heavier → heaviest')
  expect(textFor(10)).not.toContain('| --- |')
  for (const w of supplied.wordLists.flatMap((d) => d.words))
    expect(textFor(9)).toContain(`${w.english} ${w.phonetic}`)
  expect(supplied.sourceNote).toContain('未对照出版社原书')
  expect(isEnglishPilotTextbook(book)).toBe(true)
  for (const id of [textSource, practiceSource, communicateSource, correctionSource])
    expect(catalog.contentSources.find((s) => s.id === id)?.releaseApprovalId).toBe(approval)
  expect(validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues).toEqual(
    [],
  )
})

it('makes every node available in both accounts and confines formal practice and AI to the six units', async () => {
  const repository = new MockLearningContentRepository({ records: [...catalog.contents] })
  for (const account of ['english_parent', 'second_english_parent']) {
    selectAccount(account)
    const available = await curriculumService.resolveAvailableTextbooks({
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      regionId: 'unknown',
    })
    expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([book])
    const map = (await curriculumService.getLearningMapCurriculum(book))!
    expect(flattenKnowledgeNodes(buildLearningMapViewModel(map).islands)).toHaveLength(11)
    for (const [i, d] of definitions.entries()) {
      const lesson = (await repository.getByKnowledgePoint(d.knowledgePointId))!
      expect(lesson.blocks.map((b) => b.block.text).join('\n')).toBe(textFor(i))
      const assessment = await new QuestionEngineAdapter().loadAssessment(context(d), {
        dataset: 'profile',
      })
      expect(assessment.questions).toHaveLength(d.kind === 'unit' ? 3 : 0)
      expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(d.kind === 'unit' ? 3 : 0)
      expect(synchronousPracticeForLesson(context(d))).toBeNull()
      if (d.kind === 'unit') {
        expect(
          resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }).title,
        ).toBe(d.title)
        expect(() =>
          resolveAiTopic({ textbookId: otherBook, knowledgePointId: d.knowledgePointId }),
        ).toThrow()
      }
    }
  }
})

it('speaks all 42 vocabulary items and supplied readings while omitting first-aid operations, titles, translations and phonetics', () => {
  for (const [i, d] of definitions.entries()) {
    if (d.kind !== 'unit') continue
    const blocks = (added.courseContents[i]!.body.blocks as { text: string }[]).map(
      (b, j): LessonContentBlockViewModel => ({
        id: String(j),
        content: b.text,
        type: 'concept',
        sort: j,
        isSample: false,
      }),
    )
    const segments = buildEnglishReadingSegments(blocks)
    expect(segments.length).toBeGreaterThan(12)
    expect(segments.every((s) => !s.text.includes('/') && !/\p{Script=Han}/u.test(s.text))).toBe(
      true,
    )
    for (const w of [...d.words, ...d.readingWords])
      expect(segments.some((s) => s.section === 'words' && s.text === w.english)).toBe(true)
    expect(segments.some((s) => /…|_{2,}|\.{3}/.test(s.text))).toBe(false)
    expect(segments.some((s) => s.text.includes('put medicine on the wound'))).toBe(false)
    expect(segments.some((s) => s.text.includes('Pinch your nose'))).toBe(false)
    expect(
      segments.some((s) => s.text === 'rain' || s.text === 'enough' || s.text === 'Communicate'),
    ).toBe(false)
  }
  expect(textFor(2)).toContain('Pinch your nose for 5 to 10 minutes.')
  expect(textFor(2)).toContain('持续10—15分钟')
  expect(textFor(2)).toContain('至少15分钟并就医')
  expect(textFor(2)).toContain('https://www.who.int/news-room/fact-sheets/detail/rabies')
  expect(questions.some((q) => q.stem.some((b) => /止血|鼻血|上药/.test(b.text ?? '')))).toBe(false)
})

it('grades every option correctly and provides scoped, solvable spelling, matching and sentence training', () => {
  expect(questions).toHaveLength(18)
  for (const q of questions) {
    expect(validateQuestion(q).valid).toBe(true)
    if (q.answerRule.ruleType !== 'SINGLE_OPTION') throw new Error('single choice expected')
    for (const o of q.options!)
      expect(validateQuestionAnswer(q, { type: 'singleChoice', optionId: o.id }).status).toBe(
        o.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect',
      )
  }
  for (const [i, bundle] of bundles.entries()) {
    const d = definitions[i]!,
      input = { bundle, title: d.title, text: textFor(i) },
      base = createReadingQuest(input)
    if (d.kind !== 'unit') {
      expect(base).toBeNull()
      expect(createTrainingQuest(input)).toBeNull()
      continue
    }
    expect(base?.stages).toHaveLength(3)
    expect(englishPracticeFor(d.knowledgePointId)?.words).toHaveLength(
      d.words.length + d.readingWords.length,
    )
    for (const variant of [0, 1, 2]) {
      const training = createTrainingQuest({ ...input, variant })!
      expect(training.stages).toHaveLength(9)
      for (const stage of [...base!.stages, ...training.stages])
        if (stage.kind === 'question') {
          expect(validateQuestion(stage.question).valid).toBe(true)
          expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe(
            'correct',
          )
        }
    }
    for (const key of ['textbookId', 'unitId', 'lessonId', 'knowledgePointId'] as const)
      expect(createReadingQuest({ ...input, bundle: { ...bundle, [key]: 'wrong' } })).toBeNull()
  }
})

it('keeps projects and appendices out of generated exam coverage and generates three distinct unit papers', async () => {
  const model = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
  const supplement = catalog.questions.filter(
    (q) => q.textbookVersionId === book && q.tags.includes('comprehensive-only'),
  )
  expect(supplement).toHaveLength(126)
  for (const q of supplement)
    expect(validateQuestionAnswer(q, correctAnswerDraft(q)).status).toBe('correct')
  for (const d of definitions) {
    const papers = buildAssessmentPapers(model, d.unitId)
    if (d.kind !== 'unit') {
      expect(papers).toEqual([])
      continue
    }
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
    for (const p of papers) {
      expect(p.totalPoints).toBe(1)
      expect(p.coveredPoints).toBe(1)
      expect(p.questions.length).toBeGreaterThanOrEqual(12)
    }
  }
  for (const paper of buildAssessmentPapers(model)) {
    expect(paper.totalPoints).toBe(6)
    expect(paper.coveredPoints).toBe(6)
  }
})

it('selects and persists the new grade six upper English book', async () => {
  const store = useCurriculumStore()
  store.setContext({ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' })
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
    expect(english.props('selected')).toBe(true)
    expect(english.props('candidateCount')).toBe(1)
    expect(english.text()).toContain('六年级上册')
    expect(store.englishTextbookVersionId).toBe(book)
    store.selectTextbook('CHINESE', store.availableTextbooks!.chinese.availableTextbooks[0]!.id)
    expect((await store.confirmCurriculum('english-child'))?.englishTextbookVersionId).toBe(book)
    setActivePinia(createPinia())
    expect(useCurriculumStore().englishTextbookVersionId).toBe(book)
    expect(curriculumProfileRepository.load()?.englishTextbookVersionId).toBe(book)
  } finally {
    wrapper.unmount()
  }
})

it('uses the authenticated model contract with correctly scoped reviewed sources for all six units', async () => {
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
  for (const d of definitions.filter((d) => d.kind === 'unit')) {
    const result = await generate({
      profileId: 'english-child',
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
  expect(fetcher).toHaveBeenCalledTimes(6)
})

it.each(definitions.map((d) => d.number))(
  'renders bilingual node %s with appropriate practice availability',
  async (number) => {
    const d = definitions.find((d) => d.number === number)!,
      pinia = createPinia()
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
      expect(wrapper.text().replace(/\s+/g, '')).toContain(
        d.sections[0]!.english.replace(/\s+/g, ''),
      )
      expect(wrapper.text().replace(/\s+/g, '')).toContain(
        d.sections[0]!.chinese.replace(/\s+/g, ''),
      )
      expect(wrapper.text()).toContain(d.page ? `用户标注第${d.page}页` : '来稿未标注单元页码')
      const material = d.communicateSupplement
      if (material) {
        const displayed = wrapper.text().replace(/\s+/g, '')
        for (const text of [
          material.listen,
          material.speak,
          material.frames,
          material.write,
          ...material.questions,
          material.listenTask,
          material.answerNotes,
          ...material.answers,
        ])
          expect(displayed).toContain(text.replace(/\s+/g, ''))
        expect(wrapper.text()).toContain(
          '补充稿题名：Unit ' + material.number + ' ' + material.title,
        )
        expect(wrapper.text()).not.toContain('听力正文、录音及示范文本尚未提供')
        expect(wrapper.text()).toContain('补充口语：' + material.title)
        expect(wrapper.text()).toContain('补充写作：' + material.title)
        if (material.revision === 3) {
          expect(wrapper.text()).toContain('力与运动、简易发明和临水城市')
          for (const previous of [
            'Healthy living',
            'Animals in danger',
            'E-friends',
            '对应原目录材料仍待补',
          ])
            expect(wrapper.text()).not.toContain(previous)
        }
      }

      expect(wrapper.findAll('button').some((b) => b.text().includes('开始教材练习'))).toBe(
        d.kind === 'unit',
      )
      expect(wrapper.findAll('button').some((b) => b.text() === '开始单元同步练习')).toBe(false)
      if (d.kind === 'project') expect(wrapper.text()).toContain('作品没有唯一答案，不自动判分')
      if (d.kind === 'appendix')
        expect(wrapper.text()).toContain('阅读册末材料，复习单词、语法或完成自查')
    } finally {
      wrapper.unmount()
    }
  },
)

it('retains original node identities, readings and question scope while archiving all six supplied Communicate materials', () => {
  const raw = readFileSync(
    resolve('src/data/curriculum/grade-6/english-shanghai-upper-2022/communicate-source.md'),
    'utf8',
  )
  expect(createHash('sha256').update(raw).digest('hex')).toBe(communicateSupplement.sourceSha256)
  expect(communicateSupplement.placementConfirmedByUser).toBe(true)
  expect(communicateSupplement.nodes.map((n) => n.number)).toEqual([1, 2, 3, 4, 5, 6])
  expect(added.textbooks[0]).toMatchObject({
    id: book,
    editionYear: 2022,
    updatedAt: communicateCorrection.updatedAt,
  })
  const correctedRaw = readFileSync(
    resolve(
      'src/data/curriculum/grade-6/english-shanghai-upper-2022/communicate-correction-source.md',
    ),
    'utf8',
  )
  expect(createHash('sha256').update(correctedRaw).digest('hex')).toBe(
    communicateCorrection.sourceSha256,
  )
  expect(catalog.contentSources.find((s) => s.id === correctionSource)).toMatchObject({
    sourceType: 'TEXTBOOK',
    sourceVersion: `SHA256:${communicateCorrection.sourceSha256}`,
    verifiedAt: communicateCorrection.updatedAt,
  })
  expect(catalog.contentSources.find((s) => s.id === communicateSource)).toMatchObject({
    sourceType: 'TEXTBOOK',
    sourceVersion: `SHA256:${communicateSupplement.sourceSha256}`,
    verifiedAt: communicateSupplement.updatedAt,
  })
  for (const [i, d] of definitions.entries()) {
    const original = supplied.units[i]!
    expect(d.title).toBe(original.title)
    expect(d.number).toBe(original.number)
    expect(d.sections).toEqual(original.sections)
    expect(d.communicate).toEqual(original.communicate)
    expect(d.words).toEqual(original.words)
    expect(d.readingWords).toEqual(original.readingWords)
    expect(d.questions).toEqual(original.questions)
    expect(d.knowledgePointId).toBe(
      `G6_SHANGHAI_ENGLISH_S1_KP_${String(original.number).padStart(2, '0')}`,
    )
    const content = added.courseContents[i]!
    expect(content.currentVersion).toBe(d.revision)
    expect(bundles[i]!.learningContent.currentVersion).toBe(1)
    if (!d.communicateSupplement) continue
    const m = d.communicateSupplement
    for (const text of [m.listen, m.speak, m.frames, m.write, ...m.questions]) {
      expect(m.revision === 3 ? correctedRaw : raw).toContain(text)
      expect(textFor(i)).toContain(text)
    }
    expect(content.body.sourceIds).toEqual([textSource, m.sourceId])
    expect(content.sourceId).toBe(m.sourceId)
    expect(content.body.missingMedia).toEqual(['Communicate教材原版录音'])
    expect(content.body.sectionKinds).toEqual(
      expect.arrayContaining(['communicate-listen', 'communicate-speak', 'communicate-write']),
    )
    expect(m.topicMismatch).toBe(false)
    expect(d.missingSections).toEqual([])
    const activities = bundles[i]!.extensionActivities
    expect(activities).toHaveLength(3)
    for (const a of activities.slice(1)) {
      expect(a.sourceId).toBe(m.sourceId)
      expect(a.referenceAnswer).toContain('没有唯一答案，不自动判分')
    }
    expect(activities[2]!.instruction).toBe(m.write)
  }
  expect(definitions.filter((d) => d.missingSections.length)).toEqual([])
  expect(questions).toHaveLength(18)
  expect(questions.every((q) => q.sourceId === practiceSource && q.questionVersion === 1)).toBe(
    true,
  )
  expect(catalog.questions.filter((q) => q.sourceId === communicateSource)).toEqual([])
  expect(catalog.questions.filter((q) => q.sourceId === correctionSource)).toEqual([])
})

it('replaces only Unit 4–6 Communicate topics and displays every corrected listening task and answer', () => {
  expect(communicateCorrection.nodes.map((node) => node.number)).toEqual([4, 5, 6])
  expect(definitions.slice(0, 6).map((node) => node.revision)).toEqual([2, 2, 2, 3, 3, 3])
  for (const [i, d] of definitions.entries()) {
    const current = d.communicateSupplement
    if (!current) continue
    const previous = communicateSupplement.nodes.find((node) => node.number === d.number)!
    if (d.number <= 3) {
      for (const key of [
        'title',
        'listen',
        'speak',
        'write',
        'frames',
        'questions',
        'notes',
      ] as const)
        expect(current[key]).toEqual(previous[key])
      continue
    }
    const corrected = communicateCorrection.nodes.find((node) => node.number === d.number)!
    const displayed = textFor(i)
    expect(current.title).toBe(corrected.title)
    for (const text of [current.listenTask, current.answerNotes, ...current.answers])
      expect(displayed).toContain(text)
    expect(displayed).not.toContain(previous.title)
    expect(displayed).not.toContain(previous.listen)
    expect(displayed).not.toContain(previous.speak)
    expect(displayed).not.toContain(previous.write)
    expect(displayed).not.toContain('原目录主题的Communicate听说写正文仍待核对与补充')
    expect(added.courseContents[i]!.body.supersedesCommunicateSourceId).toBe(communicateSource)
    for (const [j, suffix] of ['speak', 'write'].entries())
      expect(bundles[i]!.extensionActivities[j + 1]!.id).toBe(
        `${d.knowledgePointId}:communicate:${suffix}:v1`,
      )
  }
  expect(definitions[3]!.communicateSupplement!.answerNotes).toContain('trips、room')
  expect(definitions[4]!.communicateSupplement!.answers).toEqual(['1 → ladder', '2 → cart'])
  expect(definitions[5]!.communicateSupplement!.answers).toEqual([
    'The Pearl River → Guangzhou → It gave people food and water.',
    'The Seine River → Paris → It is important for ships to travel on.',
    'Lake Texcoco → Mexico City → It kept the city safe.',
  ])
})

it('includes complete listening scripts and A/B dialogues in speech while excluding unfinished writing frames', () => {
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
  for (const m of definitions.flatMap((d) =>
    d.communicateSupplement ? [d.communicateSupplement] : [],
  )) {
    const segments = speech(m.number)
    const texts = segments.map((s) => s.text)
    const listener = m.listen.replace(/^News reporter: /, '').replace(/^\d+\. /gm, '')
    for (const sentence of listener.split(/(?<=[.!?])\s+/)) expect(texts).toContain(sentence)
    for (const line of m.speak.split('\n')) {
      const [speaker, ...parts] = line.split(': ')
      for (const sentence of parts.join(': ').split(/(?<=[.!?])\s+/))
        expect(segments.some((s) => s.speaker === speaker && s.text === sentence)).toBe(true)
    }
    for (const question of m.questions) expect(texts).toContain(question)
    expect(
      segments.some((s) =>
        /_{2,}|…|Write about|Write your|Write an email|Dear friend|Yours,|Listen,|Listen and match|→/.test(
          s.text,
        ),
      ),
    ).toBe(false)
    expect(segments.every((s) => !s.text.includes('/') && !/\p{Script=Han}/u.test(s.text))).toBe(
      true,
    )
  }
  expect(
    speech(3).some(
      (s) => s.speaker === 'News reporter' && s.text === 'There was a fire in a building.',
    ),
  ).toBe(true)
  expect(speech(4).some((s) => s.text === 'Heavy things are more difficult to move.')).toBe(true)
  for (const number of [4, 5, 6]) {
    const previous = communicateSupplement.nodes.find((node) => node.number === number)!
    const firstSentence = previous.listen.split(/(?<=[.!?])\s+/)[0]!
    expect(speech(number).some((segment) => segment.text === firstSentence)).toBe(false)
  }
})
