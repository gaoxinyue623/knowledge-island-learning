import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import QuestionContentRenderer from '@/components/question-engine/QuestionContentRenderer.vue'
import QuestionRenderer from '@/components/question-engine/QuestionRenderer.vue'
import {
  demoAssessmentContext,
  demoQuestions,
  demoQuestionKnowledgePoints,
} from '@/data/question-engine'
import {
  createQuestionSession,
  adaptQuestionToViewModel,
  buildAssessmentResultSummary,
  QuestionEngineAdapter,
  questionRepository,
  MockQuestionRepository,
  correctAnswerDraft,
  validateQuestionAnswer,
} from '@/services/question-engine'
import {
  createQuestionSessionStorage,
  normalizeQuestionSession,
  type QuestionSessionStorageLike,
} from '@/services/question-engine/questionSessionStorage'
import {
  configureQuestionEngineStore,
  resetQuestionEngineStoreDependencies,
  useQuestionEngineStore,
} from '@/stores/questionEngineStore'
import type { AssessmentDefinition, Question, QuestionSession } from '@/types'

function createMemoryStorage(): QuestionSessionStorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

const definition: AssessmentDefinition = {
  id: 'ASSESSMENT_TEST',
  knowledgePointId: demoAssessmentContext.knowledgePointId,
  questionIds: [demoQuestions[0].id, demoQuestions[1].id],
  mode: 'practice',
}

afterEach(() => {
  resetQuestionEngineStoreDependencies()
})

describe('Question domain and repository', () => {
  it('keeps a stable demo assessment order and a multi-knowledge-point relation', async () => {
    const result = await questionRepository.getAssessmentDefinition(demoAssessmentContext, 'demo')

    expect(result?.questionIds).toEqual(demoQuestions.map((question) => question.id))
    expect(
      demoQuestionKnowledgePoints.filter(
        (mapping) => mapping.questionId === 'DEMO_QUESTION_CALCULATION',
      ),
    ).toHaveLength(2)
  })

  it('exposes the calculation question through primary and secondary mappings', async () => {
    const mappings = await questionRepository.getQuestionKnowledgePoints(
      'DEMO_QUESTION_CALCULATION',
      'demo',
    )
    expect(mappings.map((mapping) => mapping.knowledgePointId)).toEqual([
      'DEMO_KP_01',
      'DEMO_KP_02',
    ])
    expect(mappings.map((mapping) => mapping.relationType)).toEqual(['PRIMARY', 'SECONDARY'])
  })

  it('uses QuestionKnowledgePoint as the profile knowledge-point authority', async () => {
    const legacyMismatchQuestion: Question = {
      ...demoQuestions[0],
      id: 'PROFILE_LEGACY_MISMATCH',
      knowledgePointId: 'LEGACY_OTHER_KP',
      textbookVersionId: demoAssessmentContext.textbookId,
    }
    const repository = new MockQuestionRepository({
      profileQuestions: [legacyMismatchQuestion],
      profileQuestionKnowledgePoints: [
        {
          ...demoQuestionKnowledgePoints[0],
          id: 'PROFILE_RELATION_MISMATCH',
          questionId: legacyMismatchQuestion.id,
          knowledgePointId: demoAssessmentContext.knowledgePointId,
        },
      ],
    })

    const result = await repository.getAssessmentDefinition(demoAssessmentContext, 'profile')
    expect(result?.questionIds).toEqual([legacyMismatchQuestion.id])
  })

  it('does not invent an assessment for a different launch context', async () => {
    const result = await questionRepository.getAssessmentDefinition(
      { ...demoAssessmentContext, lessonId: 'OTHER_LESSON' },
      'demo',
    )
    expect(result).toBeNull()
  })
})

