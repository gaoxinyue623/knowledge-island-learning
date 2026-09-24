import { describe, expect, it, vi } from 'vitest'
import { reactive, shallowReactive } from 'vue'
import {
  createAgentScenario,
  simulationQuestion,
  simulationMapping,
  AGENT_SIMULATION_TIME,
} from '@/data/learning-agent/scenarios'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'
import {
  RuntimeLearningAgentExecutionService,
  type RuntimeExecutionDependencies,
} from '@/services/learning-agent/runtimeExecutionService'
import { MockQuestionRepository } from '@/services/question-engine/questionRepository'
import { createQuestionSessionStorage } from '@/services/question-engine/questionSessionStorage'
import { createQuestionSession } from '@/services/question-engine/questionEngineAdapter'
import { createMasteryRepository } from '@/services/mastery/masteryRepository'
import { createMasteryStorage } from '@/services/mastery/masteryStorage'
import { createWrongBookRepository } from '@/services/wrong-book/wrongBookRepository'
import { createWrongBookStorage } from '@/services/wrong-book/wrongBookStorage'
import { createReviewQueueRepository } from '@/services/review-queue/reviewQueueRepository'
import { createReviewQueueStorage } from '@/services/review-queue/reviewQueueStorage'
import { createLearningHistoryRepository } from '@/services/learning-history/learningHistoryRepository'
import { createLearningHistoryStorage } from '@/services/learning-history/learningHistoryStorage'
import type { LearningAgentSnapshot } from '@/types/learning-agent'
import type { Question, QuestionKnowledgePoint } from '@/types'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

function approvedSnapshot(questionCount = 1): {
  snapshot: LearningAgentSnapshot
  questions: Question[]
  mappings: QuestionKnowledgePoint[]
} {
  const snapshot = createAgentScenario('G')
  snapshot.dataset = 'profile'
  const approve = <T extends { needsVerification: boolean; verificationStatus?: string }>(
    record: T,
  ): T => ({
    ...record,
    needsVerification: false,
    verificationStatus: 'REVIEWED',
  })
  snapshot.curriculum = {
    ...snapshot.curriculum,
    textbook: approve(snapshot.curriculum.textbook),
    publisher: approve(snapshot.curriculum.publisher!),
    units: snapshot.curriculum.units.map(approve),
    lessons: snapshot.curriculum.lessons.map(approve),
    knowledgePoints: snapshot.curriculum.knowledgePoints.map(approve),
    lessonKnowledgePoints: snapshot.curriculum.lessonKnowledgePoints.map(approve),
    knowledgePrerequisites: snapshot.curriculum.knowledgePrerequisites.map(approve),
  }
  snapshot.regionTextbookRelations = snapshot.regionTextbookRelations.map(approve)
  const questions = Array.from({ length: questionCount }, (_, index) => ({
    ...simulationQuestion(`agent-runtime-question-${index}`),
    status: 'PUBLISHED' as const,
    isSample: false,
    needsVerification: false,
    verificationStatus: 'REVIEWED' as const,
  }))
  const mappings = questions.map((question) => ({
    ...simulationMapping(question),
    status: 'ACTIVE' as const,
    isSample: false,
    needsVerification: false,
    verificationStatus: 'REVIEWED' as const,
  }))
  snapshot.questions = questions
  snapshot.mappings = mappings
  return { snapshot, questions, mappings }
}

