import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID as book,
  G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID as textSource,
  G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID as practiceSource,
  G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_SOURCE_ID as supplementSource,
  shenzhenEnglishLowerCurriculum as added,
  shenzhenEnglishLowerDefinitions as definitions,
  shenzhenEnglishLowerQuestions as questions,
  shenzhenEnglishLowerBundles as bundles,
  shenzhenEnglishLowerSource as supplied,
  shenzhenEnglishLowerSupplement as supplement,
} from '@/data/curriculum/grade-2/shenzhen-english-lower'
import { G2_SHENZHEN_ENGLISH_S1_TEXTBOOK_ID as upperBook } from '@/data/curriculum/grade-2/english-shanghai-upper'
import { englishSyncPracticeFor } from '@/data/curriculum/grade-2/shenzhen-english-lower/synchronousExercises'
import {
  SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL as approval,
  SHENZHEN_ENGLISH_LOWER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/shenzhenEnglishLowerApproval'
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
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import { useStudentStore } from '@/stores/studentStore'
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

describe('Shenzhen Shanghai-Oxford grade 2 lower English import', () => {
  it('retains every supplied bilingual section, 40 words and six sentence patterns without inventing absent columns', () => {
    const source = readFileSync(
      resolve('src/data/curriculum/grade-2/shenzhen-english-lower/source-text.md'),
      'utf8',
    )
    expect(createHash('sha256').update(source).digest('hex')).toBe(supplied.sourceSha256)
    expect(definitions).toHaveLength(6)
    expect(supplied.units.flatMap((d) => d.sections)).toHaveLength(31)
    expect(definitions.flatMap((d) => d.sections)).toHaveLength(36)
    expect(definitions.flatMap((d) => d.words)).toHaveLength(40)
    expect(added.units).toHaveLength(6)
    expect(added.lessons).toHaveLength(6)
    for (const [index, d] of definitions.entries()) {
      const displayed = textFor(index)
      for (const section of d.sections) {
        if (section.parts) continue
        expect(source).toContain(section.english)
        expect(source).toContain(section.chinese)
        expect(displayed).toContain(section.english)
        expect(displayed).toContain(section.chinese)
      }
      for (const word of d.words) expect(displayed).toContain(`${word.english} ${word.chinese}`)
      expect(source).toContain(d.sentencePattern)
      expect(displayed).toContain(d.sentencePattern)
    }
    expect(added.courseContents.every((content) => !content.body.missingSections?.length)).toBe(
      true,
    )
    expect(textFor(5)).not.toContain('上传文本未提供歌谣跟读栏目')
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

  it('merges all five supplied columns with corrected Unit 5 and 6 themes while retaining original passages and graded practice', () => {
    const raw = readFileSync(
      'src/data/curriculum/grade-2/shenzhen-english-lower/supplement-source.md',
      'utf8',
    )
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplement.sourceSha256)
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
    expect(supplement.sections.map((section) => [section.unit, section.kind])).toEqual([
      [2, 'extend'],
      [3, 'extend'],
      [4, 'extend'],
      [5, 'extend'],
      [6, 'chant'],
    ])
    for (const [index, d] of definitions.entries()) {
      const original = supplied.units[index]!
      expect(d.title).toBe(original.title)
      expect(d.words).toEqual(original.words)
      expect(d.questions).toEqual(original.questions)
      expect(d.sentencePattern).toBe(original.sentencePattern)
      expect(d.unitId).toBe(`G2_SHENZHEN_ENGLISH_S2_UNIT_0${d.number}`)
      expect(d.lessonId).toBe(`G2_SHENZHEN_ENGLISH_S2_LESSON_0${d.number}`)
      expect(d.knowledgePointId).toBe(`G2_SHENZHEN_ENGLISH_S2_KP_0${d.number}`)
      expect(d.sections.filter((section) => !section.parts)).toEqual(original.sections)
      expect(d.sections.map((section) => section.kind)).toEqual([
        'listen',
        'chant',
        'story',
        'communicate',
        'think',
        'extend',
      ])
      const content = catalog.contents.find((c) => c.knowledgePointId === d.knowledgePointId)!
      expect(content.currentVersion).toBe(d.number >= 5 ? 3 : d.number === 1 ? 1 : 2)
      expect(content.body.missingSections).toEqual([])
      expect(content.sourceId).toBe(d.number === 1 ? textSource : supplementSource)
      expect(content.body.sourceIds).toEqual(
        d.number === 1 ? [textSource] : [textSource, supplementSource],
      )
      for (const section of d.sections) {
        if (!section.parts) continue
        const displayed = textFor(index)
        expect(displayed).toContain(section.topic)
        for (const part of section.parts) {
          expect(displayed).toContain(part.english)
          expect(normalize(raw)).toContain(normalize(part.english))
          if (part.chinese) {
            expect(displayed).toContain(part.chinese)
            expect(normalize(raw)).toContain(normalize(part.chinese))
          }
          if (part.phonics) expect(displayed).toContain(part.phonics)
        }
      }
    }
    expect(textFor(1)).toContain('hot、pot')
    expect(supplement.sections.find((section) => section.unit === 5)?.parts).toMatchObject([
      { title: 'Good to know', kind: 'dialogue', english: 'Many heroes help others.' },
      { title: 'Think and say', kind: 'task', english: 'Who is a hero around you?' },
    ])
    expect(supplement.sections.find((section) => section.unit === 6)?.parts).toMatchObject([
      {
        title: 'B Listen and chant',
        kind: 'chant',
        english: 'Wolf, wolf, on the farm.\nFarmer, farmer, keep warm.\nBoy, boy, don’t sleep.',
      },
      {
        title: 'C Guess and tick',
        kind: 'task',
        english: 'What do you think is the end of the chant?',
      },
    ])
    expect(textFor(4)).toContain('Many heroes help others.')
    expect(textFor(4)).toContain('Who is a hero around you?')
    expect(textFor(4)).not.toContain('Food I like')
    expect(textFor(4)).not.toContain('porridge')
    expect(textFor(4)).not.toContain('Fish, chicken and soup, please.')
    expect(textFor(5)).toContain('Wolf, wolf, on the farm.')
    expect(textFor(5)).toContain('Farmer, farmer, keep warm.')
    expect(textFor(5)).toContain('Boy, boy, don’t sleep.')
    expect(textFor(5)).toContain('What do you think is the end of the chant?')
    expect(textFor(5)).not.toContain('Animals I like')
    expect(textFor(5)).not.toContain('They are giraffes.')
    expect(textFor(5)).not.toContain('They can drink with their trunks.')
    expect(catalog.contentSources.find((s) => s.id === supplementSource)).toMatchObject({
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      verifiedAt: supplement.updatedAt,
      releaseApprovalId: approval,
    })
    expect(questions).toHaveLength(18)
    expect(questions.every((q) => q.sourceId === practiceSource && q.questionVersion === 1)).toBe(
      true,
    )
    expect(bundles.every((b) => b.learningContent.currentVersion === 1)).toBe(true)
  })

  it('makes the released book, full lesson text, map and formal questions readable in either account without region filtering', async () => {
    const repository = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['english_parent', 'second_english_parent']) {
      selectAccount(account)
      for (const regionId of [undefined, 'region-without-any-mapping']) {
        const available = await curriculumService.resolveAvailableTextbooks({
          gradeId: 'GRADE_2',
          semesterId: 'SEMESTER_LOWER',
          regionId,
        })
        expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([book])
      }
      const map = (await curriculumService.getLearningMapCurriculum(book))!
      const view = buildLearningMapViewModel(map, [], { dataset: 'profile' })
      expect(map.textbook).toMatchObject({ subject: 'ENGLISH', semester: 2 })
      expect(view.islands).toHaveLength(6)
      expect(flattenKnowledgeNodes(view.islands)).toHaveLength(6)
      for (const [index, d] of definitions.entries()) {
        const lesson = (await repository.getByKnowledgePoint(d.knowledgePointId))!
        expect(lesson.contentStatus).toBe('PUBLISHED')
        expect(lesson.blocks.length).toBeGreaterThanOrEqual(d.sections.length + 2)
        const publishedBlocks = lesson.blocks.map((b) => b.block.text)
        if (d.number === 2) {
          expect(publishedBlocks.slice(0, -1).join('\n')).toBe(
            textFor(index).replace(
              'part, art, hot, pot',
              'ar组合例词：part, art\n其他例词（不含ar）：hot, pot',
            ),
          )
          expect(publishedBlocks.at(-1)).toContain('资料核对与项目校正')
        } else expect(publishedBlocks.join('\n')).toBe(textFor(index))
        const assessment = await new QuestionEngineAdapter().loadAssessment(context(d), {
          dataset: 'profile',
        })
        const sync = englishSyncPracticeFor(context(d))!
        expect(assessment.questions).toHaveLength(3 + sync.targetCount)
        expect(assessment.questions.every((q) => q.textbookVersionId === book)).toBe(true)
        expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(3 + sync.autoCount)
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
      expect(segments.length).toBeGreaterThan(20)
      expect(segments.every((s) => !/\p{Script=Han}/u.test(s.text))).toBe(true)
      expect(segments.some((s) => s.section === 'story')).toBe(true)
      expect(segments.some((s) => s.section === 'chant')).toBe(
        d.sections.some((s) => s.kind === 'chant'),
      )
      for (const word of d.words)
        expect(segments.some((s) => s.section === 'words' && s.text === word.english)).toBe(true)
      expect(
        segments.some((s) => /^(Communicate|Think|Extend|Story|Listen|Chant)[:\s]*$/i.test(s.text)),
      ).toBe(false)
      expect(segments.some((s) => /…|_{2,}|\.{3}/.test(s.text))).toBe(false)
      expect(segments.some((s) => /\/(?:ɑː|ʌn|ʌɡ|ʌt)\//.test(s.text))).toBe(false)
      expect(
        segments.some((s) =>
          /^(?:Talk and share|Look and learn|Think and say|Sounds|Letters)$/.test(s.text),
        ),
      ).toBe(false)
      if (d.number === 3)
        expect(segments.some((s) => s.section === 'words' && s.text === 'draw pictures')).toBe(true)
      if (d.number === 5) {
        expect(segments.some((s) => s.text === 'Many heroes help others.')).toBe(true)
        expect(segments.some((s) => s.text === 'Who is a hero around you?')).toBe(true)
        expect(segments.some((s) => s.text === 'porridge')).toBe(false)
      }
      if (d.number === 6) {
        expect(segments.filter((s) => s.section === 'chant').map((s) => s.text)).toEqual([
          'Wolf, wolf, on the farm.',
          'Farmer, farmer, keep warm.',
          'Boy, boy, don’t sleep.',
        ])
        expect(segments.some((s) => s.text === 'They are giraffes.')).toBe(false)
      }
    }
  })

  it.each([2, 3, 4, 5, 6])(
    'renders the complete supplied Unit %s column and notes on its existing lesson page',
    async (number) => {
      const d = definitions.find((d) => d.number === number)!
      const section = supplement.sections.find((section) => section.unit === number)!
      const pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'english-student', displayName: '小岛同学' }
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
        await vi.waitFor(() => expect(wrapper.text()).toContain(section.topic))
        expect(wrapper.text()).toContain(d.title)
        expect(wrapper.text()).toContain('已接入六个单元及补充栏目')
        expect(wrapper.text()).toContain('2025复审版·深圳2026春')
        expect(wrapper.text()).not.toContain('Unit 5、6补充主题与现有目录的差异')
        const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
        for (const part of section.parts) {
          for (const paragraph of part.english.split(/\n\n+/))
            expect(normalize(wrapper.text())).toContain(
              normalize(
                d.number === 2
                  ? paragraph.replace(
                      'part, art, hot, pot',
                      'ar组合例词：part, art\n其他例词（不含ar）：hot, pot',
                    )
                  : paragraph,
              ),
            )
          for (const paragraph of part.chinese.split(/\n\n+/).filter(Boolean))
            expect(normalize(wrapper.text())).toContain(normalize(paragraph))
          if (part.phonics) expect(wrapper.text()).toContain(part.phonics)
        }
        for (const note of d.importNotes) expect(wrapper.text()).toContain(note)
        expect(wrapper.text()).not.toContain('本单元上传文本未提供')
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('grades all 54 choice paths and keeps personal oral responses out of automatic scoring', () => {
    expect(questions).toHaveLength(18)
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
      (q) => q.knowledgePointId.endsWith('03') && q.tags.includes('story'),
    )!
    expect(correct.options!.find((o) => o.content[0]?.text === 'a drama club')?.optionKey).toBe(
      correct.answerRule.ruleType === 'SINGLE_OPTION' ? correct.answerRule.correctOptionKey : '',
    )
  })

  it('provides scoped base practice plus three solvable spelling, matching and sentence training rounds', () => {
    for (const [index, bundle] of bundles.entries()) {
      const input = { bundle, title: definitions[index]!.title, text: textFor(index) }
      const base = createReadingQuest(input)!
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
          bundle: { ...bundle, unitId: definitions[(index + 1) % 6]!.unitId },
        }),
      ).toBeNull()
    }
  })

  it('shows the single English edition already selected and persists it through account reloads', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_2', semesterId: 'SEMESTER_LOWER' })
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
      expect(english.text()).toContain('二年级下册')
      expect(english.text()).toContain('2025复审版·深圳2026春')
      expect(added.textbooks[0]).toMatchObject({
        id: 'G2_SHENZHEN_SHANGHAI_ENGLISH_S2_2024',
        editionYear: '2025复审版',
      })
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

  it('calls the model contract with all six units and retains the correct reviewed source questions', async () => {
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
    for (const d of definitions) {
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
    expect(fetcher).toHaveBeenCalledTimes(6)
  })
})
