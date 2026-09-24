import { describe, expect, it } from 'vitest'
import router from '@/router'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '@/data/learning-agent/scenarios'
import { LearningPlanner } from '@/services/learning-agent/learningPlanner'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '@/services/learning-agent/plannerConfig'
import { buildAgentContext } from '@/services/learning-agent/contextBuilder'
import {
  clearFormalAgentLaunch,
  loadFormalAgentLaunch,
  saveFormalAgentLaunch,
} from '@/services/learning-agent/formalAgentLaunchStorage'

describe('learning agent entry', () => {
  it('exposes a short direct development route that resolves to the agent page', () => {
    const resolved = router.resolve('/agent')
    expect(resolved.matched.some((record) => record.meta.devOnly)).toBe(true)
    expect(resolved.matched.some((record) => record.redirect === '/dev/learning-agent')).toBe(true)
    expect(router.resolve('/dev/learning-agent').matched.at(-1)?.meta.title).toBe(
      'Learning Agent Simulation',
    )
  })

  it('exposes the formal student route separately from the development simulator', () => {
    const resolved = router.resolve('/learning-agent')
    expect(resolved.matched.at(-1)?.meta.title).toBe('Agent 学习建议')
    expect(resolved.matched.at(-1)?.meta.devOnly).not.toBe(true)
  })

  it('round-trips a formal Agent launch binding through session storage', () => {
    const snapshot = createAgentScenario('A')
    const decision = new LearningPlanner(DEFAULT_LEARNING_PLANNER_CONFIG).plan(
      buildAgentContext(
        snapshot,
        snapshot.profile.studentId,
        'AGENT_TEXTBOOK',
        AGENT_SIMULATION_TIME,
        DEFAULT_LEARNING_PLANNER_CONFIG,
      ).context,
    )
    const launch = {
      id: `formal:${decision.decisionId}`,
      profileId: decision.profileId,
      textbookId: decision.textbookId,
      decision,
      createdAt: AGENT_SIMULATION_TIME,
    }
    clearFormalAgentLaunch(launch.id)
    expect(saveFormalAgentLaunch(launch)).toBe(true)
    expect(loadFormalAgentLaunch(launch.id)).toEqual(launch)
    clearFormalAgentLaunch(launch.id)
    expect(loadFormalAgentLaunch(launch.id)).toBeNull()
  })
})
