<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import AppShell from '@/layouts/AppShell.vue'
import KnowledgeIslandMap from '@/components/learning-map/KnowledgeIslandMap.vue'
import KnowledgeNode from '@/components/learning-map/KnowledgeNode.vue'
import LearningProgressBar from '@/components/learning-map/LearningProgressBar.vue'
import MapHeader from '@/components/learning-map/MapHeader.vue'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { useMasteryStore } from '@/stores/masteryStore'
import type { Id, KnowledgeMapNode, LearningMapDataset, LearningNodeStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const learningMapStore = useLearningMapStore()
const masteryStore = useMasteryStore()
const dataset = ref<Exclude<LearningMapDataset, 'profile'>>(
  route.path.endsWith('/states') ? 'demo' : 'demo',
)
const showStates = ref(route.path.endsWith('/states'))
const error = ref<string | null>(null)

const viewModel = computed(() => learningMapStore.viewModel)

const stateSamples = computed<KnowledgeMapNode[]>(() => {
  const base = viewModel.value?.islands[0]?.lessons[0]?.nodes[0]
  if (!base) return []
  const statuses: LearningNodeStatus[] = [
    'locked',
    'available',
    'learning',
    'completed',
    'mastered',
    'perfect',
  ]
  return statuses.map((status, index) => ({
    ...base,
    id: `state-showcase-${status}`,
    title: `状态示例 · ${status}`,
    shortTitle: status,
    status,
    progress: status === 'locked' || status === 'available' ? 0 : status === 'learning' ? 35 : 100,
    position: { x: 0, y: 0 },
    sort: index + 1,
  }))
})

async function loadDataset() {
  error.value = null
  await masteryStore.load('local-profile')
  const loaded = await learningMapStore.loadMap({
    dataset: dataset.value,
    masteryRecords: masteryStore.records,
  })
  if (!loaded && learningMapStore.status === 'error') {
    error.value = learningMapStore.error ?? '开发地图暂时无法加载'
  }
  const focusNodeId = typeof route.query.focusNodeId === 'string' ? route.query.focusNodeId : null
  if (loaded && focusNodeId) learningMapStore.focusNode(focusNodeId)
}

function openNodeDetail(nodeId: Id) {
  const model = viewModel.value
  if (!model || !learningMapStore.selectNode(nodeId)) return
  const node = learningMapStore.selectedNode
  if (!node) return
  void router.push({
    path: `/dev/knowledge-point/${encodeURIComponent(node.knowledgePointId)}`,
    query: {
      textbookId: model.textbook.id,
      unitId: node.unitId,
      lessonId: node.lessonId,
      knowledgePointId: node.knowledgePointId,
      dataset: dataset.value,
      mapNodeId: node.id,
      nodeStatus: node.status,
      nodeProgress: String(node.progress),
      returnTo: '/dev/learning-map',
    },
  })
}

function resetProgress() {
  learningMapStore.resetDemoProgress()
}

function toggleStates() {
  showStates.value = !showStates.value
}

watch(dataset, () => void loadDataset())
onMounted(() => void loadDataset())
</script>

<template>
  <AppShell :show-bottom-nav="false" context="DEV / LearningMap">
    <div class="learning-map-page content-container dev-learning-map">
      <header class="curriculum-page__header">
        <p class="curriculum-eyebrow">DEVELOPMENT ONLY · PHASE 7 / 8</p>
        <h1>LearningMap Debug View</h1>
        <p>
          验证 Curriculum → LearningMap → LessonPlayer
          链路、地图状态、解锁规则、响应式布局与开发进度。
        </p>
      </header>
      <section class="dev-learning-map__controls" aria-label="地图数据集控制">
        <div>
          <p class="curriculum-eyebrow">选择数据集</p>
          <h2>{{ dataset === 'golden' ? 'Golden Curriculum' : 'Map Demo Fixture' }}</h2>
          <p v-if="dataset === 'golden'">
            三年级数学上册黄金框架；当前仍是 UNVERIFIED，只用于适配器验证。
          </p>
          <p v-else>三座示例知识岛；全部 isSample=true，仅用于视觉和状态验证。</p>
        </div>
        <div class="dev-learning-map__control-actions">
          <AppButton
            size="sm"
            :variant="dataset === 'golden' ? 'primary' : 'secondary'"
            @click="dataset = 'golden'"
          >
            Golden Curriculum
          </AppButton>
          <AppButton
            size="sm"
            :variant="dataset === 'demo' ? 'primary' : 'secondary'"
            @click="dataset = 'demo'"
          >
            Map Demo Fixture
          </AppButton>
          <AppButton size="sm" variant="secondary" @click="resetProgress"
            >Reset Demo Progress</AppButton
          >
          <AppButton size="sm" variant="ghost" @click="toggleStates">
            {{ showStates ? '隐藏状态 Showcase' : 'Show All States' }}
          </AppButton>
        </div>
      </section>
      <AppLoading v-if="learningMapStore.loading" label="正在读取开发地图数据" />
      <AppErrorState
        v-else-if="error"
        title="开发地图暂时打不开"
        :description="error"
        @retry="loadDataset"
      />
      <template v-else-if="viewModel">
        <MapHeader :view-model="viewModel" />
        <section class="learning-map-overview" aria-label="开发地图进度">
          <div class="learning-map-overview__copy">
            <p class="curriculum-eyebrow">Dataset Preview</p>
            <h2>{{ viewModel.textbook.title }}</h2>
            <p>当前展示的是完成度，不是 MasteryScore 或正式学习记录。</p>
          </div>
          <LearningProgressBar
            :completed="viewModel.progress.completedNodes"
            :total="viewModel.progress.totalNodes"
          />
          <span class="map-badge map-badge--warning">{{
            viewModel.flags.isUnverified ? 'UNVERIFIED DATA' : 'SAMPLE DATA'
          }}</span>
        </section>
        <KnowledgeIslandMap
          :view-model="viewModel"
          :selected-node-id="learningMapStore.selectedNodeId"
          @select-node="openNodeDetail"
        />
        <section
          v-if="showStates"
          class="dev-learning-map__states"
          aria-labelledby="state-showcase-title"
        >
          <div>
            <p class="curriculum-eyebrow">State Showcase</p>
            <h2 id="state-showcase-title">六种地图节点状态</h2>
            <p>mastered / perfect 仅为 fixture 状态，不由分数推导。</p>
          </div>
          <div class="dev-learning-map__state-grid">
            <KnowledgeNode v-for="node in stateSamples" :key="node.id" :node="node" />
          </div>
        </section>
        <details v-if="viewModel.diagnostics.length" class="learning-map-diagnostics">
          <summary>开发诊断：{{ viewModel.diagnostics.length }} 条提示</summary>
          <p
            v-for="diagnostic in viewModel.diagnostics"
            :key="`${diagnostic.code}-${diagnostic.entityId}`"
          >
            {{ diagnostic.message }}
          </p>
        </details>
      </template>
    </div>
  </AppShell>
</template>