describe('AssessmentLaunchContext and QuestionEngineAdapter', () => {
  it('validates the demo context and builds a flagged assessment', async () => {
    const adapter = new QuestionEngineAdapter()
    const result = await adapter.loadAssessment(demoAssessmentContext, { dataset: 'demo' })

    expect(result.definition?.questionIds).toHaveLength(6)
    expect(result.flags).toEqual({ isSample: true, isUnverified: false, isDemo: true })
    expect(result.questions.every((question) => question.isSample)).toBe(true)
  })

  it('returns INVALID_CONTEXT instead of throwing for an invalid launch context', async () => {
    const adapter = new QuestionEngineAdapter()
    const result = await adapter.loadAssessment(
      { ...demoAssessmentContext, knowledgePointId: 'MISSING_KP' },
      { dataset: 'demo' },
    )

    expect(result.issue).toBe('INVALID_CONTEXT')
    expect(result.definition).toBeNull()
  })

  it('keeps sample questions out when the production question guard is closed', async () => {
    const adapter = new QuestionEngineAdapter({
      accessPolicy: {
        allowSampleCurriculum: false,
        allowUnreviewedCurriculum: false,
        allowSampleQuestions: false,
        allowUnreviewedQuestions: false,
      },
    })
    const result = await adapter.loadAssessment(demoAssessmentContext, { dataset: 'demo' })
    expect(result.issue).toBe('QUESTION_NOT_AVAILABLE')
    expect(result.questions).toEqual([])
  })
})

describe('questionSessionStorage', () => {
  it('persists multiple sessions and safely clears corruption', () => {
    const storage = createMemoryStorage()
    const repository = createQuestionSessionStorage(storage)
    const first = createQuestionSession(demoAssessmentContext, definition, 'student-a')
    const second = createQuestionSession(demoAssessmentContext, definition, 'student-b')
    repository.save(first)
    repository.save(second)

    expect(repository.loadAll()).toHaveLength(2)
    expect(repository.get(first.id)?.assessmentId).toBe(definition.id)

    storage.setItem('knowledge-island.question-sessions', '{broken')
    expect(repository.loadAll()).toEqual([])
    expect(repository.getLastWarning()).toContain('损坏')
    expect(storage.getItem('knowledge-island.question-sessions')).toBeNull()
  })

  it('removes orphan attempts and clamps the cursor without changing the stable ID', () => {
    const session: QuestionSession = {
      ...createQuestionSession(demoAssessmentContext, definition, 'student-a'),
      currentQuestionIndex: 99,
      status: 'in_progress',
      attempts: [
        {
          questionId: definition.questionIds[0],
          answer: { type: 'singleChoice' },
          submitted: false,
        },
        {
          questionId: 'ORPHAN_QUESTION',
          answer: { type: 'shortAnswer', value: 'orphan' },
          submitted: true,
        },
      ],
    }
    const normalized = normalizeQuestionSession(session, [definition.questionIds[0]])
    expect(normalized.id).toBe(session.id)
    expect(normalized.currentQuestionIndex).toBe(0)
    expect(normalized.attempts.map((attempt) => attempt.questionId)).toEqual([
      definition.questionIds[0],
    ])
  })
})

describe('questionEngineStore', () => {
  it('loads, resumes draft input, submits and persists a result', async () => {
    setActivePinia(createPinia())
    const storage = createQuestionSessionStorage(createMemoryStorage())
    const adapter = new QuestionEngineAdapter({ questionRepository: new MockQuestionRepository() })
    configureQuestionEngineStore({ adapter, sessionStorage: storage })
    const store = useQuestionEngineStore()

    await store.loadAssessment(demoAssessmentContext, {
      dataset: 'demo',
      studentId: 'student-test',
    })
    const optionId = store.currentQuestion?.options[0]?.id
    expect(optionId).toBeTruthy()
    expect(store.canSubmit).toBe(false)

    await store.setAnswerDraft({ type: 'singleChoice', optionId })
    expect(store.canSubmit).toBe(true)
    expect(store.session?.attempts[0]?.submitted).toBe(false)
    await store.submitAnswer()

    expect(store.currentQuestion?.submitted).toBe(true)
    expect(store.currentQuestion?.result?.status).toBe('correct')
    expect(store.session?.attempts[0]?.result?.score).toBe(1)
  })
})

