<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const launchId = computed(() => {
  const decisionId = result.value?.decision?.decisionId
  return decisionId ? `formal:${decisionId}` : ''
})
const target = computed(() => result.value?.context?.mapNodes.find(
  (node) => node.knowledgePointId === result.value?.decision?.targetKnowledgePointId && node.status !== 'locked',
) ?? null)
const textbookId = computed(() => {
  const profile = curriculum.curriculumProfile
  if (!profile) return ''
  return {
    MATH: profile.mathTextbookVersionId,
    CHINESE: profile.chineseTextbookVersionId,
    ENGLISH: profile.englishTextbookVersionId,
  }[selectedSubject.value] ?? ''
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
  try {
    if (!profileId.value || !textbookId.value)
      throw new Error('请先完成教材选择，再使用正式 Agent。')
    result.value = await runtimeLearningAgentDecisionService.prepare(
      profileId.value,
      textbookId.value,
    )
    if (result.value.status !== 'READY' || !result.value.decision || !result.value.context)
      throw new Error('当前学习资料尚未满足正式 Agent 的使用条件。')
    if (!target.value?.unitId || !target.value.lessonId)
      throw new Error('当前建议暂时找不到对应课程，请重新选择学科。')
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '正式 Agent 暂时无法读取学习状态。'
  } finally {
    loading.value = false
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

function startPractice() {
  const current = result.value
  const context = target.value
  const decision = current?.decision
  if (!current || current.status !== 'READY' || !context?.unitId || !context.lessonId || !decision || !launchId.value) return
  const launch = {
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
  void router.push({
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
}

onMounted(() => {
  selectedSubject.value = defaultSubject()
  void load()
})
</script>

<template>
  <AppShell show-bottom-nav context="Agent 学习建议">
    <main class="formal-agent-page content-container">
      <header class="formal-agent-page__header">
        <p class="formal-agent-page__eyebrow">正式学习路径</p>
        <h1>今天先学什么？</h1>
        <p>Agent 读取你的正式学习记录，给出下一步练习建议。</p>
      </header>
      <label class="formal-agent-page__subject" for="formal-agent-subject">
        <span>学习科目</span>
        <select
          id="formal-agent-subject"
          :value="selectedSubject"
          :disabled="loading"
          aria-label="学习科目"
          @change="selectSubject(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in availableSubjects" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <AppLoading v-if="loading" label="正在读取学习状态" />
      <AppErrorState
        v-else-if="error"
        title="正式 Agent 暂时不可用"
        :description="error"
        @retry="load"
      />
      <template v-else-if="result?.decision && result.context && result.activityPlan">
        <section class="formal-agent-page__decision" aria-labelledby="agent-decision-title">
          <div>
            <p class="formal-agent-page__eyebrow">{{ result.context.currentLearning.lessonId }}</p>
            <h2 id="agent-decision-title">
              {{ actionLabels[result.decision.action] ?? result.decision.action }}
            </h2>
            <p>{{ result.decision.reasons[0]?.message ?? '根据最近学习证据安排下一步。' }}</p>
          </div>
          <div class="formal-agent-page__confidence" aria-label="决策置信度">
            <strong>{{ Math.round(result.decision.confidence * 100) }}%</strong>
            <span>决策置信度</span>
          </div>
        </section>
        <section class="formal-agent-page__plan" aria-label="练习计划">
          <div>
            <span>目标知识点</span><strong>{{ target?.knowledgePointId }}</strong>
          </div>
          <div>
            <span>预计题量</span
            ><strong>{{ result.activityPlan.estimatedQuestionCount }} 题</strong>
          </div>
          <div>
            <span>难度</span><strong>{{ result.activityPlan.difficulty }} / 5</strong>
          </div>
        </section>
        <p class="formal-agent-page__notice" role="status">
          本次练习只使用已审核题目；提交后才会更新正式学习记录。
        </p>
        <AppButton size="lg" full-width icon-right="arrow-right" @click="startPractice"
          >开始正式练习</AppButton
        >
      </template>
    </main>
  </AppShell>
</template>

<style scoped>
.formal-agent-page {
  max-width: 720px;
  padding: 32px 20px 56px;
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
