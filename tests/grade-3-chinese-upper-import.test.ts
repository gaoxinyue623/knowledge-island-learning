import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G3_PEP_CHINESE_S1_TEXTBOOK_ID as book,
  G3_PEP_CHINESE_CONTENT_SOURCE_ID as textSource,
  G3_PEP_CHINESE_PRACTICE_SOURCE_ID as practiceSource,
  G3_PEP_CHINESE_SUPPLEMENT_SOURCE_ID as supplementSource,
  gradeThreeChineseDefinitions as definitions,
  gradeThreeChineseCurriculum as imported,
  gradeThreeChineseQuestions as questions,
  gradeThreeChineseBundles as bundles,
  gradeThreeChineseReadingOnlyIds as readingOnly,
  gradeThreeChineseSource as supplied,
  gradeThreeChineseSupplement as supplement,
} from '@/data/curriculum/grade-3/chinese-pep-upper'
import {
  G3_CHINESE_IMPORT_APPROVAL as approval,
  G3_CHINESE_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeThreeChineseApproval'
import {
  productionCurriculumData,
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { curriculumService } from '@/services/runtime'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { buildLearningMapViewModel, flattenKnowledgeNodes } from '@/services/learning-map'
import { contentExpansionRepository } from '@/services/content-expansion'
import { createReadingQuest, checkQuestAnswer } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import {
  QuestionEngineAdapter,
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine'
import { validateQuestion } from '@/services/validation/questionValidation'
import { reviewedAiSources, supportsAiPractice } from '@/services/formal-ai/reviewedSources'
import { resolveAiTopic, createFormalGenerator } from '../server/llm/formalGeneration'
import { selectAccount } from '@/services/account/storage'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useStudentStore } from '@/stores/studentStore'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { curriculumProfileRepository } from '@/services/storage/curriculumProfileRepository'
import { RuntimeLearningAgentSource } from '@/services/learning-agent/runtimeSource'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import TextbookConfirmPage from '@/pages/onboarding/TextbookConfirmPage.vue'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import TextbookCard from '@/components/curriculum/TextbookCard.vue'

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
  selectAccount('g3-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('owner supplied grade 3 upper Chinese import', () => {
  it('preserves 26 numbered lessons, two examples and all appendix entries without moving or inventing text', () => {
    const raw = readFileSync('src/data/curriculum/grade-3/chinese-pep-upper/source-text.md', 'utf8')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
    expect(imported.units).toHaveLength(8)
    expect(definitions).toHaveLength(52)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 26 }, (_, i) => i + 1),
    )
    expect(definitions.filter((d) => d.kind === 'example')).toHaveLength(2)
    expect(definitions.filter((d) => d.kind === 'appendix')).toHaveLength(3)
    for (const d of definitions) {
      const content = imported.courseContents.find(
        (c) => c.knowledgePointId === d.knowledgePointId,
      )!
      expect(content.body.suppliedText).toBe(d.text)
      if (d.text) {
        if (d.revision === 1) expect(raw).toContain(d.text)
      } else {
        expect(content.body.sourceScope).toBe('DIRECTORY_WITH_ORIGINAL_GUIDANCE')
        expect(content.body.missingSections).toEqual(['教材栏目正文'])
        expect(content.sourceId).toBe(practiceSource)
        expect(d.questions).toEqual([])
      }
      for (const seed of d.questions) expect(d.text).toContain(seed.evidence)
    }
    const game = definitions.find((d) => d.number === 10)!
    expect(game.sourceNote).toContain('替换此前概要与旧结局')
    expect(
      imported.courseContents.find((c) => c.knowledgePointId === game.knowledgePointId)?.body
        .missingSections,
    ).toEqual([])
    expect(definitions.find((d) => d.number === 9)!.sourceNote).toContain('节选')
    expect(definitions.find((d) => d.number === 11)!.sourceNote).toContain('节选')
    expect(definitions.find((d) => d.key === 'recognition')!.text.match(/参/g)).toHaveLength(2)
    expect(definitions.find((d) => d.key === 'word-table')!.text).toContain('灰雀 郊外')
    expect(definitions.find((d) => d.number === 7)!.text).toContain('㘗㘗')
  })

  it('retains the independently dated approval and passes strict production coverage with 24 explicit reading-only nodes', () => {
    expect(readingOnly).toHaveLength(24)
    expect(
      mvpCurriculumScope.readingOnlyKnowledgePointIds?.filter((id) =>
        id.startsWith('G3_PEP_CHINESE_S1_KP_'),
      ),
    ).toEqual(readingOnly)
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    for (const sourceId of [textSource, practiceSource]) {
      expect(catalog.contentSources.find((s) => s.id === sourceId)).toMatchObject({
        releaseApprovalId: approval,
        verifiedAt: importedAt,
      })
      expect(catalog.sourceReferences.find((s) => s.id === sourceId)?.verifiedBy).toContain('Codex')
    }
    expect(catalog.textbooks.find((b) => b.id === book)).toMatchObject({
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_UPPER',
      editionYear: 2022,
    })
  })

  it('publishes all supplied columns and three endings with traceable sources while retaining confirmed units and node identities', () => {
    const raw = readFileSync(
      'src/data/curriculum/grade-3/chinese-pep-upper/supplement-source.md',
      'utf8',
    )
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplement.sourceSha256)
    expect(supplement.unitPlacementDecision).toBe('MATCH_TITLE_KEEP_EXISTING_UNITS')
    expect(supplement.lessons).toHaveLength(22)
    expect(definitions.filter((d) => d.kind === 'oral')).toHaveLength(4)
    expect(definitions.filter((d) => d.kind === 'writing')).toHaveLength(8)
    expect(definitions.filter((d) => d.kind === 'garden')).toHaveLength(8)
    expect(definitions.filter((d) => d.kind === 'reading-bar')).toHaveLength(1)
    expect(definitions.filter((d) => !d.text)).toEqual([])
    expect(
      imported.courseContents.every((c) => (c.body.missingSections as string[]).length === 0),
    ).toBe(true)
    for (const update of supplement.lessons) {
      if (update.key !== 'writing-3')
        for (const segment of update.providedSegments) expect(raw).toContain(segment)
      const d = definitions.find((d) => d.key === update.key)!
      const content = catalog.contents.find((c) => c.knowledgePointId === d.knowledgePointId)!
      if (!['reading-10', 'writing-3'].includes(update.key))
        expect(content).toMatchObject({
          sourceId: supplementSource,
          currentVersion: 2,
          updatedAt: supplement.updatedAt,
        })
      expect(content.body.suppliedText).toBe(d.text)
      if (d.kind !== 'reading') {
        expect(readingOnly).toContain(d.knowledgePointId)
        expect(questions.some((q) => q.knowledgePointId === d.knowledgePointId)).toBe(false)
        expect(supportsAiPractice(book, d.knowledgePointId)).toBe(false)
      }
    }
    for (const original of supplied.lessons) {
      const d = definitions.find((d) => d.key === original.key)!
      expect(d.unit).toBe(original.unit)
      expect(d.lessonId).toBe(
        `G3_PEP_CHINESE_S1_LESSON_${original.key.toUpperCase().replaceAll('-', '_')}`,
      )
      if (original.key === 'reading-10') {
        expect(
          d.questions.map(({ stem, options, correctIndex }) => ({ stem, options, correctIndex })),
        ).toEqual(
          original.questions.map(({ stem, options, correctIndex }) => ({
            stem,
            options,
            correctIndex,
          })),
        )
        expect(
          imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId),
        ).toMatchObject({ currentVersion: 3 })
      } else expect(d.questions).toEqual(original.questions)
    }
    expect(definitions.find((d) => d.title === '习作：我来编童话')?.unit).toBe(4)
    expect(definitions.find((d) => d.title === '习作：续写故事')?.unit).toBe(3)
    expect(definitions.find((d) => d.kind === 'reading-bar')?.unit).toBe(4)
    expect(definitions.find((d) => d.key === 'writing-5')?.text).toContain('初试身手')
    expect(definitions.some((d) => d.key.includes('trial'))).toBe(false)
    expect(definitions.find((d) => d.key === 'writing-8')?.title).toBe('习作：那次玩得真高兴')
    const dog = definitions.find((d) => d.number === 10)!
    const full = JSON.parse(
      readFileSync(
        resolve('src/data/curriculum/grade-3/chinese-pep-upper/lesson-10-full.json'),
        'utf8',
      ),
    )
    const endings = full.endings as { title: string; text: string }[]
    expect(endings).toHaveLength(3)
    expect(dog.text).not.toContain('此前提供的故事概要')
    expect(dog.text).toBe(full.text)
    expect(dog.revision).toBe(3)
    const archived = readFileSync(
      resolve('src/data/curriculum/grade-3/chinese-pep-upper/lesson-10-full-source.txt'),
      'utf8',
    )
    expect(createHash('sha256').update(archived).digest('hex')).toBe(full.sourceSha256)
    for (const ending of endings) {
      expect(dog.text).toContain(ending.title)
      expect(dog.text).toContain(ending.text)
    }
    const garden8 = definitions.find((d) => d.key === 'garden-8')!
    for (const word of ['默读', '眨（zhǎ）', '陆续', '书籍', '瞪、睹', '仁者爱人', '深于矛戟']) {
      expect(garden8.text).toContain(word)
    }
    expect(questions).toHaveLength(84)
  })

  it('exposes one Chinese edition and a full eight-unit map to both accounts, independent of region', async () => {
    const repository = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const owner of ['g3-parent', 'another-g3-parent']) {
      selectAccount(owner)
      for (const regionId of [undefined, 'unknown-region']) {
        const available = await curriculumService.resolveAvailableTextbooks({
          gradeId: 'GRADE_3',
          semesterId: 'SEMESTER_UPPER',
          regionId,
        })
        expect(available.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
        expect(available.math.availableTextbooks.map((b) => b.id)).toEqual([
          'G3_BNU_MATH_S1_2022_REVISED',
        ])
        expect(available.english.availableTextbooks.map((b) => b.id)).toEqual([
          'G3_SHANGHAI_ENGLISH_S1_2022',
        ])
      }
      const map = (await curriculumService.getLearningMapCurriculum(book))!
      const view = buildLearningMapViewModel(map, [], { dataset: 'profile' })
      expect(view.islands).toHaveLength(8)
      expect(flattenKnowledgeNodes(view.islands)).toHaveLength(52)
      for (const d of definitions) {
        const lesson = (await repository.getByKnowledgePoint(d.knowledgePointId))!
        expect(lesson.contentStatus).toBe('PUBLISHED')
        expect(lesson.blocks.map((b) => b.block.text).join('\n')).toContain(d.sourceNote)
        if (d.text)
          expect(
            lesson.blocks
              .filter((b) => b.block.type === 'TEXT')
              .map((b) => b.block.text)
              .join('\n\n'),
          ).toContain(d.text.replaceAll('**', '').replace(/^#{1,6} /gm, ''))
        expect(
          await contentExpansionRepository.getBundle(d.knowledgePointId, 'profile'),
        ).toMatchObject({ textbookId: book, unitId: d.unitId, lessonId: d.lessonId })
      }
    }
  })

  it('allows confirming the single Chinese, mathematics and English books and restores the account-bound selection', async () => {
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
        stubs: { CurriculumPageFrame: { template: '<main><slot /></main>' } },
      },
    })
    try {
      await flushPromises()
      const chinese = wrapper
        .findAllComponents(TextbookCard)
        .find((c) => c.props('subjectCode') === 'CHINESE')!
      expect(chinese.props('selected')).toBe(true)
      expect(chinese.props('candidateCount')).toBe(1)
      const profile = await store.confirmCurriculum('g3-child')
      expect(profile).toMatchObject({
        gradeId: 'GRADE_3',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G3_BNU_MATH_S1_2022_REVISED',
        englishTextbookVersionId: 'G3_SHANGHAI_ENGLISH_S1_2022',
      })
      expect(store.isComplete).toBe(true)
      setActivePinia(createPinia())
      expect(useCurriculumStore().chineseTextbookVersionId).toBe(book)
      selectAccount('another-g3-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
      selectAccount('g3-parent')
      expect(curriculumProfileRepository.load()?.chineseTextbookVersionId).toBe(book)
    } finally {
      wrapper.unmount()
    }
  })

  it('grades all 252 multiple-choice paths and scopes the 84 authored questions to their own text and grade', async () => {
    expect(questions).toHaveLength(84)
    const adapter = new QuestionEngineAdapter()
    for (const d of definitions) {
      const result = await adapter.loadAssessment(context(d), { dataset: 'profile' })
      expect(result.questions).toHaveLength(d.questions.length)
      expect(reviewedAiSources(book, d.knowledgePointId)).toHaveLength(d.questions.length)
      if (!d.questions.length) {
        expect(result.definition).toBeNull()
        expect(() =>
          resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }),
        ).toThrow()
      } else {
        expect(
          resolveAiTopic({ textbookId: book, knowledgePointId: d.knowledgePointId }).title,
        ).toBe(d.title)
        for (const q of result.questions) {
          expect(validateQuestion(q).issues).toEqual([])
          expect(q).toMatchObject({
            gradeId: 'GRADE_3',
            textbookVersionId: book,
            knowledgePointId: d.knowledgePointId,
            sourceId: practiceSource,
            releaseApprovalId: approval,
          })
          if (q.answerRule.ruleType !== 'SINGLE_OPTION') throw new Error('single choice expected')
          const key = q.answerRule.correctOptionKey
          for (const option of q.options!)
            expect(
              validateQuestionAnswer(q, { type: 'singleChoice', optionId: option.id }).status,
            ).toBe(option.optionKey === key ? 'correct' : 'incorrect')
        }
      }
    }
    const poems = definitions.filter((d) => [4, 20].includes(d.number!))
    expect(poems.map((d) => d.knowledgePointId)[0]).not.toBe(poems[1]!.knowledgePointId)
    expect(poems[0]!.text).toContain('望洞庭')
    expect(poems[1]!.text).toContain('鹿柴')
    expect(supportsAiPractice('G2_PEP_CHINESE_S1_2024_CANDIDATE', poems[0]!.knowledgePointId)).toBe(
      false,
    )
    expect(
      (
        await adapter.loadAssessment(
          { ...context(poems[0]), lessonId: poems[1]!.lessonId },
          { dataset: 'profile' },
        )
      ).definition,
    ).toBeNull()
  })

  it('provides authored comprehension quests only for supplied reading text and rejects mismatched contexts', () => {
    let count = 0
    for (const [index, bundle] of bundles.entries()) {
      const d = definitions[index]!
      const input = { bundle, title: d.title, text: d.text || d.sourceNote }
      const quest = createReadingQuest(input)
      if (!d.questions.length) {
        expect(quest).toBeNull()
        continue
      }
      count++
      expect(quest?.stages).toHaveLength(3)
      expect(quest?.sourceId).toBe(practiceSource)
      for (const stage of quest!.stages) {
        if (stage.kind !== 'question') throw new Error('authored question expected')
        expect(checkQuestAnswer(stage.question, correctAnswerDraft(stage.question))).toBe('correct')
      }
      for (const variant of [0, 1, 2])
        expect(createTrainingQuest({ ...input, variant })?.stages).toHaveLength(9)
      expect(createReadingQuest({ ...input, bundle: { ...bundle, unitId: 'wrong' } })).toBeNull()
      expect(
        createReadingQuest({
          ...input,
          bundle: { ...bundle, textbookId: 'G2_PEP_CHINESE_S1_2024_CANDIDATE' },
        }),
      ).toBeNull()
    }
    expect(count).toBe(28)
  })

  it('restores submitted answers within an account while keeping another account fresh', async () => {
    const store = useQuestionEngineStore()
    await store.loadAssessment(context(), { dataset: 'profile', studentId: 'g3-child' })
    await store.setAnswerDraft(correctAnswerDraft(questions[0]!))
    await store.submitAnswer()
    await store.goNext()
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), {
      dataset: 'profile',
      studentId: 'g3-child',
    })
    expect(useQuestionEngineStore().currentQuestionIndex).toBe(1)
    expect(useQuestionEngineStore().session?.attempts[0]?.result?.status).toBe('correct')
    selectAccount('another-g3-parent')
    setActivePinia(createPinia())
    await useQuestionEngineStore().loadAssessment(context(), {
      dataset: 'profile',
      studentId: 'g3-child',
    })
    expect(useQuestionEngineStore().session?.attempts).toEqual([])
  })

  it('builds a real grade 3 Agent snapshot and plans a released reading lesson without missing subjects', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_3', semesterId: 'SEMESTER_UPPER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    expect(await store.confirmCurriculum('g3-child')).not.toBeNull()
    const snapshot = await new RuntimeLearningAgentSource().load('g3-child', book)
    expect(snapshot.curriculum.grade.id).toBe('GRADE_3')
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(52)
    const prepared = buildAgentContext(
      snapshot,
      'g3-child',
      book,
      '2026-10-08T09:00:00Z',
      DEFAULT_LEARNING_PLANNER_CONFIG,
    )
    const plan = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(prepared.context)
    expect(plan.textbookId).toBe(book)
    expect(plan.targetKnowledgePointId).toBeTruthy()
    expect(plan.recommendedActivity.knowledgePointIds).toContain(plan.targetKnowledgePointId)
    expect(
      definitions.some((definition) => definition.knowledgePointId === plan.targetKnowledgePointId),
    ).toBe(true)
  })

  it.each([1, 9, 10, 'writing-1', 'writing-3', 'garden-5', 'garden-8'])(
    'shows actual text, source limits and open activities on the lesson detail page: %j',
    async (number) => {
      const d =
        typeof number === 'string'
          ? definitions.find((d) => d.key === number)!
          : definitions.find((d) => d.number === number)!
      const pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'g3-child', displayName: '小岛同学' }
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
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
        expect(wrapper.text()).toContain(d.title)
        expect(wrapper.text()).toContain('本册按已导入的目录和文本学习')
        if (!d.questions.length) {
          const excerpt: Record<string, string> = {
            'writing-1': '抓住1-2处印象最深特点',
            'writing-3': '李晓明的爸爸妈妈在外地工作，我们可以……',
            'garden-5': '闻歌始觉有人来',
            'garden-8': '仁者爱人',
          }
          expect(wrapper.text()).toContain(excerpt[d.key]!)
          expect(wrapper.text()).not.toContain('本次仅提供栏目标题')
          expect(wrapper.text()).toContain('项目原创开放活动')
          expect(wrapper.text()).not.toContain('开始教材练习')
        } else expect(wrapper.text()).toContain('开始教材练习')
        if (number === 'writing-3') {
          const images = wrapper
            .findAll('img')
            .filter((img) => img.attributes('src')?.includes('/continue-story/'))
          expect(images).toHaveLength(3)
          for (const [index, image] of images.entries()) {
            const url = `/curriculum/grade-3/chinese-pep-upper/continue-story/scene-${index + 1}.png`
            expect(image.attributes('src')).toBe(url)
            expect(image.attributes('alt')).toContain('AI生成配套素材')
            const bytes = readFileSync(resolve('public', url.slice(1)))
            expect(bytes.subarray(1, 4).toString()).toBe('PNG')
          }
          expect(wrapper.text()).not.toContain('图片暂时不可用')
        }
        if (number === 10) {
          expect(wrapper.text()).not.toContain('让一个马戏团聘请我')
          expect(wrapper.text()).not.toContain('此前提供的故事概要')
          for (const material of [
            '【意大利】罗大里',
            '预测阅读，开放结局',
            '百发百中',
            '会写字：吗、讨',
          ])
            expect(wrapper.text()).toContain(material)
          for (const ending of [
            '还有比这更好听的叫声吗',
            '每天都能喝上一大碗浓汤',
            '我终于找到了我应找的老师',
          ]) {
            expect(wrapper.text()).toContain(ending)
          }
        }
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('passes the model contract for all 28 texts without using title-only nodes or another edition', async () => {
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
    for (const d of definitions.filter((d) => d.questions.length)) {
      const result = await generate({
        profileId: 'g3-child',
        textbookId: book,
        knowledgePointId: d.knowledgePointId,
      })
      expect(result.questions).toHaveLength(3)
      expect(
        result.questions.every(
          (q) =>
            q.sourceQuestion?.textbookVersionId === book &&
            q.sourceQuestion.knowledgePointId === d.knowledgePointId,
        ),
      ).toBe(true)
    }
    expect(fetcher).toHaveBeenCalledTimes(28)
  })
})