describe('QuestionRenderer', () => {
  it('renders the six supported question types with semantic inputs', async () => {
    const expectedControls: Record<string, { selector: string; count: number }> = {
      singleChoice: { selector: 'input[type="radio"]', count: 3 },
      multipleChoice: { selector: 'input[type="checkbox"]', count: 4 },
      trueFalse: { selector: 'input[type="radio"]', count: 2 },
      fillBlank: { selector: 'input[type="text"]', count: 1 },
      calculation: { selector: 'input[type="text"]', count: 1 },
      shortAnswer: { selector: 'textarea', count: 1 },
    }

    for (const question of demoQuestions) {
      const viewModel = await adaptQuestionToViewModel(question, undefined)
      const wrapper = mount(QuestionRenderer, { props: { question: viewModel } })
      const expected = expectedControls[question.questionType]

      expect(wrapper.text()).toContain(question.stem[0]?.text ?? '')
      expect(wrapper.findAll(expected.selector)).toHaveLength(expected.count)
      expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()
      wrapper.unmount()
    }
  })

  it('locks submitted answers and exposes feedback without hiding the explanation', async () => {
    const question = demoQuestions[0]
    const answer = correctAnswerDraft(question)
    const viewModel = await adaptQuestionToViewModel(question, {
      questionId: question.id,
      answer,
      submitted: true,
      result: validateQuestionAnswer(question, answer),
      submittedAt: '2026-09-02T00:00:00+08:00',
      questionVersion: question.questionVersion,
    })
    const wrapper = mount(QuestionRenderer, { props: { question: viewModel } })

    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('input:disabled')).toHaveLength(3)
    expect(wrapper.get('[role="status"]').text()).toContain('回答正确')
    expect(wrapper.text()).toContain('参考答案')
    expect(wrapper.text()).toContain('把已知条件整理清楚')
  })

  it('renders structured text, formulas and media fallback content safely', () => {
    const wrapper = mount(QuestionContentRenderer, {
      props: {
        blocks: [
          { type: 'TEXT', text: '<不应被当作 HTML>' },
          { type: 'FORMULA', text: '2 + 3 = 5' },
          { type: 'IMAGE', mediaAssetId: 'MISSING_IMAGE', altText: '题目示意图' },
        ],
      },
    })

    expect(wrapper.find('.question-content__text').text()).toContain('<不应被当作 HTML>')
    expect(wrapper.get('.question-content__formula code').text()).toBe('2 + 3 = 5')
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('题目示意图')
    expect(wrapper.html()).toContain('&lt;不应被当作 HTML&gt;')
    expect(wrapper.html()).not.toContain('<script')
  })
})

describe('deterministic answer validation and assessment summaries', () => {
  it('validates exact choice sets, accepted fill answers and calculation normalization', () => {
    const singleChoice = demoQuestions[0]
    const multipleChoice = demoQuestions[1]
    const fillBlank = demoQuestions[3]
    const calculation = demoQuestions[4]

    expect(validateQuestionAnswer(singleChoice, correctAnswerDraft(singleChoice)).status).toBe(
      'correct',
    )
    expect(
      validateQuestionAnswer(singleChoice, {
        type: 'singleChoice',
        optionId: singleChoice.options?.[1]?.id,
      }).status,
    ).toBe('incorrect')

    const correctMultipleIds =
      multipleChoice.options
        ?.filter((option) => ['A', 'C'].includes(option.optionKey))
        .map((option) => option.id)
        .reverse() ?? []
    expect(
      validateQuestionAnswer(multipleChoice, {
        type: 'multipleChoice',
        optionIds: correctMultipleIds,
      }).status,
    ).toBe('correct')

    expect(validateQuestionAnswer(fillBlank, { type: 'fillBlank', values: ['六'] }).status).toBe(
      'correct',
    )
    expect(validateQuestionAnswer(calculation, { type: 'calculation', value: '４２' }).status).toBe(
      'correct',
    )
    expect(validateQuestionAnswer(calculation, { type: 'calculation', value: '41' }).status).toBe(
      'incorrect',
    )
  })

  it('applies fill-blank case policy and numeric tolerance from the question data', () => {
    const caseInsensitiveFill: Question = {
      ...demoQuestions[3],
      id: 'CASE_INSENSITIVE_FILL',
      answerRule: {
        ruleType: 'TEXT_BLANKS',
        blanks: [
          {
            blankId: 'answer-1',
            acceptedAnswers: ['London'],
            normalization: 'CASE_INSENSITIVE',
          },
        ],
      },
    }
    const toleranceCalculation: Question = {
      ...demoQuestions[4],
      id: 'TOLERANCE_CALCULATION',
      answerRule: { ruleType: 'NUMERIC', value: 10, tolerance: 0.1 },
    }

    expect(
      validateQuestionAnswer(caseInsensitiveFill, { type: 'fillBlank', values: [' london '] })
        .status,
    ).toBe('correct')
    expect(
      validateQuestionAnswer(caseInsensitiveFill, { type: 'fillBlank', values: ['Paris'] }).status,
    ).toBe('incorrect')
    expect(
      validateQuestionAnswer(toleranceCalculation, { type: 'calculation', value: '10.05' }).status,
    ).toBe('correct')
    expect(
      validateQuestionAnswer(toleranceCalculation, { type: 'calculation', value: '10.2' }).status,
    ).toBe('incorrect')
  })

  it('keeps short answers out of automatic scoring and reports zero-scorable summaries safely', () => {
    const question = demoQuestions[5]
    const answer = correctAnswerDraft(question)
    const result = validateQuestionAnswer(question, answer)
    const session = createQuestionSession(demoAssessmentContext, definition, 'student-summary')
    session.status = 'completed'
    session.attempts = [
      {
        questionId: question.id,
        answer,
        submitted: true,
        result,
      },
    ]

    expect(result.status).toBe('manual_review_required')
    expect(result.maxScore).toBe(0)
    expect(buildAssessmentResultSummary(session, [question])).toMatchObject({
      totalQuestions: 1,
      submittedQuestions: 1,
      manualReviewCount: 1,
      scorableQuestions: 0,
      percentage: null,
    })
  })
})

