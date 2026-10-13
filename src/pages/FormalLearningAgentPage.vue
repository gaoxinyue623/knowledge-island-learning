<script setup lang="ts">
import { createUuid } from '@/utils/uuid'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormalAiPractice from '@/components/knowledge-point/FormalAiPractice.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppShell from '@/layouts/AppShell.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { useCurriculumStore } from '@/stores/curriculumStore'
import {
  runtimeLearningAgentDecisionService,
  saveFormalAgentLaunch,
} from '@/services/learning-agent'
import type { LearningAgentDecisionResult } from '@/types/learning-agent'
import {
  recoverFormalRun,
  startFormalRun,
  bindFormalRun,
  type FormalStudyRun,
  type FormalAgentLaunch,
} from '@/services/learning-agent/formalAgentLaunchStorage'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { accountState, syncAccount } from '@/services/account/accountService'
import { questionSessionStorage } from '@/services/question-engine'
import { difficultyLevel } from '@/services/learning-agent/questionSelection'
import type { SubjectCode } from '@/types'

const route = useRoute()
const router = useRouter()
const { profileId } = useLearningProfile()
const curriculum = useCurriculumStore()
const loading = ref(true)
const error = ref('')
const result = ref<LearningAgentDecisionResult | null>(null)
const subjectOptions: Array<{ value: SubjectCode; label: string }> = [
  { value: 'MATH', label: '数学' },
  { value: 'CHINESE', label: '语文' },
  { value: 'ENGLISH', label: '英语' },
]
const selectedSubject = ref<SubjectCode>('MATH')
const run = ref<FormalStudyRun | null>(null)
const resume = ref<FormalAgentLaunch | null>(null)
const taskLimit = ref(3)
const starting = ref(false)
const adviceRefreshing = ref(false)
const aiKnowledgePointId = ref('')
const aiDifficulty = ref(0.4)
const aiMessage = ref('')
const runSummary = computed(() => {
  const ids = new Set(run.value?.completedLaunchIds ?? [])
  const sessions = questionSessionStorage
    .loadAll()
    .filter((s) => [...ids].some((id) => s.id.endsWith(id)))
  const attempts = sessions.flatMap((s) =>
    s.attempts.filter(
      (a) => a.submitted && ['correct', 'incorrect'].includes(a.result?.status ?? ''),
    ),
  )
  return {
    total: attempts.length,
    correct: attempts.filter((a) => a.result?.status === 'correct').length,
  }
})
const newTaskId = ref('')
const launchId = computed(() => {
  const decisionId = result.value?.decision?.decisionId
  return resume.value?.id ?? (decisionId ? `formal:${decisionId}:${newTaskId.value}` : '')
})
const target = computed(
  () =>
    result.value?.context?.mapNodes.find(
      (node) =>
        node.knowledgePointId === result.value?.decision?.targetKnowledgePointId &&
        node.status !== 'locked',
    ) ?? null,
)
const textbookId = computed(() => {
  const profile = curriculum.curriculumProfile
  if (!profile) return ''
  return (
    {
      MATH: profile.mathTextbookVersionId,
      CHINESE: profile.chineseTextbookVersionId,
      ENGLISH: profile.englishTextbookVersionId,
    }[selectedSubject.value] ?? ''
  )
})
const availableSubjects = computed(() =>
  subjectOptions.filter(({ value }) => {
    const profile = curriculum.curriculumProfile
    return Boolean(
      profile?.[
        value === 'MATH'
          ? 'mathTextbookVersionId'
          : value === 'CHINESE'
            ? 'chineseTextbookVersionId'
            : 'englishTextbookVersionId'
      ],
    )
  }),
)
const actionLabels: Record<string, string> = {
  NEXT: '进入下一步',
  REINFORCE: '巩固练习',
  REVIEW: '到期复习',
  REMEDIATE: '先补前置知识',
  CHALLENGE: '挑战练习',
  SIMPLIFY: '降低难度',
  CONTINUE: '继续学习',
}

async function load() {
  loading.value = true
  error.value = ''
  result.value = null
  aiMessage.value = ''
  try {
    if (!profileId.value || !textbookId.value) throw new Error('请先完成教材选择，再查看学习建议。')
    const restored = recoverFormalRun(profileId.value, textbookId.value, taskLimit.value)
    run.value = restored.run
    resume.value = restored.launch
    newTaskId.value = createUuid()
    result.value = await runtimeLearningAgentDecisionService.prepare(
      profileId.value,
      textbookId.value,
    )
    if (result.value.status !== 'READY' || !result.value.decision || !result.value.context)
      throw new Error(
        result.value.validation?.checks.some((c) => c.code === 'AGENT_NO_AVAILABLE_KNOWLEDGE_POINT')
          ? '当前知识点还没有已审核练习，可以先回教材继续学习。'
          : '当前学习资料还不足以生成建议，请先完成教材选择。',
      )
    if (resume.value) {
      result.value.decision = resume.value.decision
      result.value.activityPlan = resume.value.decision.recommendedActivity
    }
    if (!target.value?.unitId || !target.value.lessonId)
      throw new Error('当前建议暂时找不到对应课程，请重新选择学科。')
    aiKnowledgePointId.value = target.value.knowledgePointId
    aiDifficulty.value = result.value.activityPlan?.difficulty ?? 0.4
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '暂时无法读取学习状态，请稍后重试。'
  } finally {
    loading.value = false
  }
}

