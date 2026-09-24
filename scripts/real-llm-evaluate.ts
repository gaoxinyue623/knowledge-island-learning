import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv } from 'vite'
import { AIQuestionGenerator } from '../src/services/learning-agent/aiQuestionGenerator'
import type { GenerationPromptVersion } from '../src/services/llm/questionPromptBuilder'
import { LLMRuntime } from '../src/services/llm/runtime'
import { OpenAICompatibleLLMProvider } from '../server/llm/openAICompatibleProvider'
import { readLLMConfig } from '../server/llm/config'
import {
  buildDifficultySweep,
  buildEvaluationReport,
  difficultyObservation,
  DEFAULT_EVALUATION_BATCH_SIZE,
  REAL_LLM_GOLDEN_SCENARIOS,
  validateBatchCount,
  type EvaluationObservation,
} from '../src/services/learning-agent/realLLMEvaluation'

function argument(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

function numberArgument(name: string, fallback: number): number {
  const value = argument(name)
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`INVALID_${name.toUpperCase()}`)
  return parsed
}

function usage() {
  console.error(
    [
      'Usage: npm run llm:evaluate -- --batches=1 [--batch-size=20] [--sweep-count=20] [--chunk-size=5] [--timeout-ms=30000] [--prompt-version=4|5|6|7]',
      'Supported batches: 1, 5, 10, 20, 50.',
      'Use --scenarios=A,B to run a focused subset while developing the evaluator.',
      'Use --no-difficulty-sweep to skip the four-point difficulty observation.',
      'Use --thinking=disabled only with a provider/model verified to support this opt-in parameter.',
      'Use --temperature=0 for a repeatable acceptance run; the selected value is recorded in evidence.',
      'Use --replay=EVIDENCE.json with the original batch options to re-audit saved evidence without provider calls; writes a new report.',
      'This command performs real provider calls and is intentionally excluded from npm test.',
    ].join('\n'),
  )
}

