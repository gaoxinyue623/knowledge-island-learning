<script setup lang="ts">
import { useLearningProfile } from '@/composables/useLearningProfile'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import { learningMapRepository } from '@/services/learning-map'
import { questionEngineAdapter } from '@/services/question-engine'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import { phase12DemoReviewQueueRecommendation } from '@/data/review-queue'
import AppShell from '@/layouts/AppShell.vue'
import { useReviewQueueStore } from '@/stores/reviewQueueStore'
import type { ReviewQueueItem } from '@/types'

const router = useRouter()
const route = useRoute()
const reviewQueueStore = useReviewQueueStore()
const isDevRoute = computed(() => route.path.startsWith('/dev/review-queue'))
const includeCompleted = ref(false)
const actionMessage = ref<string | null>(null)

const { profileId } = useLearningProfile()
const items = computed(() => reviewQueueStore.items)
const focusedItemId = computed(() =>
  typeof route.query.itemId === 'string' ? route.query.itemId : undefined,
)
const displayedItems = computed(() => {
  if (!focusedItemId.value) return items.value
  return [...items.value].sort(
    (left, right) =>
      Number(right.id === focusedItemId.value) - Number(left.id === focusedItemId.value),
  )
})
const wrongBookPath = computed(() => (isDevRoute.value ? '/dev/wrong-book' : '/wrong-book'))
const historyPath = computed(() => (isDevRoute.value ? '/dev/history' : '/history'))
const learningMapPath = computed(() => (isDevRoute.value ? '/dev/learning-map' : '/learning-map'))
const demoSeeded = ref(false)

function loadQueue() {
  actionMessage.value = null
  reviewQueueStore.load(profileId.value, {
    includeCompleted: includeCompleted.value,
    includeSample: isDevRoute.value,
  })
  if (isDevRoute.value && !demoSeeded.value && !items.value.length) {
    reviewQueueStore.project(phase12DemoReviewQueueRecommendation, {
      profileId: profileId.value,
      textbookId: 'DEMO_TEXTBOOK_MATH_G3_S1',
      dataset: 'demo',
      isSampleDerived: true,
      verificationStatus: 'SAMPLE',
    })
    demoSeeded.value = true
  }
}

function toggleCompleted() {
  includeCompleted.value = !includeCompleted.value
  loadQueue()
}

async function openReview(item: ReviewQueueItem) {
  actionMessage.value = null
  try {
    const dataset = isDevRoute.value ? 'demo' : 'profile'
    const map = await learningMapRepository.getMapSource({ dataset, textbookId: item.textbookId })
    const relation = map?.lessonKnowledgePoints.find(
      (mapping) => mapping.knowledgePointId === item.knowledgePointId,
    )
    const lesson = map?.lessons.find((lesson) => lesson.id === relation?.lessonId)
    if (!lesson) throw new Error('这项内容已不在当前教材中，请回到教材地图选择其他内容。')
    const context = {
      textbookId: item.textbookId,
      unitId: lesson.unitId,
      lessonId: lesson.id,
      knowledgePointId: item.knowledgePointId,
      source: 'lesson_practice' as const,
    }
    const available = await questionEngineAdapter.getAssessmentAvailability(context, {
      dataset,
      studentId: profileId.value,
    })
    if (!available) throw new Error('这项内容还没有可用的巩固题目，请先到教材地图回看讲解。')
    await router.push({
      path: isDevRoute.value ? '/dev/question-engine' : '/assessment',
      query: {
        ...context,
        dataset,
        reviewItemId: item.id,
        sessionScope: `review:${item.id}:${crypto.randomUUID()}`,
        returnTo: isDevRoute.value ? '/dev/review-queue' : '/review-queue',
      },
    })
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '暂时无法打开巩固练习，请重试。'
  }
}

function reopenItem(item: ReviewQueueItem) {
  reviewQueueStore.reopen(item.id)
  actionMessage.value = '这项内容已经回到待巩固列表。'
}

function clearDemoQueue() {
  reviewQueueStore.clearDemoQueue()
  actionMessage.value = '开发样本已经清理，正式待巩固内容不受影响。'
}

function typeLabel(item: ReviewQueueItem): string {
  return item.recommendationType === 'REINFORCE' ? '需要再练一练' : '还需要更多证据'
}

function sourceWarningLabel(
  status: ReviewQueueItem['provenance']['verificationStatus'],
  textbookId: ReviewQueueItem['textbookId'],
) {
  if (isPilotTextbook(textbookId)) return null
  if (!status || status === 'VERIFIED' || status === 'REVIEWED' || status === 'SAMPLE') return null
  return status === 'UNVERIFIED' ? '来源待核验' : '来源异常'
}

watch(profileId, loadQueue, { immediate: true })
</script>

