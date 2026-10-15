import unitThreeSupplement from '@/data/curriculum/grade-5/chinese-pep-lower/unit-3-image-supplement.json'
import honglouCorrection from '@/data/curriculum/grade-5/chinese-pep-lower/honglou-image-correction.json'
import { G5_CHINESE_LOWER_UNIT_3_SOURCE_ID as unitThreeSource } from '@/data/curriculum/grade-5/chinese-pep-lower/unit-3-media'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G5_PEP_CHINESE_S2_TEXTBOOK_ID as book,
  gradeFiveChineseLowerSource as supplied,
  gradeFiveChineseLowerSupplement as supplement,
  gradeFiveChineseLowerReadingBarSupplement as readingBarSupplement,
  G5_CHINESE_LOWER_READING_BAR_SOURCE_ID as readingBarSource,
  G5_CHINESE_LOWER_JUNSHEN_SOURCE_ID as junshenSource,
  G5_CHINESE_LOWER_HONGLOU_SOURCE_ID as honglouSource,
  G5_CHINESE_LOWER_SUPPLEMENT_SOURCE_ID as supplementSource,
  G5_CHINESE_LOWER_SUPPLEMENT_PRACTICE_ID as supplementPractice,
  G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID as originalSource,
  G5_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID as practiceSource,
  gradeFiveChineseLowerDefinitions as definitions,
  gradeFiveChineseLowerCurriculum as imported,
  gradeFiveChineseLowerQuestions as questions,
  gradeFiveChineseLowerBundles as bundles,
  gradeFiveChineseLowerReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-5/chinese-pep-lower'
