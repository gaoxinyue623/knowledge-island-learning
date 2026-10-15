<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import ComprehensiveAssessments from './ComprehensiveAssessments.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'

import MapConnection from './MapConnection.vue'
import MapLegend from './MapLegend.vue'
import UnitIsland from './UnitIsland.vue'
import type { KnowledgeMapNode, LearningMapViewModel } from '@/types'

interface Props {
  viewModel: LearningMapViewModel
  compact?: boolean
  schoolNodeId?: string | null
  showUnitAssessments?: boolean
  selectedNodeId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  schoolNodeId: null,
  showUnitAssessments: false,
  selectedNodeId: null,
})

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()

const search = ref('')
const selectedUnit = ref('')
watch(selectedUnit, async (id) => {
  if (!id) return
  search.value = ''
  await nextTick()
  document.getElementById('map-unit-' + id)?.scrollIntoView?.({ block: 'start' })
})
const preferredUnit = computed(
  () =>
    props.viewModel.islands.find((island) =>
      island.lessons.some((lesson) =>
        lesson.nodes.some(
          (node) => node.id === (props.schoolNodeId || props.viewModel.currentNodeId),
        ),
      ),
    )?.unitId,
)
const expandedUnit = computed(() => selectedUnit.value || preferredUnit.value)
const visibleIslands = computed(() =>
  props.viewModel.islands.filter(
    (island) =>
      !search.value.trim() ||
      island.title.includes(search.value.trim()) ||
      island.lessons.some((lesson) =>
        lesson.nodes.some((node) => node.title.includes(search.value.trim())),
      ),
  ),
)
function visibleNodes(island: LearningMapViewModel['islands'][number]) {
  return island.lessons
    .flatMap((lesson) => lesson.nodes)
    .filter(
      (node) =>
        !search.value.trim() ||
        island.title.includes(search.value.trim()) ||
        node.title.includes(search.value.trim()),
    )
}

const nodeById = computed(() => {
  const nodes = new Map<string, KnowledgeMapNode>()
  for (const island of props.viewModel.islands) {
    for (const lesson of island.lessons) {
      for (const node of lesson.nodes) nodes.set(node.id, node)
    }
  }
  return nodes
})

const renderedConnections = computed(() =>
  props.viewModel.connections.flatMap((connection) => {
    const fromNode = nodeById.value.get(connection.fromNodeId)
    const toNode = nodeById.value.get(connection.toNodeId)
    return fromNode && toNode ? [{ connection, fromNode, toNode }] : []
  }),
)
</script>

