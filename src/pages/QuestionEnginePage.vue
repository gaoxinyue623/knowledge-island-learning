<script setup lang="ts">
import MathQuestVisual from '@/components/knowledge-point/MathQuestVisual.vue'
import { localQuestionVisuals } from '@/data/curriculum/production/localRelease'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import LearningRecommendationCard from '@/components/learning-strategy/LearningRecommendationCard.vue'
import QuestionRenderer from '@/components/question-engine/QuestionRenderer.vue'
import AppShell from '@/layouts/AppShell.vue'
import { correctAnswerDraft } from '@/services/question-engine'
import { masteryService } from '@/services/mastery'
import { useQuestionEngineStore } from '@/stores/questionEngineStore'
import { useMasteryStore } from '@/stores/masteryStore'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { useLearningStrategyStore } from '@/stores/learningStrategyStore'
import { useReviewQueueStore } from '@/stores/reviewQueueStore'
import { useWrongBookStore } from '@/stores/wrongBookStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useLearningProfile } from '@/composables/useLearningProfile'
import {
  loadFormalAgentLaunch,
  runtimeLearningAgentExecutionService,
  syncLearningFactsToCloud,
  type FormalAgentLaunch,
} from '@/services/learning-agent'
import type {
  AssessmentLaunchContext,
  QuestionAnswerDraft,
  QuestionEngineDataset,
  QuestionEngineDemoState,
} from '@/types'

const route = useRoute()
const router = useRouter()
const questionEngineStore = useQuestionEngineStore()
const masteryStore = useMasteryStore()
const learningMapStore = useLearningMapStore()
const learningStrategyStore = useLearningStrategyStore()
const reviewQueueStore = useReviewQueueStore()
const wrongBookStore = useWrongBookStore()
const rewardStore = useRewardStore()
const { profileId } = useLearningProfile()

const isDevRoute = computed(() => route.path.startsWith('/dev/question-engine'))
const dataset = computed<QuestionEngineDataset>(() => {
  if (!isDevRoute.value) return 'profile'
  const requested = route.query.dataset
  if (requested === 'demo' || requested === 'profile' || requested === 'golden') return requested
  return 'demo'
})

