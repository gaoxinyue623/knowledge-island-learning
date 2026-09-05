<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import InteractiveActivityRenderer from '@/components/interactive-activity/InteractiveActivityRenderer.vue'
import KnowledgeChallengeCard from '@/components/knowledge-point/KnowledgeChallengeCard.vue'
import ReadingQuest from '@/components/knowledge-point/ReadingQuest.vue'
import LessonContentRenderer from '@/components/lesson-player/LessonContentRenderer.vue'
import {
  isEnglishPilotTextbook,
  isMathPilotTextbook,
  isPilotTextbook,
} from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { contentExpansionRepository, practiceModeLabel } from '@/services/content-expansion'
import { createReadingQuest, questReadingText } from '@/services/content-expansion/readingQuest'
import { questionEngineAdapter } from '@/services/question-engine'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useLessonPlayerStore } from '@/stores/lessonPlayerStore'
import { useMasteryStore } from '@/stores/masteryStore'
import { useStudentStore } from '@/stores/studentStore'
import type {
  ActivityResult,
  AssessmentLaunchContext,
  Challenge,
  ContentExpansionBundle,
  ExtensionActivity,
  Id,
  LearningNodeStatus,
  LessonContentBlockViewModel,
  LessonLaunchContext,
  LessonPlayerDataset,
  StructuredContent,
} from '@/types'

interface DetailChallenge {
  id: Id
  title: string
  prompt: string
  hint?: string
  referenceAnswer?: string
  eyebrow?: string
}

const DEFAULT_DEMO_CONTEXT: LessonLaunchContext = {
  textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
  unitId: 'DEMO_UNIT_01',
  lessonId: 'DEMO_LESSON_1_1',
  knowledgePointId: 'DEMO_KP_01',
}

const NODE_STATUSES: readonly LearningNodeStatus[] = [
  'locked',
  'available',
  'learning',
  'completed',
  'mastered',
  'perfect',
]

const NODE_STATUS_LABELS: Record<LearningNodeStatus, string> = {
  locked: '尚未解锁',
  available: '可以开始',
  learning: '学习中',
  completed: '已完成',
  mastered: '已完成强化',
  perfect: '完成状态',
}

const MASTERY_STATE_LABELS = {
  not_started: '还没开始',
  learning: '正在掌握',
  weak: '需要巩固',
  mastered: '已经掌握',
} as const

const route = useRoute()
const router = useRouter()
const curriculumStore = useCurriculumStore()
const lessonPlayerStore = useLessonPlayerStore()
const masteryStore = useMasteryStore()
const studentStore = useStudentStore()

const invalidContextMessage = ref<string | null>(null)
const detailError = ref<string | null>(null)
const detailLoading = ref(false)
const practiceAvailable = ref<boolean | null>(null)
const expansionBundle = ref<ContentExpansionBundle | null>(null)
const selectedActivityId = ref<Id | null>(null)
const lastActivityMessage = ref<string | null>(null)
let loadToken = 0

const isDevRoute = computed(() => route.path.startsWith('/dev/knowledge-point'))
const knowledgePointId = computed(() => String(route.params.knowledgePointId ?? ''))

