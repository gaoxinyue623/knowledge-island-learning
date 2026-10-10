import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  chineseReadingGroups,
  chineseReadingQuestions,
  chineseReadingSource,
  chineseReadingReview,
  CHINESE_READING_RELEASE_APPROVAL,
} from '@/data/curriculum/production/chineseReadingRelease'
import {
  productionCurriculumIndex as catalog,
  mvpCurriculumScope,
} from '@/data/curriculum/production'
import {
  QuestionEngineAdapter,
  correctAnswerDraft,
  validateQuestionAnswer,
  adaptQuestionToViewModel,
} from '@/services/question-engine'
import { questionSchema } from '@/services/validation/schemas'
import { validateQuestion } from '@/services/validation/questionValidation'
import { reviewedAiSources, supportsAiPractice } from '@/services/formal-ai/reviewedSources'
import {
  isProductionContentSource,
  isProductionSourceReference,
} from '@/services/production-readiness/productionGuard'
import { selectAccount } from '@/services/account/storage'
import {
  useQuestionEngineStore,
  resetQuestionEngineStoreDependencies,
} from '@/stores/questionEngineStore'
import { wrongBookStorage } from '@/services/wrong-book/wrongBookStorage'
import { wrongBookService } from '@/services/wrong-book/wrongBookService'
import QuestionRenderer from '@/components/question-engine/QuestionRenderer.vue'
import type { AssessmentLaunchContext } from '@/types'

const contextFor = (group: (typeof chineseReadingGroups)[number]): AssessmentLaunchContext => ({
  textbookId: group.alignment.textbookId,
  unitId: group.alignment.unitId,
  lessonId: group.alignment.lessonId,
  knowledgePointId: group.alignment.knowledgePointId,
  source: 'lesson_practice',
})
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount(null)
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  resetQuestionEngineStoreDependencies()
})

