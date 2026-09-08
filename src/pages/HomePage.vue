<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import SubjectHabitat from '@/components/illustrations/SubjectHabitat.vue'
import ThinkingEntry from '@/components/thinking/ThinkingEntry.vue'
import ReadingEntry from '@/components/reading-islands/ReadingEntry.vue'
import SpacedReviewEntry from '@/components/student-growth/SpacedReviewEntry.vue'
import islandAdventure from '@/assets/illustrations/island-adventure.jpg'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useHomeStore } from '@/stores/homeStore'
import { useStudentStore } from '@/stores/studentStore'
import {
  createReviewLaunchHref,
  spacedReviewService,
  type SpacedReviewDue,
} from '@/services/student-growth/spacedReview'
import { resolveCurrentQuestRevision } from '@/services/student-growth/currentQuestResolver'
import type { DailyLearningTask, HomeViewModel, IconName, SubjectCode } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const homeStore = useHomeStore()
const studentStore = useStudentStore()
const dueReviews = ref<SpacedReviewDue[]>([])
let spacedReviewRequest = 0

const isDevRoute = computed(() => route.path === '/dev/home')
const isTasksRoute = computed(() => route.path === '/tasks')
const viewModel = computed(() => homeStore.viewModel)
const primaryTask = computed(
  () =>
    viewModel.value?.today.tasks.find(
      (task) => task.type === 'continue_learning' && task.status === 'pending',
    ) ?? viewModel.value?.today.tasks.find((task) => task.status === 'pending'),
)
const primarySubject = computed(() =>
  viewModel.value?.subjects.find(
    (subject) => subject.textbookId && subject.mapStatus !== 'not_available',
  ),
)
const primaryLabel = computed(() =>
  primaryTask.value
    ? taskActionLabel(primaryTask.value)
    : primarySubject.value
      ? `从${primarySubject.value.label}岛出发`
      : '选一本教材，开始学习',
)
function openPrimary(): void {
  if (primaryTask.value) return openTask(primaryTask.value)
  if (primarySubject.value) {
    void router.push({
      path: routeForHomePath('/learning-map'),
      query: {
        subject: primarySubject.value.code,
        ...(!isDevRoute.value ? { open: 'continue' } : {}),
      },
    })
  } else void router.push('/curriculum-settings')
}
const isFormalPilot = computed(
  () => viewModel.value?.subjects.some((subject) => isPilotTextbook(subject.textbookId)) ?? false,
)
const pageTitle = computed(() => (isTasksRoute.value ? '今日学习' : '知识岛首页'))
const pageContext = computed(() => (isDevRoute.value ? 'DEV / 首页样本' : pageTitle.value))
const taskCountLabel = computed(() => {
  const plan = viewModel.value?.today
  if (!plan) return ''
  return plan.progress.total
    ? `${plan.progress.completed} / ${plan.progress.total} 已完成`
    : '今天还没有安排'
})

function taskTypeLabel(type: DailyLearningTask['type']): string {
  return {
    continue_learning: '继续学习',
    review: '主动巩固',
    reinforce: '薄弱巩固',
    wrong_question: '错题重练',
    next_learning: '探索新知识',
  }[type]
}

function taskIcon(type: DailyLearningTask['type']): IconName {
  const icons: Record<DailyLearningTask['type'], IconName> = {
    continue_learning: 'book-open',
    review: 'lightbulb',
    reinforce: 'route',
    wrong_question: 'circle-help',
    next_learning: 'map',
  }
  return icons[type]
}

function taskActionLabel(task: DailyLearningTask): string {
  if (task.status === 'completed') return '已完成'
  if (task.status === 'unavailable') return '暂不可用'
  return {
    continue_learning: '继续学习',
    review: '去巩固',
    reinforce: '开始巩固',
    wrong_question: '再挑战一次',
    next_learning: '开始学习',
  }[task.type]
}

function taskStatusLabel(task: DailyLearningTask): string {
  return task.status === 'completed'
    ? '完成'
    : task.status === 'unavailable'
      ? '暂不可用'
      : '待完成'
}

function formatCount(count: number | undefined, suffix: string): string {
  return count === undefined ? '' : `${count} ${suffix}`
}