<template>
  <section class="knowledge-island-map" aria-labelledby="knowledge-island-map-title">
    <div class="knowledge-island-map__intro">
      <span class="knowledge-island-map__guide" aria-hidden="true"
        ><KnowledgeDangoPlaceholder size="sm" state="encourage"
      /></span>
      <div>
        <p class="curriculum-eyebrow">团子带路 · 一起发现新知识</p>
        <h2 id="knowledge-island-map-title">沿着知识路径探索</h2>
        <p>可以自由选择已开放的课程，也可以从正在学习的单元继续。课程完成和知识掌握分别记录。</p>
      </div>
      <MapLegend />
    </div>
    <div v-if="compact" class="compact-map">
      <div class="compact-map__filters">
        <label
          >找到课文或知识点<input
            v-model="search"
            type="search"
            placeholder="例如：谁的得分高、除法"
            maxlength="80"
        /></label>
        <label
          >跳到单元<select v-model="selectedUnit">
            <option value="">正在学习的单元</option>
            <option v-for="island in viewModel.islands" :key="island.unitId" :value="island.unitId">
              {{ island.title }}
            </option>
          </select></label
        >
      </div>
      <p role="status">找到 {{ visibleIslands.length }} 个单元。点单元名称可以展开或收起。</p>
      <p v-if="!visibleIslands.length">还没找到，换一个关键词试试。</p>
      <details
        v-for="island in visibleIslands"
        :key="viewModel.textbook.id + island.id"
        :open="Boolean(search.trim()) || island.unitId === expandedUnit"
        class="compact-map__unit"
      >
        <summary>
          {{ island.title }}
          <small>{{ island.lessons.flatMap((lesson) => lesson.nodes).length }} 个学习节点</small>
        </summary>
        <div class="compact-map__nodes">
          <button
            v-for="node in visibleNodes(island)"
            :key="node.id"
            type="button"
            :disabled="node.status === 'locked'"
            :aria-label="`${node.title}，${node.status === 'locked' ? '尚未开放' : '进入课程'}`"
            @click="emit('selectNode', node.id)"
          >
            <strong>{{ node.title }}</strong
            ><small
              >{{ node.id === schoolNodeId ? '学校当前进度 · ' : ''
              }}{{
                node.status === 'locked'
                  ? '尚未开放'
                  : node.progress === 100
                    ? '课程已完成'
                    : node.progress > 0
                      ? '课程学习中'
                      : '可以开始'
              }}</small
            >
            <small v-if="node.mastery"
              >掌握情况：{{
                node.mastery.state === 'mastered'
                  ? '已掌握'
                  : node.mastery.state === 'weak'
                    ? '需要巩固'
                    : node.mastery.state === 'not_started'
                      ? '待评估'
                      : '正在学习'
              }}</small
            >
          </button>
        </div>
        <ComprehensiveAssessments
          v-if="showUnitAssessments"
          :model="viewModel"
          :unit-id="island.unitId"
        />
      </details>
    </div>
    <div v-else class="learning-map__canvas-wrap">
      <div
        class="learning-map__canvas"
        :class="{ 'learning-map__canvas--sample': props.viewModel.flags.isDemo }"
        :style="{
          '--learning-map-canvas-ratio': `${props.viewModel.canvasSize.width} / ${props.viewModel.canvasSize.height}`,
        }"
      >
        <div class="learning-map__sky" aria-hidden="true" />
        <div class="learning-map__cloud learning-map__cloud--one" aria-hidden="true" />
        <div class="learning-map__cloud learning-map__cloud--two" aria-hidden="true" />
        <svg
          class="learning-map__connections"
          :viewBox="`0 0 ${props.viewModel.canvasSize.width} ${props.viewModel.canvasSize.height}`"
          preserveAspectRatio="none"
          aria-label="知识路径连接线"
        >
          <MapConnection
            v-for="item in renderedConnections"
            :key="item.connection.id"
            :connection="item.connection"
            :from-node="item.fromNode"
            :to-node="item.toNode"
          />
        </svg>
        <UnitIsland
          v-for="island in props.viewModel.islands"
          :key="island.id"
          :island="island"
          :canvas-size="props.viewModel.canvasSize"
          :assessment-model="props.showUnitAssessments ? props.viewModel : null"
          :selected-node-id="props.selectedNodeId"
          @select-node="emit('selectNode', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.compact-map {
  display: grid;
  gap: 12px;
}
.compact-map__filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.compact-map label {
  display: grid;
  gap: 6px;
}
.compact-map input,
.compact-map select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: white;
  font: inherit;
}
.compact-map__unit {
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 16px;
  background: var(--color-surface, #fff);
}
.compact-map__unit summary {
  cursor: pointer;
  min-height: 44px;
  font-weight: 700;
  line-height: 1.6;
}
.compact-map__unit summary small {
  display: block;
  font-weight: 400;
  color: var(--color-text-secondary);
}
.compact-map__nodes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 0;
}
.compact-map__nodes button {
  display: grid;
  gap: 8px;
  text-align: left;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #f4f8ee;
  font: inherit;
  cursor: pointer;
}
.compact-map__nodes small {
  color: var(--color-text-secondary);
}
@media (max-width: 640px) {
  .compact-map__filters,
  .compact-map__nodes {
    grid-template-columns: 1fr;
  }
}
</style>