async function refreshAdvice() {
  aiMessage.value = 'AI 练习结果已保存。'
  if (resume.value) {
    aiMessage.value += '下一小段会参考这次练习调整。'
    return
  }
  adviceRefreshing.value = true
  const activeProfile = profileId.value,
    book = textbookId.value
  try {
    const next = await runtimeLearningAgentDecisionService.prepare(activeProfile, book)
    if (activeProfile !== profileId.value || book !== textbookId.value) return
    if (next.status !== 'READY' || !next.decision || !next.context)
      throw new Error('暂时无法更新下一步建议，可稍后重新读取。')
    result.value = next
    aiMessage.value += '下一步建议已更新。'
  } catch (caught) {
    aiMessage.value += caught instanceof Error ? caught.message : '建议暂时无法刷新。'
  } finally {
    adviceRefreshing.value = false
  }
}

function defaultSubject(): SubjectCode {
  const requested = String(route.query.subject ?? '').toUpperCase()
  if (requested === 'MATH' || requested === 'CHINESE' || requested === 'ENGLISH') {
    const hasTextbook = availableSubjects.value.some((option) => option.value === requested)
    if (hasTextbook) return requested
  }
  return availableSubjects.value[0]?.value ?? 'MATH'
}

async function selectSubject(value: string) {
  if (!availableSubjects.value.some((option) => option.value === value)) return
  selectedSubject.value = value as SubjectCode
  await router.replace({ query: { ...route.query, subject: selectedSubject.value } })
  await load()
}

async function startPractice() {
  if (starting.value || adviceRefreshing.value) return
  starting.value = true
  try {
    const current = result.value
    const context = target.value
    const decision = current?.decision
    if (
      !current ||
      current.status !== 'READY' ||
      !context?.unitId ||
      !context.lessonId ||
      !decision ||
      !launchId.value
    )
      return
    const launch = resume.value ?? {
      id: launchId.value,
      profileId: profileId.value,
      textbookId: textbookId.value,
      decision,
      createdAt: new Date().toISOString(),
    }
    if (!saveFormalAgentLaunch(launch)) {
      error.value = '练习绑定暂时无法保存，请重新试一次。'
      return
    }
    if (!resume.value) {
      if (!run.value || run.value.status === 'completed')
        run.value = startFormalRun(profileId.value, textbookId.value, taskLimit.value)
      bindFormalRun(run.value, launch)
    }
    if (accountState.username) {
      await syncAccount()
      if (accountState.conflict) return
    }
    await router.push({
      path: '/assessment',
      query: {
        textbookId: textbookId.value,
        unitId: context.unitId,
        lessonId: context.lessonId,
        knowledgePointId: context.knowledgePointId,
        source: decision.action === 'REVIEW' ? 'wrong_book' : 'lesson_practice',
        agentLaunchId: launchId.value,
        agentSubject: selectedSubject.value,
        sessionScope: launchId.value,
        returnTo: '/learning-agent',
      },
    })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '任务暂时无法保存。'
  } finally {
    starting.value = false
  }
}

onMounted(() => {
  selectedSubject.value = defaultSubject()
  void load()
})
</script>

