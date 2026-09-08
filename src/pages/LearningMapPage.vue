<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppToast from '@/components/common/AppToast.vue'
import ThinkingEntry from '@/components/thinking/ThinkingEntry.vue'
import ReadingEntry from '@/components/reading-islands/ReadingEntry.vue'
import LearningRecommendationCard from '@/components/learning-strategy/LearningRecommendationCard.vue'
import KnowledgeIslandMap from '@/components/learning-map/KnowledgeIslandMap.vue'
import LearningProgressBar from '@/components/learning-map/LearningProgressBar.vue'
import MapHeader from '@/components/learning-map/MapHeader.vue'
import { isPilotTextbook } from '@/data/curriculum/pilot'
import AppShell from '@/layouts/AppShell.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { findLearningMapNode, useLearningMapStore } from '@/stores/learningMapStore'
import { useMasteryStore } from '@/stores/masteryStore'
import { useLearningStrategyStore } from '@/stores/learningStrategyStore'
import { useReviewQueueStore } from '@/stores/reviewQueueStore'
import type { Id, KnowledgeMapNode, LearningMapViewModel, SubjectCode } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const learningMapStore = useLearningMapStore()
const masteryStore = useMasteryStore()
const learningStrategyStore = useLearningStrategyStore()
const reviewQueueStore = useReviewQueueStore()
const notice = ref<{
  type: 'success' | 'info' | 'warning'
  title: string
  message?: string
} | null>(null)

const viewModel = computed(() => learningMapStore.viewModel)
const isFormalPilot = computed(() => isPilotTextbook(viewModel.value?.textbook.id))
const strategyRecommendation = computed(() => learningStrategyStore.recommendation)
const profile = computed(() => curriculumStore.curriculumProfile)
const requestedSubject = computed<SubjectCode>(() => {
  const requested = String(route.query.subject ?? '').toUpperCase()
  if (requested === 'CHINESE' || requested === 'MATH' || requested === 'ENGLISH') {
    return requested
  }
  if (profile.value?.mathTextbookVersionId) return 'MATH'
  if (profile.value?.chineseTextbookVersionId) return 'CHINESE'
  return 'ENGLISH'
})
const selectedTextbookId = computed(() => {
  if (typeof route.query.textbookId === 'string') return route.query.textbookId
  if (!profile.value) return null
  return {
    CHINESE: profile.value.chineseTextbookVersionId,
    MATH: profile.value.mathTextbookVersionId,
    ENGLISH: profile.value.englishTextbookVersionId,
  }[requestedSubject.value]
})
const contextLabel = computed(() => {
  const model = viewModel.value
  return model
    ? `${model.textbook.grade}年级 · ${model.textbook.semester === 1 ? '上册' : '下册'}`
    : '学习地图'
})

function findCurrentModelNode(model: LearningMapViewModel | null): KnowledgeMapNode | null {
  if (!model?.currentNodeId) return null
  return findLearningMapNode(model, model.currentNodeId)
}

async function loadMap() {
  learningStrategyStore.clear()
  const textbookId = selectedTextbookId.value
  if (!textbookId) return
  await masteryStore.load(profile.value?.studentId ?? 'local-profile')
  const loaded = await learningMapStore.loadMap({
    profileId: profile.value?.studentId,
    dataset: 'profile',
    textbookId,
    masteryRecords: masteryStore.records,
  })
  if (loaded) {
    const resolved = await learningStrategyStore.resolveForMap(loaded, {
      studentProfileId: profile.value?.studentId ?? 'local-profile',
      masteryRecords: masteryStore.records,
      learningEvidence: masteryStore.evidence,
      learningMapProgress: learningMapStore.mapProgress,
      currentMapNodeId: loaded.currentNodeId,
      dataset: 'profile',
    })
    if (resolved) {
      reviewQueueStore.project(resolved, {
        profileId: profile.value?.studentId ?? 'local-profile',
        textbookId: loaded.textbook.id,
        dataset: 'profile',
      })
    }
  }
  const focusNodeId = typeof route.query.focusNodeId === 'string' ? route.query.focusNodeId : null
  if (loaded && focusNodeId) learningMapStore.focusNode(focusNodeId)
  if (loaded && route.query.open === 'continue') focusCurrentNode()
}

function openNodeDetail(nodeId: Id) {
  const model = viewModel.value
  if (!model || !learningMapStore.selectNode(nodeId)) return
  const node = learningMapStore.selectedNode
  if (!node) return
  void router.push({
    path: `/knowledge-point/${encodeURIComponent(node.knowledgePointId)}`,
    query: {
      textbookId: model.textbook.id,
      unitId: node.unitId,
      lessonId: node.lessonId,
      knowledgePointId: node.knowledgePointId,
      dataset: 'profile',
      mapNodeId: node.id,
      nodeStatus: node.status,
      nodeProgress: String(node.progress),
      returnTo: '/learning-map',
    },
  })
}