function routeForHomePath(path: string): string {
  if (!isDevRoute.value) return path
  if (path === '/history') return '/dev/history'
  if (path === '/wrong-book') return '/dev/wrong-book'
  if (path === '/review-queue') return '/dev/review-queue'
  if (path === '/learning-map') return '/dev/learning-map'
  return path
}

function launchContextQuery(task: DailyLearningTask) {
  if (task.action.type === 'lesson') {
    const context = task.action.launchContext
    return {
      textbookId: context.textbookId,
      unitId: context.unitId,
      lessonId: context.lessonId,
      knowledgePointId: context.knowledgePointId,
      ...(isDevRoute.value ? { dataset: 'demo' } : {}),
      returnTo: route.path,
    }
  }
  if (task.action.type !== 'assessment') return {}
  const context = task.action.launchContext
  return {
    textbookId: context.textbookId,
    unitId: context.unitId,
    lessonId: context.lessonId,
    knowledgePointId: context.knowledgePointId,
    source: context.source,
    ...(isDevRoute.value ? { dataset: 'demo' } : {}),
    returnTo: route.path,
  }
}

function openTask(task: DailyLearningTask): void {
  if (task.status !== 'pending') return
  const action = task.action
  if (action.type === 'lesson') {
    void router.push({
      path: isDevRoute.value ? '/dev/lesson-player' : '/lesson',
      query: launchContextQuery(task),
    })
    return
  }
  if (action.type === 'assessment') {
    void router.push({
      path: isDevRoute.value ? '/dev/question-engine' : '/assessment',
      query: launchContextQuery(task),
    })
    return
  }
  if (action.type === 'wrong_question') {
    void router.push({
      path: routeForHomePath('/wrong-book'),
      query: { questionId: action.wrongQuestionId },
    })
    return
  }
  if (action.type === 'review_queue') {
    void router.push({
      path: routeForHomePath('/review-queue'),
      query: { itemId: action.reviewQueueItemId },
    })
    return
  }
  void router.push({
    path: routeForHomePath('/learning-map'),
    ...(action.knowledgePointId ? { query: { knowledgePointId: action.knowledgePointId } } : {}),
  })
}

function openShortcut(path: string): void {
  void router.push(path)
}

function openSpacedReview(item: SpacedReviewDue): void {
  const attemptId = crypto.randomUUID()
  const href = createReviewLaunchHref(item.courseHref, attemptId)
  if (href) void router.push(href)
}

async function loadSpacedReviews(): Promise<void> {
  const activeProfileId = studentStore.profile?.id
  const request = ++spacedReviewRequest
  if (!activeProfileId) {
    dueReviews.value = []
    return
  }
  const evidence = spacedReviewService.listEvidence(activeProfileId)
  const revisions = await Promise.all(
    evidence.map(async (item) => ({
      questId: item.questId,
      resolved: await resolveCurrentQuestRevision(item.courseHref),
    })),
  )
  if (request !== spacedReviewRequest || activeProfileId !== studentStore.profile?.id) return
  const revisionByQuest: Record<string, string | null> = {}
  for (const item of revisions) {
    if (item.resolved && item.resolved.questId === item.questId)
      revisionByQuest[item.questId] = item.resolved.contentRevision
    else revisionByQuest[item.questId] = null
  }
  // An old or unresolvable record stays preserved but is not presented as current learning work.
  dueReviews.value = spacedReviewService.listDue(activeProfileId, new Date(), revisionByQuest)
}

function openSubject(subject: SubjectCode): void {
  const path = routeForHomePath('/learning-map')
  void router.push({ path, query: { subject } })
}

function openContinue(): void {
  const task = viewModel.value?.today.tasks.find(
    (candidate) => candidate.type === 'continue_learning' && candidate.status === 'pending',
  )
  if (task) openTask(task)
}

async function loadHome(): Promise<void> {
  if (isDevRoute.value) {
    await homeStore.load(undefined, { dataset: 'demo', seedDemo: true })
    return
  }
  await homeStore.load(curriculumStore.curriculumProfile ?? undefined, {
    dataset: 'profile',
    ...(studentStore.profile?.id === curriculumStore.curriculumProfile?.studentId
      ? { displayName: studentStore.profile?.displayName }
      : {}),
  })
}

