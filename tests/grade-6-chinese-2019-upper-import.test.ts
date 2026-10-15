import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G6_PEP_CHINESE_S1_TEXTBOOK_ID as book2022,
  gradeSixChineseDefinitions as definitions2022,
  gradeSixChineseQuestions as questions2022,
} from '@/data/curriculum/grade-6/chinese-pep-upper'
import {
  G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID as book,
  gradeSixChinese2019Source as supplied,
  gradeSixChinese2019Unit6Correction as unit6Correction,
  G6_CHINESE_2019_UNIT6_CONTENT_SOURCE_ID as unit6Source,
  gradeSixChinese2019Lesson21Supplement as lesson21,
  G6_CHINESE_2019_LESSON21_CONTENT_SOURCE_ID as lesson21Source,
  G6_PEP_CHINESE_2019_REMAINING_PRACTICE_SOURCE_ID as oldPracticeSource,
  gradeSixChinese2019RemainingSource as remaining,
  G6_PEP_CHINESE_2019_REMAINING_CONTENT_SOURCE_ID as remainingSource,
  G6_PEP_CHINESE_2019_CONTENT_SOURCE_ID as originalSource,
  gradeSixChinese2019Definitions as definitions,
  gradeSixChinese2019Curriculum as imported,
  gradeSixChinese2019Questions as questions,
  gradeSixChinese2019Bundles as bundles,
  gradeSixChinese2019ReadingOnlyIds as readingOnly,
} from '@/data/curriculum/grade-6/chinese-pep-upper-2019'
import {
  G6_CHINESE_2019_IMPORT_APPROVAL as approval,
  G6_CHINESE_2019_IMPORTED_AT as importedAt,
} from '@/data/curriculum/production/gradeSixChinese2019Approval'
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
  selectAccount('g6-2019-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 6 2019 upper Chinese all supplied 2019 units alongside the 2022 edition', () => {
  it('preserves both attachments and per-lesson literacy without inventing missing lessons', () => {
    const raw = readFileSync('src/data/curriculum/grade-6/chinese-pep-upper-2019/source-text.md')
    expect(createHash('sha256').update(raw).digest('hex')).toBe(supplied.sourceSha256)
    expect(supplied.sourceSha256).toBe(
      '2ce518a3cf4f0aff30b7bdddc897cb7a2b4e1f520ecc70bfe6166932d9033c42',
    )
    const restRaw = readFileSync(
      'src/data/curriculum/grade-6/chinese-pep-upper-2019/remaining-source-text.md',
    )
    expect(createHash('sha256').update(restRaw).digest('hex')).toBe(remaining.sourceSha256)
    expect(remaining.sourceSha256).toBe(
      'b6f56f0594fd18856a87836f5e32dc37a10ce0e8b2813a24e487457378a95780',
    )
    expect(imported.units.map((u) => u.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(definitions).toHaveLength(54)
    expect(definitions.filter((d) => d.kind === 'reading').map((d) => d.number)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1).filter((n) => n !== 17),
    )
    expect(definitions.filter((d) => d.optional).map((d) => d.number)).toEqual([
      4, 8, 9, 12, 15, 20, 21, 24, 27, 28,
    ])
    expect(readingOnly).toHaveLength(27)
    expect(imported.textbooks[0]).toMatchObject({ editionYear: 2019, createdAt: importedAt })
    expect(imported.textbooks[0]?.versionName).toBe('统编（人教版）语文六年级上册·2019版')
    for (const d of definitions) {
      if (d.key === unit6Correction.lesson.key) expect(d.text).toBe(unit6Correction.lesson.text)
      else if (d.revision === 2) expect(d.text).toBe(lesson21.text)
      else expect((d.isRemaining ? restRaw : raw).toString()).toContain(d.text)
      const c = imported.courseContents.find((c) => c.knowledgePointId === d.knowledgePointId)!
      expect(c.body.suppliedText).toBe(d.text)
      expect(c.sourceId).toBe(
        d.key === unit6Correction.lesson.key
          ? unit6Source
          : d.revision === 2
            ? lesson21Source
            : d.isRemaining
              ? remainingSource
              : originalSource,
      )
      expect(d.questions).toHaveLength(d.kind === 'reading' ? 3 : 0)
      for (const q of d.questions) expect(d.text).toContain(q.evidence)
      if (d.kind === 'reading') {
        expect(d.text).toContain('【会认字】')
        if (d.key !== unit6Correction.lesson.key) expect(d.text).toContain('【词语】')
      }
    }
    const bodies = definitions.map((d) => d.text).join('\n')
    for (const line of (
      raw.toString() +
      '\n' +
      remaining.lessons
        .filter((d) => d.key !== lesson21.key)
        .map((d) => d.text)
        .join('\n')
    )
      .split('\n')
      .filter((line) => line.trim() && !/^(?:#{1,4} |>|---$)/.test(line)))
      expect(bodies).toContain(line)
    expect(bodies).not.toContain('需要我继续往下写吗')
    expect(remaining.missingLessonNumbers).toEqual([21])
    expect(definitions.filter((d) => d.number === 21)).toHaveLength(1)
    expect(bodies).not.toContain('全文整理完毕')
    expect(definitions.filter((d) => d.kind === 'appendix')).toHaveLength(1)
    for (const original of supplied.lessons) {
      expect(definitions.find((d) => d.key === original.key)).toMatchObject(original)
    }
    const reference = definitions.find((d) => d.number === 17)!
    const originalPan = definitions.find((d) => d.number === 15)!
    const refBody = imported.courseContents.find(
      (c) => c.knowledgePointId === reference.knowledgePointId,
    )!.body
    expect(reference.kind).toBe('example')
    expect(refBody.referenceLessonId).toBe(originalPan.lessonId)
    expect(refBody.referenceText).toBe(originalPan.text)
    expect(refBody.blocks).toContainEqual({
      type: 'TEXT',
      text: `例文引用：本版第15课《盼》\n\n${originalPan.text}`,
    })
    expect(definitions.find((d) => d.kind === 'appendix')!.text.split('\n')).toHaveLength(26)
    expect(definitions.find((d) => d.number === 4)?.title).toContain('花之歌')
    expect(definitions.find((d) => d.number === 8)?.title).toContain('灯光')
    expect(definitions.find((d) => d.number === 12)?.text).toContain('太和殿俗称金銮殿')
  })

  it('corrects the same-title lesson to 21 with all supplementary stanzas and literacy, keeping stable lesson identity', () => {
    const transcript = readFileSync(
      'src/data/curriculum/grade-6/chinese-pep-upper-2019/lesson-21-source-text.md',
    )
    expect(createHash('sha256').update(transcript).digest('hex')).toBe(lesson21.sourceSha256)
    expect(transcript.toString()).toContain(lesson21.text)
    const corrected = definitions.find((d) => d.number === 21)!
    expect(corrected).toMatchObject({ key: 'reading-20', unit: 6, optional: true, revision: 2 })
    expect(corrected.lessonId).toBe('G6_PEP_CHINESE_2019_S1_LESSON_READING_20')
    expect(corrected.knowledgePointId).toBe('G6_PEP_CHINESE_2019_S1_KP_READING_20')
    expect(definitions.filter((d) => d.title.includes('三黑和土地'))).toHaveLength(1)
    expect(definitions.find((d) => d.number === 20)?.title).toContain('青山不老')
    expect(corrected.text).toContain('叫麦籽儿睡上')
    expect(corrected.text).toContain('看见自己种的荞麦已经开花')
    expect(corrected.text).toContain('地主骂：蹚坏了他的庄稼')
    expect(corrected.text).toContain('耙 (pá)、蝈 (guō)、蹚 (tāng)')
    expect(corrected.text).not.toContain('放在自己的小罐儿里')
    expect(remaining.lessons.find((d) => d.key === corrected.key)?.text).toContain(
      '放在自己的小罐儿里',
    )
    expect(definitions2022.find((d) => d.title.includes('三黑和土地'))?.revision).toBe(1)
    const content = imported.courseContents.find(
      (c) => c.knowledgePointId === corrected.knowledgePointId,
    )!
    expect(content.currentVersion).toBe(2)
    expect(content.sourceId).toBe(lesson21Source)
  })

  it('uses revised questions and rejects the old lesson bundle in reading and training', () => {
    const corrected = definitions.find((d) => d.number === 21)!
    const bundle = bundles.find((b) => b.knowledgePointId === corrected.knowledgePointId)!
    const input = { bundle, title: corrected.title, text: corrected.text }
    const quest = createReadingQuest(input)!
    expect(quest.id).toBe(`g6-2019-chinese-reading-quest:v2:${corrected.knowledgePointId}`)
    expect(quest.stages.map((s) => s.id)).toEqual(
      [1, 2, 3].map((n) => `${corrected.knowledgePointId}_Q${n}_R2`),
    )
    expect(
      questions
        .filter((q) => q.knowledgePointId === corrected.knowledgePointId)
        .every((q) => q.questionVersion === 2),
    ).toBe(true)
    const oldBundle = structuredClone(bundle)
    oldBundle.learningContent.currentVersion = 1
    oldBundle.learningContent.sourceId = oldPracticeSource
    expect(createReadingQuest({ ...input, bundle: oldBundle })).toBeNull()
    expect(createTrainingQuest({ ...input, bundle: oldBundle })).toBeNull()
    expect(
      reviewedAiSources(book, corrected.knowledgePointId).every((q) => q.id.endsWith('_R2')),
    ).toBe(true)
  })

  it('orders the corrected unit and isolates the new poems from existing question and progress identities', () => {
    const raw = readFileSync(
      'src/data/curriculum/grade-6/chinese-pep-upper-2019/unit-6-correction-source.md',
    )
    expect(createHash('sha256').update(raw).digest('hex')).toBe(unit6Correction.sourceSha256)
    expect(raw.toString()).toContain(unit6Correction.lesson.text)
    const unit = definitions.filter((d) => d.unit === 6 && d.kind === 'reading')
    expect(unit.map((d) => [d.number, d.title])).toEqual([
      [18, '18 古诗三首'],
      [19, '19 只有一个地球'],
      [20, '20* 青山不老（梁衡）'],
      [21, '21* 三黑和土地（苏金伞）'],
    ])
    expect(unit.map((d) => d.key)).toEqual([
      'reading-18-poems',
      'reading-18',
      'reading-19',
      'reading-20',
    ])
    expect(new Set(definitions.filter((d) => d.number).map((d) => d.number)).size).toBe(28)
    for (const d of unit) {
      const lesson = imported.lessons.find((lesson) => lesson.id === d.lessonId)!
      expect(lesson.title).toBe(d.title)
    }
    expect(
      unit.map((d) => imported.lessons.find((lesson) => lesson.id === d.lessonId)!.sortOrder),
    ).toEqual([2, 3, 4, 5])
    for (const d of unit.slice(1, 3)) {
      const original = remaining.lessons.find((original) => original.key === d.key)!
      expect(d.text).toBe(original.text)
      expect(d.questions).toEqual(original.questions)
      expect(d.revision).toBe(1)
    }
    // Options in all old lessons retain their pre-insertion order and answer key.
    const originalDefinitions = [...supplied.lessons, ...remaining.lessons]
    for (const d of definitions.filter((d) => d.key !== unit6Correction.lesson.key)) {
      const oldOrder =
        originalDefinitions
          .filter((entry) => entry.unit === d.unit)
          .findIndex((entry) => entry.key === d.key) + 1
      for (const [i, seed] of d.questions.entries()) {
        const offset = (oldOrder + i) % seed.options.length
        const expectedLabels = [...seed.options.slice(offset), ...seed.options.slice(0, offset)]
        const question = questions.find(
          (q) => q.id === `${d.knowledgePointId}_Q${i + 1}${d.revision === 2 ? '_R2' : ''}`,
        )!
        expect(question.options!.map((o) => o.content[0]!.text)).toEqual(expectedLabels)
        expect(question.answerRule).toMatchObject({
          correctOptionKey: String.fromCharCode(
            65 + ((seed.correctIndex - offset + seed.options.length) % seed.options.length),
          ),
        })
      }
    }
    const poems = unit[0]!
    expect(poems.text).toContain('【会写字】涯、莺、畦、闼 【会认字】簸、郭')
    expect(poems.questions.map((q) => q.stem).join('')).toContain('浪淘沙')
    expect(poems.questions.map((q) => q.stem).join('')).toContain('江南春')
    expect(poems.questions.map((q) => q.stem).join('')).toContain('书湖阴先生壁')
    expect(
      reviewedAiSources(book, poems.knowledgePointId).every(
        (q) => q.knowledgePointId !== unit[1]!.knowledgePointId,
      ),
    ).toBe(true)
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
    ).toHaveLength(81)
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

  it('offers both grade six editions to every account and shows eight readable units and an appendix island', async () => {
    const repo = new MockLearningContentRepository({ records: [...catalog.contents] })
    for (const account of ['g6-2019-a', 'g6-2019-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_6',
        semesterId: 'SEMESTER_UPPER',
        regionId: 'unknown-region',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual(
        expect.arrayContaining([book, book2022]),
      )
      const curriculum = (await curriculumService.getLearningMapCurriculum(book))!
      const map = buildLearningMapViewModel(curriculum, [], { dataset: 'profile' })
      expect(map.islands).toHaveLength(9)
      expect(flattenKnowledgeNodes(map.islands)).toHaveLength(54)
      for (const d of definitions) {
        const content = await repo.getByKnowledgePoint(d.knowledgePointId)
        expect(content?.blocks.map((b) => b.block.text).join('\n\n')).toContain(
          d.text.replaceAll('**', '').replace(/^#{2,4} /gm, ''),
        )
      }
    }
    const wrapper = mount(TextbookCoverage, { props: { gradeId: null, semesterId: null } })
    try {
      await flushPromises()
      const buttons = wrapper
        .findAll('button')
        .filter((b) => b.attributes('aria-label')?.startsWith('六年级'))
      const upper = buttons.find((b) => b.attributes('aria-label')?.startsWith('六年级上册'))!
      const lower = buttons.find((b) => b.attributes('aria-label')?.startsWith('六年级下册'))!
      expect(upper.attributes('disabled')).toBeUndefined()
      expect(lower.attributes('disabled')).toBeUndefined()
      await upper.trigger('click')
      expect(wrapper.emitted('select')).toEqual([
        [{ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' }],
      ])
    } finally {
      wrapper.unmount()
    }
  })

  it('requires a deliberate edition choice and saves the selected 2019 book', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g6-2019-child', displayName: '小岛同学' }
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' })
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
      await vi.waitFor(() => expect(store.resolutionStatus.CHINESE).toBe('NEEDS_CONFIRMATION'))
      expect(store.selectedTextbooks.CHINESE).toBeNull()
      const change = wrapper.findAll('button').find((b) => b.text() === '选择教材')!
      await change.trigger('click')
      await flushPromises()
      const selector = wrapper.findComponent({ name: 'TextbookVersionSelector' })
      expect(selector.text()).toContain('2022版')
      expect(selector.text()).toContain('2019版')
      expect(selector.text()).not.toContain('已接入第1—3单元')
      await selector
        .findAll('button')
        .find((b) => b.text().includes('2019版'))!
        .trigger('click')
      await vi.waitFor(() => expect(store.selectedTextbooks.CHINESE).toBe(book))
      const button = wrapper.findAll('button').find((b) => b.text().includes('确认教材'))!
      expect(button.attributes('disabled')).toBeUndefined()
      await button.trigger('click')
      await flushPromises()
      expect(curriculumProfileRepository.load()).toMatchObject({
        gradeId: 'GRADE_6',
        semesterId: 'SEMESTER_UPPER',
        chineseTextbookVersionId: book,
        mathTextbookVersionId: 'G6_BNU_MATH_S1_2022_USER_OUTLINE',
        englishTextbookVersionId: 'G6_SHANGHAI_ENGLISH_S1_2022',
      })
      selectAccount('another-parent')
      expect(curriculumProfileRepository.load()).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps all 81 graded questions solvable and confines reading/AI/training to supported texts', async () => {
    const adapter = new QuestionEngineAdapter()
    for (const q of questions) {
      expect(validateQuestion(q).issues).toEqual([])
      expect(q.gradeId).toBe('GRADE_6')
      expect(q.semesterId).toBe('SEMESTER_UPPER')
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
          bundle: { ...bundle, textbookId: 'G4_PEP_CHINESE_S1_USER_IMPORTED' },
        }),
      ).toBeNull()
    }
  })

  it('feeds grade-six-2019 Agent context and balanced papers with separate original open-response assessment tasks', async () => {
    const store = useCurriculumStore()
    store.setContext({ gradeId: 'GRADE_6', semesterId: 'SEMESTER_UPPER' })
    await store.resolveTextbooks()
    store.selectTextbook('CHINESE', book)
    await store.confirmCurriculum('g6-2019-child')
    const snapshot = await new RuntimeLearningAgentSource().load('g6-2019-child', book)
    expect(snapshot.curriculum.knowledgePoints).toHaveLength(54)
    const prepared = buildAgentContext(
      snapshot,
      'g6-2019-child',
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
      expect(paper.questions).toHaveLength(54)
      expect(paper.coveredPoints).toBe(54)
    }
  })

  it('keeps 2019 and 2022 IDs, content, questions and existing image correction independent', () => {
    expect(catalog.textbooks.find((b) => b.id === book2022)).toMatchObject({
      editionYear: 2022,
      versionName: '统编（人教版）语文六年级上册·2022版',
    })
    expect(definitions2022).toHaveLength(52)
    const fixed = definitions2022.find((d) => d.number === 22)!
    expect(fixed.revision).toBe(2)
    expect(fixed.text).toContain('在2155年5月17日这一天')
    expect(
      questions2022
        .filter((q) => q.knowledgePointId === fixed.knowledgePointId)
        .every((q) => q.id.endsWith('_R2')),
    ).toBe(true)
    for (const d of definitions) {
      expect(
        definitions2022.some(
          (other) => other.knowledgePointId === d.knowledgePointId || other.lessonId === d.lessonId,
        ),
      ).toBe(false)
      expect(reviewedAiSources(book2022, d.knowledgePointId)).toEqual([])
      expect(() =>
        resolveAiTopic({ textbookId: book2022, knowledgePointId: d.knowledgePointId }),
      ).toThrow()
    }
    expect(definitions.find((d) => d.number === 8)?.title).toContain('灯光')
    expect(definitions2022.find((d) => d.number === 8)?.title).toContain('竹节人')
    expect(definitions.find((d) => d.number === 12)?.text).not.toContain('#### 材料三')
    expect(definitions2022.find((d) => d.number === 10)?.text).toContain('#### 材料三')
  })

  it('keeps same-title answer progress separate when switching editions and resumes the original record', async () => {
    const options = { dataset: 'profile' as const, studentId: 'same-child' }
    const original = definitions2022.find((d) => d.number === 1)!
    const oldContext = {
      ...context(),
      textbookId: book2022,
      unitId: original.unitId,
      lessonId: original.lessonId,
      knowledgePointId: original.knowledgePointId,
    }
    await useQuestionEngineStore().loadAssessment(oldContext, options)
    await useQuestionEngineStore().setAnswerDraft(
      correctAnswerDraft(useQuestionEngineStore().questions[0]!),
    )
    await useQuestionEngineStore().submitAnswer()
    const oldSession = useQuestionEngineStore().session!.id
    await useQuestionEngineStore().loadAssessment(context(), options)
    expect(useQuestionEngineStore().session!.id).not.toBe(oldSession)
    expect(useQuestionEngineStore().session!.attempts).toEqual([])
    await useQuestionEngineStore().loadAssessment(oldContext, options)
    expect(useQuestionEngineStore().session!.id).toBe(oldSession)
    expect(useQuestionEngineStore().session!.attempts).toHaveLength(1)
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
    'reading-04',
    'reading-08',
    'reading-09',
    'reading-12',
    'reading-13',
    'reading-14',
    'reading-15',
    'reading-16',
    'reading-17',
    'reading-18-poems',
    'reading-18',
    'reading-19',
    'reading-20',
    'reading-22',
    'reading-23',
    'reading-24',
    'reading-26',
    'reading-27',
    'reading-28',
    'literacy-words',
    'introduction-1',
    'writing-1',
    'oral-2',
    'garden-3',
  ])('shows supplied content and appropriate practice availability for %s', async (key) => {
    const d = definitions.find((d) => d.key === key)!,
      pinia = createPinia()
    setActivePinia(pinia)
    useStudentStore().profile = { id: 'g6-2019-child', displayName: '小岛同学' }
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
      expect(wrapper.text()).toContain('六年级上册2019版已接入第1—8单元')
      expect(wrapper.text()).toContain(
        '18《古诗三首》、19《只有一个地球》、20《青山不老》、21《三黑和土地》',
      )
      expect(wrapper.text()).not.toContain('附件未提供第21课')
      if (d.number === 17)
        for (const paragraph of definitions.find((item) => item.number === 15)!.text.split(/\n\n+/))
          expect(wrapper.text()).toContain(paragraph)
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
