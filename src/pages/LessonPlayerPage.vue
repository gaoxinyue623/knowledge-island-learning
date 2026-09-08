<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import LessonContentRenderer from '@/components/lesson-player/LessonContentRenderer.vue'
import KnowledgePointExperienceHub from '@/components/content-expansion/KnowledgePointExperienceHub.vue'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { questionEngineAdapter } from '@/services/question-engine'
import { useLessonPlayerStore } from '@/stores/lessonPlayerStore'
import { useLearningProfile } from '@/composables/useLearningProfile'
import type {
  LessonLaunchContext,
  LessonPlayerDataset,
  LessonPlayerDemoState,
  LessonStepType,
} from '@/types'

const stepTypeLabels: Record<LessonStepType, string> = {
  intro: '今天学什么',
  concept: '认识新知识',
  explanation: '一起想一想',
  example: '看看小例子',
  media: '看一看，听一听',
  interactive: '动手试一试',
  practice: '挑战小练习',
  summary: '回顾新发现',
}

const route = useRoute()
const router = useRouter()
const lessonPlayerStore = useLessonPlayerStore()
const { profileId } = useLearningProfile()
const invalidContextMessage = ref<string | null>(null)
const practiceAvailable = ref<boolean | null>(null)

const isDevRoute = computed(() => route.path.startsWith('/dev/lesson-player'))
const dataset = computed<LessonPlayerDataset>(() => {
  if (!isDevRoute.value) return 'profile'
  const requested = route.query.dataset
  if (requested === 'golden' || requested === 'demo' || requested === 'profile') return requested
  return 'demo'
})
const demoState = computed<LessonPlayerDemoState>(() => {
  const requested = route.query.state
  const states: LessonPlayerDemoState[] = [
    'full',
    'empty',
    'error',
    'not_available',
    'sample',
    'unverified',
    'completed',
    'resume',
  ]
  return isDevRoute.value &&
    typeof requested === 'string' &&
    states.includes(requested as LessonPlayerDemoState)
    ? (requested as LessonPlayerDemoState)
    : 'full'
})
const returnPath = computed(() => {
  const requested = route.query.returnTo
  const allowed = ['/home', '/tasks', '/dev/home', '/learning-map', '/dev/learning-map']
  if (
    typeof requested === 'string' &&
    (allowed.includes(requested) || /^\/(?:dev\/)?knowledge-point\/[^/]+$/.test(requested))
  ) {
    return requested
  }
  return isDevRoute.value ? '/dev/learning-map' : '/learning-map'
})
const returnLabel = computed(() =>
  ['/home', '/tasks', '/dev/home'].includes(returnPath.value)
    ? '返回首页'
    : returnPath.value.includes('/knowledge-point/')
      ? '返回知识点详情'
      : '返回知识地图',
)
const detailReturnPath = computed(() => {
  const requested = route.query.detailReturnTo
  const allowed = ['/home', '/tasks', '/dev/home', '/learning-map', '/dev/learning-map']
  if (typeof requested === 'string' && allowed.includes(requested)) return requested
  return isDevRoute.value ? '/dev/learning-map' : '/learning-map'
})
const mapNodeId = computed(() =>
  typeof route.query.mapNodeId === 'string' ? route.query.mapNodeId : undefined,
)
const context = computed<LessonLaunchContext | null>(() => {
  const query = route.query
  const values = {
    textbookId: query.textbookId,
    unitId: query.unitId,
    lessonId: query.lessonId,
    knowledgePointId: query.knowledgePointId,
  }
  if (
    Object.values(values).every(
      (value): value is string => typeof value === 'string' && value !== '',
    )
  ) {
    return values as LessonLaunchContext
  }
  if (isDevRoute.value) {
    return {
      textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
      unitId: 'DEMO_UNIT_01',
      lessonId: 'DEMO_LESSON_1_1',
      knowledgePointId: 'DEMO_KP_01',
    }
  }
  return null
})