function progressLabel(progress: HomeViewModel['today']['progress']): string {
  return progress.total ? `${progress.completed} / ${progress.total}` : '—'
}

function historySummary(item: HomeViewModel['recentLearning'][number]): string {
  const summary = item.summary
  if (!summary) return item.type.includes('completed') ? '已完成' : '已开始'
  if (summary.assessmentPercentage === null) return `${summary.questionCount ?? 0} 题 · 待人工查看`
  return `${summary.correctCount ?? 0} 对 · ${summary.incorrectCount ?? 0} 错`
}

onMounted(() => {
  void loadHome()
  void loadSpacedReviews()
})
watch(
  () => [route.path, curriculumStore.curriculumProfile?.studentId],
  () => void loadHome(),
)
watch(
  () => studentStore.profile?.id,
  () => void loadSpacedReviews(),
)
</script>

<template>
  <AppShell :show-bottom-nav="!isDevRoute" :context="pageContext">
    <div class="home-page content-container">
      <AppLoading v-if="homeStore.loading" label="正在准备今天的学习安排" />
      <AppErrorState
        v-else-if="homeStore.status === 'error'"
        title="首页暂时打不开"
        :description="homeStore.error || '请重新读取你的学习内容。'"
        @retry="loadHome"
      />
      <template v-else-if="viewModel">
        <div v-if="viewModel.warnings.length" class="home-page__notice" role="status">
          <AppIcon name="alert-circle" :size="18" decorative />
          <span>{{ viewModel.warnings[0] }}</span>
        </div>

        <section class="home-page__hero" aria-labelledby="home-title">
          <div class="home-page__hero-copy">
            <p class="curriculum-eyebrow">
              {{ isDevRoute ? 'DEVELOPMENT SAMPLE' : viewModel.greeting.title }}
            </p>
            <h1 id="home-title">小小好奇心，<br />大大的知识岛。</h1>
            <p>和知识团子一起，读故事、动脑筋，发现学习的小乐趣。</p>
            <div class="home-page__hero-actions">
              <AppButton icon-right="arrow-right" @click="openPrimary">
                {{ primaryLabel }}
              </AppButton>
              <AppButton
                v-if="isDevRoute"
                size="sm"
                variant="secondary"
                icon-left="refresh-cw"
                @click="homeStore.clearDemoPlans"
              >
                重置今日样本
              </AppButton>
            </div>
            <p v-if="primaryTask">接着学习：{{ primaryTask.title }}</p>
            <p v-else>先完成一小段阅读，再选几关练习。也可以在下方换一科出发。</p>
            <span class="home-page__date"
              >{{ viewModel.greeting.dateLabel }} · 每一步，都是新发现</span
            >
          </div>
          <div class="home-page__hero-scene" aria-hidden="true">
            <img :src="islandAdventure" alt="" width="1536" height="1024" fetchpriority="high" />
            <span class="home-page__scene-caption"
              ><AppIcon name="navigation" :size="16" decorative /> 好奇心号 · 准备出发</span
            >
          </div>
        </section>

        <div
          v-if="viewModel.flags.isSample || (viewModel.flags.isUnverified && !isFormalPilot)"
          class="home-page__source-note"
          role="note"
        >
          <AppIcon name="info" :size="18" decorative />
          <span>
            {{
              isDevRoute
                ? '这里展示的是开发样本，只用于检查首页学习闭环。'
                : '部分教材内容还在核验中，正式学习任务会等来源确认后开放。'
            }}
          </span>
        </div>

        <section class="home-page__today" aria-labelledby="today-title">
          <div class="home-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">一步一步，慢慢变厉害</p>
              <h2 id="today-title">今天学什么</h2>
              <p>今天的小目标，等你来探索。</p>
            </div>
            <strong>{{ taskCountLabel }}</strong>
          </div>
          <div v-if="viewModel.today.progress.total" class="home-page__daily-progress">
            <div class="home-page__progress-meta">
              <span>今日进度</span>
              <strong>{{ progressLabel(viewModel.today.progress) }}</strong>
            </div>
            <AppProgress
              :value="viewModel.today.progress.percentage"
              :show-value="false"
              label="今日完成度"
            />
          </div>
          <AppEmptyState
            v-if="!viewModel.today.tasks.length"
            title="今天的探索，从哪里开始？"
            description="不必等安排，先选一科开始。做完一小段就可以休息，下次再继续。"
            :action-label="primaryLabel"
            @action="openPrimary"
          />
          <ol v-else class="home-page__task-list">
            <li
              v-for="task in viewModel.today.tasks"
              :key="task.id"
              class="home-page__task-card"
              :class="`home-page__task-card--${task.status}`"
            >
              <div class="home-page__task-icon" aria-hidden="true">
                <AppIcon :name="taskIcon(task.type)" :size="22" decorative />
              </div>
              <div class="home-page__task-copy">
                <div class="home-page__task-meta">
                  <span class="home-page__task-type">{{ taskTypeLabel(task.type) }}</span>
                  <span class="home-page__task-status">{{ taskStatusLabel(task) }}</span>
                </div>
                <h3>{{ task.title }}</h3>
                <p v-if="task.description">{{ task.description }}</p>
                <small v-if="isDevRoute"
                  >{{ task.subject }} · {{ task.knowledgePointId || task.sourceId }}</small
                >
              </div>
              <AppButton
                variant="secondary"
                size="sm"
                :disabled="task.status !== 'pending'"
                icon-right="arrow-right"
                @click="openTask(task)"
              >
                {{ taskActionLabel(task) }}
              </AppButton>
            </li>
          </ol>
        </section>

        <SpacedReviewEntry :items="dueReviews" @launch="openSpacedReview" />

        <section
          v-if="viewModel.continueLearning"
          class="home-page__continue"
          aria-labelledby="continue-title"
        >
          <div class="home-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">接上你的探索足迹</p>
              <h2 id="continue-title">接着上次学习</h2>
              <p>从你停下的地方继续，不需要重新寻找。</p>
            </div>
            <strong>{{ viewModel.continueLearning.progress }}%</strong>
          </div>
          <div class="home-page__continue-body">
            <div>
              <span class="home-page__subject-label">{{ viewModel.continueLearning.subject }}</span>
              <h3>{{ viewModel.continueLearning.title }}</h3>
              <AppProgress
                :value="viewModel.continueLearning.progress"
                :show-value="false"
                label="课程进度"
              />
            </div>
            <AppButton variant="primary" icon-right="arrow-right" @click="openContinue"
              >继续学习</AppButton
            >
          </div>
        </section>

        <section class="home-page__subjects" aria-labelledby="subjects-title">
          <div class="home-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">每座小岛，都藏着新发现</p>
              <h2 id="subjects-title">我的学习地图</h2>
              <p>读一读，想一想，说一说。你想先去哪一座？</p>
            </div>
          </div>
          <div class="home-page__subject-grid">
            <article
              v-for="subject in viewModel.subjects"
              :key="subject.code"
              class="home-page__subject-card"
              :data-subject="subject.code"
              :style="{
                '--subject-color': subject.color,
                '--subject-soft-color': subject.softColor,
              }"
            >
              <SubjectHabitat :subject="subject.code" />
              <div class="home-page__subject-heading">
                <span class="home-page__subject-icon" aria-hidden="true"
                  ><AppIcon :name="subject.icon" :size="22" decorative
                /></span>
                <div>
                  <h3>{{ subject.label }}</h3>
                  <p>{{ subject.textbookName }}</p>
                </div>
              </div>
              <span
                v-if="subject.mapStatus !== 'available' && !isPilotTextbook(subject.textbookId)"
                class="home-page__subject-status"
              >
                {{
                  subject.mapStatus === 'sample'
                    ? '开发样本'
                    : subject.mapStatus === 'unverified'
                      ? '来源核验中'
                      : '暂未开放'
                }}
              </span>
              <p v-if="subject.currentKnowledgePointTitle" class="home-page__subject-current">
                当前：{{ subject.currentKnowledgePointTitle }}
              </p>
              <AppProgress
                v-if="subject.progress.total > 0"
                :value="subject.progress.percentage"
                :show-value="true"
                label="地图进度"
              />
              <p v-else-if="subject.completedLearningSessions" class="home-page__subject-current">
                已完成 {{ subject.completedLearningSessions }} 次课程学习 · 进岛接着探索
              </p>
              <p v-else class="home-page__subject-current">
                从亮起的第一站开始，一小步也值得记录。
              </p>
              <AppButton
                variant="ghost"
                full-width
                icon-right="arrow-right"
                @click="openSubject(subject.code)"
                >查看地图</AppButton
              >
            </article>
          </div>
        </section>

        <ThinkingEntry v-if="!isDevRoute && !isTasksRoute" />
        <ReadingEntry v-if="!isDevRoute && !isTasksRoute" />

        <div class="home-page__lower-grid">
          <section class="home-page__panel" aria-labelledby="recent-title">
            <div class="home-page__panel-heading">
              <div>
                <p class="curriculum-eyebrow">留下每一个小脚印</p>
                <h2 id="recent-title">最近学习</h2>
              </div>
              <AppButton
                variant="ghost"
                size="sm"
                @click="
                  openShortcut(
                    viewModel.shortcuts.find((item) => item.id === 'history')?.path ||
                      routeForHomePath('/history'),
                  )
                "
                >全部记录</AppButton
              >
            </div>
            <AppEmptyState
              v-if="!viewModel.recentLearning.length"
              title="完成学习后，这里会留下你的学习记录。"
              description="每次课程和练习完成后，记录会自动出现在这里。"
            />
            <ul v-else class="home-page__recent-list">
              <li v-for="item in viewModel.recentLearning" :key="item.id">
                <span class="home-page__recent-icon" aria-hidden="true"
                  ><AppIcon
                    :name="item.type.includes('assessment') ? 'circle-help' : 'book-open'"
                    :size="18"
                    decorative
                /></span>
                <div>
                  <strong>{{ item.title }}</strong
                  ><span
                    >{{
                      viewModel.subjects.find((subject) => subject.code === item.subject)?.label ??
                      '学习'
                    }}
                    · {{ historySummary(item) }}</span
                  >
                </div>
                <time :datetime="item.occurredAt">{{ item.occurredAt.slice(0, 10) }}</time>
              </li>
            </ul>
          </section>

          <section class="home-page__panel home-page__panel--growth" aria-labelledby="growth-title">
            <div class="home-page__panel-heading">
              <div>
                <p class="curriculum-eyebrow">一点一滴，都在成长</p>
                <h2 id="growth-title">成长反馈</h2>
              </div>
              <AppIcon name="star" :size="22" decorative />
            </div>
            <strong class="home-page__energy">{{ viewModel.growth.knowledgeEnergy }}</strong>
            <p>知识能量</p>
            <div class="home-page__growth-meta">
              <span>成长等级 {{ viewModel.growth.growthLevel }}</span
              ><span>{{ viewModel.growth.progressToNextLevel }}% 到下一级</span>
            </div>
            <AppProgress
              :value="viewModel.growth.progressToNextLevel"
              :show-value="false"
              label="成长进度"
            />
            <AppButton
              variant="secondary"
              full-width
              @click="openShortcut(isDevRoute ? '/dev/reward' : '/achievements')"
              >查看成长反馈</AppButton
            >
          </section>
        </div>

        <section class="home-page__shortcuts" aria-labelledby="shortcuts-title">
          <div class="home-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">整理好装备，继续出发</p>
              <h2 id="shortcuts-title">常用入口</h2>
            </div>
          </div>
          <div class="home-page__shortcut-grid">
            <button
              v-for="shortcut in viewModel.shortcuts"
              :key="shortcut.id"
              type="button"
              class="home-page__shortcut"
              @click="openShortcut(shortcut.path)"
            >
              <span class="home-page__shortcut-icon" aria-hidden="true"
                ><AppIcon :name="shortcut.icon" :size="20" decorative
              /></span>
              <span
                ><strong>{{ shortcut.label }}</strong
                ><small>{{ shortcut.description }}</small></span
              >
              <b v-if="shortcut.count">{{ formatCount(shortcut.count, '项') }}</b>
            </button>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>
