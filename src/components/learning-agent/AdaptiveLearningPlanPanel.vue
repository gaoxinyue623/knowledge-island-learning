<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, toRaw, triggerRef, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import AdaptivePlanReportPanel from './AdaptivePlanReportPanel.vue'
import type { LearningAction, LearningAgentSnapshot } from '@/types/learning-agent'
import type { QuestionGeneratorMode } from '@/types/llm'
import { AdaptiveLearningPlan } from '@/services/learning-agent/adaptiveLearningPlan'
import {
  adaptivePlanCheckpointScope,
  clearAdaptivePlanCheckpoint,
  loadAdaptivePlanCheckpoint,
  saveAdaptivePlanCheckpoint,
  type SavedAdaptivePlanCheckpoint,
} from '@/services/learning-agent/adaptivePlanCheckpointStorage'
import { questionText } from '@/services/learning-agent/deterministicAnswerValidator'
import { normalizeCalculationInput } from '@/services/question-engine/answerValidator'

const props = defineProps<{
  snapshot: LearningAgentSnapshot
  mode: QuestionGeneratorMode
  scenario: string
  disabled: boolean
}>()
const plan = shallowRef<AdaptiveLearningPlan | null>(null)
const checkpoint = shallowRef<SavedAdaptivePlanCheckpoint | null>(null)
const activeScope = ref('')
const saveMessage = ref('')
let disposed = false
const taskLimit = ref(3)
const index = ref(0)
const drafts = ref<Record<string, string>>({})
const names = ref<Record<string, string>>({})
const source = ref('')
const actions: Record<LearningAction, string> = {
  CONTINUE: '继续学习',
  REINFORCE: '巩固练习',
  SIMPLIFY: '降低难度',
  REMEDIATE: '补充前置知识',
  REVIEW: '到期复习',
  NEXT: '学习下一知识点',
  CHALLENGE: '挑战练习',
}
const questions = computed(() => plan.value?.current?.generatedResources.questions ?? [])
const question = computed(() => questions.value[index.value])
const last = computed(() => plan.value?.completed.at(-1))
const report = computed(() => plan.value?.report ?? null)
const checkpointScope = computed(() =>
  adaptivePlanCheckpointScope(
    props.snapshot.dataset,
    props.snapshot.profile.studentId,
    props.snapshot.curriculum.textbook.id,
    props.scenario,
    props.mode,
  ),
)
const answered = computed(
  () => questions.value.filter((q) => valid(drafts.value[q.id] ?? '')).length,
)
const correctCount = computed(
  () =>
    plan.value?.completed.reduce(
      (sum, row) => sum + row.analyses.filter((a) => a.correct).length,
      0,
    ) ?? 0,
)
const totalCount = computed(
  () => plan.value?.completed.reduce((sum, row) => sum + row.analyses.length, 0) ?? 0,
)
function valid(value: string) {
  const normalized = normalizeCalculationInput(value)
  return /^-?\d+(\.\d+)?$/.test(normalized) && Number.isFinite(Number(normalized))
}
async function next() {
  if (!plan.value) return
  const active = plan.value
  const pending = active.next()
  triggerRef(plan)
  await pending
  if (disposed) return
  index.value = 0
  drafts.value = {}
  triggerRef(plan)
  persist()
}
function refreshCheckpoint() {
  checkpoint.value = loadAdaptivePlanCheckpoint(checkpointScope.value)
}
function persist() {
  if (!plan.value || plan.value.busy || !activeScope.value || disposed) return false
  const saved = saveAdaptivePlanCheckpoint(activeScope.value, plan.value, {
    index: index.value,
    drafts: toRaw(drafts.value),
  })
  saveMessage.value = saved
    ? '答题进度已保存，可在当前标签页刷新后继续。'
    : '暂时无法保存进度，仍可继续答题；刷新或离开可能丢失本次进度。'
  return saved
}
function resume() {
  if (!checkpoint.value || props.disabled) return
  try {
    const saved = checkpoint.value
    const restored = AdaptiveLearningPlan.restore(saved)
    names.value = Object.fromEntries(
      saved.snapshot.curriculum.knowledgePoints.map((p) => [p.id, p.name]),
    )
    source.value = `${props.scenario} · ${saved.mode}`
    activeScope.value = checkpointScope.value
    plan.value = restored
    taskLimit.value = restored.taskLimit
    checkpoint.value = null
    index.value = saved.draft?.index ?? 0
    drafts.value = saved.draft?.drafts ?? {}
    triggerRef(plan)
    persist()
  } catch {
    clearAdaptivePlanCheckpoint(checkpointScope.value)
    checkpoint.value = null
  }
}
function discardCheckpoint() {
  clearAdaptivePlanCheckpoint(checkpointScope.value)
  checkpoint.value = null
}
function endPlan() {
  clearAdaptivePlanCheckpoint(activeScope.value)
  plan.value = null
  activeScope.value = ''
  saveMessage.value = ''
  refreshCheckpoint()
}
function pausePlan() {
  if (!plan.value || plan.value.busy || !persist()) return
  plan.value = null
  activeScope.value = ''
  refreshCheckpoint()
}
async function start() {
  if (props.disabled || plan.value || checkpoint.value) return
  activeScope.value = checkpointScope.value
  clearAdaptivePlanCheckpoint(checkpointScope.value)
  checkpoint.value = null
  names.value = Object.fromEntries(
    props.snapshot.curriculum.knowledgePoints.map((p) => [p.id, p.name]),
  )
  source.value = `${props.scenario} · ${props.mode}`
  // Snapshot is a plain in-memory simulation object, copied by the session service.
  plan.value = new AdaptiveLearningPlan(
    // Props are reactive proxies in Vue; the simulation owns a plain snapshot.
    toRaw(props.snapshot),
    taskLimit.value,
    props.mode,
    crypto.randomUUID(),
  )
  await next()
}
async function continueLearning() {
  if (plan.value?.status !== 'COMPLETE') return
  plan.value = plan.value.createFollowUp()
  await next()
}
async function advance() {
  if (!question.value || !valid(drafts.value[question.value.id] ?? '') || plan.value?.busy) return
  if (index.value < questions.value.length - 1) {
    index.value++
    return
  }
  if (answered.value !== questions.value.length || !plan.value) return
  const pending = plan.value.submit(
    questions.value.map((q) => ({
      questionId: q.id,
      answer: { type: 'calculation' as const, value: drafts.value[q.id]! },
    })),
  )
  triggerRef(plan)
  await pending
  if (disposed) return
  triggerRef(plan)
  persist()
}
refreshCheckpoint()
watch(checkpointScope, () => {
  if (!plan.value) refreshCheckpoint()
})
watch(
  [drafts, index],
  () => {
    if (plan.value?.status === 'READY') persist()
  },
  { deep: true, flush: 'post' },
)
onBeforeUnmount(() => {
  persist()
  disposed = true
})
</script>

