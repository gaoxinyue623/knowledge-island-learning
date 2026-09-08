<script setup lang="ts">
import LearningActivityHistory from '@/components/common/LearningActivityHistory.vue'
import { computed, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import { phase12DemoLessonSession, phase12DemoQuestionSession } from '@/data/learning-history'
import AppShell from '@/layouts/AppShell.vue'
import { useLearningProfile } from '@/composables/useLearningProfile'
import { curriculumService } from '@/services'
import { useLearningHistoryStore } from '@/stores/learningHistoryStore'
import type { LearningHistoryRecord } from '@/types'

const router = useRouter()
const route = useRoute()

const learningHistoryStore = useLearningHistoryStore()

const isDevRoute = computed(() => route.path.startsWith('/dev/history'))
const { profileId } = useLearningProfile()
const titles = ref<Record<string, string>>({})
let titleVersion = 0
async function loadTitles() {
  const version = ++titleVersion
  titles.value = {}
  const result = await Promise.all(
    [...new Set(records.value.map((r) => r.knowledgePointId))].map(async (id) => {
      try {
        return [id, (await curriculumService.getKnowledgePointById(id))?.name ?? ''] as const
      } catch {
        return [id, ''] as const
      }
    }),
  )
  if (version === titleVersion) titles.value = Object.fromEntries(result)
}
const records = computed(() => learningHistoryStore.records)
const wrongBookPath = computed(() => (isDevRoute.value ? '/dev/wrong-book' : '/wrong-book'))
const reviewQueuePath = computed(() => (isDevRoute.value ? '/dev/review-queue' : '/review-queue'))
const demoSeeded = ref(false)

function loadHistory() {
  learningHistoryStore.load(profileId.value, { includeSample: isDevRoute.value })
  if (isDevRoute.value && !demoSeeded.value && !records.value.length) {
    learningHistoryStore.recordLessonSession(phase12DemoLessonSession, {
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    learningHistoryStore.recordQuestionSession(phase12DemoQuestionSession, {
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    demoSeeded.value = true
  }
  void loadTitles()
}

function typeLabel(type: LearningHistoryRecord['type']): string {
  return {
    lesson_started: '开始学习',
    lesson_completed: '完成课程',
    assessment_started: '开始练习',
    assessment_completed: '完成练习',
  }[type]
}

function typeIcon(type: LearningHistoryRecord['type']): 'book-open' | 'check-circle' {
  return type.endsWith('completed') ? 'check-circle' : 'book-open'
}

function sourceWarningLabel(
  status: LearningHistoryRecord['provenance']['verificationStatus'],
  textbookId: LearningHistoryRecord['textbookId'],
) {
  if (isPilotTextbook(textbookId)) return null
  if (!status || status === 'VERIFIED' || status === 'REVIEWED' || status === 'SAMPLE') return null
  return status === 'UNVERIFIED' ? '来源待核验' : '来源异常'
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function summaryText(record: LearningHistoryRecord): string | null {
  const summary = record.summary
  if (!summary) return null
  if (record.type !== 'assessment_completed') return null
  const percentage =
    summary.assessmentPercentage === null || summary.assessmentPercentage === undefined
      ? '待人工判断'
      : `${summary.assessmentPercentage}%`
  return `共 ${summary.questionCount ?? 0} 题 · 答对 ${summary.correctCount ?? 0} · 答错 ${summary.incorrectCount ?? 0} · 人工判断 ${summary.manualReviewCount ?? 0} · 完成度 ${percentage}`
}

function clearDemoHistory() {
  learningHistoryStore.clearDemoHistory()
}

watch([profileId, isDevRoute], loadHistory, { immediate: true })
</script>

<template>
  <AppShell :show-bottom-nav="!isDevRoute" :context="isDevRoute ? 'DEV / 学习记录' : '学习记录'">
    <LearningActivityHistory v-if="!isDevRoute" :profile-id="profileId" />
    <div class="phase12-page content-container history-page">
      <RouterLink v-if="!isDevRoute" class="personal-back" to="/profile"
        >← 返回我的学习空间</RouterLink
      >
      <header class="phase12-page__header">
        <div>
          <p class="curriculum-eyebrow">学习的每一步，都有迹可循</p>
          <h1>我的学习记录</h1>
          <p>这里记录你真正开始过、完成过的课程和练习，不用来计算掌握度。</p>
        </div>
        <div class="phase12-page__header-actions">
          <AppButton size="sm" variant="secondary" icon-left="refresh-cw" @click="loadHistory">
            重新读取
          </AppButton>
          <AppButton v-if="isDevRoute" size="sm" variant="ghost" @click="clearDemoHistory">
            清理开发样本
          </AppButton>
        </div>
      </header>

      <div v-if="learningHistoryStore.warning" class="phase12-page__notice" role="status">
        <AppIcon name="alert-circle" :size="18" decorative />
        <span>{{ learningHistoryStore.warning }}</span>
      </div>

      <div class="phase12-page__link-row" aria-label="学习记录相关入口">
        <AppButton variant="secondary" icon-right="arrow-right" @click="router.push(wrongBookPath)">
          查看错题本
        </AppButton>
        <AppButton
          variant="secondary"
          icon-right="arrow-right"
          @click="router.push(reviewQueuePath)"
        >
          查看待巩固
        </AppButton>
      </div>

      <AppLoading v-if="learningHistoryStore.loading" label="正在读取学习记录" />
      <AppErrorState
        v-else-if="learningHistoryStore.status === 'error'"
        title="学习记录暂时打不开"
        :description="learningHistoryStore.error || '请重新读取学习记录。'"
        @retry="loadHistory"
      />
      <AppEmptyState
        v-else-if="!records.length"
        title="这里还没有学习记录"
        description="开始教材课程或练习后，这里会留下记录。阅读与思维训练的奖励可在成长页查看。"
        action-label="去学习"
        @action="router.push(isDevRoute ? '/dev/learning-map' : '/learning-map')"
      />
      <section v-else class="history-page__list" aria-labelledby="history-list-title">
        <div class="phase12-page__section-heading">
          <div>
            <p class="curriculum-eyebrow">Recent learning</p>
            <h2 id="history-list-title">最近学习</h2>
          </div>
          <strong>{{ records.length }} 条记录</strong>
        </div>
        <ol class="history-page__records">
          <li v-for="record in records" :key="record.id" class="history-page__record">
            <span class="history-page__record-icon" aria-hidden="true">
              <AppIcon :name="typeIcon(record.type)" :size="20" decorative />
            </span>
            <div class="history-page__record-body">
              <div class="history-page__record-heading">
                <h3>{{ typeLabel(record.type) }}</h3>
                <span
                  v-if="record.provenance.isSampleDerived"
                  class="phase12-page__badge phase12-page__badge--sample"
                >
                  开发样本
                </span>
                <span
                  v-else-if="
                    sourceWarningLabel(record.provenance.verificationStatus, record.textbookId)
                  "
                  class="phase12-page__badge phase12-page__badge--sample"
                >
                  {{ sourceWarningLabel(record.provenance.verificationStatus, record.textbookId) }}
                </span>
              </div>
              <p>{{ titles[record.knowledgePointId] || '教材学习' }}</p>
              <RouterLink
                :to="{
                  path: `${isDevRoute ? '/dev' : ''}/knowledge-point/${encodeURIComponent(record.knowledgePointId)}`,
                  query: {
                    textbookId: record.textbookId,
                    unitId: record.unitId,
                    lessonId: record.lessonId,
                  },
                }"
                class="personal-text-link"
                >回到这节学习 →</RouterLink
              >
              <small>{{ formatTime(record.occurredAt) }}</small>
              <small v-if="summaryText(record)" class="history-page__summary">
                {{ summaryText(record) }}
              </small>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </AppShell>
</template>