async function main() {
  if (process.argv.includes('--help')) {
    usage()
    return
  }
  const batchCount = numberArgument('batches', 1)
  validateBatchCount(batchCount)
  const batchSize = numberArgument('batch-size', DEFAULT_EVALUATION_BATCH_SIZE)
  const sweepCount = numberArgument('sweep-count', 20)
  const runSweep = !process.argv.includes('--no-difficulty-sweep')
  const selectedIds = argument('scenarios')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const env = {
    ...loadEnv('development', process.cwd(), ''),
    ...process.env,
    ...(argument('thinking') ? { LLM_THINKING_MODE: argument('thinking') } : {}),
  }
  const config = readLLMConfig(env)
  if (config.provider !== 'OPENAI_COMPATIBLE' || !config.adapter)
    throw new Error('REAL_LLM_EVALUATION_REQUIRES_OPENAI_COMPATIBLE_CONFIG')
  const timeoutOverride = argument('timeout-ms')
    ? numberArgument('timeout-ms', config.runtime.timeoutMs ?? 30000)
    : config.runtime.timeoutMs
  const runtime = new LLMRuntime(new OpenAICompatibleLLMProvider(config.adapter), {
    ...config.runtime,
    timeoutMs: timeoutOverride,
  })
  const generateStructured = runtime.generateStructured.bind(runtime)
  let callCount = 0
  runtime.generateStructured = (request, observation) =>
    generateStructured(request, {
      ...observation,
      onUsage(record) {
        observation.onUsage(record)
        console.error(
          `[real-llm] call ${++callCount}: ${record.status} ${record.errorType ?? ''} ${record.latencyMs}ms repair=${record.repairCount} retry=${record.retryCount} finish=${record.diagnostics?.finishReason ?? 'unknown'}`,
        )
      },
    })
  const promptVersion = argument('prompt-version') ?? '6'
  if (!['4', '5', '6', '7'].includes(promptVersion)) throw new Error('INVALID_PROMPT_VERSION')
  const temperatureArgument = argument('temperature')
  const temperature = temperatureArgument === undefined ? undefined : Number(temperatureArgument)
  if (
    temperature !== undefined &&
    (!Number.isFinite(temperature) || temperature < 0 || temperature > 2)
  )
    throw new Error('INVALID_TEMPERATURE')
  const chunkSize = numberArgument('chunk-size', 5)
  if (batchSize > 100 || sweepCount > 100 || chunkSize > 100) throw new Error('COUNT_LIMIT_100')
  const replayPath = argument('replay')
  const replay = replayPath ? JSON.parse(readFileSync(replayPath, 'utf8')) : undefined
  if (
    replay &&
    (!Array.isArray(replay.observations) ||
      replay.model !== config.adapter.model ||
      replay.provider !== runtime.provider.providerId)
  )
    throw new Error('REPLAY_EVIDENCE_INVALID')
  const observations: EvaluationObservation[] = replay?.observations ?? []
  const runId = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDir = join(process.cwd(), '.data', 'llm-evaluations')
  mkdirSync(outputDir, { recursive: true })
  const safeWrite = (path: string, value: unknown) => {
    const serialized = JSON.stringify(value, null, 2)
    if (serialized.includes(config.adapter!.apiKey))
      throw new Error('REPORT_SECRET_REDACTED_WRITE_REFUSED')
    writeFileSync(path, serialized, { encoding: 'utf8', mode: 0o600 })
  }
  const checkpoint = () =>
    safeWrite(join(outputDir, `real-llm-${runId}-evidence.json`), {
      runId,
      chunkSize,
      promptVersion,
      outputTokenBudget: Math.min(16000, Math.max(4096, chunkSize * 350)),
      temperature: temperature ?? 'provider-default',
      batchCount,
      batchSize,
      sweepCount,
      replayOf: replayPath,
      timeoutMs: runtime.config.timeoutMs,
      maxRetries: runtime.config.maxRetries,
      nativeStructuredOutput: config.adapter!.nativeStructuredOutput,
      thinkingMode: config.adapter!.thinkingMode ?? 'provider-default',
      provider: runtime.provider.providerId,
      model: runtime.provider.model,
      observations,
    })
  const startedAt = Date.now()
  const scenarios = selectedIds?.length
    ? REAL_LLM_GOLDEN_SCENARIOS.filter((scenario) => selectedIds.includes(scenario.id))
    : REAL_LLM_GOLDEN_SCENARIOS
  if (!scenarios.length && !selectedIds?.includes('DIFFICULTY'))
    throw new Error('NO_MATCHING_GOLDEN_SCENARIOS')

  for (const scenario of replay ? [] : scenarios) {
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      for (const part of scenario.buildParts(batchIndex, batchSize)) {
        console.error(
          `[real-llm] ${scenario.id} batch ${batchIndex + 1}/${batchCount} part ${part.partId} (${part.request.count} questions)`,
        )
        try {
          const batch = await new AIQuestionGenerator(
            runtime,
            part.snapshot,
            chunkSize,
            promptVersion as GenerationPromptVersion,
            temperature,
          ).generate(part.request)
          observations.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            batchIndex,
            partId: part.partId,
            request: part.request,
            snapshot: part.snapshot,
            batch,
          })
          console.error(
            `[real-llm] ${scenario.id} ${part.partId} -> ${batch.telemetry?.status ?? 'UNKNOWN'} (${batch.questions.length}/${part.request.count})`,
          )
        } catch (error) {
          observations.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            batchIndex,
            partId: part.partId,
            request: part.request,
            snapshot: part.snapshot,
            batch: null,
            error:
              error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'UNKNOWN',
          })
          console.error(`[real-llm] ${scenario.id} ${part.partId} -> ERROR`)
        }
        checkpoint()
      }
    }
  }

  const difficultyObservations = []
  if (runSweep) {
    const sweepParts = Array.from({ length: batchCount }, (_, index) =>
      buildDifficultySweep(index, sweepCount),
    ).flat()
    for (const [index, part] of (replay ? [] : sweepParts).entries()) {
      console.error(`[real-llm] Difficulty ${index + 1}/${sweepParts.length}: ${part.partId}`)
      try {
        const batch = await new AIQuestionGenerator(
          runtime,
          part.snapshot,
          chunkSize,
          promptVersion as GenerationPromptVersion,
          temperature,
        ).generate(part.request)
        observations.push({
          scenarioId: 'DIFFICULTY',
          scenarioLabel: 'Difficulty sweep',
          batchIndex: Math.floor(index / 4),
          partId: part.partId,
          request: part.request,
          snapshot: part.snapshot,
          batch,
        })
      } catch (error) {
        observations.push({
          scenarioId: 'DIFFICULTY',
          scenarioLabel: 'Difficulty sweep',
          batchIndex: Math.floor(index / 4),
          partId: part.partId,
          request: part.request,
          snapshot: part.snapshot,
          batch: null,
          error:
            error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'UNKNOWN',
        })
      }
      checkpoint()
    }
    for (const part of sweepParts.slice(0, 4)) {
      const matching = observations.filter(
        (observation) =>
          observation.scenarioId === 'DIFFICULTY' && observation.partId === part.partId,
      )
      if (matching.length)
        difficultyObservations.push(
          difficultyObservation(matching, part.request.difficulty as 0.2 | 0.4 | 0.6 | 0.8),
        )
    }
  }

  const goldenObservations = observations.filter(
    (observation) => observation.scenarioId !== 'DIFFICULTY',
  )
  const report = buildEvaluationReport(
    goldenObservations.length ? goldenObservations : observations,
    {
      provider: config.adapter ? 'OPENAI_COMPATIBLE' : 'UNKNOWN',
      model: config.adapter.model,
      batchCount,
      batchSize,
      difficultyObservations,
      apiKeyLeakage: false,
    },
  )
  report.evidenceFile = replayPath ?? join(outputDir, `real-llm-${runId}-evidence.json`)
  // Read-only secret audit of actual build outputs. Only a boolean is retained.
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
    )
  try {
    report.gates.blocking.apiKeyLeakageZero = files(join(process.cwd(), 'dist')).every(
      (file) => !readFileSync(file).includes(config.adapter!.apiKey),
    )
  } catch {
    report.gates.blocking.apiKeyLeakageZero = false
    report.failures.push('BLOCKING:BUILD_SECRET_AUDIT_UNAVAILABLE')
  }
  if (!report.gates.blocking.apiKeyLeakageZero) report.acceptanceStatus = 'FAIL'
  const outputPath = join(outputDir, `real-llm-${runId}.json`)
  safeWrite(outputPath, report)
  safeWrite(join(outputDir, `real-llm-${runId}-human-review.json`), {
    runId,
    provider: report.provider,
    model: report.model,
    promptVersions: report.promptVersions,
    reviewer: '',
    reviewedAt: '',
    samples: report.humanReview.samples,
    instructions: '由人工逐项填写 PASS / NEEDS_REVISION / REJECT；不得由 LLM 代填。',
  })
  console.log(
    JSON.stringify(
      {
        acceptanceStatus: report.acceptanceStatus,
        provider: report.provider,
        model: report.model,
        requestedQuestions: report.requestedQuestions,
        REAL_LLM_ONLY: report.REAL_LLM_ONLY,
        SYSTEM_FINAL: report.SYSTEM_FINAL,
        humanReview: {
          status: report.humanReview.status,
          samples: report.humanReview.selectedSamples,
        },
        difficultySweep: report.difficultySweep,
        failures: report.failures,
        reportPath: outputPath,
        elapsedMs: Date.now() - startedAt,
      },
      null,
      2,
    ),
  )
  if (report.acceptanceStatus === 'FAIL') process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'REAL_LLM_EVALUATION_FAILED')
  process.exitCode = 1
})
