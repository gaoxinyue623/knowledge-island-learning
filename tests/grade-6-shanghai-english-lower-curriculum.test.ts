import readingSigns from '@/data/curriculum/grade-6/english-shanghai-lower/reading-signs-supplement.json'
import illustration from '@/data/curriculum/grade-6/english-shanghai-lower/reading-signs-illustration.json'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID as book,
  G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID as textSource,
  G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID as practiceSource,
  G6_SHANGHAI_ENGLISH_S2_INTONATION_SOURCE_ID as intonationSource,
  gradeSixEnglishLowerCurriculum as added,
  gradeSixEnglishLowerDefinitions as definitions,
  gradeSixEnglishLowerQuestions as questions,
  gradeSixEnglishLowerBundles as bundles,
  gradeSixEnglishLowerSource as supplied,
  gradeSixEnglishLowerIntonationSupplement as intonation,
} from '@/data/curriculum/grade-6/english-shanghai-lower'
import { G5_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID as otherBook } from '@/data/curriculum/grade-5/english-shanghai-upper-2022'
import { G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL as approval } from '@/data/curriculum/production/gradeSixEnglishLowerApproval'
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

it('updates Reading signs dialogue and labels with an AI illustration before Look and learn', () => {
  const raw = readFileSync(
    'src/data/curriculum/grade-6/english-shanghai-lower/reading-signs-source.md',
  )
  expect(createHash('sha256').update(raw).digest('hex')).toBe(readingSigns.sourceSha256)
  const png = readFileSync('public' + illustration.url)
  expect(createHash('sha256').update(png).digest('hex')).toBe(illustration.sha256)
  const d = definitions.find((d) => d.number === 8)!
  expect(d.revision).toBe(3)
  expect(d.text).toContain('Where’s the underground station ↘?')
  expect(d.text).toContain('Can you see that sign ↗?')
  for (const label of [
    'No smoking.',
    'No swimming.',
    'Look out for animals.',
    'Keep quiet.',
    'Mind the gaps.',
  ])
    expect(d.text).toContain(label)
  expect(d.text).not.toContain('Ms Wang and her students')
  expect(d.excludedReadingLines).toEqual([])
  expect(d.questions).toEqual(supplied.units.find((d) => d.number === 8)!.questions)
  expect(d.sections[2]).toEqual(supplied.units.find((d) => d.number === 8)!.sections[1])
  const c = added.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
  expect(c.contentFormat).toBe('RICH_TEXT')
  const blocks = c.body.blocks as Array<{ type: string; text?: string; mediaAssetId?: string }>
  const imageIndex = blocks.findIndex((block) => block.type === 'IMAGE')
  expect(imageIndex).toBeGreaterThan(-1)
  expect(blocks[imageIndex + 1]!.text).toContain('标识学习 Look and learn')
  expect(catalog.mediaAssets.find((m) => m.id === blocks[imageIndex]!.mediaAssetId)?.url).toBe(
    illustration.url,
  )
})