<template>
  <AppShell :show-bottom-nav="!isDevRoute" :context="isDevRoute ? 'DEV / 待巩固' : '待巩固'">
    <div class="phase12-page content-container review-queue-page">
      <RouterLink v-if="!isDevRoute" class="personal-back" to="/profile"
        >← 返回我的学习空间</RouterLink
      >
      <header class="phase12-page__header">
        <div>
          <p class="curriculum-eyebrow">把学过的知识再温习一遍</p>
          <h1>待巩固列表</h1>
          <p>根据练习情况，选择一项需要温习的知识；完成后可以回看巩固记录。</p>
        </div>
        <div class="phase12-page__header-actions">
          <AppButton size="sm" variant="secondary" icon-left="refresh-cw" @click="loadQueue">
            重新读取
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="toggleCompleted">
            {{ includeCompleted ? '只看待巩固' : '查看已完成' }}
          </AppButton>
          <AppButton v-if="isDevRoute" size="sm" variant="ghost" @click="clearDemoQueue">
            清理开发样本
          </AppButton>
        </div>
      </header>

      <div v-if="reviewQueueStore.warning" class="phase12-page__notice" role="status">
        <AppIcon name="alert-circle" :size="18" decorative />
        <span>{{ reviewQueueStore.warning }}</span>
      </div>
      <div
        v-if="actionMessage"
        class="phase12-page__notice phase12-page__notice--success"
        role="status"
      >
        <AppIcon name="check-circle" :size="18" decorative />
        <span>{{ actionMessage }}</span>
      </div>

      <div class="phase12-page__link-row" aria-label="待巩固相关入口">
        <AppButton variant="secondary" icon-right="arrow-right" @click="router.push(wrongBookPath)">
          打开错题本
        </AppButton>
        <AppButton variant="secondary" icon-right="arrow-right" @click="router.push(historyPath)">
          学习记录
        </AppButton>
      </div>

      <AppLoading v-if="reviewQueueStore.loading" label="正在读取待巩固列表" />
      <AppErrorState
        v-else-if="reviewQueueStore.status === 'error'"
        title="待巩固列表暂时打不开"
        :description="reviewQueueStore.error || '请重新读取待巩固列表。'"
        @retry="loadQueue"
      />
      <AppEmptyState
        v-else-if="!items.length"
        title="现在没有待巩固内容"
        description="完成教材练习后，需要再练习的知识会出现在这里。也可以回到教材地图自主复习。"
        action-label="去教材地图"
        @action="router.push(learningMapPath)"
      />
      <section v-else class="review-queue-page__list" aria-labelledby="review-queue-list-title">
        <div class="phase12-page__section-heading">
          <div>
            <p class="curriculum-eyebrow">Active review</p>
            <h2 id="review-queue-list-title">
              {{ includeCompleted ? '巩固记录' : '现在可以做什么' }}
            </h2>
          </div>
          <strong>{{ items.length }} 项</strong>
        </div>
        <ol class="review-queue-page__records">
          <li
            v-for="item in displayedItems"
            :key="item.id"
            class="review-queue-page__record"
            :class="{ 'review-queue-page__record--focused': item.id === focusedItemId }"
          >
            <span class="review-queue-page__record-icon" aria-hidden="true">
              <AppIcon
                :name="item.status === 'completed' ? 'check-circle' : 'lightbulb'"
                :size="22"
                decorative
              />
            </span>
            <div class="review-queue-page__record-body">
              <div class="review-queue-page__record-heading">
                <span class="phase12-page__badge" :class="`phase12-page__badge--${item.status}`">
                  {{ item.status === 'active' ? '待巩固' : '已完成' }}
                </span>
                <span
                  v-if="item.provenance.isSampleDerived"
                  class="phase12-page__badge phase12-page__badge--sample"
                >
                  开发样本
                </span>
                <span
                  v-else-if="
                    sourceWarningLabel(item.provenance.verificationStatus, item.textbookId)
                  "
                  class="phase12-page__badge phase12-page__badge--sample"
                >
                  {{ sourceWarningLabel(item.provenance.verificationStatus, item.textbookId) }}
                </span>
                <strong>优先级 {{ item.priority }}</strong>
              </div>
              <h3>{{ typeLabel(item) }}：{{ item.reason.title }}</h3>
              <p>{{ item.reason.description }}</p>
              <small>知识点 {{ item.knowledgePointId }} · 教材 {{ item.textbookId }}</small>
            </div>
            <div class="review-queue-page__record-actions">
              <AppButton
                v-if="item.status === 'active'"
                variant="primary"
                icon-right="arrow-right"
                @click="openReview(item)"
              >
                去巩固
              </AppButton>
              <AppButton
                v-if="item.status === 'completed'"
                variant="secondary"
                @click="reopenItem(item)"
                >重新加入</AppButton
              >
            </div>
          </li>
        </ol>
      </section>
    </div>
  </AppShell>
</template>