<template>
  <section
    class="adaptive-plan"
    aria-labelledby="adaptive-plan-title"
    :aria-busy="plan?.busy || undefined"
  >
    <header>
      <div>
        <p class="eyebrow">PHASE 24 · RESUMABLE PRACTICE</p>
        <h2 id="adaptive-plan-title">个性化学习计划</h2>
      </div>
      <span class="tag">隔离练习 · SAMPLE</span>
    </header>
    <p class="description">
      根据作答安排下一组任务。题组、已填写答案和答题位置保存在当前标签页的会话中，可暂停或刷新后继续。
    </p>
    <div v-if="!plan" class="start-controls">
      <div v-if="checkpoint" class="resume-card" role="status">
        <strong>{{
          checkpoint.status === 'COMPLETE'
            ? '发现已完成的 SAMPLE 学习计划'
            : '发现未结束的 SAMPLE 学习计划'
        }}</strong>
        <p>可以恢复答案草稿、答题位置、已完成任务和复盘结果。</p>
        <div class="buttons">
          <AppButton :disabled="disabled" @click="resume">恢复计划</AppButton>
          <AppButton variant="ghost" @click="discardCheckpoint">丢弃检查点</AppButton>
        </div>
      </div>
      <label
        >本次任务数<select v-model.number="taskLimit" aria-label="本次任务数">
          <option v-for="n in 5" :key="n" :value="n">{{ n }} 组</option>
        </select></label
      >
      <p>每组 5 题，最多 {{ taskLimit * 5 }} 题。基于上方学习情境调用真实模型。</p>
      <AppButton :disabled="disabled || Boolean(checkpoint)" @click="start"
        >创建并开始计划</AppButton
      >
    </div>
    <template v-else>
      <p v-if="saveMessage" class="description" role="status" aria-label="进度保存状态">
        {{ saveMessage }}
      </p>
      <div class="plan-progress">
        <p>{{ source }} · 已完成 {{ plan.completed.length }} / {{ plan.taskLimit }} 组</p>
        <progress :value="plan.completed.length" :max="plan.taskLimit" aria-label="计划完成进度" />
      </div>
      <p v-if="plan.busy" role="status">
        {{ plan.status === 'PREPARING' ? '正在准备下一组任务…' : '正在判分并更新学习证据…' }}
      </p>
      <p v-if="plan.error" role="alert" class="plan-error">{{ plan.error }}</p>
      <template v-if="plan.current?.decision && question">
        <h3>
          第 {{ plan.completed.length + 1 }} 组 · {{ actions[plan.current.decision.action] }} ·
          {{ names[plan.current.decision.targetKnowledgePointId] }}
        </h3>
        <ul class="reasons">
          <li v-for="reason in plan.current.decision.reasons" :key="reason.code">
            {{ reason.message }}
          </li>
        </ul>
        <p v-if="plan.current.questionGeneration?.fallbackUsed" class="plan-error" role="status">
          真实模型未完成本组任务，已阻断，未展示回退题。
        </p>
        <form @submit.prevent="advance">
          <p class="counter" aria-live="polite">
            第 {{ index + 1 }} / {{ questions.length }} 题 · 已填写 {{ answered }} 题
          </p>
          <p class="stem">{{ questionText(question) }}</p>
          <label :for="`plan-answer-${index}`">你的答案</label>
          <input
            :id="`plan-answer-${index}`"
            :key="question.id"
            v-model="drafts[question.id]"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            maxlength="32"
            :disabled="plan.busy"
          />
          <p v-if="drafts[question.id] && !valid(drafts[question.id]!)" class="plan-error">
            请输入有效数字。
          </p>
          <div class="buttons">
            <AppButton variant="secondary" :disabled="index === 0 || plan.busy" @click="index--"
              >上一题</AppButton
            >
            <AppButton
              type="submit"
              :disabled="
                plan.busy ||
                !valid(drafts[question.id] ?? '') ||
                (index === questions.length - 1 && answered !== questions.length)
              "
              >{{ index === questions.length - 1 ? '提交本组答案' : '下一题' }}</AppButton
            >
          </div>
        </form>
      </template>
      <section v-if="last && ['REVIEW', 'COMPLETE'].includes(plan.status)" aria-label="本组反馈">
        <h3>{{ plan.status === 'COMPLETE' ? '本次计划已完成' : '本组练习已完成' }}</h3>
        <p role="status">
          本组答对 {{ last.analyses.filter((a) => a.correct).length }} /
          {{ last.analyses.length }} 题；计划累计答对 {{ correctCount }} / {{ totalCount }} 题。
        </p>
        <ul class="feedback">
          <li v-for="(item, i) in last.task.generatedResources.questions" :key="item.id">
            <strong
              >{{ questionText(item) }} ·
              {{ last.analyses[i]?.correct ? '回答正确' : '再看一看' }}</strong
            >
            <p>{{ item.explanation.summary.map((b) => b.text).join(' ') }}</p>
          </li>
        </ul>
        <AppButton v-if="plan.status === 'REVIEW'" @click="next"
          >根据本组结果安排下一任务</AppButton
        >
      </section>
      <AppButton v-if="plan.status === 'BLOCKED'" @click="next">重试准备任务</AppButton>
      <ol v-if="plan.completed.length" class="task-history" aria-label="已完成任务">
        <li v-for="(row, i) in plan.completed" :key="i">
          第 {{ i + 1 }} 组 · {{ actions[row.task.decision!.action] }} ·
          {{ names[row.task.decision!.targetKnowledgePointId] }} ·
          {{ row.analyses.filter((a) => a.correct).length }} / {{ row.analyses.length }} 题正确
        </li>
      </ol>
      <AdaptivePlanReportPanel v-if="report" :report="report" />
      <AppButton
        v-if="plan.status === 'COMPLETE' && report?.recommendation"
        @click="continueLearning"
        >按建议继续练习（{{ plan.taskLimit }} 组）</AppButton
      >
      <p class="description">
        本计划使用独立的模拟数据，不写入正式学生档案或每日计划；上方设置的变更会在新计划中生效。
      </p>
      <AppButton variant="ghost" :disabled="plan.busy" @click="endPlan">{{
        plan.status === 'COMPLETE' ? '创建新计划' : '结束本次计划'
      }}</AppButton>
      <AppButton
        v-if="plan.status !== 'COMPLETE'"
        variant="secondary"
        :disabled="plan.busy"
        @click="pausePlan"
        >保存并暂停</AppButton
      >
    </template>
  </section>