it('preserves every bilingual paragraph, all appendix entries, source metadata and original page ordering', () => {
  const raw = readFileSync(
    resolve('src/data/curriculum/grade-6/english-shanghai-lower/source-text.md'),
    'utf8',
  )
  expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
  expect(definitions).toHaveLength(22)
  expect(added.units).toHaveLength(5)
  expect(definitions.flatMap((d) => d.words)).toHaveLength(58)
  expect(definitions.flatMap((d) => d.readingWords)).toHaveLength(3)
  expect(definitions.map((d) => d.number)).toEqual([
    1, 2, 3, 13, 4, 5, 6, 14, 7, 8, 9, 15, 10, 11, 12, 16, 17, 18, 19, 20, 21, 22,
  ])
  expect(added.courseContents.map((c) => c.body.suppliedPage)).toEqual([
    2, 8, 14, 20, 22, 28, 34, 40, 42, 48, 54, 60, 62, 68, 74, 80, 82, 85, 88, 88, 89, 90,
  ])
  expect(added.textbooks[0]?.editionYear).toBe(2013)
  expect(added.textbooks[0]?.versionName).toBe(intonation.title)
  for (const [i, d] of definitions.entries()) {
    const displayed = textFor(i)
    for (const section of d.sections) {
      const textArchive =
        d.number === 8 && section.scope !== 'Look and read'
          ? readFileSync(
              'src/data/curriculum/grade-6/english-shanghai-lower/reading-signs-source.md',
              'utf8',
            )
          : raw
      if (d.number === 8 && section.scope === 'Look and learn') {
        for (const line of section.english.split('\n')) expect(textArchive).toContain(line)
      } else expect(textArchive).toContain(section.english)
      for (const line of section.english.split('\n').filter(Boolean))
        expect(displayed).toContain(line)
      if (section.chinese) {
        if (d.number !== 8 || section.scope === 'Look and read')
          expect(raw).toContain(section.chinese)
        expect(displayed).toContain(section.chinese)
      }
      if (section.byline) expect(displayed).toContain(section.byline)
    }
    for (const w of d.words) {
      expect(displayed).toContain(`${w.english} ${w.phonetic ? w.phonetic + ' ' : ''}${w.chinese}`)
      expect(raw).toContain(w.english)
    }
    if (d.kind === 'unit') {
      expect(d.sections.map((s) => s.scope)).toEqual(
        d.number === 8
          ? ['Listen and say', 'Look and learn', 'Look and read']
          : ['Listen and say', 'Look and read'],
      )
      for (const label of ['Listen and say', 'Look and read']) expect(displayed).toContain(label)
      expect(displayed).toContain(d.sounds || d.speechFeature)
      if (d.intonationSupplement) {
        for (const sample of [...intonation.examples, ...intonation.practice])
          expect(displayed).toContain(sample.sentence)
      } else expect(displayed).toContain(d.soundExamples || d.speechExamples || '未提供示例文本')
    }
  }
  expect(supplied.wordLists.map((w) => w.words.length)).toEqual([58, 27])
  expect(definitions.find((d) => d.number === 19)!.sections[0]!.english.split('\n')).toHaveLength(5)
  expect(definitions.find((d) => d.number === 20)!.sections[0]!.english.split(',')).toHaveLength(14)
  expect(definitions.find((d) => d.number === 22)!.sections[0]!.english.split('\n')).toHaveLength(9)
  expect(supplied.sourceNote).toContain('未对照出版社原书')
  expect(isEnglishPilotTextbook(book)).toBe(true)
  for (const id of [textSource, practiceSource, intonationSource])
    expect(catalog.contentSources.find((s) => s.id === id)?.releaseApprovalId).toBe(approval)
  expect(validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues).toEqual(
    [],
  )
})

it('fills only Unit 12 speech examples, records the supplementary source and preserves all existing node and practice identities', () => {
  const raw = readFileSync(
    resolve('src/data/curriculum/grade-6/english-shanghai-lower/intonation-source.md'),
    'utf8',
  )
  expect(createHash('sha256').update(raw).digest('hex')).toBe(intonation.sourceSha256)
  const source = added.sources.find((s) => s.id === intonationSource)!
  expect(source.sourceVersion).toBe(`SHA256:${intonation.sourceSha256}`)
  expect(source.notes).toContain('未独立对照出版社原页')
  expect(intonation.examples).toHaveLength(4)
  expect(intonation.practice).toHaveLength(3)
  for (const [i, d] of definitions.entries()) {
    const original = supplied.units.find((unit) => unit.number === d.number)!
    const content = added.courseContents[i]!
    expect(d.lessonId).toBe(`G6_SHANGHAI_ENGLISH_S2_LESSON_${String(d.number).padStart(2, '0')}`)
    expect(d.knowledgePointId).toBe(
      `G6_SHANGHAI_ENGLISH_S2_KP_${String(d.number).padStart(2, '0')}`,
    )
    if (d.number !== 8) expect(d.sections).toEqual(original.sections)
    expect(d.questions).toEqual(original.questions)
    expect(d.missingSections).toEqual([])
    expect(content.currentVersion).toBe(d.number === 8 ? 3 : d.number === 12 ? 2 : 1)
    expect(content.sourceId).toBe(
      d.number === 8
        ? 'G6_SHANGHAI_ENGLISH_S2_READING_SIGNS_USER_TEXT_V3'
        : d.number === 12
          ? intonationSource
          : textSource,
    )
    expect(bundles[i]!.learningContent.id).toBe(`${d.knowledgePointId}:learning:v1`)
  }
  const unit = definitions.find((d) => d.number === 12)!
  const content = added.courseContents[definitions.indexOf(unit)]!
  expect(content.body.sourceIds).toEqual([textSource, intonationSource])
  expect(content.body.intonationSupplement).toEqual(intonation)
  expect(content.body.speechFeature).toBe('Intonation & word linking')
  expect(content.body.missingSections).toEqual([])
  const displayed = textFor(definitions.indexOf(unit))
  for (const rule of intonation.rules) expect(displayed).toContain(rule)
  expect(displayed).toContain(intonation.tip)
  for (const sample of [...intonation.examples, ...intonation.practice]) {
    expect(raw).toContain(sample.sentence)
    expect(displayed).toContain(sample.description)
    expect(displayed).toContain(sample.direction)
  }
  expect(displayed).not.toContain('未提供示例文本')
  expect(displayed).not.toContain('未注明版次年份')
  expect(questions.map((q) => q.id)).toEqual(
    definitions
      .filter((d) => d.kind === 'unit')
      .flatMap((d) => [1, 2, 3].map((n) => `${d.knowledgePointId}_Q${n}`)),
  )
})

