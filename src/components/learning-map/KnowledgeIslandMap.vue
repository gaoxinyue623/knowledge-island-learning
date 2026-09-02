<script setup lang="ts">
import { computed } from 'vue'

import MapConnection from './MapConnection.vue'
import MapLegend from './MapLegend.vue'
import UnitIsland from './UnitIsland.vue'
import type { KnowledgeMapNode, LearningMapViewModel } from '@/types'

interface Props {
  viewModel: LearningMapViewModel
  selectedNodeId?: string | null
}

const props = withDefaults(defineProps<Props>(), { selectedNodeId: null })

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()

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
      <div>
        <p class="curriculum-eyebrow">Knowledge Island</p>
        <h2 id="knowledge-island-map-title">沿着知识路径探索</h2>
        <p>每座岛是一组学习单元，每个节点代表一个知识点。完成前置知识，新的路径就会亮起来。</p>
      </div>
      <MapLegend />
    </div>
    <div class="learning-map__canvas-wrap">
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
          :selected-node-id="props.selectedNodeId"
          @select-node="emit('selectNode', $event)"
        />
      </div>
    </div>
  </section>
</template>
