<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppToast from '@/components/common/AppToast.vue'
import KnowledgeIslandMap from '@/components/learning-map/KnowledgeIslandMap.vue'
import LearningProgressBar from '@/components/learning-map/LearningProgressBar.vue'
import MapHeader from '@/components/learning-map/MapHeader.vue'
import NodeDetailPanel from '@/components/learning-map/NodeDetailPanel.vue'
import AppShell from '@/layouts/AppShell.vue'
import { useCurriculumStore } from '@/stores/curriculumStore'
import { findLearningMapNode, useLearningMapStore } from '@/stores/learningMapStore'
import { useMasteryStore } from '@/stores/masteryStore'
import type { Id, KnowledgeMapNode, LearningMapViewModel } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const learningMapStore = useLearningMapStore()
const masteryStore = useMasteryStore()
const notice = ref<{
  type: 'success' | 'info' | 'warning'
  title: string
  message?: string
} | null>(null)

const viewModel = computed(() => learningMapStore.viewModel)
const profile = computed(() => curriculumStore.curriculumProfile)
const selectedNode = computed(() => learningMapStore.selectedNode)
const selectedContext = computed(() => {
  const node = selectedNode.value
  const model = viewModel.value
  if (!node || !model) return { lessonTitle: undefined, unitTitle: undefined, prerequisites: [] }
  const island = model.islands.find((candidate) => candidate.unitId === node.unitId)
  const lesson = island?.lessons.find((candidate) => candidate.lessonId === node.lessonId)
  const allNodes = model.islands.flatMap((candidate) =>
    candidate.lessons.flatMap((lessonSection) => lessonSection.nodes),
  )
  const prerequisites = node.prerequisites
    .map(
      (knowledgePointId) =>
        allNodes.find((candidate) => candidate.knowledgePointId === knowledgePointId)?.title,
    )
    .filter((title): title is string => Boolean(title))
  return { lessonTitle: lesson?.title, unitTitle: island?.title, prerequisites }
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
  const textbookId = profile.value?.mathTextbookVersionId
  if (!textbookId) return
  await masteryStore.load(profile.value?.studentId ?? 'local-profile')
  const loaded = await learningMapStore.loadMap({
    dataset: 'profile',
    textbookId,
    masteryRecords: masteryStore.records,
  })
  const focusNodeId = typeof route.query.focusNodeId === 'string' ? route.query.focusNodeId : null
  if (loaded && focusNodeId) learningMapStore.focusNode(focusNodeId)
}

function selectNode(nodeId: Id) {
  learningMapStore.selectNode(nodeId)
}

function focusCurrentNode() {
  const node = findCurrentModelNode(viewModel.value)
  if (!node) return
  learningMapStore.focusNode(node.id)
  notice.value = {
    type: 'info',
    title: '已经定位到下一步',
    message: node.title,
  }
}

function startSelectedNode() {
  const node = selectedNode.value
  const model = viewModel.value
  if (!node || !model) return
  void router.push({
    path: '/lesson',
    query: {
      textbookId: model.textbook.id,
      unitId: node.unitId,
      lessonId: node.lessonId,
      knowledgePointId: node.knowledgePointId,
      dataset: 'profile',
      mapNodeId: node.id,
      returnTo: '/learning-map',
    },
  })
}

function completeSelectedNode() {
  startSelectedNode()
}

function closeNodeDetail() {
  learningMapStore.selectedNodeId = null
}

onMounted(() => void loadMap())
</script>

<template>
  <AppShell :show-bottom-nav="true" :context="contextLabel">
    <div class="learning-map-page content-container">
      <AppLoading v-if="learningMapStore.loading" label="正在准备知识岛地图" />
      <AppErrorState
        v-else-if="learningMapStore.status === 'error'"
        title="知识岛地图暂时打不开"
        :description="learningMapStore.error ?? '请重新试一次。'"
        @retry="loadMap"
      />
      <AppEmptyState
        v-else-if="learningMapStore.status === 'not_available' || !profile?.mathTextbookVersionId"
        title="课程内容正在准备中"
        description="当前学习设置还没有可开放的数学地图，请先确认教材版本，或等待课程完成审核。"
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
        <MapHeader :view-model="viewModel" />
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
        </section>
        <div v-if="viewModel.flags.isDemo" class="map-notice map-notice--sample" role="status">
          开发样本：多岛数据只用于验证地图布局与状态，不代表真实教材结构。
        </div>
        <div
          v-else-if="viewModel.flags.isUnverified"
          class="map-notice map-notice--warning"
          role="status"
        >
          未审核数据：当前内容仅用于开发验证，不代表已发布的正式课程。
        </div>
        <KnowledgeIslandMap
          :view-model="viewModel"
          :selected-node-id="learningMapStore.selectedNodeId"
          @select-node="selectNode"
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
        <NodeDetailPanel
          :open="Boolean(selectedNode)"
          :node="selectedNode"
          :lesson-title="selectedContext.lessonTitle"
          :unit-title="selectedContext.unitTitle"
          :prerequisite-titles="selectedContext.prerequisites"
          :is-sample="selectedNode?.isSample || viewModel.flags.isDemo"
          :is-unverified="viewModel.flags.isUnverified"
          :is-read-only="viewModel.flags.isReadOnly"
          :mastery="selectedNode?.mastery"
          @close="closeNodeDetail"
          @start="startSelectedNode"
          @complete="completeSelectedNode"
        />
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