it('makes all seven Unit 12 examples readable without speaking intonation marks or Chinese annotations', () => {
  const unit = definitions.find((d) => d.number === 12)!
  const content = added.courseContents[definitions.indexOf(unit)]!
  const blocks = (content.body.blocks as { text: string }[]).map(
    (block, sort): LessonContentBlockViewModel => ({
      id: `unit12-${sort}`,
      content: block.text,
      type: 'concept',
      sort,
      isSample: false,
    }),
  )
  const segments = buildEnglishReadingSegments(blocks)
  for (const sample of [...intonation.examples, ...intonation.practice])
    expect(segments.some((segment) => segment.text === sample.sentence && !segment.speaker)).toBe(
      true,
    )
  expect(segments.every((segment) => !/[↗↘\p{Script=Han}]/u.test(segment.text))).toBe(true)
  expect(segments.some((segment) => /Intonation|word linking|Sounds|2013/.test(segment.text))).toBe(
    false,
  )
})

it('publishes the lower book and five map groups in either account while keeping projects and appendices out of formal and AI practice', async () => {
  const repository = new MockLearningContentRepository({ records: [...catalog.contents] })
  for (const account of ['english_parent', 'second_english_parent']) {
    selectAccount(account)
    const available = await curriculumService.resolveAvailableTextbooks({
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_LOWER',
      regionId: 'unknown',
    })
    expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([book])
    const map = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
    expect(map.islands.map((i) => i.lessons.length)).toEqual([4, 4, 4, 4, 6])
    expect(flattenKnowledgeNodes(map.islands)).toHaveLength(22)
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

it('speaks vocabulary and body text with joint and numbered roles, omitting copied errors, phonetics, translations and metadata', () => {
  const speech = (number: number) => {
    const i = definitions.findIndex((d) => d.number === number)
    const blocks = (
      added.courseContents[i]!.body.blocks as { text: string; mediaAssetId?: string }[]
    ).map((b, j): LessonContentBlockViewModel => ({
      id: String(j),
      content: b.text,
      type: b.mediaAssetId ? 'media' : 'concept',
      sort: j,
      isSample: false,
    }))
    return buildEnglishReadingSegments(blocks)
  }
  for (const d of definitions.filter((d) => d.kind === 'unit')) {
    const segments = speech(d.number)
    expect(segments.length).toBeGreaterThan(8)
    expect(segments.every((s) => !s.text.includes('/') && !/\p{Script=Han}/u.test(s.text))).toBe(
      true,
    )
    for (const w of [...d.words, ...d.readingWords])
      expect(segments.some((s) => s.section === 'words' && s.text === w.english)).toBe(true)
    expect(
      segments.some(
        (s) => s.text === 'Sounds' || s.text === 'By Joe' || s.text === 'Listen and say',
      ),
    ).toBe(false)
    expect(segments.some((s) => s.text.includes('We can follow them back home'))).toBe(false)
    expect(segments.some((s) => s.text.includes('You have beautiful voice'))).toBe(false)
  }
  const signsSpeech = speech(8)
  expect(
    signsSpeech.some((s) => s.speaker === 'Woman' && s.text === 'Where’s the underground station?'),
  ).toBe(true)
  expect(signsSpeech.every((s) => !/[↗↘]/.test(s.text))).toBe(true)
  for (const label of readingSigns.lesson.sections[1]!.english.split('\n'))
    expect(signsSpeech.filter((s) => s.text === label)).toHaveLength(1)
  expect(signsSpeech.some((s) => s.text === 'Reading signs')).toBe(false)
  expect(
    speech(5).some((s) => s.speaker === 'Joe & Alice' && s.text === 'We’re making a model house.'),
  ).toBe(true)
  expect(
    speech(12).some((s) => s.speaker === 'Pea5' && s.text === 'I will do something useful.'),
  ).toBe(true)
  expect(
    speech(10).some((s) => s.speaker === 'Fox' && s.text === 'You have a beautiful voice.'),
  ).toBe(true)
  expect(speech(9).some((s) => s.text.includes('they made us into a piece of cloth'))).toBe(false)
  expect(speech(11).some((s) => s.text.includes('Easter is on a Sunday in March or April'))).toBe(
    true,
  )
})

it('keeps copied mistakes and corrected references auditable, and classifies all supplied past tense pairs', () => {
  const verb = definitions.find((d) => d.number === 21)!,
    verbText = textFor(definitions.indexOf(verb))
  expect(supplied.verbRows).toHaveLength(12)
  expect(supplied.verbRows.filter((r) => r.kind === 'regular').map((r) => r.base)).toEqual([
    'weigh',
    'use',
  ])
  expect(supplied.verbRows.filter((r) => r.kind === 'irregular')).toHaveLength(10)
  expect(verbText).toContain('规则变化：weigh — weighed')
  expect(verbText).toContain('不规则变化：catch — caught')
  for (const number of [9, 10]) {
    const d = definitions.find((d) => d.number === number)!,
      text = textFor(definitions.indexOf(d))
    expect(d.excludedReadingLines.length).toBeGreaterThan(0)
    for (const original of d.excludedReadingLines)
      expect(text).toContain('来稿待核对句：' + original)
    expect(d.notes.length).toBeGreaterThan(0)
  }
  const u7 = definitions.find((d) => d.number === 7)!
  expect(u7.readingWords.map((w) => w.chinese)).toEqual(['蚂蚁', '蜜蜂', '蚁后'])
  expect(u7.readingWords.every((w) => w.phonetic === '')).toBe(true)
  expect(textFor(definitions.indexOf(u7))).toContain('项目按本课中译补充')
  const u10 = definitions.find((d) => d.number === 10)!
  expect(u10.corrections[0]).toContain('have a beautiful voice')
  expect(textFor(definitions.indexOf(u10))).toContain('项目校正参考表达（非教材原稿）')
})

it('grades every answer path and generates correctly scoped, solvable training for all twelve units', () => {
  expect(questions).toHaveLength(36)
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

it('creates distinct Module and final assessment papers covering only the twelve taught units', async () => {
  const model = buildLearningMapViewModel((await curriculumService.getLearningMapCurriculum(book))!)
  const supplement = catalog.questions.filter(
    (q) => q.textbookVersionId === book && q.tags.includes('comprehensive-only'),
  )
  expect(supplement).toHaveLength(183)
  for (const q of supplement)
    expect(validateQuestionAnswer(q, correctAnswerDraft(q)).status).toBe('correct')
  for (const module of added.units) {
    const papers = buildAssessmentPapers(model, module.id)
    if (module.sortOrder === 5) {
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
      expect(p.totalPoints).toBe(3)
      expect(p.coveredPoints).toBe(3)
      for (const q of p.questions)
        expect(definitions.find((d) => d.knowledgePointId === q.knowledgePointId)?.kind).toBe(
          'unit',
        )
    }
  }
  for (const paper of buildAssessmentPapers(model)) {
    expect(paper.totalPoints).toBe(12)
    expect(paper.coveredPoints).toBe(12)
  }
})

it('selects and persists the grade-six lower English book independently of the upper edition', async () => {
  const store = useCurriculumStore()
  store.setContext({ gradeId: 'GRADE_6', semesterId: 'SEMESTER_LOWER' })
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
    expect(english.text()).toContain('六年级下册')
    expect(english.text()).toContain('2013')
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

it('uses the model contract with correctly scoped reviewed sources for all twelve units', async () => {
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
  expect(fetcher).toHaveBeenCalledTimes(12)
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
      const displayed = wrapper.text().replace(/\s+/g, '')
      for (const section of d.sections) {
        for (const line of section.english.split('\n').filter(Boolean))
          expect(displayed).toContain(line.replace(/\s+/g, ''))
        if (section.chinese) expect(displayed).toContain(section.chinese.replace(/\s+/g, ''))
      }
      if (number === 8) {
        const image = wrapper.find(`img[src="${illustration.url}"]`)
        expect(image.exists()).toBe(true)
        expect(image.attributes('alt')).toContain('AI生成配套素材')
      }
      expect(wrapper.text()).toContain(`用户标注第${d.page}页`)
      expect(wrapper.text()).toContain('三年级起点·2013版')
      if (d.intonationSupplement) {
        for (const text of [
          ...intonation.rules,
          ...intonation.examples.flatMap((sample) => [
            sample.sentence,
            sample.description,
            sample.direction,
          ]),
          ...intonation.practice.flatMap((sample) => [sample.sentence, sample.direction]),
          intonation.tip,
        ])
          expect(displayed).toContain(text.replace(/\s+/g, ''))
        expect(displayed).not.toContain('未提供示例文本')
        expect(displayed).not.toContain('来稿未提供：Sounds示例文本')
        const options = wrapper.findAll('option').map((option) => option.text())
        for (const sample of [...intonation.examples, ...intonation.practice])
          expect(options.some((option) => option.includes(sample.sentence))).toBe(true)
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
