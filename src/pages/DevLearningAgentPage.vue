<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/layouts/AppShell.vue'
import AppButton from '@/components/common/AppButton.vue'
import AdaptiveLearningPlanPanel from '@/components/learning-agent/AdaptiveLearningPlanPanel.vue'
import { useLearningAgentStore } from '@/stores/learningAgentStore'
import {
  AGENT_SCENARIOS,
  createAgentScenario,
  AGENT_SIMULATION_TIME,
} from '@/data/learning-agent/scenarios'
import { AgentEvaluationService } from '@/services/learning-agent/agentEvaluationService'
import {
  LearningAgentSimulation,
  type SimulationAnswerMode,
} from '@/services/learning-agent/simulationService'
import { questionText } from '@/services/learning-agent/deterministicAnswerValidator'

const store = useLearningAgentStore()
const selected = ref('A'),
  seed = ref('phase17'),
  currentPoint = ref('AGENT_KP_CURRENT')
const evaluation = ref<ReturnType<AgentEvaluationService['evaluate']> | null>(null)
const evaluating = ref(false)
const context = computed(() => store.result?.context)
const decision = computed(() => store.result?.decision)
const state = computed(() =>
  context.value?.knowledgeState.knowledgePoints.find(
    (k) => k.knowledgePointId === context.value?.currentLearning.knowledgePointId,
  ),
)
const inputs = computed(() => store.simulation.snapshot)
const modes: Array<{ id: SimulationAnswerMode; label: string }> = [
  { id: 'CORRECT', label: '全部答对' },
  { id: 'INCORRECT', label: '答错' },
  { id: 'BORROWING_ERROR', label: '退位错误（含步骤）' },
  { id: 'CARRYING_ERROR', label: '进位错误（含步骤）' },
  { id: 'REPEATED_FAILURE', label: '连续失败' },
]
function percent(n?: number) {
  return n === undefined ? '—' : `${Math.round(n * 100)}%`
}
async function selectScenario() {
  store.reset(selected.value)
  currentPoint.value = 'AGENT_KP_CURRENT'
  await store.run(seed.value, currentPoint.value)
}
async function evaluate() {
  evaluating.value = true
  try {
    const cases = []
    for (const scenario of AGENT_SCENARIOS)
      cases.push({
        ...scenario,
        result: await new LearningAgentSimulation(createAgentScenario(scenario.id)).run(
          AGENT_SIMULATION_TIME,
        ),
      })
    evaluation.value = new AgentEvaluationService().evaluate(cases)
  } finally {
    evaluating.value = false
  }
}
onMounted(selectScenario)
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / Learning Agent">
    <main class="agent-page content-container">
      <header class="agent-header">
        <div>
          <p class="eyebrow">PHASE 18 · STRUCTURED GENERATION</p>
          <h1>教育 Agent 实验室</h1>
          <p>观察学习证据如何变成下一步行动。</p>
        </div>
        <span class="badge">SAMPLE · 仅开发模拟</span>
      </header>
      <p class="notice">
        本页使用原创内存样本。模拟作答通过既有 Evidence / Mastery
        引擎运行，不写入学生档案；生成内容通过校验后才展示。
      </p>
      <section class="panel controls" aria-label="模拟设置">
        <label
          >学习情境<select v-model="selected" :disabled="store.busy" @change="selectScenario">
            <option v-for="scenario in AGENT_SCENARIOS" :key="scenario.id" :value="scenario.id">
              {{ scenario.label }}
            </option>
          </select></label
        >
        <label
          >当前知识点<select v-model="currentPoint" :disabled="store.busy">
            <option
              v-for="point in inputs.curriculum.knowledgePoints"
              :key="point.id"
              :value="point.id"
            >
              {{ point.name }}
            </option>
          </select></label
        >
        <p class="real-only">真实模型生成</p>
        <label>生成种子<input v-model="seed" :disabled="store.busy" maxlength="80" /></label>
        <AppButton :disabled="store.busy" @click="store.run(seed, currentPoint)">{{
          store.busy ? '运行中…' : 'Run Agent'
        }}</AppButton>
      </section>
      <p v-if="store.error" class="notice error" role="alert">{{ store.error }}</p>
      <AdaptiveLearningPlanPanel
        :snapshot="inputs"
        :mode="store.generatorMode"
        :scenario="selected"
        :disabled="store.busy"
      />
      <section v-if="store.result?.questionGeneration" class="panel" aria-label="LLM 运行信息">
        <h2>LLM · {{ store.result.questionGeneration.status }}</h2>
        <p v-if="store.result.questionGeneration.fallbackUsed" class="notice error" role="status">
          真实模型未完成本次生成，已阻断，不展示回退内容。
        </p>
        <p class="muted">
          仅本机开发服务调用模型。模型不可用时停止生成。修复次数：{{
            store.result.questionGeneration.repairCount
          }}
          / 2
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Provider / Model</th>
                <th>Prompt / Schema</th>
                <th>Tokens（输入 / 输出 / 总计）</th>
                <th>耗时</th>
                <th>重试 / 修复</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(usage, index) in store.result.questionGeneration.usage" :key="index">
                <td>{{ usage.provider }} / {{ usage.model }}</td>
                <td>
                  {{ usage.promptId }} · {{ usage.promptVersion }} / {{ usage.schemaVersion }}
                </td>
                <td>
                  {{ usage.inputTokens ?? '—' }} / {{ usage.outputTokens ?? '—' }} /
                  {{ usage.totalTokens ?? '—' }}
                </td>
                <td>{{ usage.latencyMs }} ms</td>
                <td>{{ usage.retryCount }} / {{ usage.repairCount }}</td>
                <td>{{ usage.status }} {{ usage.errorType }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <div class="agent-grid">
        <section class="panel" aria-labelledby="agent-context">
          <p class="eyebrow">01 / CONTEXT</p>
          <h2 id="agent-context">学生与课程上下文</h2>
          <dl>
            <dt>学生档案</dt>
            <dd>{{ inputs.profile.studentId }}</dd>
            <dt>所在地区</dt>
            <dd>{{ inputs.profile.regionId }}</dd>
            <dt>教材</dt>
            <dd>{{ inputs.curriculum.textbook.versionName }}</dd>
            <dt>年级 / 学期 / 科目</dt>
            <dd>
              {{ inputs.curriculum.grade.name }} / {{ inputs.curriculum.semester.name }} /
              {{ inputs.curriculum.subject.name }}
            </dd>
            <dt>出版社</dt>
            <dd>{{ inputs.curriculum.publisher?.name }}</dd>
          </dl>
          <div class="metrics">
            <div>
              <strong>{{ percent(state?.masteryScore) }}</strong
              ><span>当前掌握度</span>
            </div>
            <div>
              <strong>{{ percent(state?.recentCorrectRate) }}</strong
              ><span>近期正确率</span>
            </div>
            <div>
              <strong>{{ state?.consecutiveIncorrect ?? 0 }}</strong
              ><span>连续错误</span>
            </div>
          </div>
          <p>薄弱信号：{{ state?.weaknessSignals.join(' / ') || '暂无' }}</p>
          <p>STRATEGY_V1：{{ context?.strategyRecommendations.type ?? '尚未运行' }}</p>
          <details>
            <summary>近期作答、复习队列与学习历史</summary>
            <pre>{{
              JSON.stringify(
                {
                  attempts: context?.recentAttempts,
                  reviewQueue: context?.reviewQueueSummary,
                  wrongBook: context?.wrongBookSummary,
                  history: context?.learningHistorySummary,
                  dailyPlan: context?.dailyPlanContext,
                },
                null,
                2,
              )
            }}</pre>
          </details>
        </section>
        <section class="panel decision-panel" aria-labelledby="agent-decision">
          <p class="eyebrow">02 / DECISION</p>
          <h2 id="agent-decision">下一步学习决策</h2>
          <p class="decision-action" aria-live="polite">{{ decision?.action ?? 'BLOCKED' }}</p>
          <p v-if="store.previousAction">
            {{ store.previousAction }} → {{ decision?.action }} · 第 {{ store.round }} 轮
          </p>
          <p v-if="decision">
            目标：{{
              inputs.curriculum.knowledgePoints.find(
                (k) => k.id === decision?.targetKnowledgePointId,
              )?.name
            }}
          </p>
          <div class="metrics">
            <div>
              <strong>{{ percent(decision?.confidence) }}</strong
              ><span>证据置信度</span>
            </div>
            <div>
              <strong>{{ decision?.difficulty ?? '—' }}</strong
              ><span>任务难度 0～1</span>
            </div>
            <div>
              <strong>{{ store.result?.status ?? 'IDLE' }}</strong
              ><span>任务状态</span>
            </div>
          </div>
          <ul class="reasons">
            <li v-for="reason in decision?.reasons" :key="reason.code">
              <strong>{{ reason.code }}</strong>
              <p>{{ reason.message }}</p>
              <small>{{ reason.evidenceType }} · {{ reason.evidenceRef }}</small>
            </li>
          </ul>
          <details>
            <summary>Activity Plan 与证据引用</summary>
            <pre>{{
              JSON.stringify(
                { activity: store.result?.activityPlan, evidenceRefs: decision?.evidenceRefs },
                null,
                2,
              )
            }}</pre>
          </details>
        </section>
      </div>
      <section class="panel" aria-labelledby="agent-questions">
        <p class="eyebrow">03 / VALIDATED RESOURCES</p>
        <h2 id="agent-questions">生成任务与模拟作答</h2>
        <template v-if="store.result?.status === 'READY'">
          <ol class="questions">
            <li v-for="question in store.result.generatedResources.questions" :key="question.id">
              <span>{{ questionText(question) }}</span
              ><small>{{ question.difficulty }} · SAMPLE</small>
            </li>
          </ol>
          <div class="answer-buttons">
            <AppButton
              v-for="mode in modes"
              :key="mode.id"
              variant="secondary"
              :disabled="store.busy"
              @click="store.answer(mode.id, seed)"
              >{{ mode.label }}</AppButton
            >
          </div>
          <p class="muted">
            “答错”和“连续失败”模拟本轮连续错答；错误模式需要本批存在对应题目。进位练习可选择“基础加法”。
          </p>
        </template>
        <p v-else role="status">当前任务未通过全部校验，生成资源已隐藏。请查看下方校验结果。</p>
        <details v-if="store.simulation.lastAnalysis.length" open>
          <summary>最近 Answer Analysis</summary>
          <pre>{{ JSON.stringify(store.simulation.lastAnalysis, null, 2) }}</pre>
        </details>
      </section>
      <section class="panel">
        <p class="eyebrow">04 / STUDENT STATE</p>
        <h2>Student Knowledge State</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>知识点</th>
                <th>掌握度</th>
                <th>作答 / 正确 / 错误</th>
                <th>近期正确率</th>
                <th>错误类型</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="point in context?.knowledgeState.knowledgePoints"
                :key="point.knowledgePointId"
              >
                <td>
                  {{
                    inputs.curriculum.knowledgePoints.find((k) => k.id === point.knowledgePointId)
                      ?.name
                  }}
                </td>
                <td>{{ percent(point.masteryScore) }}</td>
                <td>
                  {{ point.attemptCount }} / {{ point.correctCount }} / {{ point.incorrectCount }}
                </td>
                <td>{{ percent(point.recentCorrectRate) }}</td>
                <td>{{ point.errorPatterns.map((p) => p.code).join(', ') || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <div class="agent-grid">
        <section class="panel">
          <p class="eyebrow">05 / VALIDATION</p>
          <h2>Validation Results · {{ store.result?.validation.status }}</h2>
          <ul class="checks">
            <li v-for="(check, index) in store.result?.validation.checks" :key="index">
              <span :class="{ failed: check.status !== 'PASS' }">{{ check.status }}</span>
              <div>
                {{ check.stage }} · {{ check.code }}<small>{{ check.resourceId }}</small>
              </div>
            </li>
          </ul>
        </section>
        <section class="panel">
          <p class="eyebrow">06 / TRACE</p>
          <h2>Agent Trace</h2>
          <p class="muted">系统事件与结构化依据</p>
          <ol class="trace">
            <li v-for="event in store.result?.trace.events" :key="event.sequence">
              <details>
                <summary>{{ event.sequence }} · {{ event.event }}</summary>
                <pre>{{ JSON.stringify(event.data, null, 2) }}</pre>
              </details>
            </li>
          </ol>
        </section>
      </div>
      <section class="panel">
        <div class="evaluation-heading">
          <div>
            <p class="eyebrow">SCENARIO EVALUATION</p>
            <h2>确定性场景验收</h2>
          </div>
          <AppButton variant="secondary" :disabled="evaluating" @click="evaluate">{{
            evaluating ? '评估中…' : '运行 A～H 场景'
          }}</AppButton>
        </div>
        <p v-if="evaluation" aria-live="polite">
          {{ evaluation.passed }} / {{ evaluation.total }} 个场景通过
        </p>
        <ul v-if="evaluation" class="evaluation-list">
          <li v-for="item in evaluation.results" :key="item.id">
            {{ item.id }} · {{ item.expected }} → {{ item.actual }} ·
            {{ item.passed ? 'PASS' : 'FAIL' }}
          </li>
        </ul>
      </section>
    </main>
  </AppShell>
</template>

<style scoped>
.agent-page {
  padding-block: 32px 64px;
  color: #233750;
}
.agent-header,
.evaluation-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
h1 {
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 800;
  margin: 8px 0;
}
h2 {
  font-size: 19px;
  font-weight: 750;
  margin: 6px 0 18px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #53796d;
}
.badge {
  border: 1px solid #b8d6c7;
  border-radius: 99px;
  padding: 8px 12px;
  font-size: 12px;
  white-space: nowrap;
  background: #edf8f1;
}
.notice {
  background: #eef5fa;
  border-radius: 12px;
  padding: 14px 16px;
  margin-block: 20px;
  font-size: 13px;
  line-height: 1.8;
}
.error {
  background: #fff1ed;
  color: #9d3d22;
}
.panel {
  padding: 24px;
  border: 1px solid #dce5ed;
  border-radius: 18px;
  background: white;
  min-width: 0;
  margin-top: 20px;
}
.controls {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr auto;
  align-items: end;
  gap: 16px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
}
input,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd6e1;
  padding: 11px;
  border-radius: 9px;
  background: white;
}
.agent-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
dl {
  display: grid;
  grid-template-columns: 125px 1fr;
  gap: 10px;
  font-size: 13px;
}
dt {
  color: #687a8e;
}
dd {
  overflow-wrap: anywhere;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-block: 22px;
}
.metrics strong {
  display: block;
  font-size: 22px;
}
.metrics span,
.muted {
  font-size: 12px;
  color: #687a8e;
}
.decision-panel {
  border-top: 4px solid #57a88d;
}
.decision-action {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #23765b;
  margin: 12px 0;
}
.reasons {
  display: grid;
  gap: 12px;
  margin: 20px 0;
  padding: 0;
  list-style: none;
}
.reasons strong {
  font-size: 12px;
}
.reasons p {
  font-size: 14px;
  margin: 5px 0;
}
small {
  color: #697c91;
  font-size: 11px;
  overflow-wrap: anywhere;
}
summary {
  cursor: pointer;
  font-size: 13px;
  padding: 10px 0;
  overflow-wrap: anywhere;
}
pre {
  font-size: 11px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f5f8fb;
  padding: 12px;
  border-radius: 8px;
  max-height: 350px;
  overflow: auto;
}
.questions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  list-style-position: inside;
  padding: 0;
  margin-block: 20px;
}
.questions li {
  background: #f7fafb;
  padding: 16px;
  border-radius: 12px;
}
.questions span {
  font-size: 18px;
}
.questions small {
  display: block;
  margin-top: 8px;
}
.answer-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.muted {
  margin-block: 12px;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
  font-size: 13px;
}
th,
td {
  padding: 12px;
  border-bottom: 1px solid #e6edf2;
  white-space: nowrap;
}
.checks {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
  max-height: 440px;
  overflow: auto;
}
.checks li {
  display: flex;
  gap: 12px;
  font-size: 11px;
}
.checks span {
  color: #297057;
  min-width: 45px;
}
.checks .failed {
  color: #a14724;
}
.checks small {
  display: block;
}
.trace {
  list-style: none;
  padding: 0;
}
.trace li {
  border-left: 2px solid #dce9e3;
  padding-left: 14px;
}
.evaluation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  list-style: none;
  padding: 0;
  font-size: 12px;
}
@media (max-width: 900px) {
  .controls {
    grid-template-columns: 1fr 1fr;
  }
  .agent-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
@media (max-width: 520px) {
  .agent-page {
    padding-top: 18px;
  }
  .agent-header,
  .evaluation-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .panel {
    padding: 17px;
  }
  .controls {
    grid-template-columns: 1fr;
  }
  dl {
    grid-template-columns: 96px 1fr;
  }
  .metrics strong {
    font-size: 18px;
  }
}
</style>