</template>

<style scoped>
.adaptive-plan {
  margin-top: 20px;
  padding: 24px;
  border: 1px solid #bfd8cf;
  border-radius: 18px;
  background: #f7fcfa;
  min-width: 0;
}
header,
.start-controls,
.buttons,
.plan-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
header {
  justify-content: space-between;
}
.eyebrow {
  color: #39735d;
  font-size: 11px;
  letter-spacing: 0.1em;
  font-weight: 800;
}
h2 {
  font-size: 22px;
  font-weight: 750;
  margin: 6px 0;
}
h3 {
  font-size: 18px;
  font-weight: 700;
  margin-block: 16px 8px;
}
.tag {
  background: #e3f1ea;
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 12px;
}
.description,
.counter {
  font-size: 13px;
  color: #526777;
  line-height: 1.8;
  margin-block: 12px;
}
.start-controls p,
.plan-progress p,
.reasons,
.feedback,
.task-history {
  font-size: 14px;
}
.resume-card {
  flex: 1 1 100%;
  padding: 14px 16px;
  border: 1px solid #b8d6c7;
  border-radius: 12px;
  background: #edf8f1;
}
.resume-card p {
  margin-block: 4px 8px;
}
select,
input {
  display: block;
  border: 1px solid #aebecb;
  background: white;
  border-radius: 9px;
  padding: 10px;
  margin-block: 6px 12px;
  max-width: 100%;
}
input {
  width: 100%;
  font-size: 20px;
}
form {
  max-width: 420px;
  margin-block: 20px;
}
.stem {
  font-size: 28px;
  font-weight: 700;
  margin-block: 12px;
}
.plan-error {
  color: #913a26;
  font-size: 13px;
  padding-block: 8px;
}
.feedback,
.task-history {
  padding-left: 20px;
  margin-block: 16px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.feedback li {
  margin-block: 10px;
}
progress {
  accent-color: #32836b;
  max-width: 100%;
}
@media (max-width: 520px) {
  .adaptive-plan {
    padding: 17px;
  }
  .buttons {
    gap: 8px;
  }
}
</style>