describe('approved Chinese reading practice release', () => {
  it('publishes exactly the approved draft without changing question content or inheriting old approval', () => {
    const raw = readFileSync(
      'doc/curriculum/drafts/CHINESE_READING_ONLY_QUESTIONS_2026-10-08.json',
      'utf8',
    )
    expect(createHash('sha256').update(raw).digest('hex')).toBe(chineseReadingReview.draftSha256)
    const draft = JSON.parse(raw)
    expect(chineseReadingReview.evidence).toBe('审核通过并接入')
    expect(chineseReadingReview.questionIds).toEqual(
      draft.questions.map((q: { id: string }) => q.id),
    )
    expect(chineseReadingQuestions).toHaveLength(24)
    for (const [i, q] of chineseReadingQuestions.entries()) {
      expect(q).toMatchObject({
        status: 'PUBLISHED',
        verificationStatus: 'REVIEWED',
        needsVerification: false,
        isSample: false,
        releaseApprovalId: CHINESE_READING_RELEASE_APPROVAL,
      })
      const { status, verificationStatus, needsVerification, releaseApprovalId, tags, ...content } =
        q
      void status
      void verificationStatus
      void needsVerification
      void releaseApprovalId
      expect(content).toEqual(
        Object.fromEntries(
          Object.entries(draft.questions[i]).filter(
            ([key]) => !['status', 'verificationStatus', 'needsVerification', 'tags'].includes(key),
          ),
        ),
      )
      expect(tags).not.toContain('requires-human-review')
      expect(questionSchema.safeParse(q).success).toBe(true)
      expect(validateQuestion(q).valid).toBe(true)
      for (const option of q.options) {
        expect(
          validateQuestionAnswer(q, { type: 'singleChoice', optionId: option.id }).status,
        ).toBe(option.optionKey === q.answerRule.correctOptionKey ? 'correct' : 'incorrect')
      }
    }
    expect(
      catalog.questions.filter((q) => chineseReadingReview.questionIds.some((id) => id === q.id)),
    ).toHaveLength(24)
    expect(isProductionContentSource(chineseReadingSource)).toBe(true)
    const reference = catalog.sourceReferences.find((r) => r.id === chineseReadingSource.id)!
    expect(reference).toMatchObject({
      releaseApprovalId: chineseReadingReview.id,
      verifiedAt: chineseReadingReview.reviewedAt,
      verifiedBy: chineseReadingReview.reviewer,
    })
    expect(isProductionSourceReference(reference)).toBe(true)
    expect(
      isProductionContentSource({
        ...chineseReadingSource,
        releaseApprovalId: 'invented-approval',
      }),
    ).toBe(false)
  })

  it.each(chineseReadingGroups)(
    'makes $title available through formal practice and AI to both accounts',
    async (group) => {
      for (const account of ['parent_a', 'parent_b']) {
        selectAccount(account)
        const result = await new QuestionEngineAdapter().loadAssessment(contextFor(group), {
          dataset: 'profile',
        })
        expect(result.issue).toBeUndefined()
        expect(result.definition?.questionIds).toEqual(group.questionIds)
        expect(result.questions).toHaveLength(3)
        expect(result.flags).toMatchObject({ isSample: false, isUnverified: false, isDemo: false })
        expect(
          reviewedAiSources(group.alignment.textbookId, group.alignment.knowledgePointId).map(
            (q) => q.id,
          ),
        ).toEqual(group.questionIds)
      }
    },
  )

  it('covers scored knowledge points and explicitly identifies reading-only activities', () => {
    expect(mvpCurriculumScope.readingOnlyKnowledgePointIds).toHaveLength(242)
    expect(
      mvpCurriculumScope.readingOnlyKnowledgePointIds?.every(
        (id) =>
          [
            'G4_SHANGHAI_ENGLISH_S1_KP_09',
            'G5_SHANGHAI_ENGLISH_S2_KP_13',
            'G5_SHANGHAI_ENGLISH_S2_KP_14',
            'G5_SHANGHAI_ENGLISH_S2_KP_15',
            'G5_SHANGHAI_ENGLISH_S2_KP_16',
            'G5_SHANGHAI_ENGLISH_S2_KP_17',
            'G5_SHANGHAI_ENGLISH_S2_KP_18',
            'G5_SHANGHAI_ENGLISH_S2_KP_19',
            'G5_SHANGHAI_ENGLISH_S2_KP_20',
            'G5_SHANGHAI_ENGLISH_S2_KP_21',
            'G5_SHANGHAI_ENGLISH_S2_KP_22',
            'G5_SHANGHAI_ENGLISH_S2_KP_23',
            'G6_SHANGHAI_ENGLISH_S2_KP_13',
            'G6_SHANGHAI_ENGLISH_S2_KP_14',
            'G6_SHANGHAI_ENGLISH_S2_KP_15',
            'G6_SHANGHAI_ENGLISH_S2_KP_16',
            'G6_SHANGHAI_ENGLISH_S2_KP_17',
            'G6_SHANGHAI_ENGLISH_S2_KP_18',
            'G6_SHANGHAI_ENGLISH_S2_KP_19',
            'G6_SHANGHAI_ENGLISH_S2_KP_20',
            'G6_SHANGHAI_ENGLISH_S2_KP_21',
            'G6_SHANGHAI_ENGLISH_S2_KP_22',
            'G6_SHANGHAI_ENGLISH_S1_KP_07',
            'G6_SHANGHAI_ENGLISH_S1_KP_08',
            'G6_SHANGHAI_ENGLISH_S1_KP_09',
            'G6_SHANGHAI_ENGLISH_S1_KP_10',
            'G6_SHANGHAI_ENGLISH_S1_KP_11',
            'G5_SHANGHAI_ENGLISH_S1_KP_09',
            'G5_SHANGHAI_ENGLISH_S1_KP_10',
            'G5_SHANGHAI_ENGLISH_S1_KP_11',
            'G4_SHANGHAI_ENGLISH_S2_KP_09',
            'G4_SHANGHAI_ENGLISH_S2_KP_10',
            'G4_SHANGHAI_ENGLISH_S2_KP_11',
            'G3_SHANGHAI_ENGLISH_S2_KP_09',
            'G3_SHANGHAI_ENGLISH_S2_KP_10',
            'G3_SHANGHAI_ENGLISH_S2_KP_11',
            'G3_SHANGHAI_ENGLISH_S1_KP_09',
            'G3_SHANGHAI_ENGLISH_S1_KP_10',
          ].includes(id) ||
          id.startsWith('G3_PEP_CHINESE_S1_KP_') ||
          id.startsWith('G3_PEP_CHINESE_S2_KP_APPENDIX_') ||
          id.startsWith('G4_PEP_CHINESE_S1_KP_') ||
          id.startsWith('G4_PEP_CHINESE_S2_KP_') ||
          id.startsWith('G5_PEP_CHINESE_S1_KP_') ||
          id.startsWith('G5_PEP_CHINESE_S2_KP_') ||
          id.startsWith('G6_PEP_CHINESE_S1_KP_') ||
          id.startsWith('G6_PEP_CHINESE_2019_S1_KP_') ||
          id.startsWith('G6_PEP_CHINESE_2019_S2_KP_'),
      ),
    ).toBe(true)
    expect(catalog.knowledgePoints).toHaveLength(1186)
    for (const relation of catalog.lessonKnowledgePointRelations) {
      const lesson = catalog.lessons.find((l) => l.id === relation.lessonId)!
      const unit = catalog.units.find((u) => u.id === lesson.unitId)!
      expect(supportsAiPractice(unit.textbookVersionId, relation.knowledgePointId)).toBe(
        !mvpCurriculumScope.readingOnlyKnowledgePointIds?.includes(relation.knowledgePointId),
      )
    }
  })

  it('renders complete reading materials within each of the nine questions', async () => {
    for (const q of chineseReadingQuestions.slice(15)) {
      const wrapper = mount(QuestionRenderer, {
        props: { question: await adaptQuestionToViewModel(q, undefined) },
      })
      try {
        expect(wrapper.text()).toContain(q.stem[0]!.text!)
        expect(wrapper.text()).toContain(q.stem[1]!.text!)
        expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3)
      } finally {
        wrapper.unmount()
      }
    }
  })

  it('records and resolves a new question in the wrong book while isolating account data', async () => {
    selectAccount('parent_a')
    const context = contextFor(chineseReadingGroups[7])
    const store = useQuestionEngineStore()
    await store.loadAssessment(context, {
      dataset: 'profile',
      studentId: 'student-a',
      sessionScope: 'first',
    })
    const q = store.questions[0]!
    const correct = correctAnswerDraft(q)
    if (correct.type !== 'singleChoice') throw new Error('singleChoice expected')
    const wrong = q.options!.find((o) => o.id !== correct.optionId)!
    await store.setAnswerDraft({ type: 'singleChoice', optionId: wrong.id })
    expect(await store.submitAnswer()).toBe(true)
    expect(wrongBookStorage.load().records).toMatchObject([
      { questionId: q.id, status: 'active', textbookId: context.textbookId },
    ])
    selectAccount('parent_b')
    expect(wrongBookStorage.load().records).toEqual([])
    selectAccount('parent_a')
    await store.loadAssessment(context, {
      dataset: 'profile',
      studentId: 'student-a',
      sessionScope: 'retry',
      reviewQuestionId: q.id,
      initialQuestionId: q.id,
    })
    expect(store.questions.map((q) => q.id)).toEqual([q.id])
    await store.setAnswerDraft(correct)
    expect(await store.submitAnswer()).toBe(true)
    expect(await store.completeAssessment()).toBe(true)
    wrongBookService.resolveRetry('student-a', store.session!, q.id, new Date().toISOString(), {
      dataset: 'profile',
      verificationStatus: 'REVIEWED',
      textbookId: context.textbookId,
    })
    expect(wrongBookStorage.load().records).toMatchObject([
      { questionId: q.id, status: 'resolved' },
    ])
  })
})