function fixture(questionCount = 1, queue = false) {
  const storage = memoryStorage()
  const { snapshot, questions, mappings } = approvedSnapshot(questionCount)
  if (queue) {
    snapshot.reviewQueue.push({
      id: 'REVIEW_ITEM',
      dueAt: '2026-09-16T00:00:00.000Z',
      profileId: snapshot.profile.studentId,
      textbookId: 'AGENT_TEXTBOOK',
      knowledgePointId: 'AGENT_KP_CURRENT',
      recommendationType: 'REINFORCE',
      priority: 1,
      reason: {
        code: 'WEAK_MASTERY',
        masteryScore: 20,
        confidence: 0.5,
        evidenceCount: 1,
        title: '复习',
        description: '复习',
      },
      reasonCode: 'WEAK_MASTERY',
      status: 'active',
      sourceStrategyVersion: 'STRATEGY_V1',
      sourceRecommendationId: 'REC',
      provenance: { isSampleDerived: false, verificationStatus: 'REVIEWED' },
    })
  }
  const source = { load: async () => structuredClone(snapshot) }
  const dependencies: RuntimeExecutionDependencies = {
    source,
    questions: new MockQuestionRepository({
      profileQuestions: questions,
      profileQuestionKnowledgePoints: mappings,
    }),
    sessions: createQuestionSessionStorage(storage),
    mastery: createMasteryRepository(createMasteryStorage(storage)),
    wrongBook: createWrongBookRepository(createWrongBookStorage(storage)),
    reviewQueue: createReviewQueueRepository(createReviewQueueStorage(storage)),
    history: createLearningHistoryRepository(createLearningHistoryStorage(storage)),
  }
  for (const item of snapshot.reviewQueue) dependencies.reviewQueue.upsert(item)
  const decision = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(
    buildAgentContext(
      snapshot,
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      AGENT_SIMULATION_TIME,
      DEFAULT_LEARNING_PLANNER_CONFIG,
    ).context,
  )
  return {
    service: new RuntimeLearningAgentExecutionService(dependencies),
    dependencies,
    questions,
    mappings,
    snapshot,
    storage,
    decision,
  }
}