describe('QuestionSession result lock and resume', () => {
  it('locks a submitted answer and resumes the stored result without regrading', async () => {
    setActivePinia(createPinia())
    const storage = createQuestionSessionStorage(createMemoryStorage())
    const adapter = new QuestionEngineAdapter({ questionRepository: new MockQuestionRepository() })
    configureQuestionEngineStore({ adapter, sessionStorage: storage })
    const store = useQuestionEngineStore()

    await store.loadAssessment(demoAssessmentContext, {
      dataset: 'demo',
      studentId: 'student-resume',
    })
    const firstAnswer = correctAnswerDraft(demoQuestions[0])
    await store.setAnswerDraft(firstAnswer)
    await store.submitAnswer()
    const savedResult = store.currentQuestion?.result

    expect(await store.setAnswerDraft({ type: 'singleChoice', optionId: 'OTHER_OPTION' })).toBe(
      false,
    )
    expect(await store.submitAnswer()).toBe(false)

    setActivePinia(createPinia())
    const resumedStore = useQuestionEngineStore()
    await resumedStore.loadAssessment(demoAssessmentContext, {
      dataset: 'demo',
      studentId: 'student-resume',
    })

    expect(resumedStore.currentQuestion?.submitted).toBe(true)
    expect(resumedStore.currentQuestion?.result).toEqual(savedResult)
    expect(resumedStore.currentQuestion?.correctAnswerText).toContain('5 个')
  })

  it('summarizes a mixed session score without using manual-review items as denominator', () => {
    const questions = [demoQuestions[0], demoQuestions[1], demoQuestions[5]]
    const session = createQuestionSession(demoAssessmentContext, definition, 'student-score')
    session.attempts = [
      {
        questionId: questions[0].id,
        answer: correctAnswerDraft(questions[0]),
        submitted: true,
        result: validateQuestionAnswer(questions[0], correctAnswerDraft(questions[0])),
      },
      {
        questionId: questions[1].id,
        answer: { type: 'multipleChoice', optionIds: [] },
        submitted: true,
        result: validateQuestionAnswer(questions[1], { type: 'multipleChoice', optionIds: [] }),
      },
      {
        questionId: questions[2].id,
        answer: correctAnswerDraft(questions[2]),
        submitted: true,
        result: validateQuestionAnswer(questions[2], correctAnswerDraft(questions[2])),
      },
    ]

    expect(buildAssessmentResultSummary(session, questions)).toMatchObject({
      totalQuestions: 3,
      submittedQuestions: 3,
      correctCount: 1,
      incorrectCount: 1,
      manualReviewCount: 1,
      score: 1,
      maxScore: 2,
      percentage: 50,
      scorableQuestions: 2,
    })
  })
})