function focusCurrentNode() {
  const node = findCurrentModelNode(viewModel.value)
  if (!node) return
  if (node.status !== 'locked') openNodeDetail(node.id)
}

function focusStrategyRecommendation() {
  const nodeId = strategyRecommendation.value?.nextKnowledgePoint?.mapNodeId
  if (!nodeId || !learningMapStore.focusNode(nodeId)) return
  const node = findLearningMapNode(viewModel.value as LearningMapViewModel, nodeId)
  notice.value = {
    type: 'info',
    title: '已经定位到学习建议',
    message: node?.title,
  }
}

onMounted(() => void loadMap())
watch(
  () => [route.query.subject, profile.value?.studentId, selectedTextbookId.value],
  () => void loadMap(),
)
</script>

<template>
  <AppShell :show-bottom-nav="true" :context="contextLabel">
    <div class="learning-map-page content-container">
      <ThinkingEntry compact />
      <p v-if="learningMapStore.error && learningMapStore.status !== 'error'" role="alert">
        {{ learningMapStore.error }}
      </p>
      <AppLoading v-if="learningMapStore.loading" label="正在准备知识岛地图" />
      <AppErrorState
        v-else-if="learningMapStore.status === 'error'"
        title="知识岛地图暂时打不开"
        :description="learningMapStore.error ?? '请重新试一次。'"
        @retry="loadMap"
      />
      <AppEmptyState
        v-else-if="learningMapStore.status === 'not_available' || !selectedTextbookId"
        title="课程内容正在准备中"
        description="当前学科还没有可开放的知识地图，请先确认教材版本，或等待课程完成审核。"
        action-label="查看学习设置"
        @action="router.push('/curriculum-settings')"
      />
      <AppEmptyState
        v-else-if="learningMapStore.status === 'empty'"
        title="这片知识海域还在准备中"
        description="当前教材暂时没有可以展示的单元或知识点。"
        action-label="返回首页"
        @action="router.push('/home')"
      />
      <template v-else-if="viewModel">
        <MapHeader :view-model="viewModel" :show-unverified="!isFormalPilot" />
        <section class="learning-map-overview" aria-label="地图进度概览">
          <div class="learning-map-overview__copy">
            <p class="curriculum-eyebrow">继续学习</p>
            <h2>
              {{
                learningMapStore.currentNode
                  ? learningMapStore.currentNode.title
                  : '从一座知识岛开始'
              }}
            </h2>
            <p>地图完成度只表示走过的学习节点，不代表掌握度或能力评分。</p>
          </div>
          <LearningProgressBar
            :completed="viewModel.progress.completedNodes"
            :total="viewModel.progress.totalNodes"
          />
          <AppButton
            class="learning-map-overview__cta"
            size="lg"
            icon-right="navigation"
            :disabled="!learningMapStore.currentNode"
            @click="focusCurrentNode"
          >
            继续探索
          </AppButton>
          <AppButton
            class="learning-map-overview__growth-cta"
            variant="secondary"
            icon-left="sparkles"
            @click="router.push('/achievements')"
          >
            查看成长反馈
          </AppButton>
        </section>
        <div v-if="viewModel.flags.isDemo" class="map-notice map-notice--sample" role="status">
          开发样本：多岛数据只用于验证地图布局与状态，不代表真实教材结构。
        </div>
        <div
          v-else-if="viewModel.flags.isUnverified && !isFormalPilot"
          class="map-notice map-notice--warning"
          role="status"
        >
          未审核数据：当前内容仅用于开发验证，不代表已发布的正式课程。
        </div>
        <LearningRecommendationCard
          v-if="strategyRecommendation"
          :recommendation="strategyRecommendation"
          compact
          @action="focusStrategyRecommendation"
        />
        <ReadingEntry
          v-if="requestedSubject !== 'MATH'"
          compact
          :language="requestedSubject === 'ENGLISH' ? 'english' : 'chinese'"
        />
        <KnowledgeIslandMap
          :view-model="viewModel"
          :selected-node-id="learningMapStore.selectedNodeId"
          @select-node="openNodeDetail"
        />
        <details v-if="viewModel.diagnostics.length" class="learning-map-diagnostics">
          <summary>开发诊断：{{ viewModel.diagnostics.length }} 条提示</summary>
          <p
            v-for="diagnostic in viewModel.diagnostics"
            :key="`${diagnostic.code}-${diagnostic.entityId}`"
          >
            {{ diagnostic.message }}
          </p>
        </details>
        <AppToast
          :open="Boolean(notice)"
          :type="notice?.type"
          :title="notice?.title ?? ''"
          :message="notice?.message"
        />
      </template>
    </div>
  </AppShell>
</template>