describe('formal runtime learning-agent execution', () => {
  it.each(['deep', 'nested'] as const)(
    'copies %s reactive requests before queued open and answer submissions',
    async (mode) => {
      const { service, dependencies, questions, decision } = fixture(2)
      const request =
        mode === 'deep'
          ? reactive({
              profileId: 'AGENT_STUDENT',
              textbookId: 'AGENT_TEXTBOOK',
              decision,
              questionIds: questions.map((q) => q.id),
            })
          : {
              profileId: 'AGENT_STUDENT',
              textbookId: 'AGENT_TEXTBOOK',
              decision: shallowReactive({ ...decision, reasons: reactive(decision.reasons) }),
              questionIds: questions.map((q) => q.id),
            }
      // This is the browser failure path that the execution boundary must accept.
      expect(() => structuredClone(request)).toThrow()
      const opening = service.open(request, AGENT_SIMULATION_TIME)
      request.questionIds.length = 0
      const opened = await opening
      expect(opened.status).toBe('READY')
      expect(opened.session?.questionIds).toHaveLength(2)
      const answer = reactive({ type: 'calculation' as const, value: '25' })
      const submission = {
        ...request,
        questionIds: questions.map((q) => q.id),
        sessionId: opened.session!.id,
        answers: reactive([{ questionId: questions[0].id, answer }]),
      }
      const submitting = service.submit(submission, '2026-09-17T08:01:00.000Z')
      answer.value = '999'
      const partial = await submitting
      expect(partial.status).toBe('READY')
      expect(partial.session?.attempts[0]?.answer).toEqual({ type: 'calculation', value: '25' })
      expect(dependencies.mastery.getEvidence('AGENT_STUDENT')).toHaveLength(0)
      const completed = await service.submit(
        {
          ...submission,
          answers: reactive([
            {
              questionId: questions[1].id,
              answer: reactive({ type: 'calculation' as const, value: '25' }),
            },
          ]),
        },
        '2026-09-17T08:02:00.000Z',
      )
      expect(completed.status).toBe('COMPLETED')
      expect(dependencies.mastery.getEvidence('AGENT_STUDENT')).toHaveLength(2)
    },
  )

  it('blocks unsupported or cyclic inputs without throwing or writing a session', async () => {
    const { service, dependencies, questions, decision } = fixture()
    const save = vi.spyOn(dependencies.sessions, 'save')
    const request = {
      profileId: 'AGENT_STUDENT',
      textbookId: 'AGENT_TEXTBOOK',
      decision,
      questionIds: questions.map((q) => q.id),
    }
    const cyclic = { ...request, extra: {} }
    cyclic.extra = cyclic
    for (const invalid of [cyclic, { ...request, extra: () => undefined }]) {
      await expect(service.open(invalid, AGENT_SIMULATION_TIME)).resolves.toMatchObject({
        status: 'BLOCKED',
        code: 'AGENT_EXECUTION_INPUT_INVALID',
      })
    }
    expect(save).not.toHaveBeenCalled()
    await expect(service.open(request, AGENT_SIMULATION_TIME)).resolves.toMatchObject({
      status: 'READY',
    })
  })

  it('creates a bound session and writes evidence/mastery only after all answers are submitted', async () => {
    const { service, dependencies, questions, decision } = fixture(2)
    const request = {
      profileId: 'AGENT_STUDENT',
      textbookId: 'AGENT_TEXTBOOK',
      decision,
      questionIds: questions.map((q) => q.id),
    }
    const opened = await service.open(request, AGENT_SIMULATION_TIME)
    expect(opened.status).toBe('READY')
    expect(opened.session?.runtimeAgent?.binding).toBeTruthy()
    const partial = await service.submit(
      {
        ...request,
        sessionId: opened.session!.id,
        answers: [{ questionId: questions[0].id, answer: { type: 'calculation', value: '25' } }],
      },
      '2026-09-17T08:01:00.000Z',
    )
    expect(partial.status).toBe('READY')
    expect(partial.session?.status).toBe('in_progress')
    expect(dependencies.mastery.getEvidence('AGENT_STUDENT')).toEqual([])
    const completed = await service.submit(
      {
        ...request,
        sessionId: opened.session!.id,
        answers: [{ questionId: questions[1].id, answer: { type: 'calculation', value: '25' } }],
      },
      '2026-09-17T08:02:00.000Z',
    )
    expect(completed.status).toBe('COMPLETED')
    expect(completed.appendedEvidence).toHaveLength(2)
    expect(dependencies.mastery.getEvidence('AGENT_STUDENT')).toHaveLength(2)
    expect(
      dependencies.mastery.getMasteryRecord('AGENT_STUDENT', 'AGENT_KP_CURRENT')?.evidenceCount,
    ).toBe(2)
    expect(dependencies.history.listByProfile('AGENT_STUDENT')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'assessment_started' }),
        expect.objectContaining({ type: 'assessment_completed' }),
      ]),
    )
  })

  it('is idempotent for a repeated submission and does not duplicate wrong-book counts', async () => {
    const { service, dependencies, questions, decision } = fixture()
    const request = {
      profileId: 'AGENT_STUDENT',
      textbookId: 'AGENT_TEXTBOOK',
      decision,
      questionIds: questions.map((q) => q.id),
    }
    const opened = await service.open(request, AGENT_SIMULATION_TIME)
    const answer = { type: 'calculation' as const, value: '26' }
    const first = await service.submit(
      {
        ...request,
        sessionId: opened.session!.id,
        answers: [{ questionId: questions[0].id, answer }],
      },
      '2026-09-17T08:01:00.000Z',
    )
    const second = await service.submit(
      {
        ...request,
        sessionId: opened.session!.id,
        answers: [{ questionId: questions[0].id, answer }],
      },
      '2026-09-17T08:02:00.000Z',
    )
    expect(first.status).toBe('COMPLETED')
    expect(second.status).toBe('COMPLETED')
    expect(dependencies.mastery.getEvidence('AGENT_STUDENT')).toHaveLength(1)
    expect(
      dependencies.wrongBook.listByProfile('AGENT_STUDENT', { includeResolved: true }),
    ).toHaveLength(1)
    expect(dependencies.wrongBook.get('AGENT_STUDENT', questions[0].id)?.wrongCount).toBe(1)
    const changed = await service.submit(
      {
        ...request,
        sessionId: opened.session!.id,
        answers: [{ questionId: questions[0].id, answer: { type: 'calculation', value: '25' } }],
      },
      '2026-09-17T08:03:00.000Z',
    )
    expect(changed.code).toBe('AGENT_EXECUTION_ALREADY_SUBMITTED')
  })

  it.each([
    [
      'sample question',
      (q: Question) => ({ ...q, isSample: true, verificationStatus: 'SAMPLE' as const }),
    ],
    [
      'unreviewed question',
      (q: Question) => ({
        ...q,
        verificationStatus: 'UNVERIFIED' as const,
        needsVerification: true,
      }),
    ],
  ])('blocks %s before opening a formal session', async (_label, mutate) => {
    const { snapshot, questions, mappings } = approvedSnapshot()
    const question = mutate(questions[0])
    const service = new RuntimeLearningAgentExecutionService({
      source: { load: async () => structuredClone(snapshot) },
      questions: new MockQuestionRepository({
        profileQuestions: [question],
        profileQuestionKnowledgePoints: mappings,
      }),
      sessions: createQuestionSessionStorage(memoryStorage()),
      mastery: createMasteryRepository(createMasteryStorage(memoryStorage())),
      wrongBook: createWrongBookRepository(createWrongBookStorage(memoryStorage())),
      reviewQueue: createReviewQueueRepository(createReviewQueueStorage(memoryStorage())),
      history: createLearningHistoryRepository(createLearningHistoryStorage(memoryStorage())),
    })
    const decision = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(
      buildAgentContext(
        snapshot,
        'AGENT_STUDENT',
        'AGENT_TEXTBOOK',
        AGENT_SIMULATION_TIME,
        DEFAULT_LEARNING_PLANNER_CONFIG,
      ).context,
    )
    const result = await service.open(
      {
        profileId: 'AGENT_STUDENT',
        textbookId: 'AGENT_TEXTBOOK',
        decision,
        questionIds: [question.id],
      },
      AGENT_SIMULATION_TIME,
    )
    expect(result.status).toBe('BLOCKED')
    expect(result.code).toBe('AGENT_EXECUTION_QUESTION_NOT_ALLOWED')
  })

  it('rejects a foreign session or a different answer after commit', async () => {
    const { service, questions, decision } = fixture()
    const request = {
      profileId: 'AGENT_STUDENT',
      textbookId: 'AGENT_TEXTBOOK',
      decision,
      questionIds: questions.map((q) => q.id),
    }
    const result = await service.submit(
      {
        ...request,
        sessionId: 'question-session:OTHER:foreign',
        answers: [{ questionId: questions[0].id, answer: { type: 'calculation', value: '25' } }],
      },
      AGENT_SIMULATION_TIME,
    )
    expect(result.status).toBe('BLOCKED')
    expect(result.code).toBe('AGENT_EXECUTION_SESSION_MISMATCH')
  })
})