<template>
  <AppShell show-bottom-nav context="学习建议">
    <main class="formal-agent-page content-container">
      <header class="formal-agent-page__header">
        <p class="formal-agent-page__eyebrow">正式学习路径</p>
        <h1>今天先学什么？</h1>
        <p>每完成一小段，会根据最新答案调整下一步。可以随时离开，登录同一账号继续。</p>
        <p v-if="run">
          本次学习已完成 {{ run.completedLaunchIds.length }} / {{ run.taskLimit }} 小段{{
            run.status === 'completed' ? '，本次安排完成啦！' : ''
          }}
        </p>
        <p v-if="runSummary.total" role="status">
          本次已答 {{ runSummary.total }} 题，答对
          {{ runSummary.correct }} 题。下一步会根据这些答案调整。
        </p>
        <label v-if="!run || run.status === 'completed'"
          >本次学习量<select v-model.number="taskLimit">
            <option :value="1">1 小段</option>
            <option :value="3">3 小段</option>
            <option :value="5">5 小段</option>
          </select></label
        >
      </header>
      <label class="formal-agent-page__subject" for="formal-agent-subject">
        <span>学习科目</span>
        <select
          id="formal-agent-subject"
          :value="selectedSubject"
          :disabled="loading || adviceRefreshing || starting"
          aria-label="学习科目"
          @change="selectSubject(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in availableSubjects" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <AppLoading v-if="loading" label="正在读取学习状态" />
      <RouterLink v-if="!loading && error" to="/learning-map">回教材继续学习 →</RouterLink>
      <AppErrorState
        v-if="!loading && error"
        title="学习建议暂时不可用"
        :description="error"
        @retry="load"
      />
      <template
        v-if="!loading && !error && result?.decision && result.context && result.activityPlan"
      >
        <section class="formal-agent-page__decision" aria-labelledby="agent-decision-title">
          <div>
            <p class="formal-agent-page__eyebrow">
              {{ resume ? '继续上次的探索' : '根据最近的学习表现' }}
            </p>
            <h2 id="agent-decision-title">
              {{ actionLabels[result.decision.action] ?? result.decision.action }}
            </h2>
            <p>{{ result.decision.reasons[0]?.message ?? '根据最近学习证据安排下一步。' }}</p>
          </div>
          <div class="formal-agent-page__confidence" aria-label="学习证据充分度">
            <strong>{{ Math.round(result.decision.confidence * 100) }}%</strong>
            <span>学习证据充分度</span>
          </div>
        </section>
        <section class="formal-agent-page__plan" aria-label="练习计划">
          <div>
            <span>目标知识点</span
            ><strong>{{
              productionCurriculumIndex.knowledgePoints.find(
                (p) => p.id === target?.knowledgePointId,
              )?.name ?? '下一小步'
            }}</strong>
          </div>
          <div>
            <span>预计题量</span
            ><strong>{{ result.activityPlan.estimatedQuestionCount }} 题</strong>
          </div>
          <div>
            <span>难度</span
            ><strong
              >{{
                (
                  result.activityPlan.actualDifficulty ??
                  difficultyLevel(result.activityPlan.difficulty)
                ).toFixed(1)
              }}
              / 5</strong
            >
          </div>
          <p v-if="result.activityPlan.selectionNote">{{ result.activityPlan.selectionNote }}</p>
        </section>
        <FormalAiPractice
          v-if="target"
          :textbook-id="textbookId"
          :knowledge-point-id="aiKnowledgePointId"
          :difficulty="aiDifficulty"
          @completed="refreshAdvice"
        />
        <p v-if="aiMessage" role="status">{{ aiMessage }}</p>
        <p v-if="adviceRefreshing" role="status">正在根据 AI 练习更新下一步……</p>
        <p class="formal-agent-page__notice" role="status">
          下方“开始正式练习”使用已审核题库；提交后才会更新课程学习记录。
        </p>
        <AppButton
          size="lg"
          full-width
          icon-right="arrow-right"
          :disabled="starting || adviceRefreshing"
          @click="startPractice"
          >{{
            resume ? '继续上次练习' : run?.status === 'active' ? '继续下一小段' : '开始正式练习'
          }}</AppButton
        >
      </template>
    </main>
  </AppShell>
</template>

<style scoped>
.formal-agent-page {
  padding-block: 32px 56px;
  overflow-wrap: anywhere;
}
.formal-agent-page__header {
  margin-bottom: 24px;
}
.formal-agent-page__subject {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--color-text-muted, #667085);
  font-size: 13px;
}
.formal-agent-page__subject select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d9d3e7;
  border-radius: 12px;
  background: #fff;
  color: inherit;
  font: inherit;
}
.formal-agent-page__eyebrow {
  color: var(--color-text-muted, #667085);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.formal-agent-page h1 {
  margin: 8px 0;
}
.formal-agent-page__decision {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  border-radius: 24px;
  background: #f4f0ff;
}
.formal-agent-page__decision h2 {
  margin: 6px 0;
}
.formal-agent-page__decision > div,
.formal-agent-page__plan > div {
  min-width: 0;
}
.formal-agent-page__confidence {
  display: grid;
  align-content: center;
  min-width: 100px;
  text-align: center;
}
.formal-agent-page__confidence strong {
  font-size: 28px;
}
.formal-agent-page__confidence span,
.formal-agent-page__plan span {
  color: var(--color-text-muted, #667085);
  font-size: 12px;
}
.formal-agent-page__plan {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.formal-agent-page__plan div {
  display: grid;
  gap: 4px;
  padding: 16px;
  border: 1px solid #ebe7f4;
  border-radius: 16px;
}
.formal-agent-page__notice {
  margin: 20px 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  color: #475467;
  font-size: 14px;
}
@media (max-width: 600px) {
  .formal-agent-page__decision {
    display: block;
  }
  .formal-agent-page__confidence {
    display: flex;
    align-items: baseline;
    gap: 8px;
    justify-content: flex-start;
    margin-top: 18px;
  }
  .formal-agent-page__plan {
    grid-template-columns: 1fr;
  }
}
</style>