const viewModel = computed(() => lessonPlayerStore.viewModel)
const isFormalPilot = computed(() => isPilotTextbook(context.value?.textbookId))
const currentStep = computed(() => viewModel.value?.steps[lessonPlayerStore.currentStepIndex])
const isPracticeStep = computed(() => currentStep.value?.type === 'practice')
const progressLabel = computed(() =>
  viewModel.value
    ? `${lessonPlayerStore.currentStepIndex + 1} / ${viewModel.value.steps.length}`
    : '—',
)
const canShowContent = computed(
  () => Boolean(viewModel.value) && ['ready', 'completed'].includes(lessonPlayerStore.status),
)
const demoStateOptions: Array<{ value: LessonPlayerDemoState; label: string }> = [
  { value: 'full', label: '完整课程' },
  { value: 'resume', label: '恢复中' },
  { value: 'completed', label: '已完成' },
  { value: 'empty', label: '空内容' },
  { value: 'not_available', label: '暂未开放' },
  { value: 'error', label: '加载失败' },
  { value: 'sample', label: 'Sample' },
  { value: 'unverified', label: 'Unverified' },
]

async function loadLesson() {
  const activeProfile = profileId.value,
    activePath = route.fullPath
  invalidContextMessage.value = null
  if (!context.value) {
    invalidContextMessage.value = '请从知识地图进入一个有效的知识点。'
    return
  }
  practiceAvailable.value = null
  await lessonPlayerStore.loadLesson(context.value, {
    dataset: dataset.value,
    studentId: profileId.value,
    sessionScope:
      typeof route.query.sessionScope === 'string' ? route.query.sessionScope : undefined,
    demoState: demoState.value,
  })
  if (profileId.value !== activeProfile || route.fullPath !== activePath) return
  applyAssessmentCompletion()
  await checkPracticeAvailability()
}

async function checkPracticeAvailability() {
  if (!context.value || !isPracticeStep.value) {
    practiceAvailable.value = null
    return
  }
  try {
    practiceAvailable.value = await questionEngineAdapter.getAssessmentAvailability(
      {
        ...context.value,
        source: isDevRoute.value ? 'dev' : 'lesson_practice',
      },
      {
        dataset: dataset.value,
        demoState: 'full',
        studentId: profileId.value,
        sessionScope:
          typeof route.query.sessionScope === 'string' ? route.query.sessionScope : undefined,
      },
    )
  } catch {
    practiceAvailable.value = false
  }
}

function applyAssessmentCompletion() {
  if (route.query.assessmentCompleted !== 'true' || !viewModel.value) return
  const practiceIndex = viewModel.value.steps.findIndex((step) => step.type === 'practice')
  if (practiceIndex < 0) return
  lessonPlayerStore.goToStep(practiceIndex)
  lessonPlayerStore.completeStep(practiceIndex)
  const summaryIndex = viewModel.value.steps.findIndex(
    (step, index) => index > practiceIndex && step.type === 'summary',
  )
  if (summaryIndex >= 0) lessonPlayerStore.goToStep(summaryIndex)
}

function returnToMap() {
  const focus = mapNodeId.value
  if (returnPath.value.includes('/knowledge-point/') && context.value) {
    void router.push({
      path: returnPath.value,
      query: {
        ...context.value,
        ...(dataset.value !== 'profile' ? { dataset: dataset.value } : {}),
        ...(focus ? { mapNodeId: focus } : {}),
        ...(typeof route.query.nodeStatus === 'string'
          ? { nodeStatus: route.query.nodeStatus }
          : {}),
        ...(typeof route.query.nodeProgress === 'string'
          ? { nodeProgress: route.query.nodeProgress }
          : {}),
        returnTo: detailReturnPath.value,
      },
    })
    return
  }
  void router.push({
    path: returnPath.value,
    ...(focus ? { query: { focusNodeId: focus } } : {}),
  })
}

function openAfterReading(): void {
  if (!context.value) return
  void router.push({
    path:
      (isDevRoute.value ? '/dev/knowledge-point/' : '/knowledge-point/') +
      context.value.knowledgePointId,
    hash: '#knowledge-challenges',
    query: {
      ...context.value,
      ...(isDevRoute.value ? { dataset: dataset.value } : {}),
      ...(mapNodeId.value ? { mapNodeId: mapNodeId.value } : {}),
      nodeStatus: 'completed',
      returnTo: detailReturnPath.value,
    },
  })
}

