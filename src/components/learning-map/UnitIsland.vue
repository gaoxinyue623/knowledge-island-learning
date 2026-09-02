<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

import LessonRegion from './LessonRegion.vue'
import type { LearningMapSize, UnitIsland } from '@/types'

interface Props {
  island: UnitIsland
  canvasSize: LearningMapSize
  selectedNodeId?: string | null
}

const props = withDefaults(defineProps<Props>(), { selectedNodeId: null })

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()

function islandStyle() {
  return {
    left: `${(props.island.position.x / props.canvasSize.width) * 100}%`,
    top: `${(props.island.position.y / props.canvasSize.height) * 100}%`,
    width: `${(props.island.size.width / props.canvasSize.width) * 100}%`,
    height: `${(props.island.size.height / props.canvasSize.height) * 100}%`,
  }
}
</script>

<template>
  <section
    class="unit-island"
    :class="`unit-island--${props.island.theme.biome}`"
    :style="islandStyle()"
    :aria-label="`${props.island.title}知识岛`"
  >
    <div class="unit-island__glow" aria-hidden="true" />
    <div class="unit-island__landmark" aria-hidden="true">
      <span class="unit-island__landmark-roof" />
      <span class="unit-island__landmark-body" />
    </div>
    <header class="unit-island__header">
      <div>
        <p class="unit-island__eyebrow">知识岛 {{ props.island.sort }}</p>
        <h2>{{ props.island.title }}</h2>
        <p v-if="props.island.subtitle">{{ props.island.subtitle }}</p>
      </div>
      <div class="unit-island__summary">
        <strong>{{ props.island.progress }}%</strong>
        <span>{{ props.island.lessons.length }} 个区域</span>
      </div>
    </header>
    <div class="unit-island__lessons">
      <LessonRegion
        v-for="lesson in props.island.lessons"
        :key="lesson.id"
        :lesson="lesson"
        :island="props.island"
        :canvas-size="props.canvasSize"
        :selected-node-id="props.selectedNodeId"
        @select-node="emit('selectNode', $event)"
      />
    </div>
    <span class="unit-island__badge">
      <AppIcon name="route" :size="14" decorative />
      {{ props.island.status === 'locked' ? '等待解锁' : '探索中' }}
    </span>
  </section>
</template>
