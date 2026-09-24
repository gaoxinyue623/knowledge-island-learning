import { describe, expect, it } from 'vitest'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { RuntimeLearningAgentDecisionService } from '@/services/learning-agent/runtimeDecisionService'
import type { LearningAgentSnapshot } from '@/types/learning-agent'

function reviewedProfileSnapshot(): LearningAgentSnapshot {
  const snapshot = createAgentScenario('A')
  snapshot.dataset = 'profile'
  const reviewed = <
    T extends {
      needsVerification: boolean
      verificationStatus?: 'SAMPLE' | 'UNVERIFIED' | 'VERIFIED' | 'REVIEWED'
    },
  >(
    record: T,
  ): T => ({ ...record, needsVerification: false, verificationStatus: 'REVIEWED' })
  snapshot.curriculum = {
    ...snapshot.curriculum,
    textbook: reviewed(snapshot.curriculum.textbook),
    publisher: reviewed(snapshot.curriculum.publisher!),
    units: snapshot.curriculum.units.map(reviewed),
    lessons: snapshot.curriculum.lessons.map(reviewed),
    knowledgePoints: snapshot.curriculum.knowledgePoints.map(reviewed),
    lessonKnowledgePoints: snapshot.curriculum.lessonKnowledgePoints.map(reviewed),
  }
  snapshot.regionTextbookRelations = snapshot.regionTextbookRelations.map(reviewed)
  snapshot.questions = snapshot.questions.map((question) => ({
    ...question,
    status: 'PUBLISHED',
    isSample: false,
    needsVerification: false,
    verificationStatus: 'REVIEWED' as const,
  }))
  snapshot.mappings = snapshot.mappings.map((mapping) => ({
    ...mapping,
    isSample: false,
    needsVerification: false,
    verificationStatus: 'REVIEWED' as const,
  }))
  snapshot.templates = snapshot.templates.map((template) => ({
    ...template,
    isSample: false,
    verificationStatus: 'REVIEWED' as const,
  }))
  snapshot.masteryRecords = snapshot.masteryRecords.map((record) => ({
    ...record,
    isSampleDerived: false,
    evidenceSourceStatus: 'REVIEWED' as const,
  }))
  snapshot.evidence = snapshot.evidence.map((evidence) => ({
    ...evidence,
    metadata: {
      ...evidence.metadata,
      isSample: false,
      sourceVerificationStatus: 'REVIEWED' as const,
    },
  }))
  return snapshot
}

describe('runtime learning-agent decision boundary', () => {
  it('accepts an explicitly selected reviewed textbook from another region', async () => {
    const snapshot = reviewedProfileSnapshot()
    snapshot.profile.regionId = 'ANOTHER_REGION'
    const service = new RuntimeLearningAgentDecisionService({ load: async () => snapshot })
    const result = await service.prepare('AGENT_STUDENT', 'AGENT_TEXTBOOK', { now: AGENT_SIMULATION_TIME })
    expect(result.status).toBe('READY')
    snapshot.regionTextbookRelations = []
    const blocked = await service.prepare('AGENT_STUDENT', 'AGENT_TEXTBOOK', { now: AGENT_SIMULATION_TIME })
    expect(blocked.status).toBe('BLOCKED')
    expect(blocked.validation.checks.at(-1)?.code).toBe('AGENT_CURRICULUM_GUARD')
  })

  it('reads reviewed profile facts and returns an explainable decision without generation', async () => {
    const source = { load: async () => reviewedProfileSnapshot() }
    const result = await new RuntimeLearningAgentDecisionService(source).prepare(
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      { now: AGENT_SIMULATION_TIME },
    )
    expect(result.status).toBe('READY')
    expect(result.validation.status).toBe('VALID')
    expect(result.decision?.action).toBe('REINFORCE')
    expect(result.activityPlan?.knowledgePointIds).toEqual(['AGENT_KP_CURRENT'])
    expect(result.context?.dataset).toBe('profile')
    expect(result.trace.events.at(-1)?.event).toBe('READY')
    expect(result.trace.events.some((event) => event.event.includes('GENERATE'))).toBe(false)
  })

  it('rejects SAMPLE snapshots before planner delivery', async () => {
    const source = { load: async () => createAgentScenario('A') }
    const result = await new RuntimeLearningAgentDecisionService(source).prepare(
      'AGENT_STUDENT',
      'AGENT_TEXTBOOK',
      { now: AGENT_SIMULATION_TIME },
    )
    expect(result.status).toBe('BLOCKED')
    expect(result.decision).toBeNull()
    expect(result.validation.checks.at(-1)).toMatchObject({
      stage: 'DATASET',
      status: 'FAIL',
      code: 'AGENT_RUNTIME_PROFILE_DATA_REQUIRED',
    })
  })

  it('fails closed on invalid input and source errors without exposing exception text', async () => {
    const source = {
      load: async () => {
        throw new Error('PRIVATE_DATABASE_DETAIL')
      },
    }
    const service = new RuntimeLearningAgentDecisionService(source)
    const invalid = await service.prepare('', 'AGENT_TEXTBOOK', { now: AGENT_SIMULATION_TIME })
    expect(invalid.validation.checks.at(-1)?.code).toBe('AGENT_RUNTIME_INPUT_INVALID')
    const failed = await service.prepare('AGENT_STUDENT', 'AGENT_TEXTBOOK', {
      now: AGENT_SIMULATION_TIME,
    })
    expect(failed.status).toBe('BLOCKED')
    expect(failed.validation.checks.at(-1)?.code).toBe('AGENT_RUNTIME_DEPENDENCY_FAILED')
    expect(JSON.stringify(failed)).not.toContain('PRIVATE_DATABASE_DETAIL')
  })
})