function goToStep(index: number) {
  if (isDevRoute.value || index <= lessonPlayerStore.currentStepIndex) {
    lessonPlayerStore.goToStep(index)
  }
}

function nextStep() {
  if (lessonPlayerStore.isLastStep) {
    void finishLesson()
    return
  }
  lessonPlayerStore.goNext()
}

function startAssessment() {
  if (!context.value || !isPracticeStep.value || practiceAvailable.value !== true) return
  void router.push({
    path: isDevRoute.value ? '/dev/question-engine' : '/assessment',
    query: {
      textbookId: context.value.textbookId,
      unitId: context.value.unitId,
      lessonId: context.value.lessonId,
      knowledgePointId: context.value.knowledgePointId,
      source: isDevRoute.value ? 'dev' : 'lesson_practice',
      ...(isDevRoute.value ? { dataset: 'demo' } : {}),
      returnTo: isDevRoute.value ? '/dev/lesson-player' : '/lesson',
      lessonReturnTo: returnPath.value,
      ...(mapNodeId.value ? { mapNodeId: mapNodeId.value } : {}),
    },
  })
}

async function finishLesson() {
  await lessonPlayerStore.completeLesson()
}

function selectDemoState(nextState: LessonPlayerDemoState) {
  void router.push({
    path: '/dev/lesson-player',
    query: { ...route.query, state: nextState },
  })
}

async function completeDemoSession() {
  if (!viewModel.value) return
  viewModel.value.steps.forEach((_, index) => {
    lessonPlayerStore.goToStep(index)
    lessonPlayerStore.completeStep(index)
  })
  await lessonPlayerStore.completeLesson()
}

function restartLesson() {
  void router.replace({ query: { ...route.query, sessionScope: crypto.randomUUID() } })
}

function resetDemoSession() {
  lessonPlayerStore.resetDemoSession()
}

async function clearDemoStorage() {
  lessonPlayerStore.clearStoredSessions()
  await loadLesson()
}

function previousStep() {
  lessonPlayerStore.goPrevious()
}

onMounted(() => void loadLesson())
watch(
  () => [route.fullPath, profileId.value],
  () => void loadLesson(),
)
watch(
  () => currentStep.value?.id,
  () => void checkPracticeAvailability(),
)
</script>