const demoState = computed<QuestionEngineDemoState>(() => {
  const requested = route.query.state
  const states: QuestionEngineDemoState[] = [
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
    states.includes(requested as QuestionEngineDemoState)
    ? (requested as QuestionEngineDemoState)
    : 'full'
})

const context = computed<AssessmentLaunchContext | null>(() => {
  const query = route.query
  const textbookId = query.textbookId
  const unitId = query.unitId
  const lessonId = query.lessonId
  const knowledgePointId = query.knowledgePointId
  if (
    typeof textbookId === 'string' &&
    textbookId.length > 0 &&
    typeof unitId === 'string' &&
    unitId.length > 0 &&
    typeof lessonId === 'string' &&
    lessonId.length > 0 &&
    typeof knowledgePointId === 'string' &&
    knowledgePointId.length > 0
  ) {
    return {
      textbookId,
      unitId,
      lessonId,
      knowledgePointId,
      source:
        query.source === 'wrong_book'
          ? 'wrong_book'
          : query.source === 'lesson_practice' || !isDevRoute.value
            ? 'lesson_practice'
            : 'dev',
    }
  }
  if (isDevRoute.value) {
    return {
      textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
      unitId: 'DEMO_UNIT_01',
      lessonId: 'DEMO_LESSON_1_1',
      knowledgePointId: 'DEMO_KP_01',
      source: 'dev',
    }
  }
  return null
})

const returnPath = computed(() => {
  if (formalAgentLaunch.value) return '/learning-agent'
  if (context.value?.source === 'wrong_book') {
    return isDevRoute.value ? '/dev/wrong-book' : '/wrong-book'
  }
  const requested = route.query.returnTo
  const allowed = ['/home', '/tasks', '/dev/home', '/lesson', '/dev/lesson-player']
  if (
    typeof requested === 'string' &&
    (allowed.includes(requested) || /^\/(?:dev\/)?knowledge-point\/[^/]+$/.test(requested))
  ) {
    return requested
  }
  return isDevRoute.value ? '/dev/lesson-player' : '/lesson'
})
const returnLabel = computed(() =>
  formalAgentLaunch.value
    ? '返回 Agent 学习建议'
    : context.value?.source === 'wrong_book'
    ? '返回错题本'
    : ['/home', '/tasks', '/dev/home'].includes(returnPath.value)
      ? '返回首页'
      : returnPath.value.includes('/knowledge-point/')
        ? '返回知识点详情'
        : '返回课程',
)
const lessonReturnPath = computed(() => {
  const requested = route.query.lessonReturnTo
  const allowed = ['/home', '/tasks', '/dev/home', '/learning-map', '/dev/learning-map']
  if (typeof requested === 'string' && allowed.includes(requested)) return requested
  return isDevRoute.value ? '/dev/learning-map' : '/learning-map'
})
const mapNodeId = computed(() =>
  typeof route.query.mapNodeId === 'string' ? route.query.mapNodeId : undefined,
)
const retryQuestionId = computed(() =>
  typeof route.query.retryQuestionId === 'string' ? route.query.retryQuestionId : undefined,
)
const sessionScope = computed(() =>
  typeof route.query.sessionScope === 'string' ? route.query.sessionScope : undefined,
)
const formalAgentLaunch = shallowRef<FormalAgentLaunch | null>(null)
const formalAgentError = ref<string | null>(null)

const viewModel = computed(() => questionEngineStore.viewModel)
const currentQuestion = computed(() => questionEngineStore.currentQuestion)
const strategyRecommendation = computed(() => learningStrategyStore.recommendation)
const masteryProcessingStatus = ref<'idle' | 'processing' | 'updated' | 'error'>('idle')
const masteryProcessingMessage = ref<string | null>(null)
const rewardMessage = ref<string | null>(null)
const progressLabel = computed(() => {
  if (!viewModel.value) return '—'
  return `${viewModel.value.session.currentQuestionIndex + 1} / ${viewModel.value.session.totalQuestions}`
})

const demoStateOptions: Array<{ value: QuestionEngineDemoState; label: string }> = [
  { value: 'full', label: '完整练习' },
  { value: 'resume', label: '恢复中' },
  { value: 'completed', label: '已完成' },
  { value: 'empty', label: '空内容' },
  { value: 'not_available', label: '暂未开放' },
  { value: 'error', label: '加载失败' },
  { value: 'sample', label: 'Sample' },
  { value: 'unverified', label: 'Unverified' },
]

async function loadAssessment() {
  const activeProfile = profileId.value,
    activePath = route.fullPath
  if (!context.value) return
  masteryProcessingStatus.value = 'idle'
  masteryProcessingMessage.value = null
  rewardMessage.value = null
  formalAgentError.value = null
  const launchId = typeof route.query.agentLaunchId === 'string' ? route.query.agentLaunchId : ''
  formalAgentLaunch.value = launchId ? loadFormalAgentLaunch(launchId) : null
  if (launchId && !formalAgentLaunch.value) {
    formalAgentError.value = '这次 Agent 练习绑定已经失效，请重新从 Agent 学习建议进入。'
    return
  }
  learningStrategyStore.clear()
  await questionEngineStore.loadAssessment(context.value, {
    dataset: dataset.value,
    demoState: demoState.value,
    studentId: profileId.value,
    ...(formalAgentLaunch.value?.id
      ? { sessionScope: formalAgentLaunch.value.id }
      : sessionScope.value
        ? { sessionScope: sessionScope.value }
        : {}),
    ...(retryQuestionId.value ? { initialQuestionId: retryQuestionId.value } : {}),
    ...(retryQuestionId.value ? { reviewQuestionId: retryQuestionId.value } : {}),
  })
  if (profileId.value !== activeProfile || route.fullPath !== activePath) return
  if (formalAgentLaunch.value && questionEngineStore.definition) {
    const launch = formalAgentLaunch.value
    const opened = await runtimeLearningAgentExecutionService.open(
      {
        profileId: launch.profileId,
        textbookId: launch.textbookId,
        decision: launch.decision,
        questionIds: [...questionEngineStore.definition.questionIds],
        sessionScope: launch.id,
      },
      new Date().toISOString(),
    )
    if (opened.status === 'BLOCKED') {
      formalAgentError.value = '正式 Agent 练习校验未通过，已阻止提交。'
      return
    }
    // The first Question Engine load creates its legacy shell. Reload after
    // binding so the UI observes the runtime-owned session and its identity.
    await questionEngineStore.loadAssessment(context.value, {
      dataset: 'profile',
      studentId: profileId.value,
      sessionScope: launch.id,
      ...(retryQuestionId.value ? { initialQuestionId: retryQuestionId.value } : {}),
      ...(retryQuestionId.value ? { reviewQuestionId: retryQuestionId.value } : {}),
    })
    if (opened.status === 'RETRY_REQUIRED' && opened.session?.status === 'completed')
      await syncFormalAgentCompletion(opened.session)
  }
  if (profileId.value !== activeProfile || route.fullPath !== activePath) return
  if (questionEngineStore.session?.status === 'completed') await processCompletedSession()
}

function formalAgentAnswers(session: NonNullable<typeof questionEngineStore.session>) {
  return session.attempts
    .filter((attempt) => attempt.submitted)
    .map((attempt) => ({ questionId: attempt.questionId, answer: attempt.answer }))
}

async function syncFormalAgentCompletion(session: NonNullable<typeof questionEngineStore.session>) {
  const launch = formalAgentLaunch.value
  if (!launch || !session.id) return false
  const result = await runtimeLearningAgentExecutionService.submit(
    {
      profileId: launch.profileId,
      textbookId: launch.textbookId,
      decision: launch.decision,
      questionIds: [...session.questionIds],
      sessionId: session.id,
      sessionScope: launch.id,
      answers: formalAgentAnswers(session),
    },
    new Date().toISOString(),
  )
  if (result.status !== 'COMPLETED') {
    formalAgentError.value = '正式学习记录暂时没有完成保存，请保持当前页面并重试。'
    return false
  }
  const cloudSync = await syncLearningFactsToCloud(launch.profileId)
  if (cloudSync.kind === 'conflict') {
    formalAgentError.value = '正式学习记录已保存在本机，但云端档案已被另一台设备更新，请到家庭档案处理冲突。'
  } else if (cloudSync.kind === 'failed') {
    formalAgentError.value = `正式学习记录已保存在本机，但${cloudSync.message}`
  }
  await questionEngineStore.loadAssessment(context.value!, {
    dataset: 'profile',
    studentId: profileId.value,
    sessionScope: launch.id,
  })
  return true
}

async function processCompletedSession(): Promise<void> {
  const session = questionEngineStore.session
  if (!session) return
  if (formalAgentLaunch.value && session.runtimeAgent) {
    if (!session.runtimeAgent.projectedAt) {
      formalAgentError.value = '正式 Agent 记录尚未完成保存。'
      return
    }
    masteryProcessingStatus.value = 'updated'
    masteryProcessingMessage.value = '正式 Agent 已完成学习记录更新。'
    return
  }
  const studentProfileId = profileId.value
  const stillActive = () =>
    profileId.value === studentProfileId && questionEngineStore.session?.id === session.id
  await masteryStore.load(studentProfileId)
  if (!stillActive()) return
  const previousMastery = new Map(
    masteryStore.records.map((record) => [record.knowledgePointId, record]),
  )
  masteryProcessingStatus.value = 'processing'
  masteryProcessingMessage.value = null
  try {
    const result = await masteryService.processCompletedQuestionSession(studentProfileId, session, {
      dataset: dataset.value,
    })
    await masteryStore.load(studentProfileId)
    if (!stillActive()) return
    rewardStore.load(studentProfileId, { includeSample: dataset.value === 'demo' })
    const completionRewards = [questionEngineStore.lastRewardEvent].filter(
      (event): event is NonNullable<typeof event> => Boolean(event),
    )
    for (const nextRecord of result.records) {
      const verificationStatus =
        nextRecord.evidenceSourceStatus === 'SAMPLE'
          ? ('SAMPLE' as const)
          : nextRecord.evidenceSourceStatus === 'UNVERIFIED'
            ? ('UNVERIFIED' as const)
            : nextRecord.evidenceSourceStatus === 'VERIFIED'
              ? ('VERIFIED' as const)
              : nextRecord.evidenceSourceStatus === 'REVIEWED'
                ? ('REVIEWED' as const)
                : undefined
      const reward = rewardStore.processLearningFact(
        {
          type: 'knowledge_mastered',
          transition: {
            previous: previousMastery.get(nextRecord.knowledgePointId),
            next: nextRecord,
          },
        },
        {
          dataset: dataset.value,
          isSampleDerived: dataset.value === 'demo' || nextRecord.isSampleDerived,
          ...(verificationStatus ? { verificationStatus } : {}),
        },
      )
      if (reward.event) completionRewards.push(reward.event)
    }
    const map = await learningMapStore.loadMap({
      profileId: studentProfileId,
      dataset: dataset.value,
      textbookId: session.textbookId,
      masteryRecords: masteryStore.records,
      isReadOnly: dataset.value !== 'profile',
    })
    if (!stillActive()) return
    if (map) {
      const resolved = await learningStrategyStore.resolveForMap(map, {
        studentProfileId,
        masteryRecords: masteryStore.records,
        learningEvidence: masteryStore.evidence,
        currentMapNodeId: mapNodeId.value ?? map.currentNodeId,
        currentKnowledgePointId: session.knowledgePointId,
        dataset: dataset.value,
      })
      if (!stillActive()) return
      if (resolved) {
        reviewQueueStore.project(resolved, {
          evidenceId: session.id,
          profileId: studentProfileId,
          textbookId: map.textbook.id,
          dataset: dataset.value,
          isSampleDerived: dataset.value === 'demo' || map.flags.isDemo,
          ...(map.flags.isUnverified ? { verificationStatus: 'UNVERIFIED' as const } : {}),
        })
      }
    }
    if (context.value?.source === 'wrong_book' && retryQuestionId.value) {
      wrongBookStore.resolveRetry(
        session,
        retryQuestionId.value,
        session.completedAt ?? new Date().toISOString(),
        {
          dataset: dataset.value,
          isSampleDerived: dataset.value === 'demo',
          ...(dataset.value === 'demo' ? { verificationStatus: 'SAMPLE' as const } : {}),
          textbookId: session.textbookId,
          unitId: session.unitId,
          lessonId: session.lessonId,
        },
      )
      if (wrongBookStore.lastRewardEvent) completionRewards.push(wrongBookStore.lastRewardEvent)
    }
    const reviewId =
      typeof route.query.reviewItemId === 'string' ? route.query.reviewItemId : undefined
    if (reviewId) {
      reviewQueueStore.load(studentProfileId, { includeSample: dataset.value === 'demo' })
      const item = reviewQueueStore.items.find((item) => item.id === reviewId)
      if (
        item &&
        item.textbookId === session.textbookId &&
        item.knowledgePointId === session.knowledgePointId &&
        session.status === 'completed' &&
        session.questionIds.length > 0 &&
        session.questionIds.every((id) =>
          session.attempts.some(
            (attempt) =>
              attempt.questionId === id &&
              attempt.submitted &&
              attempt.result?.status === 'correct',
          ),
        )
      ) {
        reviewQueueStore.complete(item.id, session.completedAt ?? new Date().toISOString())
      }
    }
    const energy = completionRewards.reduce(
      (total, event) => total + event.reward.knowledgeEnergy,
      0,
    )
    rewardMessage.value = energy > 0 ? `本次完成获得 ${energy} 点 KnowledgeEnergy。` : null
    masteryProcessingStatus.value = 'updated'
    masteryProcessingMessage.value = result.appendedEvidence.length
      ? `已根据 ${result.appendedEvidence.length} 条作答证据更新知识掌握。`
      : '这次练习的掌握度记录已经更新过。'
  } catch (caught) {
    if (!stillActive()) return
    learningStrategyStore.clear()
    masteryProcessingStatus.value = 'error'
    masteryProcessingMessage.value =
      caught instanceof Error ? caught.message : '掌握度暂时未更新，但本次练习仍已完成。'
  }
}

function returnToLesson(completed = false) {
  if (formalAgentLaunch.value) {
    const subject = String(route.query.agentSubject ?? '')
    void router.push({
      path: '/learning-agent',
      query: ['MATH', 'CHINESE', 'ENGLISH'].includes(subject) ? { subject } : {},
    })
    return
  }
  if (route.query.reviewItemId) {
    void router.push(isDevRoute.value ? '/dev/review-queue' : '/review-queue')
    return
  }
  const launchContext = context.value
  if (!launchContext) {
    void router.push(returnPath.value)
    return
  }
  void router.push({
    path: returnPath.value,
    query: {
      textbookId: launchContext.textbookId,
      unitId: launchContext.unitId,
      lessonId: launchContext.lessonId,
      knowledgePointId: launchContext.knowledgePointId,
      ...(dataset.value === 'demo' ? { dataset: 'demo' } : {}),
      ...(mapNodeId.value ? { mapNodeId: mapNodeId.value } : {}),
      returnTo: lessonReturnPath.value,
      ...(completed ? { assessmentCompleted: 'true', focusStep: 'summary' } : {}),
    },
  })
}

function selectDemoState(nextState: QuestionEngineDemoState) {
  void router.push({
    path: '/dev/question-engine',
    query: { ...route.query, state: nextState },
  })
}

async function updateDraft(draft: QuestionAnswerDraft) {
  await questionEngineStore.setAnswerDraft(draft)
}

async function submitAnswer() {
  const submitted = await questionEngineStore.submitAnswer()
  const launch = formalAgentLaunch.value
  const session = questionEngineStore.session
  const attempt = questionEngineStore.currentAttempt
  if (submitted && launch && session && attempt && !questionEngineStore.canComplete) {
    const result = await runtimeLearningAgentExecutionService.submit(
      {
        profileId: launch.profileId,
        textbookId: launch.textbookId,
        decision: launch.decision,
        questionIds: [...session.questionIds],
        sessionId: session.id,
        sessionScope: launch.id,
        answers: [{ questionId: attempt.questionId, answer: attempt.answer }],
      },
      new Date().toISOString(),
    )
    if (result.status === 'BLOCKED' || result.status === 'RETRY_REQUIRED')
      formalAgentError.value = '这道题的正式学习记录暂时未保存，请重试。'
  }
}

async function nextQuestion() {
  if (questionEngineStore.canGoNext) await questionEngineStore.goNext()
  else if (questionEngineStore.canComplete) {
    const completed = await questionEngineStore.completeAssessment()
    if (completed) {
      if (formalAgentLaunch.value && questionEngineStore.session)
        await syncFormalAgentCompletion(questionEngineStore.session)
      await processCompletedSession()
    }
  }
}

async function previousQuestion() {
  await questionEngineStore.goPrevious()
}

function answerForCurrentQuestion(mode: 'correct' | 'incorrect'): QuestionAnswerDraft | null {
  const question = questionEngineStore.questions[questionEngineStore.currentQuestionIndex]
  if (!question) return null
  if (mode === 'correct') return correctAnswerDraft(question)
  switch (question.questionType) {
    case 'singleChoice':
      return {
        type: 'singleChoice',
        ...(question.options?.[1] ? { optionId: question.options[1].id } : {}),
      }
    case 'multipleChoice':
      return {
        type: 'multipleChoice',
        optionIds: question.options?.slice(0, 1).map((option) => option.id) ?? [],
      }
    case 'trueFalse':
      return { type: 'trueFalse', value: false }
    case 'fillBlank':
      return { type: 'fillBlank', values: ['0'] }
    case 'calculation':
      return { type: 'calculation', value: '0' }
    case 'shortAnswer':
      return { type: 'shortAnswer', value: '我先写下一个示例回答。' }
    default:
      return null
  }
}

async function submitDemoAnswer(mode: 'correct' | 'incorrect') {
  const draft = answerForCurrentQuestion(mode)
  if (!draft) return
  await questionEngineStore.setAnswerDraft(draft)
  await questionEngineStore.submitAnswer()
}

async function completeDemoAssessment() {
  if (!questionEngineStore.questions.length) return
  await questionEngineStore.resetDemoAssessment()
  for (let index = 0; index < questionEngineStore.questions.length; index += 1) {
    const question = questionEngineStore.questions[index]
    await questionEngineStore.setAnswerDraft(correctAnswerDraft(question))
    await questionEngineStore.submitAnswer()
    if (index < questionEngineStore.questions.length - 1) await questionEngineStore.goNext()
  }
  await questionEngineStore.completeAssessment()
  await processCompletedSession()
}

async function clearDemoStorage() {
  questionEngineStore.clearStoredSessions()
  await loadAssessment()
}

async function restartAssessment() {
  await router.replace({
    query: { ...route.query, sessionScope: `attempt:${crypto.randomUUID()}` },
  })
}

async function resetDemoAssessment() {
  await questionEngineStore.resetDemoAssessment()
}

onMounted(() => void loadAssessment())
watch(
  () => [route.fullPath, profileId.value],
  () => void loadAssessment(),
)
</script>

<template>
  <AppShell :show-bottom-nav="false" context="专注练习" class="question-engine-shell">
    <div class="question-engine-page content-container">
      <div class="question-engine">
        <header class="question-engine__header">
          <div class="question-engine__header-copy">
            <RouterLink
              class="question-engine__back"
              :to="returnPath"
              @click.prevent="returnToLesson()"
            >
              <AppIcon name="arrow-left" :size="18" decorative />
              {{ returnLabel }}
            </RouterLink>
            <p class="curriculum-eyebrow">动动脑筋 · 练习时间</p>
            <h1>{{ viewModel ? '本次课后练习' : '准备一组练习' }}</h1>
            <p v-if="viewModel">完成一次练习，看看自己对这一步的理解。</p>
          </div>
          <div v-if="viewModel" class="question-engine__header-status" aria-label="题目来源状态">
            <span v-if="viewModel.flags.isDemo" class="question-engine__badge">开发样本</span>
            <span v-else-if="viewModel.flags.isSample" class="question-engine__badge"
              >示例题目</span
            >
            <span
              v-if="viewModel.flags.isUnverified"
              class="question-engine__badge question-engine__badge--warning"
            >
              未审核题目
            </span>
          </div>
        </header>

        <section
          v-if="isDevRoute"
          class="question-engine__state-panel"
          aria-labelledby="question-state-title"
        >
          <div>
            <p class="curriculum-eyebrow">DEVELOPMENT ONLY · PHASE 9</p>
            <h2 id="question-state-title">Question Engine 状态 Showcase</h2>
            <p>用于检查六类题型、恢复、反馈和错误状态；开发样本不会进入正式掌握度或成长反馈。</p>
          </div>
          <div class="question-engine__state-actions">
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
          <div class="question-engine__state-actions">
            <AppButton size="sm" variant="soft" @click="resetDemoAssessment">重置练习</AppButton>
            <AppButton size="sm" variant="soft" @click="submitDemoAnswer('incorrect')"
              >提交错误示例</AppButton
            >
            <AppButton size="sm" variant="soft" @click="submitDemoAnswer('correct')"
              >提交正确示例</AppButton
            >
            <AppButton size="sm" variant="soft" @click="completeDemoAssessment"
              >完成示例练习</AppButton
            >
            <AppButton size="sm" variant="ghost" @click="clearDemoStorage">清理会话存储</AppButton>
          </div>
        </section>

        <AppLoading v-if="questionEngineStore.loading" label="正在准备练习" />
        <div v-if="formalAgentError" class="question-engine__notice" role="alert">
          <AppIcon name="alert-circle" :size="20" decorative />
          <span>{{ formalAgentError }}</span>
        </div>
        <AppErrorState
          v-else-if="
            questionEngineStore.status === 'error' ||
            questionEngineStore.status === 'invalid_context'
          "
          title="练习暂时无法打开"
          :description="questionEngineStore.error || '请从课程中的练习入口重新进入。'"
          action-label="重新读取"
          @retry="loadAssessment"
        />
        <AppButton
          v-if="
            questionEngineStore.status === 'error' ||
            questionEngineStore.status === 'invalid_context'
          "
          variant="ghost"
          icon-left="arrow-left"
          @click="returnToLesson()"
        >
          {{ returnLabel }}
        </AppButton>
        <AppEmptyState
          v-else-if="questionEngineStore.status === 'not_available'"
          title="练习暂未开放"
          description="题目还需要完成审核，暂时不能进入本次练习。"
          :action-label="returnLabel"
          @action="returnToLesson()"
        />
        <AppEmptyState
          v-else-if="
            questionEngineStore.status === 'empty' ||
            questionEngineStore.status === 'unsupported_question'
          "
          title="练习内容正在准备中"
          description="这个知识点还没有可用的练习题，请先继续学习内容。"
          :action-label="returnLabel"
          @action="returnToLesson()"
        />
        <template v-else-if="viewModel">
          <div
            v-if="viewModel.flags.isDemo || viewModel.flags.isUnverified"
            class="question-engine__notice"
            role="status"
          >
            <AppIcon name="info" :size="20" decorative />
            <div>
              <strong>{{ viewModel.flags.isDemo ? '开发样本' : '未审核题目' }}</strong>
              <span>本组题目只用于验证答题流程，不代表已发布的教材习题。</span>
            </div>
          </div>

          <section class="question-engine__progress-card" aria-labelledby="question-progress-title">
            <div class="question-engine__progress-meta">
              <h2 id="question-progress-title">本次练习进度</h2>
              <strong>{{ progressLabel }}</strong>
            </div>
            <AppProgress
              :value="viewModel.session.progress"
              label="练习完成进度"
              :show-value="false"
              state="normal"
            />
            <nav class="question-engine__question-nav" aria-label="题目导航">
              <button
                v-for="(_, index) in viewModel.definition.questionIds"
                :key="viewModel.definition.questionIds[index]"
                type="button"
                class="question-engine__question-number"
                :class="{
                  'question-engine__question-number--current':
                    index === viewModel.session.currentQuestionIndex,
                  'question-engine__question-number--answered':
                    index < viewModel.session.answeredCount,
                }"
                :aria-current="
                  index === viewModel.session.currentQuestionIndex ? 'step' : undefined
                "
                :disabled="
                  index !== viewModel.session.currentQuestionIndex &&
                  index >= viewModel.session.answeredCount
                "
                @click="questionEngineStore.goToQuestion(index)"
              >
                {{ index + 1 }}
              </button>
            </nav>
          </section>

          <section
            v-if="questionEngineStore.status !== 'completed' && currentQuestion"
            class="question-engine__question-card"
          >
            <MathQuestVisual
              v-if="currentQuestion && localQuestionVisuals.has(currentQuestion.id)"
              :visual="localQuestionVisuals.get(currentQuestion.id)!"
            />
            <QuestionRenderer
              :question="currentQuestion"
              :show-diagnostics="isDevRoute"
              @update-draft="updateDraft"
            />
          </section>

          <section
            v-if="questionEngineStore.status === 'completed' && viewModel.resultSummary"
            class="question-engine__completion"
            aria-labelledby="assessment-completion-title"
          >
            <AppIcon name="check-circle" :size="44" color="var(--color-success)" decorative />
            <h2 id="assessment-completion-title">本次练习完成</h2>
            <p>这次结果描述本组题目的作答情况；掌握度会由作答证据单独计算。</p>
            <div v-if="rewardMessage" class="question-engine__reward-notice" role="status">
              <AppIcon name="sparkles" :size="20" decorative />
              <span>{{ rewardMessage }}</span>
            </div>
            <div
              v-if="masteryProcessingStatus !== 'idle'"
              class="question-engine__mastery-status"
              :class="`question-engine__mastery-status--${masteryProcessingStatus}`"
              role="status"
            >
              <AppIcon
                :name="masteryProcessingStatus === 'error' ? 'alert-circle' : 'sparkles'"
                :size="20"
                decorative
              />
              <span v-if="masteryProcessingStatus === 'processing'">正在整理本次作答证据……</span>
              <span v-else>{{ masteryProcessingMessage }}</span>
            </div>
            <LearningRecommendationCard
              v-if="strategyRecommendation"
              :recommendation="strategyRecommendation"
              compact
              @action="returnToLesson(true)"
            />
            <div class="question-engine__result-grid" role="region" aria-label="本次练习结果">
              <div class="question-engine__result-item">
                <strong>{{ viewModel.resultSummary.correctCount }}</strong
                ><span>答对</span>
              </div>
              <div class="question-engine__result-item">
                <strong>{{ viewModel.resultSummary.incorrectCount }}</strong
                ><span>答错</span>
              </div>
              <div class="question-engine__result-item">
                <strong>{{ viewModel.resultSummary.manualReviewCount }}</strong
                ><span>待人工判断</span>
              </div>
              <div class="question-engine__result-item">
                <strong>{{
                  viewModel.resultSummary.percentage === null
                    ? '—'
                    : `${viewModel.resultSummary.percentage}%`
                }}</strong
                ><span>本次自动评分正确率</span>
              </div>
            </div>
            <div class="question-engine__completion-actions">
              <AppButton variant="secondary" @click="restartAssessment">重新挑战</AppButton>
              <AppButton size="lg" icon-left="book-open" @click="returnToLesson(true)">{{
                returnLabel
              }}</AppButton>
              <AppButton v-if="isDevRoute" variant="secondary" @click="resetDemoAssessment"
                >再看一次示例</AppButton
              >
            </div>
          </section>

          <footer
            v-if="questionEngineStore.status !== 'completed' && currentQuestion"
            class="question-engine__navigation"
            aria-label="练习操作"
          >
            <AppButton
              variant="secondary"
              icon-left="arrow-left"
              :disabled="!questionEngineStore.canGoPrevious"
              @click="previousQuestion"
            >
              上一题
            </AppButton>
            <AppButton
              v-if="!questionEngineStore.isCurrentSubmitted"
              :disabled="!questionEngineStore.canSubmit"
              icon-right="check"
              @click="submitAnswer"
            >
              提交答案
            </AppButton>
            <AppButton v-else icon-right="arrow-right" @click="nextQuestion">
              {{ questionEngineStore.canGoNext ? '下一题' : '完成本次练习' }}
            </AppButton>
          </footer>

          <details
            v-if="isDevRoute && (viewModel.diagnostics.length || questionEngineStore.warning)"
            class="question-engine__diagnostics"
          >
            <summary>开发诊断</summary>
            <p v-if="questionEngineStore.warning">{{ questionEngineStore.warning }}</p>
            <p v-for="diagnostic in viewModel.diagnostics" :key="diagnostic">{{ diagnostic }}</p>
          </details>
        </template>
      </div>
    </div>
  </AppShell>
</template>
