<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import { phase12DemoReviewQueueRecommendation } from '@/data/review-queue'
import AppShell from '@/layouts/AppShell.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { useReviewQueueStore } from '@/stores/reviewQueueStore'
import type { ReviewQueueItem } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const reviewQueueStore = useReviewQueueStore()
const isDevRoute = computed(() => route.path.startsWith('/dev/review-queue'))
const includeCompleted = ref(false)
const actionMessage = ref<string | null>(null)

const profileId = computed(() => curriculumStore.curriculumProfile?.studentId ?? 'local-profile')
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

function openReview(item: ReviewQueueItem) {
  if (item.mapNodeId) {
    void router.push({ path: learningMapPath.value, query: { focusNodeId: item.mapNodeId } })
    return
  }
  void router.push(learningMapPath.value)
}

function completeItem(item: ReviewQueueItem) {
  reviewQueueStore.complete(item.id, new Date().toISOString())
  const energy = reviewQueueStore.lastRewardEvent?.reward.knowledgeEnergy
  actionMessage.value = energy
    ? `这项待巩固内容已完成，获得 ${energy} 点 KnowledgeEnergy。`
    : '这项待巩固内容已标记为完成。'
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

onMounted(loadQueue)
</script>

<template>
  <AppShell :show-bottom-nav="!isDevRoute" :context="isDevRoute ? 'DEV / 待巩固' : '待巩固'">
    <div class="phase12-page content-container review-queue-page">
      <header class="phase12-page__header">
        <div>
          <p class="curriculum-eyebrow">REVIEW QUEUE · PHASE 12</p>
          <h1>待巩固列表</h1>
          <p>这是根据当前确定性学习建议留下的主动复习入口，不是复习日程。</p>
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
        description="策略有建议时，这里会留下可以主动巩固的内容。"
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
                v-if="item.status === 'active'"
                variant="secondary"
                @click="completeItem(item)"
              >
                标记完成
              </AppButton>
              <AppButton v-else variant="secondary" @click="reopenItem(item)">重新加入</AppButton>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </AppShell>
</template>
