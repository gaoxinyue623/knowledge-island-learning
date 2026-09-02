<script setup lang="ts">
import type { KnowledgeMapNode, LearningMapConnection } from '@/types'

interface Props {
  connection: LearningMapConnection
  fromNode: KnowledgeMapNode
  toNode: KnowledgeMapNode
}

const props = defineProps<Props>()

function path() {
  const from = props.fromNode.position
  const to = props.toNode.position
  const deltaX = to.x - from.x
  const curve = Math.max(46, Math.abs(deltaX) * 0.32)
  return `M ${from.x} ${from.y} C ${from.x + curve} ${from.y}, ${to.x - curve} ${to.y}, ${to.x} ${to.y}`
}
</script>

<template>
  <path
    class="map-connection"
    :class="`map-connection--${props.connection.status}`"
    :d="path()"
    fill="none"
    vector-effect="non-scaling-stroke"
    :aria-label="`${props.connection.relationType} 连接`"
  />
</template>
