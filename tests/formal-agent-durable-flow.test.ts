import { beforeEach, afterEach, expect, it } from 'vitest'
import { selectAccount, accountStorage, accountSessionStorage } from '@/services/account/storage'
import { accountSnapshotSchema } from '@/services/account/contract'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'
import {
  recoverFormalRun,
  saveFormalAgentLaunch,
  startFormalRun,
  bindFormalRun,
  completeFormalTask,
  latestFormalRun,
  loadFormalAgentLaunch,
} from '@/services/learning-agent/formalAgentLaunchStorage'
import { selectAgentQuestions } from '@/services/learning-agent/questionSelection'
import { StudentKnowledgeStateBuilder } from '@/services/learning-agent/studentKnowledgeStateBuilder'
const snapshot = () => createAgentScenario('A')
function decision() {
  const s = snapshot()
  return new LearningPlanner().plan(
    buildAgentContext(
      s,
      s.profile.studentId,
      s.curriculum.textbook.id,
      AGENT_SIMULATION_TIME,
      DEFAULT_LEARNING_PLANNER_CONFIG,
    ).context,
  )
}
beforeEach(() => {
  selectAccount(null)
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => selectAccount(null))
it('resumes durable tasks without session storage, bounds the run, survives a cloud snapshot and isolates accounts', () => {
  selectAccount('parent_a')
  const d = decision(),
    run = startFormalRun(d.profileId, d.textbookId, 1)
  const launch = {
    id: 'launch-1',
    profileId: d.profileId,
    textbookId: d.textbookId,
    decision: d,
    createdAt: AGENT_SIMULATION_TIME,
  }
  bindFormalRun(run, launch)
  sessionStorage.clear()
  expect(loadFormalAgentLaunch(launch.id)?.runId).toBe(run.id)
  expect(latestFormalRun(d.profileId, d.textbookId)?.currentLaunchId).toBe(launch.id)
  expect(() => bindFormalRun(run, { ...launch, id: 'parallel-task' })).toThrow()
  const entries = Array.from({ length: accountStorage.length }, (_, i) => {
    const key = accountStorage.key(i)!
    return { key, value: accountStorage.getItem(key)! }
  })
  expect(accountSnapshotSchema.safeParse({ schemaVersion: 1, entries, pets: [] }).success).toBe(
    true,
  )
  selectAccount('parent_b')
  expect(loadFormalAgentLaunch(launch.id)).toBeNull()
  selectAccount('parent_a')
  accountStorage.clear()
  for (const entry of entries) accountStorage.setItem(entry.key, entry.value)
  completeFormalTask(launch.id)
  completeFormalTask(launch.id)
  expect(latestFormalRun(d.profileId, d.textbookId)).toMatchObject({
    status: 'completed',
    currentLaunchId: null,
    completedLaunchIds: [launch.id],
  })
  expect(() => bindFormalRun(run, { ...launch, id: 'beyond-limit' })).toThrow()
})
it('chooses the requested quantity and closest reviewed difficulty, excluding sample and unrelated questions', () => {
  const s = snapshot(),
    d = decision(),
    base = s.questions.find((q) =>
      s.mappings.some(
        (m) => m.questionId === q.id && m.knowledgePointId === d.targetKnowledgePointId,
      ),
    )!
  s.questions = ['FOUNDATION', 'STANDARD', 'ADVANCED'].map((difficulty, i) => ({
    ...base,
    id: `q${i}`,
    difficulty: difficulty as typeof base.difficulty,
    isSample: false,
    needsVerification: false,
    verificationStatus: 'REVIEWED' as const,
    status: 'PUBLISHED' as const,
    textbookVersionId: d.textbookId,
  }))
  s.mappings = s.questions.map((q) => ({
    ...s.mappings[0]!,
    questionId: q.id,
    knowledgePointId: d.targetKnowledgePointId,
    isSample: false,
    needsVerification: false,
    verificationStatus: 'REVIEWED' as const,
  }))
  d.recommendedActivity.estimatedQuestionCount = 1
  d.difficulty = 0.15
  expect(selectAgentQuestions(s, d).selectedQuestionIds).toEqual(['q0'])
  d.difficulty = 0.85
  expect(selectAgentQuestions(s, d).selectedQuestionIds).toEqual(['q2'])
  d.recommendedActivity.estimatedQuestionCount = 5
  expect(selectAgentQuestions(s, d)).toMatchObject({ estimatedQuestionCount: 3 })
  s.questions[2]!.isSample = true
  expect(selectAgentQuestions(s, d).selectedQuestionIds).not.toContain('q2')
})
it('includes AI answers as bounded auxiliary evidence and never certifies mastery from AI alone', () => {
  const s = snapshot()
  s.masteryRecords = []
  s.sessions = []
  s.history = []
  const d = decision()
  const signal = {
    id: 'ai:1',
    sessionId: 'session',
    questionId: 'question',
    profileId: d.profileId,
    textbookId: d.textbookId,
    knowledgePointId: d.targetKnowledgePointId,
    correct: false,
    occurredAt: AGENT_SIMULATION_TIME,
    difficulty: 1,
    stem: '题目',
    answer: '0',
    expected: '1',
    explanation: '方法',
    resolved: false,
  }
  s.aiSignals = [signal, { ...signal, id: 'ai:2' }]
  let point = new StudentKnowledgeStateBuilder()
    .build(s, AGENT_SIMULATION_TIME)
    .knowledgePoints.find((p) => p.knowledgePointId === signal.knowledgePointId)!
  expect(point).toMatchObject({ attemptCount: 2, consecutiveIncorrect: 2, masteryScore: 0 })
  s.aiSignals = Array.from({ length: 50 }, (_, i) => ({ ...signal, id: `ai:${i}`, correct: true }))
  const state = new StudentKnowledgeStateBuilder().build(s, AGENT_SIMULATION_TIME)
  point = state.knowledgePoints.find((p) => p.knowledgePointId === signal.knowledgePointId)!
  expect(point.confidence).toBeLessThan(DEFAULT_LEARNING_PLANNER_CONFIG.minimumConfidence)
  expect(state.challengeCandidates).not.toContain(signal.knowledgePointId)
  expect(s.masteryRecords).toEqual([])
})

it('repairs interruption between task and run writes before resuming or moving to the next task', () => {
  const d = decision(),
    run = startFormalRun(d.profileId, d.textbookId, 1)
  const launch = {
    id: 'interrupted',
    profileId: d.profileId,
    textbookId: d.textbookId,
    decision: d,
    createdAt: AGENT_SIMULATION_TIME,
  }
  saveFormalAgentLaunch(launch)
  const restored = recoverFormalRun(d.profileId, d.textbookId)
  expect(restored.run?.currentLaunchId).toBe(launch.id)
  expect(restored.launch?.runId).toBe(run.id)
  saveFormalAgentLaunch({ ...restored.launch!, completedAt: AGENT_SIMULATION_TIME })
  const completed = recoverFormalRun(d.profileId, d.textbookId)
  expect(completed.launch).toBeNull()
  expect(completed.run).toMatchObject({
    status: 'completed',
    completedLaunchIds: [launch.id],
    currentLaunchId: null,
  })
})

it('discovers and migrates old tab-only launches when opening formal learning', () => {
  selectAccount('parent_a')
  const d = decision(),
    launch = {
      id: 'legacy-task',
      profileId: d.profileId,
      textbookId: d.textbookId,
      decision: d,
      createdAt: AGENT_SIMULATION_TIME,
    }
  accountSessionStorage.setItem(
    `knowledge-island.agent-launch.v1:${launch.id}`,
    JSON.stringify(launch),
  )
  const restored = recoverFormalRun(d.profileId, d.textbookId)
  expect(restored.launch?.id).toBe(launch.id)
  expect(restored.run?.currentLaunchId).toBe(launch.id)
  sessionStorage.clear()
  expect(loadFormalAgentLaunch(launch.id)?.id).toBe(launch.id)
})