async function openedFixture(questionCount = 1, queue = false) {
  const f = fixture(questionCount, queue)
  const request = {
    profileId: 'AGENT_STUDENT',
    textbookId: 'AGENT_TEXTBOOK',
    decision: f.decision,
    questionIds: f.questions.map((q) => q.id),
  }
  const opened = await f.service.open(request, AGENT_SIMULATION_TIME)
  expect(opened.status).toBe('READY')
  const submission = {
    ...request,
    sessionId: opened.session!.id,
    answers: f.questions.map((q) => ({
      questionId: q.id,
      answer: { type: 'calculation' as const, value: '26' },
    })),
  }
  return { ...f, request, opened, submission }
}

describe('execution recovery and scope boundaries', () => {
  it('takes over the Question Engine shell created before formal binding', async () => {
    const f = fixture()
    const relation = f.snapshot.curriculum.lessonKnowledgePoints.find(
      (item) => item.knowledgePointId === f.decision.targetKnowledgePointId,
    )
    const lesson = f.snapshot.curriculum.lessons.find((item) => item.id === relation?.lessonId)!
    const shell = createQuestionSession(
      {
        textbookId: 'AGENT_TEXTBOOK',
        unitId: lesson.unitId,
        lessonId: lesson.id,
        knowledgePointId: f.decision.targetKnowledgePointId,
        source: 'lesson_practice',
      },
      {
        id: `ASSESSMENT:${lesson.id}:${f.decision.targetKnowledgePointId}:PRACTICE`,
        knowledgePointId: f.decision.targetKnowledgePointId,
        questionIds: f.questions.map((question) => question.id),
        mode: 'practice',
      },
      'AGENT_STUDENT',
      f.decision.decisionId,
    )
    f.dependencies.sessions.save(shell)
    const opened = await f.service.open(
      {
        profileId: 'AGENT_STUDENT',
        textbookId: 'AGENT_TEXTBOOK',
        decision: f.decision,
        questionIds: f.questions.map((question) => question.id),
        sessionScope: f.decision.decisionId,
      },
      AGENT_SIMULATION_TIME,
    )
    expect(opened.status).toBe('READY')
    expect(opened.session?.id).toBe(shell.id)
    expect(opened.session?.runtimeAgent?.binding).toBeTruthy()
    expect(f.dependencies.sessions.get(shell.id)?.status).toBe('in_progress')
  })

  it.each([
    'knowledge-island.question-sessions',
    'knowledge-island.learning-evidence',
    'knowledge-island.mastery-records',
    'knowledge-island.wrong-book',
    'knowledge-island.learning-history',
    'knowledge-island.review-queue',
  ])('retries a failed write to %s without duplicate facts', async (key) => {
    const f = await openedFixture()
    const original = f.storage.setItem
    const setter = vi.spyOn(f.storage, 'setItem').mockImplementation((k, value) => {
      if (k === key) throw new Error('PRIVATE_QUOTA_DETAIL')
      original(k, value)
    })
    const failed = await f.service.submit(f.submission, AGENT_SIMULATION_TIME)
    expect(['BLOCKED', 'RETRY_REQUIRED']).toContain(failed.status)
    expect(JSON.stringify(failed)).not.toContain('PRIVATE_QUOTA_DETAIL')
    if (key === 'knowledge-island.question-sessions')
      expect(f.dependencies.mastery.getEvidence('AGENT_STUDENT')).toHaveLength(0)
    setter.mockRestore()
    const retry = await new RuntimeLearningAgentExecutionService(f.dependencies).submit(
      f.submission,
      AGENT_SIMULATION_TIME,
    )
    expect(retry.status).toBe('COMPLETED')
    expect(f.dependencies.mastery.getEvidence('AGENT_STUDENT')).toHaveLength(1)
    expect(f.dependencies.wrongBook.get('AGENT_STUDENT', f.questions[0].id)?.wrongCount).toBe(1)
    expect(f.dependencies.history.listByProfile('AGENT_STUDENT')).toHaveLength(2)
    const version = retry.records[0].version
    expect((await f.service.submit(f.submission, AGENT_SIMULATION_TIME)).records[0].version).toBe(
      version,
    )
  })

  it('serializes concurrent calls across two service instances', async () => {
    const f = await openedFixture()
    const responses = await Promise.all([
      f.service.submit(f.submission, AGENT_SIMULATION_TIME),
      new RuntimeLearningAgentExecutionService(f.dependencies).submit(
        f.submission,
        AGENT_SIMULATION_TIME,
      ),
    ])
    expect(responses.map((r) => r.status)).toEqual(['COMPLETED', 'COMPLETED'])
    expect(responses.map((r) => r.appendedEvidence.length)).toEqual([1, 0])
    expect(f.dependencies.wrongBook.get('AGENT_STUDENT', f.questions[0].id)?.wrongCount).toBe(1)
  })

  it.each([
    'profile',
    'textbook',
    'decision',
    'question',
    'mapping',
    'manual',
    'sampleDataset',
  ] as const)('blocks changed %s before writing any evidence', async (kind) => {
    const f = await openedFixture()
    switch (kind) {
      case 'profile':
        f.submission.profileId = 'OTHER'
        break
      case 'textbook':
        f.submission.textbookId = 'OTHER'
        break
      case 'decision':
        f.submission.decision = { ...f.decision, profileId: 'OTHER' }
        break
      case 'question':
        f.questions[0].questionVersion = 2
        break
      case 'mapping':
        f.mappings[0].knowledgePointId = 'FOREIGN_POINT'
        break
      case 'manual':
        f.questions[0].questionType = 'shortAnswer'
        f.questions[0].answerRule = { ruleType: 'MANUAL_REVIEW' }
        break
      case 'sampleDataset':
        f.snapshot.dataset = 'demo'
        break
    }
    const result = await f.service.submit(f.submission, AGENT_SIMULATION_TIME)
    expect(result.status).toBe('BLOCKED')
    expect(f.dependencies.mastery.getEvidence('AGENT_STUDENT')).toEqual([])
    expect(f.dependencies.wrongBook.listByProfile('AGENT_STUDENT')).toEqual([])
    expect(f.dependencies.sessions.get(f.opened.session!.id)?.status).toBe('in_progress')
  })

  it('resumes a partial session after service recreation, keeping answers locked', async () => {
    const f = await openedFixture(2)
    const partial = { ...f.submission, answers: f.submission.answers.slice(0, 1) }
    expect((await f.service.submit(partial, AGENT_SIMULATION_TIME)).status).toBe('READY')
    const restored = new RuntimeLearningAgentExecutionService(f.dependencies)
    expect((await restored.open(f.request, AGENT_SIMULATION_TIME)).session?.attempts).toHaveLength(
      1,
    )
    expect(f.dependencies.wrongBook.listByProfile('AGENT_STUDENT')).toEqual([])
    expect(f.dependencies.reviewQueue.listByProfile('AGENT_STUDENT')).toEqual([])
    partial.answers[0].answer.value = '25'
    expect((await restored.submit(partial, AGENT_SIMULATION_TIME)).code).toBe(
      'AGENT_EXECUTION_ALREADY_SUBMITTED',
    )
    expect(f.dependencies.mastery.getEvidence('AGENT_STUDENT')).toEqual([])
  })

  it.each(['correct', 'incorrect', 'newer'] as const)(
    'completes only its own entirely correct review (%s)',
    async (outcome) => {
      const f = await openedFixture(1, true)
      expect(f.decision.action).toBe('REVIEW')
      if (outcome !== 'incorrect') f.submission.answers[0].answer.value = '25'
      if (outcome === 'newer') {
        const item = f.dependencies.reviewQueue.get('AGENT_STUDENT', 'REVIEW_ITEM')!
        f.dependencies.reviewQueue.upsert({ ...item, evidenceId: 'another-session-evidence' })
      }
      const result = await f.service.submit(f.submission, AGENT_SIMULATION_TIME)
      expect(result.status).toBe('COMPLETED')
      const queue = f.dependencies.reviewQueue.get('AGENT_STUDENT', 'REVIEW_ITEM')!
      expect(queue.status).toBe(outcome === 'correct' ? 'completed' : 'active')
      const before = f.storage.getItem('knowledge-island.review-queue')
      await f.service.submit(f.submission, AGENT_SIMULATION_TIME)
      expect(f.storage.getItem('knowledge-island.review-queue')).toBe(before)
    },
  )
})