import {
  G5_CHINESE_LOWER_IMPORT_APPROVAL as approval,
  G5_CHINESE_LOWER_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeFiveChineseLowerApproval'
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
  selectAccount('g5-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 5 lower Chinese eight units and literacy appendices', () => {
  it('按图片校正红楼春趣的跨页正文与阅读链接，并淘汰旧情节题', () => {
    const lesson = definitions.find((d) => d.key === 'reading-08')!
    const mainText = lesson.text.split('### 课文\n\n')[1]!.split('\n\n### 注释')[0]!
    expect(mainText.split('\n\n')).toHaveLength(5)
    expect(mainText.match(/黛玉见风力紧了/g)).toHaveLength(1)
    for (const text of [
      '把昨日赖大娘送的那个大鱼取来',
      '晴雯姑娘昨儿放走了',
      '宝钗也放起个一连七个大雁来',
      '他便恨的摔在地下',
      '有丫头来请吃饭，大家方散',
      '屉 嫣 讳 黛 晦 墩 钗 雯 袭 垫 豁 喇',
      '不可形容的滋味',
      '——选自林庚的《风筝》，有改动',
    ])
      expect(lesson.text).toContain(text)
    expect(lesson.text).not.toContain('教他两个作伴儿')
    expect(lesson.text).not.toContain('宝玉见了，便命丫头们快取他的风筝来')
    const content = catalog.contents.find((c) => c.knowledgePointId === lesson.knowledgePointId)!
    expect(content).toMatchObject({ sourceId: honglouSource, currentVersion: 7 })
    expect(content.body.sourceImages).toHaveLength(4)
    expect(content.body.missingSections).toEqual([])
    expect(
      createHash('sha256')
        .update(
          readFileSync('src/data/curriculum/grade-5/chinese-pep-lower/honglou-image-source.txt'),
        )
        .digest('hex'),
    ).toBe(honglouCorrection.sourceSha256)
    for (const image of honglouCorrection.sourceImages)
      expect(createHash('sha256').update(readFileSync(image.path)).digest('hex')).toBe(image.sha256)
    for (const seed of lesson.questions) expect(lesson.text).toContain(seed.evidence)
    const updatedQuestions = reviewedAiSources(book, lesson.knowledgePointId)
    expect(updatedQuestions).toHaveLength(3)
    expect(updatedQuestions.every((q) => q.questionVersion === 7 && q.id.endsWith('_R7'))).toBe(
      true,
    )
    expect(JSON.stringify(updatedQuestions)).not.toContain('作伴')
    const bundle = bundles.find((b) => b.knowledgePointId === lesson.knowledgePointId)!
    expect(createReadingQuest({ bundle, title: lesson.title, text: lesson.text })?.id).toContain(
      ':v7:',
    )
    expect(
      createReadingQuest({
        bundle: { ...bundle, learningContent: { ...bundle.learningContent, currentVersion: 1 } },
        title: lesson.title,
        text: lesson.text,
      }),
    ).toBeNull()
  })

  it('补齐军神跨页正文、字词、课后练习及丰碑并保留原题', () => {
    const lesson = definitions.find((d) => d.key === 'reading-11')!
    expect(lesson.revision).toBe(5)
    for (const text of [
      '告诉我，你的真名叫什么？',
      '“刘伯承。”',
      '刘伯承友好地把手伸了过去。',
      '会认字',
      '庆 诊 沃 龄 匪 绷 审 剂',
      '再以他的口吻讲讲这个故事',
      '阅读链接：丰碑',
      '在冰雪中为后续部队开辟一条通路',
      '他成了一座晶莹的丰碑',
    ])
      expect(lesson.text).toContain(text)
    expect(lesson.text).not.toContain('川中名将')
    expect(lesson.text).not.toContain('您过奖了')
    expect(lesson.questions).toEqual(
      supplied.lessons.find((d) => d.key === 'reading-11')!.questions,
    )
    const content = imported.courseContents.find(
      (c) => c.knowledgePointId === lesson.knowledgePointId,
    )!
    expect(content.currentVersion).toBe(5)
    expect(content.body.sourceImages).toHaveLength(4)
    expect(content.body.missingSections).toEqual([])
  })

  it('preserves every supplied passage, nested reading and appendix while distinguishing titles from missing text', () => {
    const raw = readFileSync('src/data/curriculum/grade-5/chinese-pep-lower/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
    expect(supplied.sourceSha256).toBe(
      'c62bcc609741ccf1b3a418020e2daca436b50029eb01f761ef14c5001ae3cf04',
    )
    expect(imported.units.map((u) => u.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(imported.units[2]?.title).toContain('遨游汉字王国')
    expect(definitions).toHaveLength(51)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 23 }, (_, i) => i + 1),
    )
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      3, 4, 7, 8, 12, 20, 23,
    ])
    expect(definitions.filter((d) => d.kind === 'example').map((d) => d.title)).toEqual([
      '我的朋友容容',
      '小守门员和他的观众们',
    ])
    expect(definitions.filter((d) => d.kind === 'integrated')).toHaveLength(2)
    expect(readingOnly).toHaveLength(26)
    expect(imported.textbooks[0]).toMatchObject({
      semesterId: 'SEMESTER_LOWER',
      createdAt: importedAt,
      editionYear: 2019,
    })
    expect(imported.textbooks[0]?.versionName).toContain('2019版')
    for (const d of definitions) {
      if (d.revision === 1) expect(raw.toString()).toContain(d.text)
      expect(d.text).not.toContain('接下来我可以生成')
      const c = imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
      expect(c.body.suppliedText).toBe(d.text)
      expect(c.sourceId).toBe(
        d.revision === 7
          ? honglouSource
          : d.revision === 6
            ? supplementSource
            : d.revision === 5
              ? junshenSource
              : d.revision === 4
                ? unitThreeSource
                : d.revision === 3
                  ? readingBarSource
                  : d.revision === 2
                    ? supplementSource
                    : d.text
                      ? originalSource
                      : practiceSource,
      )
      expect(d.questions).toHaveLength(['reading', 'example'].includes(d.kind) ? 3 : 0)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
      if (!d.text) {
        expect(c.body.missingSections).toEqual(['教材正文（附件仅提供标题）'])
        expect(d.sourceNote).toContain('未提供教材正文')
        expect(JSON.stringify(c.body.blocks)).toContain('项目原创学习提示')
        expect(c.body.sourceScope).toBe('DIRECTORY_WITH_ORIGINAL_GUIDANCE')
      }
    }
    for (const original of supplied.lessons) {
      const active = definitions.find((d) => d.key === original.key)!
      if (
        original.key !== 'reading-08' &&
        original.key !== 'reading-11' &&
        !supplement.lessons.some((d) => d.key === original.key) &&
        !readingBarSupplement.lessons.some((d) => d.key === original.key)
      )
        expect(active.text).toBe(original.text)
      if (original.kind === 'integrated')
        expect(active.text).toBe(
          unitThreeSupplement.lessons.find((lesson) => lesson.key === original.key)!.text,
        )
    }
    const people = definitions.find((d) => d.number === 13)!
    for (const title of ['摔跤', '他像一棵挺脱的树', '两茎灯草'])
      expect(people.text).toContain('#### ' + title)
    const pyramids = definitions.find((d) => d.number === 20)!
    expect(pyramids.text).toContain('#### 金字塔夕照')
    expect(pyramids.text).toContain('#### 不可思议的金字塔')
    expect(definitions.find((d) => d.number === 8)?.sourceNote).toContain('已修正重复段落')
    expect(definitions.find((d) => d.number === 11)?.sourceNote).toContain('补齐刘伯承姓名揭示对话')
    expect(definitions.find((d) => d.key === 'integrated-love')?.sourceNote).toContain(
      '完整转录并提取原图',
    )
    expect(
      definitions.find((d) => d.key === 'literacy-recognition')?.text.split(/\s+/),
    ).toHaveLength(151)
    expect(definitions.find((d) => d.key === 'literacy-writing')?.text.split(/\s+/)).toHaveLength(
      100,
    )
    const words = definitions.find((d) => d.key === 'literacy-words')!
    expect(words.text.match(/^## 第.+单元$/gm)).toHaveLength(7)
    expect(words.text).not.toContain('第三单元')
  })

  it('merges the confirmed supplement without duplicating oral activities or discarding the original readings', () => {
    const raw = readFileSync('src/data/curriculum/grade-5/chinese-pep-lower/supplement-source.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplement.sourceSha256)
    expect(supplement.sourceSha256).toBe(
      'fe266c8d495040192d3cf0a0225be794d9483d9f61aca26b429e46dd4d265423',
    )
    const expected = [
      [1, '口语交际：走进他们的童年岁月'],
      [2, '口语交际：怎么表演课本剧'],
      [4, '口语交际：我们都来讲笑话'],
      [7, '口语交际：我是小小讲解员'],
      [8, '口语交际：即兴发言'],
    ]
    expect(definitions.filter((d) => d.kind === 'oral').map((d) => [d.unit, d.title])).toEqual(
      expected,
    )
    expect(definitions.filter((d) => d.text === '').map((d) => d.key)).toEqual([])
    expect(definitions.filter((d) => d.unit === 5).map((d) => d.key)).toEqual([
      'reading-13',
      'reading-14',
      'exchange-5',
      'try-5',
      'example-rongrong',
      'example-goalkeeper',
      'writing-5',
    ])
    const source = raw.toString()
    for (const d of supplement.lessons) {
      const active = definitions.find((x) => x.key === d.key)!
      if (d.kind !== 'integrated') expect(active.text).toBe(d.text)
      const provided = d.kind === 'integrated' ? d.text.split('\n\n#### 阅读材料')[0]! : d.text
      expect(source).toContain(provided)
      expect(active.revision).toBe(d.key === 'try-5' ? 6 : d.kind === 'integrated' ? 4 : 2)
      expect(active.sourceNote).not.toContain('未提供教材正文')
      const content = imported.courseContents.find(
        (c) => c.knowledgePointId === active.knowledgePointId,
      )!
      expect(content.currentVersion).toBe(d.key === 'try-5' ? 6 : d.kind === 'integrated' ? 4 : 2)
      expect(content.body.missingSections).toEqual([])
      expect(content.body.sourceScope).toBe(
        d.kind === 'integrated' ? 'USER_PROVIDED_IMAGE_TRANSCRIPTION' : 'USER_PROVIDED_TEXT',
      )
      if (d.kind === 'integrated') expect(content.body.sourceIds).toEqual([unitThreeSource])
    }
    expect(definitions.find((d) => d.key === 'oral-8')?.lessonId).toBe(
      'G5_PEP_CHINESE_S2_LESSON_ORAL_8',
    )
    expect(definitions.find((d) => d.key === 'oral-8')?.unitId).toBe('G5_PEP_CHINESE_S2_UNIT_04')
    expect(definitions.find((d) => d.key === 'try-5')?.sourceNote).toContain('已附AI生成')
    const classroom = imported.courseContents.find(
      (c) => c.knowledgePointId === 'G5_PEP_CHINESE_S2_KP_TRY_5',
    )!
    expect(classroom.contentFormat).toBe('RICH_TEXT')
    expect(classroom.body.blocks).toContainEqual(
      expect.objectContaining({
        type: 'IMAGE',
        mediaAssetId: 'G5_PEP_CHINESE_S2_CLASSROOM_AI_ILLUSTRATION_1',
      }),
    )
    expect(
      catalog.mediaAssets.find((m) => m.id === 'G5_PEP_CHINESE_S2_CLASSROOM_AI_ILLUSTRATION_1')
        ?.url,
    ).toBe('/curriculum/grade-5/chinese-pep-lower/classroom-observation.png')
    expect(definitions.find((d) => d.key === 'example-rongrong')?.text).toContain('（教材旁批：')
  })

  it('publishes both reading-bar pages and reading tips in the original node with image provenance and the confirmed 2019 edition', () => {
    const directory = 'src/data/curriculum/grade-5/chinese-pep-lower'
    const raw = readFileSync(`${directory}/reading-bar-source.md`)
    expect(createHash('sha256').update(raw).digest('hex')).toBe(readingBarSupplement.sourceSha256)
    expect(readingBarSupplement.images).toHaveLength(2)
    for (const image of readingBarSupplement.images)
      expect(
        createHash('sha256')
          .update(readFileSync(`${directory}/${image.file}`))
          .digest('hex'),
      ).toBe(image.sha256)
    const original = supplied.lessons.find((d) => d.key === 'reading-bar-2')!
    const d = definitions.find((d) => d.key === original.key)!
    expect(original.text).toBe('')
    expect(d.unit).toBe(original.unit)
    expect(d.unitId).toBe('G5_PEP_CHINESE_S2_UNIT_02')
    expect(d.lessonId).toBe('G5_PEP_CHINESE_S2_LESSON_READING_BAR_2')
    expect(d.knowledgePointId).toBe('G5_PEP_CHINESE_S2_KP_READING_BAR_2')
    expect(d.revision).toBe(3)
    expect(d.text).toBe(readingBarSupplement.lessons[0]!.text)
    expect(raw.toString()).toContain(d.text)
    for (const section of [
      '诸葛亮足智多谋，李逵鲁莽刚猛',
      '你读过吗',
      '猪八戒助力败魔王，孙行者三调芭蕉扇',
      '淬下山崖',
      '也些些些',
      '变作一只赖象',
      '——选自明代吴承恩的《西游记》第六十一回',
      '作者用生动的语言将这激烈的场面描写得动人心魄',
      '古代长篇小说多是章回体',
      '我很喜欢读回目',
      '相信你可以读更多',
      '煮酒论英雄、火烧赤壁、千里走单骑',
      '鲁智深倒拔垂杨柳',
      '命运沉浮、人情冷暖。',
    ])
      expect(d.text).toContain(section)
    const content = catalog.contents.find((c) => c.knowledgePointId === d.knowledgePointId)!
    expect(content).toMatchObject({
      sourceId: readingBarSource,
      contentType: 'TEXTBOOK',
      currentVersion: 3,
      updatedAt: readingBarSupplement.updatedAt,
      body: {
        sourceScope: 'USER_PROVIDED_IMAGE_TRANSCRIPTION',
        sourceIds: [readingBarSource],
        suppliedText: d.text,
        missingSections: [],
      },
    })
    expect(JSON.stringify(content.body)).not.toContain('未提供教材正文')
    expect(catalog.textbooks.find((t) => t.id === book)).toMatchObject({
      editionYear: 2019,
      createdAt: importedAt,
      updatedAt: readingBarSupplement.updatedAt,
    })
    expect(catalog.contentSources.find((s) => s.id === readingBarSource)?.sourceVersion).toBe(
      `SHA256:${readingBarSupplement.sourceSha256}`,
    )
    expect(d.questions).toEqual([])
    expect(questions).toHaveLength(75)
    expect(readingOnly).toContain(d.knowledgePointId)
    expect(reviewedAiSources(book, d.knowledgePointId)).toEqual([])
    const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
    expect(bundle.learningContent.currentVersion).toBe(3)
    expect(createReadingQuest({ bundle, title: d.title, text: d.text })).toBeNull()
  })

  it('activates six source-bound example questions with new quest versions and rejects stale placeholder bundles', () => {
    for (const key of ['example-rongrong', 'example-goalkeeper']) {
      const d = definitions.find((d) => d.key === key)!
      const bundle = bundles.find((b) => b.knowledgePointId === d.knowledgePointId)!
      const input = { bundle, title: d.title, text: d.text }
      expect(createReadingQuest(input)?.id).toContain(':v2:')
      expect(
        createReadingQuest({
          ...input,
          bundle: {
            ...bundle,
            learningContent: {
              ...bundle.learningContent,
              sourceId: practiceSource,
              currentVersion: 1,
            },
          },
        }),
      ).toBeNull()
      const qs = reviewedAiSources(book, d.knowledgePointId)
      expect(qs).toHaveLength(3)
      expect(
        qs.every(
          (q) =>
            q.sourceId === supplementPractice && q.questionVersion === 2 && q.id.endsWith('_R2'),
        ),
      ).toBe(true)
      expect(bundle.learningContent.blocks[0]?.block.text).not.toContain('未提供例文正文')
    }
    for (const d of definitions.filter((d) => d.kind === 'reading')) {
      expect(d.revision).toBe(d.key === 'reading-08' ? 7 : d.key === 'reading-11' ? 5 : 1)
      const qs = questions.filter((q) => q.knowledgePointId === d.knowledgePointId)
      expect(
        qs.every(
          (q) =>
            q.questionVersion === (d.key === 'reading-08' ? 7 : 1) &&
            q.sourceId === practiceSource &&
            !q.id.endsWith('_R2'),
        ),
      ).toBe(true)
    }
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
    ).toHaveLength(75)
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

  it('offers grade five lower to every account and shows eight readable units and an appendix island', async () => {
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['g5-a', 'g5-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_5',
        semesterId: 'SEMESTER_LOWER',
        regionId: 'unknown-region',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
      const curriculum = (await curriculumService.getLearningMapCurriculum(book))!
      const map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
      expect(map.islands).toHaveLength(9)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(51)
      for (const d of definitions) {
        const content = await repo.getByKnowledgePoint(d.knowledgePointId)
        expect(
          content?.blocks
            .filter((b) => b.block.type === 'TEXT')
            .map((b) => b.block.text)
            .join('\n\n'),
        ).toContain(d.text.replaceAll('**', '').replace(/^#{2,4} /gm, ''))
      }
    }
    const wrapper = mount(TextbookCoverage, { props: { gradeId: null, semesterId: null } })
    try {
      await flushPromises()
      const buttons = wrapper
        .findAll('button')
        .filter((b) => b.attributes('aria-label')?.startsWith('五年级'))
      const upper = buttons.find((b) => b.attributes('aria-label')?.startsWith('五年级上册'))!
      const lower = buttons.find((b) => b.attributes('aria-label')?.startsWith('五年级下册'))!
      expect(upper.attributes('disabled')).toBeUndefined()
      expect(lower.attributes('disabled')).toBeUndefined()
      await lower.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_5', semesterId: 'SEMESTER_LOWER' }],
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('automatically confirms the sole Chinese book without requiring unimported subjects', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g5-child', displayName: '小岛同学' }
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_5', semesterId: 'SEMESTER_LOWER' })
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
        gradeId: 'GRADE_5',
        semesterId: 'SEMESTER_LOWER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G5_BNU_MATH_S2_2013_USER_OUTLINE',
        englishTextbookVersionId: 'G5_SHANGHAI_ENGLISH_S2_USER_TEXT',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps all 75 graded questions solvable and confines reading/AI/training to supported texts', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.gradeId).toBe('GRADE_5')
      expect(q.semesterId).toBe('SEMESTER_LOWER')
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

  it('feeds grade-five Agent context and balanced papers with separate original open-response assessment tasks', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_5', semesterId: 'SEMESTER_LOWER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g5-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g5-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(51)
    const prepared = buildAgentContext(
      snapshot,
      'g5-child',
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
      expect(paper.questions).toHaveLength(51)
      expect(paper.coveredPoints).toBe(51)
    }
  })

  it('keeps upper and lower grade five and same-title passages separate', async () => {
    const upperId = 'G5_PEP_CHINESE_S1_USER_IMPORTED'
    const upper = await curriculumService.getLearningMapCurriculum(upperId)
    expect(upper?.knowledgePoints).toHaveLength(57)
    const lowerIds = new Set(definitions.map((d) => d.knowledgePointId))
    expect(upper?.knowledgePoints.every((d) => !lowerIds.has(d.id))).toBe(true)
    const example = definitions.find((d) => d.number === 20)!
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
    'reading-08',
    'reading-11',
    'reading-04',
    'reading-07',
    'reading-21',
    'reading-13',
    'reading-23',
    'exchange-5',
    'try-5',
    'oral-8',
    'oral-7',
    'oral-improvised-8',
    'example-rongrong',
    'example-goalkeeper',
    'oral-1',
    'writing-5',
    'integrated-fun',
    'integrated-love',
    'garden-7',
    'reading-bar-2',
    'literacy-recognition',
    'literacy-writing',
    'literacy-words',
  ])('shows supplied content and appropriate practice availability for %s', async (key) => {
    const d = definitions.find((d) => d.key === key)!,
      pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g5-child', displayName: '小岛同学' }
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
      expect(wrapper.text()).toContain('2019版五年级下册已接入附件提供的八个单元')
      if (d.kind === 'integrated') {
        const assets = unitThreeSupplement.assets.filter((asset) => asset.ownerKey === key)
        const images = wrapper
          .findAll('img')
          .filter((image) => image.attributes('src')?.includes('/unit-3/'))
        expect(images).toHaveLength(assets.length)
        for (const asset of assets) {
          expect(
            images.some(
              (image) =>
                image.attributes('src') === asset.url && image.attributes('alt') === asset.title,
            ),
          ).toBe(true)
          expect(
            createHash('sha256')
              .update(readFileSync(`public${asset.url}`))
              .digest('hex'),
          ).toBe(asset.sha256)
        }
        const content = catalog.contents.find(
          (item) => item.knowledgePointId === d.knowledgePointId,
        )!
        expect(content.currentVersion).toBe(4)
        expect(content.body.sourceImages).toHaveLength(key === 'integrated-fun' ? 4 : 6)
        if (key === 'integrated-love') {
          for (const title of [
            '南朝智永楷书',
            '唐代怀素草书',
            '明代文征明行草',
            '2018年',
            '研究报告旁批',
          ])
            expect(wrapper.text()).toContain(title)
          expect(wrapper.text()).not.toContain('王羲之《兰亭集序》')
          expect(wrapper.text()).not.toContain('颜真卿《多宝塔碑》')
        } else {
          expect(wrapper.text()).toContain('传说东汉时的杨修')
          expect(wrapper.text()).toContain('梁山泊的军师')
          expect(wrapper.text()).not.toContain('孔夫子搬家')
        }
      }
      if (key === 'reading-bar-2') {
        expect(wrapper.text()).toContain('快乐读书吧已按两张教材图片补齐')
        expect(wrapper.text()).not.toContain('教材正文（附件仅提供标题）')
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
