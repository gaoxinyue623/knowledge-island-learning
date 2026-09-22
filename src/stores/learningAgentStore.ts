import type { QuestionGeneratorMode } from '@/types/llm'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { LearningAgentResult } from '@/types/learning-agent'
import { AGENT_SIMULATION_TIME, createAgentScenario } from '@/data/learning-agent/scenarios'
import {
  LearningAgentSimulation,
  type SimulationAnswerMode,
} from '@/services/learning-agent/simulationService'

export const useLearningAgentStore = defineStore('learning-agent', () => {
  const simulation = shallowRef(new LearningAgentSimulation(createAgentScenario('A')))
  const result = shallowRef<LearningAgentResult | null>(null)
  const generatorMode = ref<QuestionGeneratorMode>('MOCK')
  const busy = ref(false),
    error = ref<string | null>(null),
    round = ref(0)
  const previousAction = ref<string | null>(null)
  let revision = 0
  function reset(scenario: string) {
    revision++
    simulation.value = new LearningAgentSimulation(createAgentScenario(scenario))
    result.value = null
    error.value = null
    previousAction.value = null
    round.value = 0
    busy.value = false
  }
  async function run(seed = 'phase17', knowledgePointId?: string) {
    const token = ++revision,
      active = simulation.value
    busy.value = true
    error.value = null
    if (knowledgePointId) active.snapshot.currentKnowledgePointId = knowledgePointId
    try {
      const next = await active.run(
        new Date(Date.parse(AGENT_SIMULATION_TIME) + round.value * 60000).toISOString(),
        `${seed}-${round.value}`,
        generatorMode.value,
      )
      if (token === revision) result.value = next
    } catch (e) {
      if (token === revision) error.value = e instanceof Error ? e.message : '模拟运行失败'
    } finally {
      if (token === revision) busy.value = false
    }
  }
  async function answer(mode: SimulationAnswerMode, seed = 'phase17') {
    if (!result.value || busy.value) return
    const token = ++revision,
      active = simulation.value,
      task = result.value
    busy.value = true
    error.value = null
    try {
      const now = new Date(
        Date.parse(AGENT_SIMULATION_TIME) + (round.value + 1) * 60000,
      ).toISOString()
      await active.answer(task, mode, now)
      if (token !== revision) return
      previousAction.value = task.decision?.action ?? null
      round.value++
      const next = await active.run(now, `${seed}-${round.value}`, generatorMode.value)
      if (token === revision) result.value = next
    } catch (e) {
      if (token === revision) error.value = e instanceof Error ? e.message : '模拟作答失败'
    } finally {
      if (token === revision) busy.value = false
    }
  }
  return {
    generatorMode,
    simulation,
    result,
    busy,
    error,
    round,
    previousAction,
    reset,
    run,
    answer,
  }
})