describe('execution validation before persistence', () => {
  it.each(['empty', 'duplicate', 'unknown', 'blank'] as const)(
    'rejects %s answers',
    async (kind) => {
      const f = await openedFixture()
      if (kind === 'empty') f.submission.answers = []
      if (kind === 'duplicate') f.submission.answers.push(structuredClone(f.submission.answers[0]))
      if (kind === 'unknown') f.submission.answers[0].questionId = 'unknown'
      if (kind === 'blank') f.submission.answers[0].answer.value = ''
      expect((await f.service.submit(f.submission, AGENT_SIMULATION_TIME)).code).toBe(
        'AGENT_EXECUTION_ANSWERS_INCOMPLETE',
      )
      expect(f.dependencies.mastery.getEvidence('AGENT_STUDENT')).toEqual([])
    },
  )

  it.each(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REJECTED'] as const)(
    'rejects %s mappings',
    async (status) => {
      const f = fixture()
      f.mappings[0].verificationStatus = status
      expect(
        (
          await f.service.open(
            {
              profileId: 'AGENT_STUDENT',
              textbookId: 'AGENT_TEXTBOOK',
              decision: f.decision,
              questionIds: [f.questions[0].id],
            },
            AGENT_SIMULATION_TIME,
          )
        ).code,
      ).toBe('AGENT_EXECUTION_MAPPING_INVALID')
      expect(f.dependencies.sessions.loadAll()).toEqual([])
    },
  )

  it('recomputes stored grades and rejects an incomplete completed session', async () => {
    const f = await openedFixture(2)
    await f.service.submit(
      { ...f.submission, answers: [f.submission.answers[0]] },
      AGENT_SIMULATION_TIME,
    )
    const partial = f.dependencies.sessions.get(f.submission.sessionId)!
    partial.attempts[0].result = { status: 'correct', score: 1, maxScore: 1 }
    partial.status = 'completed'
    partial.completedAt = AGENT_SIMULATION_TIME
    f.dependencies.sessions.save(partial)
    expect((await f.service.submit(f.submission, AGENT_SIMULATION_TIME)).code).toBe(
      'AGENT_EXECUTION_SESSION_MISMATCH',
    )
    partial.status = 'in_progress'
    delete partial.completedAt
    f.dependencies.sessions.save(partial)
    const completed = await f.service.submit(f.submission, AGENT_SIMULATION_TIME)
    expect(completed.status).toBe('COMPLETED')
    expect(completed.records[0].masteryScore).toBe(0)
    expect(completed.session?.attempts.every((a) => a.result?.status === 'incorrect')).toBe(true)
  })
})