function queryString(key: string): string | null {
  const value = route.query[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

const dataset = computed<LessonPlayerDataset>(() => {
  if (!isDevRoute.value) return 'profile'
  const requested = queryString('dataset')
  return requested === 'demo' || requested === 'golden' || requested === 'profile'
    ? requested
    : 'demo'
})

const context = computed<LessonLaunchContext | null>(() => {
  const values = {
    textbookId: queryString('textbookId'),
    unitId: queryString('unitId'),
    lessonId: queryString('lessonId'),
    knowledgePointId: queryString('knowledgePointId'),
  }
  const hasAnyContextValue = Object.values(values).some(Boolean)
  if (
    Object.values(values).every((value): value is string => typeof value === 'string') &&
    values.knowledgePointId === knowledgePointId.value
  ) {
    return values as LessonLaunchContext
  }
  if (!hasAnyContextValue && isDevRoute.value && knowledgePointId.value === 'DEMO_KP_01') {
    return DEFAULT_DEMO_CONTEXT
  }
  return null
})

const profileId = computed(
  () =>
    (isDevRoute.value ? studentStore.profile?.id : curriculumStore.curriculumProfile?.studentId) ??
    'local-profile',
)

const returnPath = computed(() => {
  const requested = queryString('returnTo')
  const allowed = ['/home', '/tasks', '/dev/home', '/learning-map', '/dev/learning-map']
  if (
    requested &&
    (allowed.includes(requested) || /^\/(?:dev\/)?knowledge-point\/[^/]+$/.test(requested))
  ) {
    return requested
  }
  return isDevRoute.value ? '/dev/learning-map' : '/learning-map'
})

const returnLabel = computed(() =>
  ['/home', '/tasks', '/dev/home'].includes(returnPath.value) ? '返回首页' : '返回知识地图',
)

const mapNodeId = computed(() => queryString('mapNodeId'))
const detailPath = computed(
  () =>
    `${isDevRoute.value ? '/dev' : ''}/knowledge-point/${encodeURIComponent(knowledgePointId.value)}`,
)

const nodeStatus = computed<LearningNodeStatus>(() => {
  const requested = queryString('nodeStatus')
  return requested && NODE_STATUSES.includes(requested as LearningNodeStatus)
    ? (requested as LearningNodeStatus)
    : 'available'
})

const nodeProgress = computed(() => {
  const requested = Number(queryString('nodeProgress'))
  return Number.isFinite(requested) ? Math.min(100, Math.max(0, requested)) : 0
})

const viewModel = computed(() => lessonPlayerStore.viewModel)
const isFormalPilot = computed(() => isPilotTextbook(context.value?.textbookId))
const isEnglishSubject = computed(() => isEnglishPilotTextbook(context.value?.textbookId))
const isMathSubject = computed(() => isMathPilotTextbook(context.value?.textbookId))
const masteryRecord = computed(() => masteryStore.getByKnowledgePoint(knowledgePointId.value))
const canShowDetail = computed(
  () =>
    Boolean(viewModel.value) &&
    ['ready', 'completed'].includes(lessonPlayerStore.status) &&
    !invalidContextMessage.value,
)
const pageError = computed(
  () =>
    invalidContextMessage.value ??
    detailError.value ??
    (lessonPlayerStore.status === 'error' ? lessonPlayerStore.error : null),
)

const contentBlocks = computed<LessonContentBlockViewModel[]>(() => {
  const blocks = viewModel.value?.steps.flatMap((step) => step.contentBlocks) ?? []
  return blocks.sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
})

const readingQuest = computed(() =>
  createReadingQuest({
    bundle: expansionBundle.value,
    title: viewModel.value?.lesson.title ?? '',
    text: questReadingText(contentBlocks.value),
  }),
)

const contentChallenge = computed<DetailChallenge>(() => {
  const practiceBlock = contentBlocks.value.find((block) =>
    block.content?.trim().startsWith('小练习：'),
  )
  const prompt = practiceBlock?.content?.replace(/^小练习：\s*/, '').trim()
  const firstGoal = viewModel.value?.learningGoals[0]
  return {
    id: `${knowledgePointId.value || 'knowledge-point'}:content-challenge`,
    title: '说说你的发现',
    prompt:
      prompt ||
      `用自己的话说一说：${firstGoal || viewModel.value?.knowledgePoint.name || '你今天学到的内容'}`,
    hint:
      firstGoal ||
      viewModel.value?.knowledgePoint.description ||
      '先说出你观察到的对象，再说出你的发现。',
    eyebrow: '阅读后挑战',
  }
})

const transferChallenge = computed<DetailChallenge>(() => ({
  id: `${knowledgePointId.value || 'knowledge-point'}:transfer-challenge`,
  title: '把知识用起来',
  prompt: `不看提示，用一句完整的话说说“${viewModel.value?.lesson.title || '这一课'}”和你的生活有什么联系。`,
  hint: '可以先说出一个身边的对象，再说出你发现的相同点或不同点。',
  eyebrow: '生活连接',
}))

function structuredContentText(
  content: StructuredContent,
  type?: StructuredContent['blocks'][number]['type'],
): string {
  return content.blocks
    .filter((block) => !type || block.type === type)
    .map((block) => block.value.trim())
    .filter(Boolean)
    .join(' · ')
}

function expansionChallenge(record: Challenge | ExtensionActivity): DetailChallenge {
  const contentText = structuredContentText(record.content, 'text')
  const hint = structuredContentText(record.content, 'hint')
  return {
    id: record.id,
    title: record.title,
    prompt: record.instruction,
    ...(record.referenceAnswer ? { referenceAnswer: record.referenceAnswer } : {}),
    ...(hint || contentText
      ? { hint: hint || `可以先写下：${contentText}` }
      : { hint: '先说出你的方法，再检查每一步是否清楚。' }),
    eyebrow: record.id.includes('EXTENSION') ? '生活拓展' : '知识挑战',
  }
}

const challengeCards = computed<DetailChallenge[]>(() => {
  const bundle = expansionBundle.value
  if (!bundle) return [contentChallenge.value, transferChallenge.value]
  const records = [...bundle.challenges, ...bundle.extensionActivities].sort((left, right) =>
    left.id.localeCompare(right.id),
  )
  return records.length ? records.map(expansionChallenge) : [contentChallenge.value]
})

const activities = computed(() =>
  [...(expansionBundle.value?.activities ?? [])].sort(
    (left, right) => left.sort - right.sort || left.id.localeCompare(right.id),
  ),
)
const selectedActivity = computed(
  () => activities.value.find((activity) => activity.id === selectedActivityId.value) ?? null,
)

const lessonActionLabel = computed(() => {
  const status = viewModel.value?.session.status
  if (status === 'completed') return '再次进入完整学习'
  if (status === 'in_progress') return '继续完整学习'
  return '开始完整学习'
})

const masteryStateLabel = computed(() =>
  masteryRecord.value ? MASTERY_STATE_LABELS[masteryRecord.value.state] : '',
)

function sourceNotice(): string {
  if (viewModel.value?.flags.isDemo)
    return '这是开发样本，用来验证详情页和挑战组件，不代表正式教材内容。'
  if (viewModel.value?.flags.isSample) return '这是示例内容，只用于开发验证。'
  if (isFormalPilot.value) {
    if (isMathSubject.value)
      return '已接入深圳地区北师大版二年级上册数学知识讲解与原创拓展练习。先理解方法，再动手闯关。'
    if (isEnglishSubject.value) {
      return '已接入深圳地区沪教版英语课文与配套拓展练习。拓展练习用于帮助理解，不会直接修改掌握度。'
    }
    return '已接入人教版语文一、二年级课文与配套拓展练习。拓展练习用于帮助理解，不会直接修改掌握度。'
  }
  if (viewModel.value?.flags.isUnverified) {
    return '当前内容已经接入课程库，但仍需完成内容审核；正式教材原文需要在获得授权后开放。'
  }
  return '当前内容来自已接入的课程内容库。'
}

async function checkPracticeAvailability(activeContext: LessonLaunchContext): Promise<void> {
  const assessmentContext: AssessmentLaunchContext = {
    ...activeContext,
    source: isDevRoute.value ? 'dev' : 'lesson_practice',
  }
  try {
    practiceAvailable.value = await questionEngineAdapter.getAssessmentAvailability(
      assessmentContext,
      { dataset: dataset.value, studentId: profileId.value },
    )
  } catch {
    practiceAvailable.value = false
  }
}

async function loadDetail(): Promise<void> {
  const token = ++loadToken
  invalidContextMessage.value = null
  detailError.value = null
  practiceAvailable.value = null
  expansionBundle.value = null
  selectedActivityId.value = null
  lastActivityMessage.value = null

  const activeContext = context.value
  if (!activeContext) {
    detailLoading.value = false
    invalidContextMessage.value = '请从知识地图进入一个有效的知识点。'
    return
  }

  detailLoading.value = true
  try {
    await Promise.all([
      lessonPlayerStore.loadLesson(activeContext, {
        dataset: dataset.value,
        studentId: profileId.value,
      }),
      masteryStore.load(profileId.value),
    ])
    if (token !== loadToken) return

    if (['ready', 'completed'].includes(lessonPlayerStore.status)) {
      const expansionDataset =
        dataset.value === 'profile' ? (isFormalPilot.value ? 'candidate' : 'profile') : 'golden'
      expansionBundle.value = await contentExpansionRepository.getBundle(
        activeContext.knowledgePointId,
        expansionDataset,
      )
      if (token !== loadToken) return
      await checkPracticeAvailability(activeContext)
    }
  } catch {
    if (token === loadToken) detailError.value = '知识点详情暂时无法加载，请重新试一次。'
  } finally {
    if (token === loadToken) {
      detailLoading.value = false
      if (route.hash === '#knowledge-challenges') {
        await nextTick()
        document.getElementById('knowledge-challenges')?.scrollIntoView({ block: 'start' })
      }
    }
  }
}

function returnToPrevious(): void {
  const focus = mapNodeId.value
  const shouldFocusMap = ['/learning-map', '/dev/learning-map'].includes(returnPath.value)
  void router.push({
    path: returnPath.value,
    ...(shouldFocusMap && focus ? { query: { focusNodeId: focus } } : {}),
  })
}

function openLesson(): void {
  if (!context.value || nodeStatus.value === 'locked') return
  void router.push({
    path: isDevRoute.value ? '/dev/lesson-player' : '/lesson',
    query: {
      ...context.value,
      ...(isDevRoute.value ? { dataset: dataset.value } : {}),
      ...(mapNodeId.value ? { mapNodeId: mapNodeId.value } : {}),
      nodeStatus: nodeStatus.value,
      nodeProgress: String(nodeProgress.value),
      returnTo: detailPath.value,
      detailReturnTo: returnPath.value,
    },
  })
}

function openAssessment(): void {
  if (!context.value || practiceAvailable.value !== true) return
  void router.push({
    path: isDevRoute.value ? '/dev/question-engine' : '/assessment',
    query: {
      ...context.value,
      source: isDevRoute.value ? 'dev' : 'lesson_practice',
      ...(isDevRoute.value ? { dataset: dataset.value } : {}),
      returnTo: detailPath.value,
      lessonReturnTo: returnPath.value,
      ...(mapNodeId.value ? { mapNodeId: mapNodeId.value } : {}),
    },
  })
}

function selectActivity(activityId: Id): void {
  selectedActivityId.value = activityId
  lastActivityMessage.value = null
}

function recordActivityResult(result: ActivityResult): void {
  lastActivityMessage.value =
    result.status === 'completed'
      ? '这项互动挑战完成了。结果只记录为活动进度，不改变掌握度。'
      : '这项活动暂时没有完成，请先看看提示再试一次。'
}

watch(
  () => activities.value.map((activity) => activity.id).join('|'),
  () => {
    selectedActivityId.value = activities.value[0]?.id ?? null
  },
  { immediate: true },
)
onMounted(() => void loadDetail())
watch(
  () => route.fullPath,
  () => void loadDetail(),
)
</script>

<template>
  <AppShell
    :show-bottom-nav="false"
    :context="isDevRoute ? 'DEV / 知识点详情' : '知识点详情'"
    class="knowledge-detail-shell"
  >
    <div class="knowledge-detail-page content-container">
      <div class="knowledge-detail">
        <header class="knowledge-detail__header">
          <RouterLink
            class="knowledge-detail__back"
            :to="returnPath"
            @click.prevent="returnToPrevious"
          >
            <AppIcon name="arrow-left" :size="18" decorative />
            {{ returnLabel }}
          </RouterLink>
          <div class="knowledge-detail__header-copy">
            <p class="curriculum-eyebrow">知识小站 · 读一读，想一想</p>
            <h1>{{ viewModel?.knowledgePoint.name || '正在准备知识点详情' }}</h1>
            <p v-if="viewModel">{{ viewModel.unit.title }} · {{ viewModel.lesson.title }}</p>
          </div>
          <div v-if="viewModel" class="knowledge-detail__badges" aria-label="内容状态">
            <span
              v-if="viewModel.flags.isDemo || viewModel.flags.isSample"
              class="knowledge-detail__badge knowledge-detail__badge--sample"
            >
              {{ viewModel.flags.isDemo ? '开发样本' : '示例内容' }}
            </span>
            <span
              v-if="viewModel.flags.isUnverified && !isFormalPilot"
              class="knowledge-detail__badge knowledge-detail__badge--warning"
            >
              未审核
            </span>
          </div>
        </header>

        <AppLoading v-if="detailLoading" label="正在准备知识点详情" />
        <template v-else-if="pageError">
          <AppErrorState
            title="知识点详情暂时打不开"
            :description="pageError"
            @retry="loadDetail"
          />
          <AppButton variant="ghost" icon-left="arrow-left" @click="returnToPrevious">
            {{ returnLabel }}
          </AppButton>
        </template>
        <AppEmptyState
          v-else-if="lessonPlayerStore.status === 'not_available'"
          title="这部分内容暂未开放"
          description="课程内容还需要完成审核，暂时不能展示详情。"
          :action-label="returnLabel"
          @action="returnToPrevious"
        />
        <AppEmptyState
          v-else-if="lessonPlayerStore.status === 'empty'"
          title="这部分内容正在准备中"
          description="这个知识点已经在地图上，但可阅读内容还没有准备好。"
          :action-label="returnLabel"
          @action="returnToPrevious"
        />

        <template v-else-if="canShowDetail && viewModel">
          <div
            class="knowledge-detail__source-notice"
            :class="{
              'knowledge-detail__source-notice--sample':
                viewModel.flags.isDemo || viewModel.flags.isSample,
            }"
            role="status"
          >
            <AppIcon name="info" :size="20" decorative />
            <p>{{ sourceNotice() }}</p>
          </div>

          <section class="knowledge-detail__summary" aria-labelledby="knowledge-summary-title">
            <div class="knowledge-detail__summary-copy">
              <p class="curriculum-eyebrow">当前知识点</p>
              <h2 id="knowledge-summary-title">{{ viewModel.knowledgePoint.name }}</h2>
              <p>
                {{ viewModel.knowledgePoint.description || '先阅读内容，再用挑战检验自己的理解。' }}
              </p>
            </div>
            <div class="knowledge-detail__progress">
              <div class="knowledge-detail__progress-heading">
                <span>{{ NODE_STATUS_LABELS[nodeStatus] }}</span>
                <strong>{{ Math.round(nodeProgress) }}%</strong>
              </div>
              <AppProgress :value="nodeProgress" label="地图完成度" />
              <small>地图完成度只表示走过的学习节点。</small>
            </div>
            <dl class="knowledge-detail__facts">
              <div>
                <dt>教材</dt>
                <dd>{{ viewModel.textbook.title }}</dd>
              </div>
              <div>
                <dt>单元</dt>
                <dd>{{ viewModel.unit.title }}</dd>
              </div>
              <div>
                <dt>课程</dt>
                <dd>{{ viewModel.lesson.title }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="masteryRecord"
            class="knowledge-detail__mastery"
            aria-labelledby="knowledge-mastery-title"
          >
            <div>
              <p class="curriculum-eyebrow">看看自己的学习进展</p>
              <h2 id="knowledge-mastery-title">掌握度记录</h2>
              <p>{{ masteryStateLabel }} · 来自已经提交的题目证据</p>
            </div>
            <strong>{{ Math.round(masteryRecord.masteryScore) }}%</strong>
            <small>查看详情不会改变掌握度。</small>
          </section>

          <section class="knowledge-detail__actions" aria-label="知识点操作">
            <AppButton
              :disabled="nodeStatus === 'locked'"
              icon-right="arrow-right"
              @click="openLesson"
            >
              {{ lessonActionLabel }}
            </AppButton>
            <AppButton
              v-if="practiceAvailable === true"
              variant="secondary"
              icon-left="check-circle"
              @click="openAssessment"
            >
              开始正式练习
            </AppButton>
            <a v-if="readingQuest" href="#knowledge-challenges" class="reading-quest__entry">
              <AppIcon name="route" :size="18" decorative />开始课后闯关 ·
              {{ readingQuest.stages.length }} 关
            </a>
            <p
              v-if="practiceAvailable === false && !readingQuest"
              class="knowledge-detail__practice-note"
            >
              正式练习题正在准备中，可以先完成下面的知识挑战。
            </p>
            <p v-if="nodeStatus === 'locked'" class="knowledge-detail__locked-note" role="status">
              先完成前置知识，就能解锁完整学习。当前页面可以先阅读，不会自动改变地图进度。
            </p>
          </section>

          <section
            class="knowledge-detail__panel knowledge-detail__goals"
            aria-labelledby="knowledge-goals-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">带着好奇心出发</p>
                <h2 id="knowledge-goals-title">今天要发现什么</h2>
              </div>
            </div>
            <ul>
              <li v-for="goal in viewModel.learningGoals" :key="goal">{{ goal }}</li>
              <li v-if="!viewModel.learningGoals.length">先阅读内容，再用自己的话说出一个发现。</li>
            </ul>
          </section>

          <section
            id="knowledge-reading"
            class="knowledge-detail__panel knowledge-detail__reading"
            aria-labelledby="knowledge-reading-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">
                  {{ isMathSubject ? '发现身边的数学' : '翻开今天的故事' }}
                </p>
                <h2 id="knowledge-reading-title">{{ isMathSubject ? '知识讲解' : '课文原文' }}</h2>
              </div>
              <span>{{ contentBlocks.length }} 段内容</span>
            </div>
            <p class="knowledge-detail__content-note">
              <template v-if="isFormalPilot">
                <template v-if="isMathSubject">
                  根据本课知识提要学习方法，再用下面的原创闯关练习试一试。图示帮助理解，开放探究鼓励不同解法。
                </template>
                <template v-else-if="isEnglishSubject">
                  这里是已接入的英语学习文本和配套练习，先听读，再完成单词拼写和句子介绍。
                </template>
                <template v-else>
                  这里是已接入的课文原文和配套学习内容，读一读，再完成下面的挑战。
                </template>
              </template>
              <template v-else>
                当前展示课程库已接入的学习文本、重点和活动提示；完整教材原文将在获得授权并完成审核后接入。
              </template>
            </p>
            <LessonContentRenderer
              :blocks="contentBlocks"
              :show-diagnostics="isDevRoute"
              :practice-available="practiceAvailable"
              @start-assessment="openAssessment"
            />
          </section>

          <section
            id="knowledge-challenges"
            class="knowledge-detail__panel knowledge-detail__challenges"
            aria-labelledby="knowledge-challenges-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">读完了，带着发现出发</p>
                <h2 id="knowledge-challenges-title">
                  {{ isMathSubject ? '数学闯关' : readingQuest ? '课后闯关' : '知识挑战' }}
                </h2>
              </div>
              <span>{{
                readingQuest
                  ? readingQuest.stages.length + ' 个小关卡'
                  : challengeCards.length + activities.length + ' 项挑战'
              }}</span>
            </div>
            <ReadingQuest v-if="readingQuest" :quest="readingQuest" :profile-id="profileId" />
            <p v-else class="knowledge-detail__section-intro">
              <template v-if="isFormalPilot">
                <template v-if="isEnglishSubject">
                  这里包含单词拼写、句子介绍和听读表达。先读出答案，再查看提示和参考思路；不会直接修改掌握度。
                </template>
                <template v-else>
                  这里包含阅读理解、生字组词、拼音练习和生活表达。先写下答案，再查看提示和参考思路；不会直接修改掌握度。
                </template>
              </template>
              <template v-else>
                先想一想、写下理由，再查看提示。这里的互动只帮助你表达理解，不会直接修改掌握度。
              </template>
            </p>

            <div v-if="activities.length" class="knowledge-detail__activity-area">
              <div class="knowledge-detail__subheading">
                <div>
                  <p class="curriculum-eyebrow">动手试一试</p>
                  <h3>动手挑战</h3>
                </div>
                <span>{{ activities.length }} 项互动</span>
              </div>
              <nav class="knowledge-detail__activity-tabs" aria-label="选择互动挑战">
                <button
                  v-for="activity in activities"
                  :key="activity.id"
                  class="knowledge-detail__activity-tab"
                  type="button"
                  :class="{
                    'knowledge-detail__activity-tab--current': activity.id === selectedActivity?.id,
                  }"
                  @click="selectActivity(activity.id)"
                >
                  <strong>{{ activity.title }}</strong>
                  <small>{{ activity.difficulty }} · {{ activity.activityType }}</small>
                </button>
              </nav>
              <InteractiveActivityRenderer
                v-if="selectedActivity"
                :activity="selectedActivity"
                :profile-id="profileId"
                @result="recordActivityResult"
              />
              <p v-if="lastActivityMessage" class="knowledge-detail__activity-result" role="status">
                {{ lastActivityMessage }}
              </p>
            </div>

            <details v-if="readingQuest" class="reading-quest__expression">
              <summary>
                {{ isMathSubject ? '动手探究 · 讲讲你的解法' : '再说一说 · 开放表达' }}
                <span>没有唯一答案，也可以先说给身边的人听</span>
              </summary>
              <div class="knowledge-detail__challenge-grid">
                <KnowledgeChallengeCard
                  v-for="challenge in challengeCards"
                  :key="profileId + challenge.id"
                  :challenge-id="challenge.id"
                  :title="challenge.title"
                  :prompt="challenge.prompt"
                  :hint="challenge.hint"
                  :reference-answer="challenge.referenceAnswer"
                  :eyebrow="challenge.eyebrow"
                />
              </div>
            </details>
            <div v-else class="knowledge-detail__challenge-grid">
              <KnowledgeChallengeCard
                v-for="challenge in challengeCards"
                :key="challenge.id"
                :challenge-id="challenge.id"
                :title="challenge.title"
                :prompt="challenge.prompt"
                :hint="challenge.hint"
                :reference-answer="challenge.referenceAnswer"
                :eyebrow="challenge.eyebrow"
              />
            </div>
          </section>

          <section
            v-if="expansionBundle?.practiceSets.length"
            class="knowledge-detail__panel knowledge-detail__practice"
            aria-labelledby="knowledge-practice-title"
          >
            <div class="knowledge-detail__section-heading">
              <div>
                <p class="curriculum-eyebrow">练一练，记得更牢</p>
                <h2 id="knowledge-practice-title">练习集合</h2>
              </div>
              <span>{{ expansionBundle.practiceSets.length }} 组</span>
            </div>
            <div class="knowledge-detail__practice-list">
              <article v-for="practice in expansionBundle.practiceSets" :key="practice.id">
                <span>{{ practiceModeLabel(practice.mode) }}</span>
                <strong>{{ practice.title }}</strong>
                <small
                  >{{ practice.targetCount }} 题 · 难度 {{ practice.difficultyRange.min }}—{{
                    practice.difficultyRange.max
                  }}</small
                >
              </article>
            </div>
          </section>

          <RouterLink
            class="knowledge-detail__footer-back"
            :to="returnPath"
            @click.prevent="returnToPrevious"
          >
            <AppIcon name="arrow-left" :size="18" decorative />
            {{ returnLabel }}，继续探索其他知识点
          </RouterLink>
        </template>
      </div>
    </div>
  </AppShell>
</template>
