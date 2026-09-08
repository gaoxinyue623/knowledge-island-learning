<script setup lang="ts">
import LearningActivityHistory from '@/components/common/LearningActivityHistory.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PetParentReport from '@/components/pet/PetParentReport.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppProgress from '@/components/common/AppProgress.vue'
import { phase14DemoProfile } from '@/data/home'
import { createParentReportDemoFacts } from '@/data/parent-report'
import { subjectTheme } from '@/data/subjectTheme'
import AppShell from '@/layouts/AppShell.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useParentReportStore } from '@/stores/parentReportStore'
import { useStudentStore } from '@/stores/studentStore'
import {
  getCurriculumPresentation,
  type CurriculumPresentation,
} from '@/composables/useCurriculumPresentation'
import type {
  ParentReport,
  ParentReportDemoScenario,
  ParentReportSubject,
  SubjectCode,
} from '@/types'

const { profileId: learningProfileId } = useLearningProfile()
const route = useRoute()
const router = useRouter()
const curriculumStore = useCurriculumStore()
const reportStore = useParentReportStore()
const studentStore = useStudentStore()
const presentation = ref<CurriculumPresentation | null>(null)

const demoScenario = ref<ParentReportDemoScenario>('full')
const demoScenarios: Array<{ value: ParentReportDemoScenario; label: string }> = [
  { value: 'full', label: '完整数据' },
  { value: 'empty', label: '空数据' },
  { value: 'sample', label: '开发样本' },
  { value: 'unverified', label: '未审核提示' },
  { value: 'weak-heavy', label: '待巩固较多' },
  { value: 'no-wrong-book', label: '没有错题' },
  { value: 'no-review', label: '没有待巩固' },
  { value: 'partial', label: '部分数据' },
  { value: 'error', label: '读取失败' },
]

const isDevRoute = computed(() => route.path === '/dev/parent-dashboard')
const pageContext = computed(() => (isDevRoute.value ? 'DEV / 家长学习报告' : '家长学习报告'))
const currentProfileId = computed(() =>
  isDevRoute.value ? phase14DemoProfile.studentId : learningProfileId.value,
)
const currentProfile = computed(() =>
  isDevRoute.value ? phase14DemoProfile : curriculumStore.curriculumProfile,
)
const report = computed(() => reportStore.report)
const displayName = computed(() =>
  !isDevRoute.value && studentStore.profile?.id === currentProfileId.value
    ? studentStore.profile.displayName
    : report.value?.profile.displayName,
)
const companionTip = computed(() => {
  if (report.value?.wrongBook.activeCount)
    return '一起选一道错题，请孩子先讲自己的想法，再看提示重练。'
  if (report.value?.participation.completedLessons)
    return '请孩子挑出今天学到的一件事，讲给你听；一起回看一个例子或一句话。'
  return '先陪孩子选一科，完成一小段学习，再听听孩子发现了什么。'
})
const hasAnyData = computed(() => {
  const value = report.value
  if (!value) return false
  return Boolean(
    value.participation.recentItems.length ||
    value.overview.learningDays ||
    value.overview.completedLessons ||
    value.overview.completedAssessments ||
    value.overview.completedDailyTasks ||
    value.overview.totalDailyTasks ||
    value.mastery.totalKnowledgePoints ||
    value.weakKnowledge.totalCount ||
    value.wrongBook.activeCount ||
    value.wrongBook.resolvedCount ||
    value.review.pendingCount ||
    value.review.completedCount ||
    value.activity.recentItems.length ||
    value.growth.knowledgeEnergy ||
    value.achievements.unlockedCount,
  )
})
const visibleSubjects = computed(() => {
  if (!report.value) return []
  if (report.value.subjectFilter === 'ALL') return report.value.subjects
  return report.value.subjects.filter((item) => item.subject === report.value?.subjectFilter)
})
const trendMax = computed(() =>
  Math.max(
    1,
    ...(report.value?.trend.points.map(
      (point) => point.completedTaskCount + point.activityCount,
    ) ?? [1]),
  ),
)
const trendAccessibleSummary = computed(() => {
  const points = report.value?.trend.points ?? []
  if (!points.length) return '选择范围内还没有可展示的完成记录。'
  return points
    .map(
      (point) => `${point.dateKey}：${point.completedTaskCount + point.activityCount} 条完成记录`,
    )
    .join('；')
})

