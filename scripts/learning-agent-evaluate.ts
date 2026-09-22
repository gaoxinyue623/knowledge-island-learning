import {
  AGENT_SCENARIOS,
  AGENT_SIMULATION_TIME,
  createAgentScenario,
} from '../src/data/learning-agent/scenarios'
import { LearningAgentSimulation } from '../src/services/learning-agent/simulationService'
import { AgentEvaluationService } from '../src/services/learning-agent/agentEvaluationService'

const cases = []
for (const scenario of AGENT_SCENARIOS) {
  const result = await new LearningAgentSimulation(createAgentScenario(scenario.id)).run(
    AGENT_SIMULATION_TIME,
  )
  cases.push({ ...scenario, result })
}
const report = new AgentEvaluationService().evaluate(cases)
console.log(JSON.stringify(report, null, 2))
if (report.passed !== report.total) process.exitCode = 1