<template>
  <AppShell :show-bottom-nav="false" context="专注学习" class="lesson-player-shell">
    <div class="lesson-player-page content-container">
      <div class="lesson-player">
        <header class="lesson-player__header">
          <div class="lesson-player__header-copy">
            <RouterLink class="lesson-player__back" :to="returnPath" @click.prevent="returnToMap">
              <AppIcon name="arrow-left" :size="18" decorative />
              {{ returnLabel }}
            </RouterLink>
            <p class="curriculum-eyebrow">跟着团子，一步一步学</p>
            <h1>{{ viewModel?.lesson.title || '正在准备这一节学习' }}</h1>
            <p v-if="viewModel">知识点：{{ viewModel.knowledgePoint.name }}</p>
          </div>
          <div v-if="viewModel" class="lesson-player__header-context" aria-label="课程来源状态">
            <span
              v-if="viewModel.flags.isDemo"
              class="lesson-player__badge lesson-player__badge--sample"
            >
              开发样本
            </span>
            <span
              v-else-if="viewModel.flags.isSample"
              class="lesson-player__badge lesson-player__badge--sample"
            >
              示例内容
            </span>
            <span
              v-if="viewModel.flags.isUnverified && !isFormalPilot"
              class="lesson-player__badge lesson-player__badge--warning"
            >
              未审核学习内容
            </span>
          </div>
        </header>

        <section
          v-if="isDevRoute"
          class="lesson-player__state-panel"
          aria-labelledby="lesson-state-title"
        >
          <div>
            <p class="curriculum-eyebrow">DEVELOPMENT ONLY · PHASE 8</p>
            <h2 id="lesson-state-title">LessonPlayer 状态 Showcase</h2>
            <p>用于检查加载、内容可用性、恢复和完成状态；不会创建正式学习记录。</p>
          </div>
          <div class="lesson-player__state-actions">
            <AppButton
              v-for="option in demoStateOptions"
              :key="option.value"
              size="sm"
              :variant="demoState === option.value ? 'primary' : 'secondary'"
              @click="selectDemoState(option.value)"
            >
              {{ option.label }}
            </AppButton>
          </div>
          <div class="lesson-player__state-actions">
            <AppButton size="sm" variant="soft" @click="resetDemoSession">重置本节会话</AppButton>
            <AppButton size="sm" variant="soft" @click="completeDemoSession"
              >完成当前会话</AppButton
            >
            <AppButton size="sm" variant="ghost" @click="clearDemoStorage">清理会话存储</AppButton>
          </div>
        </section>

        <AppLoading v-if="lessonPlayerStore.loading" label="正在准备学习内容" />
        <AppErrorState
          v-else-if="invalidContextMessage || lessonPlayerStore.status === 'error'"
          title="学习上下文暂时无法打开"
          :description="
            invalidContextMessage || lessonPlayerStore.error || '请从知识地图重新进入。'
          "
          action-label="重新读取"
          @retry="loadLesson"
        />
        <AppButton
          v-if="invalidContextMessage || lessonPlayerStore.status === 'error'"
          variant="ghost"
          icon-left="arrow-left"
          @click="returnToMap"
        >
          {{ returnLabel }}
        </AppButton>
        <AppEmptyState
          v-else-if="lessonPlayerStore.status === 'not_available'"
          title="该学习内容暂未开放"
          description="课程内容还需要完成审核，暂时不能进入学习步骤。"
          :action-label="returnLabel"
          @action="returnToMap"
        />
        <AppEmptyState
          v-else-if="lessonPlayerStore.status === 'empty'"
          title="课程内容正在准备中"
          description="这个知识点已经在地图上，但学习内容还没有准备好。"
          :action-label="returnLabel"
          @action="returnToMap"
        />
        <template v-else-if="canShowContent && viewModel">
          <div
            v-if="viewModel.flags.isDemo"
            class="lesson-player__notice lesson-player__notice--sample"
            role="status"
          >
            <AppIcon name="info" :size="20" decorative />
            <div>
              <strong>开发样本</strong
              ><span>这节内容只用于验证 LessonPlayer 流程，不代表正式教材正文。</span>
            </div>
          </div>
          <div
            v-else-if="viewModel.flags.isUnverified && !isFormalPilot"
            class="lesson-player__notice lesson-player__notice--warning"
            role="status"
          >
            <AppIcon name="alert-circle" :size="20" decorative />
            <div>
              <strong>未审核学习内容</strong
              ><span>当前内容只用于开发验证，正式环境需通过审核后开放。</span>
            </div>
          </div>

          <section class="lesson-player__goals" aria-labelledby="lesson-goals-title">
            <div>
              <p class="curriculum-eyebrow">今天的新发现</p>
              <h2 id="lesson-goals-title">今天的学习目标</h2>
            </div>
            <ul>
              <li v-for="goal in viewModel.learningGoals" :key="goal">{{ goal }}</li>
              <li v-if="!viewModel.learningGoals.length">先跟着步骤观察和理解这一节内容。</li>
            </ul>
          </section>

          <section class="lesson-player__progress-card" aria-labelledby="lesson-progress-title">
            <div class="lesson-player__progress-meta">
              <h2 id="lesson-progress-title">学习步骤</h2>
              <strong>{{ progressLabel }}</strong>
            </div>
            <AppProgress
              :value="viewModel.session.progress"
              label="学习步骤进度"
              :show-value="false"
              state="normal"
            />
            <nav class="lesson-player__steps" aria-label="学习步骤导航">
              <button
                v-for="(step, index) in viewModel.steps"
                :key="step.id"
                class="lesson-player__step-button"
                :class="{
                  'lesson-player__step-button--current':
                    index === lessonPlayerStore.currentStepIndex,
                  'lesson-player__step-button--done': step.isCompleted,
                }"
                type="button"
                :disabled="index > lessonPlayerStore.currentStepIndex && !isDevRoute"
                :aria-current="index === lessonPlayerStore.currentStepIndex ? 'step' : undefined"
                @click="goToStep(index)"
              >
                <span class="lesson-player__step-number">{{ index + 1 }}</span>
                <span>{{ step.title || stepTypeLabels[step.type] }}</span>
              </button>
            </nav>
          </section>

          <section class="lesson-player__content-card" aria-labelledby="lesson-content-title">
            <header class="lesson-player__content-header">
              <div>
                <p class="curriculum-eyebrow">
                  {{ currentStep ? stepTypeLabels[currentStep.type] : '学习内容' }}
                </p>
                <h2 id="lesson-content-title">{{ currentStep?.title || '跟着步骤看一看' }}</h2>
              </div>
              <p v-if="currentStep?.estimatedSeconds">大约 {{ currentStep.estimatedSeconds }} 秒</p>
            </header>
            <LessonContentRenderer
              :blocks="currentStep?.contentBlocks || []"
              :show-diagnostics="isDevRoute"
              :practice-available="practiceAvailable"
              @start-assessment="startAssessment"
            />
          </section>

          <KnowledgePointExperienceHub
            v-if="isDevRoute"
            :knowledge-point-id="viewModel.knowledgePoint.id"
            dataset="golden"
          />

          <section
            v-if="lessonPlayerStore.status === 'completed'"
            class="lesson-player__completion"
            aria-labelledby="lesson-completion-title"
          >
            <AppIcon name="check-circle" :size="42" color="var(--color-success)" decorative />
            <h2 id="lesson-completion-title">这一节学习完成了</h2>
            <p>
              {{
                isFormalPilot
                  ? '读完了，带着你的发现去做课后练习吧！也可以回到地图继续探索。'
                  : '你已经走完本次学习步骤。完成学习不等于掌握度，下一步可以回到地图继续探索。'
              }}
            </p>
            <div
              v-if="lessonPlayerStore.lastRewardEvent"
              class="lesson-player__reward-notice"
              role="status"
            >
              <AppIcon name="sparkles" :size="20" decorative />
              <span
                >本次完成获得 {{ lessonPlayerStore.lastRewardEvent.reward.knowledgeEnergy }} 点
                KnowledgeEnergy。</span
              >
            </div>
            <div class="lesson-player__completion-actions">
              <AppButton variant="secondary" @click="restartLesson()">重新学习</AppButton>
              <AppButton
                v-if="isFormalPilot"
                size="lg"
                icon-right="arrow-right"
                @click="openAfterReading"
                >去做课后练习</AppButton
              >
              <AppButton size="lg" icon-left="map" @click="returnToMap">{{
                returnLabel
              }}</AppButton>
              <AppButton
                v-if="isDevRoute"
                variant="secondary"
                @click="lessonPlayerStore.resetDemoSession()"
              >
                重置本节会话
              </AppButton>
            </div>
          </section>

          <footer v-else class="lesson-player__navigation" aria-label="学习步骤操作">
            <AppButton
              variant="secondary"
              icon-left="arrow-left"
              :disabled="!lessonPlayerStore.canGoPrevious"
              @click="previousStep"
            >
              上一步
            </AppButton>
            <AppButton icon-right="arrow-right" @click="nextStep">
              {{ lessonPlayerStore.isLastStep ? '完成这次学习' : '下一步' }}
            </AppButton>
          </footer>

          <details
            v-if="isDevRoute && (viewModel.diagnostics.length || lessonPlayerStore.warning)"
            class="lesson-player__diagnostics"
          >
            <summary>开发诊断</summary>
            <p v-if="lessonPlayerStore.warning">{{ lessonPlayerStore.warning }}</p>
            <p v-for="diagnostic in viewModel.diagnostics" :key="diagnostic">{{ diagnostic }}</p>
          </details>
        </template>
      </div>
    </div>
  </AppShell>
</template>
