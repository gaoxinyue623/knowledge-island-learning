// Local HTTP integration fixture. Never load real credentials or call a provider.
import { createLearningAgentServer } from '../../server/learningAgentServer'
import { createAgentScenario, AGENT_SIMULATION_TIME } from '../../src/data/learning-agent/scenarios'
import { buildAgentContext } from '../../src/services/learning-agent/contextBuilder'
import { LearningPlanner } from '../../src/services/learning-agent/learningPlanner'
import { buildGenerationRequests } from '../../src/services/learning-agent/generationServices'
import { DEFAULT_LEARNING_PLANNER_CONFIG } from '../../src/services/learning-agent/plannerConfig'

const { snapshot, context } = buildAgentContext(
  createAgentScenario('A'), 'AGENT_STUDENT', 'AGENT_TEXTBOOK',
  AGENT_SIMULATION_TIME, DEFAULT_LEARNING_PLANNER_CONFIG,
)
const request = buildGenerationRequests(context, new LearningPlanner().plan(context), snapshot, 'fastapi-contract').questions
request.generationReason = []
const app = createLearningAgentServer({ env: {}, origins: ['http://127.0.0.1:5173'] })
app.server.listen(0, '127.0.0.1', () => {
  const port = (app.server.address() as { port: number }).port
  console.log(JSON.stringify({ port, input: { request, recentSummaries: [] } }))
})
process.once('SIGTERM', () => { void app.close().then(() => process.exit(0)) })