function subjectLabel(subject: SubjectCode | ParentReportSubject | undefined): string {
  if (!subject || subject === 'UNKNOWN') return '待识别学科'
  return subjectTheme[subject].label
}

function stateLabel(state: string): string {
  return (
    {
      not_started: '尚未开始',
      learning: '学习中',
      weak: '需要巩固',
      mastered: '已掌握',
    }[state] ?? state
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDateKey(value: string): string {
  const parts = value.split('-')
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : value
}

function trendHeight(point: ParentReport['trend']['points'][number]): number {
  const total = point.completedTaskCount + point.activityCount
  return total ? Math.max(18, Math.round((total / trendMax.value) * 100)) : 8
}

function assessmentSummary(item: ParentReport['activity']['recentItems'][number]): string | null {
  if (item.type !== 'assessment_completed' || !item.summary) return null
  const summary = item.summary
  const percentage =
    summary.assessmentPercentage === null || summary.assessmentPercentage === undefined
      ? '待人工判断'
      : `${summary.assessmentPercentage}%`
  return `共 ${summary.questionCount ?? 0} 题 · 答对 ${summary.correctCount ?? 0} · 答错 ${summary.incorrectCount ?? 0} · 答题正确率 ${percentage}（不等于掌握度）`
}

function childPath(path: '/learning-map' | '/wrong-book' | '/review-queue'): string {
  return isDevRoute.value ? `/dev${path}` : path
}

function goToChild(path: '/learning-map' | '/wrong-book' | '/review-queue'): void {
  void router.push(childPath(path))
}

function returnToChild(): void {
  void router.push(isDevRoute.value ? '/dev/home' : '/home')
}

async function loadReport(): Promise<void> {
  const profileId = currentProfileId.value
  const profile = currentProfile.value
  presentation.value = null
  if (profile) {
    try {
      const result = await getCurriculumPresentation(profile)
      if (profileId === currentProfileId.value) presentation.value = result
    } catch {
      /* Names are optional; report facts still load independently. */
    }
  }
  await reportStore.loadReport(profileId, {
    dataset: isDevRoute.value ? 'demo' : 'profile',
    profile: currentProfile.value ?? undefined,
    range: reportStore.selectedRange,
    subject: reportStore.selectedSubject,
    ...(isDevRoute.value ? { demoScenario: demoScenario.value } : {}),
    ...(isDevRoute.value ? { demoFacts: createParentReportDemoFacts(profileId) } : {}),
  })
}

async function changeRange(): Promise<void> {
  await reportStore.changeRange(reportStore.selectedRange)
}

async function changeSubject(): Promise<void> {
  await reportStore.changeSubject(reportStore.selectedSubject)
}

async function changeDemoScenario(): Promise<void> {
  await loadReport()
}

onMounted(() => void loadReport())
watch(
  () => [route.path, currentProfileId.value],
  () => void loadReport(),
)
</script>

<template>
  <AppShell :show-bottom-nav="false" :context="pageContext">
    <LearningActivityHistory
      v-if="!isDevRoute"
      :profile-id="currentProfileId"
      :start-date="report?.range.startDate"
      :end-date="report?.range.endDate"
      :subject="reportStore.selectedSubject"
    />
    <div class="parent-report-page content-container">
      <RouterLink v-if="!isDevRoute" class="personal-back" to="/profile"
        >← 返回我的学习空间</RouterLink
      >
      <header class="parent-report-page__header">
        <div class="parent-report-page__header-copy">
          <p class="curriculum-eyebrow">一起看见每一步进步</p>
          <h1>{{ isDevRoute ? '家长学习报告样本' : '学习报告' }}</h1>
          <p>看看孩子最近学过什么、哪些地方正在巩固，以及已经留下的学习足迹。</p>
          <p class="parent-report-page__profile-line">
            {{ displayName || '当前学习档案' }}
            <span v-if="presentation"
              >· {{ presentation.gradeName }} · {{ presentation.semesterName }}</span
            >
          </p>
        </div>
        <div class="parent-report-page__header-actions">
          <AppButton variant="secondary" icon-left="map" @click="goToChild('/learning-map')">
            查看知识岛
          </AppButton>
          <AppButton variant="secondary" icon-left="arrow-left" @click="returnToChild">
            返回孩子端
          </AppButton>
          <AppButton
            variant="ghost"
            icon-left="refresh-cw"
            :loading="reportStore.loading"
            @click="loadReport"
          >
            重新读取
          </AppButton>
        </div>
      </header>
      <PetParentReport v-if="!isDevRoute" />

      <section class="parent-report-page__controls" aria-labelledby="report-controls-title">
        <div>
          <p class="curriculum-eyebrow">按需要查看</p>
          <h2 id="report-controls-title">查看范围</h2>
        </div>
        <div class="parent-report-page__control-grid">
          <label>
            <span>报告范围</span>
            <select v-model="reportStore.selectedRange" @change="changeRange">
              <option value="7d">最近 7 天</option>
              <option value="30d">最近 30 天</option>
              <option value="all">全部记录</option>
            </select>
          </label>
          <label>
            <span>学科筛选</span>
            <select v-model="reportStore.selectedSubject" @change="changeSubject">
              <option value="ALL">全部学科</option>
              <option value="CHINESE">语文</option>
              <option value="MATH">数学</option>
              <option value="ENGLISH">英语</option>
            </select>
          </label>
          <label v-if="isDevRoute">
            <span>开发数据场景</span>
            <select v-model="demoScenario" @change="changeDemoScenario">
              <option
                v-for="scenario in demoScenarios"
                :key="scenario.value"
                :value="scenario.value"
              >
                {{ scenario.label }}
              </option>
            </select>
          </label>
        </div>
        <p v-if="report" class="parent-report-page__range-note" role="status">
          当前范围：{{ report.range.startDate }} 至 {{ report.range.endDate }}
        </p>
      </section>

      <div v-if="reportStore.warning" class="parent-report-page__notice" role="status">
        <AppIcon name="alert-circle" :size="18" decorative />
        <span>{{
          isDevRoute
            ? reportStore.warning
            : '部分内容未纳入正式统计，或有记录暂时无法读取；已显示能够读取的学习足迹。'
        }}</span>
      </div>

      <div v-if="report?.flags.isSampleDerived" class="parent-report-page__source-note" role="note">
        <AppIcon name="info" :size="18" decorative />
        <span>当前报告包含开发样本，只用于查看页面结构，不代表正式学习记录。</span>
      </div>
      <div
        v-if="report?.flags.containsUnverifiedContent"
        class="parent-report-page__notice"
        role="note"
      >
        <AppIcon name="info" :size="18" decorative />
        <span>部分课程来源还在核验中，报告不会把它们当作正式学习结论。</span>
      </div>

      <AppLoading v-if="reportStore.loading" label="正在整理学习报告" />
      <AppErrorState
        v-else-if="reportStore.status === 'error'"
        title="学习报告暂时打不开"
        :description="reportStore.error || '请重新读取学习报告。'"
        @retry="loadReport"
      />
      <AppEmptyState
        v-else-if="report && !hasAnyData"
        title="这里还没有可展示的学习记录"
        description="完成学习后，这里会留下孩子的学习足迹。"
        action-label="回到孩子端"
        @action="returnToChild"
      />

      <template v-else-if="report">
        <section class="parent-report-page__section" aria-labelledby="participation-title">
          <div class="parent-report-page__section-heading">
            <div>
              <p class="curriculum-eyebrow">先看孩子做过什么</p>
              <h2 id="participation-title">孩子的学习足迹</h2>
            </div>
            <span class="parent-report-page__muted">当前档案 · 当前时间与学科范围</span>
          </div>
          <div class="parent-report-page__metric-grid">
            <article class="parent-report-page__metric-card">
              <strong>{{ report.participation.completedLessons }}</strong
              ><span>学过的课程</span>
            </article>
            <article class="parent-report-page__metric-card">
              <strong>{{ report.participation.completedAssessments }}</strong
              ><span>完成课后练习次数</span>
            </article>
            <article class="parent-report-page__metric-card">
              <strong>{{ report.participation.activeDays }}</strong
              ><span>留下完成记录的天数</span>
            </article>
          </div>
          <p class="parent-report-page__muted">
            学习足迹记录已经完成的教材学习，不等于已经掌握。独立闯关和课外阅读练习在各自页面记录。
          </p>
          <p v-if="report.participation.unverifiedCount" class="parent-report-page__muted">
            其中
            {{ report.participation.unverifiedCount }}
            条完成记录对应的内容仍待核验：足迹会保留，但不作为下方正式学习结论。
          </p>
          <ol
            v-if="report.participation.recentItems.length"
            class="parent-report-page__activity-list"
          >
            <li v-for="item in report.participation.recentItems" :key="item.id">
              <span class="parent-report-page__activity-dot" aria-hidden="true" />
              <div>
                <strong>{{ item.title }}</strong
                ><span>{{ subjectLabel(item.subject) }} · {{ formatDate(item.occurredAt) }}</span
                ><small v-if="assessmentSummary(item)">{{ assessmentSummary(item) }}</small>
              </div>
            </li>
          </ol>
          <p v-else class="parent-report-page__section-empty">
            这个范围内还没有教材完成记录，可以换个时间范围，或一起开始一小段学习。
          </p>
        </section>
        <section class="parent-report-page__section" aria-labelledby="companion-title">
          <h2 id="companion-title">今天可以怎样陪一陪？</h2>
          <p>{{ companionTip }}</p>
          <AppButton
            variant="soft"
            @click="goToChild(report.wrongBook.activeCount ? '/wrong-book' : '/learning-map')"
            >{{ report.wrongBook.activeCount ? '一起回看错题' : '一起回到知识岛' }}</AppButton
          >
        </section>
        <details class="parent-report-page__formal-details">
          <summary>查看已核验内容的学习统计与巩固建议</summary>
          <p>这里仅展示符合来源规则的数据。没有记录不等于没有学习，也不等于已经全部掌握。</p>
          <section
            class="parent-report-page__section parent-report-page__overview"
            aria-labelledby="overview-title"
          >
            <div class="parent-report-page__section-heading">
              <div>
                <p class="curriculum-eyebrow">学习概览</p>
                <h2 id="overview-title">已核验内容的学习统计</h2>
              </div>
              <span class="parent-report-page__muted"
                >仅统计符合来源规则的记录；为 0 不表示孩子没有学习</span
              >
            </div>
            <div class="parent-report-page__metric-grid">
              <article class="parent-report-page__metric-card">
                <AppIcon name="route" :size="20" decorative />
                <strong>{{ report.overview.learningDays }}</strong>
                <span>学习天数</span>
              </article>
              <article class="parent-report-page__metric-card">
                <AppIcon name="book-open" :size="20" decorative />
                <strong>{{ report.overview.completedLessons }}</strong>
                <span>完成课程</span>
              </article>
              <article class="parent-report-page__metric-card">
                <AppIcon name="check-circle" :size="20" decorative />
                <strong>{{ report.overview.completedAssessments }}</strong>
                <span>完成练习</span>
              </article>
              <article class="parent-report-page__metric-card">
                <AppIcon name="route" :size="20" decorative />
                <strong
                  >{{ report.overview.completedDailyTasks }} /
                  {{ report.overview.totalDailyTasks }}</strong
                >
                <span>计划任务</span>
              </article>
              <article class="parent-report-page__metric-card">
                <AppIcon name="circle-help" :size="20" decorative />
                <strong>{{ report.overview.activeWrongQuestions }}</strong>
                <span>待处理错题</span>
              </article>
              <article class="parent-report-page__metric-card">
                <AppIcon name="lightbulb" :size="20" decorative />
                <strong>{{ report.review.pendingCount }}</strong>
                <span>待巩固内容</span>
              </article>
            </div>
          </section>

          <section class="parent-report-page__section" aria-labelledby="activity-title">
            <div class="parent-report-page__section-heading">
              <div>
                <p class="curriculum-eyebrow">完成记录</p>
                <h2 id="activity-title">纳入正式统计的最近学习</h2>
              </div>
              <strong>{{ report.activity.recentItems.length }} 条</strong>
            </div>
            <ol v-if="report.activity.recentItems.length" class="parent-report-page__activity-list">
              <li v-for="item in report.activity.recentItems" :key="item.id">
                <span class="parent-report-page__activity-dot" aria-hidden="true" />
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ subjectLabel(item.subject) }} · {{ formatDate(item.occurredAt) }}</span>
                  <small v-if="assessmentSummary(item)">{{ assessmentSummary(item) }}</small>
                </div>
              </li>
            </ol>
            <p v-else class="parent-report-page__section-empty">
              暂无符合来源规则的完成记录，已发生的学习请查看上方“学习足迹”。
            </p>
          </section>

          <section class="parent-report-page__section" aria-labelledby="trend-title">
            <div class="parent-report-page__section-heading">
              <div>
                <p class="curriculum-eyebrow">按日期回看</p>
                <h2 id="trend-title">学习完成记录</h2>
              </div>
              <span class="parent-report-page__muted">{{ report.trend.description }}</span>
            </div>
            <div
              v-if="report.trend.hasData"
              class="parent-report-page__trend"
              role="img"
              aria-label="按日期查看完成记录"
            >
              <div
                v-for="point in report.trend.points"
                :key="point.dateKey"
                class="parent-report-page__trend-point"
              >
                <div class="parent-report-page__trend-bar-wrap">
                  <span
                    class="parent-report-page__trend-bar"
                    :style="{ height: `${trendHeight(point)}%` }"
                    :aria-label="`${point.dateKey} 共 ${point.completedTaskCount + point.activityCount} 条完成记录`"
                  />
                </div>
                <strong>{{ point.completedTaskCount + point.activityCount }}</strong>
                <small>{{ formatDateKey(point.dateKey) }}</small>
              </div>
            </div>
            <p v-if="report.trend.hasData" class="sr-only">{{ trendAccessibleSummary }}</p>
            <p v-else class="parent-report-page__section-empty">
              选择范围内还没有可展示的趋势记录。
            </p>
          </section>

          <section class="parent-report-page__section" aria-labelledby="subjects-title">
            <div class="parent-report-page__section-heading">
              <div>
                <p class="curriculum-eyebrow">分学科查看</p>
                <h2 id="subjects-title">学科进展</h2>
              </div>
            </div>
            <div class="parent-report-page__subject-grid">
              <article
                v-for="subject in visibleSubjects"
                :key="subject.subject"
                class="parent-report-page__subject-card"
                :class="`parent-report-page__subject-card--${subject.subject.toLowerCase()}`"
              >
                <div class="parent-report-page__subject-heading">
                  <div>
                    <span class="parent-report-page__subject-name">{{
                      subjectLabel(subject.subject)
                    }}</span>
                    <span v-if="!subject.hasData" class="parent-report-page__muted"
                      >暂无已核验的学习记录</span
                    >
                  </div>
                  <AppIcon :name="subjectTheme[subject.subject].icon" :size="22" decorative />
                </div>
                <dl class="parent-report-page__compact-stats">
                  <div>
                    <dt>课程</dt>
                    <dd>{{ subject.completedLessons }}</dd>
                  </div>
                  <div>
                    <dt>练习</dt>
                    <dd>{{ subject.completedAssessments }}</dd>
                  </div>
                  <div>
                    <dt>已掌握</dt>
                    <dd>{{ subject.masteredKnowledgePoints }}</dd>
                  </div>
                  <div>
                    <dt>待巩固</dt>
                    <dd>{{ subject.weakKnowledgePoints }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>

          <div class="parent-report-page__two-column">
            <section class="parent-report-page__section" aria-labelledby="mastery-title">
              <div class="parent-report-page__section-heading">
                <div>
                  <p class="curriculum-eyebrow">了解掌握情况</p>
                  <h2 id="mastery-title">知识点状态</h2>
                </div>
                <strong>{{ report.mastery.totalKnowledgePoints }} 个</strong>
              </div>
              <div class="parent-report-page__mastery-list">
                <div>
                  <span>尚未开始</span><strong>{{ report.mastery.notStarted }}</strong>
                </div>
                <AppProgress
                  :value="
                    report.mastery.totalKnowledgePoints
                      ? (report.mastery.notStarted / report.mastery.totalKnowledgePoints) * 100
                      : 0
                  "
                />
                <div>
                  <span>学习中</span><strong>{{ report.mastery.learning }}</strong>
                </div>
                <AppProgress
                  :value="
                    report.mastery.totalKnowledgePoints
                      ? (report.mastery.learning / report.mastery.totalKnowledgePoints) * 100
                      : 0
                  "
                />
                <div>
                  <span>需要巩固</span><strong>{{ report.mastery.weak }}</strong>
                </div>
                <AppProgress
                  :value="
                    report.mastery.totalKnowledgePoints
                      ? (report.mastery.weak / report.mastery.totalKnowledgePoints) * 100
                      : 0
                  "
                  state="warning"
                />
                <div>
                  <span>已掌握</span><strong>{{ report.mastery.mastered }}</strong>
                </div>
                <AppProgress
                  :value="
                    report.mastery.totalKnowledgePoints
                      ? (report.mastery.mastered / report.mastery.totalKnowledgePoints) * 100
                      : 0
                  "
                  state="success"
                />
              </div>
            </section>

            <section class="parent-report-page__section" aria-labelledby="weak-title">
              <div class="parent-report-page__section-heading">
                <div>
                  <p class="curriculum-eyebrow">再练一练</p>
                  <h2 id="weak-title">值得回看</h2>
                </div>
                <strong>{{ report.weakKnowledge.totalCount }} 个</strong>
              </div>
              <ul v-if="report.weakKnowledge.items.length" class="parent-report-page__item-list">
                <li
                  v-for="item in report.weakKnowledge.items"
                  :key="item.knowledgePointId"
                  class="parent-report-page__list-item"
                >
                  <div class="parent-report-page__list-icon">
                    <AppIcon name="lightbulb" :size="18" decorative />
                  </div>
                  <div>
                    <strong>{{ item.name }}</strong>
                    <span
                      >{{ subjectLabel(item.subject) }} · {{ stateLabel(item.state) }} · 掌握度
                      {{ item.masteryScore }}</span
                    >
                  </div>
                  <span v-if="item.hasReviewRecommendation" class="parent-report-page__status-badge"
                    >有建议</span
                  >
                </li>
              </ul>
              <p v-else class="parent-report-page__section-empty">
                目前没有可展示的巩固建议，不代表已经全部掌握。
              </p>
              <AppButton
                v-if="report.weakKnowledge.items.length"
                variant="secondary"
                icon-right="arrow-right"
                @click="goToChild('/review-queue')"
              >
                查看待巩固列表
              </AppButton>
            </section>
          </div>

          <div class="parent-report-page__two-column">
            <section class="parent-report-page__section" aria-labelledby="wrong-title">
              <div class="parent-report-page__section-heading">
                <div>
                  <p class="curriculum-eyebrow">从错误中发现</p>
                  <h2 id="wrong-title">错题记录</h2>
                </div>
                <strong>{{ report.wrongBook.activeCount }} 道待处理</strong>
              </div>
              <ul v-if="report.wrongBook.recentItems.length" class="parent-report-page__item-list">
                <li
                  v-for="item in report.wrongBook.recentItems"
                  :key="item.questionId"
                  class="parent-report-page__list-item"
                >
                  <div class="parent-report-page__list-icon">
                    <AppIcon name="circle-help" :size="18" decorative />
                  </div>
                  <div>
                    <strong>题目 {{ item.questionId }}</strong>
                    <span
                      >{{ subjectLabel(item.subject) }} · 错过 {{ item.wrongCount }} 次 ·
                      {{ item.status === 'active' ? '待巩固' : '已解决' }}</span
                    >
                  </div>
                </li>
              </ul>
              <p v-else class="parent-report-page__section-empty">目前没有可展示的错题记录。</p>
              <AppButton
                variant="secondary"
                icon-right="arrow-right"
                @click="goToChild('/wrong-book')"
              >
                查看错题本
              </AppButton>
            </section>

            <section class="parent-report-page__section" aria-labelledby="review-title">
              <div class="parent-report-page__section-heading">
                <div>
                  <p class="curriculum-eyebrow">主动回看</p>
                  <h2 id="review-title">待巩固列表</h2>
                </div>
                <strong>{{ report.review.pendingCount }} 项待完成</strong>
              </div>
              <dl class="parent-report-page__review-stats">
                <div>
                  <dt>当前待巩固</dt>
                  <dd>{{ report.review.pendingCount }}</dd>
                </div>
                <div>
                  <dt>已完成巩固</dt>
                  <dd>{{ report.review.completedCount }}</dd>
                </div>
                <div>
                  <dt>范围内完成</dt>
                  <dd>{{ report.review.recentCompletedCount }}</dd>
                </div>
              </dl>
              <p class="parent-report-page__section-copy">
                待巩固来自现有学习策略的建议，报告只展示，不会自动安排学习。
              </p>
              <AppButton
                variant="secondary"
                icon-right="arrow-right"
                @click="goToChild('/review-queue')"
              >
                查看待巩固列表
              </AppButton>
            </section>
          </div>
        </details>

        <div class="parent-report-page__two-column">
          <section class="parent-report-page__section" aria-labelledby="growth-title">
            <div class="parent-report-page__section-heading">
              <div>
                <p class="curriculum-eyebrow">一点一滴的积累</p>
                <h2 id="growth-title">成长记录</h2>
              </div>
              <AppIcon name="star" :size="22" decorative />
            </div>
            <div class="parent-report-page__growth-value">
              <strong>{{ report.growth.knowledgeEnergy }}</strong>
              <span>成长能量</span>
            </div>
            <p>
              当前成长等级 {{ report.growth.growthLevel }} · 本范围新增
              {{ report.growth.earnedInRange }}
            </p>
            <AppProgress
              :value="report.growth.progressToNextLevel"
              show-value
              state="success"
              label="成长等级进度"
            />
          </section>

          <section class="parent-report-page__section" aria-labelledby="achievement-title">
            <div class="parent-report-page__section-heading">
              <div>
                <p class="curriculum-eyebrow">值得记住的时刻</p>
                <h2 id="achievement-title">已经留下的里程碑</h2>
              </div>
              <strong
                >{{ report.achievements.unlockedCount }} /
                {{ report.achievements.totalCount }}</strong
              >
            </div>
            <ul
              v-if="report.achievements.recentlyUnlocked.length"
              class="parent-report-page__item-list"
            >
              <li
                v-for="item in report.achievements.recentlyUnlocked"
                :key="item.id"
                class="parent-report-page__list-item"
              >
                <div class="parent-report-page__list-icon">
                  <AppIcon name="star" :size="18" decorative />
                </div>
                <div>
                  <strong>{{ item.title }}</strong
                  ><span>{{ formatDate(item.unlockedAt) }}</span>
                </div>
              </li>
            </ul>
            <p v-else class="parent-report-page__section-empty">这个范围内还没有新的里程碑记录。</p>
          </section>
        </div>

        <div
          v-if="isDevRoute && report.diagnostics.length"
          class="parent-report-page__diagnostics"
          role="status"
        >
          <AppIcon name="info" :size="18" decorative />
          <span>{{ report.diagnostics.join('；') }}</span>
        </div>
      </template>

      <div v-if="isDevRoute" class="parent-report-page__dev-actions">
        <AppButton variant="ghost" @click="reportStore.resetDevReport">重置报告筛选</AppButton>
        <span>重置只清理报告页面偏好，不会删除课程、答题、错题或成长记录。</span>
      </div>
    </div>
  </AppShell>
</template>
